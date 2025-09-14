import { NextRequest, NextResponse } from 'next/server'
import { zendeskConfig } from '@/lib/zendesk-config'

export async function GET(request: NextRequest) {
  try {
    const { oauth, subdomain } = zendeskConfig
    
    if (!oauth?.clientId || !oauth?.redirectUri || !subdomain) {
      return NextResponse.json({ 
        error: 'OAuth configuration is incomplete. Please check your environment variables.' 
      }, { status: 500 })
    }

    // Generate state parameter for security (prevents CSRF attacks)
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    // Store state in session/cookie for validation later
    // For now, we'll include it in the URL and validate in callback
    
    // Build Zendesk OAuth authorization URL
    const authUrl = new URL(`https://${subdomain}.zendesk.com/oauth/authorizations/new`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', oauth.clientId)
    authUrl.searchParams.set('redirect_uri', oauth.redirectUri)
    authUrl.searchParams.set('scope', 'read write')
    authUrl.searchParams.set('state', state)

    // Redirect to Zendesk OAuth authorization page
    return NextResponse.redirect(authUrl.toString())
    
  } catch (error) {
    console.error('OAuth authorization error:', error)
    return NextResponse.json({ 
      error: 'Failed to initiate OAuth authorization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}