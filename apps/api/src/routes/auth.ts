import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma, Role } from "@lexnexus/db";
import { loginSchema, registerSchema } from "@lexnexus/shared";
import { sendValidationError } from "../utils/http.js";

function signTokens(app: FastifyInstance, payload: { userId: string; role: "admin" | "student"; email: string }) {
  const accessToken = app.jwt.sign({ ...payload, tokenType: "access" }, { expiresIn: "15m" });
  const refreshToken = app.jwt.sign({ ...payload, tokenType: "refresh" }, { expiresIn: "7d" });

  return { accessToken, refreshToken };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return reply.code(409).send({ message: "Email já cadastrado" });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: Role.student
      }
    });

    const tokens = signTokens(app, { userId: user.id, role: user.role, email: user.email });
    return reply.code(201).send({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, ...tokens });
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return reply.code(401).send({ message: "Credenciais inválidas" });
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      return reply.code(401).send({ message: "Credenciais inválidas" });
    }

    const tokens = signTokens(app, { userId: user.id, role: user.role, email: user.email });
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, ...tokens };
  });

  app.post("/auth/refresh", async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    if (!body?.refreshToken) {
      return reply.code(400).send({ message: "refreshToken obrigatório" });
    }

    try {
      const decoded = await app.jwt.verify<{ userId: string; role: "admin" | "student"; email: string; tokenType: "access" | "refresh" }>(body.refreshToken);
      if (decoded.tokenType !== "refresh") {
        return reply.code(401).send({ message: "Refresh token inválido" });
      }
      const tokens = signTokens(app, { userId: decoded.userId, role: decoded.role, email: decoded.email });
      return { ...tokens };
    } catch {
      return reply.code(401).send({ message: "Refresh token inválido" });
    }
  });

  app.get("/auth/me", { preHandler: app.authenticate }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.userId } });
    return { user };
  });
}
