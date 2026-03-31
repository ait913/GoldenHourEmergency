FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/index.ts"]
