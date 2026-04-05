# Render Staging Deployment

This is the simplest shared-testing setup for the current KFarms codebase:

- `frontend`: Render Static Site from this repo
- `backend`: Render Web Service from the Spring Boot repo
- `database`: Render Postgres

Use this for staging and remote testing. It is not the long-term production shape.

## What you get

- A public frontend URL that testers in other locations can open
- A public backend URL for API traffic
- A managed Postgres database for shared data

## Staging tradeoffs

- Free-tier services can sleep and wake up slowly
- First loads after inactivity may feel cold
- Free Postgres expires after 30 days unless you upgrade it
- Free web services cannot use standard SMTP ports, so real email verification is not a good fit on this free setup
- This is good for testing, not for production uptime expectations

## 1. Create three Render services

Create these in Render:

1. A Postgres database
2. A Web Service for the backend repo
3. A Static Site for this frontend repo

Suggested names:

- `kfarms-db-staging`
- `kfarms-api-staging`
- `kfarms-app-staging`

## 2. Frontend static site settings

Use this repo for the static site.

- Build command: `npm ci && node --single-threaded-gc ./node_modules/vite/bin/vite.js build`
- Publish directory: `dist`

Set these environment variables in the frontend service:

- `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com/api`
- `VITE_PLATFORM_AUTH_LOGIN_URL=/api/auth/login`
- `VITE_PLATFORM_LOGIN_IDENTIFIER_KEY=emailOrUsername`

You can start from [frontend-staging.env.example](/home/lee/kfarms-frontend/deploy/render/frontend-staging.env.example).

## 3. Backend web service settings

Use the backend repo at `/home/lee/Documents/kfarms-backend`.

- Build command: `./mvnw -q -DskipTests package`
- Start command: `java -jar target/kfarms-backend-0.0.1-SNAPSHOT.jar`

Set these backend environment variables:

- `SPRING_PROFILES_ACTIVE=prod`
- `SERVER_PORT=10000`
- `KFARMS_DB_URL=<Render Postgres internal JDBC URL>`
- `KFARMS_DB_USERNAME=<Render Postgres username>`
- `KFARMS_DB_PASSWORD=<Render Postgres password>`
- `KFARMS_FRONTEND_BASE_URL=https://<your-frontend-service>.onrender.com`
- `KFARMS_JWT_SECRET=<long random secret, at least 32 characters>`
- `KFARMS_COOKIE_SECURE=true`
- `KFARMS_COOKIE_SAMESITE=None`
- `KFARMS_COOKIE_DOMAIN=`
- `KFARMS_CORS_ALLOWED_ORIGINS=https://<your-frontend-service>.onrender.com`

Recommended staging-friendly switches:

- `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
- `KFARMS_AUTH_VERIFICATION_PREVIEW_ENABLED=true`
- `KFARMS_SMS_ENABLED=false`
- `KFARMS_SMS_PREVIEW_LOGGING_ENABLED=true`
- `KFARMS_PAYSTACK_ENABLED=false`

For staging, the preview verification flags let you test account flows without requiring live SMTP and SMS infrastructure on day one. This is especially important on a free Render web service because standard SMTP ports are not available there.

You can start from [backend-staging.env.example](/home/lee/kfarms-frontend/deploy/render/backend-staging.env.example).

## 4. Why `SameSite=None`

In this staging setup the frontend and backend are on different `onrender.com` origins, so cookies must be:

- `Secure`
- `SameSite=None`

Keep the cookie domain blank unless you later move both services under your own shared domain.

## 5. First boot

After setting the backend env:

1. Deploy the database in the same region you plan to use for the backend
2. Deploy the backend
3. Check `https://<your-backend-service>.onrender.com/actuator/health`
4. Deploy the frontend
5. Open the frontend URL and test login, signup, tenant switching, and platform pages

## 6. Suggested smoke checks

After both services are live:

- Open the frontend home page
- Sign in with a staging user
- Create or inspect a tenant
- Load dashboard, users, tenants, and platform pages
- Confirm offline-ready screens still load after refresh

## 7. Tighten later

Once staging is stable:

- switch `SPRING_JPA_HIBERNATE_DDL_AUTO` from `update` to `validate`
- turn off preview verification
- add real SMTP
- add real SMS if phone verification must be enforced
- enable billing only when payment webhooks are ready
