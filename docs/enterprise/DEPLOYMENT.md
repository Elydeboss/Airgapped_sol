# Enterprise Deployment Guide

## Overview

This guide covers deploying OfflineSign SDK in enterprise environments, including infrastructure requirements, security configurations, and operational considerations.

---

## Prerequisites

### System Requirements

**Hardware:**
- CPU: 4+ cores recommended
- RAM: 8GB minimum, 16GB recommended
- Storage: 50GB SSD for audit logs and configuration

**Software:**
- Node.js 18+ LTS
- npm 9+ or yarn 1.22+
- PostgreSQL 14+ (for audit log storage, optional)
- Redis 7+ (for session caching, optional)

**Network:**
- HTTPS required for production
- WebSocket support for real-time updates (optional)
- Outbound access to Solana RPC endpoints

---

## Installation

### NPM Package Installation

```bash
npm install @airgapped-priv/sdk
```

### Enterprise Dependencies

```bash
npm install @airgapped-priv/sdk \
  @azure/identity \
  @aws-sdk/client-kms \
  fido2-lib \
  jsonwebtoken
```

---

## Configuration

### Environment Variables

```bash
# SDK Configuration
OFFLINESIGN_ENVIRONMENT=production
OFFLINESIGN_LOG_LEVEL=info
OFFLINESIGN_AUDIT_RETENTION_DAYS=365

# Encryption
OFFLINESIGN_ENCRYPTION_KEY=your-32-byte-hex-key
OFFLINESIGN_PBKDF2_ITERATIONS=100000

# Audit Logging
OFFLINESIGN_AUDIT_STORAGE=postgresql
OFFLINESIGN_POSTGRES_CONNECTION_STRING=postgresql://user:pass@host:5432/dbname

# HSM Configuration
OFFLINESIGN_HSM_PROVIDER=yubikey
OFFLINESIGN_YUBIKEY_ENABLED=true

# SSO Configuration (see SSO_SETUP.md)
OFFLINESIGN_SSO_PROVIDER=okta
OFFLINESIGN_SSO_CLIENT_ID=your-client-id
OFFLINESIGN_SSO_CLIENT_SECRET=your-client-secret

# Policy Enforcement
OFFLINESIGN_POLICY_ENGINE_ENABLED=true
OFFLINESIGN_POLICY_CACHE_TTL=300
```

### Application Configuration

```typescript
import { OfflineSignSDK, AuditLogger, PolicyEngine } from '@airgapped-priv/sdk'

const sdk = new OfflineSignSDK({
  environment: 'production',
  auditLogger: new AuditLogger({
    storage: 'postgresql',
    connectionString: process.env.OFFLINESIGN_POSTGRES_CONNECTION_STRING,
    retentionDays: 365,
  }),
  policyEngine: new PolicyEngine({
    enableCaching: true,
    cacheTTL: 300,
  }),
  enableHSM: true,
  hsmProvider: 'yubikey',
})
```

---

## Deployment Architectures

### Architecture 1: Single-Region Deployment

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │    (HTTPS)      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Application    │
                    │  Server (Node)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
  ┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
  │ Postgres  │      │    Redis    │     │   Solana    │
  │ (Audit)   │      │  (Sessions) │     │    RPC      │
  └───────────┘      └─────────────┘     └─────────────┘
```

**Pros:**
- Simple architecture
- Low latency
- Easy to manage

**Cons:**
- Single point of failure
- No disaster recovery

**Best for:** Pilot deployments, development environments

### Architecture 2: Multi-Region High Availability

```
  Region 1                                    Region 2
  ┌─────────────────┐                    ┌─────────────────┐
  │  Load Balancer  │◄─────sync─────────▶│  Load Balancer  │
  │    (HTTPS)      │                    │    (HTTPS)      │
  └────────┬────────┘                    └────────┬────────┘
           │                                     │
  ┌────────▼────────┐                    ┌───────▼────────┐
  │  Application    │◄─────sync─────────▶│  Application    │
  │  Server (Node)  │                    │  Server (Node)  │
  └────────┬────────┘                    └────────┬────────┘
           │                                     │
  ┌────────▼────────┐                    ┌───────▼────────┐
  │ Postgres        │◄─────replication──▶│ Postgres       │
  │ (Primary)       │                    │ (Standby)      │
  └─────────────────┘                    └────────────────┘
```

**Pros:**
- High availability
- Disaster recovery
- Better performance for global users

**Cons:**
- More complex
- Higher cost
- Data consistency considerations

**Best for:** Production enterprise deployments

---

## Database Setup

### PostgreSQL Schema

```sql
-- Create database
CREATE DATABASE offlinesign_audit;

-- Connect to database
\c offlinesign_audit;

-- Create audit logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  severity VARCHAR(50),
  status VARCHAR(50),
  details JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  INDEX idx_event_type (event_type),
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_severity (severity)
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_timestamp_type ON audit_logs(timestamp, event_type);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);

-- Grant permissions
GRANT SELECT, INSERT ON audit_logs TO offlinesign_app;
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO offlinesign_app;
```

### Redis Setup for Sessions

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis-server
```

---

## Security Hardening

### TLS/SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'";

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Rules

```bash
# Allow only necessary traffic
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (from specific IP)
sudo ufw allow from 203.0.113.0/24 to any port 22

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow database access (from application server only)
sudo ufw allow from 203.0.113.10 to any port 5432

# Enable firewall
sudo ufw enable
```

### Application Security

```typescript
import { RateLimiter, SecurityHeaders } from '@airgapped-priv/sdk'

// Rate limiting
const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  skipSuccessfulRequests: false,
})

// Security headers
const securityHeaders = new SecurityHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
})
```

---

## Monitoring & Alerting

### Health Checks

```typescript
import { HealthChecker } from '@airgapped-priv/sdk'

const healthChecker = new HealthChecker({
  checks: [
    {
      name: 'database',
      check: async () => {
        const result = await pool.query('SELECT 1')
        return result.rows[0].column === 1
      },
      interval: 30000, // 30 seconds
    },
    {
      name: 'solana-rpc',
      check: async () => {
        const health = await connection.getHealth()
        return health === 'ok'
      },
      interval: 60000, // 1 minute
    },
  ],
})

// Start health checks
healthChecker.start()
```

### Metrics Collection

```typescript
import { MetricsCollector } from '@airgapped-priv/sdk'

const metrics = new MetricsCollector({
  enabled: true,
  collectInterval: 60000,
  exporters: [
    'prometheus', // Export metrics to Prometheus
    'cloudwatch', // Export to AWS CloudWatch
  ],
})

// Track custom metrics
metrics.increment('transactions.signed')
metrics.timing('signing.duration', duration)
metrics.gauge('active.sessions', sessionCount)
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: offlinesign
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(offlinesign_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: FailedAuthentication
        expr: rate(offlinesign_auth_failed_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Multiple failed authentication attempts"

      - alert: AuditLogStorageFull
        expr: offlinesign_audit_storage_usage > 0.9
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Audit log storage nearly full"
```

---

## Backup & Recovery

### Database Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="offlinesign_audit"

# Create backup
pg_dump -h localhost -U offlinesign_user $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://backups/offlinesign/
```

### Disaster Recovery

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 1 hour

```bash
# Restore from backup
#!/bin/bash
BACKUP_FILE=$1

# Stop application
systemctl stop offlinesign

# Restore database
gunzip < $BACKUP_FILE | psql -h localhost -U offlinesign_user offlinesign_audit

# Start application
systemctl start offlinesign

# Verify
curl -f http://localhost:3000/health || exit 1
```

---

## Scaling Considerations

### Horizontal Scaling

```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: offlinesign-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: offlinesign-api
  template:
    metadata:
      labels:
        app: offlinesign-api
    spec:
      containers:
      - name: api
        image: offlinesign/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: OFFLINESIGN_ENVIRONMENT
          value: "production"
        - name: OFFLINESIGN_AUDIT_STORAGE
          value: "postgresql"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Database Scaling

```sql
-- Partition audit logs by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Archive old partitions
CREATE TABLE audit_logs_archive (LIKE audit_logs INCLUDING ALL);

-- Move old data to archive
INSERT INTO audit_logs_archive SELECT * FROM audit_logs_2023_01;
DROP TABLE audit_logs_2023_01;
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Review and update environment variables
- [ ] Verify database schema is up to date
- [ ] Test database backups
- [ ] Configure SSL certificates
- [ ] Set up monitoring and alerting
- [ ] Review security policies
- [ ] Verify HSM integration (if applicable)
- [ ] Test SSO integration (if applicable)

### Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Verify audit logging is working
- [ ] Test transaction signing flow
- [ ] Verify policy enforcement
- [ ] Check monitoring dashboards
- [ ] Deploy to production
- [ ] Run production smoke tests

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check audit log integrity
- [ ] Verify performance metrics
- [ ] Review security logs
- [ ] Test disaster recovery procedures
- [ ] Document any issues
- [ ] Schedule post-deployment review

---

## Troubleshooting

### Common Issues

**Issue: High memory usage**
```bash
# Check memory usage
node --max-old-space-size=4096 app.js
```

**Issue: Slow audit log queries**
```sql
-- Add missing indexes
EXPLAIN ANALYZE SELECT * FROM audit_logs WHERE user_id = 'xxx';

-- Vacuum and analyze
VACUUM ANALYZE audit_logs;
```

**Issue: HSM connection failures**
```bash
# Check USB device permissions
ls -l /dev/ttyACM0

# Add user to dialout group
sudo usermod -a -G dialout $USER
```

---

**Last Updated:** 2026-04-22
**Version:** 1.0.0
