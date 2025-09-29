const welcomeFlow = require('./welcome-def-2025.json');
const abandonedCartFlow = require('./abandoned-cart-def.json');
const postPurchaseFlow = require('./post-purchase-def.json');
const upsellFlow = require('./upsell-def.json');
const siteAbandonFlow = require('./site-abandon-def.json');
const customerWinbackFlow = require('./customer-winback-def.json');
const browseAbandonmentFlow = require('./browse-abandonment-def.json');
const abandonedCheckoutFlow = require('./abandoned-checkout-def.json');

function getMetricNameById(metricId, sourceAccountApiKey) {
  const sourceMetrics = {
    'RkmndL': 'Added to Cart',
    'VyebRm': 'Placed Order',
    'TKNikS': 'Checkout Started',
    'VwdbGQ': 'Ordered Product',
    'NbsVry': 'Active on Site',
    'Yw4UfG': 'Viewed Product',
    'Started Checkout': 'Started Checkout'
  };
  return sourceMetrics[metricId] || null;
}

function replaceMetricIds(obj, metricMap, sourceAccountApiKey) {
  if (Array.isArray(obj)) {
    obj.forEach(item => replaceMetricIds(item, metricMap, sourceAccountApiKey));
  } else if (obj && typeof obj === 'object') {
    if (obj.metric_id) {
      const metricName = getMetricNameById(obj.metric_id, sourceAccountApiKey);
      if (metricName && metricMap[metricName]) {
        obj.metric_id = metricMap[metricName];
      }
    }
    if (obj.type === 'metric' && obj.id) {
      const metricName = getMetricNameById(obj.id, sourceAccountApiKey);
      if (metricName && metricMap[metricName]) {
        obj.id = metricMap[metricName];
      }
    }
    Object.values(obj).forEach(value => {
      if (typeof value === 'object') {
        replaceMetricIds(value, metricMap, sourceAccountApiKey);
      }
    });
  }
}

function processFlowForDeployment(flowData, newName, metricMap) {
  const processed = JSON.parse(JSON.stringify(flowData));

  delete processed.data.id;
  delete processed.data.relationships;
  delete processed.data.links;

  delete processed.data.attributes.created;
  delete processed.data.attributes.updated;
  delete processed.data.attributes.status;
  delete processed.data.attributes.archived;
  delete processed.data.attributes.trigger_type;

  if (newName) {
    processed.data.attributes.name = newName;
  }

  if (processed.data.attributes.definition && processed.data.attributes.definition.actions) {
    processed.data.attributes.definition.actions.forEach(action => {
      action.temporary_id = action.id;
      delete action.id;
      if (action.data) {
        delete action.data.status;
      }
      if (action.data && action.data.message) {
        delete action.data.message.id;
      }
      if (action.type === 'time-delay' && action.data && action.data.unit !== 'days') {
        delete action.data.delay_until_time;
        delete action.data.delay_until_weekdays;
      }
    });
  }

  if (metricMap) {
    replaceMetricIds(processed.data.attributes.definition, metricMap);
  }

  if (processed.data.attributes.definition.triggers) {
    processed.data.attributes.definition.triggers.forEach(trigger => {
      if (trigger.type === 'list') {
        processed.data.attributes.definition.triggers = [];
        delete processed.data.attributes.definition.profile_filter;
      }
    });
  }

  return processed;
}

const flowTemplates = {
  'abandoned-cart': {
    name: 'Abandoned Cart',
    description: 'Recover abandoned carts with email reminders',
    rawDefinition: abandonedCartFlow,
    process: (newName, metricMap) => processFlowForDeployment(abandonedCartFlow, newName || 'Abandoned Cart', metricMap)
  },
  'post-purchase': {
    name: 'Post-Purchase Thank You',
    description: 'Thank customers after their first purchase',
    rawDefinition: postPurchaseFlow,
    process: (newName, metricMap) => processFlowForDeployment(postPurchaseFlow, newName || 'Post-Purchase Thank You', metricMap)
  },
  'upsell': {
    name: 'Upsell',
    description: 'Increase order value with product recommendations',
    rawDefinition: upsellFlow,
    process: (newName, metricMap) => processFlowForDeployment(upsellFlow, newName || 'Upsell', metricMap)
  },
  'site-abandon': {
    name: 'Site Abandonment',
    description: 'Re-engage visitors who left without purchasing',
    rawDefinition: siteAbandonFlow,
    process: (newName, metricMap) => processFlowForDeployment(siteAbandonFlow, newName || 'Site Abandonment', metricMap)
  },
  'customer-winback': {
    name: 'Customer Winback',
    description: 'Win back customers who haven\'t purchased recently',
    rawDefinition: customerWinbackFlow,
    process: (newName, metricMap) => processFlowForDeployment(customerWinbackFlow, newName || 'Customer Winback', metricMap)
  },
  'browse-abandonment': {
    name: 'Browse Abandonment',
    description: 'Remind customers of products they viewed',
    rawDefinition: browseAbandonmentFlow,
    process: (newName, metricMap) => processFlowForDeployment(browseAbandonmentFlow, newName || 'Browse Abandonment', metricMap)
  },
  'abandoned-checkout': {
    name: 'Abandoned Checkout',
    description: 'Recover checkouts that were started but not completed',
    rawDefinition: abandonedCheckoutFlow,
    process: (newName, metricMap) => processFlowForDeployment(abandonedCheckoutFlow, newName || 'Abandoned Checkout', metricMap)
  }
};

module.exports = { flowTemplates };