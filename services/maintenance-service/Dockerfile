<<<<<<< HEAD
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
=======
# Étape 1 : Build stage
FROM node:18-alpine AS builder

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de configuration de npm
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

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
EXPOSE 3002

# Commande pour démarrer l'application
CMD ["node", "src/app.js"]

>>>>>>> f6744b537b40886e59861b781c122c56d941867f
