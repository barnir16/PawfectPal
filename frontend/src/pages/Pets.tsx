import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Grid, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

// Components
import { PetCard } from "../features/pets/components/PetCard";
import { PetsTable } from "../features/pets/components/PetsTable";
import { PetsEmptyState } from "../features/pets/components/PetsEmptyState";
import { PetsToolbar } from "../features/pets/components/PetsToolbar";

// Types
export interface Pet {
  id: number;
  name: string;
  type: string;
  breed: string;
  birthDate: string;
  gender: string;
  weight: number;
  image: string;
  lastVetVisit: string;
  nextVaccination: string;
}

// Mock data - replace with real data from your API
const mockPets: Pet[] = [
  {
    id: 1,
    name: "Max",
    type: "Dog",
    breed: "Golden Retriever",
    birthDate: "2020-05-15",
    gender: "Male",
    weight: 28.5,
    image: "/placeholder-dog.jpg",
    lastVetVisit: "2023-10-10",
    nextVaccination: "2024-04-15",
  },
  {
    id: 2,
    name: "Bella",
    type: "Cat",
    breed: "Siamese",
    birthDate: "2019-11-22",
    gender: "Female",
    weight: 4.2,
    image: "/placeholder-cat.jpg",
    lastVetVisit: "2023-09-28",
    nextVaccination: "2024-03-28",
  },
  {
    id: 3,
    name: "Charlie",
    type: "Dog",
    breed: "Beagle",
    birthDate: "2021-02-10",
    gender: "Male",
    weight: 12.8,
    image: "/placeholder-dog2.jpg",
    lastVetVisit: "2023-11-05",
    nextVaccination: "2024-05-10",
  },
];



export const Pets = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const handleAddPet = () => {
    navigate("/pets/new");
  };

  const handleEditPet = (id: number) => {
    navigate(`/pets/${id}/edit`);
  };

  const handleDeletePet = (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this pet? This action cannot be undone."
      )
    ) {
      // Delete pet logic here
      console.log("Deleting pet with id:", id);
    }
  };

  const filteredPets = mockPets.filter(
    (pet) =>
      (pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedType === "All" || pet.type === selectedType)
  );

  let content;

  if (filteredPets.length === 0) {
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
          <Grid item key={pet.id} xs={12} sm={6} md={4} lg={3}>
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
