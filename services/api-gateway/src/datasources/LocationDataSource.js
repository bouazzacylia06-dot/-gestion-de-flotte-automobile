const axios = require('axios');
const { LOCATION_SERVICE_URL } = require('../config/services');

const makeClient = (token) => axios.create({
  baseURL: LOCATION_SERVICE_URL,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
  timeout: 5000,
});

const getLocations = (token) =>
  makeClient(token).get('/locations').then((r) => r.data).catch(() => []);

const getLocationByVehicle = (vehicleId, token) =>
  makeClient(token).get(`/locations/${vehicleId}`).then((r) => r.data).catch(() => null);

const updateLocation = (input, token) =>
  makeClient(token).post('/locations', input).then((r) => r.data);

module.exports = { getLocations, getLocationByVehicle, updateLocation };
