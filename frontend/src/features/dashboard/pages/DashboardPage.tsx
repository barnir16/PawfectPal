import { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography, CircularProgress, Alert, Chip } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { Button } from "./../../../components/ui/Button";
import { TaskList } from "./../../../features/tasks/components/TaskList";
import type { Task as TaskListTask } from "./../../../features/tasks/components/TaskList";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { ProviderDashboard } from "../../provider/pages/ProviderDashboard";
import { getPets } from "../../../services/pets/petService";
import { getTasks, deleteTask, completeTask } from "../../../services/tasks/taskService";
import {
  getAllVaccinations,
  getOverdueVaccinations,
  getVaccinationsDueSoon,
} from "../../../services/vaccines/vaccineService";
import { SmartVaccineService } from "../../../services/vaccines/smartVaccineService";
import { WeightMonitoringService } from "../../../services/weight/weightMonitoringService";
import { WeightService } from "../../../services/weight/weightService";
import { createTaskNotificationService } from "../../../services/notifications/taskNotificationService";
import { vaccineNameTranslations } from "../../../data/vaccines/israeliVaccines";
import { calculatePetAgeInYears } from "../../../utils/petAge";

type PetLike = Record<string, any>;
type DashboardWeightHealth = {
  petName: string;
  petId: number;
  currentWeight: number;
  idealRange: ReturnType<typeof WeightMonitoringService.estimateIdealWeight>;
  trend: ReturnType<typeof WeightMonitoringService.calculateWeightTrend>;
  hasWarnings: boolean;
};

const toRecentTasks = (
  tasks: any[],
  pets: PetLike[],
  t: (key: string) => string
): TaskListTask[] =>
  tasks
    .filter((task) => !task.isCompleted)
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    )
    .slice(0, 5)
    .map((task) => ({
      id: task.id || 0,
      title: task.title,
      description: task.description,
      dueDate: task.dateTime,
      pet: pets.find((pet) => pet.id === task.petIds?.[0])?.name || t("pets.unknown"),
      priority: task.priority || "medium",
      completed: task.isCompleted || false,
    }));

const getCurrentPetWeight = (pet: PetLike, latestRecordedWeight?: number): number =>
  latestRecordedWeight ?? pet.weightKg ?? pet.weight_kg ?? pet.weight ?? 0;

export const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t, currentLanguage } = useLocalization();
  const { addNotification } = useNotifications();

  const [pets, setPets] = useState<PetLike[]>([]);
  const [recentTasks, setRecentTasks] = useState<TaskListTask[]>([]);
  const [overdueVaccinations, setOverdueVaccinations] = useState<any[]>([]);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<any[]>([]);
  const [vaccinationHistoryByPet, setVaccinationHistoryByPet] = useState<Record<number, any[]>>({});
  const [weightAlerts, setWeightAlerts] = useState<any[]>([]);
  const [weightHealthData, setWeightHealthData] = useState<DashboardWeightHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (user?.is_provider) {
    return <ProviderDashboard />;
  }

  const getTranslatedVaccineName = (name: string): string => {
    if (currentLanguage === "he" && vaccineNameTranslations[name]) {
      return `${name} (${vaccineNameTranslations[name]})`;
    }
    return name;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [petsData, tasksData] = await Promise.all([getPets(), getTasks()]);
        setPets(petsData);
        setRecentTasks(toRecentTasks(tasksData, petsData, t));

        if (petsData.length > 0) {
          try {
            const [overdueData, upcomingData, allVaccinationRecords] = await Promise.all([
              getOverdueVaccinations().catch(() => []),
              getVaccinationsDueSoon(30).catch(() => []),
              getAllVaccinations().catch(() => []),
            ]);
            setOverdueVaccinations(overdueData || []);
            setUpcomingVaccinations(upcomingData || []);
            const historyMap = (allVaccinationRecords || []).reduce<Record<number, any[]>>((acc, record) => {
              if (!acc[record.pet_id]) {
                acc[record.pet_id] = [];
              }
              acc[record.pet_id].push(record);
              return acc;
            }, {});
            setVaccinationHistoryByPet(historyMap);
          } catch (vaccinationError) {
            console.warn("Could not fetch vaccination data:", vaccinationError);
          }

          try {
            const allWeightRecords = await WeightService.getAllWeightRecords();
            const weightRecordsByPet = allWeightRecords.reduce<Record<number, typeof allWeightRecords>>(
              (acc, record) => {
                if (!acc[record.petId]) {
                  acc[record.petId] = [];
                }
                acc[record.petId].push(record);
                return acc;
              },
              {}
            );

            const nextWeightAlerts: any[] = [];
            const nextWeightHealthData: DashboardWeightHealth[] = [];

            for (const pet of petsData) {
              const petWeightRecords = weightRecordsByPet[pet.id] || [];
              const currentWeight = getCurrentPetWeight(
                pet,
                petWeightRecords[petWeightRecords.length - 1]?.weight
              );
              const petWeightHealth = WeightMonitoringService.estimateIdealWeight(
                pet.type || "dog",
                pet.breed
              );

              const petRecordAlerts = WeightMonitoringService.getAllWeightAlerts(
                petWeightRecords,
                undefined,
                t
              );
              if (petRecordAlerts.length > 0) {
                nextWeightAlerts.push(
                  ...petRecordAlerts.map((alert) => ({
                    ...alert,
                    petName: pet.name,
                    petId: pet.id,
                  }))
                );
              }

              if (petWeightHealth) {
                const petAge = calculatePetAgeInYears(pet) ?? undefined;
                const petWeightWarnings = WeightMonitoringService.getWeightWarnings(
                  currentWeight,
                  petWeightHealth,
                  pet.name,
                  t,
                  petAge
                );

                if (petWeightWarnings.length > 0) {
                  nextWeightAlerts.push(
                    ...petWeightWarnings.map((warning) => ({
                      ...warning,
                      petName: pet.name,
                      petId: pet.id,
                    }))
                  );
                }

                nextWeightHealthData.push({
                  petName: pet.name,
                  petId: pet.id,
                  currentWeight,
                  idealRange: petWeightHealth,
                  trend: WeightMonitoringService.calculateWeightTrend(petWeightRecords),
                  hasWarnings: petWeightWarnings.length > 0,
                });
              }
            }

            setWeightAlerts(nextWeightAlerts);
            setWeightHealthData(nextWeightHealthData);
          } catch (weightError) {
            console.warn("Could not fetch weight monitoring data:", weightError);
          }
        }

        const notificationService = createTaskNotificationService(addNotification);
        notificationService.checkOverdueTasks(tasksData);
        notificationService.checkUpcomingTasks(tasksData);
      } catch (dashboardError) {
        console.error("Error fetching dashboard data:", dashboardError);
        setError(t("errors.failedToLoadDashboard"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [addNotification, isAuthenticated, t]);

  const refreshRecentTasks = async () => {
    const updatedTasks = await getTasks();
    setRecentTasks(toRecentTasks(updatedTasks, pets, t));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
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
        {t("dashboard.title")}
      </Typography>

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
            {t("dashboard.recentTasks")}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate("/tasks")}
          >
            {t("dashboard.addTask")}
          </Button>
        </Box>

        {recentTasks.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", py: 3 }}>
            {t("dashboard.noPendingTasks")}
          </Typography>
        ) : (
          <TaskList
            tasks={recentTasks}
            onEdit={(id) => navigate(`/tasks/edit/${id}`)}
            onDelete={async (id) => {
              try {
                await deleteTask(Number(id));
                await refreshRecentTasks();
              } catch (taskError) {
                console.error("Failed to delete task:", taskError);
              }
            }}
            onToggleComplete={async (id, completed) => {
              try {
                if (completed) {
                  await completeTask(Number(id));
                }
                await refreshRecentTasks();
              } catch (taskError) {
                console.error("Failed to toggle task completion:", taskError);
              }
            }}
          />
        )}
      </Paper>

      {(overdueVaccinations.length > 0 || upcomingVaccinations.length > 0) && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t("dashboard.vaccineReminders")}
          </Typography>

          {overdueVaccinations.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" color="error" sx={{ mb: 2, fontWeight: "bold" }}>
                {t("dashboard.overdueVaccinationsTitle")} ({overdueVaccinations.length})
              </Typography>
              <Grid container spacing={2}>
                {overdueVaccinations.slice(0, 4).map((vaccine: any) => (
                  <Grid key={vaccine.id} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Alert severity="error" sx={{ height: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        {vaccine.pet_name}
                      </Typography>
                      <Typography variant="body2">
                        {getTranslatedVaccineName(vaccine.vaccine_name)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("dashboard.due")}:{" "}
                        {vaccine.due_date
                          ? new Date(vaccine.due_date).toLocaleDateString()
                          : t("dashboard.noDateSet")}
                      </Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {upcomingVaccinations.length > 0 && (
            <Box>
              <Typography variant="subtitle1" color="warning.main" sx={{ mb: 2, fontWeight: "bold" }}>
                {t("dashboard.upcomingVaccinationsTitle")} ({upcomingVaccinations.length})
              </Typography>
              <Grid container spacing={2}>
                {upcomingVaccinations.slice(0, 4).map((vaccine: any) => (
                  <Grid key={vaccine.id} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Alert severity="warning" sx={{ height: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        {vaccine.pet_name}
                      </Typography>
                      <Typography variant="body2">
                        {getTranslatedVaccineName(vaccine.vaccine_name)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("dashboard.due")}:{" "}
                        {vaccine.due_date
                          ? new Date(vaccine.due_date).toLocaleDateString()
                          : t("dashboard.noDateSet")}
                      </Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      )}

      {(weightAlerts.length > 0 || weightHealthData.length > 0) && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t("weight.weightTracking")}
          </Typography>

          {weightAlerts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" color="error" sx={{ mb: 2, fontWeight: "bold" }}>
                {t("weight.weightAlerts")} ({weightAlerts.length})
              </Typography>
              <Grid container spacing={2}>
                {weightAlerts.slice(0, 4).map((alert: any) => (
                  <Grid key={alert.id || `alert-${alert.petId}-${alert.message}`} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Alert
                      severity={
                        alert.severity === "critical"
                          ? "error"
                          : alert.severity === "high"
                            ? "warning"
                            : "info"
                      }
                      sx={{ height: "100%" }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        {alert.petName}
                      </Typography>
                      <Typography variant="body2">{alert.message}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {alert.recommendedAction}
                      </Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {weightHealthData.length > 0 && (
            <Box>
              <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
                {t("weight.monitoringHealth")}
              </Typography>
              <Grid container spacing={2}>
                {weightHealthData.slice(0, 4).map((health) => (
                  <Grid key={health.petId} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2, height: "100%" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                          {health.petName}
                        </Typography>
                        {health.hasWarnings && (
                          <Typography variant="caption" color="warning.main" sx={{ fontSize: "0.7rem" }}>
                            !
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {t("weight.currentWeight")}: {health.currentWeight} {t("pets.kg")}
                      </Typography>
                      {health.idealRange && (
                        <Typography variant="caption" color="text.secondary">
                          {t("weight.idealWeightRange")}: {health.idealRange.minWeight}-{health.idealRange.maxWeight} {t("pets.kg")}
                        </Typography>
                      )}
                      {health.trend && (
                        <Typography
                          variant="caption"
                          color={health.trend.isHealthy ? "success.main" : "warning.main"}
                        >
                          {health.trend.direction} trend
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Button variant="outlined" size="small" onClick={() => navigate("/weight-tracking")} sx={{ mt: 2 }}>
            {t("weight.weightTracking")}
          </Button>
        </Paper>
      )}

      {pets.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t("dashboard.smartVaccineSuggestions")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("dashboard.smartVaccineDescription")}
          </Typography>

          {pets.slice(0, 2).map((pet) => {
            const smartSchedule = SmartVaccineService.getVaccineSchedule(
              pet,
              vaccinationHistoryByPet[pet.id] || []
            );
            return (
              <Box
                key={pet.id}
                sx={{ mb: 2, p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
              >
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  {pet.name} ({t(`dashboard.${pet.type}`)})
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {smartSchedule.overdueCount > 0 && (
                    <Chip label={`${smartSchedule.overdueCount} ${t("dashboard.overdue")}`} color="error" size="small" />
                  )}
                  {smartSchedule.upcomingCount > 0 && (
                    <Chip
                      label={`${smartSchedule.upcomingCount} ${t("dashboard.upcoming")}`}
                      color="warning"
                      size="small"
                    />
                  )}
                  {smartSchedule.overdueCount === 0 && smartSchedule.upcomingCount === 0 && (
                    <Chip label={t("dashboard.upToDate")} color="success" size="small" />
                  )}
                </Box>
                {smartSchedule.nextDueDate && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {t("dashboard.nextDue")}: {smartSchedule.nextDueDate.toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            );
          })}

          <Button variant="outlined" size="small" onClick={() => navigate("/pets")} sx={{ mt: 2 }}>
            {t("dashboard.viewAllPets")}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;
