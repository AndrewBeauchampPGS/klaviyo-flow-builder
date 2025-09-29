const axios = require('axios');
const { flowTemplates } = require('./flowTemplates');

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';

const makeKlaviyoRequest = async (apiKey, method, endpoint, data = null) => {
  const config = {
    method,
    url: `${KLAVIYO_API_BASE}${endpoint}`,
    headers: {
      'Authorization': `Klaviyo-API-Key ${apiKey}`,
      'revision': '2025-07-15',
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  const response = await axios(config);
  return response.data;
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const { apiKey } = body;
    const path = event.path;

    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'API key is required' })
      };
    }

    if (path === '/connect') {
      const accountData = await makeKlaviyoRequest(apiKey, 'GET', '/accounts/');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          account: accountData.data[0].attributes
        })
      };
    }

    if (path === '/templates') {
      const templates = Object.keys(flowTemplates).map(key => ({
        id: key,
        name: flowTemplates[key].name,
        description: flowTemplates[key].description,
        available: true
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ templates })
      };
    }

    if (path === '/deploy') {
      const { templateId, customName } = body;

      if (!templateId || !flowTemplates[templateId]) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid template ID' })
        };
      }

      const metricsData = await makeKlaviyoRequest(apiKey, 'GET', '/metrics/');
      const metricMap = {};
      metricsData.data.forEach(metric => {
        metricMap[metric.attributes.name] = metric.id;
      });

      const template = flowTemplates[templateId];
      const flowPayload = template.process(customName, metricMap);

      const newFlow = await makeKlaviyoRequest(apiKey, 'POST', '/flows/', flowPayload);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          flow: newFlow.data
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.response?.data?.errors?.[0]?.detail || error.message
      })
    };
  }
};