import type {
  OIDCConfig,
  OIDCAuthorizationRequest,
  OIDCTokenResponse,
  SSOAuthenticationResult,
  SSOUser,
  SSOSession,
} from './types.js'

/**
 * OpenID Connect SSO integration for enterprise authentication
 *
 * Supports: Auth0, Azure AD, Google Workspace, Okta
 */
export class OIDCManager {
  private config: OIDCConfig
  private sessions: Map<string, SSOSession> = new Map()
  private stateStore: Map<string, { state: string; codeVerifier?: string }> = new Map()

  constructor(config: OIDCConfig) {
    this.config = config
  }

  /**
   * Initiate OIDC login
   */
  async initiateLogin(): Promise<URL> {
    const state = this.generateState()
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = this.generateCodeChallenge(codeVerifier)

    // Store state and code verifier for callback validation
    this.stateStore.set(state, {
      state,
      codeVerifier,
    })

    // Build authorization URL
    const authUrl = new URL(this.config.authorizationEndpoint)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', this.config.clientId)
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri)
    authUrl.searchParams.set('scope', this.config.scopes?.join(' ') || 'openid profile email'))
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return authUrl
  }

  /**
   * Handle OIDC callback from IdP
   */
  async handleCallback(params: Record<string, string>): Promise<SSOAuthenticationResult> {
    const { code, state: returnedState, error } = params

    if (error) {
      return {
        success: false,
        error: `Authentication error: ${error}`,
        errorCode: error,
      }
    }

    if (!code || !returnedState) {
      return {
        success: false,
        error: 'Missing authorization code or state',
        errorCode: 'MISSING_PARAMS',
      }
    }

    // Validate state
    const storedState = this.stateStore.get(returnedState)
    if (!storedState) {
      return {
        success: false,
        error: 'Invalid state parameter',
        errorCode: 'INVALID_STATE',
      }
    }

    try {
      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code, storedState.codeVerifier!)

      // Decode ID token to get user information
      const user = await this.decodeIdToken(tokenResponse.id_token!)

      // Create session
      const session: SSOSession = {
        user,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        idToken: tokenResponse.id_token,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        provider: this.config.provider,
      }

      // Store session
      const sessionId = this.generateSessionId()
      this.sessions.set(sessionId, session)

      return {
        success: true,
        session,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to process authentication',
        errorCode: 'OIDC_PROCESSING_ERROR',
      }
    }
  }

  /**
   * Logout user
   */
  async logout(session: SSOSession): Promise<void> {
    // Invalidate session
    for (const [sessionId, storedSession] of this.sessions.entries()) {
      if (storedSession === session) {
        this.sessions.delete(sessionId)
      }
    }

    // In production, would also logout from IdP
    // const logoutUrl = `${this.config.domain}/v2/logout?client_id=${this.config.clientId}`;
    // window.location.href = logoutUrl;
  }

  /**
   * Refresh session using refresh token
   */
  async refreshSession(refreshToken: string): Promise<SSOSession> {
    // In production, call the token endpoint with refresh token
    const tokenResponse = await this.refreshTokens(refreshToken)

    const user = await this.decodeIdToken(tokenResponse.id_token!)

    const session: SSOSession = {
      user,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      idToken: tokenResponse.id_token,
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      provider: this.config.provider,
    }

    return session
  }

  /**
   * Validate session
   */
  async validateSession(session: SSOSession): Promise<boolean> {
    return session.expiresAt > new Date()
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<OIDCTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code_verifier: codeVerifier,
    })

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Refresh tokens using refresh token
   */
  private async refreshTokens(refreshToken: string): Promise<OIDCTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Decode ID token to extract user information
   */
  private async decodeIdToken(idToken: string): Promise<SSOUser> {
    // In production, verify JWT signature and extract claims
    // For now, decode without verification (simulated)

    const parts = idToken.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid ID token format')
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

    return {
      id: payload.sub || 'user_' + Date.now(),
      email: payload.email || 'user@company.com',
      name: payload.name || 'OIDC User',
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
      groups: payload.groups || [],
      attributes: payload,
    }
  }

  /**
   * Generate random state parameter
   */
  private generateState(): string {
    return 'state_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16)
  }

  /**
   * Generate code verifier for PKCE
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return this.base64URLEncode(array)
  }

  /**
   * Generate code challenge from verifier
   */
  private generateCodeChallenge(verifier: string): string {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      return this.base64URLEncode(new Uint8Array(hash))
    })
  }

  /**
   * Base64URL encode without padding
   */
  private base64URLEncode(buffer: Uint8Array): string {
    let str = Buffer.from(buffer).toString('base64')
    str = str.replace(/\+/g, '-')
    str = str.replace(/\//g, '_')
    str = str.replace(/=/g, '')
    return str
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

/**
 * Create OIDC configuration for common providers
 */
export class OIDCProviders {
  static auth0(config: {
    domain: string
    clientId: string
    clientSecret: string
    redirectUri: string
  }): OIDCConfig {
    return {
      provider: 'auth0',
      domain: config.domain,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      authorizationEndpoint: `${config.domain}/authorize`,
      tokenEndpoint: `${config.domain}/oauth/token`,
      userInfoEndpoint: `${config.domain}/userinfo`,
      issuer: `${config.domain}/`,
      scopes: ['openid', 'profile', 'email'],
    }
  }

  static azure(config: {
    tenantId: string
    clientId: string
    clientSecret: string
    redirectUri: string
  }): OIDCConfig {
    return {
      provider: 'azure',
      domain: `https://login.microsoftonline.com/${config.tenantId}`,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      authorizationEndpoint: `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
      userInfoEndpoint: `https://graph.microsoft.com/v1.0/me`,
      issuer: `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
      scopes: ['openid', 'profile', 'email'],
    }
  }

  static google(config: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }): OIDCConfig {
    return {
      provider: 'google',
      domain: 'https://accounts.google.com',
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
      issuer: 'https://accounts.google.com',
      scopes: ['openid', 'profile', 'email'],
    }
  }

  static okta(config: {
    domain: string
    clientId: string
    clientSecret: string
    redirectUri: string
  }): OIDCConfig {
    return {
      provider: 'okta',
      domain: config.domain,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      authorizationEndpoint: `${config.domain}/v1/authorize`,
      tokenEndpoint: `${config.domain}/v1/token`,
      userInfoEndpoint: `${config.domain}/v1/userinfo`,
      issuer: `${config.domain}`,
      scopes: ['openid', 'profile', 'email'],
    }
  }
}
