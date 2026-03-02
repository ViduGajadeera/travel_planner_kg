import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: "pointer" }} onClick={() => navigate("/")}>
          Travel Dashboard
        </Typography>
        <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
        <Button color="inherit" onClick={() => navigate("/recommendations")}>Recommendations</Button>
        <Button color="inherit" onClick={() => navigate("/visits")}>Visits</Button>
        <Button color="inherit" onClick={() => { logout(); navigate("/login"); }}>Logout</Button>
      </Toolbar>
    </AppBar>
  );
}