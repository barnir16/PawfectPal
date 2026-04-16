interface PetAgeInput {
  age?: number | null;
  birthDate?: string | Date | null;
  birth_date?: string | Date | null;
  isBirthdayGiven?: boolean | null;
  is_birthday_given?: boolean | null;
}

interface PetAgeLabels {
  months: string;
  years: string;
  unknownAge: string;
  futureBirthdate: string;
}

const parseBirthDate = (
  birthDate?: string | Date | null
): Date | null => {
  if (!birthDate) {
    return null;
  }

  if (birthDate instanceof Date) {
    return Number.isNaN(birthDate.getTime()) ? null : birthDate;
  }

  if (typeof birthDate !== "string") {
    return null;
  }

  if (birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = birthDate.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(birthDate);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  if (birthDate.includes("/") || birthDate.includes(".")) {
    const separator = birthDate.includes("/") ? "/" : ".";
    const parts = birthDate.split(separator);

    if (parts.length === 3) {
      const [first, second, third] = parts.map(Number);

      const dayFirstDate = new Date(third, second - 1, first);
      if (!Number.isNaN(dayFirstDate.getTime())) {
        return dayFirstDate;
      }

      const monthFirstDate = new Date(third, first - 1, second);
      if (!Number.isNaN(monthFirstDate.getTime())) {
        return monthFirstDate;
      }
    }
  }

  return null;
};

const getBirthDate = (pet: PetAgeInput): Date | null => {
  return parseBirthDate(pet.birthDate ?? pet.birth_date ?? null);
};

export const calculatePetAgeInYears = (pet: PetAgeInput): number | null => {
  const birthDate = getBirthDate(pet);

  if (birthDate) {
    const ageInDays = Math.floor(
      (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (ageInDays < 0) {
      return null;
    }

    return ageInDays / 365.25;
  }

  if (typeof pet.age === "number" && Number.isFinite(pet.age)) {
    return pet.age;
  }

  return null;
};

export const formatPetAge = (
  pet: PetAgeInput,
  labels: PetAgeLabels
): string => {
  const birthDate = getBirthDate(pet);

  if (birthDate) {
    const ageInDays = Math.floor(
      (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (ageInDays < 0) {
      return labels.futureBirthdate;
    }

    const ageInMonths = Math.floor(ageInDays / 30.44);
    const ageInYears = Math.floor(ageInDays / 365.25);

    if (ageInYears < 1) {
      return `${Math.max(0, ageInMonths)} ${labels.months}`;
    }

    return `${ageInYears} ${labels.years}`;
  }

  if (typeof pet.age === "number" && Number.isFinite(pet.age)) {
    if (pet.age < 1) {
      return `${Math.floor(pet.age * 12)} ${labels.months}`;
    }

    return `${Math.floor(pet.age)} ${labels.years}`;
  }

  return labels.unknownAge;
};
