import { Box, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Search as SearchIcon, FilterList as FilterListIcon } from "@mui/icons-material";

interface PetsToolbarProps {
  searchTerm: string;
  selectedType: string;
  view: "grid" | "table";
  onSearchChange: (value: string) => void;
  onTypeChange: (type: string) => void;
  onViewChange: (view: "grid" | "table") => void;
  onAddPet: () => void;
}

const petTypes = ["All", "Dog", "Cat", "Bird", "Rabbit", "Other"];

export const PetsToolbar = ({
  searchTerm,
  selectedType,
  view,
  onSearchChange,
  onTypeChange,
  onViewChange,
  onAddPet,
}: PetsToolbarProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        mb: 3,
        alignItems: { xs: "stretch", sm: "center" },
      }}
    >
      <TextField
        placeholder="Search pets..."
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
        }}
        sx={{ flexGrow: 1, maxWidth: 400 }}
      />
      
      <TextField
        select
        variant="outlined"
        size="small"
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
        SelectProps={{
          native: true,
        }}
        InputProps={{
          startAdornment: <FilterListIcon color="action" sx={{ mr: 1 }} />,
        }}
        sx={{ minWidth: 150 }}
      >
        {petTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </TextField>
      
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, newView) => newView && onViewChange(newView)}
        aria-label="view mode"
        size="small"
      >
        <ToggleButton value="grid" aria-label="grid view">
          <Box component="span" className="material-icons">
            view_module
          </Box>
        </ToggleButton>
        <ToggleButton value="table" aria-label="table view">
          <Box component="span" className="material-icons">
            view_list
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default PetsToolbar;
