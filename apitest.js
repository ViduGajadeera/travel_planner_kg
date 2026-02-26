const axios = require("axios");

//const API_KEY = "9ec70c722f973996c3bdf35ac454f56a";

async function getWeather(city) {
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
  );
  return res.data;
}

getWeather("Colombo").then(console.log);