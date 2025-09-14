interface ZendeskConfig {
  subdomain: string
  apiToken: string
  baseUrl: string
  email?: string
  oauth?: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
}

interface ZendeskTicket {
  id: number
  subject: string
  description: string
  status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  type: 'problem' | 'incident' | 'question' | 'task'
  created_at: string
  updated_at: string
  assignee_id?: number
  requester_id: number
  tags: string[]
  custom_fields: Array<{
    id: number
    value: string | number | boolean | null
  }>
}

interface ZendeskUser {
  id: number
  name: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

export const zendeskConfig: ZendeskConfig = {
  subdomain: process.env.ZENDESK_SUBDOMAIN || '',
  apiToken: process.env.ZENDESK_API_TOKEN || '',
  email: process.env.ZENDESK_API_EMAIL || '',
  get baseUrl() {
    return `https://${this.subdomain}.zendesk.com/api/v2`
  },
  oauth: {
    clientId: process.env.ZENDESK_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.ZENDESK_OAUTH_CLIENT_SECRET || '',
    redirectUri: process.env.ZENDESK_OAUTH_REDIRECT_URI || '',
  }
}

export function getZendeskHeaders() {
  // Check for OAuth access token first
  const oauthToken = process.env.ZENDESK_OAUTH_ACCESS_TOKEN
  if (oauthToken) {
    return {
      'Authorization': `Bearer ${oauthToken}`,
      'Content-Type': 'application/json'
    }
  }

  // Fallback to API token authentication
  const { apiToken, email } = zendeskConfig
  
  if (!apiToken) {
    throw new Error('No Zendesk authentication configured. Please set up OAuth or API token.')
  }

  // Zendesk API supports both Basic auth with email/token or Bearer token
  if (email) {
    // Basic authentication: email/token:api_token
    const credentials = Buffer.from(`${email}/token:${apiToken}`).toString('base64')
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    }
  } else {
    // Bearer token authentication
    return {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  }
}

export function isZendeskConfigured(): boolean {
  return !!(zendeskConfig.subdomain && zendeskConfig.apiToken)
}

export type { ZendeskTicket, ZendeskUser, ZendeskConfig }