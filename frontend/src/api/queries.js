import { gql } from '@apollo/client';

// ─── Véhicules ────────────────────────────────────────────────────────────

export const GET_VEHICULES = gql`
  query GetVehicules {
    vehicules {
      id
      immatriculation
      marque
      modele
      statut
    }
  }
`;

export const GET_VEHICULE = gql`
  query GetVehicule($id: ID!) {
    vehicule(id: $id) {
      id
      immatriculation
      marque
      modele
      statut
    }
  }
`;

export const CREATE_VEHICULE = gql`
  mutation CreateVehicule($input: VehiculeInput!) {
    createVehicule(input: $input) {
      id
      immatriculation
      marque
      modele
      statut
    }
  }
`;

export const UPDATE_VEHICULE = gql`
  mutation UpdateVehicule($id: ID!, $input: VehiculeInput!) {
    updateVehicule(id: $id, input: $input) {
      id
      immatriculation
      marque
      modele
      statut
    }
  }
`;

export const DELETE_VEHICULE = gql`
  mutation DeleteVehicule($id: ID!) {
    deleteVehicule(id: $id)
  }
`;

// ─── Conducteurs ──────────────────────────────────────────────────────────

export const GET_CONDUCTEURS = gql`
  query GetConducteurs {
    conducteurs {
      id
      nom
      prenom
      numeroPermis
      statut
    }
  }
`;

export const GET_CONDUCTEUR = gql`
  query GetConducteur($id: ID!) {
    conducteur(id: $id) {
      id
      nom
      prenom
      numeroPermis
      statut
    }
  }
`;

export const CREATE_CONDUCTEUR = gql`
  mutation CreateConducteur($input: ConducteurInput!) {
    createConducteur(input: $input) {
      id
      nom
      prenom
      numeroPermis
      statut
    }
  }
`;

export const UPDATE_CONDUCTEUR = gql`
  mutation UpdateConducteur($id: ID!, $input: ConducteurInput!) {
    updateConducteur(id: $id, input: $input) {
      id
      nom
      prenom
      numeroPermis
      statut
    }
  }
`;

export const DELETE_CONDUCTEUR = gql`
  mutation DeleteConducteur($id: ID!) {
    deleteConducteur(id: $id)
  }
`;

// ─── Maintenances ─────────────────────────────────────────────────────────

export const GET_MAINTENANCES = gql`
  query GetMaintenances {
    maintenances {
      id
      vehicleId
      date
      type
      status
      cost
    }
  }
`;

export const GET_MAINTENANCE = gql`
  query GetMaintenance($id: ID!) {
    maintenance(id: $id) {
      id
      vehicleId
      date
      type
      status
      cost
    }
  }
`;

export const CREATE_MAINTENANCE = gql`
  mutation CreateMaintenance($input: MaintenanceInput!) {
    createMaintenance(input: $input) {
      id
      vehicleId
      date
      type
      status
      cost
    }
  }
`;

export const UPDATE_MAINTENANCE = gql`
  mutation UpdateMaintenance($id: ID!, $input: MaintenanceInput!) {
    updateMaintenance(id: $id, input: $input) {
      id
      vehicleId
      date
      type
      status
      cost
    }
  }
`;

export const DELETE_MAINTENANCE = gql`
  mutation DeleteMaintenance($id: ID!) {
    deleteMaintenance(id: $id)
  }
`;

// ─── Localisation ─────────────────────────────────────────────────────────

export const GET_POSITION_HISTORY = gql`
  query GetPositionHistory(
    $vehicleId: ID!
    $from: String
    $to: String
    $limit: Int
  ) {
    positionHistory(vehicleId: $vehicleId, from: $from, to: $to, limit: $limit) {
      id
      vehiculeId
      latitude
      longitude
      speed
      heading
      timestamp
    }
  }
`;

export const GET_LAST_POSITION = gql`
  query GetLastPosition($vehicleId: ID!) {
    vehiculeLastPosition(vehicleId: $vehicleId) {
      id
      vehiculeId
      latitude
      longitude
      speed
      heading
      timestamp
    }
  }
`;

export const GET_LOCALISATIONS = gql`
  query GetLocalisations {
    localisations {
      id
      vehiculeId
      latitude
      longitude
      speed
      heading
      timestamp
    }
  }
`;

// ─── Événements ───────────────────────────────────────────────────────────

export const GET_EVENEMENTS = gql`
  query GetEvenements {
    evenements {
      id
      vehiculeId
      type
      description
      date
    }
  }
`;
