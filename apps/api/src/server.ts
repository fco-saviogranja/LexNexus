import { buildApp } from "./app.js";

const app = buildApp();
const port = Number(process.env.API_PORT ?? 3333);
const host = process.env.API_HOST ?? "0.0.0.0";

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`API rodando em http://${host}:${port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
