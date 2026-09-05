import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "np_token";
const MAX_AGE = 60 * 60 * 24 * 7;

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function setAuthCookie(token) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearAuthCookie() {
  cookies().set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getTokenFromRequest() {
  return cookies().get(COOKIE)?.value || null;
}

export async function getCurrentUser() {
  const token = getTokenFromRequest();
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { merchant: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    merchantId: user.merchant?.id || null,
    merchantName: user.merchant?.name || null,
  };
}

export async function requireUser(role) {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  if (role && user.role !== role) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return user;
}
