import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  CircularProgress,
  Rating,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { getProviders } from "../servicesApi";
import type { ServiceProvider } from "../../../types/services";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { ServiceProviderCard } from "../components/ServiceProviderCard";
import { ServiceErrorBoundary } from "../components/ServiceErrorBoundary";

export const BookService = () => {
  const { t } = useLocalization();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProviders([]);
        setProviders(data);
      } catch (err: any) {
        setError(err.message || t('services.somethingWentWrong'));
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t('services.loading')}</Typography>
        </Box>
      );
    }
    
    if (error) {
      return (
        <Typography color="error" sx={{ textAlign: 'center', p: 4 }}>
          {error}
        </Typography>
      );
    }

    if (providers.length === 0) {
      return (
        <Typography sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
          {t('services.noProvidersFound')}
        </Typography>
      );
    }

    return (
      <Grid container spacing={3}>
        {providers.map((provider) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={provider.id}>
            <ServiceProviderCard 
              provider={provider} 
              onBook={(provider) => {
                console.log('Booking service with provider:', provider);
                // TODO: Implement booking logic
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
          {t('services.providers')}
        </Typography>
        {/* Search bar and filters can go here */}

        {renderContent()}
      </Box>
    </ServiceErrorBoundary>
  );
};
