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
  Dimensions,
  Text,
  Platform,
  ScrollView,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SlideDownPanel } from "./SlideDownPanel";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  Easing,
  cancelAnimation,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  BounceIn,
  FadeInUp,
  FadeInDown,
  FadeIn,
  Layout,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { FluidGradient } from "./FluidGradient";

import AsyncStorage from "@react-native-async-storage/async-storage";
import promptData from "../assets/prompts/prompts.json";

// Storage keys
const STORAGE_KEYS = {
  SKIPPED_PROMPTS: "gambit_skipped_prompts",
  FAVORITE_PROMPTS: "gambit_favorite_prompts",
  CUSTOM_PROMPTS: "gambit_custom_prompts",
};

// Types
type Player = {
  name: string;
  avatar: string;
  score: number;
  drinks: number;
  isHotSeat?: boolean;
};

type GameScreen = "setup" | "categories" | "playing" | "results" | "roundEnd" | "hotSeat" | "truthOrDare";
type CategoryKey = "drinking" | "dares" | "confessions" | "hot_takes" | "physical" | "social" | "creative" | "chaos";
type GameMode = "classic" | "hotSeat" | "couples" | "truthOrDare";

interface Prompt {
  text: string;
  category: string;
  chaos: number;
  type: string;
  timer?: number;
}

interface GameState {
  screen: GameScreen;
  round: number;
  totalRounds: number;
  promptsPerRound: number;
  currentPromptIndex: number;
  isSexyMode: boolean;
  chaosLevel: number;
  selectedCategories: CategoryKey[];
  timerActive: boolean;
  timerSeconds: number;
  gameMode: GameMode;
  hotSeatPlayer: Player | null;
  hotSeatQuestionCount: number;
  truthOrDareChoice: "truth" | "dare" | null;
  showScoring: boolean;
}

interface CardItem {
  id: number;
  text: string;
  data: Prompt;
}

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const MAX_WIDTH = 500;

const CATEGORIES: Record<CategoryKey, { name: string; emoji: string; color: string; gradient: [string, string] }> = {
  drinking: { name: "Drinking", emoji: "🍻", color: "#F59E0B", gradient: ["#F59E0B", "#D97706"] },
  dares: { name: "Dares", emoji: "🎯", color: "#EF4444", gradient: ["#EF4444", "#DC2626"] },
  confessions: { name: "Confessions", emoji: "🤫", color: "#A855F7", gradient: ["#A855F7", "#9333EA"] },
  hot_takes: { name: "Hot Takes", emoji: "🔥", color: "#F97316", gradient: ["#F97316", "#EA580C"] },
  physical: { name: "Physical", emoji: "💪", color: "#10B981", gradient: ["#10B981", "#059669"] },
  social: { name: "Social", emoji: "💬", color: "#3B82F6", gradient: ["#3B82F6", "#2563EB"] },
  creative: { name: "Creative", emoji: "🎨", color: "#EC4899", gradient: ["#EC4899", "#DB2777"] },
  chaos: { name: "Chaos", emoji: "🌪️", color: "#8B5CF6", gradient: ["#8B5CF6", "#7C3AED"] },
};

// Haptic helper
const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" | "error") => {
  if (Platform.OS === "web") return;
  switch (type) {
    case "light": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    case "medium": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
    case "heavy": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
    case "success": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
    case "error": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
  }
};

// Confetti Particle
const Particle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));
    translateY.value = withDelay(delay, withTiming(500, { duration: 2500, easing: Easing.out(Easing.quad) }));
    translateX.value = withDelay(delay, withTiming(startX + (Math.random() - 0.5) * 300, { duration: 2500 }));
    rotate.value = withDelay(delay, withTiming(Math.random() * 720 - 360, { duration: 2500 }));
    opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF69B4"];
  return <Animated.Text style={[style, { fontSize: 20, color: colors[Math.floor(Math.random() * colors.length)] }]}>✦</Animated.Text>;
};

const Confetti = ({ count = 40 }: { count?: number }) => {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, delay: Math.random() * 400, startX: Math.random() * SCREEN_WIDTH,
  })), [count]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => <Particle key={p.id} delay={p.delay} startX={p.startX} />)}
    </View>
  );
};

// Swipeable Card Component
const SwipeableCard = ({
  card,
  isTop,
  onSwipe,
  category,
  onSkip,
  onFavorite,
  isFavorite,
}: {
  card: CardItem;
  isTop: boolean;
  onSwipe: () => void;
  category: CategoryKey;
  onSkip?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(isTop ? 1 : 0.92);
  const opacity = useSharedValue(isTop ? 1 : 0.7);

  const cat = CATEGORIES[category] || CATEGORIES.chaos;

  useEffect(() => {
    if (isTop) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(0.92, { damping: 15 });
      opacity.value = withTiming(0.7, { duration: 200 });
    }
  }, [isTop]);

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onStart(() => {
      if (Platform.OS !== "web") runOnJS(Haptics.selectionAsync)();
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
      rotation.value = (e.translationX / SCREEN_WIDTH) * 20;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(dir * SCREEN_WIDTH * 1.5, { duration: 300 });
        rotation.value = withTiming(dir * 30, { duration: 300 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onSwipe)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        rotation.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: isTop ? 2 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.promptCard, cardStyle]}>
        <LinearGradient
          colors={[cat.gradient[0] + "25", "transparent"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cardTopRow}>
          <View style={[styles.promptCatBadge, { backgroundColor: cat.color + "30" }]}>
            <Text style={styles.promptCatText}>{cat.emoji}</Text>
          </View>
          {isTop && (
            <View style={styles.cardActions}>
              {onFavorite && (
                <TouchableOpacity onPress={onFavorite} style={styles.cardActionBtn}>
                  <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#EC4899" : "rgba(255,255,255,0.5)"} />
                </TouchableOpacity>
              )}
              {onSkip && (
                <TouchableOpacity onPress={onSkip} style={styles.cardActionBtn}>
                  <Ionicons name="close-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        <Text style={styles.promptText}>{card.text}</Text>
        <Text style={styles.swipeHint}>← Swipe →</Text>
      </Animated.View>
    </GestureDetector>
  );
};

export function PersonalizedPartyGame() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameStats] = useState({ activeNow: Math.floor(Math.random() * 50) + 60 });

  // Skip/Favorites system
  const [skippedPrompts, setSkippedPrompts] = useState<Set<string>>(new Set());
  const [favoritePrompts, setFavoritePrompts] = useState<Set<string>>(new Set());
  const [customPrompts, setCustomPrompts] = useState<Prompt[]>([]);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [newCustomPrompt, setNewCustomPrompt] = useState("");
  const [selectedCustomCategory, setSelectedCustomCategory] = useState<CategoryKey>("drinking");

  const [gameState, setGameState] = useState<GameState>({
    screen: "setup",
    round: 1,
    totalRounds: 3,
    promptsPerRound: 10,
    currentPromptIndex: 0,
    isSexyMode: false,
    chaosLevel: 5,
    selectedCategories: ["drinking", "social", "dares"],
    timerActive: false,
    timerSeconds: 0,
    gameMode: "classic",
    hotSeatPlayer: null,
    hotSeatQuestionCount: 0,
    truthOrDareChoice: null,
    showScoring: true,
  });

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [skipped, favorites, custom] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SKIPPED_PROMPTS),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_PROMPTS),
          AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_PROMPTS),
        ]);
        if (skipped) setSkippedPrompts(new Set(JSON.parse(skipped)));
        if (favorites) setFavoritePrompts(new Set(JSON.parse(favorites)));
        if (custom) setCustomPrompts(JSON.parse(custom));
      } catch (e) {
        console.log("Error loading saved data:", e);
      }
    };
    loadSavedData();
  }, []);

  // Save functions
  const skipForever = useCallback(async (promptText: string) => {
    triggerHaptic("light");
    const newSkipped = new Set(skippedPrompts).add(promptText);
    setSkippedPrompts(newSkipped);
    await AsyncStorage.setItem(STORAGE_KEYS.SKIPPED_PROMPTS, JSON.stringify([...newSkipped]));
    // Move to next card
    handleSwipe();
  }, [skippedPrompts]);

  const toggleFavorite = useCallback(async (promptText: string) => {
    triggerHaptic("light");
    const newFavorites = new Set(favoritePrompts);
    if (newFavorites.has(promptText)) {
      newFavorites.delete(promptText);
    } else {
      newFavorites.add(promptText);
    }
    setFavoritePrompts(newFavorites);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_PROMPTS, JSON.stringify([...newFavorites]));
  }, [favoritePrompts]);

  const addCustomPrompt = useCallback(async () => {
    if (!newCustomPrompt.trim()) return;
    triggerHaptic("success");
    const prompt: Prompt = {
      text: newCustomPrompt.trim(),
      category: selectedCustomCategory,
      chaos: gameState.chaosLevel,
      type: "simple",
    };
    const newCustom = [...customPrompts, prompt];
    setCustomPrompts(newCustom);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_PROMPTS, JSON.stringify(newCustom));
    setNewCustomPrompt("");
    setShowCustomPromptModal(false);
  }, [newCustomPrompt, selectedCustomCategory, customPrompts, gameState.chaosLevel]);

  // Award/deduct points
  const awardPoints = useCallback((playerIndex: number, points: number) => {
    triggerHaptic("success");
    setPlayers(prev => prev.map((p, i) =>
      i === playerIndex ? { ...p, score: p.score + points } : p
    ));
  }, []);

  const addDrink = useCallback((playerIndex: number, drinks: number = 1) => {
    setPlayers(prev => prev.map((p, i) =>
      i === playerIndex ? { ...p, drinks: p.drinks + drinks } : p
    ));
  }, []);

  const [cardStack, setCardStack] = useState<CardItem[]>([]);
  const cardIdRef = useRef(0);
  const shuffledPromptsRef = useRef<Prompt[]>([]);
  const promptIndexRef = useRef(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerProgress = useSharedValue(1);
  const timerPulse = useSharedValue(1);
  const errorShakeX = useSharedValue(0);

  // Timer warning pulse
  useEffect(() => {
    if (gameState.timerActive && gameState.timerSeconds <= 5 && gameState.timerSeconds > 0) {
      timerPulse.value = withRepeat(withSequence(withTiming(1.3, { duration: 150 }), withTiming(1, { duration: 150 })), -1, true);
    } else {
      cancelAnimation(timerPulse);
      timerPulse.value = 1;
    }
  }, [gameState.timerActive, gameState.timerSeconds]);

  const getFilteredPrompts = useCallback((): Prompt[] => {
    const basePrompts = gameState.isSexyMode ? [...promptData.prompts, ...promptData.sexy] : promptData.prompts;
    const allPrompts = [...basePrompts, ...customPrompts];
    const chaosMin = Math.max(1, gameState.chaosLevel - 3);
    const chaosMax = Math.min(10, gameState.chaosLevel + 3);
    return allPrompts.filter((p: Prompt) =>
      p.chaos >= chaosMin &&
      p.chaos <= chaosMax &&
      gameState.selectedCategories.includes(p.category as CategoryKey) &&
      !skippedPrompts.has(p.text)
    );
  }, [gameState.isSexyMode, gameState.chaosLevel, gameState.selectedCategories, customPrompts, skippedPrompts]);

  const replacePlaceholders = useCallback((text: string): string => {
    if (players.length === 0) return text;
    let result = text;
    const p1 = players[Math.floor(Math.random() * players.length)];
    result = result.replace(/\{player1\}/g, p1.name);
    if (result.includes("{player2}") && players.length > 1) {
      let p2;
      do { p2 = players[Math.floor(Math.random() * players.length)]; } while (p2.name === p1.name);
      result = result.replace(/\{player2\}/g, p2.name);
    }
    return result;
  }, [players]);

  const getNextCard = useCallback((): CardItem | null => {
    if (shuffledPromptsRef.current.length === 0) return null;
    if (promptIndexRef.current >= shuffledPromptsRef.current.length) {
      promptIndexRef.current = 0;
      shuffledPromptsRef.current = [...shuffledPromptsRef.current].sort(() => Math.random() - 0.5);
    }
    const prompt = shuffledPromptsRef.current[promptIndexRef.current];
    promptIndexRef.current++;
    cardIdRef.current++;
    return {
      id: cardIdRef.current,
      text: replacePlaceholders(prompt.text),
      data: prompt,
    };
  }, [replacePlaceholders]);

  const initializeGame = useCallback(() => {
    const filtered = getFilteredPrompts();
    shuffledPromptsRef.current = [...filtered].sort(() => Math.random() - 0.5);
    promptIndexRef.current = 0;
    cardIdRef.current = 0;

    const cards: CardItem[] = [];
    for (let i = 0; i < 2; i++) {
      const card = getNextCard();
      if (card) cards.push(card);
    }
    setCardStack(cards);
  }, [getFilteredPrompts, getNextCard]);

  const startTimer = useCallback((seconds: number) => {
    setGameState(prev => ({ ...prev, timerActive: true, timerSeconds: seconds }));
    timerProgress.value = 1;
    timerProgress.value = withTiming(0, { duration: seconds * 1000, easing: Easing.linear });
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timerSeconds <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerHaptic("error");
          return { ...prev, timerActive: false, timerSeconds: 0 };
        }
        if (prev.timerSeconds <= 5) triggerHaptic("light");
        return { ...prev, timerSeconds: prev.timerSeconds - 1 };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    cancelAnimation(timerProgress);
    setGameState(prev => ({ ...prev, timerActive: false, timerSeconds: 0 }));
  }, []);

  const handleSwipe = useCallback(() => {
    triggerHaptic("medium");
    stopTimer();

    const total = gameState.totalRounds * gameState.promptsPerRound;
    const current = (gameState.round - 1) * gameState.promptsPerRound + gameState.currentPromptIndex;

    if (current + 1 >= total) {
      setShowConfetti(true);
      triggerHaptic("success");
      setGameState(prev => ({ ...prev, screen: "results" }));
      return;
    }

    if (gameState.currentPromptIndex + 1 >= gameState.promptsPerRound) {
      setShowConfetti(true);
      triggerHaptic("success");
      setTimeout(() => setShowConfetti(false), 3000);
      setGameState(prev => ({ ...prev, screen: "roundEnd" }));
      return;
    }

    // Remove top card, add new one to bottom
    setCardStack(prev => {
      const newStack = prev.slice(1);
      const newCard = getNextCard();
      if (newCard) newStack.push(newCard);
      return newStack;
    });

    setGameState(prev => ({ ...prev, currentPromptIndex: prev.currentPromptIndex + 1 }));

    // Start timer if next card has one
    const nextCard = cardStack[1];
    if (nextCard?.data.timer) {
      setTimeout(() => startTimer(nextCard.data.timer!), 300);
    }
  }, [gameState, cardStack, getNextCard, startTimer, stopTimer]);

  const handleNextButton = useCallback(() => {
    handleSwipe();
  }, [handleSwipe]);

  const continueToNextRound = useCallback(() => {
    setShowConfetti(false);
    const cards: CardItem[] = [];
    for (let i = 0; i < 2; i++) {
      const card = getNextCard();
      if (card) cards.push(card);
    }
    setCardStack(cards);
    setGameState(prev => ({ ...prev, screen: "playing", round: prev.round + 1, currentPromptIndex: 0 }));
  }, [getNextCard]);

  const startGame = useCallback(() => {
    if (players.length < 2) {
      errorShakeX.value = withSequence(
        withSpring(-15, { stiffness: 800, damping: 8 }),
        withSpring(15, { stiffness: 800, damping: 8 }),
        withSpring(-15, { stiffness: 800, damping: 8 }),
        withSpring(0, { stiffness: 800, damping: 8 })
      );
      triggerHaptic("error");
      Alert.alert("Need Players", "Add at least 2 players!", [{ text: "Add", onPress: () => setIsAddPlayerVisible(true) }]);
      return;
    }
    if (gameState.selectedCategories.length === 0) {
      Alert.alert("No Categories", "Pick at least one!");
      return;
    }
    initializeGame();
    triggerHaptic("success");
    setGameState(prev => ({ ...prev, screen: "playing", round: 1, currentPromptIndex: 0 }));
  }, [players, gameState.selectedCategories, initializeGame]);

  const resetGame = useCallback(() => {
    stopTimer();
    setShowConfetti(false);
    setCardStack([]);
    setGameState(prev => ({ ...prev, screen: "setup", round: 1, currentPromptIndex: 0 }));
  }, [stopTimer]);

  const shareResults = useCallback(async () => {
    triggerHaptic("success");
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const drunkest = [...players].sort((a, b) => b.drinks - a.drinks)[0];

    let message = `🎮 GAMBIT RESULTS 🎮\n\n`;

    if (winner && winner.score > 0) {
      message += `👑 Champion: ${winner.name} (${winner.score} pts)\n`;
    }

    if (drunkest && drunkest.drinks > 0) {
      message += `🍺 Most Hydrated: ${drunkest.name} (${drunkest.drinks} drinks)\n`;
    }

    message += `\n📊 Final Standings:\n`;
    sortedPlayers.forEach((p, i) => {
      message += `${i + 1}. ${p.avatar} ${p.name}: ${p.score}pts`;
      if (p.drinks > 0) message += ` (🍺${p.drinks})`;
      message += `\n`;
    });

    message += `\n🔥 Play Gambit: https://apps.apple.com/app/id6737107968`;

    try {
      await Share.share({ message });
    } catch (e) {}
  }, [players]);

  const addPlayer = useCallback(() => {
    if (newPlayerName.trim()) {
      triggerHaptic("light");
      const avatars = ["😎", "🤪", "😈", "🥳", "🤠", "👻", "🦊", "🐸", "🦄", "🔥", "⚡", "💀", "🎃", "🤖", "👽", "🦁", "🐼", "🦋", "🎭", "🌟"];
      setPlayers(prev => [...prev, {
        name: newPlayerName.trim(),
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        score: 0,
        drinks: 0,
      }]);
      setNewPlayerName("");
    }
  }, [newPlayerName]);

  const removePlayer = useCallback((index: number) => {
    triggerHaptic("light");
    setPlayers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleCategory = useCallback((cat: CategoryKey) => {
    triggerHaptic("light");
    setGameState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter(c => c !== cat)
        : [...prev.selectedCategories, cat],
    }));
  }, []);

  const sharePrompt = useCallback(async () => {
    triggerHaptic("success");
    const topCard = cardStack[0];
    if (!topCard) return;
    try {
      await Share.share({
        message: `🎮 GAMBIT\n\n"${topCard.text}"\n\nDownload Gambit and play with your friends!`,
      });
    } catch (e) {}
  }, [cardStack]);

  const errorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: errorShakeX.value }] }));
  const timerBarStyle = useAnimatedStyle(() => ({ width: `${timerProgress.value * 100}%` }));
  const timerTextStyle = useAnimatedStyle(() => ({ transform: [{ scale: timerPulse.value }] }));

  // Current category for styling
  const currentCategory = cardStack[0]?.data.category as CategoryKey || "chaos";
  const catColor = CATEGORIES[currentCategory]?.color || "#8B5CF6";
  const catGradient = CATEGORIES[currentCategory]?.gradient || ["#8B5CF6", "#7C3AED"];

  // Render Setup
  const renderSetup = () => (
    <View style={styles.screen}>
      <FluidGradient
        colors={["#8B5CF6", "#EC4899", "#3B82F6"]}
        speed={0.6}
        blur={100}
      />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.setupContent}>
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.hero}>
          <Text style={styles.heroTitle}>GAMBIT</Text>
          <Text style={styles.heroSub}>Party chaos, perfected</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(50).duration(400)} style={styles.liveStats}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{gameStats.activeNow} playing now</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.card}>
          <TouchableOpacity style={styles.cardTouchable} onPress={() => setIsAddPlayerVisible(true)} activeOpacity={0.8}>
            <View style={styles.cardRow}>
              <Text style={styles.cardEmoji}>👥</Text>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{players.length} Player{players.length !== 1 ? "s" : ""}</Text>
                <Text style={styles.cardSubtitle}>Tap to add more</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.4)" />
            </View>
            {players.length > 0 && (
              <View style={styles.playerChips}>
                {players.slice(0, 5).map((p, i) => (
                  <View key={i} style={styles.playerChip}><Text style={styles.playerChipText}>{p.avatar} {p.name}</Text></View>
                ))}
                {players.length > 5 && <Text style={styles.moreChip}>+{players.length - 5}</Text>}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <TouchableOpacity
            style={[styles.modeCard, gameState.isSexyMode && styles.modeCardActive]}
            onPress={() => { triggerHaptic("light"); setGameState(prev => ({ ...prev, isSexyMode: !prev.isSexyMode })); }}
            activeOpacity={0.8}
          >
            <Text style={styles.modeEmoji}>{gameState.isSexyMode ? "🌶️" : "🎉"}</Text>
            <Text style={styles.modeText}>{gameState.isSexyMode ? "Spicy Mode" : "Party Mode"}</Text>
            <View style={[styles.modeIndicator, gameState.isSexyMode && styles.modeIndicatorActive]} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.sliderCard}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Chaos Level</Text>
            <View style={styles.chaosValueBadge}><Text style={styles.chaosValue}>{gameState.chaosLevel}</Text></View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={gameState.chaosLevel}
            onValueChange={(v) => setGameState(prev => ({ ...prev, chaosLevel: v }))}
            minimumTrackTintColor="#8B5CF6"
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor="#FFF"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Chill</Text>
            <Text style={styles.sliderLabelText}>Unhinged</Text>
          </View>
        </Animated.View>

        <Animated.View style={errorStyle} entering={FadeInUp.delay(400).duration(500)}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => players.length >= 2 ? setGameState(prev => ({ ...prev, screen: "categories" })) : startGame()}
            activeOpacity={0.9}
          >
            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButtonGradient}>
              <Text style={styles.startButtonText}>{players.length < 2 ? `Add ${2 - players.length} More` : "Choose Categories"}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/privacy")} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>•</Text>
          <TouchableOpacity onPress={() => router.push("/support")} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Terms & Support</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  // Render Categories
  const renderCategories = () => (
    <View style={styles.screen}>
      <FluidGradient
        colors={["#8B5CF6", "#EC4899", "#F59E0B"]}
        speed={0.5}
        blur={100}
      />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.catHeader}>
          <TouchableOpacity onPress={() => setGameState(prev => ({ ...prev, screen: "setup" }))} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.catCount}>{gameState.selectedCategories.length} selected</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.catTitle}>Pick Your Poison</Text>
        </Animated.View>

        <View style={styles.catGrid}>
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key, i) => {
            const cat = CATEGORIES[key];
            const selected = gameState.selectedCategories.includes(key);
            return (
              <Animated.View key={key} entering={ZoomIn.delay(100 + i * 40).springify()}>
                <TouchableOpacity style={[styles.catCard, selected && { borderColor: cat.color }]} onPress={() => toggleCategory(key)} activeOpacity={0.85}>
                  {selected && <LinearGradient colors={[cat.gradient[0] + "30", cat.gradient[1] + "10"]} style={StyleSheet.absoluteFill} />}
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catName, selected && { color: cat.color }]}>{cat.name}</Text>
                  {selected && <View style={[styles.catCheck, { backgroundColor: cat.color }]}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.catStartWrap}>
          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.9}>
            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButtonGradient}>
              <Text style={styles.startButtonText}>Let's Go</Text>
              <Ionicons name="flash" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  // Render Playing
  const renderPlaying = () => {
    const total = gameState.totalRounds * gameState.promptsPerRound;
    const current = (gameState.round - 1) * gameState.promptsPerRound + gameState.currentPromptIndex;
    const progress = (current + 1) / total;
    const timerColor = gameState.timerSeconds <= 5 ? "#EF4444" : "#10B981";

    return (
      <GestureHandlerRootView style={styles.screen}>
        <LinearGradient colors={[catColor + "15", "#000"]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />

        <View style={styles.playHeader}>
          <TouchableOpacity onPress={resetGame} style={styles.playBackBtn}><Ionicons name="close" size={20} color="#FFF" /></TouchableOpacity>
          <View style={styles.playRoundBadge}><Text style={styles.playRoundText}>Round {gameState.round}</Text></View>
          <TouchableOpacity onPress={sharePrompt} style={styles.shareBtn}><Ionicons name="share-outline" size={20} color="#FFF" /></TouchableOpacity>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: catColor }]} />
          </View>
          <Text style={styles.playCount}>{current + 1}/{total}</Text>
        </View>

        <View style={styles.cardsArea}>
          {cardStack.slice(0, 2).reverse().map((card, index) => {
            const isTopCard = index === cardStack.length - 1 - (cardStack.length > 1 ? 0 : -1);
            return (
              <SwipeableCard
                key={card.id}
                card={card}
                isTop={isTopCard}
                onSwipe={handleSwipe}
                category={card.data.category as CategoryKey}
                onSkip={isTopCard ? () => skipForever(card.data.text) : undefined}
                onFavorite={isTopCard ? () => toggleFavorite(card.data.text) : undefined}
                isFavorite={favoritePrompts.has(card.data.text)}
              />
            );
          })}

          {gameState.timerActive && (
            <View style={styles.timerOverlay}>
              <Animated.Text style={[styles.timerNum, timerTextStyle, { color: timerColor }]}>{gameState.timerSeconds}</Animated.Text>
              <View style={styles.timerTrack}>
                <Animated.View style={[styles.timerFill, timerBarStyle, { backgroundColor: timerColor }]} />
              </View>
            </View>
          )}
        </View>

        {/* Scoring buttons */}
        {gameState.showScoring && players.length > 0 && (
          <View style={styles.scoringSection}>
            <Text style={styles.scoringLabel}>Award points</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scoringPlayers}>
              {players.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.scoringPlayer}
                  onPress={() => awardPoints(i, 1)}
                  onLongPress={() => addDrink(i)}
                >
                  <Text style={styles.scoringAvatar}>{p.avatar}</Text>
                  <Text style={styles.scoringName}>{p.name}</Text>
                  <View style={styles.scoringStats}>
                    <Text style={styles.scoringScore}>+{p.score}</Text>
                    {p.drinks > 0 && <Text style={styles.scoringDrinks}>🍺{p.drinks}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.playFooter}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextButton} activeOpacity={0.9}>
            <LinearGradient colors={catGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextBtnGradient}>
              <Text style={styles.nextBtnText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    );
  };

  // Render Round End
  const renderRoundEnd = () => (
    <View style={styles.screen}>
      <LinearGradient colors={["#8B5CF620", "#000"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={styles.roundEndContent} entering={ZoomIn.springify()}>
        <Animated.Text entering={BounceIn.delay(200)} style={styles.roundEndEmoji}>🎉</Animated.Text>
        <Text style={styles.roundEndTitle}>Round {gameState.round} Done!</Text>
        <Text style={styles.roundEndSub}>{gameState.totalRounds - gameState.round} more to go</Text>
        <TouchableOpacity style={styles.continueBtn} onPress={continueToNextRound} activeOpacity={0.9}>
          <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.continueBtnGradient}>
            <Text style={styles.continueBtnText}>Round {gameState.round + 1}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      {showConfetti && <Confetti count={50} />}
    </View>
  );

  // Render Results
  const renderResults = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const drunkest = [...players].sort((a, b) => b.drinks - a.drinks)[0];

    return (
      <View style={styles.screen}>
        <LinearGradient colors={["#FFD70020", "#000"]} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <Animated.Text entering={FadeInDown.springify()} style={styles.resultsTitle}>Game Over</Animated.Text>

          {winner && winner.score > 0 && (
            <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.winnerCard}>
              <Animated.Text entering={BounceIn.delay(400)} style={styles.winnerEmoji}>👑</Animated.Text>
              <Text style={styles.winnerLabel}>CHAMPION</Text>
              <Text style={styles.winnerName}>{winner.avatar} {winner.name}</Text>
              <Text style={styles.winnerScore}>{winner.score} points</Text>
            </Animated.View>
          )}

          {drunkest && drunkest.drinks > 0 && (
            <Animated.View entering={ZoomIn.delay(350).springify()} style={[styles.winnerCard, styles.drunkestCard]}>
              <Text style={styles.drunkestEmoji}>🍺</Text>
              <Text style={styles.drunkestLabel}>MOST HYDRATED</Text>
              <Text style={styles.drunkestName}>{drunkest.avatar} {drunkest.name}</Text>
              <Text style={styles.drunkestScore}>{drunkest.drinks} drinks</Text>
            </Animated.View>
          )}

          <View style={styles.resultsList}>
            {sortedPlayers.map((p, i) => (
              <Animated.View key={i} entering={SlideInRight.delay(400 + i * 80).springify()} style={styles.resultRow}>
                <Text style={[styles.resultRank, i === 0 && styles.resultRankFirst]}>{i + 1}</Text>
                <Text style={styles.resultAvatar}>{p.avatar}</Text>
                <Text style={styles.resultName}>{p.name}</Text>
                <View style={styles.resultStats}>
                  <Text style={styles.resultScore}>{p.score}pts</Text>
                  {p.drinks > 0 && <Text style={styles.resultDrinks}>🍺{p.drinks}</Text>}
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={styles.resultsButtons}>
            <TouchableOpacity style={styles.shareResultsBtn} onPress={shareResults} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={22} color="#FFF" />
              <Text style={styles.shareResultsText}>Share Results</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame} activeOpacity={0.9}>
              <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.playAgainGradient}>
                <Text style={styles.playAgainText}>Play Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {showConfetti && <Confetti count={60} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.inner}>
        {gameState.screen === "setup" && renderSetup()}
        {gameState.screen === "categories" && renderCategories()}
        {gameState.screen === "playing" && renderPlaying()}
        {gameState.screen === "roundEnd" && renderRoundEnd()}
        {gameState.screen === "results" && renderResults()}
      </View>

      <SlideDownPanel isVisible={isAddPlayerVisible} onClose={() => setIsAddPlayerVisible(false)}>
        <View style={styles.dialogHeader}>
          <Text style={styles.dialogTitle}>Add Players</Text>
          <Text style={styles.dialogSubtitle}>{players.length} player{players.length !== 1 ? "s" : ""} added</Text>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              placeholder="Enter name..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              returnKeyType="done"
              onSubmitEditing={addPlayer}
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addPlayer} activeOpacity={0.8}>
            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.addBtnGradient}>
              <Ionicons name="add" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <FlatList
          data={players}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 40).duration(200).springify()} exiting={SlideOutLeft.duration(150)} layout={Layout.springify()} style={styles.dialogPlayer}>
              <View style={styles.playerAvatarWrap}><Text style={styles.playerAvatar}>{item.avatar}</Text></View>
              <Text style={styles.dialogPlayerText}>{item.name}</Text>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePlayer(index)} activeOpacity={0.7}>
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </Animated.View>
          )}
          style={styles.dialogList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.emptyList}><Text style={styles.emptyListText}>No players yet</Text></View>}
        />

        <TouchableOpacity style={styles.doneBtn} onPress={() => setIsAddPlayerVisible(false)} activeOpacity={0.9}>
          <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.doneBtnGradient}>
            <Text style={styles.doneBtnText}>Done</Text>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </SlideDownPanel>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  inner: { flex: 1, maxWidth: Platform.OS === "web" ? MAX_WIDTH : "100%", width: "100%", alignSelf: "center" },
  screen: { flex: 1, backgroundColor: "#000" },
  scrollContent: { flex: 1 },

  liveStats: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginRight: 8 },
  liveText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "600" },

  setupContent: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  heroTitle: { fontSize: 64, fontWeight: "900", color: "#FFF", letterSpacing: 8 },
  heroSub: { fontSize: 16, color: "rgba(255,255,255,0.5)", marginTop: 8, letterSpacing: 2 },

  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardTouchable: { padding: 20 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardEmoji: { fontSize: 32, marginRight: 16 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  cardSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  playerChips: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 8 },
  playerChip: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  playerChipText: { fontSize: 13, color: "#FFF" },
  moreChip: { fontSize: 13, color: "rgba(255,255,255,0.5)", alignSelf: "center" },

  modeCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  modeCardActive: { backgroundColor: "rgba(236,72,153,0.1)", borderColor: "rgba(236,72,153,0.3)" },
  modeEmoji: { fontSize: 28, marginRight: 16 },
  modeText: { fontSize: 17, fontWeight: "600", color: "#FFF", flex: 1 },
  modeIndicator: { width: 48, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)" },
  modeIndicatorActive: { backgroundColor: "#EC4899" },

  sliderCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sliderLabel: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  chaosValueBadge: { backgroundColor: "#8B5CF6", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  chaosValue: { fontSize: 15, fontWeight: "800", color: "#FFF" },
  slider: { width: "100%", height: 40 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  sliderLabelText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600" },

  startButton: { borderRadius: 20, overflow: "hidden" },
  startButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, paddingHorizontal: 32 },
  startButtonText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  catHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 0 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  catCount: { fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  catTitle: { fontSize: 32, fontWeight: "800", color: "#FFF", textAlign: "center", marginTop: 20, marginBottom: 24 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
  catCard: { width: (SCREEN_WIDTH - 56) / 2, maxWidth: (MAX_WIDTH - 56) / 2, aspectRatio: 1.1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent", overflow: "hidden" },
  catEmoji: { fontSize: 40, marginBottom: 12 },
  catName: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  catCheck: { position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catStartWrap: { padding: 20, paddingTop: 32 },

  playHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  playBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  playRoundBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  playRoundText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },

  progressWrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 8, gap: 12 },
  progressTrack: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  playCount: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", minWidth: 40, textAlign: "right" },

  cardsArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  promptCard: { position: "absolute", width: "100%", aspectRatio: 0.85, backgroundColor: "#111", borderRadius: 24, padding: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  cardTopRow: { position: "absolute", top: 16, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  promptCatBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  promptCatText: { fontSize: 18 },
  cardActions: { flexDirection: "row", gap: 8 },
  cardActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  promptText: { fontSize: 24, fontWeight: "700", color: "#FFF", textAlign: "center", lineHeight: 34 },
  swipeHint: { position: "absolute", bottom: 20, fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: "600", letterSpacing: 2 },

  scoringSection: { paddingHorizontal: 16, paddingBottom: 8 },
  scoringLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, textAlign: "center" },
  scoringPlayers: { gap: 8, paddingHorizontal: 4 },
  scoringPlayer: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, minWidth: 70 },
  scoringAvatar: { fontSize: 20, marginBottom: 2 },
  scoringName: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  scoringStats: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  scoringScore: { fontSize: 12, fontWeight: "700", color: "#8B5CF6" },
  scoringDrinks: { fontSize: 10, color: "rgba(255,255,255,0.4)" },

  timerOverlay: { position: "absolute", bottom: 80, alignItems: "center", width: "80%" },
  timerNum: { fontSize: 48, fontWeight: "900", marginBottom: 8 },
  timerTrack: { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  timerFill: { height: "100%", borderRadius: 3 },

  playFooter: { padding: 16, paddingBottom: 32 },
  nextBtn: { borderRadius: 20, overflow: "hidden" },
  nextBtnGradient: { paddingVertical: 18, alignItems: "center" },
  nextBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  roundEndContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  roundEndEmoji: { fontSize: 80, marginBottom: 24 },
  roundEndTitle: { fontSize: 36, fontWeight: "800", color: "#FFF", marginBottom: 8 },
  roundEndSub: { fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 48 },
  continueBtn: { borderRadius: 20, overflow: "hidden", width: "100%" },
  continueBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, gap: 8 },
  continueBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  resultsContent: { padding: 24, paddingTop: 48, alignItems: "center" },
  resultsTitle: { fontSize: 42, fontWeight: "900", color: "#FFF", marginBottom: 32 },
  winnerCard: { backgroundColor: "rgba(255,215,0,0.1)", borderWidth: 2, borderColor: "rgba(255,215,0,0.3)", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", marginBottom: 24 },
  winnerEmoji: { fontSize: 64, marginBottom: 16 },
  winnerLabel: { fontSize: 12, color: "rgba(255,215,0,0.7)", fontWeight: "700", letterSpacing: 3, marginBottom: 8 },
  winnerName: { fontSize: 28, fontWeight: "800", color: "#FFD700" },
  resultsList: { width: "100%", gap: 12, marginBottom: 32 },
  resultRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, gap: 16 },
  resultRank: { fontSize: 16, fontWeight: "800", color: "rgba(255,255,255,0.4)", width: 24 },
  resultRankFirst: { color: "#FFD700" },
  resultAvatar: { fontSize: 24 },
  resultName: { fontSize: 16, fontWeight: "600", color: "#FFF", flex: 1 },
  resultStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultScore: { fontSize: 14, fontWeight: "700", color: "#8B5CF6" },
  resultDrinks: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  winnerScore: { fontSize: 16, color: "rgba(255,215,0,0.8)", marginTop: 4, fontWeight: "600" },
  drunkestCard: { backgroundColor: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.3)" },
  drunkestEmoji: { fontSize: 48, marginBottom: 12 },
  drunkestLabel: { fontSize: 11, color: "rgba(59,130,246,0.8)", fontWeight: "700", letterSpacing: 2, marginBottom: 4 },
  drunkestName: { fontSize: 22, fontWeight: "700", color: "#3B82F6" },
  drunkestScore: { fontSize: 14, color: "rgba(59,130,246,0.7)", marginTop: 2, fontWeight: "600" },
  resultsButtons: { gap: 12, width: "100%", marginTop: 10 },
  shareResultsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  shareResultsText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  playAgainBtn: { borderRadius: 20, overflow: "hidden", width: "100%" },
  playAgainGradient: { paddingVertical: 18, alignItems: "center" },
  playAgainText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  dialogHeader: { marginBottom: 20 },
  dialogTitle: { fontSize: 28, fontWeight: "800", color: "#FFF", textAlign: "center" },
  dialogSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 4, fontWeight: "500" },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  inputWrap: { flex: 1, flexDirection: "row", alignItems: "center", height: 52, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, height: 52, paddingHorizontal: 12, fontSize: 16, color: "#FFF", fontWeight: "500" },
  addBtn: { width: 52, height: 52, borderRadius: 16, overflow: "hidden" },
  addBtnGradient: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  dialogList: { maxHeight: 220, marginBottom: 20 },
  dialogPlayer: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  playerAvatarWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(139,92,246,0.2)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  playerAvatar: { fontSize: 18 },
  dialogPlayerText: { flex: 1, fontSize: 16, color: "#FFF", fontWeight: "600" },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  emptyList: { paddingVertical: 32, alignItems: "center" },
  emptyListText: { fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: "500" },
  doneBtn: { borderRadius: 16, overflow: "hidden" },
  doneBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 12 },
  footerLink: { fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: "500" },
  footerDot: { fontSize: 13, color: "rgba(255,255,255,0.2)" },
});
