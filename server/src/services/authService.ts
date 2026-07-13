import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, type User } from "../db/schema";
import { AppError } from "../utils/error";
import type { SigninInput, SignupInput } from "../types/auth";

const SALT_ROUNDS = 10;

function signToken(user: Pick<User, "id" | "role">): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Server auth configuration is missing", 500);
  }
  return jwt.sign({ sub: user.id, role: user.role }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });
}

function toSafeUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function signup(input: SignupInput) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const password = await bcrypt.hash(input.password, SALT_ROUNDS);
  const now = new Date();
  const [user] = await db
    .insert(users)
    .values({
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      email: input.email,
      password,
      role: input.role,
      updatedAt: now,
    })
    .returning();

  return { token: signToken(user), user: toSafeUser(user) };
}

export async function signin(input: SigninInput) {
  const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (!user) {
    throw new AppError("Invalid email or password", 400);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 400);
  }

  return { token: signToken(user), user: toSafeUser(user) };
}
