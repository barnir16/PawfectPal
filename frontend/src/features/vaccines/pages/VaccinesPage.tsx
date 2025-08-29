import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Vaccines as VaccinesIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { getOverdueVaccinationsForAllPets, getVaccinationsDueSoon } from '../../../services/vaccines/vaccineService';
import { SmartVaccineService } from '../../../services/vaccines/smartVaccineService';
import { VaccineTracker } from '../../../components/pets/VaccineTracker';
import { SmartVaccineSuggestions } from '../../../components/vaccines/SmartVaccineSuggestions';
import type { Pet } from '../../../types/pets/pet';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vaccine-tabpanel-${index}`}
      aria-labelledby={`vaccine-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vaccine-tab-${index}`,
    'aria-controls': `vaccine-tabpanel-${index}`,
  };
}

export const VaccinesPage: React.FC = () => {
  const { t } = useLocalization();
  const [tabValue, setTabValue] = useState(0);
  const [pets, setPets] = useState<Pet[]>([]);
  const [overdueVaccinations, setOverdueVaccinations] = useState<any[]>([]);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVaccinationData = async () => {
      try {
        setIsLoading(true);
        
        // Load overdue vaccinations
        const overdue = await getOverdueVaccinationsForAllPets();
        setOverdueVaccinations(overdue);
        
        // Load upcoming vaccinations
        const upcoming = await getVaccinationsDueSoon();
        setUpcomingVaccinations(upcoming);
        
        // TODO: Load pets data when pet service is available
        // const petsData = await getPets();
        // setPets(petsData);
        
      } catch (err) {
        console.error('Error loading vaccination data:', err);
        setError('Failed to load vaccination data');
      } finally {
        setIsLoading(false);
      }
    };

    loadVaccinationData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <VaccinesIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          {t('vaccines.title')}
        </Typography>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('vaccines.overdue')}
              </Typography>
              <Typography variant="h4" color="error">
                {overdueVaccinations.length}
              </Typography>
              <Typography variant="body2">
                {t('vaccines.overdueDescription')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('vaccines.upcoming')}
              </Typography>
              <Typography variant="h4" color="warning.main">
                {upcomingVaccinations.length}
              </Typography>
              <Typography variant="body2">
                {t('vaccines.upcomingDescription')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('vaccines.totalPets')}
              </Typography>
              <Typography variant="h4" color="primary.main">
                {pets.length}
              </Typography>
              <Typography variant="body2">
                {t('vaccines.totalPetsDescription')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('vaccines.healthStatus')}
              </Typography>
              <Typography variant="h4" color="success.main">
                {overdueVaccinations.length === 0 ? '✅' : '⚠️'}
              </Typography>
              <Typography variant="body2">
                {overdueVaccinations.length === 0 
                  ? t('vaccines.allUpToDate') 
                  : t('vaccines.attentionNeeded')}
              </Typography>
            </CardContent>
          </Card>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="vaccine tabs">
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon />
                  {t('vaccines.overdue')} ({overdueVaccinations.length})
                </Box>
              } 
              {...a11yProps(0)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon />
                  {t('vaccines.upcoming')} ({upcomingVaccinations.length})
                </Box>
              } 
              {...a11yProps(1)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VaccinesIcon />
                  {t('vaccines.smartSuggestions')}
                </Box>
              } 
              {...a11yProps(2)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon />
                  {t('vaccines.manageVaccines')}
                </Box>
              } 
              {...a11yProps(3)} 
            />
          </Tabs>
        </Box>

        {/* Overdue Vaccinations Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            {t('vaccines.overdueVaccinations')}
          </Typography>
          {overdueVaccinations.length === 0 ? (
            <Alert severity="success">
              {t('vaccines.allVaccinationsUpToDate')}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {overdueVaccinations.slice(0, 8).map((vaccine: any) => (
                <Grid key={vaccine.id} item xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom>
                        {vaccine.pet_name}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {vaccine.vaccine_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {t('vaccines.due')}: {new Date(vaccine.next_due_date).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Upcoming Vaccinations Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            {t('vaccines.upcomingVaccinations')}
          </Typography>
          {upcomingVaccinations.length === 0 ? (
            <Alert severity="info">
              {t('vaccines.noUpcomingVaccinations')}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {upcomingVaccinations.slice(0, 8).map((vaccine: any) => (
                <Grid key={vaccine.id} item xs={12} sm={6} md={4}>
                  <Card variant="outlined" sx={{ borderColor: 'warning.main' }}>
                    <CardContent>
                      <Typography variant="h6" color="warning.main" gutterBottom>
                        {vaccine.pet_name}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {vaccine.vaccine_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {t('vaccines.due')}: {new Date(vaccine.next_due_date).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Smart Vaccine Suggestions Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            {t('vaccines.smartSuggestions')}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {t('vaccines.smartSuggestionsDescription')}
          </Typography>
          {pets.length === 0 ? (
            <Alert severity="info">
              {t('vaccines.noPetsForSuggestions')}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {pets.map((pet) => (
                <Grid key={pet.id} item xs={12} md={6}>
                  <Card>
                    <CardHeader
                      title={pet.name}
                      subheader={`${pet.type} • ${pet.breed}`}
                    />
                    <CardContent>
                      <SmartVaccineSuggestions pet={pet} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Manage Vaccines Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            {t('vaccines.manageVaccines')}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {t('vaccines.manageVaccinesDescription')}
          </Typography>
          {pets.length === 0 ? (
            <Alert severity="info">
              {t('vaccines.noPetsToManage')}
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {pets.map((pet) => (
                <Grid key={pet.id} item xs={12}>
                  <VaccineTracker pet={pet} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
};

export default VaccinesPage;
