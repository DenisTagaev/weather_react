import React, { useState, useEffect } from "react";
import axios from "axios";
import env from "react-dotenv";

const Weather = () => {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [key, setKey] = useState('');

  const source = "https://api.openweathermap.org/";

  useEffect(() => {
    const newKey = `${city.toLowerCase()}&${country.toLowerCase()}`;
    setKey(newKey);
  },[city, country]);


  const getCityCoordinates = async () => {
    const geoUrl = `${source}geo/1.0/direct?q=${city},${country}&limit=1&appid=${env.API_KEY}`;
    const response = await axios.get(geoUrl);
    const { lat, lon } = response.data[0];
    return [lat, lon];
  };

  const getWeatherByCoordinates = async (coordinates) => {
    // console.log('API CALLED'); uncomment to check whether the API is called when the weather is already fetched
    const weatherUrl = `${source}data/2.5/weather?lat=${coordinates[0]}&lon=${coordinates[1]}&units=metric&appid=${env.API_KEY}`;
    const weatherResponse = await axios.get(weatherUrl);
    return weatherResponse.data;
  }

  const getCachedWeather = () => {
    const cachedData = sessionStorage.getItem(`weatherin${key}`);
    return cachedData ? cachedData : null;
  };

  const setCachedWeather = (data) => {
    sessionStorage.setItem(`weatherin${key}`, JSON.stringify(data));
    setWeatherData(data);
  };

  const getWeatherData = async () => {
    
    if (getCachedWeather()) {
      setWeatherData(JSON.parse(getCachedWeather()));
    } else {
      try {
        const coordinates = await getCityCoordinates();
        const weather = await getWeatherByCoordinates(coordinates);

        setCachedWeather(weather);
        setError(null);
      } catch (error) {
        setWeatherData(null);
        setError("Error fetching weather data. Please try again later.");
      }
    }
  };

  const handleSubmitWeatherForm = (e) => {
    e.preventDefault();

    if(city&&country) {
      getWeatherData();
    }
  };

  return (
    <div className="form-container">
      <div className="flex w-3/4 min-h-full rounded-2xl shadow-lg m-auto bg-slate-200">
        <form
          className="flex flex-col w-full space-y-5"
          onSubmit={handleSubmitWeatherForm}
        >
          <label className="flex flex-col items-center">
            <span className="mr-2">City:</span>
            <input
              type="text"
              minLength='2'
              className="relative rounded-xl py-2 px-2 w-1/2 bg-slate-300 bg-opacity-60 text-white placeholder-teal-400"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="flex flex-col items-center">
            <span className="mr-2">Country:</span>
            <input
              type="text"
              maxLength="2"
              className="relative rounded-xl py-2 px-2 w-1/2 bg-slate-300 bg-opacity-60 text-white placeholder-teal-400"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-600 text-white rounded px-4 py-2"
          >
            Get Weather
          </button>
        </form>
      </div>
      {error && <p>{error}</p>}
      {weatherData && (
        <div className="text-white">
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
