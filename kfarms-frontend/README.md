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

