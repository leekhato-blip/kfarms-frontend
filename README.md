# KFarms Frontend

React + Vite frontend for the KFarms multi-tenant farm management dashboard.

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS
- Chart.js / Recharts
- Axios
- React Router

## Getting Started

```bash
npm install
npm run dev
```

## Deployment

Copy `.env.example` to your deployment environment and set `VITE_API_BASE_URL` when the API is hosted on a different origin. If the frontend is served behind the same domain as the backend, the app now falls back to `/api` automatically in production.

Deployment guides:

- Single-host Docker: [DEPLOYMENT.md](/home/lee/kfarms-frontend/DEPLOYMENT.md)
- Free shared staging on Render: [render-staging.md](/home/lee/kfarms-frontend/docs/render-staging.md)

Before shipping, run:

```bash
npm run lint
npm run test:run
npm run build
```

## Quality Commands

```bash
npm run lint
npm run test:run
npm run build
```

## Repo Hygiene

Run:

```bash
npm run repo:doctor
```

This command warns if the project is nested inside a larger git repository (which can cause accidental cross-project commits).

## Routing Notes

- Public auth routes live under `/auth/*`
- Workspace routes use tenant-aware redirects via `src/routes/workspaceRedirect.js`
- Tenant path helpers are centralized in `src/tenant/tenantRouting.js`

## API Client Structure

- Tenant/workspace API client: `src/api/apiClient.js`
- Platform admin API client: `src/api/platformClient.js`

Service modules now import directly from `src/api/apiClient.js`.
