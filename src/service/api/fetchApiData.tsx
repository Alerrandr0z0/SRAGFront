import api from './Api';

function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export default async function getApiData<T>(uri: string): Promise<T> {
  try {
    const response = await api.get(uri);
    return unwrapApiData(response.data);
  } catch (error) {
    throw error;
  }
}
