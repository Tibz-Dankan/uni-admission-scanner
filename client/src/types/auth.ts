export type UserRole = "RECORDS_OFFICER" | "ACADEMIC_REGISTRAR";

export interface User {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
