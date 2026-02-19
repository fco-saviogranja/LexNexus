import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { libraryRoutes } from "./routes/library.js";
import { viewerRoutes } from "./routes/viewer.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { questionRoutes } from "./routes/questions.js";
import { studyRoutes } from "./routes/study.js";
import { flashcardRoutes } from "./routes/flashcards.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    }
  });

  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("Origin não permitida"), false);
    },
    credentials: true
  });
  app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });
  app.register(authPlugin);

  app.get("/health", async () => ({ status: "ok", service: "lexnexus-api" }));

  app.register(authRoutes);
  app.register(adminRoutes);
  app.register(libraryRoutes);
  app.register(viewerRoutes);
  app.register(dashboardRoutes);
  app.register(questionRoutes);
  app.register(studyRoutes);
  app.register(flashcardRoutes);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    const message = error instanceof Error ? error.message : "Erro interno";
    reply.code(statusCode).send({
      message: statusCode >= 500 ? "Erro interno" : message
    });
  });

  return app;
}
