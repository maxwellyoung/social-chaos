import React, { useState, useEffect } from "react";
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

type Player = {
  name: string;
  avatar: string;
};

type ThemePack = "drinking" | "chill" | "sexy";

const initialPrompts = {
  drinking: [
    "Take a sip if you've ever ghosted someone!",
    "Drink for each time you've been in love.",
    "The person with the most exes drinks twice.",
    "Waterfall! Start with the oldest player and end with the youngest.",
    "Categories: Name types of alcohol. Loser drinks!",
    "Never have I ever... (take turns, drinkers take a sip)",
    "Truth or dare? Refuse and take two shots.",
    "The tallest person assigns 3 sips.",
    "Drink if you've ever skinny dipped.",
    "Last person to touch their nose drinks.",
    "Drink for each tattoo you have.",
    "Anyone wearing red drinks.",
    "If you've ever been in a fist fight, take 2 sips.",
    "Drink if you've ever lied to get out of work.",
    "Everyone vote on who's most likely to become famous. They drink!",
    "Drink if you've ever been on TV.",
    "The person with the longest hair assigns 4 sips.",
    "Drink for each sibling you have.",
    "If you've ever broken a bone, take a shot.",
    "Drink if you've ever been in handcuffs (any reason!).",
    // Add more drinking prompts here...
  ],
  chill: [
    "Share your most embarrassing childhood memory.",
    "If you could have dinner with any historical figure, who and why?",
    "What's the best piece of advice you've ever received?",
    "Describe your perfect day from start to finish.",
    "If you could instantly master one skill, what would it be?",
    "What's your biggest irrational fear?",
    "Share a moment when you were proudest of yourself.",
    "If you could live in any fictional world, which one and why?",
    "What's the most spontaneous thing you've ever done?",
    "Describe your ideal superpower and how you'd use it.",
    "What's a small act of kindness you'll never forget?",
    "If you could relive one day of your life, which would it be?",
    "What's the strangest dream you've ever had?",
    "Share a life goal you haven't told many people about.",
    "If you could change one thing about the world, what would it be?",
    "What's the most valuable life lesson you've learned so far?",
    "Describe your first crush and what attracted you to them.",
    "If you could have a conversation with your future self, what would you ask?",
    "What's a book or movie that changed your perspective on life?",
    "Share a tradition from your family or culture that's important to you.",
    // Add more chill prompts here...
  ],
  sexy: [
    "What's your biggest turn-on?",
    "Describe your wildest fantasy.",
    "What's the most daring place you've hooked up?",
    "Share your sexiest non-physical trait in a partner.",
    "What's your favorite foreplay activity?",
    "Demonstrate your best seductive dance move.",
    "What's the most unusual place you'd like to have sex?",
    "Share a sexy secret you've never told anyone.",
    "What's your favorite body part on yourself? On a partner?",
    "Describe your perfect romantic evening.",
    "What's the sexiest outfit you own?",
    "Share your favorite position and why you love it.",
    "What's the hottest thing someone's ever said to you?",
    "If you could have a celebrity join you in bed, who would it be?",
    "What's your biggest sexual regret?",
    "Describe the perfect kiss in detail.",
    "What's your opinion on friends with benefits?",
    "Share a sexual bucket list item.",
    "What's the most embarrassing thing that's happened to you during sex?",
    "If you had to use a food item during foreplay, what would it be?",
    // Add more sexy prompts here...
  ],
};

export function PersonalizedPartyGame() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameState, setGameState] = useState<"setup" | "playing">("setup");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [themePack, setThemePack] = useState<ThemePack>("drinking");
  const [customPrompt, setCustomPrompt] = useState("");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [prompts, setPrompts] = useState(initialPrompts);
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (gameState === "playing") {
      nextPrompt();
    }
  }, [gameState]);

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

  const getRandomPlayer = (excludePlayer?: string) => {
    const availablePlayers = players.filter((p) => p.name !== excludePlayer);
    return availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
      .name;
  };

  const nextPrompt = () => {
    const currentPrompts = prompts[themePack];
    const randomIndex = Math.floor(Math.random() * currentPrompts.length);
    let prompt = currentPrompts[randomIndex];

    const currentPlayer = players[currentPlayerIndex].name;
    prompt = prompt.replace("{player1}", currentPlayer);
    prompt = prompt.replace("{player2}", getRandomPlayer(currentPlayer));

    setCurrentPrompt(prompt);
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  };

  const addCustomPrompt = () => {
    if (customPrompt.trim()) {
      setPrompts((prevPrompts) => ({
        ...prevPrompts,
        [themePack]: [...prevPrompts[themePack], customPrompt.trim()],
      }));
      setCustomPrompt("");
    }
  };

  const exitGame = () => {
    setGameState("setup");
    setCurrentPrompt("");
    setCurrentPlayerIndex(0);
  };

  const getThemeEmoji = (theme: ThemePack) => {
    switch (theme) {
      case "drinking":
        return "🥂";
      case "chill":
        return "😎";
      case "sexy":
        return "💋";
    }
  };

  const renderSetupContent = () => (
    <View style={styles.setupContainer}>
      <ThemedText type="title" style={styles.title}>
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
        {gameState === "setup" ? (
          <FlatList
            ListHeaderComponent={renderSetupContent}
            data={players}
            renderItem={({ item, index }) => (
              <View style={styles.playerItem}>
                <ThemedText style={styles.playerName}>{item.name}</ThemedText>
                <TouchableOpacity onPress={() => removePlayer(index)}>
                  <Ionicons
                    name="close-circle-outline"
                    size={24}
                    color="#FF3B30"
                  />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
            ListFooterComponent={<View style={{ height: 20 }} />}
            contentContainerStyle={styles.playerList}
          />
        ) : (
          renderPlayingContent()
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
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 48,
    textAlign: "center",
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
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    fontSize: 18,
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
  },
  promptContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
  },
  prompt: {
    fontSize: 32,
    textAlign: "center",
  },
  customPromptContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  addPlayerForm: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
});
