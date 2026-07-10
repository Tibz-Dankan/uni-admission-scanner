import { apiFetch } from "./client";
import type { AuthResponse, SignInInput } from "@/types/auth";

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export async function signIn(input: SignInInput): Promise<AuthResponse> {
  const res = await apiFetch<ApiEnvelope<AuthResponse>>("/auth/signin", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}
