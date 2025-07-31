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
import { Task, Pet, Vaccine } from './types';
import { createTask, getPets, getVaccines } from './api';

interface TaskFormProps {
  task?: Task; // For editing existing task
  onTaskCreated?: () => void;
  onTaskUpdated?: () => void;
}

export default function TaskForm({ task, onTaskCreated, onTaskUpdated }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dateTime: task?.dateTime || new Date().toISOString().slice(0, 16),
    repeatInterval: task?.repeatInterval?.toString() || '',
    repeatUnit: task?.repeatUnit || '',
    selectedPetIds: task?.petIds || [],
  });

  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVaccineSuggestions, setShowVaccineSuggestions] = useState(false);

  const repeatUnits = [
    { label: 'Days', value: 'days' },
    { label: 'Weeks', value: 'weeks' },
    { label: 'Months', value: 'months' },
    { label: 'Years', value: 'years' },
  ];

  useEffect(() => {
    fetchPets();
    fetchVaccines();
  }, []);

  const fetchPets = async () => {
    try {
      const fetchedPets = await getPets();
      setPets(fetchedPets);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const fetchVaccines = async () => {
    try {
      const fetchedVaccines = await getVaccines();
      setVaccines(fetchedVaccines);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Task description is required');
      return false;
    }
    if (!formData.dateTime) {
      Alert.alert('Error', 'Date and time are required');
      return false;
    }
    if (formData.selectedPetIds.length === 0) {
      Alert.alert('Error', 'Please select at least one pet');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const taskData: Omit<Task, 'id'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dateTime: formData.dateTime,
        repeatInterval: formData.repeatInterval ? parseInt(formData.repeatInterval) : undefined,
        repeatUnit: formData.repeatUnit || undefined,
        petIds: formData.selectedPetIds,
        attachments: [],
      };

      if (task?.id) {
        // Update existing task
        // await updateTask(task.id, taskData);
        Alert.alert('Success', 'Task updated successfully!');
        onTaskUpdated?.();
      } else {
        // Create new task
        await createTask(taskData);
        Alert.alert('Success', 'Task created successfully!');
        onTaskCreated?.();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const togglePetSelection = (petId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPetIds: prev.selectedPetIds.includes(petId)
        ? prev.selectedPetIds.filter(id => id !== petId)
        : [...prev.selectedPetIds, petId]
    }));
  };

  const getVaccineSuggestions = () => {
    const selectedPets = pets.filter(pet => formData.selectedPetIds.includes(pet.id!));
    const suggestions: Vaccine[] = [];

    selectedPets.forEach(pet => {
      vaccines.forEach(vaccine => {
        // Simple suggestion logic - can be enhanced
        if (vaccine.name.toLowerCase().includes(pet.breedType.toLowerCase()) ||
            vaccine.description.toLowerCase().includes(pet.breedType.toLowerCase())) {
          suggestions.push(vaccine);
        }
      });
    });

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  };

  const addVaccineToDescription = (vaccine: Vaccine) => {
    const currentDesc = formData.description;
    const vaccineText = `\n\nVaccine Suggestion: ${vaccine.name}\nDescription: ${vaccine.description}`;
    setFormData(prev => ({
      ...prev,
      description: currentDesc + vaccineText
    }));
    setShowVaccineSuggestions(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>
          {task ? 'Edit Task' : 'Create New Task'}
        </Text>

        <View style={styles.form}>
          {/* Task Title */}
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Enter task title"
          />

          {/* Task Description */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Enter task description"
            multiline
            numberOfLines={4}
          />

          {/* Date and Time */}
          <Text style={styles.label}>Date & Time *</Text>
          <TextInput
            style={styles.input}
            value={formData.dateTime}
            onChangeText={(text) => setFormData({ ...formData, dateTime: text })}
            placeholder="YYYY-MM-DDTHH:MM"
          />

          {/* Repeat Settings */}
          <Text style={styles.label}>Repeat (Optional)</Text>
          <View style={styles.repeatContainer}>
            <TextInput
              style={[styles.input, styles.repeatInput]}
              value={formData.repeatInterval}
              onChangeText={(text) => setFormData({ ...formData, repeatInterval: text })}
              placeholder="Interval"
              keyboardType="numeric"
            />
            <View style={styles.repeatUnitContainer}>
              {repeatUnits.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.repeatUnitButton,
                    formData.repeatUnit === unit.value && styles.repeatUnitButtonSelected
                  ]}
                  onPress={() => setFormData({ ...formData, repeatUnit: unit.value })}
                >
                  <Text style={[
                    styles.repeatUnitText,
                    formData.repeatUnit === unit.value && styles.repeatUnitTextSelected
                  ]}>
                    {unit.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pet Selection */}
          <Text style={styles.label}>Select Pets *</Text>
          <View style={styles.petSelectionContainer}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petSelectionButton,
                  formData.selectedPetIds.includes(pet.id!) && styles.petSelectionButtonSelected
                ]}
                onPress={() => togglePetSelection(pet.id!)}
              >
                <Text style={[
                  styles.petSelectionText,
                  formData.selectedPetIds.includes(pet.id!) && styles.petSelectionTextSelected
                ]}>
                  {pet.name} ({pet.breed})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Vaccine Suggestions */}
          {formData.selectedPetIds.length > 0 && (
            <View style={styles.vaccineSection}>
              <Text style={styles.label}>Vaccine Suggestions</Text>
              <TouchableOpacity
                style={styles.vaccineButton}
                onPress={() => setShowVaccineSuggestions(!showVaccineSuggestions)}
              >
                <Text style={styles.vaccineButtonText}>
                  {showVaccineSuggestions ? 'Hide' : 'Show'} Vaccine Suggestions
                </Text>
              </TouchableOpacity>

              {showVaccineSuggestions && (
                <View style={styles.vaccineSuggestionsContainer}>
                  {getVaccineSuggestions().map((vaccine, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.vaccineSuggestionItem}
                      onPress={() => addVaccineToDescription(vaccine)}
                    >
                      <Text style={styles.vaccineSuggestionTitle}>{vaccine.name}</Text>
                      <Text style={styles.vaccineSuggestionDesc}>{vaccine.description}</Text>
                    </TouchableOpacity>
                  ))}
                  {getVaccineSuggestions().length === 0 && (
                    <Text style={styles.noVaccineText}>No vaccine suggestions available</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
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
    height: 100,
    textAlignVertical: 'top',
  },
  repeatContainer: {
    marginBottom: 16,
  },
  repeatInput: {
    marginBottom: 8,
  },
  repeatUnitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  repeatUnitButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  repeatUnitButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  repeatUnitText: {
    fontSize: 14,
    color: '#333',
  },
  repeatUnitTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  petSelectionContainer: {
    marginBottom: 16,
  },
  petSelectionButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  petSelectionButtonSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  petSelectionText: {
    fontSize: 16,
    color: '#333',
  },
  petSelectionTextSelected: {
    color: '#2196f3',
    fontWeight: '600',
  },
  vaccineSection: {
    marginBottom: 16,
  },
  vaccineButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  vaccineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  vaccineSuggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  vaccineSuggestionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vaccineSuggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vaccineSuggestionDesc: {
    fontSize: 14,
    color: '#666',
  },
  noVaccineText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
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