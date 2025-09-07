// Test utility to generate and log vaccine schedules for all pets
import { getPets } from '../services/pets/petService';
import { VaccineTaskService } from '../services/tasks/vaccineTaskService';

export async function testVaccineGeneration() {
  try {
    console.log('🐕 Testing vaccine generation for all pets...\n');
    
    // Get all pets
    const pets = await getPets();
    console.log(`Found ${pets.length} pets:`, pets.map(p => `${p.name} (${p.type}, ${p.age} years old)`));
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Generate vaccine schedules for each pet
    for (const pet of pets) {
      console.log(`\n🐕 Generating vaccines for ${pet.name} (${pet.type}):`);
      console.log(`   Birth Date: ${pet.birthDate || 'Not provided'}`);
      console.log(`   Age: ${pet.age} years`);
      
      const vaccineTasks = VaccineTaskService.generateVaccineTasks(pet);
      
      if (vaccineTasks.length === 0) {
        console.log('   ❌ No vaccines generated');
        continue;
      }
      
      console.log(`   ✅ Generated ${vaccineTasks.length} vaccine tasks:`);
      
      // Group by vaccine type
      const groupedVaccines = vaccineTasks.reduce((acc, task) => {
        if (!acc[task.vaccineName]) {
          acc[task.vaccineName] = [];
        }
        acc[task.vaccineName].push(task);
        return acc;
      }, {});
      
      Object.entries(groupedVaccines).forEach(([vaccineName, tasks]) => {
        console.log(`\n   📋 ${vaccineName}:`);
        tasks.forEach((task, index) => {
          const dueDate = new Date(task.dateTime).toLocaleDateString();
          const status = task.isOverdue ? '🔴 OVERDUE' : '🟡 Upcoming';
          const isRecurring = task.description.includes('חוזר') ? ' (Recurring)' : ' (First)';
          console.log(`      ${index + 1}. ${dueDate} - ${status}${isRecurring}`);
        });
      });
      
      console.log('\n' + '-'.repeat(60));
    }
    
    console.log('\n🎉 Vaccine generation test completed!');
    
  } catch (error) {
    console.error('❌ Error testing vaccine generation:', error);
  }
}

// Make it available globally for console testing
(window as any).testVaccines = testVaccineGeneration;
