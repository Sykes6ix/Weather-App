// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const cityInput = document.getElementById('city');
  const searchButton = document.getElementById('search');
  const cityName = document.getElementById('city-name');
  const dayDate = document.getElementById('day-date');
  const currentTemperature = document.getElementById('current-temperature');
  const feelsLike = document.getElementById('feels-like');
  const humidity = document.getElementById('humidity');
  const wind = document.getElementById('wind');
  const precipitation = document.getElementById('precipitation');
  const weatherIcon = document.getElementById('weather-icon');
  const errorDiv = document.querySelector('.error-state');
  const noRes = document.getElementById('no-results');
  const weatherParent = document.getElementById('weather-parent');
  const heading = document.querySelector('.heading');
  const searchBar = document.getElementById('search-bar');
  const daySelector = document.getElementById('day-selector');

  // Units dropdown toggle
  const unitsToggle = document.getElementById('units-toggle');
  const unitsMenu = document.getElementById('units-menu');
  
  if (unitsToggle && unitsMenu) {
    unitsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      unitsMenu.classList.toggle('active');
      unitsToggle.querySelector('.dropdown-arrow').classList.toggle('rotated');
    });
    
    document.addEventListener('click', () => {
      unitsMenu.classList.remove('active');
      unitsToggle.querySelector('.dropdown-arrow')?.classList.remove('rotated');
    });
    
    unitsMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  const apiKey = "3ad89cb32fa9047bcc9dcc4004b1eb3e";
  const units = "metric";

  // Store forecast data globally for day selector
  let forecastDataGlobal = null;

  if (!weatherIcon) {
    console.error("weatherIcon element NOT FOUND!");
    console.log("All IMG IDs:", Array.from(document.querySelectorAll('img')).map(el => el.id));
  }

const icons = {
  Clear: 'assets/images/icon-sunny.webp',
  Clouds: 'assets/images/icon-overcast.webp',
  Rain: 'assets/images/icon-rain.webp',
  Snow: 'assets/images/icon-snow.webp',
  Drizzle: 'assets/images/icon-drizzle.webp',
  Thunderstorm: 'assets/images/icon-storm.webp',
  Mist: 'assets/images/icon-fog.webp',
  Fog: 'assets/images/icon-fog.webp',
};

  // Update hourly forecast based on selected day
  function updateHourlyForecast(dayIndex) {
    if (!forecastDataGlobal) return;
    
    // Each day has 8 forecast points (3-hour intervals)
    const startIndex = dayIndex * 8;
    const dayHours = forecastDataGlobal.list.slice(startIndex, startIndex + 8);
    
    dayHours.forEach((hour, i) => {
      const hourCondition = hour.weather[0].main;
      const hourIcon = document.getElementById(`hour-icon-${i}`);
      const hourTemp = document.getElementById(`hour-temp-${i}`);
      const hourTime = document.getElementById(`hour-time-${i}`);

      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true
      });

      if (hourIcon) hourIcon.src = icons[hourCondition] || 'assets/images/icon-overcast.webp';
      if (hourTemp) hourTemp.textContent = `${Math.round(hour.main.temp)}°`;
      if (hourTime) hourTime.firstChild.textContent = time + " ";
    });
  }

async function fetchWeatherData(city) {
  try {
    // current weather
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`);
    if (!weatherRes.ok) {
      if (weatherRes.status === 404) {
        // City not found - show no results message
        const noRes = document.getElementById('no-results');
        noRes.style.display = 'block';
        weatherParent.style.display = 'none';
        errorDiv.style.display = 'none';
        heading.style.display = 'flex';
        return;
      }
      throw new Error('Bad response');
    }
    const weatherData = await weatherRes.json();
    console.log('Current weatherData:',weatherData);

    // forecast (daily + hourly)
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`);
    if (!forecastRes.ok) {
      if (forecastRes.status === 404) {
        const noRes = document.getElementById('no-results');
        noRes.style.display = 'block';
        weatherParent.style.display = 'none';
        errorDiv.style.display = 'none';
        heading.style.display = 'flex';
        return;
      }
      throw new Error('Bad response');
    }
    const forecastData = await forecastRes.json();

    // show weather, hide error
    errorDiv.style.display = 'none';
    noRes.style.display = 'none';
    searchBar.style.display = 'flex';
    weatherParent.style.display = '';
    heading.style.display = 'flex';

    // city name
    cityName.textContent = weatherData.name;

    // current weather
    currentTemperature.textContent = `${Math.floor(weatherData.main.temp)}°C`;
    feelsLike.textContent = `${Math.floor(weatherData.main.feels_like)}°C`;
    humidity.textContent = `${weatherData.main.humidity}%`;
    wind.textContent = `${Math.floor(weatherData.wind.speed)} km/hr`;
    precipitation.textContent = `${weatherData.rain?.['1h'] ?? 0} mm`;

    // main weather icon
    const condition = weatherData.weather[0].main;
    const iconPath = icons[condition];
    
    if (weatherIcon) {
      if (iconPath) {
        weatherIcon.src = iconPath;
        console.log("Set weatherIcon.src to:", iconPath);
      } else {
        weatherIcon.src = 'assets/images/icon-overcast.webp';
        console.warn("No icon for condition:", condition, "- using default");
      }
    } else {
      console.error("weatherIcon is null at time of setting src");
    }

    // daily forecast
    const daily = forecastData.list.filter((_, i) => i % 8 === 0);
    daily.forEach((day, i) => {
      const dayCondition = day.weather[0].main;
      const dayIcon = document.getElementById(`icon-${i}`);
      const maxEl = document.getElementById(`max-${i}`);
      const minEl = document.getElementById(`min-${i}`);
      const dayEl = document.getElementById(`day-${i}`);

      if (dayIcon) dayIcon.src = icons[dayCondition] || 'assets/images/icon-overcast.webp';
      if (maxEl) maxEl.textContent = `${Math.round(day.main.temp_max)}°`;
      if (minEl) minEl.textContent = `${Math.round(day.main.temp_min)}°`;
      if (dayEl) dayEl.textContent = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
    });

    // Store forecast data for day selector
    forecastDataGlobal = forecastData;
    updateHourlyForecast(0);

    // Day selector event
    daySelector.addEventListener('change', (e) => {
      updateHourlyForecast(parseInt(e.target.value));
    });

  } catch (error) {
    console.error('Error fetching weather data:', error);
    errorDiv.style.display = 'flex';
    searchBar.style.display = 'none';
    weatherParent.style.display = 'none';
    heading.style.display = 'none';
  }
}
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchButton.click();
  }
});

searchButton.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherData(city);
  }
});


dayDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Retry button functionality
  const retryButton = document.getElementById('retry');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      const lastCity = cityInput.value.trim();
      if (lastCity) {
        fetchWeatherData(lastCity);
      }
    });
  }
});