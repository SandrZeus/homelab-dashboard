# homelab-dashboard

A self-hosted homelab monitoring dashboard — Go backend + React/TypeScript SPA — running on a Raspberry Pi 5 with K3s. Combines Kubernetes pod state, system metrics, and optional integrated services (ServicePatrol) into a single interface.

![Go](https://img.shields.io/badge/Go-1.24-00ADD8?logo=go) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![K3s](https://img.shields.io/badge/K3s-self--hosted-FFC61C?logo=kubernetes)

---

## What it does

- **Pod monitoring** — lists all pods across namespaces with status, restart count, CPU (millicores), memory, and age, pulled directly from the Kubernetes API and metrics-server
- **System metrics** — CPU%, memory%, disk%, uptime, and CPU temperature from Prometheus node_exporter
- **Live updates** — a single WebSocket broadcasts dashboard state every 10 seconds
- **ServicePatrol integration** — optional integrated health monitoring for HTTP endpoints, with real-time state-change events streamed over SSE (see [ServicePatrol](https://github.com/SandrZeus/ServicePatrol))
- **Capability discovery** — optional integrations are detected at runtime; the UI shows only features that are actually wired up
- **JWT auth** — bcrypt-hashed credentials, short-lived access token, refresh token via httpOnly cookie
- **Single binary** — frontend embedded into the Go binary via `//go:embed`, deployed as one container

---

## Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Backend        | Go, gorilla/websocket, client-go, httputil.ReverseProxy |
| Frontend       | React 19, TypeScript, Vite, TanStack Query, Recharts |
| Infrastructure | K3s on Raspberry Pi 5, Caddy, Tailscale           |
| Container      | Podman, imported into k3s containerd              |
| DNS/TLS        | Porkbun DNS-01 via Caddy xcaddy plugin            |

---

## Architecture

The dashboard aggregates three data sources into one authenticated interface:
```
┌──────────────────────────────────────────────────────────┐
│                   React SPA (browser)                    │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐   │
│  │ Pods metrics │  │ Live WebSocket │  │ ServicePatr.│   │
│  │ (TanStack)   │  │ (pods + sys)   │  │ (TanStack + │   │
│  │              │  │                │  │  SSE)       │   │
│  └──────┬───────┘  └───────┬────────┘  └──────┬──────┘   │
└─────────┼──────────────────┼──────────────────┼──────────┘
│                  │                  │
└──────────────────┼──────────────────┘
│ JWT over HTTPS (Caddy)
┌──────────────────▼────────────────────┐
│          Dashboard backend (Go)       │
│                                       │
│  ┌──────────┐  ┌──────────────────┐   │
│  │ REST API │  │ WebSocket hub    │   │
│  │ (pods,   │  │ (broadcasts      │   │
│  │ metrics, │  │ every 10s)       │   │
│  │ auth)    │  └──────────────────┘   │
│  │          │                         │
│  │          │  ┌──────────────────┐   │
│  │          │  │ ServicePatrol    │   │
│  │          │  │ reverse proxy +  │   │
│  │          │  │ health checker   │   │
│  │          │  └────────┬─────────┘   │
│  └──────┬───┘           │             │
└─────────┼───────────────┼─────────────┘
│               │
┌─────────▼──┐  ┌─────────▼─────────┐  ┌──────────────┐
│   K3s API  │  │ ServicePatrol     │  │  Prometheus  │
│ + metrics  │  │ (cluster-internal)│  │ (node_exp.)  │
└────────────┘  └───────────────────┘  └──────────────┘
```
**Why capability-gated integrations:** ServicePatrol is optional. When `SERVICEPATROL_URL` is unset, the dashboard doesn't register the proxy routes or show the nav item. A health-check goroutine polls the upstream every 10s and flips the `/api/capabilities` flag in real time, so the UI hides itself cleanly if ServicePatrol goes down.

**Why a proxy instead of direct calls:** the frontend never talks to ServicePatrol directly. Same-origin requests mean no CORS, one auth story, and a single place to add features (rate limiting, logging, etc.) across all integrated services. The proxy also handles SSE with `FlushInterval: -1` so events stream in real time without buffering.

## Project structure

```
homelab-dashboard/
├── backend/
│   ├── cmd/server/main.go
│   └── internal/
│       ├── api/
│       │   ├── handlers/       # auth, pods, metrics, capabilities
│       │   └── middleware/     # JWT auth, CORS
│       ├── auth/               # JWT + bcrypt
│       ├── config/             # env-based config
│       ├── k3s/                # client-go wrapper for pods + metrics
│       ├── prometheus/         # PromQL client
│       ├── servicepatrol/      # optional integration: health checker + proxy
│       └── ws/                 # WebSocket hub + 10s broadcaster
├── frontend/
│   └── src/
│       ├── api/client.ts       # typed fetch with auto token refresh
│       ├── components/
│       │   ├── dashboard/      # MetricsCards, PodsTable
│       │   ├── layout/         # Sidebar, AppLayout
│       │   └── servicepatrol/  # ServiceCard, Sparkline, TargetForm, TargetHistory
│       ├── hooks/              # useWebSocket, useTheme, useSettings, useCapabilities
│       │                       # useServicePatrolTargets, useServicePatrolEvents
│       ├── pages/              # Login, Dashboard, ServicePatrol
│       └── types/              # shared TypeScript types
├── deploy/                     # K8s manifests
├── setup.sh                    # first-time deploy
├── update.sh                   # incremental redeploy
└── .env.deploy.example
```

---

## Prerequisites (on the Pi)

- Go 1.21+
- Node 20+ and npm
- Podman
- K3s with metrics-server installed
- Prometheus with node_exporter scraping the node

Optional:

- [ServicePatrol](https://github.com/SandrZeus/ServicePatrol) deployed in the cluster (enables the health-monitoring UI)

---

## Deployment

### First time

```bash
git clone https://github.com/SandrZeus/homelab-dashboard
cd homelab-dashboard
cp .env.deploy.example .env.deploy
nvim .env.deploy   # fill in JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, DOMAIN
chmod +x setup.sh update.sh
./setup.sh
```

`setup.sh`:

1. Builds the React frontend with Vite
2. Copies the build into `backend/cmd/server/static/` for embedding
3. Compiles the Go binary (cross-compiled for `linux/arm64`)
4. Builds a container image with Podman and imports it into k3s
5. Generates a K8s secret from `.env.deploy`
6. Applies all manifests and waits for rollout

### Updating

```bash
git pull origin main
./update.sh
```

`update.sh` rebuilds, reapplies manifests (so env var changes take effect), and triggers a rollout.

### Caddy reverse proxy

If you are using Caddy + Porkbun, add this block to your Caddyfile:

```
dashboard.yourdomain.com {
    reverse_proxy localhost:30095
    tls {
        dns porkbun {
            api_key <your_key>
            api_secret_key <your_secret>
        }
    }
}
```

---

## Local development

```bash
# backend
cd backend
cp .env.example .env
go run ./cmd/server/main.go

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` and `/ws` to the backend on `:8081`, so the browser always makes same-origin requests. No CORS, no env configuration needed — `vite.config.ts` handles it.

To work with ServicePatrol locally, run it alongside on a different port (its default is `:8080`) and set `SERVICEPATROL_URL=http://localhost:8080` in the backend's `.env`.

---

## Environment variables

Set these at deploy time (populated into a K8s secret for sensitive ones):

| Variable            | Required | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `SERVER_PORT`       | no       | HTTP port (default: `8081`)                                                 |
| `KUBECONFIG_PATH`   | no       | Kubeconfig path (uses in-cluster config when running in K3s)                |
| `PROMETHEUS_URL`    | yes      | Prometheus base URL                                                         |
| `SERVICEPATROL_URL` | no       | ServicePatrol instance; leave empty to disable the health monitoring UI    |
| `JWT_SECRET`        | yes      | JWT signing secret                                                          |
| `ADMIN_EMAIL`       | yes      | Login email                                                                 |
| `ADMIN_PASSWORD`    | yes      | Login password (bcrypt-hashed at startup)                                   |
| `DOMAIN`            | yes      | Dashboard domain                                                            |

---

## Design decisions

- **Single binary with embedded frontend** — one artifact to deploy, no CORS between static and API, simpler K8s manifests. The tradeoff is longer builds; for a homelab that's acceptable.
- **Optional integrations as env-gated proxies** — every integration (ServicePatrol today, potentially others tomorrow) follows the same pattern: env var → capability check → reverse proxy → conditional nav. Adds a feature without coupling.
- **WebSocket for core metrics, SSE for ServicePatrol events** — WS handles the high-frequency broadcast of pod + metrics state to many clients; SSE is a better fit for the per-client real-time feed from a proxied upstream. Different tools for different shapes of data.
- **TanStack Query as the source of truth** — SSE events trigger query invalidation rather than directly mutating component state. Same pattern used for WebSocket data. One cache, all consumers agree.
- **No external state management library** — React Context for settings, TanStack Query for server state, `useState` for component-local state. Nothing more needed at this scale.
