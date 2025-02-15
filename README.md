# Conversor de Arquivos para PDF com NestJS, FastAPI e Next.js

Este projeto é um sistema de conversão de arquivos para PDF, desenvolvido com **NestJS** no backend para gerenciar autenticação, upload de arquivos e gestão de usuários, **FastAPI** para realizar a conversão dos arquivos, e **Next.js** no frontend para uma interface moderna e responsiva. O sistema utiliza **JWT** para autenticação, **AWS S3** para armazenamento de arquivos, **Redis** para controle de limites de uploads diários e **Socket.IO** para comunicação em tempo real sobre o status das conversões.

## Funcionalidades

- **Autenticação segura com JWT**:  
  O backend em NestJS gerencia a autenticação dos usuários, garantindo acesso seguro ao sistema.

- **Upload de arquivos via pre-signed URL do S3**:  
  O backend gera URLs pré-assinadas para que o frontend faça o upload dos arquivos diretamente para o **Amazon S3**, garantindo segurança e eficiência.

- **Limite de uploads diários com Redis**:  
  Cada usuário pode enviar até **3 arquivos por dia**. O Redis armazena essa contagem, e um **scheduler** no NestJS reseta o contador diariamente.

- **Conversão de arquivos com FastAPI e LibreOffice**:  
  Um serviço separado em **FastAPI** realiza a conversão dos arquivos para PDF. Ele baixa o arquivo do S3, utiliza o **LibreOffice** para a conversão e reenvia o arquivo convertido de volta ao S3.

- **Status de conversão em tempo real com Socket.IO**:  
  O sistema utiliza **Socket.IO** para notificar o frontend e o backend sobre o status da conversão, que pode ser **awaiting**, **queue**, **processing** ou **done**. Isso permite que os usuários sejam informados em tempo real sobre o progresso de suas conversões.

- **Gestão de usuários e arquivos**:  
  O backend em NestJS gerencia os usuários e seus arquivos, mantendo um registro de todos os uploads e conversões realizadas.

- **Interface moderna com Next.js e SCSS**:  
  O frontend desenvolvido em **Next.js** oferece uma interface responsiva e amigável, com estilos personalizados utilizando **SCSS**.

- **Dockerização completa**:  
  Todo o sistema é containerizado com **Docker**, facilitando a implantação e o gerenciamento em diferentes ambientes.

## Tecnologias Utilizadas

- **Backend**: NestJS (autenticação, gestão de usuários, geração de pre-signed URLs, scheduler, Socket.IO).
- **Conversão de arquivos**: FastAPI + LibreOffice.
- **Armazenamento**: Amazon S3.
- **Controle de limites**: Redis.
- **Frontend**: Next.js com SCSS.
- **Comunicação em tempo real**: Socket.IO.
- **Containerização**: Docker.

## Fluxo do Sistema

1. **Autenticação**: O usuário faz login e recebe um token JWT.
2. **Upload de arquivo**: O backend gera uma pre-signed URL para o S3, e o frontend faz o upload do arquivo.
3. **Controle de limites**: O Redis verifica se o usuário ainda pode enviar arquivos no dia.
4. **Conversão**: O FastAPI baixa o arquivo do S3, converte para PDF usando LibreOffice e reenvia o arquivo convertido.
5. **Status em tempo real**: O Socket.IO notifica o frontend sobre o status da conversão.
6. **Gestão de arquivos**: O backend atualiza o banco de dados com o status final e o link do arquivo convertido.

Este projeto é ideal para quem precisa de uma solução robusta e escalável para conversão de arquivos em PDF, com controle de acesso, limites de uso e notificações em tempo real.

![image](https://github.com/user-attachments/assets/a151b3e0-5b0e-4d00-9b40-5036c6c1ee0e)
![image](https://github.com/user-attachments/assets/fda4b180-252c-4104-93fd-74402ba310bf)
![image](https://github.com/user-attachments/assets/abe81703-1177-4e53-9114-06e4f5a0cd4b)
