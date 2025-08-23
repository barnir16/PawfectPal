import { Avatar, Box, Button, Card, CardActions, CardContent, CardHeader, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Pets as PetsIcon } from "@mui/icons-material";
import type { Pet } from "../../../types/pets/pet";

interface PetCardProps {
  pet: Pet;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const PetCard = ({ pet, onEdit, onDelete }: PetCardProps) => {
  let chipColor: "primary" | "secondary" | "default" = "default";
  // Handle both 'type' and 'breedType' for backward compatibility
  const petType = pet.type || pet.breedType || "other";
  if (petType === "dog") chipColor = "primary";
  else if (petType === "cat") chipColor = "secondary";

  // Calculate age from birthdate or use provided age
  const calculateAge = () => {
    // First try to use the age field directly
    if (pet.age !== undefined && pet.age !== null) {
      return `${pet.age} years`;
    }
    
    // Then try to calculate from birth date (check both field names)
    const birthDate = pet.birthDate || pet.birth_date;
    if (birthDate) {
      try {
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return "Unknown age";
        const today = new Date();
        const ageInYears = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        return `${ageInYears} years`;
      } catch {
        return "Unknown age";
      }
    }
    return "Unknown age";
  };

  // Always show age, regardless of whether birthday is given
  const displayAge = calculateAge();

  // Format weight display
  const formatWeight = () => {
    const weight = pet.weightKg || pet.weight_kg;
    if (!weight) return "Not specified";
    return `${weight} ${pet.weightUnit || 'kg'}`;
  };

  // Format dates with fallback
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not given yet";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Not given yet";
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "Not given yet";
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
              label={petType}
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
            <Tooltip title="Edit">
              <IconButton
                onClick={() => pet.id && onEdit(pet.id)}
                size="small"
                sx={{ mr: 0.5 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
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
            <strong>Age:</strong> {displayAge}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Weight:</strong> {formatWeight()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Last Vet Visit:</strong> {formatDate(pet.lastVetVisit || pet.last_vet_visit)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Next Vaccination:</strong> {formatDate(pet.nextVetVisit || pet.next_vet_visit)}
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ mt: "auto", justifyContent: "flex-end" }}>
        <Button size="small" onClick={() => pet.id && onEdit(pet.id)}>
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default PetCard;
