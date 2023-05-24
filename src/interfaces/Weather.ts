export default interface IWeather {
  name: string;
  sys: {
    country: string;
  };
  weather: {
    main: string;
  }[];
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
}