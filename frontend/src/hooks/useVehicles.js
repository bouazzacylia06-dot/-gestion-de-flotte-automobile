import { useQuery, useMutation } from '@apollo/client';
import {
  GET_VEHICULES,
  GET_VEHICULE,
  CREATE_VEHICULE,
  UPDATE_VEHICULE,
  DELETE_VEHICULE,
} from '../api/queries';

export function useVehicules(pollInterval = 0) {
  const { data, loading, error, refetch } = useQuery(GET_VEHICULES, {
    pollInterval,
  });

  return {
    vehicules: data?.vehicules || [],
    loading,
    error,
    refetch,
  };
}

export function useVehicule(id) {
  const { data, loading, error } = useQuery(GET_VEHICULE, {
    variables: { id },
    skip: !id,
  });

  return { vehicule: data?.vehicule || null, loading, error };
}

export function useCreateVehicule() {
  const [createVehicule, { loading, error }] = useMutation(CREATE_VEHICULE, {
    refetchQueries: [{ query: GET_VEHICULES }],
  });

  return { createVehicule, loading, error };
}

export function useUpdateVehicule() {
  const [updateVehicule, { loading, error }] = useMutation(UPDATE_VEHICULE, {
    refetchQueries: [{ query: GET_VEHICULES }],
  });

  return { updateVehicule, loading, error };
}

export function useDeleteVehicule() {
  const [deleteVehicule, { loading, error }] = useMutation(DELETE_VEHICULE, {
    refetchQueries: [{ query: GET_VEHICULES }],
  });

  return { deleteVehicule, loading, error };
}
