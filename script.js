const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherContainer = document.getElementById('weatherContainer');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');

// Weather display elements
const cityName = document.getElementById('cityName');
const dateTime = document.getElementById('dateTime');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const description = document.getElementById('description');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const uvIndex = document.getElementById('uvIndex');
const uvLevel = document.getElementById('uvLevel');
const uvBar = document.getElementById('uvBar');
const uvBarFill = document.getElementById('uvBarFill');
const uvRecommendation = document.getElementById('uvRecommendation');
const hourlySection = document.getElementById('hourlySection');
const hourlyTitle = document.getElementById('hourlyTitle');
const hourlyContainer = document.getElementById('hourlyContainer');
const closeHourly = document.getElementById('closeHourly');
const forecastContainer = document.getElementById('forecastContainer');

// Store weather data globally
let globalWeatherData = null;

// WMO Weather Code descriptions
const weatherCodeDescriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
};

// UV Index levels and recommendations
const uvIndexInfo = {
    low: { min: 0, max: 2, level: 'Low', color: '#4caf50', recommendation: '☀️ No protection required. You can safely stay outdoors.' },
    moderate: { min: 3, max: 5, level: 'Moderate', color: '#ffc107', recommendation: '🧴 Wear SPF 30+ sunscreen. Reapply every 2 hours.' },
    high: { min: 6, max: 7, level: 'High', color: '#ff9800', recommendation: '🎩 Wear sunscreen SPF 30+, hat, and sunglasses. Limit sun exposure.' },
    veryHigh: { min: 8, max: 10, level: 'Very High', color: '#ff5722', recommendation: '⚠️ Seek shade during 10 AM - 4 PM. Wear protective clothing.' },
    extreme: { min: 11, max: 100, level: 'Extreme', color: '#8b0000', recommendation: '🚫 Avoid sun exposure. Stay indoors during peak hours.' }
};

// Get UV Index information
function getUVIndexInfo(index) {
    index = Math.round(index * 10) / 10;
    
    if (index <= uvIndexInfo.low.max) return { ...uvIndexInfo.low, value: index };
    if (index <= uvIndexInfo.moderate.max) return { ...uvIndexInfo.moderate, value: index };
    if (index <= uvIndexInfo.high.max) return { ...uvIndexInfo.high, value: index };
    if (index <= uvIndexInfo.veryHigh.max) return { ...uvIndexInfo.veryHigh, value: index };
    return { ...uvIndexInfo.extreme, value: index };
}

// Calculate UV Bar percentage
function getUVBarPercentage(index) {
    // Scale 0-11 to 0-100%
    return Math.min((index / 11) * 100, 100);
}

// Map WMO codes to weather emojis
function getWeatherIcon(weatherCode) {
    if (weatherCode === 0) return '☀️';
    if (weatherCode === 1 || weatherCode === 2) return '⛅';
    if (weatherCode === 3) return '☁️';
    if (weatherCode === 45 || weatherCode === 48) return '🌫️';
    if (weatherCode >= 51 && weatherCode <= 55) return '🌧️';
    if (weatherCode >= 61 && weatherCode <= 65) return '🌧️';
    if (weatherCode >= 71 && weatherCode <= 77) return '❄️';
    if (weatherCode >= 80 && weatherCode <= 82) return '⛈️';
    if (weatherCode >= 85 && weatherCode <= 86) return '❄️';
    if (weatherCode >= 95 && weatherCode <= 99) return '⛈️';
    return '🌤️';
}

// Geocode city name to coordinates
async function getCoordinates(city) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error('City not found');
        }

        const result = data.results[0];
        return {
            latitude: result.latitude,
            longitude: result.longitude,
            name: result.name,
            country: result.country
        };
    } catch (error) {
        throw new Error('Failed to find city coordinates');
    }
}

// Fetch weather data including hourly forecast
async function fetchWeather(latitude, longitude, cityInfo) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility,uv_index&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const data = await response.json();
        return { ...data, cityInfo };
    } catch (error) {
        throw new Error('Failed to fetch weather data');
    }
}

// Display current weather
function displayCurrentWeather(data) {
    const current = data.current;
    const cityInfo = data.cityInfo;

    // Update city name
    cityName.textContent = `${cityInfo.name}, ${cityInfo.country}`;

    // Update date and time
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    dateTime.textContent = now.toLocaleDateString('en-US', options);

    // Update temperature and weather
    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    const weatherDesc = weatherCodeDescriptions[current.weather_code] || 'Unknown';
    description.textContent = weatherDesc;
    
    // Set emoji icon
    weatherIcon.textContent = getWeatherIcon(current.weather_code);

    // Update details
    feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
    visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    
    // Update UV Index with styling
    const uvInfo = getUVIndexInfo(current.uv_index);
    uvIndex.textContent = uvInfo.value;
    uvLevel.textContent = uvInfo.level;
    uvRecommendation.textContent = uvInfo.recommendation;
    
    // Update UV Bar
    const uvPercentage = getUVBarPercentage(uvInfo.value);
    uvBarFill.style.width = uvPercentage + '%';
}

// Display hourly forecast for a specific day
function displayHourlyForDay(dayIndex) {
    const hourly = globalWeatherData.hourly;
    const daily = globalWeatherData.daily;
    
    // Get the day
    const dayDate = new Date(daily.time[dayIndex]);
    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    hourlyTitle.textContent = `Hourly Forecast - ${dayName}`;
    hourlyContainer.innerHTML = '';

    // Calculate start and end hour indices for the day
    const startOfDay = new Date(dayDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dayDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all hourly data for this day
    for (let i = 0; i < hourly.time.length; i++) {
        const hourTime = new Date(hourly.time[i]);
        
        if (hourTime >= startOfDay && hourTime <= endOfDay) {
            const hourString = hourTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });

            const temp = Math.round(hourly.temperature_2m[i]);
            const weatherCode = hourly.weather_code[i];
            const rainProb = hourly.precipitation_probability[i];
            const windSpd = Math.round(hourly.wind_speed_10m[i]);

            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            hourlyItem.innerHTML = `
                <span class="hourly-time">${hourString}</span>
                <span class="hourly-icon">${getWeatherIcon(weatherCode)}</span>
                <span class="hourly-temp">${temp}°C</span>
                <span class="hourly-condition">${weatherCodeDescriptions[weatherCode]}</span>
                <span class="hourly-rain">💧 ${rainProb}%</span>
                <span class="hourly-wind">💨 ${windSpd}km/h</span>
            `;
            hourlyContainer.appendChild(hourlyItem);
        }
    }

    // Show the hourly section
    hourlySection.style.display = 'block';
    hourlySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Display 7-day forecast
function displayForecast(data) {
    const daily = data.daily;
    forecastContainer.innerHTML = '';

    // Display 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const fullDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const weatherCode = daily.weather_code[i];
        const weatherDesc = weatherCodeDescriptions[weatherCode] || 'Unknown';

        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.setAttribute('data-day-index', i);
        forecastItem.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <div class="forecast-date-full">${fullDate}</div>
            <div class="forecast-icon">${getWeatherIcon(weatherCode)}</div>
            <div class="forecast-temp">
                <span class="forecast-high">${maxTemp}°</span> / <span class="forecast-low">${minTemp}°</span>
            </div>
            <div class="forecast-condition">${weatherDesc}</div>
        `;

        // Add click event to show hourly forecast
        forecastItem.addEventListener('click', () => {
            // Remove active class from all forecast items
            document.querySelectorAll('.forecast-item').forEach(item => {
                item.classList.remove('active');
            });
            // Add active class to clicked item
            forecastItem.classList.add('active');
            // Display hourly forecast for this day
            displayHourlyForDay(i);
        });

        forecastContainer.appendChild(forecastItem);
    }
}

// Main search function
async function searchWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading(true);
    hideError();

    try {
        // Get coordinates
        const cityInfo = await getCoordinates(city);

        // Fetch weather
        const weatherData = await fetchWeather(cityInfo.latitude, cityInfo.longitude, cityInfo);

        // Store data globally
        globalWeatherData = weatherData;

        // Display weather
        displayCurrentWeather(weatherData);
        displayForecast(weatherData);
        hourlySection.style.display = 'none'; // Hide hourly section initially
        showWeatherContainer(true);
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showError(error.message);
        showWeatherContainer(false);
    }
}

// Helper functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showLoading(show) {
    loadingSpinner.classList.toggle('hidden', !show);
}

function showWeatherContainer(show) {
    weatherContainer.classList.toggle('show', show);
}

// Event listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

closeHourly.addEventListener('click', () => {
    hourlySection.style.display = 'none';
    // Remove active class from all forecast items
    document.querySelectorAll('.forecast-item').forEach(item => {
        item.classList.remove('active');
    });
});

// Load default city on page load
window.addEventListener('load', () => {
    cityInput.value = 'London';
    searchWeather();
});