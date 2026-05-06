#!/bin/bash
# Script to deploy Pedidos Express application to K3s cluster

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Deploying Pedidos Express ===${NC}"

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}kubectl is not configured. Run setup-kubeconfig.sh first.${NC}"
    exit 1
fi

# Navigate to k8s manifests directory
cd ../../k8s

echo -e "${YELLOW}Applying Kubernetes manifests...${NC}"

# Apply using kustomize
kubectl apply -k .

echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --namespace=pedidos-express \
  --for=condition=ready pod \
  --selector=app=postgres \
  --timeout=120s

echo -e "${YELLOW}Initializing database...${NC}"
kubectl apply -f init-db-job.yaml

# Wait for job to complete
kubectl wait --namespace=pedidos-express \
  --for=condition=complete job/init-database \
  --timeout=60s || true

echo -e "${YELLOW}Waiting for all pods to be ready...${NC}"
kubectl wait --namespace=pedidos-express \
  --for=condition=ready pod \
  --selector=app=backend \
  --timeout=120s

kubectl wait --namespace=pedidos-express \
  --for=condition=ready pod \
  --selector=app=frontend \
  --timeout=120s

echo -e "${GREEN}=== Deployment complete! ===${NC}"
echo ""

# Get access info
cd ../terraform
MASTER_IP=$(terraform output -raw master_public_ip 2>/dev/null || echo "unknown")

echo -e "${GREEN}Application URLs:${NC}"
echo "  Frontend: http://${MASTER_IP}:30000"
echo "  Backend API: http://${MASTER_IP}:30001"
echo "  Backend Health: http://${MASTER_IP}:30001/health"
echo ""
echo -e "${GREEN}Cluster Status:${NC}"
kubectl get pods -n pedidos-express
echo ""
kubectl get services -n pedidos-express
