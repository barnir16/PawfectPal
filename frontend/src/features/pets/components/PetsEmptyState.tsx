import { Button, Paper, Typography } from "@mui/material";
import { Add as AddIcon, Pets as PetsIcon } from "@mui/icons-material";

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
  const emptyMessage = searchTerm || selectedType !== "All"
    ? "Try adjusting your search or filter criteria."
    : "Get started by adding your first pet!";

  return (
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
        onClick={onAddPet}
        sx={{ mt: 2 }}
      >
        Add Pet
      </Button>
    </Paper>
  );
};

export default PetsEmptyState;
