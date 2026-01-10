import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Dimensions,
  Text,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Button } from "./Button";
import { Select } from "./Select";
import { SlideDownPanel } from "./SlideDownPanel";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  useSharedValue,
  runOnJS,
  Extrapolate,
  interpolateColor,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";

// Import prompts
import prompts from "../assets/prompts/prompts.json";

type Player = {
  name: string;
  avatar: string;
};

type GameMode = "normal" | "sexy";

interface PromptTemplate {
  text: string;
  minChaos: number;
  maxChaos: number;
  category: "social" | "drinking" | "action" | "dare" | "sexy";
  weight: number;
  sexyModeOnly?: boolean;
}

interface GameSettings {
  isSexyMode: boolean;
  usedPrompts: Set<string>;
  playerPromptHistory: Map<string, Set<string>>;
  chaosLevel: number;
  lastPrompts: string[]; // Track recent prompts to avoid repetition
}

// Add new types for enhanced prompts
interface EnhancedPrompt {
  text: string;
  type: "single-player" | "call-response" | "conditional";
  category: "drinking" | "action" | "social";
}

type Prompts = {
  normal: EnhancedPrompt[];
  sexy: EnhancedPrompt[];
};

const allPrompts = prompts as Prompts;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MAX_WIDTH_WEB = 720;
const MAX_WIDTH_PROMPT_WEB = 560;

// Color themes for different modes
const COLORS = {
  normal: {
    primary: ["#667eea", "#764ba2"] as const,
    secondary: ["#f093fb", "#f5576c"] as const,
    accent: "#818CF8",
    card: ["#1a1a2e", "#16213e"] as const,
  },
  sexy: {
    primary: ["#ff416c", "#ff4b2b"] as const,
    secondary: ["#f953c6", "#b91d73"] as const,
    accent: "#F472B6",
    card: ["#2d1f3d", "#1a1a2e"] as const,
  },
};

// Emoji avatars for players
const PLAYER_EMOJIS = ["😎", "🔥", "💀", "👻", "🎃", "🦊", "🐸", "🌚", "🤠", "🥳", "😈", "🤡", "👽", "🤖", "💩"];

export function PersonalizedPartyGame() {
  // State Variables
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameState, setGameState] = useState<"setup" | "playing">("setup");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [nextPrompt, setNextPrompt] = useState("");
  const [promptCount, setPromptCount] = useState(0);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    isSexyMode: false,
    usedPrompts: new Set(),
    playerPromptHistory: new Map(),
    chaosLevel: 0.5,
    lastPrompts: [],
  });
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const colorScheme = useColorScheme();
  const promptsRef = useRef<EnhancedPrompt[]>([]);
  const isInitialMount = useRef(true);

  // Animation Values
  const buttonScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const swipeHintOpacity = useSharedValue(1);
  const nextCardScale = useSharedValue(0.92);
  const nextCardOpacity = useSharedValue(0.4);
  const pulseAnim = useSharedValue(1);

  // Get current theme colors
  const themeColors = gameSettings.isSexyMode ? COLORS.sexy : COLORS.normal;

  // Swipe hint animation
  useEffect(() => {
    if (showSwipeHint && gameState === "playing") {
      swipeHintOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [showSwipeHint, gameState]);

  // Pulse animation for next button
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  // Button Press Animation
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const swipeHintStyle = useAnimatedStyle(() => ({
    opacity: swipeHintOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // Utility Functions

  // Get a random player, optionally excluding one player
  const getRandomPlayer = useCallback(
    (excludePlayer?: string): string => {
      const availablePlayers = players.filter((p) => p.name !== excludePlayer);
      if (availablePlayers.length === 0) return "another player";
      return availablePlayers[
        Math.floor(Math.random() * availablePlayers.length)
      ].name;
    },
    [players]
  );

  // Replace placeholders with random players
  const replacePlaceholders = useCallback(
    (prompt: string): string => {
      if (players.length === 0) return prompt;

      let modifiedPrompt = prompt;
      const player1 = players[Math.floor(Math.random() * players.length)].name;
      modifiedPrompt = modifiedPrompt.replace("{player1}", player1);
      const player2 = getRandomPlayer(player1);
      modifiedPrompt = modifiedPrompt.replace("{player2}", player2);

      return modifiedPrompt;
    },
    [players, getRandomPlayer]
  );

  // Initialize or reset prompts
  const initializePrompts = useCallback(() => {
    const currentPrompts = gameSettings.isSexyMode
      ? allPrompts.sexy
      : allPrompts.normal;
    if (currentPrompts && currentPrompts.length > 0) {
      promptsRef.current = [...currentPrompts].sort(() => Math.random() - 0.5);
    } else {
      promptsRef.current = [
        {
          text: "No prompts available. Add more prompts in your JSON files.",
          type: "single-player",
          category: "social",
        },
      ];
      console.warn(
        `No prompts found for ${
          gameSettings.isSexyMode ? "sexy" : "normal"
        } mode.`
      );
    }
  }, [gameSettings.isSexyMode]);

  // Move this function up, before selectNextPrompt
  const formatPromptWithPlayers = useCallback(
    (promptText: string): string => {
      let formattedText = promptText;

      if (players.length === 0) return formattedText;

      if (
        formattedText.includes("{player1}") &&
        formattedText.includes("{player2}")
      ) {
        const player1 = players[Math.floor(Math.random() * players.length)];
        let player2;
        do {
          player2 = players[Math.floor(Math.random() * players.length)];
        } while (player2.name === player1.name && players.length > 1);

        formattedText = formattedText
          .replace(/\{player1\}/g, player1.name)
          .replace(/\{player2\}/g, player2.name);
      } else if (formattedText.includes("{player1}")) {
        const player = players[Math.floor(Math.random() * players.length)];
        formattedText = formattedText.replace(/\{player1\}/g, player.name);
      }

      return formattedText;
    },
    [players]
  );

  // Add the new prompt generation system
  const generateDynamicPrompt = useCallback(() => {
    const { chaosLevel, isSexyMode, lastPrompts } = gameSettings;

    const templates: PromptTemplate[] = [
      // SOCIAL ICEBREAKERS (0-0.3)
      {
        text: "Everyone point to who's most likely to {action}",
        minChaos: 0,
        maxChaos: 0.3,
        category: "social",
        weight: 1,
      },
      {
        text: "{player1}, what's your first impression of {player2}?",
        minChaos: 0,
        maxChaos: 0.3,
        category: "social",
        weight: 1,
      },
      {
        text: "{player1}, give your best impression of {player2}",
        minChaos: 0.1,
        maxChaos: 0.4,
        category: "social",
        weight: 1,
      },

      // LIGHT DRINKING/ACTION (0.2-0.5)
      {
        text: "Take a sip if you've ever {action}",
        minChaos: 0.2,
        maxChaos: 0.5,
        category: "drinking",
        weight: 1,
      },
      {
        text: "{player1}, demonstrate your best {action} or drink twice",
        minChaos: 0.2,
        maxChaos: 0.5,
        category: "action",
        weight: 1,
      },

      // MEDIUM CHAOS (0.4-0.7)
      {
        text: "{player1}, choose your victim. They must {action} or drink 3 times",
        minChaos: 0.4,
        maxChaos: 0.7,
        category: "dare",
        weight: 1.2,
      },
      {
        text: "Last person to {action} takes three drinks",
        minChaos: 0.4,
        maxChaos: 0.7,
        category: "action",
        weight: 1.2,
      },

      // HIGH CHAOS (0.6-1.0)
      {
        text: "Group decides: {player1} must either {action} or finish their drink",
        minChaos: 0.6,
        maxChaos: 1,
        category: "dare",
        weight: 1.5,
      },
      {
        text: "{player1} and {player2}, swap phones for 2 minutes or take 5 drinks each",
        minChaos: 0.7,
        maxChaos: 1,
        category: "dare",
        weight: 1.5,
      },

      // SEXY MODE TEMPLATES
      {
        text: "{player1}, rate everyone's flirting skills",
        minChaos: 0,
        maxChaos: 0.3,
        category: "sexy",
        weight: 1,
        sexyModeOnly: true,
      },
      {
        text: "Take a sip if you've ever had a crush on someone here",
        minChaos: 0.2,
        maxChaos: 0.5,
        category: "sexy",
        weight: 1,
        sexyModeOnly: true,
      },
    ];

    const actions = {
      social: {
        mild: [
          "become a CEO",
          "start a podcast",
          "become Instagram famous",
          "write a book",
          "win a reality show",
        ],
        medium: [
          "quit their job dramatically",
          "go viral on TikTok",
          "start a flash mob",
          "become a street performer",
        ],
        wild: [
          "become a dictator",
          "fake their own disappearance",
          "start a cult",
          "become a professional prankster",
        ],
      },
      dares: {
        mild: [
          "do 10 pushups",
          "sing a nursery rhyme",
          "tell a dad joke",
          "do your best dance move",
        ],
        medium: [
          "prank call someone",
          "speak in an accent for 3 minutes",
          "let someone post on your social media",
        ],
        wild: [
          "let the group give you a makeover",
          "eat a spoonful of hot sauce",
          "let someone draw on your face",
        ],
      },
    };

    // Filter eligible templates
    const eligibleTemplates = templates.filter(
      (template) =>
        chaosLevel >= template.minChaos &&
        chaosLevel <= template.maxChaos &&
        (!template.sexyModeOnly || isSexyMode) &&
        !lastPrompts.includes(template.text)
    );

    // Weighted random selection
    const totalWeight = eligibleTemplates.reduce(
      (sum, template) => sum + template.weight,
      0
    );
    let random = Math.random() * totalWeight;

    let selectedTemplate = eligibleTemplates[0];
    for (const template of eligibleTemplates) {
      random -= template.weight;
      if (random <= 0) {
        selectedTemplate = template;
        break;
      }
    }

    let prompt = selectedTemplate.text;

    // Replace action placeholder
    if (prompt.includes("{action}")) {
      const actionCategory =
        selectedTemplate.category === "dare" ? "dares" : "social";
      const actionList =
        chaosLevel < 0.3
          ? actions[actionCategory].mild
          : chaosLevel < 0.7
          ? actions[actionCategory].medium
          : actions[actionCategory].wild;

      prompt = prompt.replace(
        "{action}",
        actionList[Math.floor(Math.random() * actionList.length)]
      );
    }

    return prompt;
  }, [gameSettings]);

  // Fix the infinite loop by memoizing selectNextPrompt dependencies
  const selectNextPrompt = useCallback((): string => {
    const newPrompt = generateDynamicPrompt();
    return formatPromptWithPlayers(newPrompt);
  }, [generateDynamicPrompt, formatPromptWithPlayers]);

  // Update the useEffect to properly handle prompt updates
  useEffect(() => {
    if (gameState === "playing") {
      const firstPrompt = selectNextPrompt();
      const secondPrompt = selectNextPrompt();
      setCurrentPrompt(firstPrompt);
      setNextPrompt(secondPrompt);
    }
  }, [gameState, selectNextPrompt]);

  // Initialize prompts when theme changes or game starts
  useEffect(() => {
    if (gameState === "playing") {
      initializePrompts();
      const firstPrompt = selectNextPrompt();
      const secondPrompt = selectNextPrompt();
      setCurrentPrompt(firstPrompt);
      setNextPrompt(secondPrompt);
    }
  }, [gameSettings.isSexyMode, gameState, selectNextPrompt, initializePrompts]);

  // Handle game state changes
  useEffect(() => {
    if (gameState === "playing" && isInitialMount.current) {
      isInitialMount.current = false;
      const firstPrompt = selectNextPrompt();
      const secondPrompt = selectNextPrompt();
      setCurrentPrompt(firstPrompt);
      setNextPrompt(secondPrompt);
    } else if (gameState === "setup") {
      isInitialMount.current = true;
      setCurrentPrompt("");
      setNextPrompt("");
      initializePrompts();
    }
  }, [gameState, selectNextPrompt, initializePrompts, gameSettings.isSexyMode]);

  // Button Press Animation
  const animateButtonPress = useCallback(() => {
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  }, []);

  // Handle swiping to next prompt
  const handleSwipeSuccess = useCallback(() => {
    // Only trigger haptics on native platforms
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Hide swipe hint after first swipe
    if (showSwipeHint) {
      setShowSwipeHint(false);
    }

    const newNextPrompt = selectNextPrompt();
    setCurrentPrompt(nextPrompt);
    setNextPrompt(newNextPrompt);
    setPromptCount((prev) => prev + 1);

    // Animate next card coming forward
    nextCardScale.value = withSpring(1, { damping: 20, stiffness: 300 });
    nextCardOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });

    // Reset positions with a slight delay
    setTimeout(() => {
      translateX.value = 0;
      translateY.value = 0;
      cardRotation.value = 0;
      cardScale.value = withSpring(1, {
        damping: 15,
        stiffness: 100,
      });
      cardOpacity.value = withSpring(1, {
        damping: 15,
        stiffness: 100,
      });
      // Reset next card position
      nextCardScale.value = withTiming(0.92, { duration: 200 });
      nextCardOpacity.value = withTiming(0.4, { duration: 200 });
    }, 50);
  }, [nextPrompt, selectNextPrompt, showSwipeHint]);

  // Add a new player
  const addPlayer = () => {
    if (newPlayerName.trim()) {
      // Pick an emoji not already used
      const usedEmojis = players.map((p) => p.avatar);
      const availableEmojis = PLAYER_EMOJIS.filter((e) => !usedEmojis.includes(e));
      const emoji = availableEmojis.length > 0
        ? availableEmojis[Math.floor(Math.random() * availableEmojis.length)]
        : PLAYER_EMOJIS[Math.floor(Math.random() * PLAYER_EMOJIS.length)];

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setPlayers([
        ...players,
        {
          name: newPlayerName.trim(),
          avatar: emoji,
        },
      ]);
      setNewPlayerName("");
    }
  };

  // Remove a player by index
  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  // Initialize animation values for container transitions
  const gameContainerScale = useSharedValue(0.8); // Start small
  const gameContainerOpacity = useSharedValue(0); // Start hidden
  const setupContainerScale = useSharedValue(1); // Start at normal size
  const setupContainerOpacity = useSharedValue(1); // Start visible

  // Animate game state transitions
  const animateGameStateTransition = useCallback((toPlaying: boolean) => {
    if (toPlaying) {
      // Animate setup container out first
      setupContainerScale.value = withSpring(0.8, {
        damping: 15,
        stiffness: 100,
      });
      setupContainerOpacity.value = withTiming(0, { duration: 200 });

      // Slight delay before animating game container in
      setTimeout(() => {
        gameContainerScale.value = withSpring(1, {
          damping: 15,
          stiffness: 100,
        });
        gameContainerOpacity.value = withTiming(1, { duration: 200 });
      }, 100);
    } else {
      // Animate game container out first
      gameContainerScale.value = withSpring(0.8, {
        damping: 15,
        stiffness: 100,
      });
      gameContainerOpacity.value = withTiming(0, { duration: 200 });

      // Slight delay before animating setup container in
      setTimeout(() => {
        setupContainerScale.value = withSpring(1, {
          damping: 15,
          stiffness: 100,
        });
        setupContainerOpacity.value = withTiming(1, { duration: 200 });
      }, 100);
    }
  }, []);

  // Add new animation value for error shake
  const errorShakeX = useSharedValue(0);

  // Start the game
  const startGame = () => {
    if (players.length < 2) {
      // Error animation
      errorShakeX.value = withSequence(
        withSpring(-10, { stiffness: 500, damping: 10 }),
        withSpring(10, { stiffness: 500, damping: 10 }),
        withSpring(-10, { stiffness: 500, damping: 10 }),
        withSpring(10, { stiffness: 500, damping: 10 }),
        withSpring(0, { stiffness: 500, damping: 10 })
      );

      // Haptic feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert(
        "Not Enough Players",
        "Add at least 2 players to start the game.",
        [{ text: "OK", onPress: () => setIsAddPlayerVisible(true) }]
      );
      return;
    }

    // Reset game state
    setPromptCount(0);
    setShowSwipeHint(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    animateGameStateTransition(true);
    setTimeout(() => setGameState("playing"), 200);
  };

  // Exit the game and return to setup
  const exitGame = () => {
    animateGameStateTransition(false);
    setTimeout(() => setGameState("setup"), 200); // Increased delay
  };

  // Get emoji based on theme
  const getThemeEmoji = (mode: GameMode): string => {
    switch (mode) {
      case "normal":
        return "🥂";
      case "sexy":
        return "💋";
      default:
        return "";
    }
  };

  // Add error animation style
  const errorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: errorShakeX.value }],
    };
  });

  // Render Setup Screen Content
  const renderSetupContent = () => (
    <View style={styles.setupContainer}>
      <LinearGradient
        colors={["#0A0A0A", "#0f0f23", "#1a1a2e"]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView
        style={styles.setupScrollView}
        contentContainerStyle={styles.setupScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={themeColors.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoEmoji}>
              {gameSettings.isSexyMode ? "🔥" : "🎲"}
            </Text>
          </LinearGradient>
          <Text style={styles.title}>GAMBIT</Text>
          <Text style={styles.subtitle}>The party game that goes there</Text>
        </View>

        {/* Players Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Players</Text>
            <TouchableOpacity
              style={styles.addPlayerButton}
              onPress={() => setIsAddPlayerVisible(true)}
            >
              <LinearGradient
                colors={themeColors.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addPlayerGradient}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addPlayerText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {players.length === 0 ? (
            <View style={styles.emptyPlayers}>
              <Text style={styles.emptyPlayersText}>
                Add at least 2 players to start
              </Text>
            </View>
          ) : (
            <View style={styles.playersGrid}>
              {players.map((player, index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.delay(index * 50)}
                  style={styles.playerChip}
                >
                  <Text style={styles.playerEmoji}>{player.avatar}</Text>
                  <Text style={styles.playerChipName} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      removePlayer(index);
                    }}
                    style={styles.removePlayerButton}
                  >
                    <Ionicons name="close" size={14} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        {/* Game Mode Toggle */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Mode</Text>
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                !gameSettings.isSexyMode && styles.modeOptionActive,
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setGameSettings((prev) => ({ ...prev, isSexyMode: false }));
              }}
            >
              {!gameSettings.isSexyMode && (
                <LinearGradient
                  colors={COLORS.normal.primary}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <Text style={styles.modeEmoji}>🥂</Text>
              <Text style={[
                styles.modeText,
                !gameSettings.isSexyMode && styles.modeTextActive
              ]}>Classic</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeOption,
                gameSettings.isSexyMode && styles.modeOptionActive,
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setGameSettings((prev) => ({ ...prev, isSexyMode: true }));
              }}
            >
              {gameSettings.isSexyMode && (
                <LinearGradient
                  colors={COLORS.sexy.primary}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <Text style={styles.modeEmoji}>🔥</Text>
              <Text style={[
                styles.modeText,
                gameSettings.isSexyMode && styles.modeTextActive
              ]}>Spicy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chaos Level */}
        <View style={styles.sectionContainer}>
          <View style={styles.chaosHeader}>
            <Text style={styles.sectionTitle}>Chaos Level</Text>
            <View style={styles.chaosValueBadge}>
              <Text style={styles.chaosValue}>
                {Math.round(gameSettings.chaosLevel * 100)}%
              </Text>
            </View>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>😇</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={gameSettings.chaosLevel}
              onValueChange={(value) =>
                setGameSettings((prev) => ({ ...prev, chaosLevel: value }))
              }
              minimumTrackTintColor={themeColors.accent}
              maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
              thumbTintColor={themeColors.accent}
            />
            <Text style={styles.sliderLabel}>😈</Text>
          </View>
          <View style={styles.chaosLevelLabels}>
            <Text style={styles.chaosLevelText}>Tame</Text>
            <Text style={styles.chaosLevelText}>Unhinged</Text>
          </View>
        </View>

        {/* Start Button */}
        <Animated.View style={[styles.startButtonContainer, errorAnimatedStyle]}>
          <TouchableOpacity
            onPress={startGame}
            activeOpacity={0.9}
            disabled={players.length < 2}
          >
            <LinearGradient
              colors={players.length < 2 ? ["#333", "#222"] : themeColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.startButton,
                players.length < 2 && styles.startButtonDisabled,
              ]}
            >
              <Text style={styles.startButtonText}>
                {players.length < 2
                  ? `Need ${2 - players.length} more player${players.length === 1 ? "" : "s"}`
                  : "Let's Go! 🚀"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  const isDark = colorScheme === "dark";

  // Styles
  const styles = StyleSheet.create({
    // Base containers
    safeArea: {
      flex: 1,
      backgroundColor: "#0A0A0A",
    },
    container: {
      flex: 1,
      backgroundColor: "#0A0A0A",
    },
    contentContainer: {
      flex: 1,
      width: "100%",
      maxWidth: Platform.OS === "web" ? MAX_WIDTH_WEB : "100%",
      alignSelf: "center",
    },
    gradientBackground: {
      ...StyleSheet.absoluteFillObject,
    },

    // Setup Screen
    setupContainer: {
      flex: 1,
      width: "100%",
    },
    setupScrollView: {
      flex: 1,
    },
    setupScrollContent: {
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "web" ? 60 : 40,
      paddingBottom: 40,
    },

    // Logo Section
    logoSection: {
      alignItems: "center",
      marginBottom: 40,
    },
    logoGradient: {
      width: 80,
      height: 80,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    logoEmoji: {
      fontSize: 40,
    },
    title: {
      fontSize: Platform.OS === "web" ? 56 : 48,
      fontWeight: "800",
      color: "#FFFFFF",
      letterSpacing: -2,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.5)",
      fontWeight: "500",
    },

    // Section styles
    sectionContainer: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: -0.3,
    },

    // Player Section
    addPlayerButton: {
      borderRadius: 12,
      overflow: "hidden",
    },
    addPlayerGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 6,
    },
    addPlayerText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    emptyPlayers: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: 16,
      padding: 32,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      borderStyle: "dashed",
    },
    emptyPlayersText: {
      color: "rgba(255, 255, 255, 0.4)",
      fontSize: 14,
      fontWeight: "500",
    },
    playersGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    playerChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 24,
      paddingLeft: 6,
      paddingRight: 10,
      paddingVertical: 6,
      gap: 8,
    },
    playerEmoji: {
      fontSize: 24,
      width: 32,
      height: 32,
      textAlign: "center",
      lineHeight: 32,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 16,
      overflow: "hidden",
    },
    playerChipName: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
      maxWidth: 80,
    },
    removePlayerButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },

    // Mode Toggle
    modeContainer: {
      flexDirection: "row",
      gap: 12,
    },
    modeOption: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      overflow: "hidden",
    },
    modeOptionActive: {
      borderColor: "transparent",
    },
    modeEmoji: {
      fontSize: 32,
      marginBottom: 8,
    },
    modeText: {
      color: "rgba(255, 255, 255, 0.5)",
      fontSize: 14,
      fontWeight: "600",
    },
    modeTextActive: {
      color: "#FFFFFF",
    },

    // Chaos Slider
    chaosHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    chaosValueBadge: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    chaosValue: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    sliderContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    sliderLabel: {
      fontSize: 24,
    },
    slider: {
      flex: 1,
      height: 40,
    },
    chaosLevelLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 40,
      marginTop: 4,
    },
    chaosLevelText: {
      color: "rgba(255, 255, 255, 0.4)",
      fontSize: 12,
      fontWeight: "500",
    },

    // Start Button
    startButtonContainer: {
      marginTop: 12,
    },
    startButton: {
      paddingVertical: 20,
      borderRadius: 16,
      alignItems: "center",
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    startButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    },

    // Playing Screen
    playingContainer: {
      flex: 1,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    exitButton: {
      borderRadius: 20,
      overflow: "hidden",
    },
    exitButtonBlur: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    promptCounter: {
      color: "rgba(255, 255, 255, 0.5)",
      fontSize: 16,
      fontWeight: "700",
    },
    headerRight: {
      width: 40,
      alignItems: "flex-end",
    },
    modeIndicator: {
      fontSize: 24,
    },

    // Cards
    cardsContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    promptContainer: {
      width: "100%",
      maxWidth: Platform.OS === "web" ? MAX_WIDTH_PROMPT_WEB : "100%",
      aspectRatio: Platform.OS === "web" ? 1.6 : 1.3,
      borderRadius: 28,
      padding: 28,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    cardGlow: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.15,
    },
    prompt: {
      textAlign: "center",
      fontSize: Platform.OS === "web" ? 26 : 22,
      lineHeight: Platform.OS === "web" ? 38 : 32,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: -0.3,
    },
    currentCard: {
      zIndex: 2,
      width: "100%",
      position: "absolute",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.4,
      shadowRadius: 30,
      elevation: 20,
    },
    nextCard: {
      zIndex: 1,
      width: "100%",
      position: "absolute",
    },

    // Swipe Hint
    swipeHint: {
      position: "absolute",
      bottom: -50,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    swipeHintText: {
      color: "rgba(255, 255, 255, 0.5)",
      fontSize: 14,
      fontWeight: "500",
    },

    // Player chips in game
    playerChipsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    playingPlayerChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      gap: 6,
    },
    playingPlayerEmoji: {
      fontSize: 16,
    },
    playingPlayerName: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 12,
      fontWeight: "600",
      maxWidth: 60,
    },

    // Next Button
    nextButtonContainer: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "web" ? 40 : 24,
    },
    nextButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      borderRadius: 16,
      gap: 8,
    },
    nextButtonText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
    },

    // Add Player Panel
    dialogTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#000000",
      marginBottom: 24,
      textAlign: "center",
    },
    addPlayerForm: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      gap: 12,
    },
    input: Platform.select({
      web: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 18,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        color: "#000000",
        fontSize: 16,
        fontWeight: "500",
        outlineWidth: 0,
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.08)",
      },
      default: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 18,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        color: "#000000",
        fontSize: 16,
        fontWeight: "500",
      },
    }) as any,
  });

  // Gesture Handler for Swiping
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (Platform.OS !== "web") {
        runOnJS(Haptics.selectionAsync)();
      }
    })
    .onUpdate((event) => {
      "worklet";
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.2; // Reduced vertical movement
      cardRotation.value = (event.translationX / SCREEN_WIDTH) * 15; // Reduced rotation

      // Scale based on movement
      const progress = Math.abs(event.translationX) / SCREEN_WIDTH;
      cardScale.value = interpolate(
        progress,
        [0, 0.5],
        [1, 0.95],
        Extrapolate.CLAMP
      );
      cardOpacity.value = interpolate(
        Math.abs(event.translationX),
        [0, SCREEN_WIDTH / 2],
        [1, 0.5],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      "worklet";
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withSpring(direction * SCREEN_WIDTH, {
          velocity: event.velocityX,
          stiffness: 100,
          damping: 15,
        });
        translateY.value = withSpring(0, {
          velocity: event.velocityY,
          stiffness: 100,
          damping: 15,
        });
        cardRotation.value = withSpring(direction * 30, {
          stiffness: 100,
          damping: 15,
        });
        cardScale.value = withSpring(0.8, {
          stiffness: 100,
          damping: 15,
        });
        cardOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(handleSwipeSuccess)();
          }
        });
      } else {
        // Return to center with spring animation
        translateX.value = withSpring(0, {
          velocity: event.velocityX,
          stiffness: 200,
          damping: 20,
        });
        translateY.value = withSpring(0, {
          velocity: event.velocityY,
          stiffness: 200,
          damping: 20,
        });
        cardRotation.value = withSpring(0, {
          stiffness: 200,
          damping: 20,
        });
        cardScale.value = withSpring(1, {
          stiffness: 200,
          damping: 20,
        });
        cardOpacity.value = withSpring(1, {
          stiffness: 200,
          damping: 20,
        });
      }
    });

  // Animated Styles for the Current Card
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${cardRotation.value}deg` },
        { scale: cardScale.value },
      ],
      opacity: cardOpacity.value,
    };
  });

  // Animated style for next card
  const nextCardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: nextCardScale.value }],
      opacity: nextCardOpacity.value,
    };
  });

  // Render Playing Screen Content
  const renderPlayingContent = () => (
    <GestureHandlerRootView style={styles.playingContainer}>
      <LinearGradient
        colors={["#0A0A0A", "#0f0f23", "#1a1a2e"]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={exitGame} style={styles.exitButton}>
          <BlurView intensity={30} tint="dark" style={styles.exitButtonBlur}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </BlurView>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.promptCounter}>#{promptCount + 1}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.modeIndicator}>
            {gameSettings.isSexyMode ? "🔥" : "🥂"}
          </Text>
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardsContainer}>
        {/* Next card (shown behind) */}
        <Animated.View style={[styles.nextCard, nextCardAnimatedStyle]}>
          <LinearGradient
            colors={themeColors.card}
            style={styles.promptContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.prompt}>{nextPrompt}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Current card */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.currentCard, cardStyle]}>
            <LinearGradient
              colors={themeColors.card}
              style={styles.promptContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={[...themeColors.primary, "transparent"]}
                style={styles.cardGlow}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
              />
              <Text style={styles.prompt}>{currentPrompt}</Text>
            </LinearGradient>
          </Animated.View>
        </GestureDetector>

        {/* Swipe hint */}
        {showSwipeHint && (
          <Animated.View style={[styles.swipeHint, swipeHintStyle]}>
            <Ionicons name="swap-horizontal" size={24} color="rgba(255,255,255,0.5)" />
            <Text style={styles.swipeHintText}>Swipe for next</Text>
          </Animated.View>
        )}
      </View>

      {/* Player chips */}
      <View style={styles.playerChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {players.map((player, index) => (
            <View key={index} style={styles.playingPlayerChip}>
              <Text style={styles.playingPlayerEmoji}>{player.avatar}</Text>
              <Text style={styles.playingPlayerName} numberOfLines={1}>
                {player.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Next button */}
      <Animated.View style={[styles.nextButtonContainer, pulseStyle]}>
        <TouchableOpacity onPress={handleSwipeSuccess} activeOpacity={0.9}>
          <LinearGradient
            colors={themeColors.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </GestureHandlerRootView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        <View style={styles.contentContainer}>
          {gameState === "setup" ? (
            <Animated.View style={[styles.setupContainer]}>
              {renderSetupContent()}
            </Animated.View>
          ) : (
            <Animated.View style={[styles.playingContainer]}>
              {renderPlayingContent()}
            </Animated.View>
          )}
        </View>
      </ThemedView>
      <SlideDownPanel
        isVisible={isAddPlayerVisible}
        onClose={() => setIsAddPlayerVisible(false)}
      >
        <ThemedText type="subtitle" style={styles.dialogTitle}>
          Add Players
        </ThemedText>
        <View style={styles.addPlayerForm}>
          <TextInput
            style={[
              styles.input,
              {
                fontSize: 16,
                fontWeight: "500",
              },
            ]}
            value={newPlayerName}
            onChangeText={setNewPlayerName}
            placeholder="Enter player name"
            placeholderTextColor="rgba(0, 0, 0, 0.5)"
            returnKeyType="done"
            onSubmitEditing={addPlayer}
            autoCorrect={false}
            autoCapitalize="words"
          />
          <Button title="Add" onPress={addPlayer} variant="accent" />
        </View>
        <Button
          title="Done"
          onPress={() => setIsAddPlayerVisible(false)}
          variant="default"
        />
      </SlideDownPanel>
    </SafeAreaView>
  );
}
