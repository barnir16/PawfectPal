export interface VaccineAgeRestriction {
  min_weeks: number;
  max_years: number | null;
}

export interface Vaccine {
  name: string;
  frequency: string;
  first_dose_age?: string;
  puppy_schedule?: string[];
  kitten_schedule?: string[];
  description: string;
  side_effects: string[];
  age_restriction: VaccineAgeRestriction;
  last_updated: string;
}

export interface PreventativeTreatment {
  name: string;
  frequency: string;
  description: string;
  common_treatments: string[];
  last_updated: string;
}

export interface VaccineSchema {
  mandatory: Vaccine[];
  recommended: Vaccine[];
  preventative_treatments: PreventativeTreatment[];
}

// Israeli Adult Cat Vaccines
export const israeliAdultCatVaccines: VaccineSchema = {
  mandatory: [],
  recommended: [
    {
      name: "Rabies",
      frequency: "1 year",
      first_dose_age: "4 months",
      description: "Recommended for cats that roam outdoors. Fatal if contracted.",
      side_effects: ["lethargy", "mild fever"],
      age_restriction: { min_weeks: 12, max_years: null },
      last_updated: "2025-01-01"
    },
    {
      name: "Quadrivalent Vaccine",
      frequency: "1 year",
      kitten_schedule: ["8 weeks", "12 weeks"],
      description: "Protects against 4 diseases: Panleukopenia, Herpesvirus, Calicivirus, and Chlamydia.",
      side_effects: ["injection site swelling"],
      age_restriction: { min_weeks: 8, max_years: null },
      last_updated: "2025-01-01"
    },
    {
      name: "Feline Leukemia Virus (FeLV)",
      frequency: "1 year",
      description: "Recommended for outdoor cats. Prevents a viral infection that weakens the immune system, making cats vulnerable to other diseases.",
      side_effects: ["mild lethargy"],
      age_restriction: { min_weeks: 9, max_years: null },
      last_updated: "2025-01-01"
    }
  ],
  preventative_treatments: [
    {
      name: "Fleas & Ticks Prevention",
      frequency: "Monthly or as advised by vet",
      description: "Protects against fleas and ticks, preventing severe itching, allergic reactions, and disease transmission (e.g., Hemobartonellosis).",
      common_treatments: ["Advantage", "Frontline", "Flea Collars", "Oral Medications"],
      last_updated: "2025-01-01"
    },
    {
      name: "Internal Parasites",
      frequency: "Every 3-6 months",
      description: "Prevents intestinal worms that can cause weight loss, vomiting, and diarrhea.",
      common_treatments: ["Drontal", "Profender", "Veterinary-prescribed options"],
      last_updated: "2025-01-01"
    }
  ]
};

// Israeli Adult Dog Vaccines
export const israeliAdultDogVaccines: VaccineSchema = {
  mandatory: [
    {
      name: "Rabies",
      frequency: "2 year",
      first_dose_age: "3 months",
      description: "A viral disease fatal to dogs and humans. First dose includes microchipping. Required by Israeli law.",
      side_effects: ["lethargy", "fever"],
      age_restriction: { min_weeks: 12, max_years: null },
      last_updated: "2025-01-01"
    }
  ],
  recommended: [
    {
      name: "Hexavalent Vaccine",
      frequency: "Yearly",
      puppy_schedule: ["6 weeks", "9 weeks", "12 weeks"],
      description: "Protects against 6 diseases: Canine Distemper Virus (CDV), Canine Adenovirus Type 2 (CAV-2), Canine Parvovirus (CPV), Leptospirosis (Two Serovars), Canine Parainfluenza Virus (CPiV), and Canine Coronavirus (CCV).",
      side_effects: ["mild fever"],
      age_restriction: { min_weeks: 6, max_years: null },
      last_updated: "2025-01-01"
    },
    {
      name: "Spirocerca Lupi (Park Worm) Prevention",
      frequency: "Every 3 months",
      description: "Prevents infection by a parasitic worm common in Israel, which can cause severe illness, including esophageal tumors.",
      side_effects: ["diarrhea", "nausea"],
      age_restriction: { min_weeks: 8, max_years: null },
      last_updated: "2025-01-01"
    }
  ],
  preventative_treatments: [
    {
      name: "Fleas & Ticks Prevention",
      frequency: "Monthly or as advised by vet",
      description: "Protects against infestations that cause skin irritation, anemia, and disease transmission (e.g., Ehrlichiosis from ticks).",
      common_treatments: ["Advantix", "Frontline", "Bravecto", "NexGard", "Flea Collars"],
      last_updated: "2025-01-01"
    },
    {
      name: "Internal Parasites",
      frequency: "Every 3-6 months",
      description: "Prevents roundworms, tapeworms, hookworms, and other intestinal parasites.",
      common_treatments: ["Drontal", "Milbemax", "Veterinary-prescribed medications"],
      last_updated: "2025-01-01"
    }
  ]
};

// Placeholder for Israeli Puppy Vaccines (to be implemented)
export const israeliPuppyVaccines: VaccineSchema = {
  mandatory: [],
  recommended: [],
  preventative_treatments: []
};

// Placeholder for Israeli Kitten Vaccines (to be implemented)
export const israeliKittenVaccines: VaccineSchema = {
  mandatory: [],
  recommended: [],
  preventative_treatments: []
};

// Main export for all Israeli vaccine schemas
export const israeliVaccineSchemas = {
  adultCats: israeliAdultCatVaccines,
  adultDogs: israeliAdultDogVaccines,
  puppies: israeliPuppyVaccines,
  kittens: israeliKittenVaccines
};

export default israeliVaccineSchemas;
