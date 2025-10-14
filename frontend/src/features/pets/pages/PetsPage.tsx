import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText as MuiListItemText,
  ListItemIcon as MuiListItemIcon,
} from "@mui/material";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";

// Components
import { PetCard } from "./../../../features/pets/components/PetCard";
import { PetsTable } from "./../../../features/pets/components/PetsTable";
import { PetsEmptyState } from "./../../../features/pets/components/PetsEmptyState";
import { PetsToolbar } from "./../../../features/pets/components/PetsToolbar";

// API and Types
import { getPets, deletePet } from "../../../services/pets/petService";
import { getTasks } from "../../../services/tasks/taskService";
import type { Pet } from "../../../types/pets/pet";
import { useLocalization } from "../../../contexts/LocalizationContext";
import {
  generateAndDownloadMultiPetPDF,
  type PetData,
} from "../../../services/pdfService";

export const Pets = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState(t("pets.all"));
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState<null | HTMLElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [selectedPetsForPDF, setSelectedPetsForPDF] = useState<number[]>([]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      console.log("🔄 PetsPage: Fetching pets...");
      const fetchedPets = await getPets();
      console.log("🔄 PetsPage: Fetched pets:", fetchedPets);
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
    if (window.confirm(t("pets.deleteConfirmation"))) {
      try {
        await deletePet(id);
        // Refresh the pets list
        await fetchPets();
      } catch (error) {
        console.error("Failed to delete pet:", error);
        alert(t("pets.failedToDelete"));
      }
    }
  };

  const handlePdfMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPdfMenuAnchor(event.currentTarget);
  };

  const handlePdfMenuClose = () => {
    setPdfMenuAnchor(null);
  };

  const handleDownloadAllPetsPDF = async () => {
    try {
      setPdfLoading(true);
      const tasks = await getTasks();

      const petsData: PetData[] = pets.map((pet) => ({
        pet,
        tasks: tasks.filter((task) => task.petIds.includes(pet.id!)),
      }));

      await generateAndDownloadMultiPetPDF(petsData);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert(t("errors.generalError"));
    } finally {
      setPdfLoading(false);
      handlePdfMenuClose();
    }
  };

  const handleDownloadSelectedPetsPDF = () => {
    setShowPetSelection(true);
    handlePdfMenuClose();
  };

  const handlePetSelectionToggle = (petId: number) => {
    setSelectedPetsForPDF((prev) =>
      prev.includes(petId)
        ? prev.filter((id) => id !== petId)
        : [...prev, petId]
    );
  };

  const handleConfirmSelectedPetsPDF = async () => {
    if (selectedPetsForPDF.length === 0) {
      alert(t("pets.selectAtLeastOnePet"));
      return;
    }

    try {
      setPdfLoading(true);
      const tasks = await getTasks();

      const selectedPets = pets.filter((pet) =>
        selectedPetsForPDF.includes(pet.id!)
      );
      const petsData: PetData[] = selectedPets.map((pet) => ({
        pet,
        tasks: tasks.filter((task) => task.petIds.includes(pet.id!)),
      }));

      await generateAndDownloadMultiPetPDF(petsData);
      setShowPetSelection(false);
      setSelectedPetsForPDF([]);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert(t("errors.generalError"));
    } finally {
      setPdfLoading(false);
    }
  };

  const filteredPets = pets.filter(
    (pet) =>
      (pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedType === t("pets.all") ||
        (pet.type) === selectedType)
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
          {t("pets.myPets")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={
              pdfLoading ? <CircularProgress size={20} /> : <DownloadIcon />
            }
            onClick={handlePdfMenuOpen}
            disabled={pets.length === 0 || pdfLoading}
          >
            {t("pets.downloadPDF")}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPet}
          >
            {t("pets.addPet")}
          </Button>
        </Box>
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

      {/* PDF Download Menu */}
      <Menu
        anchorEl={pdfMenuAnchor}
        open={Boolean(pdfMenuAnchor)}
        onClose={handlePdfMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={handleDownloadAllPetsPDF} disabled={pdfLoading}>
          <ListItemIcon>
            <PdfIcon />
          </ListItemIcon>
          <ListItemText primary={t("pets.downloadAllPets")} />
        </MenuItem>
        <MenuItem
          onClick={handleDownloadSelectedPetsPDF}
          disabled={pdfLoading || filteredPets.length === 0}
        >
          <ListItemIcon>
            <PdfIcon />
          </ListItemIcon>
          <ListItemText primary={t("pets.downloadSelectedPets")} />
        </MenuItem>
      </Menu>

      {/* Pet Selection Modal */}
      <Dialog
        open={showPetSelection}
        onClose={() => setShowPetSelection(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("pets.selectPetsForPDF")}</DialogTitle>
        <DialogContent>
          <List>
            {pets.map((pet) => (
              <ListItem key={pet.id} disablePadding>
                <ListItemButton
                  onClick={() => handlePetSelectionToggle(pet.id!)}
                  dense
                >
                  <MuiListItemIcon>
                    <Checkbox
                      checked={selectedPetsForPDF.includes(pet.id!)}
                      onChange={() => handlePetSelectionToggle(pet.id!)}
                    />
                  </MuiListItemIcon>
                  <MuiListItemText
                    primary={pet.name}
                    secondary={`${pet.breed} • ${pet.gender}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPetSelection(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirmSelectedPetsPDF}
            variant="contained"
            disabled={selectedPetsForPDF.length === 0 || pdfLoading}
          >
            {pdfLoading ? (
              <CircularProgress size={20} />
            ) : (
              t("pets.downloadSelectedPets")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pets;
