FROM node:18-alpine

WORKDIR /app

# Copier package.json et installer les dépendances sur Windows AVANT
COPY package*.json ./
COPY node_modules ./node_modules

# Copier le reste du code
COPY . .

# Créer un utilisateur non-root compatible Alpine
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

USER nodejs

EXPOSE 3002

CMD ["node", "--require", "./src/observability/telemetry.js", "src/app.js"]
