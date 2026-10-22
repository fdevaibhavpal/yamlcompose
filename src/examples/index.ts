export interface ComposeExample {
  id: string;
  name: string;
  yaml: string;
}

const basic: ComposeExample = {
  id: "basic",
  name: "Basic App",
  yaml: `version: '3.8'
services:
  web:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api

  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=app
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
`,
};

const nextNodePostgres: ComposeExample = {
  id: "next-node-postgres",
  name: "Next.js + Node + PostgreSQL",
  yaml: `version: '3.8'
services:
  frontend:
    image: node:22
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    image: node:22
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
`,
};

const nodeRedis: ComposeExample = {
  id: "node-redis",
  name: "Node + Redis",
  yaml: `version: '3.8'
services:
  api:
    image: node:22
    ports:
      - "8000:8000"
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
`,
};

const microservices: ComposeExample = {
  id: "microservices",
  name: "Microservices",
  yaml: `version: '3.8'
services:
  gateway:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - auth-service
      - orders-service
      - inventory-service

  auth-service:
    build: ./auth
    depends_on:
      - postgres
      - redis

  orders-service:
    build: ./orders
    depends_on:
      - postgres
      - kafka

  inventory-service:
    build: ./inventory
    depends_on:
      - postgres
      - kafka

  worker:
    build: ./worker
    depends_on:
      - kafka
      - redis
    restart: on-failure

  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7

  kafka:
    image: bitnami/kafka:3.6
    depends_on:
      - zookeeper

  zookeeper:
    image: bitnami/zookeeper:3.9

volumes:
  postgres_data:
`,
};

const nginxApiWorker: ComposeExample = {
  id: "nginx-api-worker",
  name: "Nginx + API + Worker",
  yaml: `version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api

  api:
    build: ./api
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  worker:
    build: ./worker
    depends_on:
      - redis
      - postgres
    restart: on-failure

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=app
      - POSTGRES_PASSWORD=supersecret
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7

volumes:
  postgres_data:
`,
};

const fullSaas: ComposeExample = {
  id: "full-saas",
  name: "Full SaaS Stack",
  yaml: `version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
      - rabbitmq
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s

  worker:
    build: ./worker
    depends_on:
      - rabbitmq
      - postgres
    restart: on-failure

  scheduler:
    build: ./scheduler
    depends_on:
      - redis
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=saas
      - POSTGRES_PASSWORD=changeme
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
    volumes:
      - minio_data:/data
    command: server /data

volumes:
  postgres_data:
  redis_data:
  minio_data:
`,
};

const monitoringStack: ComposeExample = {
  id: "monitoring-stack",
  name: "Monitoring Stack",
  yaml: `version: '3.8'
services:
  app:
    build: ./app
    ports:
      - "8000:8000"
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    depends_on:
      - app

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    volumes:
      - grafana_data:/var/lib/grafana

  loki:
    image: grafana/loki
    ports:
      - "3100:3100"

  jaeger:
    image: jaegertracing/all-in-one
    ports:
      - "16686:16686"

volumes:
  postgres_data:
  grafana_data:
`,
};

const aiApplication: ComposeExample = {
  id: "ai-application",
  name: "AI Application",
  yaml: `version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api

  api:
    build: ./api
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - qdrant
      - ollama

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  worker:
    build: ./worker
    depends_on:
      - redis
      - qdrant
    restart: on-failure

  redis:
    image: redis:7

  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  ollama_data:
  qdrant_data:
  postgres_data:
`,
};

export const EXAMPLES: ComposeExample[] = [
  basic,
  nextNodePostgres,
  nodeRedis,
  microservices,
  nginxApiWorker,
  fullSaas,
  monitoringStack,
  aiApplication,
];

export const DEFAULT_EXAMPLE = nextNodePostgres;
