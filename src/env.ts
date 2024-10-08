import { config } from "dotenv"
config();

export const REDIS_URL = () => process.env.REDIS_URL || 'redis://localhost:6379';

export const REDIS_HOST = process.env.REDIS_HOST || 'redis'
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379
