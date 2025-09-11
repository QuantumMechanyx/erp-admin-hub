# Authentication Setup Guide

This guide will help you configure Azure AD authentication and bypass authentication for the ERP Admin Hub.

## Prerequisites

- An Azure Active Directory (EntraID) tenant
- Administrative access to register applications in Azure AD
- Node.js environment with the project dependencies installed

## Azure AD App Registration

### 1. Create App Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure the application:
   - **Name**: `ERP Admin Hub` (or your preferred name)
   - **Supported account types**: 
     - For single tenant: `Accounts in this organizational directory only`
     - For multi-tenant: `Accounts in any organizational directory`
   - **Redirect URI**: 
     - Platform: `Single-page application (SPA)`
     - URI: `http://localhost:3000` (for development)

### 2. Configure Authentication

1. In your app registration, go to **Authentication**
2. Under **Single-page application**, ensure the redirect URI is set to `http://localhost:3000`
3. For production, add your production URL (e.g., `https://your-domain.com`)
4. Under **Advanced settings**:
   - Enable **Access tokens** and **ID tokens**
   - Set **Allow public client flows** to **No**

### 3. Collect Required Information

From your app registration **Overview** page, collect:
- **Application (client) ID** - This goes in `NEXT_PUBLIC_AZURE_CLIENT_ID`
- **Directory (tenant) ID** - This goes in `NEXT_PUBLIC_AZURE_TENANT_ID`

## Environment Variables Setup

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Configure Azure AD Variables

Update your `.env.local` file with the Azure AD information:

```env
NEXT_PUBLIC_AZURE_CLIENT_ID=your-application-client-id-from-azure
NEXT_PUBLIC_AZURE_TENANT_ID=your-directory-tenant-id-from-azure
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000
```

### 3. Generate Bypass Authentication Credentials

Run the bypass credential generation script:

```bash
node scripts/generate-bypass-auth.js
```

This will output:
- A secure 69-character username
- A secure 96-character password  
- Bcrypt hashes for both credentials

Copy the bcrypt hashes to your `.env.local` file:

```env
BYPASS_USERNAME_HASH=$2b$10$...your-username-hash
BYPASS_PASSWORD_HASH=$2b$10$...your-password-hash
```

**Important**: Save the plaintext username and password securely - you'll need them to log in via bypass authentication.

## Testing the Authentication

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test Azure AD Authentication

1. Navigate to `http://localhost:3000`
2. You should be redirected to the login page
3. Click **Sign in with Microsoft**
4. Complete the Azure AD authentication flow
5. You should be redirected back to the application

### 3. Test Bypass Authentication

1. Navigate to `http://localhost:3000/login` directly
2. Click on the **Bypass Authentication** tab
3. Enter the generated username and password
4. Click **Sign In**
5. You should be logged in without going through Azure AD

## Production Configuration

For production deployment:

1. **Update Redirect URIs**: Add your production domain to the Azure AD app registration
2. **Update Environment Variables**: Set `NEXT_PUBLIC_AZURE_REDIRECT_URI` to your production URL
3. **Secure Environment Variables**: Ensure all environment variables are properly secured
4. **Consider Certificate-based Authentication**: For enhanced security in production

## Security Considerations

- **Bypass Authentication**: Only use for testing and diagnostics. Consider disabling in production.
- **Credential Storage**: Store the bypass credentials securely and rotate them regularly.
- **Environment Variables**: Never commit `.env.local` to version control.
- **Azure AD Permissions**: Review and minimize the permissions granted to the application.

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure the redirect URI in Azure AD matches exactly with your environment variable
2. **Tenant Not Found**: Verify the tenant ID is correct and the application is registered in the right tenant
3. **Authentication Failures**: Check browser console for detailed error messages
4. **Bypass Login Not Working**: Verify the bcrypt hashes are correctly generated and stored

### Debug Mode

To enable detailed authentication logging, check the browser console during authentication flows. The application provides detailed error messages for troubleshooting.

## Support

For issues with:
- **Azure AD Configuration**: Consult [Microsoft's Azure AD documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- **Application Issues**: Check the browser console and application logs
- **Environment Setup**: Verify all environment variables are correctly set