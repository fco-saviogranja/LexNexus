module.exports = {
  apps: [
    {
      name: "lexnexus-api",
      cwd: "/var/www/lexnexus",
      script: "corepack",
      args: "pnpm --filter @lexnexus/api start",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "lexnexus-web",
      cwd: "/var/www/lexnexus",
      script: "corepack",
      args: "pnpm --filter @lexnexus/web start",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
