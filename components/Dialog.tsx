import React, { useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ThemedView } from "./ThemedView";
import { Button } from "./Button";

interface DialogProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
}

export function Dialog({ trigger, content }: DialogProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {React.cloneElement(trigger as React.ReactElement, {
        onPress: () => setIsVisible(true),
      })}
      <Modal
        transparent={true}
        visible={isVisible}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <ThemedView style={styles.modalView}>
                {content}
                <Button
                  title="Close"
                  onPress={() => setIsVisible(false)}
                  variant="ghost"
                />
              </ThemedView>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalView: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: "#FFFFFF",
    width: "80%",
    maxWidth: 400,
  },
});
