const axios = require('axios');
const { flowTemplates } = require('./flowTemplates');

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';

// Slack webhook configuration
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Send notification to Slack
async function sendSlackNotification(email, accountName, flows, successCount) {
    if (!SLACK_WEBHOOK_URL) {
        console.log('Slack webhook URL not configured');
        return;
    }

    try {
        const flowNames = flows.map(f =>
            flowTemplates[f] ? flowTemplates[f].name : f
        ).join(', ');

        const message = {
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Klaviyo Flow Builder Used*`
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*User:*\n${email}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Account:*\n${accountName || 'Unknown'}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Flows Deployed:*\n${successCount} of ${flows.length}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Selected Flows:*\n${flowNames}`
                        }
                    ]
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `Used at ${new Date().toISOString()}`
                        }
                    ]
                }
            ]
        };

        await axios.post(SLACK_WEBHOOK_URL, message);
        console.log('Slack notification sent successfully');
    } catch (error) {
        console.error('Error sending Slack notification:', error.message);
        // Don't fail the main request if Slack notification fails
    }
}

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
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { apiKey } = body;
    const path = event.rawPath || event.path;

    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'API key is required' })
      };
    }

    if (path === '/connect') {
      const accountData = await makeKlaviyoRequest(apiKey, 'GET', '/accounts/');
      const attributes = accountData.data[0].attributes;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          account: attributes,
          senderEmail: attributes.contact_information?.default_sender_email,
          senderName: attributes.contact_information?.default_sender_name
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
      const { templateId, customName, email } = body;

      if (!templateId || !flowTemplates[templateId]) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid template ID' })
        };
      }

      // Fetch account info to get sender details
      const accountData = await makeKlaviyoRequest(apiKey, 'GET', '/accounts/');
      const contactInfo = accountData.data[0].attributes.contact_information;
      const senderEmail = contactInfo?.default_sender_email;
      const senderLabel = contactInfo?.default_sender_name;

      if (!senderEmail || !senderLabel) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Account is missing default sender email or name. Please configure these in Klaviyo settings.' })
        };
      }

      const metricsData = await makeKlaviyoRequest(apiKey, 'GET', '/metrics/');
      const metricMap = {};
      metricsData.data.forEach(metric => {
        metricMap[metric.attributes.name] = metric.id;
      });

      const template = flowTemplates[templateId];
      const senderInfo = { email: senderEmail, label: senderLabel };
      const flowPayload = template.process(customName, metricMap, senderInfo);

      const newFlow = await makeKlaviyoRequest(apiKey, 'POST', '/flows/', flowPayload);

      // Use account data we already fetched for Slack notification
      const accountName = contactInfo?.organization_name || senderLabel || 'Unknown';

      // Send Slack notification (single flow deployment)
      await sendSlackNotification(
        email || 'unknown@user.com',
        accountName,
        [templateId],
        1
      );

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