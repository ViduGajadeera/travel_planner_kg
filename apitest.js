const axios = require("axios");

//const API_KEY = "api here";

async function getWeather(city) {
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${Weather_API_KEY}&units=metric`
  );
  return res.data;
}

getWeather("Colombo").then(console.log);