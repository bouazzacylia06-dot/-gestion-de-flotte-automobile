require('dotenv').config();

const express                   = require('express');
const cors                      = require('cors');
const { ApolloServer }          = require('@apollo/server');
const { expressMiddleware }     = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const http                      = require('http');
const bodyParser                = require('body-parser');
const typeDefs                  = require('./schema/typeDefs');
const resolvers                 = require('./resolvers');
const { extractUser }           = require('./middleware/authMiddleware');
const logger                    = require('./observability/logger');

const PORT = Number(process.env.APP_PORT || 4000);

async function startServer() {
  const app        = express();
  const httpServer = http.createServer(app);

  // Middleware globaux
  app.use(cors());
  app.use(bodyParser.json());

  // Routes de santé publiques (pour K8s probes)
  app.get('/',       (req, res) => res.send('API Gateway GraphQL - Fleet Management'));
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/ready',  (req, res) => res.status(200).json({ status: 'ready' }));

  // Création du serveur Apollo
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
    // Affiche le stack trace en développement uniquement
    formatError: (formattedError, error) => {
      logger.error({ err: error }, formattedError.message);
      if (process.env.NODE_ENV === 'production') {
        const { message, extensions } = formattedError;
        return { message, extensions };
      }
      return formattedError;
    },
  });

  await server.start();

  // Montage du middleware GraphQL sur /graphql
  // extractUser peuple req.user (null si pas de token valide)
  app.use(
    '/graphql',
    extractUser,                         // peuple req.user
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user:      req.user || null,
        authError: req.authError || null,
      }),
    }),
  );

  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

  logger.info({ port: PORT }, 'API Gateway GraphQL démarré');
  logger.info(`GraphQL endpoint : http://localhost:${PORT}/graphql`);
  logger.info(`GraphQL sandbox  : http://localhost:${PORT}/graphql (Apollo Sandbox en dev)`);
}

startServer().catch((err) => {
  logger.error({ err }, 'Erreur au démarrage de l\\'API Gateway');
  process.exit(1);
});
