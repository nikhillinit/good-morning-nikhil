export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

function readSupabaseEnv(): Partial<SupabaseEnv> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return {
    url,
    anonKey,
  };
}

export function hasSupabaseEnv(): boolean {
  const { url, anonKey } = readSupabaseEnv();
  return Boolean(url && anonKey);
}

export function getSupabaseEnv(): SupabaseEnv {
  const { url, anonKey } = readSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before enabling persistence.",
    );
  }

  return {
    url,
    anonKey,
  };
}
