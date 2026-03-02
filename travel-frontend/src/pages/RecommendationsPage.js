import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Stack,
  Divider,
  Container
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DirectionsIcon from "@mui/icons-material/Directions";
import CategoryIcon from "@mui/icons-material/Category";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import TrafficIcon from "@mui/icons-material/Traffic";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import { useAuth } from "../context/AuthContext";
import axios from "axios";


export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const userId = user?.userId;

  const fetchRecommendations = async () => {
    if (!navigator.geolocation) {
      setNotification({
        open: true,
        message: "Geolocation not supported",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await axios.post(
            `http://localhost:5000/api/recommend/${userId}`,
            { latitude, longitude }
          );

          const sortedRecommendations = res.data.recommendations.sort(
  (a, b) => Number(a.distanceKm) - Number(b.distanceKm)
);

setRecommendations(sortedRecommendations);
        } catch (err) {
          setNotification({
            open: true,
            message: "Failed to fetch recommendations",
            severity: "error",
          });
        }

        setLoading(false);
      },
      () => {
        setNotification({
          open: true,
          message: "Please allow location access",
          severity: "warning",
        });
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line
  }, []);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Smart Travelling Recommendations
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={4}>
          Personalized destinations based on your preferences, weather and traffic conditions.
        </Typography>

        {loading && <Loader />}

        {/* 3x3 Matrix Layout */}
        <Grid
          container
          spacing={7}
          justifyContent="center"
        >
          {recommendations.map((place, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}   // 3 per row
              key={index}
              sx={{ display: "flex" }}
            >
              <Card
                sx={{
                  width: "100%",
                  height: 380,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Attraction Name - max 2 lines */}
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: 56,
                      mb: 2,
                    }}
                  >
                    {place.attraction}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CategoryIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {place.category}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationOnIcon fontSize="small" color="error" />
                      <Typography variant="body2">
                        {place.city}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <WbSunnyIcon fontSize="small" color="warning" />
                      <Typography variant="body2">
                        {place.weather}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <TrafficIcon fontSize="small" color="info" />
                      <Typography variant="body2">
                        {place.traffic?.trafficStatus || "Normal Traffic"}
                      </Typography>
                    </Stack>

                    <Chip
                      icon={<DirectionsIcon />}
                      label={`${Number(place.distanceKm).toFixed(1)} km away`}
                      color="secondary"
                      sx={{ mt: 1, width: "fit-content" }}
                    />
                  </Stack>
                </CardContent>

                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<DirectionsIcon />}
                    sx={{ borderRadius: 2 }}
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`,
                        "_blank"
                      )
                    }
                  >
                    Navigate
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Notification
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onClose={() =>
            setNotification({ ...notification, open: false })
          }
        />
      </Box>
    </Container>
  );
}