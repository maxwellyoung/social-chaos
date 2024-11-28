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
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

// Import prompts
import prompts from "../assets/prompts/prompts.json";

type Player = {
  name: string;
  avatar: string;
};

type GameMode = "normal" | "sexy";

interface GameSettings {
  isSexyMode: boolean;
  usedPrompts: Set<string>;
  playerPromptHistory: Map<string, Set<string>>;
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

  // Then the selectNextPrompt function
  const selectNextPrompt = useCallback((): string => {
    const currentPrompts = gameSettings.isSexyMode
      ? allPrompts.sexy
      : allPrompts.normal;

    // Filter prompts that haven't been used with any mentioned players
    const availablePrompts = currentPrompts.filter((prompt) => {
      // Check if prompt has been used globally
      if (gameSettings.usedPrompts.has(prompt.text)) return false;

      // Check if prompt has been used with specific players
      const promptText = prompt.text;
      if (
        promptText.includes("{player1}") ||
        promptText.includes("{player2}")
      ) {
        // Check each player's history
        for (const player of players) {
          const playerHistory = gameSettings.playerPromptHistory.get(
            player.name
          );
          if (playerHistory?.has(promptText)) return false;
        }
      }
      return true;
    });

    // If no available prompts, reset histories
    if (availablePrompts.length === 0) {
      gameSettings.usedPrompts.clear();
      gameSettings.playerPromptHistory.clear();
      return selectNextPrompt();
    }

    const selectedPrompt =
      availablePrompts[Math.floor(Math.random() * availablePrompts.length)];

    // Mark prompt as used globally
    gameSettings.usedPrompts.add(selectedPrompt.text);

    // Format prompt and track per player
    const formattedPrompt = formatPromptWithPlayers(selectedPrompt.text);

    // Update player histories
    players.forEach((player) => {
      if (formattedPrompt.includes(player.name)) {
        const playerHistory =
          gameSettings.playerPromptHistory.get(player.name) || new Set();
        playerHistory.add(selectedPrompt.text);
        gameSettings.playerPromptHistory.set(player.name, playerHistory);
      }
    });

    return formattedPrompt;
  }, [gameSettings, players, formatPromptWithPlayers]);

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
    // Update prompts first
    const newNextPrompt = selectNextPrompt();
    setCurrentPrompt(nextPrompt);
    setNextPrompt(newNextPrompt);

    // Reset positions immediately
    translateX.value = 0;
    translateY.value = 0;
    cardRotation.value = 0;
    cardScale.value = 1;
    cardOpacity.value = 1;
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

  // Start the game
  const startGame = () => {
    if (players.length < 2) {
      Alert.alert("Error", "Please add at least 2 players to start the game.");
      return;
    }
    animateGameStateTransition(true);
    setTimeout(() => setGameState("playing"), 200); // Increased delay
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

  // Render Setup Screen Content
  const renderSetupContent = () => (
    <View style={styles.setupContainer}>
      <LinearGradient
        colors={["#FF3B30", "#FF2D55"]}
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
          SOCIAL CHAOS
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
            onPress={() =>
              setGameSettings((prev) => ({
                ...prev,
                isSexyMode: !prev.isSexyMode,
              }))
            }
          >
            <ThemedText style={styles.modeToggleText}>
              {gameSettings.isSexyMode ? "💋 Sexy Mode" : "🥂 Normal Mode"}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.setupButton}>
            <Button title="Start Game" onPress={startGame} variant="accent" />
          </View>
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
      </View>
    </View>
  );

  const isDark = colorScheme === "dark";

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        safeArea: {
          flex: 1,
        },
        setupContainer: {
          flex: 1,
          position: "relative",
          width: "100%",
        },
        title: {
          fontSize: 56,
          fontWeight: "800",
          textAlign: "center",
          lineHeight: 60,
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 20,
          textShadowColor: "rgba(0, 0, 0, 0.15)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 1,
        },
        setupControls: {
          width: "100%",
          gap: 16,
          alignSelf: "center",
          marginBottom: 20,
        },
        playerList: {
          width: "100%",
          flexGrow: 1,
          marginTop: 20,
        },
        dialogTitle: {
          fontSize: 28,
          marginTop: 48,
          fontWeight: "600",
          marginBottom: 32,
          textAlign: "center",
          color: isDark ? "#fff" : "#000",
        },
        playerItem: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginBottom: 8,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
        },
        playerName: {
          fontSize: 18,
          color: "#fff",
          fontWeight: "600",
        },
        playingContainer: {
          flex: 1,
          paddingVertical: 16,
          justifyContent: "space-between",
          backgroundColor: isDark ? "#000" : "#fff",
        },
        cardWrapper: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: isDark ? "#1c1c1e" : "#fff",
          borderRadius: 15,
          margin: 10,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        },
        promptText: {
          fontSize: 24,
          textAlign: "center",
          marginBottom: 20,
          color: isDark ? "#fff" : "#000",
        },
        promptContainer: {
          width: SCREEN_WIDTH - 40,
          minHeight: 200,
          backgroundColor: isDark
            ? "rgba(28, 28, 30, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
          borderRadius: 20,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 5,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        },
        prompt: {
          fontSize: 32,
          fontWeight: "700",
          textAlign: "center",
          color: isDark ? "#fff" : "#000",
          textShadowColor: "rgba(0, 0, 0, 0.1)",
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        },
        gradientBackground: {
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          width: "100%",
          opacity: 0.9,
        },
        button: {
          backgroundColor: "rgba(255, 255, 255, 0.25)",
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          marginVertical: 8,
          marginHorizontal: 16,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.4)",
        },
        input: {
          flex: 1,
          height: 48,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 12,
          paddingHorizontal: 16,
          color: isDark ? "#fff" : "#000",
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
        },
        exitButton: {
          padding: 8,
        },
        gameMode: {
          flex: 1,
          textAlign: "center",
          marginRight: 40,
          fontSize: 32,
          color: isDark ? "#fff" : "#000",
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
          backgroundColor: "rgba(255, 255, 255, 0.25)",
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
          color: "#fff",
          fontSize: 18,
          fontWeight: "600",
          textShadowColor: "rgba(0, 0, 0, 0.15)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 1,
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
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          overflow: "hidden",
        },
        nextButton: {
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(0, 0, 0, 0.1)",
        },
        nextButtonText: {
          fontSize: 18,
          fontWeight: "600",
          color: isDark ? "#FFFFFF" : "#000000",
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
        currentCard: {
          zIndex: 2,
          width: "100%",
          position: "absolute",
        },
        nextCard: {
          zIndex: 1,
          width: "100%",
          position: "absolute",
          transform: [{ scale: 0.95 }, { translateY: 10 }],
          opacity: 0.8,
        },
        addPlayerForm: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 24,
          gap: 12,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: 8,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.2)",
        },
        modeToggle: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.2)",
        },
        modeToggleActive: {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        },
        modeToggleText: {
          fontSize: 18,
          fontWeight: "600",
          color: "#fff",
        },
      }),
    [isDark, colorScheme, gameSettings.isSexyMode]
  );

  // Gesture Handler for Swiping
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      "worklet";
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      cardRotation.value = (event.translationX / SCREEN_WIDTH) * 30;
    })
    .onEnd((event) => {
      "worklet";
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 1 : -1;
        // Swipe card away with animation
        translateX.value = withSpring(
          direction * SCREEN_WIDTH * 1.5,
          {
            velocity: event.velocityX,
            stiffness: 100,
            damping: 10,
          },
          (finished) => {
            if (finished) {
              runOnJS(handleSwipeSuccess)();
            }
          }
        );

        // Add vertical movement and rotation
        translateY.value = withSpring(direction * 100, {
          velocity: event.velocityY,
          stiffness: 100,
          damping: 10,
        });
        cardRotation.value = withSpring(direction * 45, {
          stiffness: 100,
          damping: 10,
        });
      } else {
        // Reset position if swipe wasn't far enough
        translateX.value = withSpring(0, {
          velocity: event.velocityX,
          stiffness: 200,
          damping: 15,
        });
        translateY.value = withSpring(0, {
          velocity: event.velocityY,
          stiffness: 200,
          damping: 15,
        });
        cardRotation.value = withSpring(0, {
          stiffness: 200,
          damping: 15,
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
          intensity={20}
          tint={isDark ? "dark" : "light"}
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
            intensity={20}
            tint={isDark ? "dark" : "light"}
            style={[styles.promptContainer, styles.currentCard, cardStyle]}
          >
            <ThemedText type="title" style={styles.prompt}>
              {currentPrompt}
            </ThemedText>
          </AnimatedBlurView>
        </GestureDetector>
      </View>

      {/* Clean next button */}
      <BlurView
        intensity={20}
        tint={isDark ? "dark" : "light"}
        style={styles.nextButtonContainer}
      >
        <TouchableOpacity onPress={handleSwipeSuccess}>
          <Animated.View style={[styles.nextButton, buttonAnimatedStyle]}>
            <ThemedText style={styles.nextButtonText}>Next</ThemedText>
          </Animated.View>
        </TouchableOpacity>
      </BlurView>
    </GestureHandlerRootView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        {gameState === "setup" ? (
          <Animated.View style={[styles.setupContainer, styles.setupContainer]}>
            {renderSetupContent()}
          </Animated.View>
        ) : (
          <Animated.View
            style={[styles.playingContainer, styles.playingContainer]}
          >
            {renderPlayingContent()}
          </Animated.View>
        )}
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
            value={newPlayerName}
            onChangeText={setNewPlayerName}
            placeholder="Enter player name"
            style={styles.input}
            placeholderTextColor={
              colorScheme === "dark" ? "#8E8E93" : "#8E8E93"
            }
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
