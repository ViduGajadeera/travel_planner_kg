import React, { useState } from "react";
import {
  Container, TextField, Button, Typography, Box, Checkbox, FormGroup, FormControlLabel
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const categories = [
  "Adventure","Historical","Beaches","Waterfalls","Zoological Gardens","Nature",
  "Cultural","Agriculture","Beach","Water","Mountain","Wildlife","Bodies of Water",
  "Farms","Gardens","Historic Sites","Museums","National Parks"
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferences, setPreferences] = useState([]);

  const handleCheckbox = (category) => {
    setPreferences(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/users/register", {
        name, email, password, preferences
      });
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, bgcolor: "#121212", p:4, borderRadius:2, color:"#fff" }}>
      <Typography variant="h4" align="center" gutterBottom>Register</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt:2 }}>
        <TextField label="Name" fullWidth variant="filled" sx={{mb:2}} value={name} onChange={e => setName(e.target.value)} />
        <TextField label="Email" fullWidth variant="filled" sx={{mb:2}} value={email} onChange={e => setEmail(e.target.value)} />
        <TextField label="Password" type="password" fullWidth variant="filled" sx={{mb:2}} value={password} onChange={e => setPassword(e.target.value)} />
        
        <Typography variant="h6">Select Preferences</Typography>
        <FormGroup>
          {categories.map((c) => (
            <FormControlLabel
              key={c}
              control={<Checkbox checked={preferences.includes(c)} onChange={() => handleCheckbox(c)} />}
              label={c}
            />
          ))}
        </FormGroup>

        <Button type="submit" variant="contained" color="primary" sx={{mt:3}}>Register</Button>
        <Button variant="text" color="secondary" sx={{mt:2}} onClick={() => navigate("/login")}>Already have an account? Login</Button>
      </Box>
    </Container>
  );
}