import { Button, Paper, Typography } from "@mui/material";
import { Add as AddIcon, Pets as PetsIcon } from "@mui/icons-material";
import { useLocalization } from "../../../contexts/LocalizationContext";

interface PetsEmptyStateProps {
  searchTerm: string;
  selectedType: string;
  onAddPet: () => void;
}

export const PetsEmptyState = ({
  searchTerm,
  selectedType,
  onAddPet,
}: PetsEmptyStateProps) => {
  const { t } = useLocalization();
  const emptyMessage = searchTerm || selectedType !== "All"
    ? t('pets.tryAdjustingSearch')
    : t('pets.getStartedAddingFirstPet');

  return (
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <PetsIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {t('pets.noPetsFound')}
      </Typography>
      <Typography color="text.secondary" paragraph>
        {emptyMessage}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddPet}
        sx={{ mt: 2 }}
      >
        {t('pets.addPet')}
      </Button>
    </Paper>
  );
};

export default PetsEmptyState;
