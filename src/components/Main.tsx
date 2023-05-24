import React, { useState, useEffect, FC, FormEvent } from "react";
import axios, { AxiosResponse } from "axios";
import IWeather from "../interfaces/Weather";
import env from "react-dotenv";

const Weather: FC = () => {

  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [weatherData, setWeatherData] = useState<IWeather | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState('');

  const source: string = "https://api.openweathermap.org/";
  const cacheName: string = "weather-cache";

  useEffect((): void => {
    const newKey: string = `${city.toLowerCase()}&${country.toLowerCase()}`;
    setKey(newKey);
  },[city, country]);

  useEffect((): () => void => {
    const clearCache = () => {
      caches.delete(cacheName);
    };

    window.addEventListener("beforeunload", clearCache);

    return () => {
      window.removeEventListener("beforeunload", clearCache);
    };
  }, []);

  useEffect((): void => {
    // Get user's current location
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async(position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            const currentLocationWeather: IWeather | null = await getWeatherByCoordinates([latitude, longitude]);
            setWeatherData(currentLocationWeather);
          },
          (error: GeolocationPositionError) => {
            console.error(error);
            setError(
              "Error retrieving current location. Please enter a city and country."
            );
          }
        );
      } else {
        setError(
          "Geolocation is turned off or is not supported by your browser. Please enter a city and country."
        );
      }
    };

    getCurrentLocation();
  }, []);

  const getCityCoordinates = async (): Promise<[number, number]> => {
    const geoUrl: string = `${source}geo/1.0/direct?q=${city},${country}&limit=1&appid=${env.API_KEY}`;
    const response: AxiosResponse = await axios.get(geoUrl);
    const { lat, lon }: { lat: number, lon: number }  = response.data[0];
    return [lat, lon];
  };

  const getWeatherByCoordinates = async (coordinates: number[]): Promise<IWeather> => {
    // console.log('API CALLED'); /*uncomment to check whether the API is called when the weather is already fetched*/
    const weatherUrl: string = `${source}data/2.5/weather?lat=${coordinates[0]}&lon=${coordinates[1]}&units=metric&appid=${env.API_KEY}`;
    const weatherResponse: AxiosResponse = await axios.get(weatherUrl);
    return weatherResponse.data;
  };

  const checkCacheExpiration = async(data: Response): Promise<boolean> => {
    const cacheTime: Date = new Date(data.headers.get("date") as string);
    const currentTime: Date = new Date();

    return currentTime.getTime() - cacheTime.getTime() < 300000;
  };

  const getCachedWeather = async(): Promise<IWeather | null> => {
    // const cachedData = sessionStorage.getItem(`weatherin${key}`);
    // return cachedData ? cachedData : null;
    const cache: Cache = await caches.open(cacheName);
    const matchedResponse: Response | undefined = await cache.match(key);

    if(matchedResponse && await checkCacheExpiration(matchedResponse)) {
      const cachedWeather: Promise<IWeather> = await matchedResponse.json();
      return cachedWeather;
    } else return null;
  };

  const setCachedWeather = async(data: IWeather): Promise<void> => {
    // sessionStorage.setItem(`weatherin${key}`, JSON.stringify(data));
    // setWeatherData(data);
    const cache: Cache = await caches.open(cacheName);
    const newWeatherData: Response = new Response(JSON.stringify(data));
    await cache.put(key, newWeatherData);
  };

  const getWeatherData = async (): Promise<void> => {
    const cachedData: IWeather | null = await getCachedWeather();
    
    if(cachedData) {
      setWeatherData(cachedData);
      setError(null);
      return;
      // setWeatherData(JSON.parse(getCachedWeather()));
    } else {
      try {
        const coordinates: number[] = await getCityCoordinates();
        const weather: IWeather | null = await getWeatherByCoordinates(coordinates);
        setWeatherData(weather);
        
        weather && await setCachedWeather(weather);
        setError(null);
      } catch (error) {
        setWeatherData(null);
        setError("Error fetching weather data. Please try again later.");
      }
    }
  };

  const handleSubmitWeatherForm = (e: FormEvent<HTMLFormElement>) => {
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
              minLength={2}
              className="relative rounded-xl py-2 px-2 w-1/2 bg-slate-300 bg-opacity-60 text-white placeholder-teal-400"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="flex flex-col items-center">
            <span className="mr-2">Country:</span>
            <input
              type="text"
              maxLength={2}
              className="relative rounded-xl py-2 px-2 w-1/2 bg-slate-300 bg-opacity-60 text-white placeholder-teal-400"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={!city || !country}
            className="enabled:bg-teal-500 disabled:opacity-75 enabled:hover:bg-teal-600 enabled:text-white rounded px-4 py-2"
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
