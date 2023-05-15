import React, { useState } from "react";
import axios from "axios";
import env from "react-dotenv";

const Weather = () => {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
    console.log(env.API_KEY);
    
    const getWeatherData = async () => {
        try{
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city},${country}&limit=1&appid=${env.API_KEY}`;
            const response = await axios.get(geoUrl);
            const { lat, lon } = response.data[0];
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${env.API_KEY}`;
            const weatherResponse = await axios.get(weatherUrl);
            setWeatherData(weatherResponse.data);
            setError(null);
        } catch (error) {
            setWeatherData(null);
            setError("Error fetching weather data. Please try again later.");
        }
  };

  const handleSubmitWeatherForm = (e) => {
    e.preventDefault();
    getWeatherData();
  };

  return (
    <div>
      <form onSubmit={handleSubmitWeatherForm}>
        <label>
          City:
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <label>
          Country:
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </label>
        <button type="submit">Get Weather</button>
      </form>
      {error && <p>{error}</p>}
      {weatherData && (
        <div>
          <h2>
            {weatherData.name}, {weatherData.sys.country}
          </h2>
          <h3>{weatherData.weather[0].main}</h3>
          <p>Temperature: {weatherData.main.temp} &#8451;</p>
          <p>Feels like: {weatherData.main.feels_like} &#8451;</p>
          <p>Humidity: {weatherData.main.humidity}%</p>
          <p>Wind Speed: {weatherData.wind.speed} m/s</p>
        </div>
      )}
    </div>
  );
};

export default Weather;
