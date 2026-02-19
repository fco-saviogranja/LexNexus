import { FastifyReply } from "fastify";

export function sendValidationError(reply: FastifyReply, error: unknown) {
  return reply.code(400).send({
    message: "Payload inválido",
    error
  });
}
