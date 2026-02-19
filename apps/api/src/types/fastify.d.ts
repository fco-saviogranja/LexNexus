import "fastify";
import "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      role: "admin" | "student";
      email: string;
      tokenType: "access" | "refresh";
    };
    user: {
      userId: string;
      role: "admin" | "student";
      email: string;
      tokenType: "access" | "refresh";
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: Array<"admin" | "student">) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export {};
