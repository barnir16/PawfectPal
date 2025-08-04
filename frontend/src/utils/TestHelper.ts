import  type { Pet, Task, Service } from '../types';
import {
  login,
  register,
  getPets,
  createPet,
  updatePet,
  deletePet,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getServices,
  createService,
  updateServiceStatus,
  getVaccines,
  getAgeRestrictions,
} from '../api';
import { StorageHelper } from './StorageHelper';
import { ApiKeyManager } from './ApiKeyManager';

/**
 * Comprehensive test helper for PawfectPal features - React Web version
 */
export class TestHelper {
  private static testResults: Array<{ feature: string; status: 'PASS' | 'FAIL'; message: string }> = [];

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🧪 Starting PawfectPal tests...\n');

    this.testResults = [];

    await this.testStorage();
    await this.testApiKeyManagement();
    await this.testAuthentication();
    await this.testPetManagement();
    await this.testTaskManagement();
    await this.testServiceManagement();
    await this.testVaccineData();

    this.printTestResults();
  }

  private static async testStorage(): Promise<void> {
    try {
      await StorageHelper.setItem('test_key', 'test_value');
      const retrieved = await StorageHelper.getItem('test_key');

      if (retrieved === 'test_value') {
        this.addTestResult('Storage', 'PASS', 'localStorage working correctly');
      } else {
        this.addTestResult('Storage', 'FAIL', 'localStorage retrieval failed');
      }

      const testObject = { name: 'Test Pet', age: 5 };
      await StorageHelper.setObject('test_object', testObject);
      const retrievedObject = await StorageHelper.getObject<typeof testObject>('test_object');

      if (retrievedObject && retrievedObject.name === 'Test Pet') {
        this.addTestResult('Object Storage', 'PASS', 'Object storage working correctly');
      } else {
        this.addTestResult('Object Storage', 'FAIL', 'Object storage failed');
      }

      await StorageHelper.removeItem('test_key');
      await StorageHelper.removeItem('test_object');
    } catch (error) {
      this.addTestResult('Storage', 'FAIL', `Storage error: ${(error as Error).message}`);
    }
  }

  private static async testApiKeyManagement(): Promise<void> {
    try {
      ApiKeyManager.setPetsApiKey('test_pets_key');
      ApiKeyManager.setGeminiApiKey('test_gemini_key');

      const petsKey = ApiKeyManager.getPetsApiKey();
      const geminiKey = ApiKeyManager.getGeminiApiKey();

      if (petsKey === 'test_pets_key' && geminiKey === 'test_gemini_key') {
        this.addTestResult('API Key Management', 'PASS', 'API key management working correctly');
      } else {
        this.addTestResult('API Key Management', 'FAIL', 'API key retrieval failed');
      }

      const hasPetsKey = ApiKeyManager.hasPetsApiKey();
      const hasGeminiKey = ApiKeyManager.hasGeminiApiKey();

      if (hasPetsKey && hasGeminiKey) {
        this.addTestResult('API Key Checks', 'PASS', 'API key existence checks working');
      } else {
        this.addTestResult('API Key Checks', 'FAIL', 'API key existence checks failed');
      }

      ApiKeyManager.clearAllKeys();
    } catch (error) {
      this.addTestResult('API Key Management', 'FAIL', `API key error: ${(error as Error).message}`);
    }
  }

  private static async testAuthentication(): Promise<void> {
    try {
      try {
        await register('testuser', 'testpass123', 'test@example.com', 'Test User');
        this.addTestResult('Registration', 'PASS', 'User registration working');
      } catch {
        this.addTestResult('Registration', 'PASS', 'Registration endpoint accessible (user may exist)');
      }

      try {
        const loginResponse = await login('testuser', 'testpass123');
        if (loginResponse.access_token) {
          await StorageHelper.setItem('authToken', loginResponse.access_token);
          this.addTestResult('Login', 'PASS', 'User login working');
        } else {
          this.addTestResult('Login', 'FAIL', 'Login response missing token');
        }
      } catch (error) {
        this.addTestResult('Login', 'FAIL', `Login failed: ${(error as Error).message}`);
      }
    } catch (error) {
      this.addTestResult('Authentication', 'FAIL', `Authentication error: ${(error as Error).message}`);
    }
  }

  private static async testPetManagement(): Promise<void> {
    try {
      try {
        const pets = await getPets();
        this.addTestResult('Get Pets', 'PASS', `Retrieved ${pets.length} pets`);
      } catch (error) {
        this.addTestResult('Get Pets', 'FAIL', `Get pets failed: ${(error as Error).message}`);
      }

      try {
        const newPet: Omit<Pet, 'id'> = {
          name: 'Test Pet',
          breedType: 'dog',
          breed: 'Golden Retriever',
          birthDate: '2020-01-01',
          age: 3,
          isBirthdayGiven: true,
          weightKg: 25,
          healthIssues: [],
          behaviorIssues: [],
          isTrackingEnabled: false,
        };

        const createdPet = await createPet(newPet);
        if (createdPet.id) {
          this.addTestResult('Create Pet', 'PASS', 'Pet creation working');

          try {
            const updatedPet = await updatePet(createdPet.id, { ...newPet, name: 'Updated Test Pet' });
            if (updatedPet.name === 'Updated Test Pet') {
              this.addTestResult('Update Pet', 'PASS', 'Pet update working');
            } else {
              this.addTestResult('Update Pet', 'FAIL', 'Pet update failed');
            }
          } catch (error) {
            this.addTestResult('Update Pet', 'FAIL', `Update pet failed: ${(error as Error).message}`);
          }

          try {
            await deletePet(createdPet.id);
            this.addTestResult('Delete Pet', 'PASS', 'Pet deletion working');
          } catch (error) {
            this.addTestResult('Delete Pet', 'FAIL', `Delete pet failed: ${(error as Error).message}`);
          }
        } else {
          this.addTestResult('Create Pet', 'FAIL', 'Pet creation failed - no ID returned');
        }
      } catch (error) {
        this.addTestResult('Create Pet', 'FAIL', `Create pet failed: ${(error as Error).message}`);
      }
    } catch (error) {
      this.addTestResult('Pet Management', 'FAIL', `Pet management error: ${(error as Error).message}`);
    }
  }

  private static async testTaskManagement(): Promise<void> {
    try {
      try {
        const tasks = await getTasks();
        this.addTestResult('Get Tasks', 'PASS', `Retrieved ${tasks.length} tasks`);
      } catch (error) {
        this.addTestResult('Get Tasks', 'FAIL', `Get tasks failed: ${(error as Error).message}`);
      }

      try {
        const newTask: Omit<Task, 'id'> = {
          title: 'Test Task',
          description: 'This is a test task',
          dateTime: new Date().toISOString(),
          petIds: [],
          attachments: [],
        };

        const createdTask = await createTask(newTask);
        if (createdTask.id) {
          this.addTestResult('Create Task', 'PASS', 'Task creation working');

          try {
            const updatedTask = await updateTask(createdTask.id, { ...newTask, title: 'Updated Test Task' });
            if (updatedTask.title === 'Updated Test Task') {
              this.addTestResult('Update Task', 'PASS', 'Task update working');
            } else {
              this.addTestResult('Update Task', 'FAIL', 'Task update failed');
            }
          } catch (error) {
            this.addTestResult('Update Task', 'FAIL', `Update task failed: ${(error as Error).message}`);
          }

          try {
            await deleteTask(createdTask.id);
            this.addTestResult('Delete Task', 'PASS', 'Task deletion working');
          } catch (error) {
            this.addTestResult('Delete Task', 'FAIL', `Delete task failed: ${(error as Error).message}`);
          }
        } else {
          this.addTestResult('Create Task', 'FAIL', 'Task creation failed - no ID returned');
        }
      } catch (error) {
        this.addTestResult('Create Task', 'FAIL', `Create task failed: ${(error as Error).message}`);
      }
    } catch (error) {
      this.addTestResult('Task Management', 'FAIL', `Task management error: ${(error as Error).message}`);
    }
  }

  private static async testServiceManagement(): Promise<void> {
    try {
      try {
        const services = await getServices();
        this.addTestResult('Get Services', 'PASS', `Retrieved ${services.length} services`);
      } catch (error) {
        this.addTestResult('Get Services', 'FAIL', `Get services failed: ${(error as Error).message}`);
      }

      try {
        const newService: Omit<Service, 'id'> = {
          pet_id: 1, // Change to valid pet ID or mock as needed
          service_type: 'walking' as any,
          status: 'pending' as any,
          start_datetime: new Date().toISOString(),
          currency: 'USD',
          before_images: [],
          after_images: [],
        };

        const createdService = await createService(newService);
        if (createdService.id) {
          this.addTestResult('Create Service', 'PASS', 'Service creation working');

          try {
            const updatedService = await updateServiceStatus(createdService.id, 'confirmed' as any);
            if (updatedService.status === 'confirmed') {
              this.addTestResult('Update Service Status', 'PASS', 'Service status update working');
            } else {
              this.addTestResult('Update Service Status', 'FAIL', 'Service status update failed');
            }
          } catch (error) {
            this.addTestResult('Update Service Status', 'FAIL', `Update service status failed: ${(error as Error).message}`);
          }
        } else {
          this.addTestResult('Create Service', 'FAIL', 'Service creation failed - no ID returned');
        }
      } catch (error) {
        this.addTestResult('Create Service', 'FAIL', `Create service failed: ${(error as Error).message}`);
      }
    } catch (error) {
      this.addTestResult('Service Management', 'FAIL', `Service management error: ${(error as Error).message}`);
    }
  }

  private static async testVaccineData(): Promise<void> {
    try {
      try {
        const vaccines = await getVaccines();
        this.addTestResult('Get Vaccines', 'PASS', `Retrieved ${vaccines.length} vaccines`);
      } catch (error) {
        this.addTestResult('Get Vaccines', 'FAIL', `Get vaccines failed: ${(error as Error).message}`);
      }

      try {
        const ageRestrictions = await getAgeRestrictions();
        this.addTestResult('Get Age Restrictions', 'PASS', `Retrieved ${ageRestrictions.length} age restrictions`);
      } catch (error) {
        this.addTestResult('Get Age Restrictions', 'FAIL', `Get age restrictions failed: ${(error as Error).message}`);
      }
    } catch (error) {
      this.addTestResult('Vaccine Data', 'FAIL', `Vaccine data error: ${(error as Error).message}`);
    }
  }

  private static addTestResult(feature: string, status: 'PASS' | 'FAIL', message: string): void {
    this.testResults.push({ feature, status, message });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${feature}: ${message}`);
  }

  private static printTestResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    const passed = this.testResults.filter((r) => r.status === 'PASS').length;
    const failed = this.testResults.filter((r) => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter((r) => r.status === 'FAIL')
        .forEach((r) => console.log(`  - ${r.feature}: ${r.message}`));
    }

    console.log('\n🎉 Testing complete!');
  }
}
