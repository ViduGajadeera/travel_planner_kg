import { Card, CardContent, Typography, Box, Stack } from "@mui/material";
import { useState, useEffect } from "react";

// Animated counter for temperature
const countUp = (start, end, duration, setValue) => {
  let current = start;
  const increment = (end - start) / (duration / 16); // ~60fps
  const step = () => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      setValue(end);
    } else {
      setValue(Math.round(current));
      requestAnimationFrame(step);
    }
  };
  step();
};

export default function WeatherCard({ weather, forecastImages = [] }) {
  const [temp, setTemp] = useState(0);

  useEffect(() => {
    if (weather?.degree != null) {
      countUp(0, weather.degree, 1200, setTemp);
    }
  }, [weather]);

  return (
    <Card
      sx={{
        width: "250%",
        maxWidth: 600,
        borderRadius: 5,
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 4, sm: 5, md: 6 },
        backdropFilter: "blur(25px)",
        background: "linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))",
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        transition: "transform 0.4s ease, box-shadow 0.4s ease",
        "&:hover": {
          transform: "translateY(-8px) scale(1.02)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
        },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        leftmargin: 50,
      }}
    >
      <CardContent sx={{ textAlign: "center" }}>
        {/* Forecast Strip */}
        {forecastImages.length > 0 && (
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
            {forecastImages.map((img, index) => (
              <Box
                key={index}
                component="img"
                src={img.url}
                alt={img.alt || "forecast"}
                sx={{
                  width: { xs: 30, sm: 40, md: 50 },
                  height: { xs: 30, sm: 40, md: 50 },
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.2)" },
                }}
              />
            ))}
          </Stack>
        )}

        {/* Location */}
        <Typography variant="h6" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
          {weather?.location || "Loading..."}
        </Typography>

        {/* Temperature */}
        <Typography variant="h2" fontWeight={700} sx={{ mt: 1, color: "primary.main" }}>
          {temp}°C
        </Typography>

        {/* Weather Description */}
        <Typography
          variant="subtitle1"
          sx={{ mt: 2, textTransform: "capitalize", color: "#555" }}
        >
          {weather?.description || ""}
        </Typography>
      </CardContent>
    </Card>
  );
}