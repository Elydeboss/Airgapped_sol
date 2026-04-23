import type {
  SSOConfig,
  SSOAuthenticationResult,
  SSOSession,
  SSOManager,
  SSOProvider,
} from './types.js'
import { SAMLManager, SAMLProviders } from './saml.js'
import { OIDCManager, OIDCProviders } from './oidc.js'

/**
 * SSO orchestration layer
 * Handles both SAML and OIDC authentication flows
 */
export class SSOOrchestrator implements SSOManager {
  private samlManager?: SAMLManager
  private oidcManager?: OIDCManager
  private provider: SSOProvider

  constructor(config: SSOConfig) {
    this.provider = config.provider

    if (config.provider === 'okta' || config.provider === 'onelogin' || config.provider === 'ping') {
      // SAML-based providers
      if ('ssoUrl' in config) {
        this.samlManager = new SAMLManager(config as any)
      } else {
        this.oidcManager = new OIDCManager(config as any)
      }
    } else {
      // OIDC-based providers
      this.oidcManager = new OIDCManager(config as any)
    }
  }

  /**
   * Initiate SSO login
   */
  async initiateLogin(): Promise<URL> {
    if (this.oidcManager) {
      return await this.oidcManager.initiateLogin()
    } else if (this.samlManager) {
      return await this.samlManager.initiateLogin()
    }

    throw new Error('No SSO manager configured')
  }

  /**
   * Handle SSO callback
   */
  async handleCallback(params: Record<string, string>): Promise<SSOAuthenticationResult> {
    if (this.oidcManager) {
      return await this.oidcManager.handleCallback(params)
    } else if (this.samlManager) {
      return await this.samlManager.handleCallback(params)
    }

    throw new Error('No SSO manager configured')
  }

  /**
   * Logout user
   */
  async logout(session: SSOSession): Promise<void> {
    if (this.oidcManager) {
      return await this.oidcManager.logout(session)
    } else if (this.samlManager) {
      return await this.samlManager.logout(session)
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(refreshToken: string): Promise<SSOSession> {
    if (this.oidcManager) {
      return await this.oidcManager.refreshSession(refreshToken)
    }

    throw new Error('Session refresh not supported for SAML')
  }

  /**
   * Validate session
   */
  async validateSession(session: SSOSession): Promise<boolean> {
    if (this.oidcManager) {
      return await this.oidcManager.validateSession(session)
    } else if (this.samlManager) {
      return await this.samlManager.validateSession(session)
    }

    return false
  }
}

/**
 * Factory for creating SSO configurations
 */
export class SSOFactory {
  /**
   * Create Okta SSO configuration
   */
  static okta(config: {
    domain: string
    clientId: string
    clientSecret: string
    redirectUri: string
    useSAML?: boolean
  }): SSOConfig {
    if (config.useSAML) {
      return SAMLProviders.okta(config)
    } else {
      return OIDCProviders.okta(config)
    }
  }

  /**
   * Create Auth0 SSO configuration
   */
  static auth0(config: {
    domain: string
    clientId: string
    clientSecret: string
    redirectUri: string
  }): SSOConfig {
    return OIDCProviders.auth0(config)
  }

  /**
   * Create Azure AD SSO configuration
   */
  static azure(config: {
    tenantId: string
    clientId: string
    clientSecret: string
    redirectUri: string
  }): SSOConfig {
    return OIDCProviders.azure(config)
  }

  /**
   * Create Google Workspace SSO configuration
   */
  static google(config: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }): SSOConfig {
    return OIDCProviders.google(config)
  }

  /**
   * Create OneLogin SSO configuration
   */
  static oneLogin(config: {
    domain: string
    clientId: string
    clientSecret: string
    redirectUri: string
  }): SSOConfig {
    return SAMLProviders.oneLogin(config)
  }

  /**
   * Create Ping Identity SSO configuration
   */
  static ping(config: {
    domain: string
    clientId: string
    clientSecret: string
    redirectUri: string
  }): SSOConfig {
    return SAMLProviders.ping(config)
  }
}
