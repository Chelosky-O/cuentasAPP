import { createClient } from "@supabase/supabase-js";

// Configuración del cliente de Supabase
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar si las variables están cargadas
console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Las variables de entorno para Supabase no están configuradas correctamente.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
