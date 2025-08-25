import { Box, Grid, Paper, Typography, useTheme, Alert } from "@mui/material";
import {
  Cake as CakeIcon,
  Scale as ScaleIcon,
  LocalHospital as HospitalIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { differenceInYears, differenceInMonths, format } from "date-fns";

interface PetStatsProps {
  pet: {
    name?: string;
    birthDate?: string | Date;
    weightKg?: number;
    weight_kg?: number;
    weightUnit?: string;
    lastVetVisit?: string;
    nextVetVisit?: string;
    type?: string;
    breed?: string;
  };
}

export const PetStats = ({ pet }: PetStatsProps) => {
  const theme = useTheme();
  const { name, birthDate, weightKg, weight_kg, weightUnit, lastVetVisit, nextVetVisit, type, breed } = pet;
  const petName = name || 'Your pet';

  // Get the actual weight value
  const currentWeight = weightKg || weight_kg || 0;
  const weightUnitDisplay = weightUnit || 'kg';

  // Calculate age
  const calculateAge = (birthDate: string | Date) => {
    if (!birthDate) return "Unknown";
    
    try {
      const today = new Date();
      const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;

      const years = differenceInYears(today, birth);
      const months = differenceInMonths(today, birth) % 12;

      if (years === 0) {
        if (months === 0) {
          const days = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
          if (days < 7) {
            const weeks = Math.floor(days / 7);
            return `${weeks} ${weeks === 1 ? "week" : "weeks"} old`;
          } else {
            return `${days} ${days === 1 ? "day" : "days"} old`;
          }
        }
        return `${months} ${months === 1 ? "month" : "months"} old`;
      } else if (months === 0) {
        return `${years} ${years === 1 ? "year" : "years"} old`;
      } else {
        return `${years} ${years === 1 ? "year" : "years"}, ${months} ${months === 1 ? "month" : "months"} old`;
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  // Weight status check based on breed and type
  const getWeightStatus = () => {
    if (!currentWeight || currentWeight <= 0 || !type || !breed) return null;

    const normalizedType = type.toLowerCase();
    const normalizedBreed = breed.toLowerCase();

    // Basic weight ranges for common breeds (this should be enhanced with breed-specific data)
    let expectedMin = 0;
    let expectedMax = 0;
    let unit = weightUnitDisplay;

    if (normalizedType === 'dog') {
      if (normalizedBreed.includes('chihuahua') || normalizedBreed.includes('yorkie')) {
        expectedMin = 1; expectedMax = 3; unit = 'kg';
      } else if (normalizedBreed.includes('labrador') || normalizedBreed.includes('golden')) {
        expectedMin = 25; expectedMax = 36; unit = 'kg';
      } else if (normalizedBreed.includes('german shepherd')) {
        expectedMin = 22; expectedMax = 40; unit = 'kg';
      } else if (normalizedBreed.includes('bulldog') || normalizedBreed.includes('french')) {
        expectedMin = 8; expectedMax = 14; unit = 'kg';
      } else {
        // Default medium dog range
        expectedMin = 15; expectedMax = 30; unit = 'kg';
      }
    } else if (normalizedType === 'cat') {
      if (normalizedBreed.includes('persian') || normalizedBreed.includes('ragdoll')) {
        expectedMin = 3; expectedMax = 7; unit = 'kg';
      } else if (normalizedBreed.includes('siamese') || normalizedBreed.includes('british')) {
        expectedMin = 3; expectedMax = 6; unit = 'kg';
      } else {
        // Default cat range
        expectedMin = 3; expectedMax = 6; unit = 'kg';
      }
    }

    // Convert units if necessary
    let normalizedWeight = currentWeight;
    if (unit !== weightUnitDisplay) {
      if (unit === 'kg' && weightUnitDisplay === 'lb') {
        normalizedWeight = currentWeight * 0.453592;
      } else if (unit === 'lb' && weightUnitDisplay === 'kg') {
        normalizedWeight = currentWeight * 2.20462;
      }
    }

    if (normalizedWeight < expectedMin) {
      return { 
        status: 'underweight', 
        severity: 'warning' as const, 
        message: `${petName} appears to be underweight for this breed (${expectedMin}-${expectedMax}${unit} range). Consider consulting a vet.`,
        currentWeight: normalizedWeight,
        expectedRange: { min: expectedMin, max: expectedMax, unit }
      };
    } else if (normalizedWeight > expectedMax) {
      return { 
        status: 'overweight', 
        severity: 'warning' as const, 
        message: `${petName} appears to be overweight for this breed (${expectedMin}-${expectedMax}${unit} range). Consider diet and exercise adjustments.`,
        currentWeight: normalizedWeight,
        expectedRange: { min: expectedMin, max: expectedMax, unit }
      };
    } else {
      return { 
        status: 'healthy', 
        severity: 'success' as const, 
        message: `${petName}'s weight is within healthy range for this breed (${expectedMin}-${expectedMax}${unit})`,
        currentWeight: normalizedWeight,
        expectedRange: { min: expectedMin, max: expectedMax, unit }
      };
    }
  };

  const weightStatus = getWeightStatus();

  const stats = [
    {
      icon: <CakeIcon color="primary" />,
      label: "Age",
      value: birthDate ? calculateAge(birthDate) : "Unknown",
      description: birthDate ? `Born on ${format(new Date(birthDate), "MMM d, yyyy")}` : "Birth date not provided",
    },
    {
      icon: <ScaleIcon color="primary" />,
      label: "Weight",
      value: currentWeight && currentWeight > 0 ? `${currentWeight} ${weightUnitDisplay}` : "Not recorded",
      description: currentWeight && currentWeight > 0 ? "Current weight" : "No weight data available",
    },
    {
      icon: <HospitalIcon color="primary" />,
      label: "Last Vet Visit",
      value: lastVetVisit
        ? format(new Date(lastVetVisit), "MMM d, yyyy")
        : "Never",
      description: lastVetVisit ? "Health check-up" : "No records found",
    },
    {
      icon: <EventIcon color="primary" />,
      label: "Next Vaccination",
      value: nextVetVisit
        ? format(new Date(nextVetVisit), "MMM d, yyyy")
        : "Not scheduled",
      description: nextVetVisit ? "Due soon" : "No upcoming vaccinations",
    },
  ];

  return (
    <Box>
      {/* Weight Status Alert */}
      {weightStatus && (
        <Alert 
          severity={weightStatus.severity} 
          sx={{ mb: 2 }}
          icon={weightStatus.status === 'healthy' ? <TrendingUpIcon /> : <WarningIcon />}
        >
          {weightStatus.message}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                height: "100%",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                "&:hover": {
                  boxShadow: theme.shadows[2],
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box sx={{ mr: 1 }}>{stat.icon}</Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PetStats;
