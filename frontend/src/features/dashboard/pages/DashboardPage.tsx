import { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, CircularProgress, Alert, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Add as AddIcon } from "@mui/icons-material";
import { Button } from "./../../../components/ui/Button";
import { TaskList } from "./../../../features/tasks/components/TaskList";
import type { Task as TaskListTask } from "./../../../features/tasks/components/TaskList";
import { getPets } from "../../../services/pets/petService";
import { getTasks, deleteTask, completeTask } from "../../../services/tasks/taskService";
import { getOverdueVaccinations, getVaccinationsDueSoon } from "../../../services/vaccines/vaccineService";
import { SmartVaccineService } from "../../../services/vaccines/smartVaccineService";
import { WeightMonitoringService } from "../../../services/weight/weightMonitoringService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { createTaskNotificationService } from "../../../services/notifications/taskNotificationService";
import { vaccineNameTranslations } from "../../../data/vaccines/israeliVaccines";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  height: "100%",
}));

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

const StatCard = ({ title, value, description }: StatCardProps) => (
  <Item elevation={2}>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div" sx={{ fontWeight: "bold", mb: 1 }}>
      {value}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    )}
  </Item>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, currentLanguage } = useLocalization();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState({
    totalPets: 0,
    tasksDue: 0,
    upcomingVetVisits: 0,
    overdueVaccinations: 0,
    upcomingVaccinations: 0,
  });
  const [pets, setPets] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<TaskListTask[]>([]);
  const [overdueVaccinations, setOverdueVaccinations] = useState<any[]>([]);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<any[]>([]);
  const [weightAlerts, setWeightAlerts] = useState<any[]>([]);
  const [weightHealthData, setWeightHealthData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get translated vaccine name
  const getTranslatedVaccineName = (name: string): string => {
    if (currentLanguage === 'he' && vaccineNameTranslations[name]) {
      return `${name} (${vaccineNameTranslations[name]})`;
    }
    return name;
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Only fetch data if user is authenticated
        if (!isAuthenticated) {
          return;
        }
        
        setIsLoading(true);
        setError(null);
        
        // Fetch pets, tasks, and vaccination data
        const [petsData, tasksData] = await Promise.all([
          getPets(),
          getTasks()
        ]);
        
        // Store pets data
        setPets(petsData);
        
        // Get vaccination data for all pets
        let overdueVaccinations: any[] = [];
        let upcomingVaccinations: any[] = [];
        
        if (petsData.length > 0) {
          console.log('🔍 Dashboard: Fetching vaccination data for', petsData.length, 'pets');
          try {
            const [overdueData, upcomingData] = await Promise.all([
              getOverdueVaccinations().catch((err: any) => {
                console.warn('Could not fetch overdue vaccinations:', err);
                return [];
              }),
              getVaccinationsDueSoon(30).catch((err: any) => {
                console.warn('Could not fetch upcoming vaccinations:', err);
                return [];
              })
            ]);
            console.log('🔍 Dashboard: Vaccination data fetched successfully');
            setOverdueVaccinations(overdueData || []);
            setUpcomingVaccinations(upcomingData || []);
          } catch (error) {
            console.warn('Could not fetch vaccination data:', error);
            // Continue without vaccination data
          }

          // Get weight monitoring data for all pets
          console.log('🔍 Dashboard: Fetching weight monitoring data for', petsData.length, 'pets');
          try {
            const weightAlertsData: any[] = [];
            const weightHealthDataArray: any[] = [];

            for (const pet of petsData) {
              // For now, we'll use sample data since we don't have actual weight records
              // In a real implementation, you'd fetch weight records from the database
              const sampleWeightRecords: any[] = [
                {
                  id: 1,
                  petId: pet.id,
                  weight: pet.weightKg || 10,
                  weightUnit: 'kg' as const,
                  date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                  source: 'manual' as const
                },
                {
                  id: 2,
                  petId: pet.id,
                  weight: (pet.weightKg || 10) + (Math.random() - 0.5) * 0.5, // Random variation
                  weightUnit: 'kg' as const,
                  date: new Date(),
                  source: 'manual' as const
                }
              ];

                             // Get weight alerts for each pet
               const petWeightAlerts = WeightMonitoringService.getAllWeightAlerts(sampleWeightRecords, undefined, t);
              if (petWeightAlerts.length > 0) {
                weightAlertsData.push(...petWeightAlerts.map((alert: any) => ({
                  ...alert,
                  petName: pet.name,
                  petId: pet.id
                })));
              }

              // Get weight health data for each pet
              const petWeightHealth = WeightMonitoringService.estimateIdealWeight(pet.type || 'dog', pet.breed);
              if (petWeightHealth) {
                // Calculate pet age in years
                let petAge: number | undefined;
                if (pet.age !== undefined && pet.age !== null) {
                  petAge = pet.age;
                } else if (pet.birthDate) {
                  const birthDate = pet.birthDate;
                  if (birthDate) {
                    try {
                      const birth = new Date(birthDate);
                    if (!isNaN(birth.getTime())) {
                      const now = new Date();
                      const ageInMilliseconds = now.getTime() - birth.getTime();
                      const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
                      petAge = ageInDays / 365.25; // More accurate age calculation
                    }
                    } catch (error) {
                      console.log('Error calculating pet age:', error);
                    }
                  }
                }
                
                // Get weight warnings for this pet
                const weightWarnings = WeightMonitoringService.getWeightWarnings(
                  pet.weightKg || 0, 
                  petWeightHealth, 
                  pet.name,
                  t,
                  petAge
                );
                
                // Add warnings to alerts
                if (weightWarnings.length > 0) {
                  weightAlertsData.push(...weightWarnings.map(warning => ({
                    ...warning,
                    petName: pet.name,
                    petId: pet.id
                  })));
                }

                weightHealthDataArray.push({
                  petName: pet.name,
                  petId: pet.id,
                  currentWeight: pet.weightKg || 0,
                  idealRange: petWeightHealth,
                  trend: WeightMonitoringService.calculateWeightTrend(sampleWeightRecords),
                  hasWarnings: weightWarnings.length > 0
                });
              }
            }

            console.log('🔍 Dashboard: Weight monitoring data fetched successfully');
            setWeightAlerts(weightAlertsData);
            setWeightHealthData(weightHealthDataArray);
          } catch (error) {
            console.warn('Could not fetch weight monitoring data:', error);
            // Continue without weight monitoring data
          }
        }

        // Calculate stats
        const totalPets = petsData.length;
        const tasksDue = tasksData.filter(task => !task.isCompleted && new Date(task.dateTime) <= new Date()).length;
        const upcomingVetVisits = tasksData.filter(task => 
          !task.isCompleted && 
          task.title.toLowerCase().includes('vet') && 
          new Date(task.dateTime) > new Date()
        ).length;
        const overdueVaccinationsCount = overdueVaccinations.length;
        const upcomingVaccinationsCount = upcomingVaccinations.length;

        setStats({
          totalPets,
          tasksDue,
          upcomingVetVisits,
          overdueVaccinations: overdueVaccinationsCount,
          upcomingVaccinations: upcomingVaccinationsCount,
        });

        // Get recent tasks (last 5 incomplete tasks) and convert to TaskList format
        const recentIncompleteTasks = tasksData
          .filter(task => !task.isCompleted)
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
          .slice(0, 5)
          .map(task => ({
            id: task.id || 0,
            title: task.title,
            description: task.description,
            dueDate: task.dateTime,
            pet: petsData.find(p => p.id === task.petIds[0])?.name || t('pets.unknown'),
            priority: task.priority || 'medium',
            completed: task.isCompleted || false
          } as TaskListTask));

        setRecentTasks(recentIncompleteTasks);
        
        // Check for task notifications
        const notificationService = createTaskNotificationService(addNotification);
        notificationService.checkOverdueTasks(tasksData);
        notificationService.checkUpcomingTasks(tasksData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(t('errors.failedToLoadDashboard'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={60} />
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

  return (
    <Box sx={{ flexGrow: 1 }}>
             <Typography variant="h4" component="h1" gutterBottom>
         {t('dashboard.title')}
       </Typography>

                                                                                   {/* Stats Grid */}
         <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid key="pets-stat" size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title={t('pets.title')} value={stats.totalPets} />
            </Grid>
            <Grid key="tasks-stat" size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title={t('tasks.title')} value={stats.tasksDue} />
            </Grid>
            <Grid key="vet-visits-stat" size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title={t('dashboard.upcomingVetVisits')}
                value={stats.upcomingVetVisits}
                description={t('dashboard.thisMonth')}
              />
            </Grid>
            <Grid key="overdue-vaccines-stat" size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title={t('dashboard.overdueVaccinations')}
                value={stats.overdueVaccinations}
                description={t('dashboard.needAttention')}
              />
            </Grid>
            <Grid key="upcoming-vaccines-stat" size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title={t('dashboard.upcomingVaccinations')}
                value={stats.upcomingVaccinations}
                description={t('dashboard.next30Days')}
              />
            </Grid>
         </Grid>

      {/* Recent Tasks */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
                     <Typography variant="h6" component="h2">
             {t('dashboard.recentTasks')}
           </Typography>
           <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate('/tasks')}>
             {t('dashboard.addTask')}
           </Button>
        </Box>
        
                 {recentTasks.length === 0 ? (
           <Typography color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", py: 3 }}>
             {t('dashboard.noPendingTasks')}
           </Typography>
         ) : (
          <TaskList
            tasks={recentTasks}
            onEdit={(id) => {
              navigate(`/tasks/edit/${id}`);
            }}
            onDelete={async (id) => {
              try {
                await deleteTask(Number(id));
                // Refresh tasks after deletion
                const updatedTasks = await getTasks();
                setRecentTasks(updatedTasks.slice(0, 5).map(task => ({
                  id: task.id || 0,
                  title: task.title || '',
                  description: task.description || '',
                  dueDate: task.dateTime || new Date().toISOString(),
                  pet: task.petIds?.length > 0 ? t('pets.pet') : t('pets.noPet'),
                  priority: (task.priority === 'urgent' ? 'high' : task.priority) || 'medium',
                  completed: task.isCompleted || false
                })));
              } catch (error) {
                console.error('Failed to delete task:', error);
              }
            }}
            onToggleComplete={async (id, completed) => {
              try {
                if (completed) {
                  await completeTask(Number(id));
                } else {
                  // Handle uncompleting if needed
                  console.log('Uncompleting task:', id);
                }
                // Refresh tasks after completion
                const updatedTasks = await getTasks();
                setRecentTasks(updatedTasks.slice(0, 5).map(task => ({
                  id: task.id || 0,
                  title: task.title || '',
                  description: task.description || '',
                  dueDate: task.dateTime || new Date().toISOString(),
                  pet: task.petIds?.length > 0 ? t('pets.pet') : t('pets.noPet'),
                  priority: (task.priority === 'urgent' ? 'high' : task.priority) || 'medium',
                  completed: task.isCompleted || false
                })));
              } catch (error) {
                console.error('Failed to toggle task completion:', error);
              }
            }}
          />
        )}
      </Paper>

      {/* Vaccine Reminders Section */}
      {(overdueVaccinations.length > 0 || upcomingVaccinations.length > 0) && (
        <Paper sx={{ p: 3, mb: 4 }}>
                   <Typography variant="h6" component="h2" gutterBottom>
           🩺 {t('dashboard.vaccineReminders')}
         </Typography>
          
          {/* Overdue Vaccinations */}
          {overdueVaccinations.length > 0 && (
            <Box sx={{ mb: 3 }}>
                             <Typography variant="subtitle1" color="error" sx={{ mb: 2, fontWeight: "bold" }}>
                 🚨 {t('dashboard.overdueVaccinationsTitle')} ({overdueVaccinations.length})
               </Typography>
               <Grid container spacing={2}>
                 {overdueVaccinations.slice(0, 4).map((vaccine: any) => (
                   <Grid key={vaccine.id} size={{ xs: 12, sm: 6, md: 3 }}>
                     <Alert severity="error" sx={{ height: '100%' }}>
                       <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                         {vaccine.pet_name}
                       </Typography>
                       <Typography variant="body2">
                         {getTranslatedVaccineName(vaccine.vaccine_name)}
                       </Typography>
                       <Typography variant="caption" color="text.secondary">
                         {t('dashboard.due')}: {vaccine.due_date ? new Date(vaccine.due_date).toLocaleDateString() : t('dashboard.noDateSet')}
                       </Typography>
                     </Alert>
                   </Grid>
                 ))}
               </Grid>
            </Box>
          )}
          
          {/* Upcoming Vaccinations */}
          {upcomingVaccinations.length > 0 && (
            <Box>
                             <Typography variant="subtitle1" color="warning.main" sx={{ mb: 2, fontWeight: "bold" }}>
                 ⏰ {t('dashboard.upcomingVaccinationsTitle')} ({upcomingVaccinations.length})
               </Typography>
               <Grid container spacing={2}>
                 {upcomingVaccinations.slice(0, 4).map((vaccine: any) => (
                   <Grid key={vaccine.id} size={{ xs: 12, sm: 6, md: 3 }}>
                     <Alert severity="warning" sx={{ height: '100%' }}>
                       <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                         {vaccine.pet_name}
                       </Typography>
                       <Typography variant="body2">
                         {getTranslatedVaccineName(vaccine.vaccine_name)}
                       </Typography>
                       <Typography variant="caption" color="text.secondary">
                         {t('dashboard.due')}: {vaccine.due_date ? new Date(vaccine.due_date).toLocaleDateString() : t('dashboard.noDateSet')}
                       </Typography>
                     </Alert>
                   </Grid>
                 ))}
               </Grid>
            </Box>
          )}
                 </Paper>
       )}

       {/* Weight Monitoring Section */}
       {(weightAlerts.length > 0 || weightHealthData.length > 0) && (
         <Paper sx={{ p: 3, mb: 4 }}>
           <Typography variant="h6" component="h2" gutterBottom>
             📊 {t('weight.weightTracking')}
           </Typography>
           
           {/* Weight Alerts */}
           {weightAlerts.length > 0 && (
             <Box sx={{ mb: 3 }}>
               <Typography variant="subtitle1" color="error" sx={{ mb: 2, fontWeight: "bold" }}>
                 ⚠️ {t('weight.weightAlerts')} ({weightAlerts.length})
               </Typography>
               <Grid container spacing={2}>
                 {weightAlerts.slice(0, 4).map((alert: any) => (
                   <Grid key={alert.id || `alert-${alert.petId}-${alert.message}`} size={{ xs: 12, sm: 6, md: 3 }}>
                     <Alert severity={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info'} sx={{ height: '100%' }}>
                       <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                         {alert.petName}
                       </Typography>
                       <Typography variant="body2">
                         {alert.message}
                       </Typography>
                       <Typography variant="caption" color="text.secondary">
                         {alert.recommendedAction}
                       </Typography>
                     </Alert>
                   </Grid>
                 ))}
               </Grid>
             </Box>
           )}
           
           {/* Weight Health Overview */}
           {weightHealthData.length > 0 && (
             <Box>
               <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
                 📈 {t('weight.monitoringHealth')}
               </Typography>
               <Grid container spacing={2}>
                 {weightHealthData.slice(0, 4).map((health: any) => (
                   <Grid key={health.petId} size={{ xs: 12, sm: 6, md: 3 }}>
                     <Paper sx={{ p: 2, height: '100%' }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                         <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                           {health.petName}
                         </Typography>
                         {health.hasWarnings && (
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                             <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.7rem' }}>
                               ⚠️
                             </Typography>
                           </Box>
                         )}
                       </Box>
                       <Typography variant="body2" color="text.secondary">
                         {t('weight.currentWeight')}: {health.currentWeight} {t('pets.kg')}
                       </Typography>
                       {health.idealRange && (
                         <Typography variant="caption" color="text.secondary">
                           {t('weight.idealWeightRange')}: {health.idealRange.minWeight}-{health.idealRange.maxWeight} {t('pets.kg')}
                         </Typography>
                       )}
                       {health.trend && (
                         <Typography variant="caption" color={health.trend.isHealthy ? 'success.main' : 'warning.main'}>
                           {health.trend.direction} trend
                         </Typography>
                       )}
                     </Paper>
                   </Grid>
                 ))}
               </Grid>
             </Box>
           )}
           
           <Button
             variant="outlined"
             size="small"
             onClick={() => navigate('/weight-tracking')}
             sx={{ mt: 2 }}
           >
             {t('weight.weightTracking')}
           </Button>
         </Paper>
       )}

              {/* Smart Vaccine Suggestions Section */}
       {pets.length > 0 && (
         <Paper sx={{ p: 3, mb: 4 }}>
           <Typography variant="h6" component="h2" gutterBottom>
             🩺 {t('dashboard.smartVaccineSuggestions')}
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
             {t('dashboard.smartVaccineDescription')}
           </Typography>
           
           {pets.slice(0, 2).map((pet: any) => {
             const smartSchedule = SmartVaccineService.getVaccineSchedule(pet);
             return (
               <Box key={pet.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                   <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {pet.name} ({t(`dashboard.${pet.type}`)})
                  </Typography>
                 <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                   {smartSchedule.overdueCount > 0 && (
                     <Chip
                       label={`${smartSchedule.overdueCount} ${t('dashboard.overdue')}`}
                       color="error"
                       size="small"
                     />
                   )}
                   {smartSchedule.upcomingCount > 0 && (
                     <Chip
                       label={`${smartSchedule.upcomingCount} ${t('dashboard.upcoming')}`}
                       color="warning"
                       size="small"
                     />
                   )}
                   {smartSchedule.overdueCount === 0 && smartSchedule.upcomingCount === 0 && (
                     <Chip
                       label={t('dashboard.upToDate')}
                       color="success"
                       size="small"
                     />
                   )}
                 </Box>
                 {smartSchedule.nextDueDate && (
                   <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                     {t('dashboard.nextDue')}: {smartSchedule.nextDueDate.toLocaleDateString()}
                   </Typography>
                 )}
               </Box>
             );
           })}
           
           <Button
             variant="outlined"
             size="small"
             onClick={() => navigate('/pets')}
             sx={{ mt: 2 }}
           >
             {t('dashboard.viewAllPets')}
           </Button>
         </Paper>
       )}


      {/* Upcoming Events Section */}
      <Grid container spacing={3}>
        <Grid key="upcoming-events" size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {t('dashboard.upcomingEvents')}
            </Typography>
            {stats.upcomingVetVisits > 0 ? (
              <Typography color="primary">
                {stats.upcomingVetVisits} {t('dashboard.vetAppointmentsScheduled')}
              </Typography>
            ) : (
              <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                {t('dashboard.noUpcomingEvents')}
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid key="health-reminders" size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {t('dashboard.healthReminders')}
            </Typography>
            {stats.overdueVaccinations > 0 ? (
              <Typography color="error">
                {stats.overdueVaccinations} {t('dashboard.vaccinationsOverdue')}
              </Typography>
            ) : (
              <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                {t('dashboard.allVaccinationsUpToDate')}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
