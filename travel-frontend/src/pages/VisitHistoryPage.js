import { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import { useAuth } from "../context/AuthContext";
import axios from "axios";


export default function VisitHistoryPage() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });

  const userId = user?.userId;

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/visits/${userId}/recent-visits`);
      setVisits(res.data.visits);
    } catch (err) {
      console.error(err);
      setNotification({ open: true, message: "Failed to fetch visit history", severity: "error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🗓 Past 3 Months Visits
      </Typography>

      {loading && <Loader />}

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {visits.map((place, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ bgcolor: "background.paper", color: "text.primary" }}>
              <CardContent>
                <Typography variant="h6">{place.attraction}</Typography>
                <Typography>Category: {place.category}</Typography>
                <Typography>City: {place.city}</Typography>
                <Typography>Visited At: {new Date(place.visitedAt).toLocaleDateString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </Box>
  );
}