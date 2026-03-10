#!/bin/bash
set -e

if [ ! -f .env.deploy ]; then
  echo "✗ .env.deploy not found. Copy .env.deploy.example and fill in your values."
  exit 1
fi
source .env.deploy

echo "→ building frontend..."
cd frontend
npm install --silent
npm run build
cd ..

echo "→ copying frontend build into backend..."
rm -rf backend/static
cp -r frontend/dist backend/static

echo "→ building Go binary..."
cd backend
go build -o ../dist/homelab-dashboard ./cmd/server/main.go
cd ..

echo "→ building Docker image..."
cp dist/homelab-dashboard backend/homelab-dashboard
sudo docker build -t docker.io/library/homelab-dashboard:latest backend/
sudo docker save docker.io/library/homelab-dashboard:latest | sudo k3s ctr images import -
rm backend/homelab-dashboard

echo "→ generating secrets..."
cat > /tmp/hld-secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: homelab-dashboard-secret
  namespace: homelab-dashboard
type: Opaque
stringData:
  JWT_SECRET: "$JWT_SECRET"
  ADMIN_EMAIL: "$ADMIN_EMAIL"
  ADMIN_PASSWORD: "$ADMIN_PASSWORD"
  DOMAIN: "$DOMAIN"
EOF

echo "→ applying manifests..."
sudo kubectl apply -f deploy/namespace.yaml
sudo kubectl apply -f deploy/rbac.yaml
sudo kubectl apply -f /tmp/hld-secret.yaml
sudo kubectl apply -f deploy/deployment.yaml
sudo kubectl apply -f deploy/service.yaml
sudo kubectl rollout restart deployment/homelab-dashboard -n homelab-dashboard
sudo kubectl rollout status deployment/homelab-dashboard -n homelab-dashboard

echo "✓ deployed → https://$DOMAIN"
