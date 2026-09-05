import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setAuthCookie, signToken } from "@/lib/auth";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CUSTOMER", "MERCHANT"]).default("CUSTOMER"),
  merchantName: z.string().optional(),
});

export async function POST(req) {
  try {
    const body = Schema.parse(await req.json());
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        role: body.role,
      },
    });

    let merchantId = null;
    if (body.role === "MERCHANT") {
      const merchant = await prisma.merchant.create({
        data: {
          userId: user.id,
          name: body.merchantName || body.name,
          email: body.email.toLowerCase(),
        },
      });
      merchantId = merchant.id;
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      merchantId,
    });
    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, merchantId },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Invalid request" }, { status: 400 });
  }
}
