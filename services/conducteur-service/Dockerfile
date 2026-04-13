# Étape 1 : Build stage
FROM node:18-alpine AS builder

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de configuration de npm
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste du projet
COPY . .

# Étape 2 : Production stage
FROM node:18-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Créer un utilisateur non-root pour des raisons de sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les fichiers construits depuis le build stage
COPY --from=builder --chown=nodejs:nodejs /app .

# Définir l'utilisateur non-root
USER nodejs

# Exposer le port sur lequel l'application écoute
EXPOSE 3001

# Commande pour démarrer l'application
CMD ["node", "src/app.js"]

