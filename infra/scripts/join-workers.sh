#!/bin/bash
# Script to join worker nodes to K3s cluster
# Run this after Terraform applies and master is ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== K3s Worker Join Script ===${NC}"

# Get outputs from Terraform
cd ../terraform

MASTER_IP=$(terraform output -raw master_public_ip)
MASTER_PRIVATE_IP=$(terraform output -raw master_private_ip)
WORKER_IPS=$(terraform output -json worker_public_ips | jq -r '.[]')
KEY_PATH=$(terraform output -raw ssh_private_key_path)

echo -e "${GREEN}Master IP: ${MASTER_IP}${NC}"
echo -e "${GREEN}Workers: ${WORKER_IPS}${NC}"

# Wait for master to be ready
echo -e "${YELLOW}Waiting for master node to be ready...${NC}"
sleep 30

# Get node token from master
echo -e "${YELLOW}Getting node token from master...${NC}"
NODE_TOKEN=$(ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@"$MASTER_IP" "sudo cat /var/lib/rancher/k3s/server/node-token")

if [ -z "$NODE_TOKEN" ]; then
    echo -e "${RED}Failed to get node token. Master may not be ready yet.${NC}"
    echo "Try running this script again in a few minutes."
    exit 1
fi

echo -e "${GREEN}Node token obtained successfully${NC}"

# Join each worker to the cluster
WORKER_INDEX=0
for WORKER_IP in $WORKER_IPS; do
    echo -e "${YELLOW}Joining worker-${WORKER_INDEX} (${WORKER_IP}) to cluster...${NC}"
    
    ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@"$WORKER_IP" << EOF
        sudo curl -sfL https://get.k3s.io | K3S_URL=https://${MASTER_PRIVATE_IP}:6443 K3S_TOKEN=${NODE_TOKEN} sh -s - agent --node-name worker-${WORKER_INDEX}
EOF
    
    echo -e "${GREEN}Worker-${WORKER_INDEX} joined successfully${NC}"
    WORKER_INDEX=$((WORKER_INDEX + 1))
done

echo -e "${GREEN}=== All workers joined! ===${NC}"

# Verify cluster
echo -e "${YELLOW}Verifying cluster nodes...${NC}"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@"$MASTER_IP" "sudo kubectl get nodes"

echo -e "${GREEN}=== Cluster setup complete! ===${NC}"
