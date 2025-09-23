import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Chip,
  useTheme,
  Button,
} from "@mui/material";
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  LocalHospital as HospitalIcon,
  Add as AddIcon,
} from "@mui/icons-material";


interface MedicalRecord {
  id: number;
  date: string;
  type: string;
  title: string;
  description: string;
  vet: string;
  notes?: string;
}

interface MedicalRecordsProps {
  records: MedicalRecord[];
  onAddRecord?: () => void;
}

export const MedicalRecords = ({
  records,
  onAddRecord,
}: MedicalRecordsProps) => {
  const theme = useTheme();
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "vaccination":
        return "success";
      case "treatment":
        return "error";
      case "check-up":
        return "info";
      default:
        return "default";
    }
  };

  if (records.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: "center",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <HospitalIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No medical records found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add a new medical record to keep track of your pet's health history.
        </Typography>
        {onAddRecord && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddRecord}
          >
            Add Record
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        mb: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" component="h2">
          Medical Records
        </Typography>
        {onAddRecord && (
          <Button size="small" startIcon={<AddIcon />} onClick={onAddRecord}>
            Add Record
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Vet</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <>
                <TableRow
                  key={record.id}
                  hover
                  sx={{ "& > *": { borderBottom: "unset" }, cursor: "pointer" }}
                  onClick={() => toggleRow(record.id)}
                >
                  <TableCell>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(record.id);
                      }}
                    >
                      {expandedRows[record.id] ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.type}
                      size="small"
                      color={getTypeColor(record.type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{record.title}</TableCell>
                  <TableCell>{record.vet}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={5}
                  >
                    <Collapse
                      in={expandedRows[record.id]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box
                        sx={{
                          p: 2,
                          pl: 6,
                          bgcolor: "action.hover",
                          borderTop: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Details
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {record.description}
                        </Typography>
                        {record.notes && (
                          <>
                            <Typography variant="subtitle2" gutterBottom>
                              Vet's Notes
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {record.notes}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default MedicalRecords;
