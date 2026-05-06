#!/bin/bash
# Script to build and push Docker images to Docker Hub
# Usage: ./build-and-push.sh [version]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DOCKER_USERNAME="jeankoerich"
VERSION=${1:-"1.0.0"}
FRONTEND_IMAGE="${DOCKER_USERNAME}/pedidos-express-frontend"
BACKEND_IMAGE="${DOCKER_USERNAME}/pedidos-express-backend"

echo -e "${YELLOW}=== Building and Pushing Docker Images ===${NC}"
echo "Version: ${VERSION}"
echo "Frontend: ${FRONTEND_IMAGE}"
echo "Backend: ${BACKEND_IMAGE}"
echo ""

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username: ${DOCKER_USERNAME}"; then
    echo -e "${YELLOW}Please login to Docker Hub:${NC}"
    docker login
fi

# Navigate to project root
cd ../..

# Build Frontend
echo -e "${YELLOW}Building frontend image...${NC}"
docker build -t ${FRONTEND_IMAGE}:${VERSION} -t ${FRONTEND_IMAGE}:latest -f Dockerfile .

# Build Backend
echo -e "${YELLOW}Building backend image...${NC}"
docker build -t ${BACKEND_IMAGE}:${VERSION} -t ${BACKEND_IMAGE}:latest -f backend/Dockerfile ./backend

# Push Frontend
echo -e "${YELLOW}Pushing frontend image...${NC}"
docker push ${FRONTEND_IMAGE}:${VERSION}
docker push ${FRONTEND_IMAGE}:latest

# Push Backend
echo -e "${YELLOW}Pushing backend image...${NC}"
docker push ${BACKEND_IMAGE}:${VERSION}
docker push ${BACKEND_IMAGE}:latest

echo -e "${GREEN}=== Images pushed successfully! ===${NC}"
echo ""
echo "Images available at:"
echo "  ${FRONTEND_IMAGE}:${VERSION}"
echo "  ${FRONTEND_IMAGE}:latest"
echo "  ${BACKEND_IMAGE}:${VERSION}"
echo "  ${BACKEND_IMAGE}:latest"
echo ""
echo "To update the Kubernetes deployment, edit k8s/backend.yaml and k8s/frontend.yaml"
echo "with the new version, then run: kubectl apply -k k8s/"
