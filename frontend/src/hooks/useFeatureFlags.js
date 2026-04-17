import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';

const FLAGS_URL = import.meta.env.VITE_FLAGS_URL || 'http://localhost:3006';

/**
 * Hook pour consommer le service de Feature Flags.
 * Supporte le canary deployment (rollout par pourcentage).
 */
export function useFeatureFlags() {
  const { roles, userInfo } = useAuth();
  const [flags, setFlags]   = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const role   = roles?.[0] || 'utilisateur';
    const userId = userInfo?.sub || userInfo?.email || 'anonymous';

    fetch(`${FLAGS_URL}/flags?role=${encodeURIComponent(role)}&userId=${encodeURIComponent(userId)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Feature flags HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { setFlags(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [roles, userInfo]);

  /** Retourne true si le flag est activé ET dans le rollout pour cet utilisateur */
  const isEnabled = (flagName) =>
    Boolean(flags[flagName]?.enabled && flags[flagName]?.active);

  /** Retourne le pourcentage de rollout d'un flag */
  const getRollout = (flagName) => flags[flagName]?.rolloutPercentage ?? 0;

  return { flags, loading, error, isEnabled, getRollout };
}
