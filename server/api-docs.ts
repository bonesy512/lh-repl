
type EndpointDocumentation = {
  path: string;
  method: string;
  description: string;
  requestBody?: any;
  responseBody?: any;
  requiresAuth: boolean;
};

export const apiDocumentation: EndpointDocumentation[] = [
  {
    path: "/api/auth/login",
    method: "POST",
    description: "Authenticate a user with Firebase token and create a user if they don't exist.",
    requestBody: {},
    responseBody: {
      id: "number",
      username: "string",
      email: "string",
      firebaseUid: "string",
      credits: "number"
    },
    requiresAuth: true
  },
  {
    path: "/api/user",
    method: "GET",
    description: "Get the currently authenticated user.",
    responseBody: {
      id: "number",
      username: "string",
      email: "string",
      firebaseUid: "string",
      credits: "number"
    },
    requiresAuth: true
  },
  {
    path: "/api/parcels",
    method: "GET",
    description: "Get all parcels for the authenticated user.",
    responseBody: [{
      id: "number",
      address: "string",
      latitude: "number",
      longitude: "number",
      acres: "number",
      price: "number?",
      details: "object?",
      userId: "number"
    }],
    requiresAuth: true
  },
  {
    path: "/api/parcels",
    method: "POST",
    description: "Create a new parcel for the authenticated user.",
    requestBody: {
      address: "string",
      latitude: "number",
      longitude: "number",
      acres: "number",
      price: "number?",
      details: "object?"
    },
    responseBody: {
      id: "number",
      address: "string",
      latitude: "number",
      longitude: "number",
      acres: "number",
      price: "number?",
      details: "object?",
      userId: "number"
    },
    requiresAuth: true
  },
  {
    path: "/api/analyses/:parcelId",
    method: "GET",
    description: "Get all analyses for a specific parcel.",
    responseBody: [{
      id: "number",
      parcelId: "number",
      userId: "number",
      analysis: "object",
      createdAt: "string",
      creditsUsed: "number"
    }],
    requiresAuth: true
  },
  {
    path: "/api/analyses",
    method: "POST",
    description: "Create a new analysis for a parcel, consuming user credits.",
    requestBody: {
      parcelId: "number",
      analysis: "object",
      creditsUsed: "number"
    },
    responseBody: {
      id: "number",
      parcelId: "number",
      userId: "number",
      analysis: "object",
      createdAt: "string",
      creditsUsed: "number"
    },
    requiresAuth: true
  },
  {
    path: "/api/campaigns",
    method: "GET",
    description: "Get all campaigns for the authenticated user.",
    responseBody: [{
      id: "number",
      userId: "number",
      name: "string",
      parcelId: "number",
      templateData: "object",
      active: "boolean",
      createdAt: "string"
    }],
    requiresAuth: true
  },
  {
    path: "/api/campaigns",
    method: "POST",
    description: "Create a new campaign for the authenticated user.",
    requestBody: {
      name: "string",
      parcelId: "number",
      templateData: "object",
      active: "boolean"
    },
    responseBody: {
      id: "number",
      userId: "number",
      name: "string",
      parcelId: "number",
      templateData: "object",
      active: "boolean",
      createdAt: "string"
    },
    requiresAuth: true
  },
  {
    path: "/api/create-payment-intent",
    method: "POST",
    description: "Create a Stripe payment intent for purchasing tokens.",
    requestBody: {
      packageId: "string (enum: basic, pro, enterprise)"
    },
    responseBody: {
      clientSecret: "string"
    },
    requiresAuth: false
  },
  {
    path: "/api/webhook",
    method: "POST",
    description: "Stripe webhook endpoint for handling payment events.",
    requestBody: "Stripe event payload",
    responseBody: {
      received: "boolean"
    },
    requiresAuth: false
  },
  {
    path: "/api/acres-prices",
    method: "POST",
    description: "Get similar property prices based on location and acreage.",
    requestBody: {
      city: "string",
      acres: "number",
      zip_code: "string"
    },
    responseBody: {
      prices: "array"
    },
    requiresAuth: true
  }
];

export function generateApiDocsHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landhacker API Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      border-bottom: 1px solid #eaecef;
      padding-bottom: 10px;
    }
    .endpoint {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    .endpoint-header {
      display: flex;
      padding: 10px;
      background-color: #f6f8fa;
      border-bottom: 1px solid #ddd;
    }
    .endpoint-method {
      font-weight: bold;
      margin-right: 10px;
      min-width: 60px;
    }
    .method-get { color: #0076FF; }
    .method-post { color: #4CAF50; }
    .method-put { color: #FB8C00; }
    .method-delete { color: #F44336; }
    .endpoint-path {
      font-family: monospace;
      font-size: 14px;
    }
    .endpoint-body {
      padding: 15px;
    }
    .auth-required {
      background-color: #FFF8E1;
      padding: 5px 10px;
      border-radius: 4px;
      display: inline-block;
      font-size: 12px;
      color: #F57C00;
      margin-left: 10px;
    }
    pre {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 10px;
      overflow: auto;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 14px;
    }
    .section-title {
      font-weight: 600;
      margin-top: 15px;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <h1>Landhacker API Documentation</h1>
  
  ${apiDocumentation.map(endpoint => `
    <div class="endpoint">
      <div class="endpoint-header">
        <div class="endpoint-method method-${endpoint.method.toLowerCase()}">${endpoint.method}</div>
        <div class="endpoint-path">${endpoint.path}</div>
        ${endpoint.requiresAuth ? '<div class="auth-required">Auth Required</div>' : ''}
      </div>
      <div class="endpoint-body">
        <p>${endpoint.description}</p>
        
        ${endpoint.requestBody ? `
          <div class="section-title">Request Body:</div>
          <pre><code>${JSON.stringify(endpoint.requestBody, null, 2)}</code></pre>
        ` : ''}
        
        ${endpoint.responseBody ? `
          <div class="section-title">Response Body:</div>
          <pre><code>${JSON.stringify(endpoint.responseBody, null, 2)}</code></pre>
        ` : ''}
      </div>
    </div>
  `).join('')}
</body>
</html>
  `;
}
