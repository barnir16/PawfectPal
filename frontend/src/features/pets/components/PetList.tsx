import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Pet } from "../../../types/pets";
import { getPets, deletePet } from "../../../api";

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

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(ageInYears);
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={pet.id || pet.name}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h6">{pet.name}</Typography>
                    <Typography variant="body2" color="primary">
                      {pet.breedType}
                    </Typography>
                  </Box>
                  <Typography color="textSecondary">{pet.breed}</Typography>

                  <Box mt={1}>
                    {pet.weightKg && (
                      <Typography variant="body2">
                        Weight: {pet.weightKg} kg
                      </Typography>
                    )}
                    {pet.birthDate && (
                      <Typography variant="body2">
                        Age: {calculateAge(pet.birthDate)} years
                      </Typography>
                    )}
                  </Box>

                  {pet.healthIssues.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2">
                        Health Issues:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {pet.healthIssues.join(", ")}
                      </Typography>
                    </Box>
                  )}

                  {pet.behaviorIssues.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2">
                        Behavior Issues:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {pet.behaviorIssues.join(", ")}
                      </Typography>
                    </Box>
                  )}

                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    mt={2}
                    spacing={1}
                  >
                    <Button
                      size="small"
                      onClick={() => navigate(`/edit-pet/${pet.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeletePet(pet)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
