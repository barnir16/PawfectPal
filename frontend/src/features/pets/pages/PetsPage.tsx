import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Grid, Typography, CircularProgress } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

// Components
import { PetCard } from "./../../../features/pets/components/PetCard";
import { PetsTable } from "./../../../features/pets/components/PetsTable";
import { PetsEmptyState } from "./../../../features/pets/components/PetsEmptyState";
import { PetsToolbar } from "./../../../features/pets/components/PetsToolbar";

// API and Types
import { getPets, deletePet } from "../../../services/pets/petService";
import type { Pet } from "../../../types/pets/pet";

export const Pets = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const fetchPets = async () => {
    try {
      setLoading(true);
      const fetchedPets = await getPets();
      setPets(fetchedPets);
    } catch (error) {
      console.error("Failed to fetch pets:", error);
      // Don't show alert here, just log the error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleAddPet = () => {
    navigate("/pets/new");
  };

  const handleEditPet = (id: number) => {
    navigate(`/pets/${id}/edit`);
  };

  const handleDeletePet = async (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this pet? This action cannot be undone."
      )
    ) {
      try {
        await deletePet(id);
        // Refresh the pets list
        await fetchPets();
      } catch (error) {
        console.error("Failed to delete pet:", error);
        alert("Failed to delete pet. Please try again.");
      }
    }
  };

  const filteredPets = pets.filter(
    (pet) =>
      (pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedType === "All" || (pet.type || pet.breedType) === selectedType)
  );

  let content;

  if (loading) {
    content = (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="200px"
      >
        <CircularProgress />
      </Box>
    );
  } else if (filteredPets.length === 0) {
    content = (
      <PetsEmptyState
        searchTerm={searchTerm}
        selectedType={selectedType}
        onAddPet={handleAddPet}
      />
    );
  } else if (view === "grid") {
    content = (
      <Grid container spacing={3}>
        {filteredPets.map((pet) => (
          <Grid key={pet.id} size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }}>
            <PetCard
              pet={pet}
              onEdit={handleEditPet}
              onDelete={handleDeletePet}
            />
          </Grid>
        ))}
      </Grid>
    );
  } else {
    content = (
      <PetsTable
        pets={filteredPets}
        onEdit={handleEditPet}
        onDelete={handleDeletePet}
      />
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          My Pets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPet}
        >
          Add Pet
        </Button>
      </Box>

      <PetsToolbar
        searchTerm={searchTerm}
        selectedType={selectedType}
        view={view}
        onSearchChange={setSearchTerm}
        onTypeChange={setSelectedType}
        onViewChange={setView}
        onAddPet={handleAddPet}
      />

      {content}
    </Box>
  );
};

export default Pets;
