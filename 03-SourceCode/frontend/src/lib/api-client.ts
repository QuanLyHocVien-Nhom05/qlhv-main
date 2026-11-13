export async function api<T>(path: string, token: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}${path}`, {
    method, headers: {Authorization: `Bearer ${token}`, ...(body ? {'Content-Type':'application/json'} : {})},
    ...(body ? {body: JSON.stringify(body)} : {}), cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if(response.status===401&&token&&typeof window!=='undefined')window.dispatchEvent(new Event('qlhv-session-expired'));
    throw new Error(Array.isArray(data?.message) ? data.message.join('; ') : data?.message ?? `Lỗi HTTP ${response.status}`);
  }
  return data as T;
}
export const apiBase=()=>process.env.NEXT_PUBLIC_API_URL??'http://localhost:3001/api';
