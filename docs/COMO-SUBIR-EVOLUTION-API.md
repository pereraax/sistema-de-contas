# Como subir a Evolution API (VPS ou local)

Guia rápido para rodar a **Evolution API** com Docker no seu servidor (VPS) ou no seu computador.

---

## Pré-requisitos

- **VPS ou máquina** com Linux (Ubuntu 20.04+ recomendado) ou seu PC para testes.
- **Docker** e **Docker Compose** instalados.

### Instalar Docker (Ubuntu/Debian)

```bash
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER
# Faça logout e login de novo (ou reinicie) para o grupo ter efeito
```

---

## Opção 1: Subir só a Evolution (rápido para testar)

Serve para testar em poucos minutos. Para produção com muitos chats, use a Opção 2 (com banco e Redis).

### 1. Criar pasta e arquivos

```bash
mkdir evolution-api && cd evolution-api
```

Crie o arquivo **docker-compose.yml**:

```yaml
version: '3.9'
services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  evolution_instances:
```

Crie o arquivo **.env** na mesma pasta:

```bash
# Chave para autenticar na API (use uma chave forte em produção)
AUTHENTICATION_API_KEY=minha-chave-secreta-123
```

### 2. Subir o container

```bash
docker compose up -d
```

### 3. Verificar

- Acesse: **http://IP_DO_SERVIDOR:8080** (ou `http://localhost:8080` se for no seu PC).
- Se aparecer a API (Swagger ou mensagem da Evolution), está no ar.

### 4. Criar instância e conectar WhatsApp

Via interface (se a sua versão tiver) ou pela API:

```bash
# Criar instância (troque a URL e a apikey pelos seus valores)
curl -X POST "http://localhost:8080/instance/create" \
  -H "apikey: minha-chave-secreta-123" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "minha-instancia"}'
```

Depois, pegar o QR Code para conectar o WhatsApp:

```bash
curl -X GET "http://localhost:8080/instance/connect/minha-instancia" \
  -H "apikey: minha-chave-secreta-123"
```

A resposta pode trazer o QR em base64. Use o endpoint de QR da documentação da Evolution se precisar exibir na tela.

Quando a instância estiver conectada, use no seu CRM:

- **EVOLUTION_API_URL** = `http://IP_DO_SERVIDOR:8080` (ou com HTTPS se tiver domínio)
- **EVOLUTION_INSTANCE** = `minha-instancia`
- **EVOLUTION_API_KEY** = `minha-chave-secreta-123`

---

## Opção 2: Evolution + PostgreSQL + Redis (recomendado para produção)

Para produção, a Evolution recomenda usar **PostgreSQL** e **Redis**. Assim os dados e o cache ficam persistentes.

### 1. Criar pasta e docker-compose

```bash
mkdir evolution-api && cd evolution-api
```

Crie **docker-compose.yml**:

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution_pass
      POSTGRES_DB: evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U evolution"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://evolution:evolution_pass@postgres:5432/evolution
      CACHE_REDIS_ENABLED: "true"
      CACHE_REDIS_URI: redis://redis:6379
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
  evolution_instances:
```

Crie **.env**:

```bash
AUTHENTICATION_API_KEY=minha-chave-secreta-123
```

### 2. Subir

```bash
docker compose up -d
```

### 3. Verificar logs

```bash
docker compose logs -f evolution-api
```

Quando aparecer que a API está escutando na porta 8080, acesse **http://IP:8080** e crie/conecte a instância como na Opção 1.

---

## Expor para a internet (produção)

- No **VPS**: abra a porta 8080 no firewall (ufw ou painel do provedor).
- Use **HTTPS** com um proxy reverso (Nginx ou Caddy) e um domínio, por exemplo:
  - `https://evolution.seudominio.com` → proxy para `http://localhost:8080`.
- No CRM, use:
  - **EVOLUTION_API_URL** = `https://evolution.seudominio.com`

Assim o webhook do CRM (`https://SEU_DOMINIO/api/webhooks/evolution`) será chamado pela Evolution quando chegarem mensagens.

---

## Comandos úteis

| Ação | Comando |
|------|---------|
| Subir | `docker compose up -d` |
| Parar | `docker compose down` |
| Ver logs | `docker compose logs -f evolution-api` |
| Reiniciar | `docker compose restart evolution-api` |

---

## Referências

- [Evolution API – Instalação Docker (oficial)](https://doc.evolution-api.com/v2/en/install/docker)
- [Evolution API – Variáveis de ambiente](https://doc.evolution-api.com/v2/en/env)
- [Repositório Evolution API](https://github.com/EvolutionAPI/evolution-api)
