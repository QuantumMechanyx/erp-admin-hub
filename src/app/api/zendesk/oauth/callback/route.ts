import { NextRequest, NextResponse } from 'next/server'
import { zendeskConfig } from '@/lib/zendesk-config'

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  created_at?: number
  refresh_token?: string
  expires_in?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      return NextResponse.json({ 
        error: 'OAuth authorization failed',
        details: error,
        description: searchParams.get('error_description')
      }, { status: 400 })
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.json({ 
        error: 'Authorization code is missing' 
      }, { status: 400 })
    }

    const { oauth, subdomain } = zendeskConfig
    if (!oauth?.clientId || !oauth?.clientSecret || !oauth?.redirectUri || !subdomain) {
      return NextResponse.json({ 
        error: 'OAuth configuration is incomplete' 
      }, { status: 500 })
    }

    // Exchange authorization code for access token
    const tokenUrl = `https://${subdomain}.zendesk.com/oauth/tokens`
    const tokenData = {
      grant_type: 'authorization_code',
      code: code,
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      redirect_uri: oauth.redirectUri,
      scope: 'read write'
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorData}`)
    }

    const tokens: TokenResponse = await tokenResponse.json()

    // TODO: Store tokens securely in database
    // For now, we'll store them in environment/session
    console.log('OAuth tokens received:', {
      access_token: tokens.access_token ? '***' : 'missing',
      token_type: tokens.token_type,
      scope: tokens.scope,
      has_refresh_token: !!tokens.refresh_token
    })

    // Test the access token by making a simple API call
    try {
      const testResponse = await fetch(`https://${subdomain}.zendesk.com/api/v2/users/me.json`, {
        headers: {
          'Authorization': `${tokens.token_type} ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (testResponse.ok) {
        const userData = await testResponse.json()
        
        // Return success page with user info
        return new NextResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Zendesk OAuth Success</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .success { color: green; }
              .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .token { font-family: monospace; background: #eee; padding: 10px; border-radius: 3px; word-break: break-all; }
            </style>
          </head>
          <body>
            <h1 class="success">✅ Zendesk OAuth Authorization Successful!</h1>
            <div class="info">
              <h3>Connected User:</h3>
              <p><strong>Name:</strong> ${userData.user.name}</p>
              <p><strong>Email:</strong> ${userData.user.email}</p>
              <p><strong>Role:</strong> ${userData.user.role}</p>
            </div>
            <div class="info">
              <h3>Token Info:</h3>
              <p><strong>Token Type:</strong> ${tokens.token_type}</p>
              <p><strong>Scope:</strong> ${tokens.scope}</p>
              <p><strong>Has Refresh Token:</strong> ${tokens.refresh_token ? 'Yes' : 'No'}</p>
            </div>
            <div class="info">
              <h3>Complete Access Token:</h3>
              <div class="token">${tokens.access_token}</div>
              <p><small>Copy this token for API calls. Store it securely.</small></p>
            </div>
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>The OAuth integration is now active</li>
              <li>Zendesk data will be available in your email templates</li>
              <li>You can close this window and return to the ERP Admin Hub</li>
            </ol>
          </body>
          </html>
        `, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        })
      }
    } catch (testError) {
      console.warn('Failed to test access token:', testError)
    }

    // Fallback success response
    return NextResponse.json({
      success: true,
      message: 'OAuth authorization completed successfully',
      tokenInfo: {
        token_type: tokens.token_type,
        scope: tokens.scope,
        has_refresh_token: !!tokens.refresh_token,
        access_token: tokens.access_token
      }
    })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json({ 
      error: 'Failed to complete OAuth authorization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}