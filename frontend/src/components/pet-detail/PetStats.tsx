import { Box, Grid, Paper, Typography, useTheme } from "@mui/material";
import {
  Cake as CakeIcon,
  Scale as ScaleIcon,
  LocalHospital as HospitalIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import { format, differenceInYears, differenceInMonths } from "date-fns";

interface PetStatsProps {
  pet: {
    birthDate: string | Date;
    weight: number;
    weightUnit: string;
    lastVetVisit?: string;
    nextVaccination?: string;
  };
}

export const PetStats = ({ pet }: PetStatsProps) => {
  const theme = useTheme();
  const { birthDate, weight, weightUnit, lastVetVisit, nextVaccination } = pet;

  // Calculate age
  const calculateAge = (birthDate: string | Date) => {
    const today = new Date();
    const birth =
      typeof birthDate === "string" ? new Date(birthDate) : birthDate;

    const years = differenceInYears(today, birth);
    const months = differenceInMonths(today, birth) % 12;

    if (years === 0) {
      return `${months} ${months === 1 ? "month" : "months"} old`;
    } else if (months === 0) {
      return `${years} ${years === 1 ? "year" : "years"} old`;
    } else {
      return `${years} ${years === 1 ? "year" : "years"}, ${months} ${months === 1 ? "month" : "months"} old`;
    }
  };

  const stats = [
    {
      icon: <CakeIcon color="primary" />,
      label: "Age",
      value: calculateAge(birthDate),
      description: `Born on ${format(new Date(birthDate), "MMM d, yyyy")}`,
    },
    {
      icon: <ScaleIcon color="primary" />,
      label: "Weight",
      value: `${weight} ${weightUnit}`,
      description: "Last updated today",
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
      value: nextVaccination
        ? format(new Date(nextVaccination), "MMM d, yyyy")
        : "Not scheduled",
      description: nextVaccination ? "Due soon" : "No upcoming vaccinations",
    },
  ];

  return (
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
  );
};

export default PetStats;
