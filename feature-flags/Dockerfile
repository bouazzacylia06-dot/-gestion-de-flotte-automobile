FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY index.js flags.json ./
EXPOSE 3006
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3006/health || exit 1
CMD ["node", "index.js"]
