export const dogVaccines = [
  {
    name: "Rabies",
    frequency: "2 years",
    firstDoseAge: "3 months",
    description: "A viral disease fatal to dogs and humans. First dose includes microchipping.",
    notes: "Required by Israeli law.",
    sideEffects: ["lethargy", "fever"],
    ageRestriction: { minWeeks: 12, maxYears: null },
    lastUpdated: "2025-01-01",
    type: "mandatory"
  },
  {
    name: "Hexavalent Vaccine",
    frequency: "Yearly",
    puppySchedule: ["6 weeks", "9 weeks", "12 weeks"],
    description: "Protects against 6 diseases: Parvovirus, Distemper, Hepatitis, Influenza, and Leptospirosis.",
    sideEffects: ["mild fever"],
    ageRestriction: { minWeeks: 6, maxYears: null },
    lastUpdated: "2025-01-01",
    type: "recommended"
  },
  {
    name: "Parkworm Prevention",
    frequency: "2 months",
    description: "Prevents infestation by a parasitic worm transmitted through beetles.",
    sideEffects: ["diarrhea", "nausea"],
    ageRestriction: { minWeeks: 8, maxYears: 10 },
    lastUpdated: "2025-01-01",
    type: "recommended"
  },
  {
    name: "Kennel Cough",
    frequency: "6 months",
    description: "Protects against Kennel Cough, a mild respiratory infection.",
    sideEffects: ["sneezing"],
    ageRestriction: { minWeeks: 8, maxYears: null },
    lastUpdated: "2025-01-01",
    type: "recommended"
  }
];

export const catVaccines = [
  {
    name: "Rabies",
    frequency: "1 year",
    firstDoseAge: "4 months",
    description: "Recommended for cats that roam outdoors. Fatal if contracted.",
    sideEffects: ["lethargy", "mild fever"],
    ageRestriction: { minWeeks: 12, maxYears: null },
    lastUpdated: "2025-01-01",
    type: "mandatory"
  },
  {
    name: "Quadruple Vaccine",
    frequency: "1 year",
    kittenSchedule: ["8 weeks", "12 weeks"],
    description: "Protects against 4 diseases: Panleukopenia, Herpesvirus, Calicivirus, and Chlamydia.",
    sideEffects: ["injection site swelling"],
    ageRestriction: { minWeeks: 8, maxYears: null },
    lastUpdated: "2025-01-01",
    type: "recommended"
  }
]; 