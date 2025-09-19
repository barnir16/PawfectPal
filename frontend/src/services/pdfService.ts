import jsPDF from 'jspdf';
import type { Pet } from '../types/pets';
import type { Task } from '../types/tasks';

export interface PDFOptions {
  includePhoto: boolean;
  includeMedicalHistory: boolean;
  includeVaccinationRecords: boolean;
  includeBehaviorNotes: boolean;
  includeTasks: boolean;
  format: 'A4' | 'Letter';
  language: 'en' | 'he';
}

export interface PetData {
  pet: Pet;
  tasks?: Task[];
  vaccinations?: Array<{
    name: string;
    date: string;
    nextDue: string;
    veterinarian: string;
    notes?: string;
  }>;
  medicalRecords?: Array<{
    date: string;
    type: string;
    description: string;
    veterinarian: string;
    treatment: string;
    followUp?: string;
  }>;
}

/**
 * Generate a comprehensive PDF for a single pet
 */
export const generatePetPDF = async (
  petData: PetData,
  options: PDFOptions = {
    includePhoto: true,
    includeMedicalHistory: true,
    includeVaccinationRecords: true,
    includeBehaviorNotes: true,
    includeTasks: true,
    format: 'A4',
    language: 'en'
  }
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.format
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * (fontSize * 0.35) + 5;
    
    // Check if we need a new page
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
  };

  // Helper function to add a section header
  const addSectionHeader = (title: string) => {
    currentY += 10;
    addText(title, 16, true);
    doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
    currentY += 5;
  };

  // Header
  addText(`${petData.pet.name} - Pet Profile`, 20, true);
  addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
  currentY += 10;

  // Pet Image (if available)
  const imageUrl = petData.pet.imageUrl || petData.pet.photo_uri;
  if (options.includePhoto && imageUrl) {
    try {
      // Check if it's a base64 data URL or a regular URL
      let base64: string;
      if (imageUrl.startsWith('data:')) {
        base64 = imageUrl;
      } else {
        // Convert image URL to base64 for PDF
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(blob);
        });
      }
      
      // Add image to PDF
      doc.addImage(base64, 'JPEG', 10, currentY, 60, 60);
      currentY += 70;
    } catch (error) {
      console.log('Could not add pet image to PDF:', error);
      // Add placeholder text instead
      addText('Pet Image: Not available', 10);
      currentY += 15;
      addText(`[Pet Image: ${petData.pet.name} - Image unavailable]`, 10);
      currentY += 5;
    }
  } else if (options.includePhoto) {
    addText(`[Pet Image: ${petData.pet.name} - No image provided]`, 10);
    currentY += 5;
  }

  // Basic Information
  addSectionHeader('Basic Information');
  addText(`Name: ${petData.pet.name}`);
  addText(`Type: ${petData.pet.breedType}`);
  addText(`Breed: ${petData.pet.breed}`);
  // Calculate age properly
  const getAgeDisplay = (pet: Pet) => {
    if (pet.age !== undefined && pet.age !== null) {
      if (pet.age < 1) {
        const months = Math.floor(pet.age * 12);
        return `${months} months`;
      }
      return `${pet.age} years`;
    }
    
    // Calculate from birth date
    const birthDate = pet.birthDate || pet.birth_date;
    if (birthDate) {
      try {
        // Handle different date formats
        let birth;
        if (typeof birthDate === 'string') {
          // Try parsing as ISO string first
          birth = new Date(birthDate);
          // If that fails, try parsing as DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY, or MM.DD.YYYY
          if (isNaN(birth.getTime()) && (birthDate.includes('/') || birthDate.includes('.'))) {
            const separator = birthDate.includes('/') ? '/' : '.';
            const parts = birthDate.split(separator);
            if (parts.length === 3) {
              // Try DD/MM/YYYY or DD.MM.YYYY format first
              birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              if (isNaN(birth.getTime())) {
                // Try MM/DD/YYYY or MM.DD.YYYY format
                birth = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
              }
            }
          }
        } else {
          birth = new Date(birthDate);
        }
        
        if (isNaN(birth.getTime())) {
          console.log('Invalid birthdate format in PDF:', birthDate);
          return 'Unknown age';
        }
        
        const now = new Date();
        const ageInMilliseconds = now.getTime() - birth.getTime();
        
        // Calculate age more accurately
        const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
        const ageInMonths = Math.floor(ageInDays / 30.44); // Average days per month
        const ageInYears = Math.floor(ageInDays / 365.25);
        
        // Handle future birthdates
        if (ageInDays < 0) {
          return 'Future birthdate';
        }
        
        if (ageInYears < 1) {
          // For pets under 1 year, show months
          const months = Math.max(0, ageInMonths);
          return `${months} months`;
        }
        return `${ageInYears} years`;
      } catch (error) {
        console.log('Error calculating age from birthdate in PDF:', birthDate, error);
        return 'Unknown age';
      }
    }
    return 'Unknown age';
  };

  addText(`Age: ${getAgeDisplay(petData.pet)}`);
  addText(`Weight: ${petData.pet.weightKg} kg`);
  addText(`Gender: ${petData.pet.gender}`);
  addText(`Birth Date: ${petData.pet.birthDate ? new Date(petData.pet.birthDate).toLocaleDateString() : 'Unknown'}`);

  // Health Information
  if (petData.pet.healthIssues || petData.pet.behaviorIssues) {
    addSectionHeader('Health & Behavior');
    if (petData.pet.healthIssues) {
      addText(`Health Issues: ${petData.pet.healthIssues}`);
    }
    if (petData.pet.behaviorIssues) {
      addText(`Behavior Issues: ${petData.pet.behaviorIssues}`);
    }
  }

  // Vaccination Records
  if (options.includeVaccinationRecords && petData.vaccinations && petData.vaccinations.length > 0) {
    addSectionHeader('Vaccination Records');
    petData.vaccinations.forEach(vaccination => {
      addText(`• ${vaccination.name}`, 12, true);
      addText(`  Date: ${new Date(vaccination.date).toLocaleDateString()}`);
      addText(`  Next Due: ${new Date(vaccination.nextDue).toLocaleDateString()}`);
      addText(`  Veterinarian: ${vaccination.veterinarian}`);
      if (vaccination.notes) {
        addText(`  Notes: ${vaccination.notes}`);
      }
      currentY += 5;
    });
  }

  // Medical Records
  if (options.includeMedicalHistory && petData.medicalRecords && petData.medicalRecords.length > 0) {
    addSectionHeader('Medical History');
    petData.medicalRecords.forEach(record => {
      addText(`• ${record.type} - ${new Date(record.date).toLocaleDateString()}`, 12, true);
      addText(`  Description: ${record.description}`);
      addText(`  Treatment: ${record.treatment}`);
      addText(`  Veterinarian: ${record.veterinarian}`);
      if (record.followUp) {
        addText(`  Follow-up: ${record.followUp}`);
      }
      currentY += 5;
    });
  }

  // Tasks
  if (options.includeTasks && petData.tasks && petData.tasks.length > 0) {
    addSectionHeader('Recent Tasks');
    petData.tasks.forEach(task => {
      addText(`• ${task.title}`, 12, true);
      addText(`  Due: ${new Date(task.dateTime).toLocaleDateString()}`);
      addText(`  Priority: ${task.priority}`);
      addText(`  Status: ${task.isCompleted ? 'Completed' : 'Pending'}`);
      if (task.description) {
        addText(`  Description: ${task.description}`);
      }
      currentY += 5;
    });
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.text(`Generated by PawfectPal - ${new Date().toLocaleString()}`, margin, footerY);

  return doc;
};

/**
 * Generate a PDF for multiple pets
 */
export const generateMultiPetPDF = async (
  petsData: PetData[],
  options: PDFOptions = {
    includePhoto: true,
    includeMedicalHistory: true,
    includeVaccinationRecords: true,
    includeBehaviorNotes: true,
    includeTasks: true,
    format: 'A4',
    language: 'en'
  }
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.format
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Helper function to add text
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    
    const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
    doc.text(lines, margin, currentY);
    currentY += lines.length * (fontSize * 0.35) + 5;
    
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
  };

  // Title
  addText('PawfectPal - All Pets Report', 20, true);
  addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
  currentY += 20;

  // Summary
  addText(`Total Pets: ${petsData.length}`, 14, true);
  currentY += 10;

  // Generate individual pet sections
  for (let i = 0; i < petsData.length; i++) {
    const petData = petsData[i];
    
    // Add page break for each pet (except first)
    if (i > 0) {
      doc.addPage();
      currentY = margin;
    }

    // Pet header
    addText(`Pet ${i + 1}: ${petData.pet.name}`, 16, true);
    
    // Calculate age properly for multi-pet PDF
    const getAgeDisplay = (pet: Pet) => {
      if (pet.age !== undefined && pet.age !== null) {
        if (pet.age < 1) {
          const months = Math.floor(pet.age * 12);
          return `${months} months`;
        }
        return `${pet.age} years`;
      }
      
      const birthDate = pet.birthDate || pet.birth_date;
      if (birthDate) {
        try {
                  // Handle different date formats
        let birth;
        if (typeof birthDate === 'string') {
          // Try parsing as ISO string first
          birth = new Date(birthDate);
          // If that fails, try parsing as DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY, or MM.DD.YYYY
          if (isNaN(birth.getTime()) && (birthDate.includes('/') || birthDate.includes('.'))) {
            const separator = birthDate.includes('/') ? '/' : '.';
            const parts = birthDate.split(separator);
            if (parts.length === 3) {
              // Try DD/MM/YYYY or DD.MM.YYYY format first
              birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              if (isNaN(birth.getTime())) {
                // Try MM/DD/YYYY or MM.DD.YYYY format
                birth = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
              }
            }
          }
        } else {
          birth = new Date(birthDate);
        }
          
          if (isNaN(birth.getTime())) {
            console.log('Invalid birthdate format in multi-pet PDF:', birthDate);
            return 'Unknown age';
          }
          
          const now = new Date();
          const ageInMilliseconds = now.getTime() - birth.getTime();
          
          // Calculate age more accurately
          const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
          const ageInMonths = Math.floor(ageInDays / 30.44); // Average days per month
          const ageInYears = Math.floor(ageInDays / 365.25);
          
          // Handle future birthdates
          if (ageInDays < 0) {
            return 'Future birthdate';
          }
          
          if (ageInYears < 1) {
            // For pets under 1 year, show months
            const months = Math.max(0, ageInMonths);
            return `${months} months`;
          }
          return `${ageInYears} years`;
        } catch (error) {
          console.log('Error calculating age from birthdate in multi-pet PDF:', birthDate, error);
          return 'Unknown age';
        }
      }
      return 'Unknown age';
    };
    
    addText(`Type: ${petData.pet.breedType} | Breed: ${petData.pet.breed} | Age: ${getAgeDisplay(petData.pet)}`);
    
    // Add pet image if available
    const imageUrl = petData.pet.imageUrl || petData.pet.photo_uri;
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        // Add small image to PDF
        doc.addImage(base64, 'JPEG', 10, currentY, 30, 30);
        currentY += 35;
      } catch (error) {
        console.log('Could not add pet image to multi-pet PDF:', error);
        addText(`[Image: ${petData.pet.name}]`);
        currentY += 5;
      }
    }
    
    currentY += 10;

    // Basic info
    addText(`Weight: ${petData.pet.weightKg} kg | Gender: ${petData.pet.gender}`);
    if (petData.pet.healthIssues) {
      addText(`Health Issues: ${petData.pet.healthIssues}`);
    }
    if (petData.pet.behaviorIssues) {
      addText(`Behavior Issues: ${petData.pet.behaviorIssues}`);
    }

    // Vaccinations summary
    if (petData.vaccinations && petData.vaccinations.length > 0) {
      addText(`Vaccinations: ${petData.vaccinations.length} records`, 12, true);
      petData.vaccinations.slice(0, 3).forEach(vaccination => {
        addText(`• ${vaccination.name} (${new Date(vaccination.date).toLocaleDateString()})`);
      });
      if (petData.vaccinations.length > 3) {
        addText(`... and ${petData.vaccinations.length - 3} more`);
      }
    }

    // Tasks summary
    if (petData.tasks && petData.tasks.length > 0) {
      const completedTasks = petData.tasks.filter(task => task.isCompleted).length;
      const pendingTasks = petData.tasks.length - completedTasks;
      addText(`Tasks: ${completedTasks} completed, ${pendingTasks} pending`, 12, true);
    }

    currentY += 10;
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.text(`Generated by PawfectPal - ${new Date().toLocaleString()}`, margin, footerY);

  return doc;
};

/**
 * Download a PDF document
 */
export const downloadPDF = (doc: jsPDF, filename: string): void => {
  doc.save(filename);
};

/**
 * Generate and download a single pet PDF
 */
export const generateAndDownloadPetPDF = async (
  petData: PetData,
  filename?: string,
  options?: PDFOptions
): Promise<void> => {
  const doc = await generatePetPDF(petData, options);
  const defaultFilename = `${petData.pet.name.replace(/\s+/g, '_')}_profile_${new Date().toISOString().split('T')[0]}.pdf`;
  downloadPDF(doc, filename || defaultFilename);
};

/**
 * Generate and download a multi-pet PDF
 */
export const generateAndDownloadMultiPetPDF = async (
  petsData: PetData[],
  filename?: string,
  options?: PDFOptions
): Promise<void> => {
  const doc = await generateMultiPetPDF(petsData, options);
  const defaultFilename = `pawfectpal_pets_report_${new Date().toISOString().split('T')[0]}.pdf`;
  downloadPDF(doc, filename || defaultFilename);
};

/**
 * Check if PDF generation is supported
 */
export const isPDFGenerationSupported = (): boolean => {
  return typeof window !== 'undefined' && typeof jsPDF !== 'undefined';
};