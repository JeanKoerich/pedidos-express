# Infraestrutura AWS com K3s - Pedidos Express

Este diretório contém toda a infraestrutura necessária para deploy do sistema Pedidos Express em um cluster Kubernetes (K3s) na AWS.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS VPC                              │
│                     (10.0.0.0/16)                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Public Subnet (10.0.1.0/24)              │ │
│  │                                                        │ │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐        │ │
│  │  │  Master  │    │ Worker-0 │    │ Worker-1 │        │ │
│  │  │ t3.medium│    │ t3.medium│    │ t3.medium│        │ │
│  │  │   K3s    │◄───│   K3s    │───►│   K3s    │        │ │
│  │  │  Server  │    │  Agent   │    │  Agent   │        │ │
│  │  └──────────┘    └──────────┘    └──────────┘        │ │
│  │                                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                    Internet Gateway                         │
└───────────────────────────│─────────────────────────────────┘
                            │
                         Internet
```

## Pré-requisitos

1. **AWS CLI** configurado com credenciais
2. **Terraform** >= 1.0
3. **Docker** para build das imagens
4. **kubectl** para gerenciar o cluster
5. **jq** para processamento de JSON

### Instalação das ferramentas

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip && sudo mv terraform /usr/local/bin/

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# jq
sudo apt-get install jq
```

## Deploy Completo

### 1. Configurar credenciais AWS

```bash
aws configure
# AWS Access Key ID: <sua-access-key>
# AWS Secret Access Key: <sua-secret-key>
# Default region name: us-east-1
# Default output format: json
```

### 2. Build e Push das imagens Docker

```bash
cd infra/scripts
chmod +x *.sh

# Login no Docker Hub
docker login

# Build e push das imagens
./build-and-push.sh 1.0.0
```

### 3. Criar infraestrutura AWS

```bash
cd ../terraform

# Inicializar Terraform
terraform init

# Verificar o plano
terraform plan

# Aplicar (criar recursos)
terraform apply
```

### 4. Configurar workers do K3s

Aguarde ~3 minutos após o `terraform apply` para o master inicializar, depois:

```bash
cd ../scripts
./join-workers.sh
```

### 5. Configurar kubeconfig local

```bash
./setup-kubeconfig.sh
```

### 6. Deploy da aplicação

```bash
./deploy-app.sh
```

## Acessando a Aplicação

Após o deploy, a aplicação estará disponível em:

- **Frontend**: `http://<MASTER_IP>:30000`
- **Backend API**: `http://<MASTER_IP>:30001`
- **Health Check**: `http://<MASTER_IP>:30001/health`

O IP do master pode ser obtido com:
```bash
cd terraform
terraform output master_public_ip
```

## Comandos Úteis

### Verificar cluster
```bash
kubectl get nodes
kubectl get pods -n pedidos-express
kubectl get services -n pedidos-express
```

### Logs dos pods
```bash
kubectl logs -f deployment/frontend -n pedidos-express
kubectl logs -f deployment/backend -n pedidos-express
```

### Acessar pod
```bash
kubectl exec -it deployment/backend -n pedidos-express -- sh
```

### SSH no master
```bash
cd terraform
ssh -i k3s-key.pem ubuntu@$(terraform output -raw master_public_ip)
```

## Atualização da Aplicação

1. Faça as alterações no código
2. Build e push nova versão:
   ```bash
   ./build-and-push.sh 1.1.0
   ```
3. Atualize a versão nos arquivos `k8s/backend.yaml` e `k8s/frontend.yaml`
4. Aplique as mudanças:
   ```bash
   kubectl apply -k k8s/
   ```

## Destruir Infraestrutura

```bash
cd infra/scripts
./destroy-cluster.sh
```

## Custos Estimados

| Recurso | Quantidade | Tipo | Custo/Mês (aprox.) |
|---------|------------|------|-------------------|
| EC2 | 3 | t3.medium | ~$90 |
| EBS | 3 x 30GB | gp3 | ~$7 |
| Data Transfer | - | - | ~$5-10 |
| **Total** | | | **~$100-110/mês** |

## Troubleshooting

### Workers não conectam
1. Verifique se o master está rodando: `ssh ubuntu@<master-ip> sudo kubectl get nodes`
2. Verifique o token: `ssh ubuntu@<master-ip> sudo cat /var/lib/rancher/k3s/server/node-token`
3. Reinicie o script: `./join-workers.sh`

### Pods não iniciam
```bash
kubectl describe pod <pod-name> -n pedidos-express
kubectl logs <pod-name> -n pedidos-express
```

### Erro de conexão com banco
1. Verifique se o PostgreSQL está rodando
2. Verifique os secrets: `kubectl get secrets -n pedidos-express`
