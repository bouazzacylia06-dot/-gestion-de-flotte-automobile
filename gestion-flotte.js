const { ApolloServer } = require('apollo-server');
const axios = require('axios');

// URLs des services via noms Docker (fallback localhost pour dev local)
const VEHICLE_URL   = process.env.VEHICLE_SERVICE_URL   || 'http://localhost:3000';
const DRIVER_URL    = process.env.DRIVER_SERVICE_URL    || 'http://localhost:3001';
const MAINT_URL     = process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:3002';
const LOCATION_URL  = process.env.LOCATION_SERVICE_URL  || 'http://localhost:3003';
const EVENT_URL     = process.env.EVENT_SERVICE_URL     || 'http://localhost:3004';

const typeDefs = `#graphql
  # --- Véhicule ---
  type Vehicule {
    id: ID!
    immatriculation: String!
    marque: String!
    modele: String!
    statut: String!
  }

  input VehiculeInput {
    immatriculation: String!
    marque: String!
    modele: String!
    statut: String!
  }

  # --- Conducteur ---
  type Conducteur {
    id: ID!
    nom: String!
    prenom: String!
    numeroPermis: String!
    statut: String!
  }

  input ConducteurInput {
    nom: String!
    prenom: String!
    numeroPermis: String!
    statut: String!
  }

  # --- Maintenance ---
  type Maintenance {
    id: ID!
    vehicleId: ID!
    date: String!
    type: String!
    status: String!
    cost: Float!
  }

  input MaintenanceInput {
    vehicleId: ID!
    date: String!
    type: String!
    status: String!
    cost: Float!
  }

  # --- Localisation ---
  type Localisation {
    id: ID!
    vehiculeId: ID!
    latitude: Float!
    longitude: Float!
    speed: Float
    heading: Float
    timestamp: String!
  }

  input LocalisationInput {
    vehiculeId: ID!
    latitude: Float!
    longitude: Float!
    timestamp: String!
  }

  # --- Evenement ---
  type Evenement {
    id: ID!
    vehiculeId: ID!
    type: String!
    description: String!
    date: String!
  }

  input EvenementInput {
    vehiculeId: ID!
    type: String!
    description: String!
    date: String!
  }

  type Query {
    vehicules: [Vehicule!]!
    vehicule(id: ID!): Vehicule

    conducteurs: [Conducteur!]!
    conducteur(id: ID!): Conducteur

    maintenances: [Maintenance!]!
    maintenance(id: ID!): Maintenance

    localisations: [Localisation!]!
    localisation(id: ID!): Localisation
    positionHistory(vehicleId: ID!, from: String, to: String, limit: Int): [Localisation!]!
    vehiculeLastPosition(vehicleId: ID!): Localisation

    evenements: [Evenement!]!
    evenement(id: ID!): Evenement
  }

  type Mutation {
    createVehicule(input: VehiculeInput!): Vehicule!
    updateVehicule(id: ID!, input: VehiculeInput!): Vehicule!
    deleteVehicule(id: ID!): Boolean!

    createConducteur(input: ConducteurInput!): Conducteur!
    updateConducteur(id: ID!, input: ConducteurInput!): Conducteur!
    deleteConducteur(id: ID!): Boolean!

    createMaintenance(input: MaintenanceInput!): Maintenance!
    updateMaintenance(id: ID!, input: MaintenanceInput!): Maintenance!
    deleteMaintenance(id: ID!): Boolean!

    createLocalisation(input: LocalisationInput!): Localisation!
    deleteLocalisation(id: ID!): Boolean!

    createEvenement(input: EvenementInput!): Evenement!
    deleteEvenement(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    vehicules: async (_, __, { authHeader }) => {
      const { data } = await axios.get(`${VEHICLE_URL}/vehicles`, { headers: { Authorization: authHeader } });
      return data;
    },
    vehicule: async (_, { id }, { authHeader }) => {
      const { data } = await axios.get(`${VEHICLE_URL}/vehicles/${id}`, { headers: { Authorization: authHeader } });
      return data;
    },

    conducteurs: async (_, __, { authHeader }) => {
      const { data } = await axios.get(`${DRIVER_URL}/conducteurs`, { headers: { Authorization: authHeader } });
      return data;
    },
    conducteur: async (_, { id }, { authHeader }) => {
      const { data } = await axios.get(`${DRIVER_URL}/conducteurs/${id}`, { headers: { Authorization: authHeader } });
      return data;
    },

    maintenances: async (_, __, { authHeader }) => {
      const { data } = await axios.get(`${MAINT_URL}/maintenance`, { headers: { Authorization: authHeader } });
      return data;
    },
    maintenance: async (_, { id }, { authHeader }) => {
      const { data } = await axios.get(`${MAINT_URL}/maintenance/${id}`, { headers: { Authorization: authHeader } });
      return data;
    },

    localisations: async (_, __, { authHeader }) => {
      const { data } = await axios.get(`${LOCATION_URL}/localisations`, { headers: { Authorization: authHeader } });
      return data;
    },
    localisation: async (_, { id }, { authHeader }) => {
      const { data } = await axios.get(`${LOCATION_URL}/localisations/${id}`, { headers: { Authorization: authHeader } });
      return data;
    },
    positionHistory: async (_, { vehicleId, from, to, limit = 500 }, { authHeader }) => {
      const params = new URLSearchParams();
      if (from)  params.append('from', from);
      if (to)    params.append('to', to);
      params.append('limit', String(limit));
      const { data } = await axios.get(
        `${LOCATION_URL}/localisations/history/${vehicleId}?${params}`,
        { headers: { Authorization: authHeader } }
      );
      return data;
    },
    vehiculeLastPosition: async (_, { vehicleId }, { authHeader }) => {
      const { data } = await axios.get(
        `${LOCATION_URL}/localisations/last/${vehicleId}`,
        { headers: { Authorization: authHeader } }
      );
      return data;
    },

    evenements: async (_, __, { authHeader }) => {
      const { data } = await axios.get(`${EVENT_URL}/evenements`, { headers: { Authorization: authHeader } });
      return data;
    },
    evenement: async (_, { id }, { authHeader }) => {
      const { data } = await axios.get(`${EVENT_URL}/evenements/${id}`, { headers: { Authorization: authHeader } });
      return data;
    },
  },

  Mutation: {
    createVehicule: async (_, { input }, { authHeader }) => {
      const { data } = await axios.post(`${VEHICLE_URL}/vehicles`, input, { headers: { Authorization: authHeader } });
      return data;
    },
    updateVehicule: async (_, { id, input }, { authHeader }) => {
      const { data } = await axios.put(`${VEHICLE_URL}/vehicles/${id}`, input, { headers: { Authorization: authHeader } });
      return data;
    },
    deleteVehicule: async (_, { id }, { authHeader }) => {
      await axios.delete(`${VEHICLE_URL}/vehicles/${id}`, { headers: { Authorization: authHeader } });
      return true;
    },

    createConducteur: async (_, { input }, { authHeader }) => {
      const { data } = await axios.post(`${DRIVER_URL}/conducteurs`, input, { headers: { Authorization: authHeader } });
      return data;
    },
    updateConducteur: async (_, { id, input }, { authHeader }) => {
      const { data } = await axios.put(`${DRIVER_URL}/conducteurs/${id}`, input, { headers: { Authorization: authHeader } });
      return data;
    },
    deleteConducteur: async (_, { id }, { authHeader }) => {
      await axios.delete(`${DRIVER_URL}/conducteurs/${id}`, { headers: { Authorization: authHeader } });
      return true;
    },

    createMaintenance: async (_, { input }, { authHeader }) => {
      const { data } = await axios.post(`${MAINT_URL}/maintenance`, input, { headers: { Authorization: authHeader } });
      return data;
    },
    updateMaintenance: async (_, { id, input }, { authHeader }) => {
      const { data } = await axios.put(`${MAINT_URL}/maintenance/${id}`, input, { headers: { Authorization: authHeader } });
      return data;
    },
    deleteMaintenance: async (_, { id }, { authHeader }) => {
      await axios.delete(`${MAINT_URL}/maintenance/${id}`, { headers: { Authorization: authHeader } });
      return true;
    },

    createLocalisation: async (_, { input }, { authHeader }) => {
      const { data } = await axios.post(`${LOCATION_URL}/localisations`, input, { headers: { Authorization: authHeader } });
      return data;
    },
    deleteLocalisation: async (_, { id }, { authHeader }) => {
      await axios.delete(`${LOCATION_URL}/localisations/${id}`, { headers: { Authorization: authHeader } });
      return true;
    },

    createEvenement: async (_, { input }, { authHeader }) => {
      const { data } = await axios.post(`${EVENT_URL}/evenements`, input, { headers: { Authorization: authHeader } });
      return data;
    },
    deleteEvenement: async (_, { id }, { authHeader }) => {
      await axios.delete(`${EVENT_URL}/evenements/${id}`, { headers: { Authorization: authHeader } });
      return true;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Passe le header Authorization dans le contexte GraphQL pour que les resolvers le transmettent
  context: ({ req }) => ({
    authHeader: req.headers.authorization || null,
  }),
  formatError: (err) => ({
    message: err.message,
    code: err.extensions?.code,
  }),
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`GraphQL Gateway ready at ${url}`);
}).catch(console.error);
