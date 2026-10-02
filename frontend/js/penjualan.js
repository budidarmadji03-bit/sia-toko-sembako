const salesClient = window.supabaseClient;

let barangList = [];
let pelangganList = [];
let cart = [];

document.addEventListener("DOMContentLoaded", async () => {
  setDefaultDate();
  generateInvoiceNumber();

  document.getElementById("btnTambahItem").addEventListener("click", addItemToCart);
  document.getElementById("btnSimpanTransaksi").addEventListener("click", saveTransaction);
  document.getElementById("btnReset").addEventListener("click", resetTransaction);

  document.getElementById("diskon").addEventListener("input", renderSummary);
  document.getElementById("pajakPersen").addEventListener("input", renderSummary);

  await Promise.all([
    loadBarangForSale(),
    loadPelanggan()
  ]);

  renderCart();
});

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");

  const bg = type === "success" ? "text-bg-success"
    : type === "danger" ? "text-bg-danger"
    : "text-bg-warning";

  container.innerHTML = `
    <div class="toast align-items-center ${bg} border-0 show">
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
  }, 4000);
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

function setDefaultDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  document.getElementById("tanggal").value = local;
}

function generateInvoiceNumber() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  const random = Math.floor(1000 + Math.random() * 9000);

  document.getElementById("nomorFaktur").value = `INV-${date}-${random}`;
}

async function loadBarangForSale() {
  const { data, error } = await salesClient
    .from("barang")
    .select("id,kode_barang,nama_barang,harga_jual,stok,satuan")
    .order("nama_barang");

  if (error) {
    console.error(error);
    showToast("Gagal memuat barang: " + error.message, "danger");
    return;
  }

  barangList = data || [];

  const select = document.getElementById("barangSelect");
  select.innerHTML = `<option value="">Pilih barang...</option>`;

  barangList.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent =
      `${item.kode_barang} - ${item.nama_barang} | Stok: ${item.stok} | ${rupiah(item.harga_jual)}`;
    select.appendChild(option);
  });
}

async function loadPelanggan() {
  const { data, error } = await salesClient
    .from("pelanggan")
    .select("id,kode_pelanggan,nama_pelanggan")
    .order("nama_pelanggan");

  if (error) {
    console.error(error);
    return;
  }

  pelangganList = data || [];

  const select = document.getElementById("pelanggan");
  select.innerHTML = `<option value="">Pelanggan Umum</option>`;

  pelangganList.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.kode_pelanggan} - ${item.nama_pelanggan}`;
    select.appendChild(option);
  });
}

function addItemToCart() {
  const barangId = Number(document.getElementById("barangSelect").value);
  const qty = Number(document.getElementById("qty").value);

  if (!barangId) {
    showToast("Silakan pilih barang.", "danger");
    return;
  }

  if (!Number.isInteger(qty) || qty <= 0) {
    showToast("Qty harus berupa bilangan bulat lebih dari 0.", "danger");
    return;
  }

  const item = barangList.find(row => Number(row.id) === barangId);

  if (!item) {
    showToast("Barang tidak ditemukan.", "danger");
    return;
  }

  const existing = cart.find(row => row.barang_id === barangId);
  const existingQty = existing ? existing.qty : 0;

  if (existingQty + qty > Number(item.stok)) {
    showToast(
      `Stok ${item.nama_barang} tidak cukup. Tersedia ${item.stok}.`,
      "danger"
    );
    return;
  }

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      barang_id: item.id,
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      harga_satuan: Number(item.harga_jual),
      qty,
      diskon: 0
    });
  }

  document.getElementById("barangSelect").value = "";
  document.getElementById("qty").value = "1";

  renderCart();
}

function renderCart() {
  const tbody = document.getElementById("cartBody");

  if (cart.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          Belum ada barang dalam transaksi.
        </td>
      </tr>
    `;
    renderSummary();
    return;
  }

  tbody.innerHTML = cart.map((item, index) => {
    const subtotal = item.qty * item.harga_satuan - item.diskon;

    return `
      <tr>
        <td>
          <strong>${escapeHtml(item.nama_barang)}</strong>
          <div class="small text-secondary">${escapeHtml(item.kode_barang)}</div>
        </td>
        <td class="text-end">${rupiah(item.harga_satuan)}</td>
        <td class="text-center">${item.qty}</td>
        <td class="text-end">${rupiah(subtotal)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="removeCartItem(${index})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  renderSummary();
}

window.removeCartItem = function(index) {
  cart.splice(index, 1);
  renderCart();
};

function calculateSummary() {
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.qty * item.harga_satuan - item.diskon),
    0
  );

  const diskon = Math.max(0, Number(document.getElementById("diskon").value) || 0);
  const pajakPersen = Math.max(0, Number(document.getElementById("pajakPersen").value) || 0);

  const dasarPajak = Math.max(0, subtotal - diskon);
  const pajak = dasarPajak * (pajakPersen / 100);
  const total = Math.max(0, dasarPajak + pajak);

  return { subtotal, diskon, pajakPersen, pajak, total };
}

function renderSummary() {
  const result = calculateSummary();

  document.getElementById("subtotalText").textContent = rupiah(result.subtotal);
  document.getElementById("pajakText").textContent = rupiah(result.pajak);
  document.getElementById("totalText").textContent = rupiah(result.total);
}

async function saveTransaction() {
  if (cart.length === 0) {
    showToast("Tambahkan minimal satu barang.", "danger");
    return;
  }

  const summary = calculateSummary();

  if (summary.diskon > summary.subtotal) {
    showToast("Diskon tidak boleh lebih besar dari subtotal.", "danger");
    return;
  }

  const button = document.getElementById("btnSimpanTransaksi");
  button.disabled = true;
  button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...`;

  try {
    // Validasi stok terbaru sebelum RPC.
    // Trigger database tetap menjadi pengaman utama.
    const barangIds = cart.map(item => item.barang_id);

    const { data: latestBarang, error: stockError } = await salesClient
      .from("barang")
      .select("id,nama_barang,stok")
      .in("id", barangIds);

    if (stockError) throw stockError;

    for (const cartItem of cart) {
      const latest = latestBarang.find(row => Number(row.id) === Number(cartItem.barang_id));

      if (!latest || Number(latest.stok) < Number(cartItem.qty)) {
        throw new Error(
          `Stok ${cartItem.nama_barang} tidak mencukupi. Stok terbaru: ${latest?.stok ?? 0}.`
        );
      }
    }

    const pelangganValue = document.getElementById("pelanggan").value;

    const header = {
      nomor_faktur: document.getElementById("nomorFaktur").value,
      tanggal: new Date(document.getElementById("tanggal").value).toISOString(),
      pelanggan_id: pelangganValue || null,
      subtotal: summary.subtotal,
      diskon: summary.diskon,
      pajak: summary.pajak,
      total: summary.total,
      metode_pembayaran: document.getElementById("metodePembayaran").value
    };

    const details = cart.map(item => ({
      barang_id: item.barang_id,
      qty: item.qty,
      harga_satuan: item.harga_satuan,
      diskon: item.diskon
    }));

    // create_sale membuat header + detail dalam satu transaksi.
    // Trigger PostgreSQL otomatis mengurangi stok saat detail masuk.
    const { data, error } = await salesClient.rpc("create_sale", {
      p_header: header,
      p_details: details
    });

    if (error) throw error;

    const customerName = pelangganList.find(
      customer => Number(customer.id) === Number(pelangganValue)
    )?.nama_pelanggan || "Pelanggan Umum";
    window.showSaleReceipt({
      invoice: header.nomor_faktur,
      date: header.tanggal,
      customer: customerName,
      payment: header.metode_pembayaran,
      items: cart.map(item => ({
        name: item.nama_barang,
        qty: item.qty,
        price: item.harga_satuan,
        total: item.qty * item.harga_satuan - item.diskon
      })),
      subtotal: summary.subtotal,
      discount: summary.diskon,
      tax: summary.pajak,
      total: summary.total
    });

    showToast(
      `Transaksi ${header.nomor_faktur} berhasil disimpan. ID: ${data}`
    );

    resetTransaction();
    await loadBarangForSale();
  } catch (error) {
    console.error(error);
    showToast(
      "Transaksi gagal: " + (error.message || "Kesalahan tidak diketahui."),
      "danger"
    );
  } finally {
    button.disabled = false;
    button.innerHTML = `<i class="bi bi-check-circle me-2"></i>Simpan Transaksi`;
  }
}

function resetTransaction() {
  cart = [];
  generateInvoiceNumber();
  setDefaultDate();

  document.getElementById("pelanggan").value = "";
  document.getElementById("metodePembayaran").value = "Tunai";
  document.getElementById("barangSelect").value = "";
  document.getElementById("qty").value = "1";
  document.getElementById("diskon").value = "0";
  document.getElementById("pajakPersen").value = "0";

  renderCart();
}
