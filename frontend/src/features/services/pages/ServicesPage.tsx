import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { ServiceErrorBoundary } from "../components/ServiceErrorBoundary";
import MockService from "../../../services/services/mockServices";
import type { Service } from "../../../types/services/service";
import { Link as RouterLink } from "react-router-dom";

export const ServicesPage = () => {
  const { t } = useLocalization();
  const [tab, setTab] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let services: Service[] = [];

      if (tab === 0) {
        // For active tab, get services that are not completed or cancelled
        const allServices = await MockService.getServices();
        services = allServices.filter(
          (service) =>
            service.status !== "completed" && service.status !== "cancelled"
        );
      } else {
        // For history tab, get completed and cancelled services
        const completedServices =
          await MockService.getServicesByStatus("completed");
        const cancelledServices =
          await MockService.getServicesByStatus("cancelled");
        services = [...completedServices, ...cancelledServices];
      }

      setServices(services);
    } catch (err: any) {
      setError(err.message || t("services.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <ServiceErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t("services.title")}
        </Typography>

        <Tabs value={tab} onChange={handleChange}>
          <Tab label={t("services.activeUpcoming")} />
          <Tab label={t("services.historyCompleted")} />
        </Tabs>

        <Paper sx={{ mt: 2, p: 2 }}>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>{t("services.loading")}</Typography>
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ textAlign: "center", p: 3 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && services.length === 0 && (
            <Typography
              sx={{ textAlign: "center", p: 3, color: "text.secondary" }}
            >
              {t("services.noServicesFound")}
            </Typography>
          )}

          {!loading && !error && services.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {services.map((service) => {
                let statusColor: "success" | "error" | "warning";
                if (service.status === "completed") {
                  statusColor = "success";
                } else if (service.status === "cancelled") {
                  statusColor = "error";
                } else {
                  statusColor = "warning";
                }

                return (
                  <Card
                    key={service.id}
                    elevation={6}
                    sx={{
                      borderRadius: 3,
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 180,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {t(`${service.service_type}`)}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        {t("for")} {service.pet_name}
                      </Typography>

                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("services.startDate")}:{" "}
                          {new Date(
                            service.start_datetime
                          ).toLocaleDateString()}
                        </Typography>
                        {service.end_datetime && (
                          <Typography variant="body2" color="text.secondary">
                            {t("services.endDate")}:{" "}
                            {new Date(
                              service.end_datetime
                            ).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>

                    <CardActions
                      sx={{ justifyContent: "space-between", mt: "auto" }}
                    >
                      <Chip
                        label={t(`${service.status}`)}
                        color={statusColor}
                        size="medium"
                        sx={{ fontWeight: "bold" }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        to={`/services/${service.id}`}
                      >
                        {t("Details")}
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>
    </ServiceErrorBoundary>
  );
};
