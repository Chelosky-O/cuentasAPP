import { createClient } from "@supabase/supabase-js";

// Configuración del cliente de Supabase
const SUPABASE_URL = "https://harguagytcmwuotfbcfo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhcmd1YWd5dGNtd3VvdGZiY2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1Njk1OTksImV4cCI6MjA1MzE0NTU5OX0.GWnVbyEDzk3Th27f7cH-RTD7UgtQFWzxOiGMFJ39t70";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Las variables de entorno para Supabase no están configuradas correctamente.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
