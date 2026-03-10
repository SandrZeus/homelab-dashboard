# homelab-dashboard

A full-stack homelab monitoring dashboard — Go REST API + React/TypeScript SPA — running self-hosted on a Raspberry Pi 5 with K3s.

![Go](https://img.shields.io/badge/Go-1.24-00ADD8?logo=go) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![K3s](https://img.shields.io/badge/K3s-self--hosted-FFC61C?logo=kubernetes)

---

## What it does

- **Pod monitoring** — lists all pods across namespaces with status, restart count, CPU (millicores), memory, and age pulled directly from the Kubernetes API and metrics-server
- **System metrics** — CPU%, memory%, disk%, uptime, and CPU temperature sourced from Prometheus node_exporter
- **Live updates** — WebSocket connection broadcasts a full dashboard update every 10 seconds
- **JWT auth** — bcrypt-hashed credentials, 24h access token, 7-day refresh token via httpOnly cookie
- **Single binary** — frontend is embedded into the Go binary at build time via `//go:embed`, deployed as a single container

---

## Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Backend        | Go, gorilla/websocket, client-go, k8s.io/metrics |
| Frontend       | React 19, TypeScript, Vite                       |
| Infrastructure | K3s on Raspberry Pi 5, Caddy, Tailscale          |
| Container      | Podman, imported into k3s containerd             |
| DNS/TLS        | Porkbun DNS-01 via Caddy xcaddy plugin           |

---

## Project structure

```
homelab-dashboard/
├── backend/
│   ├── cmd/server/
│   │   ├── main.go          # HTTP server, routing
│   └── internal/
│       ├── api/handlers/    # auth, pods, metrics
│       ├── api/middleware/  # JWT auth, CORS
│       ├── auth/            # JWT + bcrypt
│       ├── config/          # env loading
│       ├── k3s/             # client-go wrapper
│       ├── prometheus/      # PromQL client
│       └── ws/              # WebSocket hub + broadcaster
├── frontend/
│   └── src/
│       ├── api/client.ts    # typed fetch client with auto token refresh
│       ├── components/      # MetricsCards, PodsTable, SettingsModal
│       ├── hooks/           # useWebSocket, useTheme, useSettings
│       ├── pages/           # Login, Dashboard
│       └── types/           # shared TypeScript types
├── deploy/                  # K8s manifests (namespace, rbac, deployment, service)
├── setup.sh                 # full build + deploy from scratch
├── update.sh                # rebuild + redeploy after git pull
└── .env.deploy.example      # secret template
```

---

## Prerequisites (on the Pi)

- Go 1.21+
- Node 20+ and npm
- Podman
- K3s with metrics-server installed
- Prometheus with node_exporter scraping the Pi

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

`setup.sh` will:

1. Build the React frontend with Vite
2. Copy the build into `backend/cmd/server/static/` for embedding
3. Compile the Go binary (cross-compiled for `linux/arm64`)
4. Build a container image with Podman and import it into k3s
5. Generate a K8s secret from `.env.deploy`
6. Apply all manifests and wait for rollout

### Updating after a code change

```bash
git pull origin main
./update.sh
```

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
cp .env.example .env   # set KUBECONFIG_PATH, PROMETHEUS_URL, JWT_SECRET, etc.
go run ./cmd/server/main.go

# frontend (separate terminal)
cd frontend
cp .env.development.example .env.development
npm install
npm run dev
```

The frontend dev server proxies API calls to `http://localhost:8080` via `VITE_API_URL`.

---

## Environment variables

| Variable          | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `SERVER_PORT`     | HTTP port (default: `8080`)                                                |
| `KUBECONFIG_PATH` | Path to kubeconfig (optional — uses in-cluster config when running in K3s) |
| `PROMETHEUS_URL`  | Prometheus base URL                                                        |
| `JWT_SECRET`      | Secret for signing JWTs                                                    |
| `ADMIN_EMAIL`     | Login email                                                                |
| `ADMIN_PASSWORD`  | Login password (bcrypt-hashed at startup)                                  |
| `DOMAIN`          | Your dashboard domain                                                      |

In production these are supplied via a K8s secret generated from `.env.deploy` at deploy time. The secret is never committed.
