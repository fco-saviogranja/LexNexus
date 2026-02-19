import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";

const authPlugin = fp(async (app) => {
  app.register(fastifyJwt, {
    secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret"
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = await request.jwtVerify<{
        userId: string;
        role: "admin" | "student";
        email: string;
        tokenType: "access" | "refresh";
      }>();
      if (decoded.tokenType !== "access") {
        reply.code(401).send({ message: "Token inválido" });
        return;
      }
      request.user = decoded;
    } catch {
      reply.code(401).send({ message: "Não autenticado" });
    }
  });

  app.decorate("authorize", (roles: Array<"admin" | "student">) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      await app.authenticate(request, reply);
      if (!request.user || !roles.includes(request.user.role)) {
        reply.code(403).send({ message: "Sem permissão" });
      }
    };
  });
});

export default authPlugin;
