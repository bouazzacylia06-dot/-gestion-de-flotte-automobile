# ─── Stage 1 : Build Vite ────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Passer les VITE_* comme build args pour les baker dans le bundle
ARG VITE_KEYCLOAK_URL=http://localhost:8080
ARG VITE_KEYCLOAK_REALM=flotte
ARG VITE_KEYCLOAK_CLIENT_ID=flotte-app
ARG VITE_GRAPHQL_URL=http://localhost:4000/graphql
ARG VITE_API_URL=http://localhost:4000

ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Stage 2 : Serve avec nginx ───────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
