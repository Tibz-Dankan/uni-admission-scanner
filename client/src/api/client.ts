import { API_BASE_URL } from "@/constants/urls";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(!isFormData && { "Content-Type": "application/json" }), ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
