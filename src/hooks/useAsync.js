import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../utils/errors';

export function useAsync(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const execute = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await asyncFn();
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(apiErrorMessage(err, 'Error inesperado'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute().catch(() => {});
  }, [execute]);

  return { data, loading, error, reload: execute, setData };
}
