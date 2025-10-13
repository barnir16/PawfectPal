import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  CircularProgress,
  Rating,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { getProviders } from "../servicesApi";
import type { ServiceProvider, ServiceType } from "../../../types/services";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { ServiceProviderCard } from "../../../components/services/ServiceProviderCard";
import { ServiceErrorBoundary } from "../components/ServiceErrorBoundary";
import { ServiceTypeDropdown } from "../../../components/services/ServiceTypeDropdown";
import { getFullImageUrl } from "../../../utils/image";
import { CardMedia, CardActions, Button } from "@mui/material";

export const BookService = () => {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<
    ServiceType | ""
  >("");

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProviders();
        setProviders(data);
        setFilteredProviders(data);
      } catch (err: any) {
        setError(err.message || t("services.somethingWentWrong"));
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Filter providers based on selected service type
  useEffect(() => {
    if (selectedServiceType === "") {
      setFilteredProviders(providers);
    } else {
      const filtered = providers.filter((provider) =>
        provider.provider_services.includes(selectedServiceType)
      );
      setFilteredProviders(filtered);
    }
  }, [selectedServiceType, providers]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
          }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t("services.loading")}</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Typography color="error" sx={{ textAlign: "center", p: 4 }}>
          {error}
        </Typography>
      );
    }

    if (filteredProviders.length === 0) {
      return (
        <Typography sx={{ textAlign: "center", p: 4, color: "text.secondary" }}>
          {selectedServiceType
            ? t("services.noProvidersFound")
            : t("services.noProvidersFound")}
        </Typography>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredProviders.map((provider) => (
          <Grid key={provider.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <ServiceProviderCard
              provider={provider}
              onRequestService={(provider) => {
                console.log("Service request created for provider:", provider);
                // TODO: Navigate to chat or show success message
              }}
              onViewProfile={(provider) => {
                navigate(`/provider/${provider.id}`);
              }}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <ServiceErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t("services.providers")}
        </Typography>

        {/* Service Type Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("services.filterByType")}
          </Typography>
          <Box sx={{ maxWidth: 300 }}>
            <ServiceTypeDropdown
              value={selectedServiceType}
              onChange={setSelectedServiceType}
              fullWidth={true}
              size="medium"
            />
          </Box>
        </Paper>

        {renderContent()}
      </Box>
    </ServiceErrorBoundary>
  );
};
