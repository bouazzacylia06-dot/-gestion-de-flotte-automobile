# Multi-stage build pour production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Production stage
FROM node:18-alpine
WORKDIR /app
# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
# Copier les fichiers depuis le stage builder avec le bon propriétaire
COPY --from=builder --chown=nodejs:nodejs /app .
USER nodejs
EXPOSE 3002
CMD ["node", "--require", "./src/observability/telemetry.js", "src/app.js"]
