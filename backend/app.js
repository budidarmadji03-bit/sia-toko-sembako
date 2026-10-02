/*
 * backend/app.js
 *
 * Konfigurasi inti/backend reference untuk proyek SIA.
 * Frontend browser TIDAK menggunakan service_role key.
 *
 * Untuk aplikasi statis yang langsung berkomunikasi dengan Supabase,
 * konfigurasi client berada di:
 * frontend/js/supabase-config.js
 *
 * File ini disediakan sebagai tempat logika backend jika nanti Anda
 * menambahkan Express/Node.js API.
 */

const APP_CONFIG = {
  name: "Toko Sembako",
  version: "1.0.0",
  database: "Supabase PostgreSQL"
};

// Jangan pernah menaruh SUPABASE_SERVICE_ROLE_KEY di frontend.
// Jika nanti membuat server Node/Express, simpan secret di .env.
const BACKEND_ENV_EXAMPLE = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "ISI_DI_ENV_SERVER_SAJA"
};

module.exports = {
  APP_CONFIG,
  BACKEND_ENV_EXAMPLE
};
