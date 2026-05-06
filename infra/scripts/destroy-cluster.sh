#!/bin/bash
# Script to destroy the K3s cluster and all AWS resources
# WARNING: This will delete all data!

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}=== WARNING: Destroying K3s Cluster ===${NC}"
echo -e "${RED}This will delete all AWS resources and data!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

cd ../terraform

echo -e "${YELLOW}Destroying Terraform resources...${NC}"
terraform destroy -auto-approve

echo -e "${GREEN}=== Cluster destroyed ===${NC}"
echo "All AWS resources have been removed."
