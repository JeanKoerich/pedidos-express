# Terraform variables for K3s cluster
# Customize these values as needed

aws_region    = "us-east-1"
cluster_name  = "pedidos-express-k3s"
instance_type = "t3.medium"
master_count  = 1
worker_count  = 2
