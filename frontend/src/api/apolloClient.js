import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import keycloak from '../keycloak';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

// Injecte le token JWT dans chaque requête GraphQL
const authLink = setContext(async (_, { headers }) => {
  // Rafraîchit le token si expiré (marge de 30s)
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      keycloak.logout();
      return { headers };
    }
  }

  return {
    headers: {
      ...headers,
      ...(keycloak.token
        ? { Authorization: `Bearer ${keycloak.token}` }
        : {}),
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL] ${message}`, { locations, path });
    });
  }
  if (networkError) {
    console.error('[Network]', networkError);
  }
});

const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default apolloClient;
