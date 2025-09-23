import { useEffect, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
} from "@mui/material";
import { getServices } from "../servicesApi";
import type { Service } from "../../../types/services";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { ServiceErrorBoundary } from "../components/ServiceErrorBoundary";

export const ServicesPage = () => {
  const { t } = useLocalization();
  const [tab, setTab] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const status = tab === 0 ? "active" : "history";
        const data = await getServices(status);
        setServices(data);
      } catch (err: any) {
        setError(err.message || t('services.somethingWentWrong'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <ServiceErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('services.title')}
        </Typography>

        <Tabs value={tab} onChange={handleChange}>
          <Tab label={t('services.activeUpcoming')} />
          <Tab label={t('services.historyCompleted')} />
        </Tabs>

        <Paper sx={{ mt: 2, p: 2 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>{t('services.loading')}</Typography>
            </Box>
          )}
          
          {error && (
            <Typography color="error" sx={{ textAlign: 'center', p: 3 }}>
              {error}
            </Typography>
          )}
          
          {!loading && !error && services.length === 0 && (
            <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
              {t('services.noServicesFound')}
            </Typography>
          )}
          
          {!loading && !error && services.length > 0 && (
            <List>
              {services.map((service) => (
                <ListItem key={service.id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={t(`services.${service.service_type}`)} 
                          color="primary" 
                          size="small" 
                        />
                        <Typography variant="body1">
                          {t('services.forPet')} {service.pet_id}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('services.startDate')}: {new Date(service.start_datetime).toLocaleDateString()}
                        </Typography>
                        {service.end_datetime && (
                          <Typography variant="body2" color="text.secondary">
                            {t('services.endDate')}: {new Date(service.end_datetime).toLocaleDateString()}
                          </Typography>
                        )}
                        <Chip 
                          label={t(`services.${service.status}`)} 
                          color={service.status === 'completed' ? 'success' : service.status === 'cancelled' ? 'error' : 'default'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </ServiceErrorBoundary>
  );
};
