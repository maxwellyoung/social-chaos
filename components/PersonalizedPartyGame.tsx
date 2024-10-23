import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Button } from "./Button";
import { Select } from "./Select";
import { SlideDownPanel } from "./SlideDownPanel";
import { Ionicons } from "@expo/vector-icons";

// Import prompts
import drinkingPrompts from "../assets/prompts/drinking.json";
import chillPrompts from "../assets/prompts/chill.json";
import sexyPrompts from "../assets/prompts/sexy.json";

type Player = {
  name: string;
  avatar: string;
};

type ThemePack = "drinking" | "chill" | "sexy";

type Prompts = {
  playerSpecific: string[];
};

const allPrompts: Record<ThemePack, Prompts> = {
  drinking: drinkingPrompts,
  chill: chillPrompts,
  sexy: sexyPrompts,
};

export function PersonalizedPartyGame() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameState, setGameState] = useState<"setup" | "playing">("setup");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [themePack, setThemePack] = useState<ThemePack>("drinking");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const colorScheme = useColorScheme();
  const [prompts, setPrompts] = useState<string[]>([]);
  const shouldUpdatePromptRef = useRef(true);

  // Combine player-specific prompts
  const getAllPrompts = (): string[] => {
    const { playerSpecific } = allPrompts[themePack];
    // Shuffle all player-specific prompts
    return shuffleArray([...playerSpecific]);
  };

  useEffect(() => {
    // Load prompts when theme changes or game resets
    const loadedPrompts = getAllPrompts();
    setPrompts(loadedPrompts);
  }, [themePack, gameState]);

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

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const startGame = () => {
    if (players.length < 2) {
      Alert.alert("Error", "Please add at least 2 players to start the game.");
      return;
    }
    setGameState("playing");
  };

  // Function to get a random player, optionally excluding one player
  const getRandomPlayer = (excludePlayer?: string): string => {
    const availablePlayers = players.filter((p) => p.name !== excludePlayer);
    if (availablePlayers.length === 0) return "another player";
    return availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
      .name;
  };

  // Function to replace placeholders with random players
  const replacePlaceholders = (prompt: string): string => {
    let modifiedPrompt = prompt;

    // Randomly select player1
    const player1 = players[Math.floor(Math.random() * players.length)].name;
    modifiedPrompt = modifiedPrompt.replace("{player1}", player1);

    // Randomly select player2, excluding player1
    const player2 = getRandomPlayer(player1);
    modifiedPrompt = modifiedPrompt.replace("{player2}", player2);

    return modifiedPrompt;
  };

  const selectNextPrompt = useCallback(() => {
    if (prompts.length === 0) {
      return "No prompts available.";
    }
    const randomIndex = Math.floor(Math.random() * prompts.length);
    const prompt = prompts[randomIndex];
    const replacedPrompt = replacePlaceholders(prompt);

    setPrompts((prevPrompts) => {
      const newPrompts = [...prevPrompts];
      newPrompts.splice(randomIndex, 1);
      return newPrompts;
    });

    return replacedPrompt;
  }, [prompts, players]);

  useEffect(() => {
    if (shouldUpdatePromptRef.current && gameState === "playing") {
      const newPrompt = selectNextPrompt();
      setCurrentPrompt(newPrompt);
      shouldUpdatePromptRef.current = false;
    }
  }, [gameState, selectNextPrompt]);

  const nextPrompt = useCallback(() => {
    shouldUpdatePromptRef.current = true;
    const newPrompt = selectNextPrompt();
    setCurrentPrompt(newPrompt);
  }, [selectNextPrompt]);

  const addCustomPrompt = () => {
    if (customPrompt.trim()) {
      const newPrompt = customPrompt.trim();
      setPrompts((prevPrompts) => shuffleArray([...prevPrompts, newPrompt]));
      setCustomPrompt("");
    }
  };

  const shuffleArray = (array: string[]) =>
    array.sort(() => Math.random() - 0.5);

  const exitGame = () => {
    setGameState("setup");
    setCurrentPrompt("");
    // Reload prompts to reset
    setPrompts(getAllPrompts());
  };

  const getThemeEmoji = (theme: ThemePack): string => {
    switch (theme) {
      case "drinking":
        return "🥂";
      case "chill":
        return "😎";
      case "sexy":
        return "💋";
      default:
        return "";
    }
  };

  const renderSetupContent = () => (
    <View style={styles.setupContainer}>
      <ThemedText
        type="title"
        style={styles.title}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        SOCIAL CHAOS
      </ThemedText>
      <View style={styles.setupControls}>
        <Button
          title="Add Players"
          onPress={() => setIsAddPlayerVisible(true)}
          variant="accent"
        />
        <Select<ThemePack>
          options={[
            {
              label: `Drinking Mode ${getThemeEmoji("drinking")}`,
              value: "drinking",
            },
            { label: `Chill Mode ${getThemeEmoji("chill")}`, value: "chill" },
            { label: `Sexy Mode ${getThemeEmoji("sexy")}`, value: "sexy" },
          ]}
          onValueChange={(value: ThemePack) => setThemePack(value)}
          placeholder="Select Theme Pack"
          value={themePack}
        />
        <Button title="Start Game" onPress={startGame} variant="accent" />
      </View>
      <FlatList
        data={players}
        renderItem={({ item, index }) => (
          <View style={styles.playerItem}>
            <ThemedText style={styles.playerName}>{item.name}</ThemedText>
            <TouchableOpacity onPress={() => removePlayer(index)}>
              <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        ListFooterComponent={<View style={{ height: 20 }} />}
        contentContainerStyle={styles.playerList}
      />
    </View>
  );

  const renderPlayingContent = () => (
    <View style={styles.playingContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={exitGame} style={styles.exitButton}>
          <Ionicons
            name="close"
            size={24}
            color={colorScheme === "dark" ? "#FFFFFF" : "#8E8E93"}
          />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.gameMode}>
          {themePack === "drinking"
            ? `Drinking Mode ${getThemeEmoji("drinking")}`
            : themePack === "chill"
            ? `Chill Mode ${getThemeEmoji("chill")}`
            : `Sexy Mode ${getThemeEmoji("sexy")}`}
        </ThemedText>
      </View>
      <View style={styles.promptContainer}>
        <ThemedText type="title" style={styles.prompt}>
          {currentPrompt || "Press 'Next' to start"}
        </ThemedText>
      </View>
      <View style={styles.customPromptContainer}>
        <TextInput
          value={customPrompt}
          onChangeText={setCustomPrompt}
          placeholder="Enter a custom prompt"
          style={styles.input}
          placeholderTextColor={colorScheme === "dark" ? "#8E8E93" : "#8E8E93"}
        />
        <Button title="Add" onPress={addCustomPrompt} variant="accent" />
      </View>
      <Button title="Next" onPress={nextPrompt} variant="accent" />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {gameState === "setup" ? renderSetupContent() : renderPlayingContent()}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  setupContainer: {
    paddingTop: 60,
    paddingBottom: 32,
  },
  title: {
    // Removed fontFamily since AuthenticSans60 is no longer used
    fontSize: 48,
    fontWeight: "700",
    marginTop: 48,
    marginBottom: 48,
    textAlign: "center",
    lineHeight: 52,
    color: "#000000", // Ensure text color is set appropriately
  },
  setupControls: {
    width: "100%",
    gap: 24,
    alignSelf: "center",
  },
  playerList: {
    width: "100%",
    marginTop: 32,
  },
  dialogTitle: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
    color: "#000000", // Ensure text color is set appropriately
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    fontSize: 18,
    color: "#000000",
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  playerName: {
    fontSize: 20,
    color: "#000000",
  },
  playingContainer: {
    flex: 1,
    paddingVertical: 32,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  exitButton: {
    position: "absolute",
    left: 0,
    padding: 12,
  },
  gameMode: {
    fontSize: 28,
    fontWeight: "600",
    color: "#000000",
  },
  promptContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
    backgroundColor: "#F5F5F5",
  },
  prompt: {
    fontSize: 24,
    textAlign: "center",
    color: "#333333",
  },
  customPromptContainer: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "center",
  },
  addPlayerForm: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
});
