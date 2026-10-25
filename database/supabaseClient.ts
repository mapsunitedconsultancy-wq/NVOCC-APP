/**
 * MAPS NVOCC Pro — Supabase Database Client & High-Concurrency Connection Pooling
 * Optimized for 100k+ users using Supabase Supavisor Connection Pooler
 */

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  databaseUrl?: string; // Direct or Pooled connection URL
}

// Default environment variable access
export const getSupabaseConfig = (): SupabaseConfig => {
  return {
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'your-anon-key',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrl: process.env.DATABASE_URL
  };
};

/**
 * High-Concurrency Supabase Connection Pool Configuration
 * When connecting via PostgreSQL drivers (pg, drizzle-orm, prisma):
 * 
 * Port 5432: Session Mode (Max 100 connections - for DDL migrations & Drizzle Kit)
 * Port 6543: Transaction Mode via Supavisor Pooler (Supports 100,000+ client connections)
 */
export const SUPABISOR_POOL_CONFIG = {
  // Use transaction pooling URL for application queries:
  // e.g. postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  transactionPort: 6543,
  sessionPort: 5432,
  maxPoolSize: 20,                // Max connections per container instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statementTimeoutMillis: 15000   // Protect against runaway queries
};
