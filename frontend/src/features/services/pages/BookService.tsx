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
import { getProviders, Provider } from "../servicesApi";

export const BookService = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
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
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const renderContent = () => {
    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
      <Grid container spacing={2}>
        {providers.map((p) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
            <Card>
              <CardContent
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Avatar src={p.profile_image} alt={p.full_name} />
                <Box>
                  <Typography variant="h6">{p.full_name}</Typography>
                  <Typography variant="body2">{p.provider_bio}</Typography>
                  {p.provider_rating && (
                    <Rating value={p.provider_rating} readOnly size="small" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Providers
      </Typography>
      {/* Search bar and filters can go here */}

      {renderContent()}
    </Box>
  );
};
