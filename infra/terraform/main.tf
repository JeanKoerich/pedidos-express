# Terraform configuration for K3s cluster on AWS
# Region: us-east-1
# Instances: 1 master + 2 workers (t3.medium)

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Name of the K3s cluster"
  default     = "pedidos-express-k3s"
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t3.medium"
}

variable "master_count" {
  description = "Number of master nodes"
  default     = 1
}

variable "worker_count" {
  description = "Number of worker nodes"
  default     = 2
}

# Data sources
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "k3s_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.cluster_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "k3s_igw" {
  vpc_id = aws_vpc.k3s_vpc.id

  tags = {
    Name = "${var.cluster_name}-igw"
  }
}

# Public Subnet
resource "aws_subnet" "k3s_public" {
  vpc_id                  = aws_vpc.k3s_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.cluster_name}-public-subnet"
  }
}

# Route Table
resource "aws_route_table" "k3s_public" {
  vpc_id = aws_vpc.k3s_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.k3s_igw.id
  }

  tags = {
    Name = "${var.cluster_name}-public-rt"
  }
}

resource "aws_route_table_association" "k3s_public" {
  subnet_id      = aws_subnet.k3s_public.id
  route_table_id = aws_route_table.k3s_public.id
}

# Security Group
resource "aws_security_group" "k3s_sg" {
  name        = "${var.cluster_name}-sg"
  description = "Security group for K3s cluster"
  vpc_id      = aws_vpc.k3s_vpc.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  # K3s API Server
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "K3s API Server"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # NodePort range
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "NodePort Services"
  }

  # Internal cluster communication
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
    description = "Internal cluster communication"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-sg"
  }
}

# SSH Key Pair
resource "tls_private_key" "k3s_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "k3s_keypair" {
  key_name   = "${var.cluster_name}-key"
  public_key = tls_private_key.k3s_key.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.k3s_key.private_key_pem
  filename        = "${path.module}/k3s-key.pem"
  file_permission = "0400"
}

# Master Node
resource "aws_instance" "k3s_master" {
  count         = var.master_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.k3s_public.id
  key_name      = aws_key_pair.k3s_keypair.key_name

  vpc_security_group_ids = [aws_security_group.k3s_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Install K3s as server (master)
    curl -sfL https://get.k3s.io | sh -s - server \
      --write-kubeconfig-mode 644 \
      --tls-san $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) \
      --node-name master-${count.index}
    
    # Wait for K3s to be ready
    sleep 30
    
    # Save node token for workers
    cat /var/lib/rancher/k3s/server/node-token > /home/ubuntu/node-token
    chmod 644 /home/ubuntu/node-token
    
    # Install kubectl alias
    echo 'alias k=kubectl' >> /home/ubuntu/.bashrc
  EOF

  tags = {
    Name = "${var.cluster_name}-master-${count.index}"
    Role = "master"
  }
}

# Worker Nodes
resource "aws_instance" "k3s_worker" {
  count         = var.worker_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.k3s_public.id
  key_name      = aws_key_pair.k3s_keypair.key_name

  vpc_security_group_ids = [aws_security_group.k3s_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  depends_on = [aws_instance.k3s_master]

  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Wait for master to be ready (give it time to initialize)
    sleep 120
    
    # Install K3s as agent (worker)
    # Note: Replace K3S_URL and K3S_TOKEN in the join script after master is ready
    
    echo "Worker node ${count.index} ready for K3s agent installation"
    echo "Run the join script manually after master initialization"
  EOF

  tags = {
    Name = "${var.cluster_name}-worker-${count.index}"
    Role = "worker"
  }
}

# Outputs
output "master_public_ip" {
  description = "Public IP of master node"
  value       = aws_instance.k3s_master[0].public_ip
}

output "master_private_ip" {
  description = "Private IP of master node"
  value       = aws_instance.k3s_master[0].private_ip
}

output "worker_public_ips" {
  description = "Public IPs of worker nodes"
  value       = aws_instance.k3s_worker[*].public_ip
}

output "worker_private_ips" {
  description = "Private IPs of worker nodes"
  value       = aws_instance.k3s_worker[*].private_ip
}

output "ssh_private_key_path" {
  description = "Path to SSH private key"
  value       = local_file.private_key.filename
}

output "ssh_command_master" {
  description = "SSH command to connect to master"
  value       = "ssh -i ${local_file.private_key.filename} ubuntu@${aws_instance.k3s_master[0].public_ip}"
}

output "kubeconfig_command" {
  description = "Command to get kubeconfig from master"
  value       = "scp -i ${local_file.private_key.filename} ubuntu@${aws_instance.k3s_master[0].public_ip}:/etc/rancher/k3s/k3s.yaml ./kubeconfig.yaml"
}
