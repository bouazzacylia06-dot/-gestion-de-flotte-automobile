import { useQuery, useMutation } from '@apollo/client';
import {
  GET_MAINTENANCES,
  CREATE_MAINTENANCE,
  UPDATE_MAINTENANCE,
  DELETE_MAINTENANCE,
} from '../api/queries';

export function useMaintenances(pollInterval = 0) {
  const { data, loading, error, refetch } = useQuery(GET_MAINTENANCES, {
    pollInterval,
  });

  return {
    maintenances: data?.maintenances || [],
    loading,
    error,
    refetch,
  };
}

export function useCreateMaintenance() {
  const [createMaintenance, { loading, error }] = useMutation(
    CREATE_MAINTENANCE,
    { refetchQueries: [{ query: GET_MAINTENANCES }] }
  );
  return { createMaintenance, loading, error };
}

export function useUpdateMaintenance() {
  const [updateMaintenance, { loading, error }] = useMutation(
    UPDATE_MAINTENANCE,
    { refetchQueries: [{ query: GET_MAINTENANCES }] }
  );
  return { updateMaintenance, loading, error };
}

export function useDeleteMaintenance() {
  const [deleteMaintenance, { loading, error }] = useMutation(
    DELETE_MAINTENANCE,
    { refetchQueries: [{ query: GET_MAINTENANCES }] }
  );
  return { deleteMaintenance, loading, error };
}
