const { ApolloServer } = require('apollo-server');
const axios = require('axios');

const typeDefs = `#graphql
  type Driver {
    id: ID!
    name: String!
    license: String!
    profile: Profile!
  }

  type Profile {
    email: String!
    phone: String!
  }

  type Vehicle {
    id: ID!
    make: String!
    model: String!
    availability: Boolean!
    characteristics: Characteristics!
  }

  type Characteristics {
    year: Int!
    color: String!
    capacity: Int!
  }

  type Location {
    vehicleId: ID!
    latitude: Float!
    longitude: Float!
    timestamp: String!
  }

  type Maintenance {
    id: ID!
    vehicleId: ID!
    date: String!
    type: String!
    status: String!
    cost: Float!
  }

  type Reservation {
    id: ID!
    vehicleId: ID!
    driverId: ID!
    startDate: String!
    endDate: String!
  }

  type Query {
    drivers: [Driver!]!
    driver(id: ID!): Driver
    vehicles: [Vehicle!]!
    vehicle(id: ID!): Vehicle
    locations: [Location!]!
    location(vehicleId: ID!): Location
    maintenances: [Maintenance!]!
    maintenance(id: ID!): Maintenance
    reservations: [Reservation!]!
    reservation(id: ID!): Reservation
  }

  type Mutation {
    createDriver(input: DriverInput!): Driver!
    updateDriver(id: ID!, input: DriverInput!): Driver!
    deleteDriver(id: ID!): Boolean!
    
    createVehicle(input: VehicleInput!): Vehicle!
    updateVehicle(id: ID!, input: VehicleInput!): Vehicle!
    deleteVehicle(id: ID!): Boolean!
    
    createLocation(input: LocationInput!): Location!
    
    createMaintenance(input: MaintenanceInput!): Maintenance!
    updateMaintenance(id: ID!, input: MaintenanceInput!): Maintenance!
    deleteMaintenance(id: ID!): Boolean!
    
    createReservation(input: ReservationInput!): Reservation!
    updateReservation(id: ID!, input: ReservationInput!): Reservation!
    deleteReservation(id: ID!): Boolean!
  }

  input DriverInput {
    name: String!
    license: String!
    profile: ProfileInput!
  }

  input ProfileInput {
    email: String!
    phone: String!
  }

  input VehicleInput {
    make: String!
    model: String!
    availability: Boolean!
    characteristics: CharacteristicsInput!
  }

  input CharacteristicsInput {
    year: Int!
    color: String!
    capacity: Int!
  }

  input LocationInput {
    vehicleId: ID!
    latitude: Float!
    longitude: Float!
    timestamp: String!
  }

  input MaintenanceInput {
    vehicleId: ID!
    date: String!
    type: String!
    status: String!
    cost: Float!
  }

  input ReservationInput {
    vehicleId: ID!
    driverId: ID!
    startDate: String!
    endDate: String!
  }
`;

const resolvers = {
  Query: {
    drivers: async () => {
      try {
        const { data } = await axios.get('http://localhost:3001/drivers');
        return data;
      } catch (error) {
        console.error('Drivers service error:', error.message);
        return [];
      }
    },
    driver: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://localhost:3001/drivers/${id}`);
        return data;
      } catch (error) {
        throw new Error('Driver not found');
      }
    },
    vehicles: async () => {
      try {
        const { data } = await axios.get('http://localhost:3000/vehicles');
        return data;
      } catch (error) {
        console.error('Vehicles service error:', error.message);
        return [];
      }
    },
    vehicle: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://localhost:3000/vehicles/${id}`);
        return data;
      } catch (error) {
        throw new Error('Vehicle not found');
      }
    },
    locations: async () => {
      try {
        const { data } = await axios.get('http://localhost:3003/locations');
        return data;
      } catch (error) {
        console.error('Locations service error:', error.message);
        return [];
      }
    },
    location: async (_, { vehicleId }) => {
      try {
        const { data } = await axios.get(`http://localhost:3003/locations/${vehicleId}`);
        return data;
      } catch (error) {
        throw new Error('Location not found');
      }
    },
    maintenances: async () => {
      try {
        const { data } = await axios.get('http://localhost:3002/maintenance');
        return data;
      } catch (error) {
        console.error('Maintenances service error:', error.message);
        return [];
      }
    },
    maintenance: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://localhost:3002/maintenance/${id}`);
        return data;
      } catch (error) {
        throw new Error('Maintenance not found');
      }
    },
    reservations: async () => {
      try {
        const { data } = await axios.get('http://localhost:3005/reservations');
        return data;
      } catch (error) {
        console.error('Reservations service error:', error.message);
        return [];
      }
    },
    reservation: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://localhost:3005/reservations/${id}`);
        return data;
      } catch (error) {
        throw new Error('Reservation not found');
      }
    },
  },
  Mutation: {
    createDriver: async (_, { input }) => {
      try {
        const { data } = await axios.post('http://localhost:3001/drivers', input);
        return data;
      } catch (error) {
        throw new Error('Failed to create driver');
      }
    },
    updateDriver: async (_, { id, input }) => {
      try {
        const { data } = await axios.put(`http://localhost:3001/drivers/${id}`, input);
        return data;
      } catch (error) {
        throw new Error('Failed to update driver');
      }
    },
    deleteDriver: async (_, { id }) => {
      try {
        await axios.delete(`http://localhost:3001/drivers/${id}`);
        return true;
      } catch (error) {
        throw new Error('Failed to delete driver');
      }
    },
    createVehicle: async (_, { input }) => {
      try {
        const { data } = await axios.post('http://localhost:3000/vehicles', input);
        return data;
      } catch (error) {
        throw new Error('Failed to create vehicle');
      }
    },
    updateVehicle: async (_, { id, input }) => {
      try {
        const { data } = await axios.put(`http://localhost:3000/vehicles/${id}`, input);
        return data;
      } catch (error) {
        throw new Error('Failed to update vehicle');
      }
    },
    deleteVehicle: async (_, { id }) => {
      try {
        await axios.delete(`http://localhost:3000/vehicles/${id}`);
        return true;
      } catch (error) {
        throw new Error('Failed to delete vehicle');
      }
    },
    createLocation: async (_, { input }) => {
      try {
        const { data } = await axios.post('http://localhost:3003/locations', input);
        return data;
      } catch (error) {
        throw new Error('Failed to create location');
      }
    },
    createMaintenance: async (_, { input }) => {
      try {
        const { data } = await axios.post('http://localhost:3002/maintenance', input);
        return data;
      } catch (error) {
        throw new Error('Failed to create maintenance');
      }
    },
    updateMaintenance: async (_, { id, input }) => {
      try {
        const { data } = await axios.put(`http://localhost:3002/maintenance/${id}`, input);
        return data;
      } catch (error) {
        throw new Error('Failed to update maintenance');
      }
    },
    deleteMaintenance: async (_, { id }) => {
      try {
        await axios.delete(`http://localhost:3002/maintenance/${id}`);
        return true;
      } catch (error) {
        throw new Error('Failed to delete maintenance');
      }
    },
    createReservation: async (_, { input }) => {
      try {
        const { data } = await axios.post('http://localhost:3005/reservations', input);
        return data;
      } catch (error) {
        throw new Error('Failed to create reservation');
      }
    },
    updateReservation: async (_, { id, input }) => {
      try {
        const { data } = await axios.put(`http://localhost:3005/reservations/${id}`, input);
        return data;
      } catch (error) {
        throw new Error('Failed to update reservation');
      }
    },
    deleteReservation: async (_, { id }) => {
      try {
        await axios.delete(`http://localhost:3005/reservations/${id}`);
        return true;
      } catch (error) {
        throw new Error('Failed to delete reservation');
      }
    },
  },
};

// Standalone server
const server = new ApolloServer({ typeDefs, resolvers });
server.listen().then(({ url }) => {
  console.log(`🚀 GraphQL Gateway ready at ${url}`);
}).catch(console.error);
