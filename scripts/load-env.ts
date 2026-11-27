// Load .env.local for scripts run on a developer machine. On Vercel the
// variables already come from the environment and the file does not exist.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — fine
}
