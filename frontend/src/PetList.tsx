import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Pet } from './types';
import { getPets, deletePet } from './api';
import PetForm from './PetForm';

interface PetListScreenProps {
  navigation: any;
}

export default function PetListScreen({ navigation }: PetListScreenProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPets = async () => {
    try {
      const fetchedPets = await getPets();
      setPets(fetchedPets);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPets();
  };

  const handleDeletePet = (pet: Pet) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet(pet.id!);
              Alert.alert('Success', 'Pet deleted successfully');
              fetchPets(); // Refresh the list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  const handleEditPet = (pet: Pet) => {
    navigation.navigate('PetForm', { pet });
  };

  const handleAddPet = () => {
    navigation.navigate('PetForm');
  };

  const renderPetItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => navigation.navigate('PetDetail', { pet: item })}
    >
      <View style={styles.petHeader}>
        <Text style={styles.petName}>{item.name}</Text>
        <View style={styles.petTypeBadge}>
          <Text style={styles.petTypeText}>{item.breedType}</Text>
        </View>
      </View>
      
      <Text style={styles.petBreed}>{item.breed}</Text>
      
      <View style={styles.petInfo}>
        {item.weightKg && (
          <Text style={styles.petInfoText}>Weight: {item.weightKg} kg</Text>
        )}
        {item.birthDate && (
          <Text style={styles.petInfoText}>
            Age: {calculateAge(item.birthDate)} years
          </Text>
        )}
      </View>

      {item.healthIssues.length > 0 && (
        <View style={styles.issuesContainer}>
          <Text style={styles.issuesTitle}>Health Issues:</Text>
          <Text style={styles.issuesText}>{item.healthIssues.join(', ')}</Text>
        </View>
      )}

      {item.behaviorIssues.length > 0 && (
        <View style={styles.issuesContainer}>
          <Text style={styles.issuesTitle}>Behavior Issues:</Text>
          <Text style={styles.issuesText}>{item.behaviorIssues.join(', ')}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditPet(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePet(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(ageInYears);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pets</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
          <Text style={styles.addButtonText}>+ Add Pet</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pets}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id?.toString() || item.name}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No pets yet</Text>
            <Text style={styles.emptyText}>
              Add your first pet to start managing their care!
            </Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddPet}>
              <Text style={styles.emptyAddButtonText}>Add Your First Pet</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// Pet Detail Screen Component
export function PetDetailScreen({ route, navigation }: any) {
  const { pet } = route.params;

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(ageInYears);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>{pet.name}</Text>
        <View style={styles.detailTypeBadge}>
          <Text style={styles.detailTypeText}>{pet.breedType}</Text>
        </View>
      </View>

      <View style={styles.detailContent}>
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Basic Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Breed:</Text>
            <Text style={styles.detailValue}>{pet.breed}</Text>
          </View>
          {pet.birthDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Birth Date:</Text>
              <Text style={styles.detailValue}>{pet.birthDate}</Text>
            </View>
          )}
          {pet.birthDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age:</Text>
              <Text style={styles.detailValue}>{calculateAge(pet.birthDate)} years old</Text>
            </View>
          )}
          {pet.weightKg && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight:</Text>
              <Text style={styles.detailValue}>{pet.weightKg} kg</Text>
            </View>
          )}
        </View>

        {pet.healthIssues.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Health Issues</Text>
            {pet.healthIssues.map((issue, index) => (
              <Text key={index} style={styles.issueItem}>• {issue}</Text>
            ))}
          </View>
        )}

        {pet.behaviorIssues.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Behavior Issues</Text>
            {pet.behaviorIssues.map((issue, index) => (
              <Text key={index} style={styles.issueItem}>• {issue}</Text>
            ))}
          </View>
        )}

        <View style={styles.detailActions}>
          <TouchableOpacity
            style={[styles.detailActionButton, styles.editButton]}
            onPress={() => navigation.navigate('PetForm', { pet })}
          >
            <Text style={styles.editButtonText}>Edit Pet</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  petCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  petTypeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  petTypeText: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: '600',
  },
  petBreed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  petInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  petInfoText: {
    fontSize: 14,
    color: '#888',
    marginRight: 16,
  },
  issuesContainer: {
    marginBottom: 8,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  issuesText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Detail screen styles
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  detailTypeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailTypeText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600',
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  issueItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  detailActions: {
    marginTop: 20,
  },
  detailActionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
}); 