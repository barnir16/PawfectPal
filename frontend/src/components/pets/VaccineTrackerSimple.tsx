import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Vaccines as VaccinesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { Pet } from '../../types/pets/pet';

interface VaccineRecord {
  id: string;
  name: string;
  type: string;
  administeredDate: string;
  nextDueDate: string;
  veterinarian: string;
  clinic: string;
  notes?: string;
  isOverdue: boolean;
  isDueSoon: boolean;
}

interface VaccineTrackerProps {
  pet: Pet;
}

const VaccineTrackerSimple: React.FC<VaccineTrackerProps> = ({ pet }) => {
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    administeredDate: '',
    nextDueDate: '',
    veterinarian: '',
    clinic: '',
    notes: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    const loadMockData = () => {
      setLoading(true);
      setTimeout(() => {
        const mockVaccines: VaccineRecord[] = [
          {
            id: '1',
            name: 'Rabies',
            type: 'Core',
            administeredDate: '2023-01-15',
            nextDueDate: '2024-01-15',
            veterinarian: 'Dr. Smith',
            clinic: 'Animal Hospital',
            notes: 'Annual vaccination',
            isOverdue: true,
            isDueSoon: false,
          },
          {
            id: '2',
            name: 'DHPP',
            type: 'Core',
            administeredDate: '2023-06-10',
            nextDueDate: '2024-06-10',
            veterinarian: 'Dr. Johnson',
            clinic: 'Pet Care Center',
            notes: 'Core vaccine series',
            isOverdue: false,
            isDueSoon: true,
          },
          {
            id: '3',
            name: 'Bordetella',
            type: 'Non-Core',
            administeredDate: '2023-12-01',
            nextDueDate: '2024-12-01',
            veterinarian: 'Dr. Brown',
            clinic: 'Vet Clinic',
            notes: 'Kennel cough prevention',
            isOverdue: false,
            isDueSoon: false,
          }
        ];
        setVaccines(mockVaccines);
        setLoading(false);
      }, 1000);
    };

    loadMockData();
  }, [pet?.id]);

  const getStatusInfo = (vaccine: VaccineRecord) => {
    if (vaccine.isOverdue) {
      return { color: 'error', icon: <WarningIcon />, text: 'Overdue' };
    } else if (vaccine.isDueSoon) {
      return { color: 'warning', icon: <ScheduleIcon />, text: 'Due Soon' };
    } else {
      return { color: 'success', icon: <CheckCircleIcon />, text: 'Up to Date' };
    }
  };

  const handleAddVaccine = () => {
    const newVaccine: VaccineRecord = {
      id: Date.now().toString(),
      name: formData.name,
      type: 'Core',
      administeredDate: formData.administeredDate,
      nextDueDate: formData.nextDueDate,
      veterinarian: formData.veterinarian,
      clinic: formData.clinic,
      notes: formData.notes,
      isOverdue: false,
      isDueSoon: false,
    };
    
    setVaccines([...vaccines, newVaccine]);
    setAddDialogOpen(false);
    setFormData({ name: '', administeredDate: '', nextDueDate: '', veterinarian: '', clinic: '', notes: '' });
  };

  const handleEditVaccine = (vaccine: VaccineRecord) => {
    setEditingVaccine(vaccine);
    setFormData({
      name: vaccine.name,
      administeredDate: vaccine.administeredDate,
      nextDueDate: vaccine.nextDueDate,
      veterinarian: vaccine.veterinarian,
      clinic: vaccine.clinic,
      notes: vaccine.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateVaccine = () => {
    if (editingVaccine) {
      setVaccines(vaccines.map(v => 
        v.id === editingVaccine.id 
          ? { ...v, ...formData }
          : v
      ));
      setEditDialogOpen(false);
      setEditingVaccine(null);
      setFormData({ name: '', administeredDate: '', nextDueDate: '', veterinarian: '', clinic: '', notes: '' });
    }
  };

  const handleDeleteVaccine = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vaccine record?')) {
      setVaccines(vaccines.filter(v => v.id !== id));
    }
  };

  const overdueCount = vaccines.filter(v => v.isOverdue).length;
  const dueSoonCount = vaccines.filter(v => v.isDueSoon).length;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading vaccine data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <VaccinesIcon color="primary" />
              <Typography variant="h6">Vaccine Tracking</Typography>
            </Box>
          }
          action={
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={() => window.location.reload()}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                size="small"
              >
                Add Vaccine
              </Button>
            </Box>
          }
        />
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h4">{vaccines.length}</Typography>
            <Typography variant="body2">Total Vaccines</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: overdueCount > 0 ? 'error.light' : 'success.light', color: 'white' }}>
            <Typography variant="h4">{overdueCount}</Typography>
            <Typography variant="body2">Overdue</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: dueSoonCount > 0 ? 'warning.light' : 'info.light', color: 'white' }}>
            <Typography variant="h4">{dueSoonCount}</Typography>
            <Typography variant="body2">Due Soon</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <Typography variant="h4">{vaccines.length - overdueCount - dueSoonCount}</Typography>
            <Typography variant="body2">Up to Date</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Vaccine List */}
      <Card>
        <CardContent>
          {vaccines.length === 0 ? (
            <Box textAlign="center" py={4}>
              <VaccinesIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No vaccine records yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start tracking your pet's vaccinations to keep them healthy.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
              >
                Add First Vaccine
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {vaccines.map((vaccine) => {
                const status = getStatusInfo(vaccine);
                return (
                  <Paper key={vaccine.id} sx={{ p: 2, borderLeft: 4, borderLeftColor: `${status.color}.main` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="h6">{vaccine.name}</Typography>
                          <Chip 
                            label={status.text} 
                            color={status.color as any} 
                            size="small" 
                            icon={status.icon}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Administered:</strong> {new Date(vaccine.administeredDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Next Due:</strong> {new Date(vaccine.nextDueDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Veterinarian:</strong> {vaccine.veterinarian} at {vaccine.clinic}
                        </Typography>
                        {vaccine.notes && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Notes:</strong> {vaccine.notes}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditVaccine(vaccine)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteVaccine(vaccine.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Add Vaccine Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Vaccine</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Vaccine Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="date"
              label="Administered Date"
              value={formData.administeredDate}
              onChange={(e) => setFormData({ ...formData, administeredDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              type="date"
              label="Next Due Date"
              value={formData.nextDueDate}
              onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Veterinarian"
              value={formData.veterinarian}
              onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Clinic"
              value={formData.clinic}
              onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddVaccine} variant="contained">
            Add Vaccine
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vaccine Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Vaccine Record</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Vaccine Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="date"
              label="Administered Date"
              value={formData.administeredDate}
              onChange={(e) => setFormData({ ...formData, administeredDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              type="date"
              label="Next Due Date"
              value={formData.nextDueDate}
              onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Veterinarian"
              value={formData.veterinarian}
              onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Clinic"
              value={formData.clinic}
              onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateVaccine} variant="contained">
            Update Vaccine
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VaccineTrackerSimple;

