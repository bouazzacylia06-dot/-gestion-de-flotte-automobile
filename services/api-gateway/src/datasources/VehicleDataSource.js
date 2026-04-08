const axios = require('axios');
const { VEHICLE_SERVICE_URL } = require('../config/services');

// Crée une instance axios préconfigurée avec le token de l'utilisateur courant
const makeClient = (token) => axios.create({
  baseURL: VEHICLE_SERVICE_URL,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
  timeout: 5000,
});

// Fonctions d'accès au vehicule-service
// Chaque fonction reçoit (token) en dernier paramètre

const getVehicles = (token) =>
  makeClient(token).get('/vehicles').then((r) => r.data);

const getVehicleById = (id, token) =>
  makeClient(token).get(`/vehicles/${id}`).then((r) => r.data).catch((e) => {
    if (e.response?.status === 404) return null;
    throw e;
  });

const createVehicle = (input, token) =>
  makeClient(token).post('/vehicles', input).then((r) => r.data);

const updateVehicle = (id, input, token) =>
  makeClient(token).put(`/vehicles/${id}`, input).then((r) => r.data).catch((e) => {
    if (e.response?.status === 404) return null;
    throw e;
  });

const deleteVehicle = (id, token) =>
  makeClient(token).delete(`/vehicles/${id}`).then(() => true).catch((e) => {
    if (e.response?.status === 404) return false;
    throw e;
  });

module.exports = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle };
