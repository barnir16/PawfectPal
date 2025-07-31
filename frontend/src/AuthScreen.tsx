import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { login, register } from './api';
import { StorageHelper } from './utils/StorageHelper';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

/**
 * Authentication screen for login and registration
 * Handles user authentication with proper error handling and validation
 */
export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Validate input fields
   */
  const validateInputs = (): boolean => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    
    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return false;
    }
    
    return true;
  };

  /**
   * Handle authentication (login or register)
   */
  const handleAuth = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const response = await login(username.trim(), password);
        // Store token using AsyncStorage
        await StorageHelper.setItem('authToken', response.access_token);
        onLoginSuccess();
      } else {
        await register(username.trim(), password);
        Alert.alert(
          'Success', 
          'Registration successful! Please login with your new account.', 
          [
            { 
              text: 'OK', 
              onPress: () => {
                setIsLogin(true);
                setPassword(''); // Clear password for login
              }
            }
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Authentication failed. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission on Enter key
   */
  const handleSubmitEditing = () => {
    if (!loading) {
      handleAuth();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>PawfectPal</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => {
                // Focus password input
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmitEditing}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? 'Login' : 'Register'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setPassword(''); // Clear password when switching
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
}); 