import { Vaccine, AgeRestriction } from '../../types/references';

// Mock data for vaccines
const vaccines: Vaccine[] = [
  {
    id: 1,
    name: 'Rabies',
    description: 'Protects against rabies virus',
    isRequired: true,
    minAgeWeeks: 12,
    boosterFrequencyWeeks: 52,
  },
  {
    id: 2,
    name: 'DHPP',
    description: 'Protects against distemper, hepatitis, parainfluenza, and parvovirus',
    isRequired: true,
    minAgeWeeks: 6,
    boosterFrequencyWeeks: 52,
  },
  {
    id: 3,
    name: 'Bordetella',
    description: 'Protects against kennel cough',
    isRequired: false,
    minAgeWeeks: 8,
    boosterFrequencyWeeks: 26,
  },
];

// Mock data for age restrictions
const ageRestrictions: AgeRestriction[] = [
  {
    id: 1,
    activity: 'Spaying/Neutering',
    minAgeWeeks: 16,
    maxAgeWeeks: 52,
    description: 'Recommended age range for spaying or neutering',
  },
  {
    id: 2,
    activity: 'Training Classes',
    minAgeWeeks: 8,
    maxAgeWeeks: null,
    description: 'Can start training classes at 8 weeks',
  },
  {
    id: 3,
    activity: 'Socialization',
    minAgeWeeks: 3,
    maxAgeWeeks: 16,
    description: 'Critical socialization period',
  },
];

export const getRecommendedVaccines = (petAgeInWeeks: number): Vaccine[] => {
  return vaccines.filter(vaccine => 
    vaccine.isRequired && petAgeInWeeks >= vaccine.minAgeWeeks
  );
};

export const getOptionalVaccines = (petAgeInWeeks: number): Vaccine[] => {
  return vaccines.filter(vaccine => 
    !vaccine.isRequired && petAgeInWeeks >= vaccine.minAgeWeeks
  );
};

export const getAgeRestrictions = (): AgeRestriction[] => {
  return ageRestrictions;
};

export const getVaccines = (): Vaccine[] => {
  return vaccines;
};

