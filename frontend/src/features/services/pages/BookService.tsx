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
import { getFullImageUrl } from "../../../utils/image";
import { CardMedia, CardActions, Button } from "@mui/material";

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
          <Grid xs={12} sm={6} md={4} key={p.id}>
            <Card
              sx={{ display: "flex", flexDirection: "row", height: "100%" }}
            >
              {/* Avatar / Profile Image */}
              <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
                <Avatar
                  src={getFullImageUrl(p.profile_image)}
                  alt={p.full_name}
                  sx={{ width: 80, height: 80 }}
                />
              </Box>

              {/* Content */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  p: 2,
                }}
              >
                <Typography variant="h6">{p.full_name}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {p.provider_bio || "No bio available"}
                </Typography>
                {p.provider_rating && (
                  <Rating
                    value={p.provider_rating}
                    readOnly
                    size="small"
                    sx={{ mb: 1 }}
                  />
                )}
                <Typography variant="body2">
                  Hourly Rate:{" "}
                  {p.provider_hourly_rate
                    ? `$${p.provider_hourly_rate}`
                    : "N/A"}
                </Typography>

                <Box sx={{ mt: "auto", display: "flex", gap: 1 }}>
                  <Button size="small">View Profile</Button>
                  <Button size="small" variant="contained">
                    Book Now
                  </Button>
                </Box>
              </Box>
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
