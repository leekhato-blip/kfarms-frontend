# KFarms Deployment

This setup assumes a single-host Docker deployment with:

- `frontend` served by nginx on port `80`
- `backend` running Spring Boot on port `8080`
- `postgres` on an internal Docker network
- same-origin browser traffic, with nginx proxying `/api/*` to the backend

## Files

- `docker-compose.yml`: normal production stack
- `docker-compose.bootstrap.yml`: one-time empty-database bootstrap override
- `docker-compose.env.example`: shared production environment template
- `deploy/nginx/default.conf`: SPA + API proxy config

## 1. Prepare environment

Copy the compose env template and fill in real values:

```bash
cp docker-compose.env.example .env
npm run deploy:validate -- .env
```

For the Docker deployment in this repo, `.env` in the frontend repo is the main production env file you actually populate on the server.

If the backend repo is not located at `/home/lee/Documents/kfarms-backend` on the deploy machine, update `KFARMS_BACKEND_BUILD_CONTEXT` in `.env`.

You should still keep the backend-specific reference in:

- `/home/lee/Documents/kfarms-backend/.env.example`

For the recommended same-origin deploy, keep:

- `KFARMS_COOKIE_SAMESITE=Lax`
- `KFARMS_COOKIE_DOMAIN=`
- `KFARMS_CORS_ALLOWED_ORIGINS` set to your single public app URL
- `KFARMS_AUTH_VERIFICATION_PREVIEW_ENABLED=false`
- `KFARMS_SMS_PREVIEW_LOGGING_ENABLED=false`

Before the first deploy, the validator must pass. It checks the most important production blockers:

- placeholder DB password or JWT secret
- localhost/example URLs
- preview verification still enabled
- SMTP or SMS verification delivery still missing
- Paystack enabled without the matching live secret or plan code

## 2. First boot on an empty database

If production Postgres is empty, do the first boot with the bootstrap override so Hibernate creates the schema one time:

```bash
docker compose --env-file .env -f docker-compose.yml -f docker-compose.bootstrap.yml up -d --build
```

Wait for the backend health endpoint:

```bash
curl http://localhost/actuator/health
```

After the schema exists, stop the stack and restart without the bootstrap file:

```bash
docker compose --env-file .env down
docker compose --env-file .env up -d
```

From that point onward, production uses `ddl-auto=validate`.

## 3. Normal deploy

For later deploys:

```bash
npm run deploy:validate -- .env
docker compose --env-file .env up -d --build
```

## 4. Smoke checks

Run these after deployment:

```bash
curl http://localhost/healthz
curl http://localhost/actuator/health
```

Then manually verify:

- auth login and logout
- signup
- email verification delivery
- SMS verification delivery
- password reset
- tenant create/switch
- dashboard load
- livestock, feed, inventory, sales, and supplies CRUD
- exports
- billing checkout and Paystack webhook handling if billing is enabled
- platform admin pages

## 5. Notes

- Frontend platform pages stay on `/platform/*`
- Backend platform APIs now live on `/api/platform/*`
- If you deploy frontend and backend on different domains later, set the cookie and CORS values in `.env` accordingly
