import { useState } from "react";
import axios from "axios";

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = "u001";

  const getLocationAndRecommend = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const res = await axios.post(
            `http://localhost:5000/api/recommend/${userId}`,
            { latitude, longitude }
          );

          setRecommendations(res.data.recommendations);
        } catch (error) {
          console.error(error);
          alert("Failed to fetch recommendations");
        }

        setLoading(false);
      },
      () => {
        alert("Please allow location access");
        setLoading(false);
      }
    );
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>🌍 AI Travel Recommendation System</h1>

      <button onClick={getLocationAndRecommend}>
        Get Smart Recommendations
      </button>

      {loading && <p>Finding best places near you...</p>}

      <div style={{ marginTop: "30px" }}>
        {recommendations.map((place, index) => (
          <div
  key={index}
  style={{
    border: "1px solid #ddd",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "8px",
  }}>
    <h3>{place.attraction}</h3>
    <p>Category: {place.category}</p>
    <p>Distance: {place.traffic?.distanceKm || place.distanceKm} km</p>
    <p>Weather: {place.weather}</p>
    <p>
     Traffic Status: {place.traffic?.trafficStatus || "Unknown"} <br />
     Traffic Delay: {place.traffic?.trafficDelayMinutes || 0} mins
    </p>
  </div>
        ))}
      </div>
    </div>
  );
}

export default App;