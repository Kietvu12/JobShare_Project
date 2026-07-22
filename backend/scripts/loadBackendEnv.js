import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(scriptsDir, '..');

/** Load backend/.env (or .env.true) regardless of process cwd. */
export function loadBackendEnv() {
  const candidates = [
    path.resolve(backendDir, '.env'),
    path.resolve(backendDir, '.env.true'),
    path.resolve(process.cwd(), 'backend/.env'),
    path.resolve(process.cwd(), 'backend/.env.true'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return envPath;
    }
  }

  dotenv.config();
  return null;
}
