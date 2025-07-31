import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { LocaleHelper } from '../utils/LocaleHelper';
import { NotificationHelper } from '../utils/NotificationHelper';
import { ApiKeyManager } from '../utils/ApiKeyManager';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [language, setLanguage] = useState('en');
  const [petsApiKey, setPetsApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const currentLanguage = LocaleHelper.getCurrentLanguage();
    const currentDarkMode = LocaleHelper.getDarkModeSetting();
    const currentPetsApiKey = ApiKeyManager.petsApiKey || '';
    const currentGeminiApiKey = ApiKeyManager.geminiApiKey || '';

    setLanguage(currentLanguage);
    setDarkMode(currentDarkMode === 'dark');
    setPetsApiKey(currentPetsApiKey);
    setGeminiApiKey(currentGeminiApiKey);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    const mode = value ? 'dark' : 'light';
    LocaleHelper.setDarkModeSetting(mode);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await NotificationHelper.enableNotifications();
      if (!granted) {
        Alert.alert('Permission Denied', 'Please enable notifications in your browser settings.');
        return;
      }
    }
    setNotifications(value);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    LocaleHelper.setNewLocale(newLanguage);
  };

  const handleSaveApiKey = (type: 'pets' | 'gemini') => {
    const key = type === 'pets' ? petsApiKey : geminiApiKey;
    if (type === 'pets') {
      ApiKeyManager.petsApiKey = key;
    } else {
      ApiKeyManager.geminiApiKey = key;
    }
    Alert.alert('Success', 'API key saved successfully!');
  };

  const showLanguageDialog = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        { text: 'English', onPress: () => handleLanguageChange('en') },
        { text: 'עברית', onPress: () => handleLanguageChange('iw') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notifications ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkMode ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          <TouchableOpacity style={styles.settingRow} onPress={showLanguageDialog}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingValue}>{language === 'en' ? 'English' : 'עברית'}</Text>
          </TouchableOpacity>
        </View>

        {/* API Keys */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Keys</Text>
          
          <View style={styles.apiKeySection}>
            <Text style={styles.apiKeyLabel}>The Dog API Key</Text>
            <TextInput
              style={styles.apiKeyInput}
              value={petsApiKey}
              onChangeText={setPetsApiKey}
              placeholder="Enter your API key"
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveApiKey('pets')}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.apiKeySection}>
            <Text style={styles.apiKeyLabel}>Gemini API Key</Text>
            <TextInput
              style={styles.apiKeyInput}
              value={geminiApiKey}
              onChangeText={setGeminiApiKey}
              placeholder="Enter your API key"
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveApiKey('gemini')}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            PawfectPal v1.0.0{'\n'}
            Your comprehensive pet care companion
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  apiKeySection: {
    marginBottom: 20,
  },
  apiKeyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 