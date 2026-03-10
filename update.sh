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
cp -r frontend/dist backend/static

echo "→ rebuilding binary..."
cd backend
go build -o ../dist/homelab-dashboard ./cmd/server/main.go
cd ..

echo "→ rebuilding image..."
cp dist/homelab-dashboard backend/homelab-dashboard
sudo docker build -t homelab-dashboard:latest backend/
sudo docker save homelab-dashboard:latest | sudo k3s ctr images import -
rm backend/homelab-dashboard

sudo kubectl rollout restart deployment/homelab-dashboard -n homelab-dashboard
sudo kubectl rollout status deployment/homelab-dashboard -n homelab-dashboard

echo "✓ updated"
