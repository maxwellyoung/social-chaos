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
  interpolate,
  useSharedValue,
  runOnJS,
  Extrapolate,
  interpolateColor,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const MAX_WIDTH_WEB = 720;
const MAX_WIDTH_PROMPT_WEB = 560;

export function PersonalizedPartyGame() {
  // State Variables
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameState, setGameState] = useState<"setup" | "playing">("setup");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [nextPrompt, setNextPrompt] = useState("");
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    isSexyMode: false,
    usedPrompts: new Set(),
    playerPromptHistory: new Map(),
    chaosLevel: 0.5,
    lastPrompts: [],
  });
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);

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

  // Button Press Animation
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
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

    const newNextPrompt = selectNextPrompt();
    setCurrentPrompt(nextPrompt);
    setNextPrompt(newNextPrompt);

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
    }, 50);
  }, [nextPrompt, selectNextPrompt]);

  // Add a new player
  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const avatarSeed = Math.floor(Math.random() * 1000);
      setPlayers([
        ...players,
        {
          name: newPlayerName.trim(),
          avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`,
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
        colors={["#0A0A0A", "#141414"]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.setupContentContainer}>
        <ThemedText
          type="title"
          style={styles.title}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          GAMBIT
        </ThemedText>
        <View style={styles.setupControls}>
          <View style={styles.setupButton}>
            <Button
              title="Add Players"
              onPress={() => setIsAddPlayerVisible(true)}
              variant="accent"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.modeToggle,
              gameSettings.isSexyMode && styles.modeToggleActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setGameSettings((prev) => ({
                ...prev,
                isSexyMode: !prev.isSexyMode,
              }));
            }}
          >
            <ThemedText style={styles.modeToggleText}>
              {gameSettings.isSexyMode ? "💋 Sexy Mode" : "🥂 Normal Mode"}
            </ThemedText>
          </TouchableOpacity>
          <Animated.View style={[styles.setupButton, errorAnimatedStyle]}>
            <Button
              title={
                players.length < 2
                  ? `Add ${2 - players.length} More Player${
                      players.length === 1 ? "" : "s"
                    }`
                  : "Start Game"
              }
              onPress={startGame}
              variant="accent"
            />
          </Animated.View>
        </View>
        <FlatList
          data={players}
          renderItem={({ item, index }) => (
            <BlurView
              intensity={20}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={styles.playerItem}
            >
              <ThemedText style={styles.playerName}>{item.name}</ThemedText>
              <TouchableOpacity onPress={() => removePlayer(index)}>
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color="rgba(255, 255, 255, 0.8)"
                />
              </TouchableOpacity>
            </BlurView>
          )}
          keyExtractor={(item, index) => index.toString()}
          ListFooterComponent={<View style={{ height: 20 }} />}
          contentContainerStyle={styles.playerList}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.chaosSliderContainer}>
          <ThemedText style={styles.chaosLabel}>
            🎲 Chaos Level: {Math.round(gameSettings.chaosLevel * 100)}%
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={gameSettings.chaosLevel}
            onValueChange={(value) =>
              setGameSettings((prev) => ({ ...prev, chaosLevel: value }))
            }
            minimumTrackTintColor="#818CF8"
            maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
            thumbTintColor={interpolateColor(
              gameSettings.chaosLevel,
              [0, 1],
              ["#818CF8", "#6366F1"]
            )}
          />
          <View style={styles.chaosLevelLabels}>
            <ThemedText style={[styles.chaosLevelText]}>Mild</ThemedText>
            <ThemedText style={[styles.chaosLevelText]}>Wild</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const isDark = colorScheme === "dark";

  // Styles
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#141414",
    },
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#141414",
    },
    contentContainer: {
      flex: 1,
      width: "100%",
      maxWidth: Platform.OS === "web" ? MAX_WIDTH_WEB : "100%",
      alignSelf: "center",
    },
    setupContainer: {
      flex: 1,
      width: "100%",
      padding: Platform.OS === "web" ? 40 : 20,
    },
    playingContainer: {
      flex: 1,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    cardsContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      position: "relative",
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    promptContainer: {
      width: "100%",
      maxWidth: Platform.OS === "web" ? MAX_WIDTH_PROMPT_WEB : "100%",
      aspectRatio: Platform.OS === "web" ? 1.8 : 1.4,
      borderRadius: 24,
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: "#111111",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 30,
      elevation: 20,
    },
    prompt: {
      textAlign: "center",
      fontSize: Platform.OS === "web" ? 32 : 28,
      lineHeight: Platform.OS === "web" ? 44 : 36,
      fontFamily: Platform.select({
        ios: "Inter-Bold",
        android: "Inter-Bold",
        default:
          "Inter-Bold, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      color: "#FFFFFF",
      letterSpacing: -0.2,
    },
    title: {
      fontSize: Platform.OS === "web" ? 96 : 72,
      fontFamily: Platform.select({
        ios: "Inter-Light",
        android: "Inter-Light",
        default:
          "Inter-Light, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      textAlign: "center",
      lineHeight: Platform.OS === "web" ? 100 : 80,
      color: "#FFFFFF",
      textTransform: "uppercase",
      letterSpacing: Platform.OS === "web" ? -2 : -1,
      marginBottom: 60,
    },
    setupControls: {
      width: "100%",
      gap: 16,
      alignSelf: "center",
      marginBottom: 32,
    },
    playerList: {
      width: "100%",
      flexGrow: 1,
      marginTop: 20,
    },
    dialogTitle: {
      fontSize: 24,
      fontFamily: Platform.select({
        ios: "Inter-Bold",
        android: "Inter-Bold",
        default:
          "Inter-Bold, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      marginBottom: 32,
      textAlign: "center",
      color: "#000000",
      letterSpacing: -0.2,
    },
    playerItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 12,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    playerName: {
      fontSize: 16,
      fontFamily: Platform.select({
        ios: "Inter-Medium",
        android: "Inter-Medium",
        default:
          "Inter-Medium, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      color: "#FFFFFF",
      letterSpacing: 0.2,
    },
    gradientBackground: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      opacity: 0.2, // More subtle gradient
    },
    button: {
      backgroundColor: "rgba(32, 32, 32, 0.8)",
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 8,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    input: Platform.select({
      web: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 20,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        color: "#000000",
        fontSize: 16,
        fontFamily:
          "Inter-Regular, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        letterSpacing: 0.2,
        outlineWidth: 0,
        outlineStyle: "none",
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.1)",
        userSelect: "text" as const,
        WebkitUserSelect: "text",
        cursor: "text" as const,
        caretColor: "#000000",
      },
      default: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 20,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        color: "#000000",
        fontSize: 16,
        fontFamily: Platform.select({
          ios: "Inter-Regular",
          android: "Inter-Regular",
          default: "Inter-Regular",
        }),
        letterSpacing: 0.2,
      },
    }) as any,
    exitButton: {
      padding: 8,
    },
    gameMode: {
      marginLeft: 8,
    },
    setupContentContainer: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "space-between",
      paddingTop: 40,
      paddingBottom: 20,
      width: "100%",
    },
    setupButton: {
      overflow: "hidden",
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    setupButtonGradient: {
      paddingHorizontal: 2,
      paddingVertical: 2,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    setupSelect: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 16,
      overflow: "hidden",
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontFamily: Platform.select({
        ios: "Inter-Medium",
        android: "Inter-Medium",
        default:
          "Inter-Medium, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      textAlign: "center",
      letterSpacing: 0.2,
    },
    addButton: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    nextButtonContainer: {
      position: "absolute",
      bottom: Platform.OS === "web" ? 40 : 20,
      left: Platform.OS === "web" ? 40 : 20,
      right: Platform.OS === "web" ? 40 : 20,
      borderRadius: 20,
      overflow: "hidden",
    },
    nextButton: {
      paddingVertical: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    nextButtonText: {
      fontSize: 16,
      fontFamily: Platform.select({
        ios: "Inter-Medium",
        android: "Inter-Medium",
        default:
          "Inter-Medium, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      color: "#FFFFFF",
      letterSpacing: 0.2,
    },
    currentCard: {
      zIndex: 2,
      width: "100%",
      position: "absolute",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    nextCard: {
      zIndex: 1,
      width: "100%",
      position: "absolute",
      transform: [{ scale: 0.9 }],
      opacity: 0.5,
    },
    addPlayerForm: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      gap: 12,
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(0, 0, 0, 0.1)",
    },
    modeToggle: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    modeToggleActive: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderColor: "rgba(255, 255, 255, 0.15)",
    },
    modeToggleText: {
      fontSize: 16,
      fontFamily: Platform.select({
        ios: "Inter-Medium",
        android: "Inter-Medium",
        default:
          "Inter-Medium, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      color: "#FFFFFF",
      textAlign: "center",
      letterSpacing: 0.3,
    },
    chaosSliderContainer: {
      width: "100%",
      marginBottom: 32,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      padding: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    chaosLabel: {
      fontSize: 16,
      fontFamily: Platform.select({
        ios: "Inter-Medium",
        android: "Inter-Medium",
        default:
          "Inter-Medium, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      color: "#FFFFFF",
      marginBottom: 16,
      textAlign: "center",
      letterSpacing: 0.2,
    },
    slider: {
      width: "100%",
      height: 40,
    },
    chaosLevelLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: 8,
      marginTop: 8,
    },
    chaosLevelText: {
      fontSize: 14,
      fontFamily: Platform.select({
        ios: "Inter-Regular",
        android: "Inter-Regular",
        default:
          "Inter-Regular, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }),
      color: "#FFFFFF",
      letterSpacing: 0.2,
      opacity: 0.6,
    },
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

  // Render Playing Screen Content
  const renderPlayingContent = () => (
    <GestureHandlerRootView style={styles.playingContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={exitGame} style={styles.exitButton}>
          <Ionicons
            name="close"
            size={24}
            color={isDark ? "#FFFFFF" : "#8E8E93"}
          />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.gameMode}>
          {getThemeEmoji(gameSettings.isSexyMode ? "sexy" : "normal")}
        </ThemedText>
      </View>

      <View style={styles.cardsContainer}>
        {/* Next card (shown behind) */}
        <BlurView
          intensity={40}
          tint="dark"
          style={[styles.promptContainer, styles.nextCard]}
        >
          <ThemedText type="title" style={styles.prompt}>
            {nextPrompt}
          </ThemedText>
        </BlurView>

        {/* Current card */}
        <GestureDetector gesture={panGesture}>
          <AnimatedBlurView
            key={currentPrompt}
            intensity={40}
            tint="dark"
            style={[styles.promptContainer, styles.currentCard, cardStyle]}
          >
            <ThemedText type="title" style={styles.prompt}>
              {currentPrompt}
            </ThemedText>
          </AnimatedBlurView>
        </GestureDetector>
      </View>

      {/* Clean next button */}
      <BlurView intensity={40} tint="dark" style={styles.nextButtonContainer}>
        <Pressable onPress={handleSwipeSuccess}>
          <Animated.View style={[styles.nextButton, buttonAnimatedStyle]}>
            <ThemedText style={styles.nextButtonText}>Next</ThemedText>
          </Animated.View>
        </Pressable>
      </BlurView>
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
