#!/bin/bash
# Script to setup local kubeconfig for K3s cluster
# Run this after workers have joined

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Setting up kubeconfig ===${NC}"

cd ../terraform

MASTER_IP=$(terraform output -raw master_public_ip)
KEY_PATH=$(terraform output -raw ssh_private_key_path)

# Create .kube directory if it doesn't exist
mkdir -p ~/.kube

# Download kubeconfig from master
echo -e "${YELLOW}Downloading kubeconfig from master...${NC}"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@"$MASTER_IP":/etc/rancher/k3s/k3s.yaml ./kubeconfig.yaml

# Replace localhost with master public IP
sed -i.bak "s/127.0.0.1/${MASTER_IP}/g" kubeconfig.yaml
rm kubeconfig.yaml.bak 2>/dev/null || true

# Backup existing kubeconfig
if [ -f ~/.kube/config ]; then
    cp ~/.kube/config ~/.kube/config.backup
    echo -e "${YELLOW}Existing kubeconfig backed up to ~/.kube/config.backup${NC}"
fi

# Copy to default location
cp kubeconfig.yaml ~/.kube/config
chmod 600 ~/.kube/config

echo -e "${GREEN}Kubeconfig setup complete!${NC}"
echo ""
echo "Test the connection with:"
echo "  kubectl get nodes"
echo ""
echo "Or use the kubeconfig file directly:"
echo "  kubectl --kubeconfig=./kubeconfig.yaml get nodes"
