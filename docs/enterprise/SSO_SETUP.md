# Enterprise SSO Setup Guide

## Overview

OfflineSign SDK supports enterprise single sign-on (SSO) through both SAML 2.0 and OpenID Connect (OIDC) protocols. This guide covers configuration for major identity providers.

---

## Supported Identity Providers

### SAML 2.0
- Okta
- OneLogin
- Ping Identity
- Microsoft Active Directory Federation Services (ADFS)
- Custom SAML providers

### OpenID Connect
- Auth0
- Azure Active Directory
- Google Workspace
- Okta (OIDC mode)
- Custom OIDC providers

---

## Quick Start

### 1. Choose Your Protocol

**Use SAML if:**
- You have enterprise federation requirements
- Your organization uses SAML already
- You need advanced SSO features

**Use OIDC if:**
- You prefer modern OAuth 2.0 based protocols
- You need mobile app support
- You want simpler implementation

### 2. Basic Integration

```typescript
import { SSOOrchestrator } from '@airgapped-priv/sdk'

// SAML configuration
const sso = new SSOOrchestrator({
  type: 'saml',
  provider: 'okta',
  config: {
    entryPoint: 'https://your-org.okta.com/app/sdkdev/sso/saml',
    issuer: 'your-issuer-id',
    callbackUrl: 'https://your-app.com/auth/saml/callback',
    cert: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
  }
})

// OIDC configuration
const sso = new SSOOrchestrator({
  type: 'oidc',
  provider: 'auth0',
  config: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    domain: 'your-domain.auth0.com',
    redirectUri: 'https://your-app.com/auth/oidc/callback',
    scope: 'openid profile email',
  }
})

// Initiate login
const loginUrl = await sso.getLoginUrl()
window.location.href = loginUrl

// Handle callback
const session = await sso.handleCallback(urlParams)
```

---

## Provider-Specific Setup

### Okta (SAML)

#### 1. Create Application in Okta

1. Log in to Okta Admin Console
2. Go to **Applications** → **Applications**
3. Click **Create App Integration**
4. Select **SAML 2.0**
5. Configure app settings:
   - **App name:** OfflineSign Enterprise
   - **SSO URL:** `https://your-app.com/auth/saml/callback`
   - **Audience URI:** `https://your-app.com`
   - **Name ID Format:** `EmailAddress`
   - **Application username:** Email

#### 2. Configure Attributes

```yaml
Attribute Name: email
Name Format: Basic
Value: user.email

Attribute Name: firstName
Name Format: Basic
Value: user.firstName

Attribute Name: lastName
Name Format: Basic
Value: user.lastName

Attribute Name: groups
Name Format: Basic
Value: user.groups
```

#### 3. Get Configuration

From Okta application settings:
- **Identity Provider Single Sign-On URL** → `entryPoint`
- **X.509 Certificate** → `cert`
- **Audience URI** → `issuer`

#### 4. OfflineSign Configuration

```typescript
import { SAMLProviders } from '@airgapped-priv/sdk'

const samlConfig = SAMLProviders.okta({
  entryPoint: 'https://your-org.okta.com/app/sdkdev/sso/saml',
  issuer: 'your-issuer-id',
  callbackUrl: 'https://your-app.com/auth/saml/callback',
  cert: fs.readFileSync('./okta-cert.pem', 'utf-8'),
})

const saml = new SAMLManager(samlConfig)
```

### Okta (OIDC)

#### 1. Create OIDC Application

1. In Okta Admin Console, go to **Applications** → **Applications**
2. Click **Create App Integration**
3. Select **OIDC - OpenID Connect**
4. Application type: **Web Application**
5. Configure settings:
   - **Login redirect URIs:** `https://your-app.com/auth/oidc/callback`
   - **Allowed grant types:** Authorization Code, Refresh Token
   - **Allowed scopes:** openid, profile, email, groups

#### 2. Get Credentials

- **Client ID** and **Client Secret** from application settings
- **Okta Domain** (e.g., `your-domain.okta.com`)

#### 3. OfflineSign Configuration

```typescript
import { OIDCProviders } from '@airgapped-priv/sdk'

const oidcConfig = OIDCProviders.okta({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  domain: 'your-domain.okta.com',
  redirectUri: 'https://your-app.com/auth/oidc/callback',
  scope: 'openid profile email groups',
})

const oidc = new OIDCManager(oidcConfig)
```

### Auth0 (OIDC)

#### 1. Create Auth0 Application

1. Log in to Auth0 Dashboard
2. Go to **Applications** → **Applications**
3. Click **Create Application**
4. Choose **Regular Web Applications**
5. Configure settings:
   - **Allowed Callback URLs:** `https://your-app.com/auth/oidc/callback`
   - **Allowed Logout URLs:** `https://your-app.com`
   - **Allowed Origins:** `https://your-app.com`

#### 2. Enable Connections

Go to **Connections** → **Authentication** and enable:
- Database (Username/Password)
- Google OAuth2
- Enterprise connections (SAML, AD, etc.)

#### 3. OfflineSign Configuration

```typescript
import { OIDCProviders } from '@airgapped-priv/sdk'

const oidcConfig = OIDCProviders.auth0({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  domain: 'your-domain.auth0.com',
  redirectUri: 'https://your-app.com/auth/oidc/callback',
  scope: 'openid profile email',
})

const oidc = new OIDCManager(oidcConfig)
```

### Azure Active Directory (OIDC)

#### 1. Register Application in Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - **Name:** OfflineSign Enterprise
   - **Supported account types:** Accounts in this organizational directory only
   - **Redirect URI:** Web → `https://your-app.com/auth/oidc/callback`

#### 2. Configure API Permissions

1. Go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph** → **Delegated permissions**
3. Add permissions:
   - User.Read
   - User.ReadBasic.All
   - GroupMember.Read.All

#### 3. Get Client Secret

1. Go to **Certificates & secrets** → **New client secret**
2. Copy the secret value (you won't see it again)

#### 4. OfflineSign Configuration

```typescript
import { OIDCProviders } from '@airgapped-priv/sdk'

const oidcConfig = OIDCProviders.azure({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tenantId: 'your-tenant-id',
  redirectUri: 'https://your-app.com/auth/oidc/callback',
  scope: 'openid profile email User.Read GroupMember.Read.All',
})

const oidc = new OIDCManager(oidcConfig)
```

### Google Workspace (OIDC)

#### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Configure:
   - **Name:** OfflineSign Enterprise
   - **Authorized redirect URIs:** `https://your-app.com/auth/oidc/callback`

#### 2. Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Enable:
   - Google+ API
   - People API

#### 3. OfflineSign Configuration

```typescript
import { OIDCProviders } from '@airgapped-priv/sdk'

const oidcConfig = OIDCProviders.google({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://your-app.com/auth/oidc/callback',
  scope: 'openid profile email',
})

const oidc = new OIDCManager(oidcConfig)
```

### OneLogin (SAML)

#### 1. Create OneLogin Application

1. Log in to OneLogin Admin Portal
2. Go to **Applications** → **Applications**
3. Click **Add App**
4. Search for **SAML Test Connector (IdP)**
5. Configure:
   - **Display Name:** OfflineSign Enterprise
   - **ACS (Consumer) URL:** `https://your-app.com/auth/saml/callback`
   - **Audience:** `https://your-app.com`

#### 2. Configure Parameters

```yaml
Name ID Format: Email
Application Type: Desktop
Recipient: https://your-app.com/auth/saml/callback
Assertion Consumer Service URL: https://your-app.com/auth/saml/callback
```

#### 3. Get SAML Metadata

From the SSO tab in OneLogin app settings:
- Download **IdP Metadata** or copy **SAML 2.0 Endpoint** and **X.509 Certificate**

#### 4. OfflineSign Configuration

```typescript
import { SAMLProviders } from '@airgapped-priv/sdk'

const samlConfig = SAMLProviders.onelogin({
  entryPoint: 'https://domain.onelogin.com/trust/saml2/http-post/sso/01234567-89ab-cdef-0123-456789abcdef',
  issuer: 'https://www.onelogin.com/saml/metadata/01234567-89ab-cdef-0123-456789abcdef',
  callbackUrl: 'https://your-app.com/auth/saml/callback',
  cert: fs.readFileSync('./onelogin-cert.pem', 'utf-8'),
})

const saml = new SAMLManager(samlConfig)
```

### Ping Identity (SAML)

#### 1. Create Application in Ping

1. Log in to Ping Admin Console
2. Go to **Applications** → **Applications**
3. Click **+** to add new application
4. Select **SAML Application**
5. Configure:
   - **Application ID:** offlinesign-enterprise
   - **Application Name:** OfflineSign Enterprise
   - **ACS URL:** `https://your-app.com/auth/saml/callback`
   - **Entity ID:** `https://your-app.com`

#### 2. Configure Attribute Mapping

```yaml
Email: email
FirstName: firstName
LastName: lastName
Groups: groups
```

#### 3. Export Certificate

From application settings, download the **IdP Certificate**.

#### 4. OfflineSign Configuration

```typescript
import { SAMLProviders } from '@airgapped-priv/sdk'

const samlConfig = SAMLProviders.ping({
  entryPoint: 'https://sso.pingidentity.com/saml/idp',
  issuer: 'https://your-app.com',
  callbackUrl: 'https://your-app.com/auth/saml/callback',
  cert: fs.readFileSync('./ping-cert.pem', 'utf-8'),
})

const saml = new SAMLManager(samlConfig)
```

---

## Integration Examples

### React Application

```typescript
import { SSOOrchestrator } from '@airgapped-priv/sdk'
import { useAuth } from './hooks/useAuth'

const sso = new SSOOrchestrator({
  type: 'oidc',
  provider: 'auth0',
  config: {
    clientId: process.env.NEXT_PUBLIC_SSO_CLIENT_ID,
    domain: process.env.NEXT_PUBLIC_SSO_DOMAIN,
    redirectUri: `${window.location.origin}/auth/callback`,
  },
})

function LoginButton() {
  const { login, isLoading } = useAuth(sso)

  return (
    <button onClick={login} disabled={isLoading}>
      {isLoading ? 'Signing in...' : 'Sign in with SSO'}
    </button>
  )
}

function CallbackPage() {
  const { handleCallback } = useAuth(sso)

  useEffect(() => {
    handleCallback(window.location.href)
      .then(session => {
        // Store session
        localStorage.setItem('session', JSON.stringify(session))
        // Redirect to dashboard
        router.push('/dashboard')
      })
      .catch(error => {
        console.error('Authentication failed', error)
        router.push('/login?error=auth_failed')
      })
  }, [])

  return <div>Signing in...</div>
}
```

### Next.js Application

```typescript
// pages/api/auth/[provider]/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SSOOrchestrator } from '@airgapped-priv/sdk'

const sso = new SSOOrchestrator({
  type: 'oidc',
  provider: 'auth0',
  config: {
    clientId: process.env.SSO_CLIENT_ID,
    clientSecret: process.env.SSO_CLIENT_SECRET,
    domain: process.env.SSO_DOMAIN,
    redirectUri: `${process.env.APP_URL}/api/auth/callback`,
  },
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const loginUrl = await sso.getLoginUrl()
  res.redirect(302, loginUrl)
}

// pages/api/auth/callback.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, state } = req.query

  try {
    const session = await sso.handleCallback({
      code: code as string,
      state: state as string,
    })

    // Set session cookie
    res.setHeader(
      'Set-Cookie',
      `session=${encodeURIComponent(JSON.stringify(session))}; Path=/; HttpOnly; Secure; SameSite=Lax`
    )

    res.redirect(302, '/dashboard')
  } catch (error) {
    console.error('Authentication callback failed', error)
    res.redirect(302, '/login?error=auth_failed')
  }
}
```

### Express.js Backend

```typescript
import express from 'express'
import { SSOOrchestrator } from '@airgapped-priv/sdk'

const app = express()
const sso = new SSOOrchestrator({
  type: 'saml',
  provider: 'okta',
  config: {
    entryPoint: process.env.SAML_ENTRY_POINT,
    issuer: process.env.SAML_ISSUER,
    callbackUrl: `${process.env.APP_URL}/auth/saml/callback`,
    cert: fs.readFileSync('./idp-cert.pem', 'utf-8'),
  },
})

// Initiate SSO login
app.get('/auth/login', async (req, res) => {
  const loginUrl = await sso.getLoginUrl()
  res.redirect(loginUrl)
})

// Handle SAML callback
app.post('/auth/saml/callback', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const session = await sso.handleCallback(req.body)
    req.session.user = session
    res.redirect('/dashboard')
  } catch (error) {
    res.redirect('/login?error=auth_failed')
  }
})

// Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/login')
})
```

---

## Role and Group Mapping

### Mapping SSO Groups to SDK Roles

```typescript
import { Role, RoleHierarchy } from '@airgapped-priv/sdk'

// Define group to role mapping
const groupRoleMapping: Record<string, Role> = {
  'offlinesign-admins': Role.SUPER_ADMIN,
  'offlinesign-operators': Role.OPERATOR,
  'offlinesign-approvers': Role.APPROVER,
  'offlinesign-viewers': Role.VIEWER,
  'offlinesign-auditors': Role.AUDITOR,
}

function mapUserToRole(groups: string[]): Role {
  // Find the highest role from user's groups
  let highestRole = Role.USER

  for (const group of groups) {
    const role = groupRoleMapping[group]
    if (role && RoleHierarchy[role] > RoleHierarchy[highestRole]) {
      highestRole = role
    }
  }

  return highestRole
}

// Usage in SSO callback
const session = await sso.handleCallback(urlParams)
const userRole = mapUserToRole(session.user.groups)

// Assign role to user
await rbac.assignRole(session.user.id, userRole)
```

---

## Troubleshooting

### Common Issues

**Issue: "Invalid callback URL" error**
- Verify redirect URI matches exactly in IdP configuration
- Check for trailing slashes or protocol mismatches (http vs https)
- Ensure callback URL is whitelisted in IdP application settings

**Issue: "Certificate verification failed"**
- Verify X.509 certificate is current and not expired
- Check certificate format (PEM vs DER)
- Ensure you're using the IdP certificate, not application certificate

**Issue: "Invalid audience" error (SAML)**
- Verify audience/issuer matches IdP application settings
- Check for case sensitivity in entity ID

**Issue: "State mismatch" error (OIDC)**
- Ensure state parameter is properly stored and validated
- Check for CSRF protection issues
- Verify state parameter expiration time

**Issue: "Scope not granted" error (OIDC)**
- Verify requested scopes are enabled in IdP application
- Check admin consent for organization-wide scopes
- Ensure user has permissions for requested scopes

### Debug Logging

```typescript
import { SSOOrchestrator } from '@airgapped-priv/sdk'

const sso = new SSOOrchestrator({
  type: 'oidc',
  provider: 'auth0',
  config: { /* ... */ },
  debug: true, // Enable debug logging
  logger: {
    info: (msg) => console.log('[SSO]', msg),
    error: (msg, err) => console.error('[SSO ERROR]', msg, err),
  },
})
```

---

## Security Best Practices

1. **Always use HTTPS** for production SSO implementations
2. **Validate state parameter** to prevent CSRF attacks
3. **Rotate secrets** regularly (client secrets, signing certificates)
4. **Implement proper session management** with expiration
5. **Monitor for suspicious login activity** in audit logs
6. **Use short-lived tokens** with refresh token rotation
7. **Implement proper logout** (both local and IdP logout)
8. **Encrypt sensitive configuration** at rest
9. **Validate all tokens** on every request
10. **Implement IP-based restrictions** for sensitive operations

---

**Last Updated:** 2026-04-22
**Version:** 1.0.0
