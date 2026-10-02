function escapeReceipt(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function receiptRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal fade" id="receiptModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Struk Penjualan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>
          </div>
          <div class="modal-body">
            <div id="receiptPrint" class="receipt-print"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Tutup</button>
            <button type="button" class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer me-1"></i>Cetak Struk</button>
          </div>
        </div>
      </div>
    </div>
  `);
});

window.showSaleReceipt = function(receipt) {
  const itemRows = receipt.items.map(item => `
    <tr>
      <td>${escapeReceipt(item.name)}<br><span class="receipt-muted">${item.qty} x ${receiptRupiah(item.price)}</span></td>
      <td class="text-end">${receiptRupiah(item.total)}</td>
    </tr>
  `).join("");

  document.getElementById("receiptPrint").innerHTML = `
    <header class="receipt-header">
      <h2>Toko Sembako</h2>
      <p>BUKTI PEMBAYARAN</p>
    </header>
    <div class="receipt-meta">
      <div><span>No. Faktur</span><strong>${escapeReceipt(receipt.invoice)}</strong></div>
      <div><span>Tanggal</span><strong>${escapeReceipt(new Date(receipt.date).toLocaleString("id-ID"))}</strong></div>
      <div><span>Pelanggan</span><strong>${escapeReceipt(receipt.customer || "Pelanggan Umum")}</strong></div>
      <div><span>Pembayaran</span><strong>${escapeReceipt(receipt.payment)}</strong></div>
    </div>
    <table class="receipt-items"><tbody>${itemRows}</tbody></table>
    <div class="receipt-totals">
      <div><span>Subtotal</span><strong>${receiptRupiah(receipt.subtotal)}</strong></div>
      <div><span>Diskon</span><strong>${receiptRupiah(receipt.discount)}</strong></div>
      <div><span>Pajak</span><strong>${receiptRupiah(receipt.tax)}</strong></div>
      <div class="receipt-grand-total"><span>TOTAL</span><strong>${receiptRupiah(receipt.total)}</strong></div>
    </div>
    <p class="receipt-thanks">Terima kasih telah berbelanja.</p>
  `;

  bootstrap.Modal.getOrCreateInstance(document.getElementById("receiptModal")).show();
};
