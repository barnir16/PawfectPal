import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Pet } from './types';
import { createPet, updatePet, getDogBreedInfo, getCatBreedInfo } from './api';
import { StorageHelper } from './utils/StorageHelper';

interface PetFormProps {
  pet?: Pet; // For editing existing pet
  onPetCreated?: () => void;
  onPetUpdated?: () => void;
}

export default function PetForm({ pet, onPetCreated, onPetUpdated }: PetFormProps) {
  const [formData, setFormData] = useState({
    name: pet?.name || '',
    breedType: pet?.breedType || 'dog',
    breed: pet?.breed || '',
    birthDate: pet?.birthDate || '',
    weightKg: pet?.weightKg?.toString() || '',
    healthIssues: pet?.healthIssues?.join(', ') || '',
    behaviorIssues: pet?.behaviorIssues?.join(', ') || '',
    isBirthdayGiven: pet?.isBirthdayGiven || false,
  });

  const [loading, setLoading] = useState(false);
  const [breedSuggestions, setBreedSuggestions] = useState<string[]>([]);

  const breedTypes = [
    { label: 'Dog', value: 'dog' },
    { label: 'Cat', value: 'cat' },
    { label: 'Other', value: 'other' },
  ];

  const dogBreeds = [
    'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog',
    'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Dachshund', 'Yorkshire Terrier',
    'Boxer', 'Great Dane', 'Siberian Husky', 'Doberman', 'Shih Tzu', 'Bernese Mountain Dog'
  ];

  const catBreeds = [
    'Persian', 'Maine Coon', 'Siamese', 'British Shorthair', 'Ragdoll',
    'Abyssinian', 'Sphynx', 'Russian Blue', 'Bengal', 'American Shorthair',
    'Norwegian Forest', 'Scottish Fold', 'Oriental Shorthair', 'Exotic Shorthair'
  ];

  useEffect(() => {
    if (formData.breedType === 'dog') {
      setBreedSuggestions(dogBreeds);
    } else if (formData.breedType === 'cat') {
      setBreedSuggestions(catBreeds);
    } else {
      setBreedSuggestions([]);
    }
  }, [formData.breedType]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Pet name is required');
      return false;
    }
    if (!formData.breed.trim()) {
      Alert.alert('Error', 'Breed is required');
      return false;
    }
    if (formData.weightKg && parseFloat(formData.weightKg) <= 0) {
      Alert.alert('Error', 'Weight must be a positive number');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const petData: Omit<Pet, 'id'> = {
        name: formData.name.trim(),
        breedType: formData.breedType,
        breed: formData.breed.trim(),
        birthDate: formData.birthDate || undefined,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        healthIssues: formData.healthIssues ? formData.healthIssues.split(',').map(s => s.trim()).filter(Boolean) : [],
        behaviorIssues: formData.behaviorIssues ? formData.behaviorIssues.split(',').map(s => s.trim()).filter(Boolean) : [],
        isBirthdayGiven: formData.isBirthdayGiven,
        isTrackingEnabled: false,
      };

      if (pet?.id) {
        // Update existing pet
        await updatePet(pet.id, petData);
        Alert.alert('Success', 'Pet updated successfully!');
        onPetUpdated?.();
      } else {
        // Create new pet
        await createPet(petData);
        Alert.alert('Success', 'Pet created successfully!');
        onPetCreated?.();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save pet');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(ageInYears);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>
          {pet ? 'Edit Pet' : 'Add New Pet'}
        </Text>

        <View style={styles.form}>
          {/* Pet Name */}
          <Text style={styles.label}>Pet Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter pet name"
          />

          {/* Pet Type */}
          <Text style={styles.label}>Pet Type *</Text>
          <View style={styles.radioGroup}>
            {breedTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.radioButton,
                  formData.breedType === type.value && styles.radioButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, breedType: type.value })}
              >
                <Text style={[
                  styles.radioButtonText,
                  formData.breedType === type.value && styles.radioButtonTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Breed */}
          <Text style={styles.label}>Breed *</Text>
          <TextInput
            style={styles.input}
            value={formData.breed}
            onChangeText={(text) => setFormData({ ...formData, breed: text })}
            placeholder="Enter breed"
          />

          {/* Breed Suggestions */}
          {breedSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Popular {formData.breedType} breeds:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {breedSuggestions.map((breed) => (
                  <TouchableOpacity
                    key={breed}
                    style={styles.suggestionButton}
                    onPress={() => setFormData({ ...formData, breed })}
                  >
                    <Text style={styles.suggestionText}>{breed}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Birth Date */}
          <Text style={styles.label}>Birth Date</Text>
          <TextInput
            style={styles.input}
            value={formData.birthDate}
            onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
            placeholder="YYYY-MM-DD"
          />
          {formData.birthDate && calculateAge(formData.birthDate) !== null && (
            <Text style={styles.ageText}>
              Age: {calculateAge(formData.birthDate)} years old
            </Text>
          )}

          {/* Weight */}
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.weightKg}
            onChangeText={(text) => setFormData({ ...formData, weightKg: text })}
            placeholder="Enter weight in kg"
            keyboardType="numeric"
          />

          {/* Health Issues */}
          <Text style={styles.label}>Health Issues</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.healthIssues}
            onChangeText={(text) => setFormData({ ...formData, healthIssues: text })}
            placeholder="Enter health issues (comma separated)"
            multiline
            numberOfLines={3}
          />

          {/* Behavior Issues */}
          <Text style={styles.label}>Behavior Issues</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.behaviorIssues}
            onChangeText={(text) => setFormData({ ...formData, behaviorIssues: text })}
            placeholder="Enter behavior issues (comma separated)"
            multiline
            numberOfLines={3}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : (pet ? 'Update Pet' : 'Add Pet')}
            </Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
    color: '#333',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  radioButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  radioButtonText: {
    fontSize: 14,
    color: '#333',
  },
  radioButtonTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  suggestionButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  suggestionText: {
    fontSize: 12,
    color: '#2196f3',
  },
  ageText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 