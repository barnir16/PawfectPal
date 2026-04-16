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
import { useLocalization } from "../../../contexts/LocalizationContext";
import type { Pet } from "../../../types/pets/pet";
import { formatPetAge } from "../../../utils/petAge";

interface PetsTableProps {
  pets: Pet[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const PetsTable = ({ pets, onEdit, onDelete }: PetsTableProps) => {
  const { t } = useLocalization();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const columns: GridColDef<Pet>[] = [
    {
      field: "name",
      headerName: t("pets.name"),
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Pet>) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={params.row.imageUrl}
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
      headerName: t("pets.type"),
      flex: 0.8,
      minWidth: 100,
      valueGetter: (_, row) => row.type || t("pets.unknown"),
    },
    {
      field: "breed",
      headerName: t("pets.breed"),
      flex: 1.2,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Pet>) => (
        <Box
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {params.row.breed}
        </Box>
      ),
    },
    {
      field: "age",
      headerName: t("pets.age"),
      flex: 0.8,
      minWidth: 120,
      valueGetter: (_, row) =>
        formatPetAge(row, {
          months: t("pets.months"),
          years: t("pets.years"),
          unknownAge: t("pets.unknownAge"),
          futureBirthdate: t("pets.futureBirthdate"),
        }),
    },
    {
      field: "gender",
      headerName: t("pets.gender"),
      flex: 0.6,
      minWidth: 80,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      minWidth: 120,
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
    <Box
      sx={{
        height: 600,
        width: "100%",
        "& .MuiDataGrid-root": {
          border: "none",
        },
        "& .MuiDataGrid-cell": {
          borderBottom: "1px solid #f0f0f0",
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "#fafafa",
          borderBottom: "2px solid #e0e0e0",
        },
        "& .MuiDataGrid-virtualScroller": {
          backgroundColor: "#ffffff",
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: "2px solid #e0e0e0",
          backgroundColor: "#fafafa",
        },
      }}
    >
      <DataGrid
        rows={pets}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        autoHeight={false}
        density="comfortable"
        sx={{
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
        }}
      />
    </Box>
  );
};

export default PetsTable;
