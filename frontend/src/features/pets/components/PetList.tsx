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
import { formatPetAge } from "../../../utils/petAge";

export default function PetListScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLocalization();

  const fetchPets = async () => {
    try {
      const fetchedPets = await getPets();
      setPets(fetchedPets);
    } catch (error) {
      console.error("Failed to fetch pets:", error);
      alert(t("pets.failedToFetch"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleDeletePet = async (pet: Pet) => {
    if (window.confirm(t("pets.deleteConfirmation").replace("{name}", pet.name))) {
      try {
        await deletePet(pet.id!);
        alert(t("pets.petDeleted"));
        fetchPets();
      } catch (error) {
        console.error("Failed to delete pet:", error);
        alert(t("pets.failedToDelete"));
      }
    }
  };

  const formatWeight = (pet: Pet) => {
    const weight = pet.weightKg;
    if (!weight) return t("pets.notSpecified");
    return `${weight} ${pet.weightUnit || t("pets.kg")}`;
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
        <Typography variant="h4">{t("pets.myPets")}</Typography>
        <Button variant="contained" onClick={() => navigate("/add-pet")}>
          + {t("pets.addPet")}
        </Button>
      </Box>

      {pets.length === 0 ? (
        <Box textAlign="center" mt={10}>
          <Typography variant="h6" gutterBottom>
            {t("pets.noPetsYet")}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t("pets.addFirstPetToStart")}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/add-pet")}>
            {t("pets.addYourFirstPet")}
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {pets.map((pet) => (
            <Grid key={pet.id || pet.name} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 280
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                    '&:last-child': { pb: 2 }
                  }}
                >
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
                          fontSize: "1.1rem"
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
                          fontWeight: "medium"
                        }}
                      >
                        {pet.type || t("pets.unknownType")}
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
                      fontSize: "0.9rem"
                    }}
                  >
                    {pet.breed}
                  </Typography>

                  <Box sx={{ flexGrow: 1, mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: "0.9rem" }}>
                      <strong>Age:</strong>{" "}
                      {formatPetAge(pet, {
                        months: t("pets.months"),
                        years: t("pets.years"),
                        unknownAge: t("pets.unknownAge"),
                        futureBirthdate: t("pets.futureBirthdate"),
                      })}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: "0.9rem" }}>
                      <strong>Weight:</strong> {formatWeight(pet)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: "0.9rem" }}>
                      <strong>Gender:</strong> {pet.gender}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: "auto" }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/pets/${pet.id}`)}
                      sx={{
                        textTransform: "none",
                        fontWeight: "medium",
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
