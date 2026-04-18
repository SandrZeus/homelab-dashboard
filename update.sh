#!/bin/bash
set -e

if [ ! -f .env.deploy ]; then
  echo "✗ .env.deploy not found. Copy .env.deploy.example and fill in your values."
  exit 1
fi
source .env.deploy

echo "→ rebuilding frontend..."
cd frontend
npm install --silent
npm run build
cd ..
rm -rf backend/static
cp -r frontend/dist/* backend/cmd/server/static/

echo "→ rebuilding binary..."
cd backend
go build -o ../dist/homelab-dashboard ./cmd/server/
cd ..

echo "→ rebuilding image..."
cp dist/homelab-dashboard backend/homelab-dashboard
sudo podman build --no-cache -t docker.io/library/homelab-dashboard:latest backend/
sudo podman save docker.io/library/homelab-dashboard:latest | sudo k3s ctr images import -
rm backend/homelab-dashboard

echo "→ applying manifests..."
sudo kubectl apply -f deploy/

echo "→ restarting deployment..."
sudo kubectl rollout restart deployment/homelab-dashboard -n homelab-dashboard
sudo kubectl rollout status deployment/homelab-dashboard -n homelab-dashboard

echo "✓ updated"
