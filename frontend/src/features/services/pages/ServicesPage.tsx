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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { CheckCircle, Cancel, Schedule, Search } from "@mui/icons-material";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { ServiceErrorBoundary } from "../components/ServiceErrorBoundary";
import MockService from "../../../services/services/mockServices";
import { apiRequest } from "../../../services/api";
import type { Service } from "../../../types/services/service";
import { Link as RouterLink } from "react-router-dom";
import { SHARED_CONFIG } from "../../../config/shared";

export const ServicesPage = () => {
  const { t } = useLocalization();
  const [tab, setTab] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // new states for search and filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const isLocalDevelopment =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    const shouldUseMockFallback =
      SHARED_CONFIG.development.enableMockData && isLocalDevelopment;

    try {
      const realServices = await apiRequest<Service[]>("/service_booking/");
      let fetchedServices =
        tab === 0
          ? realServices.filter(
              (service) =>
                service.status !== "completed" && service.status !== "cancelled"
            )
          : realServices.filter(
              (service) =>
                service.status === "completed" || service.status === "cancelled"
            );

      setServices(fetchedServices);
    } catch (err: any) {
      if (!shouldUseMockFallback) {
        setError(err.message || t("services.somethingWentWrong"));
        setServices([]);
        setLoading(false);
        return;
      }

      try {
        let fallbackServices: Service[] = [];

        if (tab === 0) {
          const allFallbackServices = await MockService.getServices();
          fallbackServices = allFallbackServices.filter(
            (service) =>
              service.status !== "completed" && service.status !== "cancelled"
          );
        } else {
          const completed = await MockService.getServicesByStatus("completed");
          const cancelled = await MockService.getServicesByStatus("cancelled");
          fallbackServices = [...completed, ...cancelled];
        }

        setServices(fallbackServices);
      } catch (fallbackError: any) {
        setError(
          fallbackError.message ||
            err.message ||
            t("services.somethingWentWrong")
        );
      }
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) =>
    setTab(newValue);

  const getStatusColor = (
    status: Service["status"]
  ): "success" | "error" | "warning" | "primary" => {
    if (status === "completed") return "success";
    if (status === "cancelled") return "error";
    if (status === "confirmed") return "primary";
    return "warning";
  };

  const getStatusIcon = (status: Service["status"]) => {
    if (status === "completed") return <CheckCircle fontSize="small" />;
    if (status === "cancelled") return <Cancel fontSize="small" />;
    return <Schedule fontSize="small" />;
  };

  const getServiceTypeLabel = (serviceType: Service["service_type"]) => {
    const keyMap: Record<Service["service_type"], string> = {
      walking: "services.walking",
      sitting: "services.sitting",
      boarding: "services.boarding",
      grooming: "services.grooming",
      veterinary: "services.veterinary",
      training: "services.training",
    };

    return t(keyMap[serviceType]);
  };

  const getStatusLabel = (status: Service["status"]) => {
    const keyMap: Record<Service["status"], string> = {
      pending: "services.pending",
      confirmed: "services.confirmed",
      in_progress: "services.inProgress",
      completed: "services.completed",
      cancelled: "services.cancelled",
      rejected: "services.cancelled",
    };

    return t(keyMap[status] ?? status);
  };

  // apply filters
  const filteredServices = services
    .filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
    .filter(
      (s) =>
        s.pet_name.toLowerCase().includes(search.toLowerCase()) ||
        s.service_type.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <ServiceErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t("services.manageBookings")}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t("services.manageBookingsSubtitle")}
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          <Button
            variant="contained"
            component={RouterLink}
            to="/bookservice"
          >
            {t("services.findProviders")}
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/marketplace"
          >
            {t("marketplace.requestBoard")}
          </Button>
        </Box>

        <Tabs value={tab} onChange={handleChange}>
          <Tab label={t("services.activeUpcoming")} />
          <Tab label={t("services.historyCompleted")} />
        </Tabs>

        {/* filters UI */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t("filterByStatus")}</InputLabel>
            <Select
              value={statusFilter}
              label={t("filterByStatus")}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">{t("common.all")}</MenuItem>
              <MenuItem value="pending">{t("services.pending")}</MenuItem>
              <MenuItem value="confirmed">{t("services.confirmed")}</MenuItem>
              <MenuItem value="in_progress">{t("services.inProgress")}</MenuItem>
              <MenuItem value="completed">{t("services.completed")}</MenuItem>
              <MenuItem value="cancelled">{t("services.cancelled")}</MenuItem>
            </Select>
          </FormControl>
        </Box>

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

          {!loading && !error && filteredServices.length === 0 && (
            <Box sx={{ textAlign: "center", p: 4 }}>
              <Typography sx={{ color: "text.secondary", mb: 2 }}>
                {t("services.noServicesFound")}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/bookservice"
                >
                  {t("services.findProviders")}
                </Button>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/marketplace"
                >
                  {t("marketplace.createPost")}
                </Button>
              </Box>
            </Box>
          )}

          {!loading && !error && filteredServices.length > 0 && (
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
              {filteredServices.map((service) => (
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
                      {getServiceTypeLabel(service.service_type)}
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
                        {new Date(service.start_datetime).toLocaleDateString()}
                      </Typography>
                      {service.end_datetime && (
                        <Typography variant="body2" color="text.secondary">
                          {t("services.endDate")}:{" "}
                          {new Date(service.end_datetime).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions
                    sx={{ justifyContent: "flex-end", gap: 1, mt: "auto" }}
                  >
                    <Chip
                      label={getStatusLabel(service.status)}
                      color={getStatusColor(service.status)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                      icon={getStatusIcon(service.status)}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      component={RouterLink}
                      to={`/services/${service.id}`}
                    >
                      {t("common.details")}
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </ServiceErrorBoundary>
  );
};
