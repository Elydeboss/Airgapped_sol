/**
 * Enterprise authentication types for SSO integration
 */

export type SSOProvider = 'okta' | 'auth0' | 'azure' | 'google' | 'onelogin' | 'ping'

export interface SSOConfig {
  provider: SSOProvider
  clientId: string
  clientSecret: string
  redirectUri: string
  domain: string
  scopes?: string[]
}

export interface SAMLConfig extends SSOConfig {
  provider: 'okta' | 'onelogin' | 'ping'
  ssoUrl: string
  certificate: string
}

export interface OIDCConfig extends SSOConfig {
  provider: 'auth0' | 'azure' | 'google' | 'okta'
  authorizationEndpoint: string
  tokenEndpoint: string
  userInfoEndpoint: string
  issuer: string
}

export interface SSOUser {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  picture?: string
  groups?: string[]
  attributes?: Record<string, unknown>
}

export interface SSOSession {
  user: SSOUser
  accessToken: string
  refreshToken?: string
  idToken?: string
  expiresAt: Date
  provider: SSOProvider
}

export interface SAMLRequest {
  id: string
  request: string
  relayState: string
  ssoUrl: string
}

export interface SAMLResponse {
  id: string
  response: string
  relayState: string
  signature?: string
}

export interface OIDCTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  id_token?: string
  scope?: string
}

export interface OIDCAuthorizationRequest {
  responseType: 'code'
  clientId: string
  redirectUri: string
  scope: string
  state: string
  authorizationEndpoint: string
}

export interface SSOAuthenticationResult {
  success: boolean
  session?: SSOSession
  error?: string
  errorCode?: string
}

export interface SSOManager {
  initiateLogin(config: SSOConfig): Promise<URL>
  handleCallback(params: Record<string, string>): Promise<SSOAuthenticationResult>
  logout(session: SSOSession): Promise<void>
  refreshSession(refreshToken: string): Promise<SSOSession>
  validateSession(session: SSOSession): Promise<boolean>
}
