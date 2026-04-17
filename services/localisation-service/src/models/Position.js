'use strict';

// =============================================================================
// models/Position.js — Modèle de données pour une position GPS
// Utilisé comme type interne entre les couches service / repository / controller
// =============================================================================

class Position {
  /**
   * @param {Object} raw
   * @param {string}  raw.vehicleId     - UUID du véhicule
   * @param {number}  raw.latitude      - décimale [-90, 90]
   * @param {number}  raw.longitude     - décimale [-180, 180]
   * @param {number}  [raw.speed]       - km/h (défaut 0)
   * @param {number}  [raw.heading]     - degrés [0, 360) (défaut 0)
   * @param {number}  [raw.timestamp]   - epoch ms (défaut Date.now())
   * @param {string}  [raw.correlationId]
   */
  constructor({ vehicleId, latitude, longitude, speed, heading, timestamp, correlationId }) {
    this.vehicleId     = vehicleId;
    this.latitude      = parseFloat(latitude);
    this.longitude     = parseFloat(longitude);
    this.speed         = speed     != null ? parseFloat(speed)   : 0;
    this.heading       = heading   != null ? parseFloat(heading) : 0;
    this.timestamp     = timestamp ?? Date.now();
    this.correlationId = correlationId || '';
  }

  /**
   * Vérifie que la position est dans les bornes acceptables.
   * @returns {boolean}
   */
  isValid() {
    return (
      typeof this.vehicleId === 'string' &&
      this.vehicleId.trim() !== '' &&
      this.latitude  >= -90  && this.latitude  <= 90  &&
      this.longitude >= -180 && this.longitude <= 180 &&
      this.speed     >= 0    && this.speed     <= 250
    );
  }
}

module.exports = Position;
