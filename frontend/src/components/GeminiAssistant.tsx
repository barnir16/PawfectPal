import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChatMessage } from '../types';
import { ApiKeyManager } from '../utils/ApiKeyManager';

interface GeminiAssistantProps {
  pets?: any[];
}

export default function GeminiAssistant({ pets }: GeminiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        text: "Hello! I'm your PawfectPal AI assistant. Ask me anything about pet care, health, training, or behavior!",
        isUser: false,
      },
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      text: inputText.trim(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // In a real app, you'd call the Gemini API here
      // For now, we'll simulate a response
      await simulateGeminiResponse(inputText.trim());
    } catch (error) {
      Alert.alert('Error', 'Failed to get response from AI assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateGeminiResponse = async (userInput: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    let response = '';
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('vaccine') || lowerInput.includes('vaccination')) {
      response = "Vaccinations are crucial for your pet's health! Here's what you need to know:\n\n" +
        "• Core vaccines for dogs: Rabies, DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)\n" +
        "• Core vaccines for cats: FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)\n" +
        "• Puppies/kittens need a series of shots starting at 6-8 weeks\n" +
        "• Adult pets need boosters every 1-3 years\n\n" +
        "Always consult your veterinarian for a personalized vaccination schedule!";
    } else if (lowerInput.includes('diet') || lowerInput.includes('food') || lowerInput.includes('nutrition')) {
      response = "Proper nutrition is essential for your pet's health!\n\n" +
        "General guidelines:\n" +
        "• Choose high-quality, age-appropriate food\n" +
        "• Follow feeding guidelines on the package\n" +
        "• Provide fresh water at all times\n" +
        "• Avoid human food, especially toxic items like chocolate, grapes, onions\n" +
        "• Consider your pet's activity level and health conditions\n\n" +
        "Consult your vet for specific dietary recommendations!";
    } else if (lowerInput.includes('exercise') || lowerInput.includes('activity')) {
      response = "Exercise is vital for your pet's physical and mental health!\n\n" +
        "Dogs:\n" +
        "• Daily walks (30-60 minutes for most breeds)\n" +
        "• Play sessions with toys\n" +
        "• Training exercises\n\n" +
        "Cats:\n" +
        "• Interactive play with toys\n" +
        "• Climbing structures\n" +
        "• Hunting games\n\n" +
        "Adjust activity level based on your pet's age, breed, and health!";
    } else if (lowerInput.includes('grooming')) {
      response = "Regular grooming keeps your pet healthy and comfortable!\n\n" +
        "Dogs:\n" +
        "• Brush regularly (frequency depends on coat type)\n" +
        "• Bathe every 4-8 weeks\n" +
        "• Trim nails monthly\n" +
        "• Clean ears weekly\n\n" +
        "Cats:\n" +
        "• Most cats groom themselves\n" +
        "• Brush long-haired cats daily\n" +
        "• Check for mats and tangles\n\n" +
        "Start grooming early to make it a positive experience!";
    } else {
      response = "That's a great question about pet care! While I can provide general advice, " +
        "it's always best to consult with your veterinarian for specific concerns about your pet's health. " +
        "They can provide personalized recommendations based on your pet's age, breed, health history, and current condition. " +
        "Is there anything specific about pet care you'd like to know more about?";
    }

    const assistantMessage: ChatMessage = {
      text: response,
      isUser: false,
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isUser ? styles.userMessageText : styles.assistantMessageText
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>Ask me anything about pet care!</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about pet care, health, training..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 