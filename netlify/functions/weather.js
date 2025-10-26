// netlify/functions/weather.js

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

exports.handler = async (event) => {
  // Get the city name AND the endpoint type from the request made by your webpage
  const { city, endpoint } = event.queryStringParameters; 
  
  if (!city || !endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing city or endpoint parameter' }),
    };
  }

  // Determine which API call to make based on the 'endpoint' parameter
  let apiPath = '';
  if (endpoint === 'weather') {
      apiPath = '/weather';
  } else if (endpoint === 'forecast') {
      apiPath = '/forecast';
  } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid endpoint specified' }),
      };
  }

  // Build the full, secure OpenWeatherMap URL using the secret key
  const url = `${BASE_URL}${apiPath}?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    // Fetch the data from OpenWeatherMap
    const response = await fetch(url);
    const data = await response.json();

    // Handle OpenWeatherMap's own error message (e.g., city not found)
    if (data.cod && data.cod !== 200) {
        return {
            statusCode: data.cod,
            body: JSON.stringify({ error: data.message || 'City not found' }),
        };
    }

    // Return the data back to your webpage
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      }
    };
  } catch (error) {
    console.error('API Fetch Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch weather data from external API' }),
    };
  }
};