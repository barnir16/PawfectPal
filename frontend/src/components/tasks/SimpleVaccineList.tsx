import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Vaccines as VaccinesIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { VaccineTaskService, type VaccineTask } from '../../services/tasks/vaccineTaskService';
import { getPets } from '../../services/pets/petService';
import type { Pet } from '../../types/pets/pet';

interface SimpleVaccineListProps {
  onAddVaccine: () => void;
  onBack: () => void;
}

export const SimpleVaccineList: React.FC<SimpleVaccineListProps> = ({
  onAddVaccine,
  onBack,
}) => {
  const { t } = useLocalization();
  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccineTasks, setVaccineTasks] = useState<VaccineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVaccineData();
  }, []);

  const loadVaccineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const petsData = await getPets();
      console.log('🐕 SimpleVaccineList: Loaded pets:', petsData);
      setPets(petsData);
      
      // Generate vaccine tasks for all pets
      const allVaccineTasks: VaccineTask[] = [];
      petsData.forEach(pet => {
        const petVaccineTasks = VaccineTaskService.generateVaccineTasks(pet);
        console.log(`🐕 SimpleVaccineList: Generated ${petVaccineTasks.length} vaccine tasks for ${pet.name}`, petVaccineTasks);
        allVaccineTasks.push(...petVaccineTasks);
      });
      
      console.log('🐕 SimpleVaccineList: All vaccine tasks:', allVaccineTasks);
      setVaccineTasks(allVaccineTasks);
    } catch (err) {
      console.error('Error loading vaccine data:', err);
      setError('Failed to load vaccine data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteVaccine = async (vaccineTask: VaccineTask) => {
    try {
      // Mark vaccine as completed
      await VaccineTaskService.completeVaccine(vaccineTask);
      
      // Reload data
      await loadVaccineData();
    } catch (err) {
      console.error('Error completing vaccine:', err);
      setError('Failed to complete vaccine');
    }
  };

  const getVaccineStatus = (vaccineTask: VaccineTask) => {
    const now = new Date();
    const dueDate = new Date(vaccineTask.dateTime || vaccineTask.nextDueDate);
    
    if (vaccineTask.isCompleted) {
      return { status: 'completed', color: 'success', icon: CheckCircleIcon };
    } else if (dueDate < now) {
      return { status: 'overdue', color: 'error', icon: WarningIcon };
    } else {
      return { status: 'upcoming', color: 'warning', icon: ScheduleIcon };
    }
  };

  const getVaccineStatusText = (status: string) => {
    switch (status) {
      case 'completed': return t('vaccines.completed');
      case 'overdue': return t('vaccines.overdue');
      case 'upcoming': return t('vaccines.upcoming');
      default: return t('vaccines.unknown');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const groupedTasks = vaccineTasks.reduce((acc, task) => {
    // Find pet by ID in petIds array (since tasks can have multiple pets)
    const petId = task.petIds && task.petIds.length > 0 ? task.petIds[0] : task.petId;
    const pet = pets.find(p => p.id === petId);
    const petName = pet?.name || `Pet ${petId || 'Unknown'}`;
    
    if (!acc[petName]) {
      acc[petName] = [];
    }
    acc[petName].push(task);
    return acc;
  }, {} as Record<string, VaccineTask[]>);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          {t('vaccines.title')}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<VaccinesIcon />}
            onClick={onAddVaccine}
            sx={{ mr: 1 }}
          >
            {t('vaccines.addVaccine')}
          </Button>
          <Button
            variant="text"
            onClick={onBack}
          >
            {t('tasks.backToMain')}
          </Button>
        </Box>
      </Box>

      {Object.keys(groupedTasks).length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <VaccinesIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('vaccines.noVaccines')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('vaccines.noVaccinesDescription')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddVaccine}
              >
                {t('vaccines.addFirstVaccine')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {Object.entries(groupedTasks).map(([petName, tasks]) => (
            <Card key={petName} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {petName}
                </Typography>
                <List dense>
                  {tasks.map((task, index) => {
                    const { status, color, icon: StatusIcon } = getVaccineStatus(task);
                    const isLast = index === tasks.length - 1;
                    
                    return (
                      <React.Fragment key={`${petName}-${task.vaccineName}-${index}`}>
                        <ListItem>
                          <StatusIcon color={color} sx={{ mr: 2 }} />
                          <ListItemText
                            primary={task.vaccineName}
                            secondary={`${t('vaccines.dueDate')}: ${new Date(task.dateTime || task.nextDueDate).toLocaleDateString()}`}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={getVaccineStatusText(status)}
                              size="small"
                              color={color}
                            />
                            {!task.isCompleted && (
                              <IconButton
                                onClick={() => handleCompleteVaccine(task)}
                                color="primary"
                                size="small"
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            )}
                          </Box>
                        </ListItem>
                        {!isLast && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SimpleVaccineList;
