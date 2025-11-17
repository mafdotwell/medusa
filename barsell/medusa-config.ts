import { loadEnv, defineConfig } from '@medusajs/framework/utils'

// Load environment variables first
loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
  projectConfig: {
    database_url: process.env.DATABASE_URL,
    http: {
      store_cors: process.env.STORE_CORS || "http://localhost:8000",
      admin_cors: process.env.ADMIN_CORS || "http://localhost:7001",
      auth_cors: process.env.AUTH_CORS || "http://localhost:9000",
      jwt_secret: process.env.JWT_SECRET || "supersecret",
      cookie_secret: process.env.COOKIE_SECRET || "supersecret",
    },
    redis_url: process.env.REDIS_URL || "redis://localhost:6379"
  },
  modules: [
    {
      resolve: "./src/modules/marketplace",
    }
  ]
})