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

  // Friendly time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.full_name?.trim().split(" ")[0] || user?.username || "";

  // How many urgent items exist in total (for summary line)
  const totalUrgent = overdueVaccinations.length + weightAlerts.filter((a: any) => a.severity === "critical" || a.severity === "high").length;

  // Section card style — replaces flat Paper with something warmer
  const sectionCard = {
    p: 3,
    mb: 3,
    borderRadius: "20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.05)",
  };

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 1100 }}>

      {/* ── Greeting ────────────────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
          {getGreeting()}{firstName ? `, ${firstName}` : ""}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {totalUrgent > 0
            ? `You have ${totalUrgent} item${totalUrgent > 1 ? "s" : ""} that need${totalUrgent === 1 ? "s" : ""} attention today.`
            : pets.length > 0
              ? `Your ${pets.length} pet${pets.length > 1 ? "s are" : " is"} all caught up. Great job! 🐾`
              : "Welcome to PawfectPal — add your first pet to get started."}
        </Typography>
      </Box>

      {/* ── Recent Tasks ─────────────────────────────────────────── */}
      <Paper sx={sectionCard}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
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
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 3, fontSize: "0.9rem" }}>
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

      {/* ── Vaccine Reminders ────────────────────────────────────── */}
      {(overdueVaccinations.length > 0 || upcomingVaccinations.length > 0) && (
        <Paper sx={sectionCard}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
            {t("dashboard.vaccineReminders")}
          </Typography>

          {overdueVaccinations.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 700 }}>
                  {t("dashboard.overdueVaccinationsTitle")} ({overdueVaccinations.length})
                </Typography>
                {overdueVaccinations.length > 3 && (
                  <Button size="small" variant="text" color="error" onClick={() => navigate("/tasks")}>
                    +{overdueVaccinations.length - 3} more
                  </Button>
                )}
              </Box>
              <Grid container spacing={1.5}>
                {overdueVaccinations.slice(0, 3).map((vaccine: any) => (
                  <Grid key={vaccine.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Alert severity="error" sx={{ borderRadius: "12px" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {vaccine.pet_name}
                      </Typography>
                      <Typography variant="body2">
                        {getTranslatedVaccineName(vaccine.vaccine_name)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("dashboard.due")}:{" "}
                        {vaccine.due_date ? new Date(vaccine.due_date).toLocaleDateString() : t("dashboard.noDateSet")}
                      </Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {upcomingVaccinations.length > 0 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 700 }}>
                  {t("dashboard.upcomingVaccinationsTitle")} ({upcomingVaccinations.length})
                </Typography>
                {upcomingVaccinations.length > 3 && (
                  <Button size="small" variant="text" color="warning" onClick={() => navigate("/tasks")}>
                    +{upcomingVaccinations.length - 3} more
                  </Button>
                )}
              </Box>
              <Grid container spacing={1.5}>
                {upcomingVaccinations.slice(0, 3).map((vaccine: any) => (
                  <Grid key={vaccine.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Alert severity="warning" sx={{ borderRadius: "12px" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {vaccine.pet_name}
                      </Typography>
                      <Typography variant="body2">
                        {getTranslatedVaccineName(vaccine.vaccine_name)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("dashboard.due")}:{" "}
                        {vaccine.due_date ? new Date(vaccine.due_date).toLocaleDateString() : t("dashboard.noDateSet")}
                      </Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Weight Tracking ──────────────────────────────────────── */}
      {(weightAlerts.length > 0 || weightHealthData.length > 0) && (
        <Paper sx={sectionCard}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {t("weight.weightTracking")}
            </Typography>
            <Button variant="text" size="small" onClick={() => navigate("/weight-tracking")}>
              {t("weight.weightTracking")} →
            </Button>
          </Box>

          {weightAlerts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 700 }}>
                  {t("weight.weightAlerts")} ({weightAlerts.length})
                </Typography>
                {weightAlerts.length > 3 && (
                  <Button size="small" variant="text" color="error" onClick={() => navigate("/weight-tracking")}>
                    +{weightAlerts.length - 3} more
                  </Button>
                )}
              </Box>
              <Grid container spacing={1.5}>
                {weightAlerts.slice(0, 3).map((alert: any) => (
                  <Grid key={alert.id || `alert-${alert.petId}-${alert.message}`} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Alert
                      severity={alert.severity === "critical" ? "error" : alert.severity === "high" ? "warning" : "info"}
                      sx={{ borderRadius: "12px" }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                {t("weight.monitoringHealth")}
              </Typography>
              <Grid container spacing={1.5}>
                {weightHealthData.slice(0, 4).map((health) => (
                  <Grid key={health.petId} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: "14px",
                        bgcolor: health.hasWarnings ? "rgba(231,111,81,0.06)" : "rgba(82,183,136,0.06)",
                        border: "1px solid",
                        borderColor: health.hasWarnings ? "rgba(231,111,81,0.15)" : "rgba(82,183,136,0.15)",
                        boxShadow: "none",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {health.petName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {health.currentWeight} {t("pets.kg")}
                      </Typography>
                      {health.idealRange && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Ideal: {health.idealRange.minWeight}–{health.idealRange.maxWeight} {t("pets.kg")}
                        </Typography>
                      )}
                      {health.trend && (
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: health.trend.isHealthy ? "success.main" : "warning.dark" }}
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
        </Paper>
      )}

      {/* ── Smart Vaccine Suggestions ────────────────────────────── */}
      {pets.length > 0 && (
        <Paper sx={sectionCard}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {t("dashboard.smartVaccineSuggestions")}
            </Typography>
            <Button variant="text" size="small" onClick={() => navigate("/pets")}>
              {t("dashboard.viewAllPets")} →
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: "0.85rem" }}>
            {t("dashboard.smartVaccineDescription")}
          </Typography>

          {pets.slice(0, 3).map((pet) => {
            const smartSchedule = SmartVaccineService.getVaccineSchedule(
              pet,
              vaccinationHistoryByPet[pet.id] || []
            );
            return (
              <Box
                key={pet.id}
                sx={{
                  mb: 1.5,
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: "rgba(0,0,0,0.025)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {pet.name}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                    {t(`dashboard.${pet.type}`)}
                  </Typography>
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                  {smartSchedule.overdueCount > 0 && (
                    <Chip label={`${smartSchedule.overdueCount} ${t("dashboard.overdue")}`} color="error" size="small" />
                  )}
                  {smartSchedule.upcomingCount > 0 && (
                    <Chip label={`${smartSchedule.upcomingCount} ${t("dashboard.upcoming")}`} color="warning" size="small" />
                  )}
                  {smartSchedule.overdueCount === 0 && smartSchedule.upcomingCount === 0 && (
                    <Chip label={t("dashboard.upToDate")} color="success" size="small" />
                  )}
                  {smartSchedule.nextDueDate && (
                    <Typography variant="caption" color="text.secondary">
                      Next: {smartSchedule.nextDueDate.toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;
