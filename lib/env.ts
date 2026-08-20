import "server-only";

const read = (...names: string[]) => {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return "";
};

export const env = {
  supabaseUrl: read("SUPABASE_URL", "VITE_SUPABASE_URL"),
  supabasePublishableKey: read("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_ANON_KEY"),
  supabaseSecretKey: read("SUPABASE_SECRET_KEY"),
  initialAdminEmail: read("SUPABASE_INITIAL_ADMIN_EMAIL").toLowerCase(),
};

export const hasServerEnv = Boolean(env.supabaseUrl && env.supabasePublishableKey);
