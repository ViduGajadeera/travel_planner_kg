import { Box, Typography, Container, Grid } from "@mui/material";
import travelImage from "../assets/home_img.png";
import WeatherCard from "../components/WeatherCard";
import { useState, useEffect } from "react";
import axios from "axios";

// Animated counter is now inside WeatherCard
export default function Dashboard() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
          const res = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
            params: {
              lat: latitude,
              lon: longitude,
              appid: API_KEY,
              units: "metric",
            },
          });

          const data = res.data;
          setWeather({
            location: data.name,
            degree: Math.round(data.main.temp),
            description: data.weather[0].description,
          });
        } catch (err) {
          console.error("Weather fetch error:", err);
          setError("Failed to fetch weather");
        }
      },
      () => setError("Please allow location access")
    );
  }, []);

  return (
    <Box>
      <Container maxWidth="lg">
        <Box sx={{ py: 6 }}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Welcome to Travel Dashboard
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={4}>
            Explore smart travel recommendations and track your recent visits!
          </Typography>

          <Grid container spacing={4} alignItems="center">
            {/* Travel Image */}
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  width: "100%",
                  height: 350,
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: 4,
                  marginRight: 8,
                }}
              >
                <Box
                  component="img"
                  src={travelImage}
                  alt="Travel"
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            </Grid>

            {/* Weather Card */}
           <Grid item xs={12} md={5} sx={{ ml: 15 }}>
              {(weather || error) && (
                <WeatherCard
                  weather={weather || { location: "", degree: 0, description: error }}
                  forecastImages={[
                    { url: "https://openweathermap.org/img/wn/01d.png", alt: "sunny" },
                    { url: "https://openweathermap.org/img/wn/02d.png", alt: "partly cloudy" },
                    { url: "https://openweathermap.org/img/wn/03d.png", alt: "cloudy" },
                    { url: "https://openweathermap.org/img/wn/09d.png", alt: "rainy" },
                  ]}
                />
              )}
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}