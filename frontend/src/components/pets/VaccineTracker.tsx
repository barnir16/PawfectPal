import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Vaccines as VaccinesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalHospital as VetIcon,
} from '@mui/icons-material';
import { dogVaccines, catVaccines } from '../../features/pets/vaccines';
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

export const VaccineTracker: React.FC<VaccineTrackerProps> = ({ pet }) => {
  const [vaccineRecords, setVaccineRecords] = useState<VaccineRecord[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    administeredDate: '',
    nextDueDate: '',
    veterinarian: '',
    clinic: '',
    notes: ''
  });

  // Get recommended vaccines based on pet type
  const getRecommendedVaccines = () => {
    if (pet.type === 'dog') {
      return dogVaccines;
    } else if (pet.type === 'cat') {
      return catVaccines;
    }
    return [];
  };

  // Calculate next due date based on vaccine frequency
  const calculateNextDueDate = (vaccineName: string, administeredDate: string): string => {
    const vaccines = getRecommendedVaccines();
    const vaccine = vaccines.find(v => v.name === vaccineName);
    
    if (!vaccine) return '';
    
    const date = new Date(administeredDate);
    let nextDate = new Date(date);
    
    switch (vaccine.frequency) {
      case 'Yearly':
        nextDate.setFullYear(date.getFullYear() + 1);
        break;
      case '2 years':
        nextDate.setFullYear(date.getFullYear() + 2);
        break;
      case '6 months':
        nextDate.setMonth(date.getMonth() + 6);
        break;
      case '2 months':
        nextDate.setMonth(date.getMonth() + 2);
        break;
      default:
        nextDate.setFullYear(date.getFullYear() + 1);
    }
    
    return nextDate.toISOString().split('T')[0];
  };

  // Check if vaccine is overdue or due soon
  const checkVaccineStatus = (nextDueDate: string) => {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return { isOverdue: true, isDueSoon: false, days: Math.abs(daysUntilDue) };
    } else if (daysUntilDue <= 30) {
      return { isOverdue: false, isDueSoon: true, days: daysUntilDue };
    } else {
      return { isOverdue: false, isDueSoon: false, days: daysUntilDue };
    }
  };

  // Add new vaccine record
  const handleAddVaccine = () => {
    const nextDueDate = calculateNextDueDate(formData.name, formData.administeredDate);
    const status = checkVaccineStatus(nextDueDate);
    
    const newVaccine: VaccineRecord = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      administeredDate: formData.administeredDate,
      nextDueDate,
      veterinarian: formData.veterinarian,
      clinic: formData.clinic,
      notes: formData.notes,
      isOverdue: status.isOverdue,
      isDueSoon: status.isDueSoon,
    };
    
    setVaccineRecords([...vaccineRecords, newVaccine]);
    setFormData({
      name: '',
      type: '',
      administeredDate: '',
      nextDueDate: '',
      veterinarian: '',
      clinic: '',
      notes: ''
    });
    setAddDialogOpen(false);
  };

  // Edit vaccine record
  const handleEditVaccine = () => {
    if (!editingVaccine) return;
    
    const nextDueDate = calculateNextDueDate(formData.name, formData.administeredDate);
    const status = checkVaccineStatus(nextDueDate);
    
    const updatedVaccine: VaccineRecord = {
      ...editingVaccine,
      name: formData.name,
      type: formData.type,
      administeredDate: formData.administeredDate,
      nextDueDate,
      veterinarian: formData.veterinarian,
      clinic: formData.clinic,
      notes: formData.notes,
      isOverdue: status.isOverdue,
      isDueSoon: status.isDueSoon,
    };
    
    setVaccineRecords(vaccineRecords.map(v => v.id === editingVaccine.id ? updatedVaccine : v));
    setEditingVaccine(null);
    setEditDialogOpen(false);
  };

  // Delete vaccine record
  const handleDeleteVaccine = (id: string) => {
    setVaccineRecords(vaccineRecords.filter(v => v.id !== id));
  };

  // Open edit dialog
  const openEditDialog = (vaccine: VaccineRecord) => {
    setEditingVaccine(vaccine);
    setFormData({
      name: vaccine.name,
      type: vaccine.type,
      administeredDate: vaccine.administeredDate,
      nextDueDate: vaccine.nextDueDate,
      veterinarian: vaccine.veterinarian,
      clinic: vaccine.clinic,
      notes: vaccine.notes || ''
    });
    setEditDialogOpen(true);
  };

  // Get status color and icon
  const getStatusDisplay = (vaccine: VaccineRecord) => {
    if (vaccine.isOverdue) {
      return {
        color: 'error' as const,
        icon: <WarningIcon color="error" />,
        text: 'Overdue',
        severity: 'error' as const
      };
    } else if (vaccine.isDueSoon) {
      return {
        color: 'warning' as const,
        icon: <ScheduleIcon color="warning" />,
        text: 'Due Soon',
        severity: 'warning' as const
      };
    } else {
      return {
        color: 'success' as const,
        icon: <CheckCircleIcon color="success" />,
        text: 'Up to Date',
        severity: 'success' as const
      };
    }
  };

  // Get smart suggestions
  const getSmartSuggestions = () => {
    interface Recommendation {
      name: string;
      type: string;
      frequency: string;
      description: string;
      priority: 'urgent' | 'high' | 'medium';
    }
    
    const recommendations: Recommendation[] = [];
    const recommendedVaccines = getRecommendedVaccines();
    
    recommendedVaccines.forEach(vaccine => {
      const existingRecord = vaccineRecords.find(r => r.name === vaccine.name);
      
      if (!existingRecord) {
        recommendations.push({
          name: vaccine.name,
          type: vaccine.type,
          frequency: vaccine.frequency,
          description: vaccine.description,
          priority: 'high'
        });
      } else {
        const status = checkVaccineStatus(existingRecord.nextDueDate);
        if (status.isOverdue) {
          recommendations.push({
            name: vaccine.name,
            type: vaccine.type,
            frequency: vaccine.frequency,
            description: `${vaccine.name} is overdue by ${status.days} days`,
            priority: 'urgent'
          });
        } else if (status.isDueSoon) {
          recommendations.push({
            name: vaccine.name,
            type: vaccine.type,
            frequency: vaccine.frequency,
            description: `${vaccine.name} is due in ${status.days} days`,
            priority: 'medium'
          });
        }
      }
    });
    
    return recommendations.sort((a, b) => {
      if (a.priority === 'urgent') return -1;
      if (b.priority === 'urgent') return 1;
      if (a.priority === 'high') return -1;
      if (b.priority === 'high') return 1;
      return 0;
    });
  };

  const smartSuggestions = getSmartSuggestions();

  return (
    <Card>
      <CardHeader
        title="Vaccine Tracking"
        action={
          <Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="show more"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              variant="contained"
              color="primary"
            >
              Add Vaccine
            </Button>
          </Box>
        }
      />
      
      <CardContent>
        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              💡 Smart Recommendations
            </Typography>
            <Grid container spacing={2}>
              {smartSuggestions.map((suggestion, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6 }}>
                  <Alert 
                    severity={suggestion.priority === 'urgent' ? 'error' : suggestion.priority === 'high' ? 'warning' : 'info'}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {suggestion.name}
                    </Typography>
                    <Typography variant="body2">
                      {suggestion.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Frequency: {suggestion.frequency} | Type: {suggestion.type}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Current Vaccine Records */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Vaccine History
        </Typography>
        
        {vaccineRecords.length === 0 ? (
          <Alert severity="info">
            No vaccine records found. Add vaccines to start tracking your pet's immunization history.
          </Alert>
        ) : (
          <List>
            {vaccineRecords.map((vaccine) => {
              const status = getStatusDisplay(vaccine);
              return (
                <ListItem key={vaccine.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <ListItemIcon>
                    {status.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {vaccine.name}
                        </Typography>
                        <Chip 
                          label={status.text} 
                          color={status.color} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Administered: {new Date(vaccine.administeredDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          Next Due: {new Date(vaccine.nextDueDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          Veterinarian: {vaccine.veterinarian} at {vaccine.clinic}
                        </Typography>
                        {vaccine.notes && (
                          <Typography variant="body2" color="text.secondary">
                            Notes: {vaccine.notes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box>
                    <IconButton size="small" onClick={() => openEditDialog(vaccine)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteVaccine(vaccine.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}

        {/* Add Vaccine Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Vaccine Record</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Vaccine Name</InputLabel>
                  <Select
                    value={formData.name}
                    onChange={(e: SelectChangeEvent) => setFormData({ ...formData, name: e.target.value })}
                    label="Vaccine Name"
                  >
                    {getRecommendedVaccines().map((vaccine) => (
                      <MenuItem key={vaccine.name} value={vaccine.name}>
                        {vaccine.name} ({vaccine.frequency})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Vaccine Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Core, Non-core, Required"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Administered Date"
                  value={formData.administeredDate}
                  onChange={(e) => setFormData({ ...formData, administeredDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Next Due Date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Will be calculated automatically based on vaccine frequency"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Veterinarian"
                  value={formData.veterinarian}
                  onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                  placeholder="Dr. Smith"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  placeholder="Animal Hospital"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about the vaccination..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVaccine} variant="contained" color="primary">
              Add Vaccine
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Vaccine Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Vaccine Record</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Vaccine Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Vaccine Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Administered Date"
                  value={formData.administeredDate}
                  onChange={(e) => setFormData({ ...formData, administeredDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Next Due Date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Veterinarian"
                  value={formData.veterinarian}
                  onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditVaccine} variant="contained" color="primary">
              Update Vaccine
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
