import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  AttachMoney,
  FilterList,
  LocationOn,
  Message,
  Person,
  Pets,
  Refresh,
  Search,
  Visibility,
} from "@mui/icons-material";
import { useLocalization } from "../../contexts/LocalizationContext";
import { marketplaceService } from "../../services/marketplace/marketplaceService";
import { ServiceRequestService } from "../../services/serviceRequests/serviceRequestService";
import { MarketplacePostCard } from "../marketplace/MarketplacePostCard";
import type { MarketplacePostSummary } from "../../types/services/marketplacePost";
import type {
  ServiceRequestFilters,
  ServiceRequestSummary,
} from "../../types/services/serviceRequest";

export const ServiceRequestBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLocalization();
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequestSummary[]>([]);
  const [marketplacePosts, setMarketplacePosts] = useState<MarketplacePostSummary[]>([]);
  const [serviceTypes, setServiceTypes] = useState<
    Array<{ id: number; name: string; description?: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServiceRequestFilters>({
    service_type: "",
    location: "",
    budget_min: undefined,
    budget_max: undefined,
    is_urgent: undefined,
    limit: 20,
    offset: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(currentLanguage === "he" ? "he-IL" : "en-US", {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      }),
    [currentLanguage]
  );

  const relativeTimeFormatter = useMemo(
    () =>
      new Intl.RelativeTimeFormat(currentLanguage === "he" ? "he" : "en", {
        numeric: "auto",
      }),
    [currentLanguage]
  );

  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        const types = await marketplaceService.getServiceTypes();
        setServiceTypes(types);
      } catch {
        setServiceTypes([
          { id: 1, name: "Dog Walking" },
          { id: 2, name: "Pet Sitting" },
          { id: 3, name: "Boarding" },
          { id: 4, name: "Grooming" },
          { id: 5, name: "Veterinary" },
          { id: 6, name: "Training" },
        ]);
      }
    };

    void loadServiceTypes();
  }, []);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const [requestData, marketplaceData] = await Promise.all([
          ServiceRequestService.getServiceRequests(filters),
          marketplaceService.getPosts({
            service_type: filters.service_type || undefined,
            location: filters.location || undefined,
            is_urgent: filters.is_urgent,
            limit: filters.limit,
            skip: filters.offset,
          }),
        ]);

        setRequests(requestData);
        setMarketplacePosts(marketplaceData);
      } catch (loadError: any) {
        setError(loadError.message || "Failed to load service opportunities");
      } finally {
        setLoading(false);
      }
    };

    void loadContent();
  }, [filters]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      setFilteredRequests(requests);
      return;
    }

    setFilteredRequests(
      requests.filter((request) => {
        const petNames = request.pets.map((pet) => pet.name.toLowerCase()).join(" ");
        return (
          request.title.toLowerCase().includes(normalizedQuery) ||
          request.location?.toLowerCase().includes(normalizedQuery) ||
          request.user.full_name?.toLowerCase().includes(normalizedQuery) ||
          petNames.includes(normalizedQuery)
        );
      })
    );
  }, [requests, searchQuery]);

  const filteredMarketplacePosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return marketplacePosts;
    }

    return marketplacePosts.filter((post) => {
      const petNames = post.pets?.map((pet) => pet.name.toLowerCase()).join(" ") || "";
      return (
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.description.toLowerCase().includes(normalizedQuery) ||
        post.location?.toLowerCase().includes(normalizedQuery) ||
        petNames.includes(normalizedQuery)
      );
    });
  }, [marketplacePosts, searchQuery]);

  const getServiceTypeTranslationKey = (serviceType: string): string => {
    const mapping: Record<string, string> = {
      "Dog Walking": "walking",
      "Pet Sitting": "sitting",
      Boarding: "boarding",
      Grooming: "grooming",
      Veterinary: "veterinary",
      Training: "training",
      "Pet Taxi": "petTaxi",
      Daycare: "daycare",
    };

    return mapping[serviceType] || serviceType.toLowerCase();
  };

  const formatBudget = (min?: number, max?: number) => {
    if (min !== undefined && max !== undefined) {
      return `${currencyFormatter.format(min)} - ${currencyFormatter.format(max)}`;
    }
    if (min !== undefined) {
      return `${currencyFormatter.format(min)}+`;
    }
    if (max !== undefined) {
      return currencyFormatter.format(max);
    }
    return t("marketplace.budgetNotSpecified");
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffInHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return relativeTimeFormatter.format(0, "hour");
    }
    if (diffInHours < 24) {
      return relativeTimeFormatter.format(-Math.floor(diffInHours), "hour");
    }
    if (diffInHours < 168) {
      return relativeTimeFormatter.format(-Math.floor(diffInHours / 24), "day");
    }

    return date.toLocaleDateString(currentLanguage === "he" ? "he-IL" : "en-US");
  };

  const buildRequestPreview = (request: ServiceRequestSummary) => {
    const petNames = request.pets
      .map((pet) => pet.name)
      .filter(Boolean)
      .slice(0, 3);

    if (petNames.length > 0) {
      return `${t("services.pets")}: ${petNames.join(", ")}`;
    }

    if (request.location) {
      return `${t("services.location")}: ${request.location}`;
    }

    return `${t("services.serviceType")}: ${t(
      `services.${getServiceTypeTranslationKey(request.service_type)}`
    )}`;
  };

  const getServiceTypeColor = (
    serviceType: string
  ): "primary" | "secondary" | "success" | "warning" | "error" => {
    const colorMap: Record<string, "primary" | "secondary" | "success" | "warning" | "error"> = {
      walking: "primary",
      sitting: "secondary",
      boarding: "success",
      grooming: "warning",
      veterinary: "error",
      training: "warning",
      petTaxi: "primary",
      daycare: "secondary",
    };

    return colorMap[getServiceTypeTranslationKey(serviceType)] || "primary";
  };

  const handleFilterChange = (key: keyof ServiceRequestFilters, value: any) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      offset: 0,
    }));
  };

  const handleRefresh = () => {
    setFilters((previous) => ({ ...previous }));
  };

  const renderRequestCard = (request: ServiceRequestSummary) => (
    <Card
      key={request.id}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              color={getServiceTypeColor(request.service_type)}
              disabled
            >
              {t(`services.${getServiceTypeTranslationKey(request.service_type)}`)}
            </Button>
            {request.is_urgent && (
              <Button variant="outlined" size="small" color="error" disabled>
                {t("services.isUrgent")}
              </Button>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatTimeAgo(request.created_at)}
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {request.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {buildRequestPreview(request)}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
            {request.user.full_name?.[0] || request.user.username?.[0] || "U"}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {request.user.full_name || request.user.username}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Pets sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {request.pets.length} {t("services.pets")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {request.location && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <LocationOn sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {request.location}
              </Typography>
            </Box>
          )}

          {(request.budget_min !== undefined || request.budget_max !== undefined) && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {formatBudget(request.budget_min, request.budget_max)}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            {request.views_count} {t("services.views")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {request.responses_count} {t("services.responses")}
          </Typography>
        </Box>
      </CardContent>

      <Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(`/service-requests/${request.id}`)}
          startIcon={<Visibility />}
          sx={{ flex: 1 }}
        >
          {t("services.viewDetails")}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate(`/chat/${request.id}`)}
          startIcon={<Message />}
          sx={{ flex: 1 }}
        >
          {t("services.contactUser")}
        </Button>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t("services.browseRequests")}</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/service-request-form")}
        >
          {t("services.createRequest")}
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label={t("services.browseRequests")} icon={<Person />} iconPosition="start" />
          <Tab label={t("marketplace.title")} icon={<Visibility />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="h6">{t("services.filters")}</Typography>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder={t("services.searchRequests")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t("services.serviceType")}</InputLabel>
              <Select
                value={filters.service_type || ""}
                onChange={(event) =>
                  handleFilterChange("service_type", event.target.value || undefined)
                }
                label={t("services.serviceType")}
              >
                <MenuItem value="">{t("services.allServices")}</MenuItem>
                {serviceTypes.map((type) => (
                  <MenuItem key={type.id} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              placeholder={t("services.location")}
              value={filters.location || ""}
              onChange={(event) =>
                handleFilterChange("location", event.target.value || undefined)
              }
            />
          </Grid>

          <Grid size={{ xs: 6, md: 1 }}>
            <TextField
              fullWidth
              type="number"
              placeholder={t("services.budgetMin")}
              value={filters.budget_min || ""}
              onChange={(event) =>
                handleFilterChange(
                  "budget_min",
                  event.target.value ? Number(event.target.value) : undefined
                )
              }
            />
          </Grid>

          <Grid size={{ xs: 6, md: 1 }}>
            <TextField
              fullWidth
              type="number"
              placeholder={t("services.budgetMax")}
              value={filters.budget_max || ""}
              onChange={(event) =>
                handleFilterChange(
                  "budget_max",
                  event.target.value ? Number(event.target.value) : undefined
                )
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant={filters.is_urgent ? "contained" : "outlined"}
              onClick={() =>
                handleFilterChange(
                  "is_urgent",
                  filters.is_urgent ? undefined : true
                )
              }
              startIcon={<FilterList />}
            >
              {t("services.urgentOnly")}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t("common.loading")}</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : activeTab === 0 ? (
        filteredRequests.length === 0 ? (
          <Alert severity="info">
            {searchQuery ? t("services.noMatchingRequests") : t("services.noRequestsFound")}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredRequests.map((request) => (
              <Grid size={{ xs: 12, md: 6 }} key={request.id}>
                {renderRequestCard(request)}
              </Grid>
            ))}
          </Grid>
        )
      ) : filteredMarketplacePosts.length === 0 ? (
        <Alert severity="info">{t("marketplace.noPostsFound")}</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredMarketplacePosts.map((post) => (
            <Grid size={{ xs: 12, md: 6 }} key={post.id}>
              <MarketplacePostCard
                post={post}
                onViewDetails={() => navigate("/marketplace")}
                onContact={() => navigate("/marketplace")}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => navigate("/service-request-form")}
      >
        <Add />
      </Fab>
    </Box>
  );
};
