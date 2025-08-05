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
      valueGetter: (value, row) => {
        const birthDate = new Date(row.birthDate);
        const ageInMilliseconds = Date.now() - birthDate.getTime();
        const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
        return `${Math.floor(ageInYears)} years`;
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
          <IconButton onClick={() => onEdit(params.row.id)} size="small">
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => onDelete(params.row.id)}
            size="small"
            color="error"
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
