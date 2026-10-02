const client = window.supabaseClient;

let barangData = [];
let barangModal;

document.addEventListener("DOMContentLoaded", () => {
  barangModal = new bootstrap.Modal(document.getElementById("barangModal"));

  document.getElementById("btnTambah").addEventListener("click", openTambah);
  document.getElementById("barangForm").addEventListener("submit", saveBarang);
  document.getElementById("searchInput").addEventListener("input", renderBarang);
  document.getElementById("kategoriFilter").addEventListener("change", renderBarang);

  loadBarang();
});

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");

  const bg = type === "success" ? "text-bg-success"
    : type === "danger" ? "text-bg-danger"
    : "text-bg-warning";

  container.innerHTML = `
    <div class="toast align-items-center ${bg} border-0 show" role="alert">
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                onclick="this.closest('.toast').remove()"></button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const toast = container.querySelector(".toast");
    if (toast) toast.remove();
  }, 3500);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

async function loadBarang() {
  const { data, error } = await client
    .from("barang")
    .select("*")
    .order("nama_barang", { ascending: true });

  if (error) {
    console.error(error);
    showToast("Gagal mengambil data barang: " + error.message, "danger");
    return;
  }

  barangData = data || [];
  populateKategori();
  renderBarang();
}

function populateKategori() {
  const select = document.getElementById("kategoriFilter");
  const current = select.value;

  const categories = [...new Set(
    barangData.map(item => item.kategori).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  select.innerHTML = `<option value="">Semua Kategori</option>`;

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  select.value = current;
}

function renderBarang() {
  const tbody = document.getElementById("barangTableBody");
  const keyword = document.getElementById("searchInput").value.toLowerCase().trim();
  const kategori = document.getElementById("kategoriFilter").value;

  const filtered = barangData.filter(item => {
    const matchesKeyword =
      !keyword ||
      item.kode_barang.toLowerCase().includes(keyword) ||
      item.nama_barang.toLowerCase().includes(keyword);

    const matchesCategory =
      !kategori || item.kategori === kategori;

    return matchesKeyword && matchesCategory;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">Tidak ada data barang.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const isLow = Number(item.stok) <= Number(item.stok_minimum);

    return `
      <tr>
        <td><strong>${escapeHtml(item.kode_barang)}</strong></td>
        <td>${escapeHtml(item.nama_barang)}</td>
        <td>${escapeHtml(item.kategori || "-")}</td>
        <td>${escapeHtml(item.satuan)}</td>
        <td>${rupiah(item.harga_beli)}</td>
        <td>${rupiah(item.harga_jual)}</td>
        <td>${item.stok}</td>
        <td>
          ${
            isLow
              ? `<span class="badge bg-danger badge-stock">Stok Minimum</span>`
              : `<span class="badge bg-success badge-stock">Aman</span>`
          }
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary"
              onclick="openEdit(${item.id})" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger"
              onclick="deleteBarang(${item.id})" title="Hapus">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function resetForm() {
  document.getElementById("barangForm").reset();
  document.getElementById("barangId").value = "";
  document.getElementById("satuan").value = "pcs";
  document.getElementById("stokMinimum").value = "0";
}

function openTambah() {
  resetForm();
  document.getElementById("modalTitle").textContent = "Tambah Barang";
  document.getElementById("btnSimpan").textContent = "Simpan Barang";
  barangModal.show();
}

window.openEdit = function(id) {
  const item = barangData.find(row => row.id === id);
  if (!item) return;

  document.getElementById("barangId").value = item.id;
  document.getElementById("kodeBarang").value = item.kode_barang;
  document.getElementById("namaBarang").value = item.nama_barang;
  document.getElementById("kategori").value = item.kategori || "";
  document.getElementById("satuan").value = item.satuan;
  document.getElementById("hargaBeli").value = item.harga_beli;
  document.getElementById("hargaJual").value = item.harga_jual;
  document.getElementById("stok").value = item.stok;
  document.getElementById("stokMinimum").value = item.stok_minimum;

  document.getElementById("modalTitle").textContent = "Edit Barang";
  document.getElementById("btnSimpan").textContent = "Update Barang";

  barangModal.show();
};

async function saveBarang(event) {
  event.preventDefault();

  const id = document.getElementById("barangId").value;

  const payload = {
    kode_barang: document.getElementById("kodeBarang").value.trim(),
    nama_barang: document.getElementById("namaBarang").value.trim(),
    kategori: document.getElementById("kategori").value.trim() || null,
    satuan: document.getElementById("satuan").value.trim(),
    harga_beli: Number(document.getElementById("hargaBeli").value),
    harga_jual: Number(document.getElementById("hargaJual").value),
    stok: Number(document.getElementById("stok").value),
    stok_minimum: Number(document.getElementById("stokMinimum").value)
  };

  if (!payload.kode_barang || !payload.nama_barang || !payload.satuan) {
    showToast("Field bertanda * wajib diisi.", "danger");
    return;
  }

  const button = document.getElementById("btnSimpan");
  button.disabled = true;
  button.textContent = "Menyimpan...";

  let result;

  if (id) {
    result = await client
      .from("barang")
      .update(payload)
      .eq("id", id);
  } else {
    result = await client
      .from("barang")
      .insert(payload);
  }

  button.disabled = false;
  button.textContent = id ? "Update Barang" : "Simpan Barang";

  if (result.error) {
    console.error(result.error);
    showToast("Gagal menyimpan: " + result.error.message, "danger");
    return;
  }

  barangModal.hide();
  showToast(id ? "Barang berhasil diperbarui." : "Barang berhasil ditambahkan.");
  await loadBarang();
}

window.deleteBarang = async function(id) {
  const item = barangData.find(row => row.id === id);
  if (!item) return;

  const confirmed = confirm(
    `Hapus barang "${item.nama_barang}"?\n\nPastikan barang belum digunakan pada transaksi penjualan.`
  );

  if (!confirmed) return;

  const { error } = await client
    .from("barang")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    showToast(
      "Gagal menghapus. Barang mungkin sudah digunakan dalam transaksi.",
      "danger"
    );
    return;
  }

  showToast("Barang berhasil dihapus.");
  await loadBarang();
};
