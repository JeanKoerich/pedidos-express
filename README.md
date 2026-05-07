# Pedidos Express

O **Pedidos Express** é uma aplicação desenvolvida para a disciplina de Computação em Nuvem, com o objetivo de aplicar na prática conceitos de containers, banco de dados, balanceamento de carga, Kubernetes e infraestrutura em nuvem utilizando AWS.

O projeto simula um sistema de pedidos para uma lanchonete, contendo uma interface para o cliente realizar pedidos e uma tela de cozinha para acompanhar os pedidos em tempo real.

## Objetivo do Projeto

O objetivo deste trabalho é colocar em prática os conceitos e tecnologias estudados durante a disciplina, desenvolvendo uma estrutura funcional na AWS com aplicação conteinerizada, banco de dados, cluster Kubernetes e publicação das aplicações na internet.

A proposta contempla:

- Criação e configuração de um cluster Kubernetes na AWS com K3s;
- Estrutura com 1 nó master e 2 nós workers;
- Desenvolvimento de uma aplicação com frontend, backend e banco de dados;
- Publicação das imagens do frontend e backend no Docker Hub;
- Criação dos deployments no Kubernetes;
- Publicação da aplicação compilada na internet;
- Utilização de balanceadores de carga;
- Persistência das informações em banco de dados.

## Tecnologias Utilizadas

- Next.js
- React
- Node.js
- Express
- PostgreSQL
- Docker
- Docker Compose
- Docker Hub
- Kubernetes
- K3s
- AWS EC2
- Load Balancer

## Arquitetura da Aplicação

A aplicação foi separada em três partes principais:

```txt
Frontend → Backend → Banco de Dados PostgreSQL
