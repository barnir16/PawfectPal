export interface Vaccine {
  id: number;
  name: string;
  description: string;
  isRequired: boolean;
  minAgeWeeks: number;
  boosterFrequencyWeeks: number;
}

export interface AgeRestriction {
  id: number;
  activity: string;
  minAgeWeeks: number;
  maxAgeWeeks: number | null;
  description: string;
}

