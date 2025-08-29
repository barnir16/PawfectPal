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
  const petType = pet.type || pet.breedType || "other";
  if (petType === "dog") chipColor = "primary";
  else if (petType === "cat") chipColor = "secondary";

  // Calculate age from birthdate or use provided age
  const calculateAge = () => {
    // First try to use the age field directly
    if (pet.age !== undefined && pet.age !== null) {
      if (pet.age < 1) {
        const months = Math.floor(pet.age * 12);
        return `${months} ${t('pets.months')}`;
      }
      return `${pet.age} ${t('pets.years')}`;
    }
    
    // Then try to calculate from birth date (check both field names)
    const birthDate = pet.birthDate || pet.birth_date;
    if (birthDate) {
      try {
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return t('pets.unknownAge');
        const today = new Date();
        const ageInYears = (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (ageInYears < 1) {
          const months = Math.floor(ageInYears * 12);
          return `${months} ${t('pets.months')}`;
        }
        return `${Math.floor(ageInYears)} ${t('pets.years')}`;
      } catch {
        return t('pets.unknownAge');
      }
    }
    return t('pets.unknownAge');
  };

  // Always show age, regardless of whether birthday is given
  const displayAge = calculateAge();

  // Format weight display
  const formatWeight = () => {
    const weight = pet.weightKg || pet.weight_kg;
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
      minWidth: 0, // Allow card to shrink
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
            src={pet.imageUrl || pet.photo_uri}
            alt={pet.name}
            sx={{ width: 60, height: 60, bgcolor: "primary.main" }}
          >
            <PetsIcon fontSize="large" />
          </Avatar>
        }
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Typography variant="h6" component="div" sx={{ 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap",
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
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{t('pets.age')}:</strong> {displayAge}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>{t('pets.weight')}:</strong> {formatWeight()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>{t('pets.lastVetVisit')}:</strong> {formatDate(pet.lastVetVisit || pet.last_vet_visit)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>{t('pets.nextVaccination')}:</strong> {formatDate(pet.nextVetVisit || pet.next_vet_visit)}
          </Typography>
        </Box>
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
