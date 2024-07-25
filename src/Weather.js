import React, { useState, useEffect } from "react";
import "./Weather.css";
import logo from "./logo.svg";

const apiKey = process.env.REACT_APP_API_KEY;

async function fetchWeatherData(city, zip) {
  let apiUrl;

  if (city) {
    apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  } else if (zip) {
    const countryCode = "in"; // Change to 'in' for India
    apiUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${zip},${countryCode}&appid=${apiKey}&units=metric`;
  } else {
    throw new Error("Please provide a city name or a ZIP code");
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("City or ZIP code not found");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("City or ZIP code not found"); // Failed to fetch weather data
  }
}

async function fetchCityFromCoordinates(lat, lon) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
  );
  if (!response.ok) {
    throw new Error("Unable to fetch city from coordinates");
  }
  const data = await response.json();
  return data.address.city || data.address.town || data.address.village;
}

const App = () => {
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    const getGeolocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const defaultCity = await fetchCityFromCoordinates(latitude, longitude);
              setCity(defaultCity);
              const data = await fetchWeatherData(defaultCity, "");
              setWeatherData(data);
            } catch (error) {
              console.error(error);
              setErrorMessage(error.message);
            }
          },
          (error) => {
            console.error("Error getting geolocation", error);
          },
          { timeout: 10000 }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };

    getGeolocation();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    setErrorMessage(null); // Clear any existing error message
    setWeatherData(null); // Clear previous weather data
    if (city.trim() !== "" || zip.trim() !== "") {
      try {
        const data = await fetchWeatherData(city, zip);
        setWeatherData(data);
        setCity("");
        setZip("");
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
      }
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", JSON.stringify(newMode));
      return newMode;
    });
  };

  const getWeatherIconName = (weatherCondition) => {
    const iconMap = {
      Clear: "wb_sunny",
      Clouds: "wb_cloudy",
      Rain: "umbrella",
      Thunderstorm: "flash_on",
      Drizzle: "grain",
      Snow: "ac_unit",
      Mist: "cloud",
      Smoke: "cloud",
      Haze: "cloud",
      Fog: "cloud",
    };
    return iconMap[weatherCondition] || "help";
  };

  const currentDate = new Date().toDateString();

  return (
    <div className={`weather-app ${darkMode ? "dark-mode" : "light-mode"}`}>
      <div className="header">
        <div className="logo-container">
          <img src={logo} alt="logo" className="logo" />
        </div>
        <div className="center-text">Weather App</div>
        <div className="mode-toggle" onClick={toggleDarkMode}>
          {darkMode ? (
            <i className="material-icons">wb_sunny</i>
          ) : (
            <i className="material-icons">nights_stay</i>
          )}
        </div>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="city-input"
          type="text"
          placeholder="Enter City Name or ZIP Code"
          value={city || zip}
          onChange={(e) => {
            const value = e.target.value;
            if (isNaN(value)) {
              setCity(value);
              setZip("");
            } else {
              setCity("");
              setZip(value);
            }
          }}
        />
        <button className="search-btn" type="submit">
          <i className="material-icons">search</i>
        </button>
      </form>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {weatherData && (
        <>
          <div className="city-date-section">
            <h2 className="city">{weatherData.name}</h2>
            <p className="date">{currentDate}</p>
          </div>

          <div className="temperature-info">
            <div className="description">
              <i className="material-icons">
                {getWeatherIconName(weatherData.weather[0].main)}
              </i>
              <span className="description-text">
                {weatherData.weather[0].description}
              </span>
            </div>
            <div className="temp">{Math.round(weatherData.main.temp)}°C</div>
          </div>

          <div className="additional-info">
            <div className="wind-info">
              <i className="material-icons">air</i>
              <div>
                <h3 className="wind-speed">{weatherData.wind.speed} km/h</h3>
                <p className="wind-label">Wind</p>
              </div>
            </div>
            <div className="humidity-info">
              <i className="material-icons">water_drop</i>
              <div>
                <h3 className="humidity">{weatherData.main.humidity}%</h3>
                <p className="humidity-label">Humidity</p>
              </div>
            </div>
            <div className="visibility-info">
              <i className="material-icons">visibility</i>
              <div>
                <h3 className="visibility-distance">
                  {(weatherData.visibility / 1000).toFixed(1)} km
                </h3>
                <p className="visibility-label">Visibility</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
