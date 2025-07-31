import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text, Alert } from 'react-native';
import TaskForm from './src/TaskForm';
import PetForm from './src/PetForm';
import PetListScreen, { PetDetailScreen } from './src/PetList';
import AuthScreen from './src/AuthScreen';
import SettingsScreen from './src/components/SettingsScreen';
import GeminiAssistant from './src/components/GeminiAssistant';
import { SafeAreaView, View, FlatList, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { Task, Pet } from './src/types';
import { getTasks, getPets } from './src/api';
import { LocaleHelper } from './src/utils/LocaleHelper';
import { StorageHelper } from './src/utils/StorageHelper';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TaskListScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
      <Button title="Add Task" onPress={() => navigation.navigate('TaskForm')} />
      <FlatList
        data={tasks}
        keyExtractor={item => item.id?.toString() || item.title}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { task: item })}>
            <View style={styles.item}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet. Add your first task!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function TaskDetailScreen({ route }: any) {
  const { task } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
      <View style={styles.detailContainer}>
        <Text style={styles.detailLabel}>Description:</Text>
        <Text style={styles.detailValue}>{task.description}</Text>
        
        <Text style={styles.detailLabel}>Date & Time:</Text>
        <Text style={styles.detailValue}>{task.dateTime}</Text>
        
        {task.repeatInterval && task.repeatUnit && (
          <>
            <Text style={styles.detailLabel}>Repeat:</Text>
            <Text style={styles.detailValue}>{task.repeatInterval} {task.repeatUnit}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function TaskFormWrapper({ route, navigation }: any) {
  return <TaskForm onTaskCreated={() => navigation.goBack()} />;
}

function PetFormWrapper({ route, navigation }: any) {
  const { pet } = route.params || {};
  return <PetForm pet={pet} onPetCreated={() => navigation.goBack()} onPetUpdated={() => navigation.goBack()} />;
}

function TaskStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TaskList" 
        component={TaskListScreen} 
        options={{ title: 'Tasks' }} 
      />
      <Stack.Screen 
        name="TaskForm" 
        component={TaskFormWrapper} 
        options={{ title: 'Add Task' }} 
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen} 
        options={{ title: 'Task Details' }} 
      />
    </Stack.Navigator>
  );
}

function PetStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PetList" 
        component={PetListScreen} 
        options={{ title: 'Pets' }} 
      />
      <Stack.Screen 
        name="PetDetail" 
        component={PetDetailScreen} 
        options={{ title: 'Pet Details' }} 
      />
      <Stack.Screen 
        name="PetForm" 
        component={PetFormWrapper} 
        options={{ title: 'Add/Edit Pet' }} 
      />
    </Stack.Navigator>
  );
}

function AssistantStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="GeminiAssistant" 
        component={GeminiAssistant} 
        options={{ title: 'AI Assistant' }} 
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />
    </Stack.Navigator>
  );
}

function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', onPress: onLogout, style: 'destructive' }
                ]
              );
            }}
            style={{ marginRight: 15 }}
          >
            <Text style={{ color: '#FF3B30', fontSize: 16 }}>Logout</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Tasks" component={TaskStack} />
      <Tab.Screen name="Pets" component={PetStack} />
      <Tab.Screen name="Assistant" component={AssistantStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize app settings
    const initializeApp = async () => {
      try {
        await LocaleHelper.initializeDarkMode();
        
        // Check if user is already logged in
        const token = await StorageHelper.getItem('authToken');
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await StorageHelper.removeItem('authToken');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <NavigationContainer>
      <MainTabs onLogout={handleLogout} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
  },
  item: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  detailContainer: {
    padding: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
}); 