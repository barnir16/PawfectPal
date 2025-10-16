import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useLocalization } from "../../../contexts/LocalizationContext";
import type { Pet } from "../../../types/pets/pet";
import { getPets, deletePet } from "../../../services/pets/petService";

export default function PetListScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLocalization();

  const fetchPets = async () => {
    try {
      console.log('🔄 Fetching pets...');
      const fetchedPets = await getPets();
      console.log('🔄 Fetched pets:', fetchedPets);
      setPets(fetchedPets);
    } catch (error) {
      console.log(error);
      alert(t('pets.failedToFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleDeletePet = async (pet: Pet) => {
    if (window.confirm(t('pets.deleteConfirmation').replace('{name}', pet.name))) {
      try {
        await deletePet(pet.id!);
        alert(t('pets.petDeleted'));
        fetchPets();
      } catch (error) {
        console.log(error);
        alert(t('pets.failedToDelete'));
      }
    }
  };

  const calculateAge = (pet: Pet) => {
    console.log('🔍 calculateAge called for:', pet.name, 'at', new Date().toISOString());
    
    // Debug logging for Nicole
    if (pet.name === 'Nicole') {
      console.log('🐕 Nicole age calculation debug:', {
        name: pet.name,
        age: pet.age,
        birthDate: pet.birthDate,
        isBirthdayGiven: pet.isBirthdayGiven,
        ageType: pet.age !== undefined ? 'age field' : 'birthdate',
        fullPetObject: pet,
        timestamp: new Date().toISOString()
      });
    }
    
    // Always try birthdate first if available - it's more accurate
    const birthDate = pet.birthDate;
    if (birthDate) {
      try {
        // Handle different date formats
        let birth;
        if (typeof birthDate === 'string') {
          // For ISO date strings like '2025-01-01', ensure we parse as local time
          if (birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Parse as local date to avoid timezone issues
            const [year, month, day] = birthDate.split('-').map(Number);
            birth = new Date(year, month - 1, day); // month is 0-indexed
            
            // Debug: Test with hardcoded date for Nicole
            if (pet.name === 'Nicole') {
              const testDate = new Date(2025, 0, 1); // January 1, 2025
              const now = new Date();
              const testDays = Math.floor((now.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24));
              const testMonths = Math.floor(testDays / 30.44);
              console.log('🧪 Hardcoded test for Nicole:', {
                testDate: testDate.toISOString(),
                now: now.toISOString(),
                testDays,
                testMonths,
                shouldBe: '8 months'
              });
            }
          } else {
            // Try parsing as ISO string first
            birth = new Date(birthDate);
            // If that fails, try parsing as DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY, or MM.DD.YYYY
            if (isNaN(birth.getTime()) && (birthDate.includes('/') || birthDate.includes('.'))) {
              const separator = birthDate.includes('/') ? '/' : '.';
              const parts = birthDate.split(separator);
              if (parts.length === 3) {
                // Try DD/MM/YYYY or DD.MM.YYYY format first
                birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                if (isNaN(birth.getTime())) {
                  // Try MM/DD/YYYY or MM.DD.YYYY format
                  birth = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                }
              }
            }
          }
        } else {
          birth = new Date(birthDate);
        }
        
        if (isNaN(birth.getTime())) {
          console.log('Invalid birthdate format:', birthDate);
          return t('pets.unknownAge');
        }
        
        const now = new Date();
        const ageInMilliseconds = now.getTime() - birth.getTime();
        
        // Calculate age more accurately
        const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
        const ageInMonths = Math.floor(ageInDays / 30.44); // Average days per month
        const ageInYears = Math.floor(ageInDays / 365.25);
        
        // Debug logging for Nicole
        if (pet.name === 'Nicole') {
          console.log('🐕 Nicole age calculation result:', {
            birthDate,
            parsedBirth: birth.toISOString(),
            ageInDays,
            ageInMonths,
            ageInYears,
            currentDate: now.toISOString(),
            timeDiff: ageInMilliseconds,
            isFuture: ageInDays < 0,
            finalResult: ageInYears < 1 ? `${Math.max(0, ageInMonths)} ${t('pets.months')}` : `${ageInYears} ${t('pets.years')}`
          });
        }
        
        // Handle future birthdates
        if (ageInDays < 0) {
          return t('pets.futureBirthdate');
        }
        
        if (ageInYears < 1) {
          // For pets under 1 year, show months
          const months = Math.max(0, ageInMonths);
          return `${months} ${t('pets.months')}`;
        }
        return `${ageInYears} ${t('pets.years')}`;
      } catch (error) {
        console.log('Error calculating age from birthdate:', birthDate, error);
        return t('pets.unknownAge');
      }
    }
    
    // Fallback to age field if no birthdate
    if (pet.age !== undefined && pet.age !== null) {
      if (pet.age < 1) {
        const months = Math.floor(pet.age * 12);
        return `${months} ${t('pets.months')}`;
      }
      return `${pet.age} ${t('pets.years')}`;
    }
    
    return t('pets.unknownAge');
  };

  const formatWeight = (pet: Pet) => {
    const weight = pet.weightKg;
          if (!weight) return t('pets.notSpecified');
          return `${weight} ${pet.weightUnit || t('pets.kg')}`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">{t('pets.myPets')}</Typography>
        <Button variant="contained" onClick={() => navigate("/add-pet")}>
          + {t('pets.addPet')}
        </Button>
      </Box>

      {pets.length === 0 ? (
        <Box textAlign="center" mt={10}>
          <Typography variant="h6" gutterBottom>
            {t('pets.noPetsYet')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t('pets.addFirstPetToStart')}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/add-pet")}>
            {t('pets.addYourFirstPet')}
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {pets.map((pet) => (
            <Grid key={pet.id || pet.name} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
              <Card sx={{ 
                height: "100%", 
                display: "flex", 
                flexDirection: "column",
                minHeight: 280
              }}>
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: "flex", 
                  flexDirection: "column", 
                  p: 2,
                  '&:last-child': { pb: 2 }
                }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap",
                          mb: 1,
                          fontSize: '1.1rem'
                        }}
                      >
                        {pet.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="primary"
                        sx={{ 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap",
                          fontWeight: 'medium'
                        }}
                      >
                        {pet.type || t('pets.unknownType')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/edit-pet/${pet.id}`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePet(pet)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography 
                    color="textSecondary" 
                    sx={{ 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      whiteSpace: "nowrap",
                      mb: 2,
                      fontSize: '0.9rem'
                    }}
                  >
                    {pet.breed}
                  </Typography>

                  <Box sx={{ flexGrow: 1, mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: '0.9rem' }}>
                      <strong>Age:</strong> {calculateAge(pet)} 
                      {pet.name === 'Nicole' && (
                        <span style={{fontSize: '10px', color: 'gray'}}>
                          (Debug: {new Date().toLocaleTimeString()})
                        </span>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: '0.9rem' }}>
                      <strong>Weight:</strong> {formatWeight(pet)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: '0.9rem' }}>
                      <strong>Gender:</strong> {pet.gender}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/pets/${pet.id}`)}
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 'medium',
                        py: 1
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
