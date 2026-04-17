// =============================================================================
// controllers/grpcController.js — Handlers gRPC (4 RPCs du .proto)
//
// Codes d'erreur gRPC standard utilisés :
//   INVALID_ARGUMENT (3) — données invalides en entrée
//   NOT_FOUND        (5) — ressource introuvable
//   INTERNAL        (13) — erreur serveur inattendue
// =============================================================================

const grpc               = require('@grpc/grpc-js');
const localisationService = require('../services/localisationService');

// ─── 1. StreamGPSPosition — Bidirectionnel ────────────────────────────────────

/**
 * Streaming bidirectionnel : le client GPS envoie des trames en continu,
 * le serveur ACK chaque trame immédiatement.
 *
 * Cycle de vie :
 *   call.on('data')  → traitement de chaque trame + écriture de l'ACK
 *   call.on('end')   → le client a fermé son côté → on ferme le serveur
 *   call.on('error') → erreur réseau (log uniquement, pas de crash)
 */
async function streamGPSPosition(call) {
  const peer = call.getPeer();

  console.log(JSON.stringify({
    level:   'INFO', service: 'localisation-service',
    message: '[gRPC] StreamGPSPosition — nouvelle connexion GPS',
    peer,
  }));

  call.on('data', async (gpsData) => {
    try {
      const result = await localisationService.processGPSFrame(gpsData);

      // Renvoie l'ACK au client immédiatement
      call.write({
        vehicle_id:     gpsData.vehicle_id,
        accepted:       result.accepted,
        reason:         result.reason || '',
        timestamp:      gpsData.timestamp,
        correlation_id: gpsData.correlation_id || '',
      });

    } catch (err) {
      console.error(JSON.stringify({
        level:      'ERROR', service: 'localisation-service',
        message:    '[gRPC] Erreur traitement trame GPS',
        error:      err.message,
        vehicle_id: gpsData.vehicle_id,
      }));

      // ACK de rejet pour informer le client sans couper le stream
      call.write({
        vehicle_id: gpsData.vehicle_id,
        accepted:   false,
        reason:     'Erreur interne serveur',
        timestamp:  gpsData.timestamp,
      });
    }
  });

  call.on('end', () => {
    console.log(JSON.stringify({
      level:   'INFO', service: 'localisation-service',
      message: '[gRPC] StreamGPSPosition — client fermé le flux',
      peer,
    }));
    call.end();
  });

  call.on('error', (err) => {
    // Erreur réseau (déconnexion abrupte, timeout…) — pas de relance automatique
    console.error(JSON.stringify({
      level:   'ERROR', service: 'localisation-service',
      message: '[gRPC] Erreur stream client',
      error:   err.message,
      peer,
    }));
  });
}

// ─── 2. GetPositionHistory — Server-side streaming ────────────────────────────

/**
 * Renvoie l'historique des positions en streaming.
 * Les positions sont envoyées une par une via call.write() puis call.end().
 */
async function getPositionHistory(call) {
  const { vehicle_id, from, to, limit } = call.request;

  console.log(JSON.stringify({
    level:      'INFO', service: 'localisation-service',
    message:    '[gRPC] GetPositionHistory',
    vehicle_id,
    from:       from ? new Date(from).toISOString() : '24h ago',
    to:         to   ? new Date(to).toISOString()   : 'now',
    limit,
  }));

  try {
    const positions = await localisationService.getHistory(vehicle_id, from, to, limit);

    for (const pos of positions) {
      call.write({
        vehicle_id:     pos.vehicleId,
        latitude:       pos.latitude,
        longitude:      pos.longitude,
        speed:          pos.speed,
        heading:        pos.heading,
        timestamp:      pos.timestamp,
        correlation_id: pos.correlationId || '',
      });
    }

    call.end();

  } catch (err) {
    console.error(JSON.stringify({
      level:      'ERROR', service: 'localisation-service',
      message:    '[gRPC] Erreur GetPositionHistory',
      error:      err.message,
      vehicle_id,
    }));
    call.destroy({
      code:    grpc.status.INTERNAL,
      message: `Erreur lors de la récupération de l'historique : ${err.message}`,
    });
  }
}

// ─── 3. GetLastPosition — Unaire ─────────────────────────────────────────────

/**
 * Retourne la dernière position connue d'un véhicule.
 * Renvoie NOT_FOUND si aucune position n'est disponible.
 */
async function getLastPosition(call, callback) {
  const { vehicle_id } = call.request;

  try {
    const pos = await localisationService.getLastPosition(vehicle_id);

    if (!pos) {
      return callback({
        code:    grpc.status.NOT_FOUND,
        message: `Aucune position trouvée pour le véhicule ${vehicle_id}`,
      });
    }

    callback(null, {
      vehicle_id:     pos.vehicleId,
      latitude:       pos.latitude,
      longitude:      pos.longitude,
      speed:          pos.speed,
      heading:        pos.heading,
      timestamp:      pos.timestamp,
      correlation_id: pos.correlationId || '',
    });

  } catch (err) {
    console.error(JSON.stringify({
      level:      'ERROR', service: 'localisation-service',
      message:    '[gRPC] Erreur GetLastPosition',
      error:      err.message,
      vehicle_id,
    }));
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ─── 4. GetPositionSummary — Unaire ──────────────────────────────────────────

/**
 * Retourne le résumé du trajet (distance totale + nb positions + dernière pos).
 */
async function getPositionSummary(call, callback) {
  const { vehicle_id, from, to } = call.request;

  try {
    const summary = await localisationService.getPositionSummary(vehicle_id, from, to);

    callback(null, {
      vehicle_id:        summary.vehicleId,
      last_position:     summary.lastPosition
        ? {
            vehicle_id:     summary.lastPosition.vehicleId,
            latitude:       summary.lastPosition.latitude,
            longitude:      summary.lastPosition.longitude,
            speed:          summary.lastPosition.speed,
            heading:        summary.lastPosition.heading,
            timestamp:      summary.lastPosition.timestamp,
            correlation_id: summary.lastPosition.correlationId || '',
          }
        : null,
      total_positions:   summary.totalPositions,
      total_distance_km: summary.totalDistanceKm,
    });

  } catch (err) {
    console.error(JSON.stringify({
      level:      'ERROR', service: 'localisation-service',
      message:    '[gRPC] Erreur GetPositionSummary',
      error:      err.message,
      vehicle_id,
    }));
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

module.exports = {
  streamGPSPosition,
  getPositionHistory,
  getLastPosition,
  getPositionSummary,
};
