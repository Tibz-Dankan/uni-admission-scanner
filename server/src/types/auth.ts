import { z } from "zod";
import type { UserRole } from "../generated/prisma/client";

export const signupSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().min(1).optional(),
  lastName: z.string().min(1),
  // email: z.string().email(), // deprecated
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["RECORDS_OFFICER", "ACADEMIC_REGISTRAR"]),
});

export const signinSchema = z.object({
  // email: z.string().email(), // deprecated
  email: z.email(),
  password: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;

export interface JwtPayload {
  sub: string;
  role: UserRole;
}
