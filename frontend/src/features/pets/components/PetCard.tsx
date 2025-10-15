import { Avatar, Box, Button, Card, CardActions, CardContent, CardHeader, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Pets as PetsIcon } from "@mui/icons-material";
import type { Pet } from "../../../types/pets/pet";
import { useLocalization } from "../../../contexts/LocalizationContext";

interface PetCardProps {
  pet: Pet;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const PetCard = ({ pet, onEdit, onDelete }: PetCardProps) => {
  const { t } = useLocalization();
  let chipColor: "primary" | "secondary" | "default" = "default";
  // Handle both 'type' and 'breedType' for backward compatibility
  const petType = pet.type || "other";
  if (petType === "dog") chipColor = "primary";
  else if (petType === "cat") chipColor = "secondary";

  // Calculate age from birthdate or use provided age
  const calculateAge = () => {
    console.log('🔍 PetCard calculateAge called for:', pet.name, 'at', new Date().toISOString());
    
    // Debug logging for Nicole
    if (pet.name === 'Nicole') {
      console.log('🐕 PetCard Nicole age calculation debug:', {
        name: pet.name,
        age: pet.age,
        birthDate: pet.birthDate,
        isBirthdayGiven: pet.isBirthdayGiven,
        ageType: pet.age !== undefined ? 'age field' : 'birthdate',
        fullPetObject: pet,
        timestamp: new Date().toISOString()
      });
    }
    
    // Always prioritize birthdate calculation if birthday is given
    const birthDate = pet.birthDate;
    if (birthDate && pet.isBirthdayGiven) {
      try {
        // For ISO date strings like '2025-01-01', ensure we parse as local time
        let birth;
        if (typeof birthDate === 'string' && birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Parse as local date to avoid timezone issues
          const [year, month, day] = birthDate.split('-').map(Number);
          birth = new Date(year, month - 1, day); // month is 0-indexed
          
          // Debug: Test with hardcoded date for Nicole
          if (pet.name === 'Nicole') {
            const testDate = new Date(2025, 0, 1); // January 1, 2025
            const now = new Date();
            const testDays = Math.floor((now.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24));
            const testMonths = Math.floor(testDays / 30.44);
            console.log('🧪 PetCard Hardcoded test for Nicole:', {
              testDate: testDate.toISOString(),
              now: now.toISOString(),
              testDays,
              testMonths,
              shouldBe: '8 months'
            });
          }
        } else {
          birth = new Date(birthDate);
        }
        
        if (isNaN(birth.getTime())) return t('pets.unknownAge');
        const today = new Date();
        const ageInMilliseconds = today.getTime() - birth.getTime();
        const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
        const ageInMonths = Math.floor(ageInDays / 30.44);
        const ageInYears = Math.floor(ageInDays / 365.25);
        
        // Handle future birthdates
        if (ageInDays < 0) {
          return t('pets.futureBirthdate');
        }
        
        if (ageInYears < 1) {
          const months = Math.max(0, ageInMonths);
          const result = `${months} ${t('pets.months')}`;
          
          // Debug logging for Nicole
          if (pet.name === 'Nicole') {
            console.log('🐕 PetCard Nicole age calculation result:', {
              birthDate,
              parsedBirth: birth.toISOString(),
              ageInDays,
              ageInMonths,
              ageInYears,
              currentDate: today.toISOString(),
              timeDiff: ageInMilliseconds,
              isFuture: ageInDays < 0,
              finalResult: result
            });
          }
          
          return result;
        }
        return `${ageInYears} ${t('pets.years')}`;
      } catch {
        return t('pets.unknownAge');
      }
    }
    
    // Fallback to age field if no birthdate or birthday not given
    if (pet.age !== undefined && pet.age !== null) {
      if (pet.age < 1) {
        const months = Math.floor(pet.age * 12);
        return `${months} ${t('pets.months')}`;
      }
      return `${pet.age} ${t('pets.years')}`;
    }
    
    return t('pets.unknownAge');
  };

  // Always show age, regardless of whether birthday is given
  const displayAge = calculateAge();

  // Format weight display
  const formatWeight = () => {
    const weight = pet.weightKg;
    if (!weight) return t('pets.notSpecified');
    const unit = pet.weightUnit || 'kg';
    const localizedUnit = unit === 'kg' ? t('pets.kg') : t('pets.pounds');
    return `${weight} ${localizedUnit}`;
  };

  // Format dates with fallback
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('pets.notGivenYet');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('pets.notGivenYet');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return t('pets.notGivenYet');
    }
  };

  // Handle health and behavior issues (could be string or array)
  // const formatIssues = (issues: string | string[] | undefined) => {
  //   if (!issues) return [];
  //   if (Array.isArray(issues)) return issues;
  //   return issues.split(',').map(s => s.trim()).filter(Boolean);
  // };

  // Format issues for display (currently not used but kept for future use)
  // const healthIssues = formatIssues(pet.healthIssues);
  // const behaviorIssues = formatIssues(pet.behaviorIssues);

  return (
    <Card sx={{ 
      height: "100%", 
      display: "flex", 
      flexDirection: "column",
      minWidth: 280, // Slightly wider minimum width
      maxWidth: 350, // Maximum width to prevent cards from being too wide
      overflow: "hidden" // Prevent content overflow
    }}>
      <CardHeader
        sx={{
          "& .MuiCardHeader-content": {
            minWidth: 0, // Allow content to shrink
            overflow: "hidden"
          }
        }}
        avatar={
          <Avatar
            src={pet.imageUrl}
            alt={pet.name}
            sx={{ width: 60, height: 60, bgcolor: "primary.main" }}
          >
            <PetsIcon fontSize="large" />
          </Avatar>
        }
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
            <Typography variant="h6" component="div" sx={{ 
              flex: 1,
              minWidth: 0 
            }}>
              {pet.name}
            </Typography>
            <Chip
              label={t(`pets.${petType}`)}
              size="small"
              sx={{ textTransform: "capitalize", flexShrink: 0 }}
              color={chipColor}
            />
          </Box>
        }
        subheader={
          <Typography variant="body2" sx={{ 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap" 
          }}>
            {pet.breed} • {pet.gender}
          </Typography>
        }
        action={
          <Box>
            <Tooltip title={t('pets.edit')}>
              <IconButton
                onClick={() => pet.id && onEdit(pet.id)}
                size="small"
                sx={{ mr: 0.5 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('pets.delete')}>
              <IconButton
                onClick={() => pet.id && onDelete(pet.id)}
                size="small"
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
              <strong>{t('pets.age')}:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayAge}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
              <strong>{t('pets.weight')}:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatWeight()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
              <strong>{t('pets.lastVetVisit')}:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(pet.lastVetVisit)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
              <strong>{t('pets.nextVaccination')}:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(pet.nextVetVisit)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
      <CardActions sx={{ mt: "auto", justifyContent: "flex-end" }}>
        <Button size="small" onClick={() => pet.id && onEdit(pet.id)}>
          {t('pets.viewDetails')}
        </Button>
      </CardActions>
    </Card>
  );
};

export default PetCard;
