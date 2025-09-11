import { Configuration, PopupRequest } from "@azure/msal-browser"

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || ""}`,
    redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || "",
  },
  cache: {
    cacheLocation: "sessionStorage", // Use session storage for security
    storeAuthStateInCookie: false, // Set to true for IE11 or Edge
  },
}

// Add scopes for login request
export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "User.Read"],
}

// Graph API endpoint we'll use to get user profile
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
}

// Bypass authentication configuration
export const bypassConfig = {
  username: process.env.BYPASS_AUTH_USERNAME || "",
  passwordHash: process.env.BYPASS_AUTH_PASSWORD_HASH || "",
}

// Generate secure bypass credentials (run this once to generate)
export function generateBypassCredentials() {
  const crypto = require('crypto')
  
  // Generate a 64+ character secure username
  const username = `admin_${crypto.randomBytes(32).toString('hex')}`
  
  // Generate a 64+ character secure password
  const password = crypto.randomBytes(48).toString('hex')
  
  // Generate bcrypt hash
  const bcrypt = require('bcryptjs')
  const passwordHash = bcrypt.hashSync(password, 12)
  
  return {
    username,
    password,
    passwordHash,
  }
}