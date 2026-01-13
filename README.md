## Project Overview
Modular backend for financial transactions with gateway-first design, per-service databases, and distributed tracing. Deployable via Docker Compose, scales horizontally.

Key Architecture Features
API Gateway: Single entry point with rate limiting, auth validation, CORS/Helmet security

Microservices: Auth, Transactions (expandable to Payments, Notifications)

Data Isolation: Separate PostgreSQL instances per service

Redis: Caching, idempotency keys, refresh tokens, queues

Security Implementation
Helmet middleware (CSP, XSS protection)

bcrypt password hashing (12 rounds)

Rate limiting (100 req/15min)

CORS origin whitelisting

Idempotency keys prevent duplicates

Deployment
bash
npm install && docker-compose up -d
Access: http://localhost:3000/health

Unique Production Differentiators
True service isolation (separate DBs, independent scaling)

Saga-ready (event coordination foundation)

Observability-first (trace IDs, structured logs)

Idempotency at core (financial transaction safety)

## RUN INSTALLATION

# Clone and setup
mkdir fintech-express-backend && cd fintech-express-backend
# Copy all files above into respective directories

# Install dependencies
npm install

# Start everything
docker-compose up -d

# Test endpoints
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"securepass123","deviceId":"device-123"}'
