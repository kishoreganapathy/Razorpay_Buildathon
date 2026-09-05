import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setAuthCookie, signToken, verifyPassword } from "@/lib/auth";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req) {
  try {
    const body = Schema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { merchant: true },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      merchantId: user.merchant?.id || null,
    });
    setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId: user.merchant?.id || null,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Invalid request" }, { status: 400 });
  }
}
