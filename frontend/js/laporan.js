const reportClient = window.supabaseClient;
let reportSales = [];
let reportExpenses = [];
let reportTotals = {};

const reportMoney = value => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(Number(value || 0));

const reportEscape = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReportDate(value, includeTime = false) {
  return new Intl.DateTimeFormat("id-ID", includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }
  ).format(new Date(value));
}

function showReportToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const style = type === "danger" ? "text-bg-danger" : "text-bg-success";
  container.innerHTML = `
    <div class="toast align-items-center ${style} border-0 show" role="alert">
      <div class="d-flex"><div class="toast-body">${reportEscape(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()" aria-label="Tutup"></button>
      </div>
    </div>`;
  setTimeout(() => container.querySelector(".toast")?.remove(), 4000);
}

function getPeriod() {
  const startValue = document.getElementById("tanggalMulai").value;
  const endValue = document.getElementById("tanggalAkhir").value;
  if (!startValue || !endValue || startValue > endValue) {
    throw new Error("Tanggal periode tidak valid.");
  }

  const endExclusive = new Date(`${endValue}T00:00:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return {
    start: new Date(`${startValue}T00:00:00`).toISOString(),
    endExclusive: endExclusive.toISOString(),
    startValue,
    endValue
  };
}

function initializeReportDates() {
  const now = new Date();
  document.getElementById("tanggalMulai").value = localDateString(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  document.getElementById("tanggalAkhir").value = localDateString(now);
  document.getElementById("bebanTanggal").value = localDateString(now);
}

document.addEventListener("DOMContentLoaded", () => {
  initializeReportDates();
  document.getElementById("btnTerapkan").addEventListener("click", loadReport);
  document.getElementById("btnExport").addEventListener("click", exportReport);
  document.getElementById("formBeban").addEventListener("submit", saveExpense);
  loadReport();
});

async function loadReport() {
  const button = document.getElementById("btnTerapkan");
  let period;
  try {
    period = getPeriod();
  } catch (error) {
    showReportToast(error.message, "danger");
    return;
  }

  button.disabled = true;
  document.getElementById("btnExport").disabled = true;
  document.getElementById("penjualanBody").innerHTML = '<tr><td colspan="6" class="empty-state">Memuat laporan...</td></tr>';
  document.getElementById("bebanBody").innerHTML = '<tr><td colspan="4" class="empty-state">Memuat laporan...</td></tr>';

  const [salesResult, expensesResult] = await Promise.all([
    reportClient.from("penjualan")
      .select("id,nomor_faktur,tanggal,subtotal,diskon,pajak,total,metode_pembayaran,pelanggan(nama_pelanggan),detail_penjualan(id,qty,harga_satuan,harga_beli_satuan,diskon,barang(kode_barang,nama_barang))")
      .gte("tanggal", period.start)
      .lt("tanggal", period.endExclusive)
      .order("tanggal", { ascending: false }),
    reportClient.from("beban_operasional")
      .select("id,tanggal,kategori,keterangan,jumlah")
      .gte("tanggal", period.startValue)
      .lte("tanggal", period.endValue)
      .order("tanggal", { ascending: false })
  ]);

  button.disabled = false;
  if (salesResult.error || expensesResult.error) {
    const error = salesResult.error || expensesResult.error;
    console.error(error);
    showReportToast(`Gagal memuat laporan: ${error.message}`, "danger");
    document.getElementById("penjualanBody").innerHTML = `<tr><td colspan="6" class="empty-state">${reportEscape(error.message)}</td></tr>`;
    document.getElementById("bebanBody").innerHTML = '<tr><td colspan="4" class="empty-state">Data beban tidak tersedia.</td></tr>';
    return;
  }

  reportSales = salesResult.data || [];
  reportExpenses = expensesResult.data || [];
  reportTotals = calculateReportTotals();
  renderStatement(period);
  renderExpenses();
  renderSales();
  document.getElementById("btnExport").disabled = false;
}

function calculateReportTotals() {
  const salesSubtotal = reportSales.reduce((total, sale) => total + Number(sale.subtotal || 0), 0);
  const discounts = reportSales.reduce((total, sale) => total + Number(sale.diskon || 0), 0);
  const tax = reportSales.reduce((total, sale) => total + Number(sale.pajak || 0), 0);
  const cogs = reportSales.reduce((total, sale) => total + (sale.detail_penjualan || []).reduce(
    (subtotal, item) => subtotal + Number(item.qty || 0) * Number(item.harga_beli_satuan || 0), 0
  ), 0);
  const expenses = reportExpenses.reduce((total, expense) => total + Number(expense.jumlah || 0), 0);
  const netSales = salesSubtotal - discounts;
  const grossProfit = netSales - cogs;
  return { salesSubtotal, discounts, tax, cogs, expenses, netSales, grossProfit, netProfit: grossProfit - expenses };
}

function renderStatement(period) {
  const totals = reportTotals;
  const amount = (id, value, negative = false) => {
    document.getElementById(id).textContent = `${negative ? "(" : ""}${reportMoney(value)}${negative ? ")" : ""}`;
  };

  amount("nilaiPenjualan", totals.netSales);
  amount("nilaiHpp", totals.cogs);
  amount("nilaiLabaKotor", totals.grossProfit);
  amount("nilaiBeban", totals.expenses);
  amount("nilaiLabaBersih", totals.netProfit);
  document.getElementById("nilaiLabaBersih").classList.toggle("text-danger", totals.netProfit < 0);
  document.getElementById("nilaiLabaBersih").classList.toggle("text-success", totals.netProfit >= 0);

  amount("labaPenjualan", totals.salesSubtotal);
  amount("labaDiskon", totals.discounts, true);
  amount("labaPenjualanBersih", totals.netSales);
  amount("labaHpp", totals.cogs, true);
  amount("labaKotor", totals.grossProfit);
  amount("labaBeban", totals.expenses, true);
  amount("labaBersih", totals.netProfit);
  amount("labaPajak", totals.tax);
  document.getElementById("periodeLabel").textContent =
    `${formatReportDate(`${period.startValue}T00:00:00`)} – ${formatReportDate(`${period.endValue}T00:00:00`)}`;
}

function renderExpenses() {
  const tbody = document.getElementById("bebanBody");
  if (reportExpenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada beban pada periode ini.</td></tr>';
    return;
  }

  tbody.innerHTML = reportExpenses.map(expense => `
    <tr>
      <td>${formatReportDate(`${expense.tanggal}T00:00:00`)}</td>
      <td>${reportEscape(expense.kategori)}</td>
      <td>${reportEscape(expense.keterangan)}</td>
      <td class="text-end">${reportMoney(expense.jumlah)}</td>
    </tr>`).join("");
}

function renderSales() {
  const tbody = document.getElementById("penjualanBody");
  if (reportSales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada transaksi pada periode ini.</td></tr>';
    return;
  }

  tbody.innerHTML = reportSales.map((sale, index) => `
    <tr>
      <td>${formatReportDate(sale.tanggal, true)}</td>
      <td><strong>${reportEscape(sale.nomor_faktur)}</strong></td>
      <td>${reportEscape(sale.pelanggan?.nama_pelanggan || "Pelanggan Umum")}</td>
      <td>${reportEscape(sale.metode_pembayaran)}</td>
      <td class="text-end">${reportMoney(sale.total)}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-secondary" onclick="printSaleReceipt(${index})" title="Cetak struk" aria-label="Cetak struk"><i class="bi bi-printer"></i></button></td>
    </tr>`).join("");
}

window.printSaleReceipt = function(index) {
  const sale = reportSales[index];
  if (!sale) return;
  const items = (sale.detail_penjualan || []).map(item => {
    const product = Array.isArray(item.barang) ? item.barang[0] : item.barang;
    return {
      name: product?.nama_barang || "Barang",
      qty: Number(item.qty),
      price: Number(item.harga_satuan),
      total: Number(item.qty) * Number(item.harga_satuan) - Number(item.diskon || 0)
    };
  });

  window.showSaleReceipt({
    invoice: sale.nomor_faktur,
    date: sale.tanggal,
    customer: sale.pelanggan?.nama_pelanggan || "Pelanggan Umum",
    payment: sale.metode_pembayaran,
    items,
    subtotal: sale.subtotal,
    discount: sale.diskon,
    tax: sale.pajak,
    total: sale.total
  });
};

async function saveExpense(event) {
  event.preventDefault();
  const button = document.getElementById("btnSimpanBeban");
  const payload = {
    tanggal: document.getElementById("bebanTanggal").value,
    kategori: document.getElementById("bebanKategori").value,
    keterangan: document.getElementById("bebanKeterangan").value.trim(),
    jumlah: Number(document.getElementById("bebanJumlah").value)
  };

  if (!payload.tanggal || !payload.kategori || !payload.keterangan || payload.jumlah <= 0) {
    showReportToast("Lengkapi tanggal, kategori, keterangan, dan jumlah beban.", "danger");
    return;
  }

  button.disabled = true;
  const { error } = await reportClient.from("beban_operasional").insert(payload);
  button.disabled = false;
  if (error) {
    console.error(error);
    showReportToast(`Gagal mencatat beban: ${error.message}`, "danger");
    return;
  }

  document.getElementById("bebanKeterangan").value = "";
  document.getElementById("bebanJumlah").value = "";
  showReportToast("Beban operasional berhasil dicatat.");
  await loadReport();
}

function exportReport() {
  if (!window.XLSX) {
    showReportToast("Komponen Excel belum termuat. Periksa koneksi internet.", "danger");
    return;
  }

  const workbook = XLSX.utils.book_new();
  const summaryRows = [
    ["LAPORAN LABA RUGI"],
    ["Periode", document.getElementById("tanggalMulai").value, "s.d.", document.getElementById("tanggalAkhir").value],
    [],
    ["Keterangan", "Jumlah (Rp)"],
    ["Penjualan", reportTotals.salesSubtotal],
    ["Diskon Penjualan", reportTotals.discounts],
    ["Penjualan Bersih", reportTotals.netSales],
    ["Harga Pokok Penjualan", reportTotals.cogs],
    ["Laba Kotor", reportTotals.grossProfit],
    ["Beban Operasional", reportTotals.expenses],
    ["Laba Bersih", reportTotals.netProfit],
    ["Pajak Penjualan (informasi)", reportTotals.tax]
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Laba Rugi");

  const salesRows = [["Tanggal", "No. Faktur", "Pelanggan", "Metode Pembayaran", "Penjualan", "Diskon", "Pajak", "Total", "HPP", "Laba Kotor"]];
  const detailRows = [["Tanggal", "No. Faktur", "Kode Barang", "Nama Barang", "Qty", "Harga Jual", "HPP Satuan", "Diskon Item", "Subtotal", "HPP Total", "Laba Kotor"]];
  reportSales.forEach(sale => {
    const details = sale.detail_penjualan || [];
    const cogs = details.reduce((total, item) => total + Number(item.qty) * Number(item.harga_beli_satuan || 0), 0);
    salesRows.push([
      formatReportDate(sale.tanggal, true), sale.nomor_faktur,
      sale.pelanggan?.nama_pelanggan || "Pelanggan Umum", sale.metode_pembayaran,
      Number(sale.subtotal), Number(sale.diskon), Number(sale.pajak), Number(sale.total), cogs,
      Number(sale.subtotal) - Number(sale.diskon) - cogs
    ]);
    details.forEach(item => {
      const product = Array.isArray(item.barang) ? item.barang[0] : item.barang;
      const subtotal = Number(item.qty) * Number(item.harga_satuan) - Number(item.diskon || 0);
      const itemCogs = Number(item.qty) * Number(item.harga_beli_satuan || 0);
      detailRows.push([
        formatReportDate(sale.tanggal, true), sale.nomor_faktur, product?.kode_barang || "",
        product?.nama_barang || "Barang", Number(item.qty), Number(item.harga_satuan),
        Number(item.harga_beli_satuan), Number(item.diskon || 0), subtotal, itemCogs, subtotal - itemCogs
      ]);
    });
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(salesRows), "Penjualan");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(detailRows), "Detail Penjualan");

  const expenseRows = [["Tanggal", "Kategori", "Keterangan", "Jumlah (Rp)"], ...reportExpenses.map(expense => [
    expense.tanggal, expense.kategori, expense.keterangan, Number(expense.jumlah)
  ])];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(expenseRows), "Beban");

  const start = document.getElementById("tanggalMulai").value;
  const end = document.getElementById("tanggalAkhir").value;
  XLSX.writeFile(workbook, `laporan-keuangan-${start}-${end}.xlsx`);
}
