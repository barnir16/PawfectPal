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
      headerName: t('pets.name'),
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
      headerName: t('pets.type'), 
      flex: 0.8,
      minWidth: 100,
      valueGetter: (_, row) => row.type || row.breed || t('pets.unknown')
    },
    { 
      field: "breed", 
      headerName: t('pets.breed'), 
      flex: 1.2,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Pet>) => (
        <Box sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: '100%'
        }}>
          {params.row.breed}
        </Box>
      )
    },
    {
      field: "age",
      headerName: t('pets.age'),
      flex: 0.8,
      minWidth: 120,
      valueGetter: (_, row) => {
        // Debug logging for Nicole
        if (row.name === 'Nicole') {
          console.log('🐕 Nicole age calculation debug (table):', {
            name: row.name,
            age: row.age,
            birthDate: row.birthDate,
            isBirthdayGiven: row.isBirthdayGiven,
            ageType: row.age !== undefined ? 'age field' : 'birthdate'
          });
        }
        
        // Always try birthdate first if available - it's more accurate
        const birthDate = row.birthDate;
        if (birthDate) {
          try {
            // Handle different date formats
            let birth;
            if (typeof birthDate === 'string') {
              // For ISO date strings like '2025-01-01', ensure we parse as local time
              if (birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Parse as local date to avoid timezone issues
                const [year, month, day] = birthDate.split('-').map(Number);
                birth = new Date(year, month - 1, day); // month is 0-indexed
              } else {
                // Try parsing as ISO string first
                birth = new Date(birthDate);
                // If that fails, try parsing as DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY, or MM.DD.YYYY
                if (isNaN(birth.getTime()) && (birthDate.includes('/') || birthDate.includes('.'))) {
                  const separator = birthDate.includes('/') ? '/' : '.';
                  const parts = birthDate.split(separator);
                  if (parts.length === 3) {
                    // Try DD/MM/YYYY or DD.MM.YYYY format first
                    birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    if (isNaN(birth.getTime())) {
                      // Try MM/DD/YYYY or MM.DD.YYYY format
                      birth = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                    }
                  }
                }
              }
            } else {
              birth = new Date(birthDate);
            }
            
            if (isNaN(birth.getTime())) {
              console.log('Invalid birthdate format:', birthDate);
              return t('pets.unknownAge');
            }
            
            const now = new Date();
            const ageInMilliseconds = now.getTime() - birth.getTime();
            
            // Calculate age more accurately
            const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
            const ageInMonths = Math.floor(ageInDays / 30.44); // Average days per month
            const ageInYears = Math.floor(ageInDays / 365.25);
            
            // Debug logging
            console.log('Age calculation debug:', {
              birthDate,
              parsedBirth: birth.toISOString(),
              ageInDays,
              ageInMonths,
              ageInYears,
              currentDate: now.toISOString()
            });
            
            // Handle future birthdates
            if (ageInDays < 0) {
              return t('pets.futureBirthdate');
            }
            
            if (ageInYears < 1) {
              // For pets under 1 year, show months
              const months = Math.max(0, ageInMonths);
              return `${months} ${t('pets.months')}`;
            }
            return `${ageInYears} ${t('pets.years')}`;
          } catch (error) {
            console.log('Error calculating age from birthdate:', birthDate, error);
            return t('pets.unknownAge');
          }
        }
        
        // Fallback to age field if no birthdate
        if (row.age !== undefined && row.age !== null) {
          if (row.age < 1) {
            const months = Math.floor(row.age * 12);
            return `${months} ${t('pets.months')}`;
          }
          return `${row.age} ${t('pets.years')}`;
        }
        
        return t('pets.unknownAge');
      },
    },
    { 
      field: "gender", 
      headerName: t('pets.gender'), 
      flex: 0.6,
      minWidth: 80
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
    <Box sx={{ 
      height: 600, 
      width: "100%",
      '& .MuiDataGrid-root': {
        border: 'none',
      },
      '& .MuiDataGrid-cell': {
        borderBottom: '1px solid #f0f0f0',
      },
      '& .MuiDataGrid-columnHeaders': {
        backgroundColor: '#fafafa',
        borderBottom: '2px solid #e0e0e0',
      },
      '& .MuiDataGrid-virtualScroller': {
        backgroundColor: '#ffffff',
      },
      '& .MuiDataGrid-footerContainer': {
        borderTop: '2px solid #e0e0e0',
        backgroundColor: '#fafafa',
      },
    }}>
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
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
        }}
      />
    </Box>
  );
};

export default PetsTable;
