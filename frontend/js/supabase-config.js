/*
 * ============================================================
 * SUPABASE CONFIGURATION
 * ============================================================
 *
 * 1. Buka Supabase Dashboard
 * 2. Project Settings -> API
 * 3. Copy Project URL ke SUPABASE_URL
 * 4. Copy Publishable/Anon key ke SUPABASE_ANON_KEY
 *
 * PENTING:
 * - Gunakan key publik/anon (publishable), BUKAN service_role key.
 * - Service role key TIDAK BOLEH dimasukkan ke JavaScript frontend.
 */

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
// ↑ GANTI dengan Project URL Supabase Anda.

const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
// ↑ GANTI dengan Publishable/Anon Key Supabase Anda.

const supabaseConfigured = !(
  SUPABASE_URL.includes("YOUR-PROJECT") ||
  SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
);

if (supabaseConfigured && window.supabase?.createClient) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.dataMode = "supabase";
} else {
  window.supabaseClient = window.createDemoClient();
  window.dataMode = "demo";
  console.info("Toko Sembako berjalan dengan data demo lokal yang tersimpan di browser.");
}

const navigation = document.querySelector(".navbar .navbar-collapse");
if (navigation) {
  const modeLabel = window.dataMode === "demo" ? "Demo lokal" : "Supabase";
  navigation.insertAdjacentHTML("beforeend", `<span class="data-mode-badge"><i class="bi bi-circle-fill"></i>${modeLabel}</span>`);
}
