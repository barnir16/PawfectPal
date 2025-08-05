import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Pets as PetsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { format } from "date-fns";

interface Pet {
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
const mockPets = [
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

const petTypes = ["All", "Dog", "Cat", "Bird", "Rabbit", "Other"];

const PetCard = ({
  pet,
  onEdit,
  onDelete,
}: {
  pet: any;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  let chipColor: "primary" | "secondary" | "default" = "default";
  if (pet.type === "Dog") chipColor = "primary";
  else if (pet.type === "Cat") chipColor = "secondary";

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        avatar={
          <Avatar
            src={pet.image}
            alt={pet.name}
            sx={{ width: 60, height: 60, bgcolor: "primary.main" }}
          >
            <PetsIcon fontSize="large" />
          </Avatar>
        }
        title={
          <Typography variant="h6" component="div">
            {pet.name}
            <Chip
              label={pet.type}
              size="small"
              sx={{ ml: 1, textTransform: "capitalize" }}
              color={chipColor}
            />
          </Typography>
        }
        subheader={`${pet.breed} • ${pet.gender}`}
        action={
          <Box>
            <Tooltip title="Edit">
              <IconButton
                onClick={() => onEdit(pet.id)}
                size="small"
                sx={{ mr: 0.5 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => onDelete(pet.id)}
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
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            <strong>Age:</strong>{" "}
            {Math.floor(
              (new Date().getTime() - new Date(pet.birthDate).getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
            )}{" "}
            years
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Weight:</strong> {pet.weight} kg
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Last Vet Visit:</strong>{" "}
            {format(new Date(pet.lastVetVisit), "MMM d, yyyy")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Next Vaccination:</strong>{" "}
            {format(new Date(pet.nextVaccination), "MMM d, yyyy")}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ mt: "auto", justifyContent: "flex-end" }}>
        <Button size="small" onClick={() => onEdit(pet.id)}>
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

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

  const columns: GridColDef<Pet>[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Pet>) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={params.row.image}
            alt={params.row.name}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            <PetsIcon />
          </Avatar>
          {params.row.name}
        </Box>
      ),
    },
    { field: "type", headerName: "Type", flex: 1 },
    { field: "breed", headerName: "Breed", flex: 1 },
    {
      field: "age",
      headerName: "Age",
      flex: 1,
      valueGetter: (params: GridRenderCellParams<Pet>) =>
        Math.floor(
          (new Date().getTime() - new Date(params.row.birthDate).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        ) + " years",
    },
    { field: "gender", headerName: "Gender", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleEditPet(params.row.id)} size="small">
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDeletePet(params.row.id)}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Extracted content variable to avoid nested ternary
  let emptyMessage = "Get started by adding your first pet!";
  if (searchTerm || selectedType !== "All") {
    emptyMessage = "Try adjusting your search or filter criteria.";
  }

  let content;

  if (filteredPets.length === 0) {
    content = (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <PetsIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No pets found
        </Typography>
        <Typography color="text.secondary" paragraph>
          {emptyMessage}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPet}
          sx={{ mt: 2 }}
        >
          Add Pet
        </Button>
      </Paper>
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
      <Paper sx={{ width: "100%", height: 400, overflow: "hidden" }}>
        <DataGrid<Pet>
          rows={filteredPets}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
          sx={{
            "& .MuiDataGrid-cell:focus": { outline: "none" },
            "& .MuiDataRow-hover": { cursor: "pointer" },
            height: "100%",
          }}
          onRowClick={(params) => handleEditPet(params.row.id)}
        />
      </Paper>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search pets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Filter by Type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                SelectProps={{
                  native: true,
                }}
                InputProps={{
                  startAdornment: (
                    <FilterListIcon sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              >
                {petTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid
              item
              xs={12}
              md={5}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                variant={view === "grid" ? "contained" : "outlined"}
                onClick={() => setView("grid")}
                size="small"
                sx={{ mr: 1 }}
                startIcon={<FilterListIcon />}
              >
                Grid View
              </Button>
              <Button
                variant={view === "table" ? "contained" : "outlined"}
                onClick={() => setView("table")}
                size="small"
                startIcon={<FilterListIcon />}
              >
                Table View
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {content}
    </Box>
  );
};

export default Pets;
