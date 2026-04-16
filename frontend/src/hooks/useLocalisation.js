import { useQuery } from '@apollo/client';
import { GET_LAST_POSITION, GET_POSITION_HISTORY } from '../api/queries';

/**
 * Dernière position d'un véhicule (polling toutes les 3s)
 */
export function useLastPosition(vehicleId, pollInterval = 3000) {
  const { data, loading, error } = useQuery(GET_LAST_POSITION, {
    variables: { vehicleId },
    skip: !vehicleId,
    pollInterval,
  });

  return {
    position: data?.vehiculeLastPosition || null,
    loading,
    error,
  };
}

/**
 * Historique des positions d'un véhicule sur une plage horaire
 */
export function usePositionHistory(vehicleId, from, to, limit = 100) {
  const { data, loading, error, refetch } = useQuery(GET_POSITION_HISTORY, {
    variables: { vehicleId, from, to, limit },
    skip: !vehicleId,
  });

  return {
    history: data?.positionHistory || [],
    loading,
    error,
    refetch,
  };
}
