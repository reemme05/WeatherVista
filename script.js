// script.js - React Components with Dynamic Backgrounds
const { useState, useEffect, useCallback } = React;

// Main App Component
function WeatherApp() {
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCelsius, setIsCelsius] = useState(true);
    const [recentCities, setRecentCities] = useState([]);
    
    const PROXY_URL = '/.netlify/functions/weather';
    
    // Load recent cities from localStorage on component mount
    useEffect(() => {
        const savedCities = localStorage.getItem('recentCities');
        if (savedCities) {
            setRecentCities(JSON.parse(savedCities));
        }
        
        // Load last searched city
        const lastCity = localStorage.getItem('lastCity');
        if (lastCity) {
            fetchWeather(lastCity);
        }
        
        // Initialize weather backgrounds
        initWeatherBackgrounds();
    }, []);
    
    
    // Initialize weather background elements
    const initWeatherBackgrounds = () => {
        createRainDrops();
        createSnowflakes();
        createHeavyRain();
    };
    
    // Create rain drops for rainy background
    const createRainDrops = () => {
        const container = document.querySelector('.rain-drop-container');
        if (!container) return;
        
        container.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDelay = `${Math.random() * 5}s`;
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            container.appendChild(drop);
        }
    };
    
    // Create snowflakes for snowy background
    const createSnowflakes = () => {
        const container = document.querySelector('.snowflake-container');
        if (!container) return;
        
        container.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.width = `${3 + Math.random() * 5}px`;
            flake.style.height = flake.style.width;
            flake.style.animationDelay = `${Math.random() * 10}s`;
            flake.style.animationDuration = `${3 + Math.random() * 7}s`;
            container.appendChild(flake);
        }
    };
    
    // Create heavy rain for stormy background
    const createHeavyRain = () => {
        const container = document.querySelector('.heavy-rain-container');
        if (!container) return;
        
        container.innerHTML = '';
        for (let i = 0; i < 80; i++) {
            const drop = document.createElement('div');
            drop.className = 'heavy-rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            drop.style.animationDuration = `${0.3 + Math.random() * 0.3}s`;
            container.appendChild(drop);
        }
    };
    
    // Update background based on weather condition and time of day
    useEffect(() => {
        if (weatherData) {
            const condition = weatherData.weather[0].main.toLowerCase();
            const isDaytime = isDayTime(weatherData);
            
            // Set body class based on weather and time
            let bodyClass = condition;
            if (!isDaytime) {
                bodyClass = 'night';
            }
            
            document.body.className = bodyClass;
            
            // Reinitialize background elements when weather changes
            if (condition === 'rain' || condition === 'drizzle') {
                createRainDrops();
            } else if (condition === 'snow') {
                createSnowflakes();
            } else if (condition === 'thunderstorm') {
                createHeavyRain();
            }
        } else {
            document.body.className = '';
        }
    }, [weatherData]);
    
    // Check if it's daytime based on sunrise/sunset
    const isDayTime = (data) => {
        const now = Date.now() / 1000;
        return now > data.sys.sunrise && now < data.sys.sunset;
    };
    
    // Fetch weather data
    const fetchWeather = useCallback(async (city) => {
        if (!city.trim()) {
            setError('Please enter a city name');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const weatherProxyUrl = `${PROXY_URL}?city=${city}&endpoint=weather`;
            
            const weatherResponse = await fetch(weatherProxyUrl);
            // ----------------------------------------------------------------
            
            if (!weatherResponse.ok) {
                // If the proxy returns an error, try to read the message
                const errorData = await weatherResponse.json().catch(() => ({ error: 'City not found or server error' }));
                throw new Error(errorData.error || 'City not found or server error');
            }
            
            const weatherData = await weatherResponse.json();
            setWeatherData(weatherData);
            
            // --- SECURITY CHANGE: CALL NETLIFY PROXY FOR 5-DAY FORECAST ---
            // You will need to modify your Netlify function (weather.js) 
            // to handle both 'weather' and 'forecast' endpoints.
            const forecastProxyUrl = `${PROXY_URL}?city=${city}&endpoint=forecast`;
            
            const forecastResponse = await fetch(forecastProxyUrl);
            // ----------------------------------------------------------------
            
            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
                setForecastData(forecastData);
            }
            
            // Update recent cities
            updateRecentCities(city);
            
            // Save to localStorage
            localStorage.setItem('lastCity', city);
            
        } catch (err) {
            setError(err.message || 'Failed to fetch weather data');
            setWeatherData(null);
            setForecastData(null);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Update recent cities list
    const updateRecentCities = (city) => {
        const updatedCities = [city, ...recentCities.filter(c => c !== city)].slice(0, 5);
        setRecentCities(updatedCities);
        localStorage.setItem('recentCities', JSON.stringify(updatedCities));
    };
    
    // Toggle temperature unit
    const toggleTemperatureUnit = () => {
        setIsCelsius(!isCelsius);
    };
    
    // Convert temperature based on selected unit
    const convertTemp = (temp) => {
        return isCelsius ? Math.round(temp) : Math.round((temp * 9/5) + 32);
    };
    
    // Format date
    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    // Get day name from timestamp
    const getDayName = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short' });
    };
    
    return (
        <div className="app-container">
            <header className="app-header">
                <h1>WeatherVista</h1>
                <p>Experience weather like never before with dynamic backgrounds</p>
            </header>
            
            <SearchSection 
                onSearch={fetchWeather}
                recentCities={recentCities}
                onRecentCityClick={fetchWeather}
            />
            
            <main>
                {loading && <LoadingSpinner />}
                
                {error && <ErrorMessage message={error} />}
                
                {weatherData && !loading && (
                    <WeatherDisplay 
                        weatherData={weatherData}
                        forecastData={forecastData}
                        isCelsius={isCelsius}
                        onUnitToggle={toggleTemperatureUnit}
                        convertTemp={convertTemp}
                        formatDate={formatDate}
                        getDayName={getDayName}
                    />
                )}
            </main>
            
            <AppFooter />
        </div>
    );
}

// ... (Other React components: SearchSection, WeatherDisplay, ForecastSection, etc. remain the same) ...

// Search Component
function SearchSection({ onSearch, recentCities, onRecentCityClick }) {
    const [city, setCity] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(city);
        setCity('');
    };
    
    return (
        <section className="search-container">
            <form onSubmit={handleSubmit} className="search-box">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Enter city name (e.g., London, Tokyo, New York)..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />
                <button type="submit" className="search-button">
                    <i className="fas fa-search"></i>
                    Check Weather
                </button>
            </form>
            
            {recentCities.length > 0 && (
                <div className="recent-searches">
                    <span style={{color: 'white', marginRight: '10px'}}>Recent:</span>
                    {recentCities.map((cityName, index) => (
                        <button
                            key={index}
                            className="recent-city"
                            onClick={() => onRecentCityClick(cityName)}
                        >
                            {cityName}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}

// Weather Display Component
function WeatherDisplay({ 
    weatherData, 
    forecastData, 
    isCelsius, 
    onUnitToggle, 
    convertTemp, 
    formatDate,
    getDayName
}) {
    const { name, sys, main, weather, wind, dt } = weatherData;
    
    return (
        <section className="weather-display">
            <div className="weather-card">
                <div className="weather-header">
                    <div>
                        <h2 className="city-name">{name}, {sys.country}</h2>
                        <p className="date-time">{formatDate(dt)}</p>
                    </div>
                    <div className="unit-toggle">
                        <button 
                            className={`unit-button ${isCelsius ? 'active' : ''}`}
                            onClick={onUnitToggle}
                        >
                            °C
                        </button>
                        <button 
                            className={`unit-button ${!isCelsius ? 'active' : ''}`}
                            onClick={onUnitToggle}
                        >
                            °F
                        </button>
                    </div>
                </div>
                
                <div className="weather-content">
                    <div className="weather-icon-container">
                        <img 
                            src={`https://openweathermap.org/img/wn/${weather[0].icon}@4x.png`}
                            alt={weather[0].description}
                            className="weather-icon"
                        />
                    </div>
                    
                    <div className="weather-main">
                        <div className="temperature-container">
                            <span className="temperature">
                                {convertTemp(main.temp)}
                            </span>
                            <span className="unit">{isCelsius ? '°C' : '°F'}</span>
                        </div>
                        
                        <p className="weather-description">
                            {weather[0].description}
                        </p>
                        
                        <div className="weather-details">
                            <div className="detail-card">
                                <div className="detail-icon">
                                    <i className="fas fa-temperature-low"></i>
                                </div>
                                <div className="detail-value">
                                    {convertTemp(main.feels_like)}°
                                </div>
                                <div className="detail-label">Feels Like</div>
                            </div>
                            
                            <div className="detail-card">
                                <div className="detail-icon">
                                    <i className="fas fa-tint"></i>
                                </div>
                                <div className="detail-value">
                                    {main.humidity}%
                                </div>
                                <div className="detail-label">Humidity</div>
                            </div>
                            
                            <div className="detail-card">
                                <div className="detail-icon">
                                    <i className="fas fa-wind"></i>
                                </div>
                                <div className="detail-value">
                                    {wind.speed} m/s
                                </div>
                                <div className="detail-label">Wind Speed</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {forecastData && <ForecastSection 
                forecastData={forecastData}
                isCelsius={isCelsius}
                convertTemp={convertTemp}
                getDayName={getDayName}
            />}
        </section>
    );
}

// Forecast Component
function ForecastSection({ forecastData, isCelsius, convertTemp, getDayName }) {
    // Group forecast by day and get one reading per day
    const dailyForecasts = forecastData.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!acc[date]) {
            acc[date] = item;
        }
        return acc;
    }, {});
    
    const forecastList = Object.values(dailyForecasts).slice(0, 5);
    
    return (
        <div className="forecast-container">
            <h3 className="forecast-title">5-Day Forecast</h3>
            <div className="forecast-cards">
                {forecastList.map((day, index) => (
                    <div key={index} className="forecast-card">
                        <div className="forecast-day">
                            {index === 0 ? 'Today' : getDayName(day.dt)}
                        </div>
                        <img 
                            src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                            alt={day.weather[0].description}
                            className="forecast-icon"
                        />
                        <div className="forecast-temp">
                            {convertTemp(day.main.temp_max)}° / {convertTemp(day.main.temp_min)}°
                        </div>
                        <div className="forecast-desc">
                            {day.weather[0].main}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Loading Spinner Component
function LoadingSpinner() {
    return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Fetching weather data...</p>
        </div>
    );
}

// Error Message Component
function ErrorMessage({ message }) {
    return (
        <div className="error-container">
            <div className="error-icon">
                <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="error-title">Oops! Something went wrong</h3>
            <p className="error-message">{message}</p>
        </div>
    );
}

// Footer Component
function AppFooter() {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-links">
                    <a href="https://github.com/reemme05" target="_blank" className="footer-link">
                        <i className="fab fa-github"></i>
                        GitHub
                    </a>
                    <a href="https://openweathermap.org/api" target="_blank" className="footer-link">
                        <i className="fas fa-cloud"></i>
                        Weather API
                    </a>
                </div>
                <p className="copyright">
                    &copy; 2025 WeatherVista | Developed by <a href="https://github.com/reemme05" target="_blank" style={{color: 'white', textDecoration: 'none'}}>Reemme05</a>
                </p>
            </div>
        </footer>
    );
}

// Render the App
ReactDOM.render(<WeatherApp />, document.getElementById('root'));