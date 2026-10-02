(function() {
  const storageKey = "toko-sembako-demo-v1";
  let memoryState;

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeSeed() {
    const now = new Date();
    const makeDate = daysAgo => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    };

    const state = {
      barang: [
        { id: 1, kode_barang: "BRG-001", nama_barang: "Beras Ramos 5 kg", kategori: "Beras", satuan: "sak", harga_beli: 66000, harga_jual: 73500, stok: 24, stok_minimum: 5 },
        { id: 2, kode_barang: "BRG-002", nama_barang: "Minyak Goreng 1 L", kategori: "Minyak", satuan: "pouch", harga_beli: 16000, harga_jual: 19000, stok: 35, stok_minimum: 8 },
        { id: 3, kode_barang: "BRG-003", nama_barang: "Gula Pasir 1 kg", kategori: "Gula", satuan: "kg", harga_beli: 14500, harga_jual: 17000, stok: 27, stok_minimum: 6 },
        { id: 4, kode_barang: "BRG-004", nama_barang: "Telur Ayam 1 kg", kategori: "Protein", satuan: "kg", harga_beli: 27000, harga_jual: 31000, stok: 16, stok_minimum: 5 },
        { id: 5, kode_barang: "BRG-005", nama_barang: "Tepung Terigu 1 kg", kategori: "Bahan Kue", satuan: "kg", harga_beli: 10500, harga_jual: 13000, stok: 8, stok_minimum: 10 },
        { id: 6, kode_barang: "BRG-006", nama_barang: "Mi Instan Goreng", kategori: "Makanan", satuan: "pcs", harga_beli: 3500, harga_jual: 4500, stok: 60, stok_minimum: 12 },
        { id: 7, kode_barang: "BRG-007", nama_barang: "Kopi Sachet", kategori: "Minuman", satuan: "sachet", harga_beli: 1200, harga_jual: 1600, stok: 85, stok_minimum: 20 },
        { id: 8, kode_barang: "BRG-008", nama_barang: "Teh Celup 25 Kantong", kategori: "Minuman", satuan: "kotak", harga_beli: 8500, harga_jual: 11000, stok: 7, stok_minimum: 8 },
        { id: 9, kode_barang: "BRG-009", nama_barang: "Garam Halus 500 g", kategori: "Bumbu", satuan: "bungkus", harga_beli: 2000, harga_jual: 3000, stok: 24, stok_minimum: 6 },
        { id: 10, kode_barang: "BRG-010", nama_barang: "Susu Kental Manis", kategori: "Susu", satuan: "kaleng", harga_beli: 9500, harga_jual: 12000, stok: 6, stok_minimum: 4 },
        { id: 11, kode_barang: "BRG-011", nama_barang: "Gas LPG 3 kg", kategori: "Rumah Tangga", satuan: "tabung", harga_beli: 22000, harga_jual: 25000, stok: 13, stok_minimum: 5 },
        { id: 12, kode_barang: "BRG-012", nama_barang: "Air Mineral 600 ml", kategori: "Minuman", satuan: "botol", harga_beli: 2400, harga_jual: 3500, stok: 40, stok_minimum: 12 }
      ],
      pelanggan: [
        { id: 1, kode_pelanggan: "PLG-001", nama_pelanggan: "Warung Bu Sari", no_telepon: "081234567801", alamat: "Jl. Melati" },
        { id: 2, kode_pelanggan: "PLG-002", nama_pelanggan: "Pak Hendra", no_telepon: "081234567802", alamat: "Jl. Kenanga" },
        { id: 3, kode_pelanggan: "PLG-003", nama_pelanggan: "Katering Dapur Rasa", no_telepon: "081234567803", alamat: "Jl. Mawar" }
      ],
      penjualan: [],
      detail_penjualan: [],
      beban_operasional: []
    };

    const addSale = (id, daysAgo, customerId, lines, discount, payment) => {
      const details = lines.map(([productId, qty]) => {
        const product = state.barang.find(item => item.id === productId);
        product.stok -= qty;
        const subtotal = product.harga_jual * qty;
        return {
          id: state.detail_penjualan.length + 1,
          penjualan_id: id,
          barang_id: productId,
          qty,
          harga_satuan: product.harga_jual,
          harga_beli_satuan: product.harga_beli,
          diskon: 0,
          subtotal,
          barang: { kode_barang: product.kode_barang, nama_barang: product.nama_barang }
        };
      });
      const subtotal = details.reduce((sum, item) => sum + item.subtotal, 0);
      state.detail_penjualan.push(...details);
      state.penjualan.push({
        id,
        nomor_faktur: `INV-DEMO-${String(id).padStart(3, "0")}`,
        tanggal: makeDate(daysAgo),
        pelanggan_id: customerId,
        subtotal,
        diskon: discount,
        pajak: 0,
        total: subtotal - discount,
        metode_pembayaran: payment,
        pelanggan: copy(state.pelanggan.find(item => item.id === customerId)),
        detail_penjualan: details
      });
    };

    addSale(1, 6, 1, [[1, 1], [2, 2], [3, 2], [6, 5]], 2500, "Tunai");
    addSale(2, 3, 2, [[4, 2], [5, 1], [7, 10], [9, 2]], 0, "QRIS");
    addSale(3, 0, 3, [[1, 1], [8, 2], [11, 1], [12, 6]], 5000, "Transfer");

    state.beban_operasional = [
      { id: 1, tanggal: localDate(now, 1), kategori: "Listrik & Air", keterangan: "Tagihan listrik toko", jumlah: 185000 },
      { id: 2, tanggal: localDate(now, 4), kategori: "Transportasi", keterangan: "Ongkos angkut barang", jumlah: 65000 },
      { id: 3, tanggal: localDate(now, 8), kategori: "Perlengkapan", keterangan: "Kantong belanja dan label harga", jumlah: 42000 }
    ];
    return state;
  }

  function localDate(date, daysAgo) {
    const result = new Date(date);
    result.setDate(result.getDate() - daysAgo);
    const year = result.getFullYear();
    const month = String(result.getMonth() + 1).padStart(2, "0");
    const day = String(result.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function readState() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        memoryState = JSON.parse(saved);
        return memoryState;
      }
    } catch (error) {
      console.warn("Penyimpanan browser tidak tersedia; data demo hanya aktif selama halaman terbuka.", error);
    }

    if (!memoryState) {
      memoryState = makeSeed();
      persistState();
    }
    return memoryState;
  }

  function persistState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(memoryState));
    } catch (error) {
      console.warn("Perubahan data demo tidak dapat disimpan di browser.", error);
    }
  }

  function matchesFilters(row, filters) {
    return filters.every(filter => {
      const value = row[filter.column];
      if (filter.operator === "eq") return String(value ?? "") === String(filter.value ?? "");
      if (filter.operator === "in") return filter.value.some(item => String(item) === String(value));
      if (filter.operator === "gte") return String(value ?? "") >= String(filter.value);
      if (filter.operator === "lte") return String(value ?? "") <= String(filter.value);
      if (filter.operator === "lt") return String(value ?? "") < String(filter.value);
      return true;
    });
  }

  function enrichRow(table, row, state) {
    if (table !== "penjualan") return copy(row);
    const customer = state.pelanggan.find(item => Number(item.id) === Number(row.pelanggan_id));
    const details = state.detail_penjualan
      .filter(item => Number(item.penjualan_id) === Number(row.id))
      .map(item => {
        const product = state.barang.find(entry => Number(entry.id) === Number(item.barang_id));
        return { ...copy(item), barang: product ? { kode_barang: product.kode_barang, nama_barang: product.nama_barang } : null };
      });
    return { ...copy(row), pelanggan: customer ? copy(customer) : null, detail_penjualan: details };
  }

  class DemoQuery {
    constructor(table) {
      this.table = table;
      this.action = "select";
      this.filters = [];
      this.ordering = null;
      this.head = false;
      this.countExact = false;
      this.payload = null;
    }

    select(_columns = "*", options = {}) {
      this.head = Boolean(options.head);
      this.countExact = options.count === "exact";
      return this;
    }

    order(column, options = {}) {
      this.ordering = { column, ascending: options.ascending !== false };
      return this;
    }

    eq(column, value) { this.filters.push({ operator: "eq", column, value }); return this; }
    in(column, value) { this.filters.push({ operator: "in", column, value }); return this; }
    gte(column, value) { this.filters.push({ operator: "gte", column, value }); return this; }
    lte(column, value) { this.filters.push({ operator: "lte", column, value }); return this; }
    lt(column, value) { this.filters.push({ operator: "lt", column, value }); return this; }

    insert(payload) { this.action = "insert"; this.payload = payload; return this; }
    update(payload) { this.action = "update"; this.payload = payload; return this; }
    delete() { this.action = "delete"; return this; }

    async run() {
      const state = readState();
      const rows = state[this.table];
      if (!rows) return { data: null, error: { message: `Tabel demo '${this.table}' tidak tersedia.` } };

      try {
        if (this.action === "select") {
          let result = rows.filter(row => matchesFilters(row, this.filters));
          if (this.ordering) {
            const { column, ascending } = this.ordering;
            result = [...result].sort((left, right) => {
              const a = left[column];
              const b = right[column];
              const comparison = typeof a === "number" && typeof b === "number"
                ? a - b
                : String(a ?? "").localeCompare(String(b ?? ""), "id");
              return ascending ? comparison : -comparison;
            });
          }
          return { data: this.head ? null : result.map(row => enrichRow(this.table, row, state)), count: this.countExact ? result.length : null, error: null };
        }

        if (this.action === "insert") {
          const entries = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(entry => {
            const nextId = rows.reduce((highest, row) => Math.max(highest, Number(row.id) || 0), 0) + 1;
            const record = { ...copy(entry), id: entry.id ?? nextId };
            if (this.table === "barang" && rows.some(row => row.kode_barang === record.kode_barang)) {
              throw new Error("Kode barang sudah digunakan.");
            }
            if (this.table === "barang") record.updated_at = new Date().toISOString();
            if (this.table === "beban_operasional") record.created_at = new Date().toISOString();
            rows.push(record);
            return record;
          });
          persistState();
          return { data: copy(entries), error: null };
        }

        const selected = rows.filter(row => matchesFilters(row, this.filters));
        if (this.action === "update") {
          selected.forEach(row => Object.assign(row, copy(this.payload), { updated_at: new Date().toISOString() }));
          persistState();
          return { data: copy(selected), error: null };
        }
        if (this.action === "delete") {
          if (this.table === "barang" && selected.some(row => state.detail_penjualan.some(item => Number(item.barang_id) === Number(row.id)))) {
            throw new Error("Barang sudah tercatat di transaksi dan tidak dapat dihapus.");
          }
          state[this.table] = rows.filter(row => !selected.includes(row));
          persistState();
          return { data: copy(selected), error: null };
        }
        return { data: null, error: { message: "Operasi demo tidak dikenal." } };
      } catch (error) {
        return { data: null, error: { message: error.message || "Operasi gagal." } };
      }
    }

    then(resolve, reject) {
      return this.run().then(resolve, reject);
    }
  }

  function createDemoClient() {
    readState();
    return {
      from(table) { return new DemoQuery(table); },
      async rpc(name, parameters) {
        if (name !== "create_sale") return { data: null, error: { message: `RPC '${name}' tidak tersedia pada mode demo.` } };
        const state = readState();
        const header = parameters.p_header;
        const details = parameters.p_details || [];
        if (!details.length) return { data: null, error: { message: "Detail penjualan tidak boleh kosong." } };
        if (state.penjualan.some(sale => sale.nomor_faktur === header.nomor_faktur)) {
          return { data: null, error: { message: "Nomor faktur sudah digunakan. Silakan reset transaksi." } };
        }

        const products = details.map(detail => state.barang.find(item => Number(item.id) === Number(detail.barang_id)));
        for (let index = 0; index < details.length; index += 1) {
          const detail = details[index];
          const product = products[index];
          if (!product) return { data: null, error: { message: "Barang tidak ditemukan." } };
          if (!Number.isInteger(Number(detail.qty)) || Number(detail.qty) <= 0) {
            return { data: null, error: { message: "Qty harus berupa bilangan bulat lebih dari 0." } };
          }
          if (Number(product.stok) < Number(detail.qty)) {
            return { data: null, error: { message: `Stok ${product.nama_barang} tidak mencukupi.` } };
          }
        }

        const id = state.penjualan.reduce((highest, sale) => Math.max(highest, Number(sale.id) || 0), 0) + 1;
        const savedDetails = details.map((detail, index) => {
          const product = products[index];
          product.stok -= Number(detail.qty);
          const subtotal = Number(detail.qty) * Number(detail.harga_satuan) - Number(detail.diskon || 0);
          const saved = {
            id: state.detail_penjualan.reduce((highest, row) => Math.max(highest, Number(row.id) || 0), 0) + 1,
            penjualan_id: id,
            barang_id: Number(detail.barang_id),
            qty: Number(detail.qty),
            harga_satuan: Number(detail.harga_satuan),
            harga_beli_satuan: Number(product.harga_beli),
            diskon: Number(detail.diskon || 0),
            subtotal
          };
          state.detail_penjualan.push(saved);
          return saved;
        });
        const customer = state.pelanggan.find(item => Number(item.id) === Number(header.pelanggan_id));
        state.penjualan.push({
          id,
          nomor_faktur: header.nomor_faktur,
          tanggal: header.tanggal,
          pelanggan_id: header.pelanggan_id ? Number(header.pelanggan_id) : null,
          subtotal: Number(header.subtotal),
          diskon: Number(header.diskon),
          pajak: Number(header.pajak),
          total: Number(header.total),
          metode_pembayaran: header.metode_pembayaran,
          pelanggan: customer ? copy(customer) : null,
          detail_penjualan: savedDetails
        });
        persistState();
        return { data: id, error: null };
      }
    };
  }

  window.createDemoClient = createDemoClient;
})();
