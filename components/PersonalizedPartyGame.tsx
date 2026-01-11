import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
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
import { Button } from "./Button";
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
  Easing,
  cancelAnimation,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  BounceIn,
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeInDown,
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
import { Audio } from "expo-av";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";

import promptData from "../assets/prompts/prompts.json";

// Types
type Player = {
  name: string;
  avatar: string;
  score: number;
};

type GameScreen = "setup" | "categories" | "playing" | "results" | "roundEnd";
type CategoryKey = "drinking" | "dares" | "confessions" | "hot_takes" | "physical" | "social" | "creative" | "chaos";

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
}

interface PromptRating {
  promptText: string;
  fire: number;
  skull: number;
}

// Constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;
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

// Sound Effects Hook
const useSoundEffects = () => {
  const sounds = useRef<{ [key: string]: Audio.Sound }>({});

  const playHapticPattern = useCallback(async (pattern: "success" | "error" | "swipe" | "fire" | "skull" | "celebration") => {
    if (Platform.OS === "web") return;

    switch (pattern) {
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "swipe":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "fire":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
        break;
      case "skull":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        break;
      case "celebration":
        for (let i = 0; i < 3; i++) {
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), i * 80);
        }
        break;
    }
  }, []);

  return { playHapticPattern };
};

// Floating Orb Component
const FloatingOrb = ({ color, size, initialX, initialY, duration }: any) => {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(initialX + 50, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX - 30, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(initialY - 40, { duration: duration * 0.7, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY + 30, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY, { duration: duration * 0.5, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: duration * 0.5 }),
        withTiming(0.9, { duration: duration * 0.5 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    opacity: 0.15,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    filter: "blur(40px)",
  }));

  return <Animated.View style={style} />;
};

// Confetti
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
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF69B4"];
  return <Animated.Text style={[style, { fontSize: 20, color: colors[Math.floor(Math.random() * colors.length)] }]}>✦</Animated.Text>;
};

const Confetti = ({ count = 40 }: { count?: number }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: Math.random() * 400,
    startX: Math.random() * SCREEN_WIDTH,
  }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => <Particle key={p.id} delay={p.delay} startX={p.startX} />)}
    </View>
  );
};

// Rating Popup Component
const RatingPopup = ({
  visible,
  onRate,
  promptText
}: {
  visible: boolean;
  onRate: (rating: "fire" | "skull" | "skip") => void;
  promptText: string;
}) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      scale.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.ratingOverlay, animStyle]}>
      <View style={styles.ratingCard}>
        <Text style={styles.ratingTitle}>Rate this prompt</Text>
        <Text style={styles.ratingPrompt} numberOfLines={2}>{promptText}</Text>
        <View style={styles.ratingButtons}>
          <TouchableOpacity
            style={[styles.ratingBtn, styles.fireBtn]}
            onPress={() => onRate("fire")}
            activeOpacity={0.8}
          >
            <Text style={styles.ratingEmoji}>🔥</Text>
            <Text style={styles.ratingLabel}>Fire</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ratingBtn, styles.skullBtn]}
            onPress={() => onRate("skull")}
            activeOpacity={0.8}
          >
            <Text style={styles.ratingEmoji}>💀</Text>
            <Text style={styles.ratingLabel}>Dead</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.skipBtn} onPress={() => onRate("skip")}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Share Card Component
const ShareCard = React.forwardRef<ViewShot, { prompt: string; category: CategoryKey; players: Player[] }>(
  ({ prompt, category, players }, ref) => {
    const cat = CATEGORIES[category] || CATEGORIES.chaos;
    return (
      <ViewShot ref={ref} options={{ format: "png", quality: 1 }}>
        <View style={styles.shareCard}>
          <LinearGradient
            colors={[cat.gradient[0], cat.gradient[1], "#000"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.shareCardContent}>
            <Text style={styles.shareCardBrand}>GAMBIT</Text>
            <Text style={styles.shareCardEmoji}>{cat.emoji}</Text>
            <Text style={styles.shareCardPrompt}>{prompt}</Text>
            <View style={styles.shareCardFooter}>
              <Text style={styles.shareCardPlayers}>
                Playing with {players.slice(0, 3).map(p => p.name).join(", ")}
                {players.length > 3 ? ` +${players.length - 3}` : ""}
              </Text>
              <Text style={styles.shareCardCTA}>Download Gambit 🎮</Text>
            </View>
          </View>
        </View>
      </ViewShot>
    );
  }
);

export function PersonalizedPartyGame() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [lastPromptForRating, setLastPromptForRating] = useState("");
  const [promptRatings, setPromptRatings] = useState<PromptRating[]>([]);
  const [gameStats, setGameStats] = useState({ totalGames: 1247, activeNow: 89 });

  const { playHapticPattern } = useSoundEffects();
  const shareCardRef = useRef<ViewShot>(null);

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
  });

  const [currentPrompt, setCurrentPrompt] = useState("");
  const [nextPrompt, setNextPrompt] = useState("");
  const [currentPromptData, setCurrentPromptData] = useState<Prompt | null>(null);
  const [nextPromptData, setNextPromptData] = useState<Prompt | null>(null);
  const [shuffledPrompts, setShuffledPrompts] = useState<Prompt[]>([]);
  const promptIndexRef = useRef(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerProgress = useSharedValue(1);

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const errorShakeX = useSharedValue(0);
  const nextCardScale = useSharedValue(0.88);
  const timerPulse = useSharedValue(1);
  const statsCounter = useSharedValue(gameStats.activeNow);

  // Animate stats counter
  useEffect(() => {
    const interval = setInterval(() => {
      setGameStats(prev => ({
        ...prev,
        activeNow: prev.activeNow + Math.floor(Math.random() * 5) - 2,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Timer warning
  useEffect(() => {
    if (gameState.timerActive && gameState.timerSeconds <= 5 && gameState.timerSeconds > 0) {
      timerPulse.value = withRepeat(withSequence(withTiming(1.3, { duration: 150 }), withTiming(1, { duration: 150 })), -1, true);
    } else {
      cancelAnimation(timerPulse);
      timerPulse.value = 1;
    }
  }, [gameState.timerActive, gameState.timerSeconds]);

  const getFilteredPrompts = useCallback((): Prompt[] => {
    const allPrompts = gameState.isSexyMode ? [...promptData.prompts, ...promptData.sexy] : promptData.prompts;
    const chaosMin = Math.max(1, gameState.chaosLevel - 3);
    const chaosMax = Math.min(10, gameState.chaosLevel + 3);
    return allPrompts.filter((p: Prompt) => p.chaos >= chaosMin && p.chaos <= chaosMax && gameState.selectedCategories.includes(p.category as CategoryKey));
  }, [gameState.isSexyMode, gameState.chaosLevel, gameState.selectedCategories]);

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

  const initializePrompts = useCallback((): Prompt[] => {
    const filtered = getFilteredPrompts();
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setShuffledPrompts(shuffled);
    promptIndexRef.current = 0;
    return shuffled;
  }, [getFilteredPrompts]);

  const getNextPromptFromList = useCallback((prompts: Prompt[]): { text: string; data: Prompt } | null => {
    if (prompts.length === 0) return null;
    if (promptIndexRef.current >= prompts.length) {
      promptIndexRef.current = 0;
    }
    const prompt = prompts[promptIndexRef.current];
    promptIndexRef.current++;
    return { text: replacePlaceholders(prompt.text), data: prompt };
  }, [replacePlaceholders]);

  const getNextPrompt = useCallback((): { text: string; data: Prompt } | null => {
    if (shuffledPrompts.length === 0) return null;
    if (promptIndexRef.current >= shuffledPrompts.length) {
      promptIndexRef.current = 0;
      setShuffledPrompts(prev => [...prev].sort(() => Math.random() - 0.5));
    }
    const prompt = shuffledPrompts[promptIndexRef.current];
    promptIndexRef.current++;
    return { text: replacePlaceholders(prompt.text), data: prompt };
  }, [shuffledPrompts, replacePlaceholders]);

  const startTimer = useCallback((seconds: number) => {
    setGameState(prev => ({ ...prev, timerActive: true, timerSeconds: seconds }));
    timerProgress.value = 1;
    timerProgress.value = withTiming(0, { duration: seconds * 1000, easing: Easing.linear });
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timerSeconds <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          playHapticPattern("error");
          return { ...prev, timerActive: false, timerSeconds: 0 };
        }
        if (prev.timerSeconds <= 5) playHapticPattern("swipe");
        return { ...prev, timerSeconds: prev.timerSeconds - 1 };
      });
    }, 1000);
  }, [playHapticPattern]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    cancelAnimation(timerProgress);
    setGameState(prev => ({ ...prev, timerActive: false, timerSeconds: 0 }));
  }, []);

  // Share functionality
  const sharePrompt = useCallback(async () => {
    playHapticPattern("success");

    try {
      const message = `🎮 GAMBIT\n\n"${currentPrompt}"\n\nDownload Gambit and play with your friends!`;
      await Share.share({
        message,
        title: "Share this Gambit prompt",
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  }, [currentPrompt, playHapticPattern]);

  // Rate prompt
  const handleRating = useCallback((rating: "fire" | "skull" | "skip") => {
    if (rating !== "skip") {
      playHapticPattern(rating);
      setPromptRatings(prev => {
        const existing = prev.find(r => r.promptText === lastPromptForRating);
        if (existing) {
          return prev.map(r =>
            r.promptText === lastPromptForRating
              ? { ...r, [rating]: r[rating] + 1 }
              : r
          );
        }
        return [...prev, {
          promptText: lastPromptForRating,
          fire: rating === "fire" ? 1 : 0,
          skull: rating === "skull" ? 1 : 0
        }];
      });
    }
    setShowRating(false);
  }, [lastPromptForRating, playHapticPattern]);

  const handleNext = useCallback(() => {
    playHapticPattern("swipe");
    stopTimer();

    // Show rating popup for previous prompt
    if (currentPrompt && Math.random() > 0.5) { // 50% chance to show rating
      setLastPromptForRating(currentPrompt);
      setShowRating(true);
    }

    const total = gameState.totalRounds * gameState.promptsPerRound;
    const current = (gameState.round - 1) * gameState.promptsPerRound + gameState.currentPromptIndex;

    if (current + 1 >= total) {
      setShowConfetti(true);
      playHapticPattern("celebration");
      setGameState(prev => ({ ...prev, screen: "results" }));
      return;
    }

    if (gameState.currentPromptIndex + 1 >= gameState.promptsPerRound) {
      setShowConfetti(true);
      playHapticPattern("celebration");
      setTimeout(() => setShowConfetti(false), 3000);
      setGameState(prev => ({ ...prev, screen: "roundEnd" }));
      return;
    }

    setGameState(prev => ({ ...prev, currentPromptIndex: prev.currentPromptIndex + 1 }));
    nextCardScale.value = withSequence(withTiming(0.92, { duration: 80 }), withSpring(0.88, { damping: 15 }));

    const next = getNextPrompt();
    if (next) {
      setCurrentPrompt(nextPrompt);
      setCurrentPromptData(nextPromptData);
      setNextPrompt(next.text);
      setNextPromptData(next.data);
      if (nextPromptData?.timer) setTimeout(() => startTimer(nextPromptData.timer!), 300);
    }

    setTimeout(() => {
      translateX.value = 0;
      translateY.value = 0;
      cardRotation.value = 0;
      cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      cardOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
    }, 30);
  }, [gameState, nextPrompt, nextPromptData, getNextPrompt, startTimer, stopTimer, currentPrompt, playHapticPattern]);

  const continueToNextRound = useCallback(() => {
    setShowConfetti(false);
    setGameState(prev => ({ ...prev, screen: "playing", round: prev.round + 1, currentPromptIndex: 0 }));
    const next = getNextPrompt();
    if (next) {
      setCurrentPrompt(next.text);
      setCurrentPromptData(next.data);
      const second = getNextPrompt();
      if (second) { setNextPrompt(second.text); setNextPromptData(second.data); }
      if (next.data.timer) setTimeout(() => startTimer(next.data.timer!), 500);
    }
  }, [getNextPrompt, startTimer]);

  const startGame = useCallback(() => {
    if (players.length < 2) {
      errorShakeX.value = withSequence(
        withSpring(-20, { stiffness: 800, damping: 6 }),
        withSpring(20, { stiffness: 800, damping: 6 }),
        withSpring(-20, { stiffness: 800, damping: 6 }),
        withSpring(0, { stiffness: 800, damping: 6 })
      );
      playHapticPattern("error");
      Alert.alert("Need Players", "Add at least 2 players!", [{ text: "Add", onPress: () => setIsAddPlayerVisible(true) }]);
      return;
    }
    if (gameState.selectedCategories.length === 0) {
      Alert.alert("No Categories", "Pick at least one!");
      return;
    }
    const prompts = initializePrompts();
    const first = getNextPromptFromList(prompts);
    const second = getNextPromptFromList(prompts);
    if (first && second) {
      setCurrentPrompt(first.text);
      setCurrentPromptData(first.data);
      setNextPrompt(second.text);
      setNextPromptData(second.data);
      if (first.data.timer) setTimeout(() => startTimer(first.data.timer!), 600);
    }
    playHapticPattern("success");
    setGameState(prev => ({ ...prev, screen: "playing", round: 1, currentPromptIndex: 0 }));
  }, [players, gameState.selectedCategories, initializePrompts, getNextPromptFromList, startTimer, playHapticPattern]);

  const resetGame = useCallback(() => {
    stopTimer();
    setShowConfetti(false);
    setShowRating(false);
    setGameState(prev => ({ ...prev, screen: "setup", round: 1, currentPromptIndex: 0 }));
    setCurrentPrompt("");
    setNextPrompt("");
  }, [stopTimer]);

  const addPlayer = useCallback(() => {
    if (newPlayerName.trim()) {
      playHapticPattern("success");
      const avatars = ["😎", "🤪", "😈", "🥳", "🤠", "👻", "🦊", "🐸", "🦄", "🔥", "⚡", "💀", "🎃", "🤖", "👽", "🦁", "🐼", "🦋", "🎭", "🌟"];
      setPlayers(prev => [...prev, { name: newPlayerName.trim(), avatar: avatars[Math.floor(Math.random() * avatars.length)], score: 0 }]);
      setNewPlayerName("");
    }
  }, [newPlayerName, playHapticPattern]);

  const removePlayer = useCallback((index: number) => {
    playHapticPattern("swipe");
    setPlayers(prev => prev.filter((_, i) => i !== index));
  }, [playHapticPattern]);

  const toggleCategory = useCallback((cat: CategoryKey) => {
    playHapticPattern("swipe");
    setGameState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter(c => c !== cat)
        : [...prev.selectedCategories, cat],
    }));
  }, [playHapticPattern]);

  // Gestures
  const panGesture = Gesture.Pan()
    .onBegin(() => { if (Platform.OS !== "web") runOnJS(Haptics.selectionAsync)(); })
    .onUpdate((e) => {
      "worklet";
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4;
      cardRotation.value = (e.translationX / SCREEN_WIDTH) * 25;
      const progress = Math.abs(e.translationX) / SCREEN_WIDTH;
      cardScale.value = interpolate(progress, [0, 0.4], [1, 0.9], Extrapolate.CLAMP);
      cardOpacity.value = interpolate(Math.abs(e.translationX), [0, SCREEN_WIDTH / 3], [1, 0.2], Extrapolate.CLAMP);
      nextCardScale.value = interpolate(progress, [0, 0.4], [0.88, 1], Extrapolate.CLAMP);
    })
    .onEnd((e) => {
      "worklet";
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        translateX.value = withSpring(dir * SCREEN_WIDTH * 1.5, { velocity: e.velocityX, stiffness: 60, damping: 12 });
        translateY.value = withSpring(e.translationY * 0.5, { stiffness: 60, damping: 12 });
        cardRotation.value = withSpring(dir * 50, { stiffness: 60, damping: 12 });
        cardScale.value = withTiming(0.7, { duration: 150 });
        cardOpacity.value = withTiming(0, { duration: 200 }, (done) => { if (done) runOnJS(handleNext)(); });
      } else {
        translateX.value = withSpring(0, { stiffness: 400, damping: 30 });
        translateY.value = withSpring(0, { stiffness: 400, damping: 30 });
        cardRotation.value = withSpring(0, { stiffness: 400, damping: 30 });
        cardScale.value = withSpring(1, { stiffness: 400, damping: 30 });
        cardOpacity.value = withSpring(1, { stiffness: 400, damping: 30 });
        nextCardScale.value = withSpring(0.88, { stiffness: 400, damping: 30 });
      }
    });

  // Animated styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${cardRotation.value}deg` },
      { scale: cardScale.value },
    ],
    opacity: cardOpacity.value,
  }));

  const nextCardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextCardScale.value }],
    opacity: interpolate(nextCardScale.value, [0.88, 1], [0.6, 1], Extrapolate.CLAMP),
  }));

  const errorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: errorShakeX.value }] }));
  const timerBarStyle = useAnimatedStyle(() => ({ width: `${timerProgress.value * 100}%` }));
  const timerTextStyle = useAnimatedStyle(() => ({ transform: [{ scale: timerPulse.value }] }));

  // Check if prompt is "hot" (well-rated)
  const isHotPrompt = useCallback((promptText: string) => {
    const rating = promptRatings.find(r => r.promptText === promptText);
    return rating && rating.fire > rating.skull && rating.fire >= 3;
  }, [promptRatings]);

  // Render Setup
  const renderSetup = () => (
    <View style={styles.screen}>
      {/* Animated Background */}
      <View style={styles.bgOrbs}>
        <FloatingOrb color="#8B5CF6" size={300} initialX={-50} initialY={100} duration={8000} />
        <FloatingOrb color="#EC4899" size={250} initialX={SCREEN_WIDTH - 100} initialY={300} duration={10000} />
        <FloatingOrb color="#3B82F6" size={200} initialX={100} initialY={500} duration={7000} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.setupContent}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.hero}>
          <Text style={styles.heroTitle}>GAMBIT</Text>
          <Text style={styles.heroSub}>Party chaos, perfected</Text>
        </Animated.View>

        {/* Live Stats */}
        <Animated.View entering={FadeInUp.delay(50).duration(400)} style={styles.liveStats}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{gameStats.activeNow} playing now</Text>
        </Animated.View>

        {/* Players Card */}
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
                  <View key={i} style={styles.playerChip}>
                    <Text style={styles.playerChipText}>{p.avatar} {p.name}</Text>
                  </View>
                ))}
                {players.length > 5 && <Text style={styles.moreChip}>+{players.length - 5}</Text>}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Mode Toggle */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <TouchableOpacity
            style={[styles.modeCard, gameState.isSexyMode && styles.modeCardActive]}
            onPress={() => {
              playHapticPattern("swipe");
              setGameState(prev => ({ ...prev, isSexyMode: !prev.isSexyMode }));
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.modeEmoji}>{gameState.isSexyMode ? "🌶️" : "🎉"}</Text>
            <Text style={styles.modeText}>{gameState.isSexyMode ? "Spicy Mode" : "Party Mode"}</Text>
            <View style={[styles.modeIndicator, gameState.isSexyMode && styles.modeIndicatorActive]} />
          </TouchableOpacity>
        </Animated.View>

        {/* Chaos Slider */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.sliderCard}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Chaos Level</Text>
            <View style={styles.chaosValueBadge}>
              <Text style={styles.chaosValue}>{gameState.chaosLevel}</Text>
            </View>
          </View>
          <View style={styles.sliderTrack}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={gameState.chaosLevel}
              onValueChange={(v) => {
                playHapticPattern("swipe");
                setGameState(prev => ({ ...prev, chaosLevel: v }));
              }}
              minimumTrackTintColor="#8B5CF6"
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="#FFFFFF"
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Chill</Text>
            <Text style={styles.sliderLabelText}>Unhinged</Text>
          </View>
        </Animated.View>

        {/* Start Button */}
        <Animated.View style={errorStyle} entering={FadeInUp.delay(400).duration(500)}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => players.length >= 2 ? setGameState(prev => ({ ...prev, screen: "categories" })) : startGame()}
            activeOpacity={0.9}
          >
            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButtonGradient}>
              <Text style={styles.startButtonText}>
                {players.length < 2 ? `Add ${2 - players.length} More` : "Choose Categories"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  // Render Categories
  const renderCategories = () => (
    <View style={styles.screen}>
      <View style={styles.bgOrbs}>
        <FloatingOrb color="#8B5CF6" size={300} initialX={-50} initialY={100} duration={8000} />
        <FloatingOrb color="#EC4899" size={250} initialX={SCREEN_WIDTH - 100} initialY={400} duration={10000} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.catHeader}>
          <TouchableOpacity onPress={() => setGameState(prev => ({ ...prev, screen: "setup" }))} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.catCount}>{gameState.selectedCategories.length} selected</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.catTitle}>Pick Your Poison</Text>
        </Animated.View>

        {/* Category Grid */}
        <View style={styles.catGrid}>
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key, i) => {
            const cat = CATEGORIES[key];
            const selected = gameState.selectedCategories.includes(key);
            return (
              <Animated.View key={key} entering={ZoomIn.delay(100 + i * 40).springify()}>
                <TouchableOpacity
                  style={[styles.catCard, selected && { borderColor: cat.color }]}
                  onPress={() => toggleCategory(key)}
                  activeOpacity={0.85}
                >
                  {selected && <LinearGradient colors={[cat.gradient[0] + "30", cat.gradient[1] + "10"]} style={StyleSheet.absoluteFill} />}
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catName, selected && { color: cat.color }]}>{cat.name}</Text>
                  {selected && <View style={[styles.catCheck, { backgroundColor: cat.color }]}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Start */}
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
    const catColor = currentPromptData ? CATEGORIES[currentPromptData.category as CategoryKey]?.color || "#8B5CF6" : "#8B5CF6";
    const catGradient = currentPromptData ? CATEGORIES[currentPromptData.category as CategoryKey]?.gradient || ["#8B5CF6", "#7C3AED"] : ["#8B5CF6", "#7C3AED"];
    const timerColor = gameState.timerSeconds <= 5 ? "#EF4444" : "#10B981";
    const hot = isHotPrompt(currentPrompt);

    return (
      <GestureHandlerRootView style={styles.screen}>
        <LinearGradient colors={[catColor + "15", "#000000"]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />

        {/* Header */}
        <View style={styles.playHeader}>
          <TouchableOpacity onPress={resetGame} style={styles.playBackBtn}><Ionicons name="close" size={20} color="#FFF" /></TouchableOpacity>
          <View style={styles.playRoundBadge}><Text style={styles.playRoundText}>Round {gameState.round}</Text></View>
          <TouchableOpacity onPress={sharePrompt} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: catColor }]} />
          </View>
          <Text style={styles.playCount}>{current + 1}/{total}</Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsArea}>
          <Animated.View style={[styles.promptCard, styles.nextPromptCard, nextCardAnimStyle]}>
            <Text style={styles.promptText} numberOfLines={5}>{nextPrompt}</Text>
          </Animated.View>

          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.promptCard, cardStyle]}>
              <LinearGradient colors={[catGradient[0] + "20", "transparent"]} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

              {/* Hot Badge */}
              {hot && (
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>🔥 HOT</Text>
                </View>
              )}

              {currentPromptData && (
                <View style={[styles.promptCatBadge, { backgroundColor: catColor + "30" }]}>
                  <Text style={styles.promptCatText}>{CATEGORIES[currentPromptData.category as CategoryKey]?.emoji}</Text>
                </View>
              )}

              <Text style={styles.promptText}>{currentPrompt}</Text>

              {gameState.timerActive && (
                <View style={styles.timerWrap}>
                  <Animated.Text style={[styles.timerNum, timerTextStyle, { color: timerColor }]}>{gameState.timerSeconds}</Animated.Text>
                  <View style={styles.timerTrack}>
                    <Animated.View style={[styles.timerFill, timerBarStyle, { backgroundColor: timerColor }]} />
                  </View>
                </View>
              )}

              <Text style={styles.swipeHint}>← Swipe →</Text>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Action Buttons */}
        <View style={styles.playFooter}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.quickRateBtn} onPress={() => { setLastPromptForRating(currentPrompt); handleRating("skull"); handleNext(); }}>
              <Text style={styles.quickRateEmoji}>💀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
              <LinearGradient colors={catGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextBtnGradient}>
                <Text style={styles.nextBtnText}>Next</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickRateBtn} onPress={() => { setLastPromptForRating(currentPrompt); handleRating("fire"); handleNext(); }}>
              <Text style={styles.quickRateEmoji}>🔥</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rating Popup */}
        <RatingPopup visible={showRating} onRate={handleRating} promptText={lastPromptForRating} />
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
    const winner = players[0];
    return (
      <View style={styles.screen}>
        <LinearGradient colors={["#FFD70020", "#000"]} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <Animated.Text entering={FadeInDown.springify()} style={styles.resultsTitle}>Game Over</Animated.Text>

          {winner && (
            <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.winnerCard}>
              <Animated.Text entering={BounceIn.delay(400)} style={styles.winnerEmoji}>👑</Animated.Text>
              <Text style={styles.winnerLabel}>CHAMPION</Text>
              <Text style={styles.winnerName}>{winner.avatar} {winner.name}</Text>
            </Animated.View>
          )}

          {/* Share Results */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.shareResultsWrap}>
            <TouchableOpacity style={styles.shareResultsBtn} onPress={sharePrompt} activeOpacity={0.9}>
              <LinearGradient colors={["#EC4899", "#8B5CF6"]} style={styles.shareResultsGradient}>
                <Ionicons name="share-social" size={20} color="#FFF" />
                <Text style={styles.shareResultsText}>Share Game</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.resultsList}>
            {players.map((p, i) => (
              <Animated.View key={i} entering={SlideInRight.delay(300 + i * 80).springify()} style={styles.resultRow}>
                <Text style={styles.resultRank}>{i + 1}</Text>
                <Text style={styles.resultAvatar}>{p.avatar}</Text>
                <Text style={styles.resultName}>{p.name}</Text>
              </Animated.View>
            ))}
          </View>

          <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame} activeOpacity={0.9}>
            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.playAgainGradient}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
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
            <Animated.View
              entering={FadeInUp.delay(index * 40).duration(200).springify()}
              exiting={SlideOutLeft.duration(150)}
              layout={Layout.springify().damping(18).stiffness(200)}
              style={styles.dialogPlayer}
            >
              <View style={styles.playerAvatarWrap}>
                <Text style={styles.playerAvatar}>{item.avatar}</Text>
              </View>
              <Text style={styles.dialogPlayerText}>{item.name}</Text>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removePlayer(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </Animated.View>
          )}
          style={styles.dialogList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>No players yet</Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.doneBtn} onPress={() => setIsAddPlayerVisible(false)} activeOpacity={0.9}>
          <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.doneBtnGradient}>
            <Text style={styles.doneBtnText}>Done</Text>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </SlideDownPanel>

      {/* Hidden Share Card for capture */}
      {currentPromptData && (
        <View style={styles.hiddenShareCard}>
          <ShareCard
            ref={shareCardRef}
            prompt={currentPrompt}
            category={currentPromptData.category as CategoryKey}
            players={players}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  inner: { flex: 1, maxWidth: Platform.OS === "web" ? MAX_WIDTH : "100%", width: "100%", alignSelf: "center" },
  screen: { flex: 1, backgroundColor: "#000" },
  scrollContent: { flex: 1 },
  bgOrbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },

  // Live Stats
  liveStats: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginRight: 8 },
  liveText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "600" },

  // Setup
  setupContent: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: "center", marginTop: 40, marginBottom: 20 },
  heroTitle: { fontSize: 64, fontWeight: "900", color: "#FFF", letterSpacing: 8, textShadowColor: "#8B5CF6", textShadowRadius: 40 },
  heroSub: { fontSize: 16, color: "rgba(255,255,255,0.5)", marginTop: 8, letterSpacing: 2 },

  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, marginBottom: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
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
  modeIndicator: { width: 48, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", paddingHorizontal: 3 },
  modeIndicatorActive: { backgroundColor: "#EC4899" },

  sliderCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sliderLabel: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  chaosValueBadge: { backgroundColor: "#8B5CF6", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  chaosValue: { fontSize: 15, fontWeight: "800", color: "#FFF" },
  sliderTrack: { marginHorizontal: -8 },
  slider: { width: "100%", height: 40 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  sliderLabelText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600" },

  startButton: { borderRadius: 20, overflow: "hidden" },
  startButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, paddingHorizontal: 32 },
  startButtonText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  // Categories
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

  // Playing
  playHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  playBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  playRoundBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  playRoundText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },

  progressWrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 8, gap: 12 },
  progressTrack: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  playCount: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", minWidth: 40, textAlign: "right" },

  cardsArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  promptCard: { width: "100%", aspectRatio: 0.85, backgroundColor: "#111", borderRadius: 24, padding: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", position: "absolute" },
  nextPromptCard: { zIndex: 0 },
  promptCatBadge: { position: "absolute", top: 16, left: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  promptCatText: { fontSize: 18 },
  promptText: { fontSize: 24, fontWeight: "700", color: "#FFF", textAlign: "center", lineHeight: 34 },
  swipeHint: { position: "absolute", bottom: 20, fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: "600", letterSpacing: 2 },

  // Hot Badge
  hotBadge: { position: "absolute", top: 16, right: 16, backgroundColor: "#EF4444", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  hotBadgeText: { fontSize: 11, fontWeight: "800", color: "#FFF" },

  timerWrap: { position: "absolute", bottom: 50, left: 24, right: 24, alignItems: "center" },
  timerNum: { fontSize: 48, fontWeight: "900", marginBottom: 8 },
  timerTrack: { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  timerFill: { height: "100%", borderRadius: 3 },

  playFooter: { padding: 16, paddingBottom: 32 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  quickRateBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  quickRateEmoji: { fontSize: 24 },
  nextBtn: { flex: 1, borderRadius: 20, overflow: "hidden" },
  nextBtnGradient: { paddingVertical: 18, alignItems: "center" },
  nextBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  // Rating Popup
  ratingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center", zIndex: 100 },
  ratingCard: { backgroundColor: "#1A1A1A", borderRadius: 24, padding: 24, width: "85%", maxWidth: 340, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  ratingTitle: { fontSize: 20, fontWeight: "800", color: "#FFF", marginBottom: 12 },
  ratingPrompt: { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  ratingButtons: { flexDirection: "row", gap: 16, marginBottom: 16 },
  ratingBtn: { width: 100, height: 100, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  fireBtn: { backgroundColor: "rgba(239,68,68,0.2)", borderWidth: 2, borderColor: "#EF4444" },
  skullBtn: { backgroundColor: "rgba(139,92,246,0.2)", borderWidth: 2, borderColor: "#8B5CF6" },
  ratingEmoji: { fontSize: 40, marginBottom: 8 },
  ratingLabel: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  skipText: { fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: "600" },

  // Round End
  roundEndContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  roundEndEmoji: { fontSize: 80, marginBottom: 24 },
  roundEndTitle: { fontSize: 36, fontWeight: "800", color: "#FFF", marginBottom: 8 },
  roundEndSub: { fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 48 },
  continueBtn: { borderRadius: 20, overflow: "hidden", width: "100%" },
  continueBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, gap: 8 },
  continueBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  // Results
  resultsContent: { padding: 24, paddingTop: 48, alignItems: "center" },
  resultsTitle: { fontSize: 42, fontWeight: "900", color: "#FFF", marginBottom: 32 },
  winnerCard: { backgroundColor: "rgba(255,215,0,0.1)", borderWidth: 2, borderColor: "rgba(255,215,0,0.3)", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", marginBottom: 24 },
  winnerEmoji: { fontSize: 64, marginBottom: 16 },
  winnerLabel: { fontSize: 12, color: "rgba(255,215,0,0.7)", fontWeight: "700", letterSpacing: 3, marginBottom: 8 },
  winnerName: { fontSize: 28, fontWeight: "800", color: "#FFD700" },
  shareResultsWrap: { width: "100%", marginBottom: 24 },
  shareResultsBtn: { borderRadius: 16, overflow: "hidden" },
  shareResultsGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  shareResultsText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  resultsList: { width: "100%", gap: 12, marginBottom: 32 },
  resultRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, gap: 16 },
  resultRank: { fontSize: 16, fontWeight: "800", color: "rgba(255,255,255,0.4)", width: 24 },
  resultAvatar: { fontSize: 24 },
  resultName: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  playAgainBtn: { borderRadius: 20, overflow: "hidden", width: "100%" },
  playAgainGradient: { paddingVertical: 18, alignItems: "center" },
  playAgainText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  // Share Card (hidden)
  hiddenShareCard: { position: "absolute", left: -9999, top: -9999 },
  shareCard: { width: 350, height: 450, borderRadius: 24, overflow: "hidden" },
  shareCardContent: { flex: 1, padding: 24, justifyContent: "space-between" },
  shareCardBrand: { fontSize: 24, fontWeight: "900", color: "#FFF", letterSpacing: 4, opacity: 0.8 },
  shareCardEmoji: { fontSize: 64, textAlign: "center" },
  shareCardPrompt: { fontSize: 28, fontWeight: "800", color: "#FFF", textAlign: "center", lineHeight: 38 },
  shareCardFooter: { alignItems: "center" },
  shareCardPlayers: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 },
  shareCardCTA: { fontSize: 14, fontWeight: "700", color: "#FFF" },

  // Dialog - Dark Premium Theme
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
});
