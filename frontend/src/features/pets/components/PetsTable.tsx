import { Avatar, Box, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  GridRenderCellParams,
  GridPaginationModel,
} from "@mui/x-data-grid";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
} from "@mui/icons-material";
import { useState } from "react";
import type { Pet } from "../../../types/pets/pet";

interface PetsTableProps {
  pets: Pet[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const PetsTable = ({ pets, onEdit, onDelete }: PetsTableProps) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const columns: GridColDef<Pet>[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Pet>) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={params.row.imageUrl || params.row.photo_uri}
            alt={params.row.name}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            <PetsIcon />
          </Avatar>
          {params.row.name}
        </Box>
      ),
    },
    { 
      field: "type", 
      headerName: "Type", 
      flex: 1,
      valueGetter: (_, row) => row.type || row.breedType || "Unknown"
    },
    { field: "breed", headerName: "Breed", flex: 1 },
    {
      field: "age",
      headerName: "Age",
      flex: 1,
      valueGetter: (_, row) => {
        // First try to use the age field directly
        if (row.age !== undefined && row.age !== null) {
          return `${row.age} years`;
        }
        
        // Then try to calculate from birth date (check both field names)
        const birthDate = row.birthDate || row.birth_date;
        if (birthDate) {
          try {
            const birth = new Date(birthDate);
            if (isNaN(birth.getTime())) {
              return "Unknown age";
            }
            const ageInMilliseconds = Date.now() - birth.getTime();
            const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
            return `${Math.floor(ageInYears)} years`;
          } catch {
            return "Unknown age";
          }
        }
        return "Unknown age";
      },
    },
    { field: "gender", headerName: "Gender", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Pet>) => (
        <Box>
          <IconButton 
            onClick={() => params.row.id && onEdit(params.row.id)} 
            size="small"
            disabled={!params.row.id}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => params.row.id && onDelete(params.row.id)}
            size="small"
            color="error"
            disabled={!params.row.id}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={pets}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default PetsTable;
