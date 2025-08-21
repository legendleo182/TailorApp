console.log("Supabase.js loading...");
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Supabase imported, creating client...");
const cfg = window.__SUPABASE_CONFIG__ || {};
console.log("Config:", cfg);
export const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

// Also expose globally for debugging
window.supabase = supabase;
console.log("Supabase client created:", supabase);

export async function requireSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return null;
  }
  return data.session;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}


