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
import type { Pet } from "../../../types/pets/pet";
import { getPets, deletePet } from "../../../services/pets/petService";

export default function PetListScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPets = async () => {
    try {
      const fetchedPets = await getPets();
      setPets(fetchedPets);
    } catch (error) {
      console.log(error);
      alert("Failed to fetch pets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleDeletePet = async (pet: Pet) => {
    if (window.confirm(`Are you sure you want to delete ${pet.name}?`)) {
      try {
        await deletePet(pet.id!);
        alert("Pet deleted successfully");
        fetchPets();
      } catch (error) {
        console.log(error);
        alert("Failed to delete pet");
      }
    }
  };

  const calculateAge = (pet: Pet) => {
    // First try to use the age field directly
    if (pet.age !== undefined && pet.age !== null) {
      return `${pet.age} years`;
    }
    
    // Then try to calculate from birth date
    const birthDate = pet.birthDate || pet.birth_date;
    if (birthDate) {
      try {
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return "Unknown age";
        const today = new Date();
        const ageInMs = today.getTime() - birth.getTime();
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        return `${Math.floor(ageInYears)} years`;
      } catch {
        return "Unknown age";
      }
    }
    return "Unknown age";
  };

  const formatWeight = (pet: Pet) => {
    const weight = pet.weightKg || pet.weight_kg;
    if (!weight) return "Not specified";
    return `${weight} ${pet.weightUnit || 'kg'}`;
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
        <Typography variant="h4">My Pets</Typography>
        <Button variant="contained" onClick={() => navigate("/add-pet")}>
          + Add Pet
        </Button>
      </Box>

      {pets.length === 0 ? (
        <Box textAlign="center" mt={10}>
          <Typography variant="h6" gutterBottom>
            No pets yet
          </Typography>
          <Typography variant="body1" gutterBottom>
            Add your first pet to start managing their care!
          </Typography>
          <Button variant="contained" onClick={() => navigate("/add-pet")}>
            Add Your First Pet
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
                        {pet.breedType || pet.type || "Unknown type"}
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
