import { apiFetch } from "./client";
import type {
  Admission,
  AdmissionListResult,
  AdmissionStatus,
  UpdateAdmissionInput,
} from "@/types/admission";

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export async function uploadAdmission(file: File): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch<ApiEnvelope<{ jobId: string }>>("/admissions/upload", {
    method: "POST",
    body: formData,
  });
  return res.data;
}

export async function listAdmissions(
  params: { status?: AdmissionStatus; page?: number; pageSize?: number } = {}
): Promise<AdmissionListResult> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  const res = await apiFetch<ApiEnvelope<AdmissionListResult>>(`/admissions${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function getAdmission(id: string): Promise<Admission> {
  const res = await apiFetch<ApiEnvelope<Admission>>(`/admissions/${id}`);
  return res.data;
}

export async function updateAdmission(id: string, input: UpdateAdmissionInput): Promise<Admission> {
  const res = await apiFetch<ApiEnvelope<Admission>>(`/admissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function confirmAdmission(id: string): Promise<Admission> {
  const res = await apiFetch<ApiEnvelope<Admission>>(`/admissions/${id}/confirm`, { method: "POST" });
  return res.data;
}

export async function rejectAdmission(id: string): Promise<Admission> {
  const res = await apiFetch<ApiEnvelope<Admission>>(`/admissions/${id}/reject`, { method: "POST" });
  return res.data;
}

export async function deleteAdmission(id: string): Promise<void> {
  await apiFetch<void>(`/admissions/${id}`, { method: "DELETE" });
}
