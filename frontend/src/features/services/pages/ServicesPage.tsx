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
} from "@mui/material";
import { getServices, Service } from "../servicesApi";

export const ServicesPage = () => {
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
        setError(err.message || "Something went wrong");
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Services
      </Typography>

      <Tabs value={tab} onChange={handleChange}>
        <Tab label="Active / Upcoming" />
        <Tab label="History / Completed" />
      </Tabs>

      <Paper sx={{ mt: 2, p: 2 }}>
        <List>
          {services.map((service) => (
            <ListItem key={service.id}>
              <ListItemText
                primary={`${service.serviceType} for ${service.petName}`}
                secondary={`From ${service.start_datetime} to ${service.end_datetime}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};
