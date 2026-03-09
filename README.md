# Homelab Dashboard

A self-hosted dashboard for monitoring my Raspberry Pi 5 homelab — built with Go and React/TypeScript.

## Stack

- **Backend:** Go
- **Frontend:** React + TypeScript + Vite
- **Infrastructure:** K3s on Raspberry Pi 5, served via Caddy

## Features

- [ ] K3s pod status and health monitoring
- [ ] System metrics (CPU, memory, disk) via Prometheus
- [ ] Real-time updates via WebSocket
- [ ] Uptime Kuma service status
- [ ] Forgejo activity feed
- [ ] JWT authentication

## Architecture

```
frontend (React/TS) → Go REST API → K3s API
                                  → Prometheus
                                  → Uptime Kuma
                                  → Forgejo
```

## Running locally

### Backend

```bash
cd backend
cp .env.example .env  # fill in your values
go run ./cmd/server/main.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Endpoints

| Method | Path        | Description  |
| ------ | ----------- | ------------ |
| GET    | `/health`   | Health check |
| GET    | `/api/pods` | K3s pod list |

