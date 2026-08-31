// ==================== DATABASE INTERNAL & PETUGAS ====================
// Berfungsi sebagai fallback lokal dari spreadsheet data sarana & petugas Anda
const databasePetugas = {
    masinis: [
        { nama: "BUKHORI", id: "63547" }, { nama: "HAFID", id: "47291" },
        { nama: "ARDI", id: "49417" }, { nama: "HARIK", id: "56547" },
        { nama: "ANDRIAWAN", id: "60629" }, { nama: "NAUFAL", id: "70902" },
        { nama: "IKHWANUL", id: "60674" }, { nama: "ABRAHAM", id: "61195" }
    ],
    asmas: [
        { nama: "MAULANA", id: "61509" }, { nama: "LARASANDI", id: "61718" },
        { nama: "SAHIFUL", id: "56589" }, { nama: "HARIYADI", id: "44139" },
        { nama: "MANAN", id: "63548" }, { nama: "SUHARTO", id: "61107" },
        { nama: "IKHWANUL", id: "60674" }, { nama: "ABRAHAM", id: "61195" }
    ],
    kdr: [
        { nama: "HARI", id: "61505" }, { nama: "MAULANA", id: "61509" },
        { nama: "FEBRIYAN", id: "75407" }, { nama: "TAUFIQ", id: "70418" },
        { nama: "ARIF", id: "77317" }, { nama: "ULHAQ", id: "75408" },
        { nama: "ALFAN", id: "75383" }
    ],
    tka: [
        { nama: "IBAD", id: "56631" }, { nama: "TITUS", id: "56642" },
        { nama: "DADANG", id: "64331" }, { nama: "ARTONO", id: "56518" },
        { nama: "KHALIF", id: "76136" }, { nama: "ABIDIN", id: "53579" }
    ],
    lokomotif: ["CC2019211", "CC2019202", "CC2018316", "CC2039808", "CC2017804", "CC2061317", "CC2061379"]
};

// Data Awal Penyimpanan (Mock Data Berdasarkan Spreadsheet CATKA Anda)
let catkaStorage = [
    {
        tanggal: "2026-08-01",
        noKa: "7045",
        namaKa: "SANGKURIANG",
        arah: "KEDATANGAN",
        masinis: "IKHWANUL 60674",
        asmas: "ABRAHAM 61195",
        kdr: "ALFAN 75383",
        tka: "ABIDIN 53579",
        lokomotif: "CC2061325",
        stamformasi: "K3 01803 F\nK3 01861 F\nK3 01839 F\nM1 01906 F\nK1 018153 F\nK1 01898 F\nK1 01905 F\nK1 01849 F\nT1 00902 F\nP 06802 F"
    }
];

// ==================== INSTALASI AWAL / INIT ====================
document.addEventListener("DOMContentLoaded", () => {
    populateDropdowns();
    renderTable();

    // Event Listener Deteksi Pengisian Nomor KA Otomatis (Arah Balik Rangkaian)
    document.getElementById("noKa").addEventListener("input", handleAutoStamformasi);
    
    // Event Listener Tambah Data Form
    document.getElementById("catkaForm").addEventListener("submit", handleSubmitCatka);
    
    // Event Listener Fitur Live Search
    document.getElementById("globalSearch").addEventListener("input", renderTable);
    
    // Event Listener Filter Tanggal
    document.getElementById("filterDate").addEventListener("change", renderTable);
});

// Mengisi Pilihan Dropdown Form dari Database Petugas
function populateDropdowns() {
    const fields = ['masinis', 'asmas', 'kdr', 'tka'];
    fields.forEach(field => {
        const select = document.getElementById(field);
        databasePetugas[field].forEach(item => {
            let option = document.createElement("option");
            option.value = `${item.nama} ${item.id}`;
            option.textContent = `${item.nama} (${item.id})`;
            select.appendChild(option);
        });
    });

    const selectLok = document.getElementById("lokomotif");
    databasePetugas.lokomotif.forEach(lok => {
        let option = document.createElement("option");
        option.value = lok;
        option.textContent = lok;
        selectLok.appendChild(option);
    });
}

// ==================== LOGIKA AUTO REVERSE STAMFORMASI ====================
function handleAutoStamformasi(e) {
    const inputNoKa = e.target.value.trim();
    if (!inputNoKa) return;

    const currentTanggal = document.getElementById("filterDate").value;

    // Cari KA pembanding di hari yang sama
    const kadiHariSama = catkaStorage.find(item => item.tanggal === currentTanggal);
    
    if (kadiHariSama) {
        // Logika logika otomatis balik susunan (contoh: 7045 ke 7046)
        if (
            (parseInt(inputNoKa) === parseInt(kadiHariSama.noKa) + 1) || 
            (parseInt(inputNoKa) === parseInt(kadiHariSama.noKa) - 1)
        ) {
            // Ambil susunan stamformasi sebelumnya, pecah per baris, balik urutan, lalu gabung kembali
            const susunanAsli = kadiHariSama.stamformasi.split("\n");
            const susunanTerbalik = susunanAsli.reverse().join("\n");
            
            document.getElementById("stamformasi").value = susunanTerbalik;
            document.getElementById("namaKa").value = kadiHariSama.namaKa;
            
            // Ubah arah default agar berlawanan dengan KA pasangannya
            document.getElementById("arahKa").value = kadiHariSama.arah === "KEDATANGAN" ? "KEBERANGKATAN" : "KEDATANGAN";
        }
    }
}

// ==================== SIMPAN DATA ====================
function handleSubmitCatka(e) {
    e.preventDefault();

    const newData = {
        tanggal: document.getElementById("filterDate").value,
        noKa: document.getElementById("noKa").value,
        namaKa: document.getElementById("namaKa").value || "Reguler",
        arah: document.getElementById("arahKa").value,
        masinis: document.getElementById("masinis").value,
        asmas: document.getElementById("asmas").value,
        kdr: document.getElementById("kdr").value,
        tka: document.getElementById("tka").value,
        lokomotif: document.getElementById("lokomotif").value,
        stamformasi: document.getElementById("stamformasi").value
    };

    catkaStorage.push(newData);
    renderTable();
    document.getElementById("catkaForm").reset();
    alert(`Data CATKA KA ${newData.noKa} berhasil ditambahkan!`);
}

// ==================== BULAN & TANGGAL CONTROL ====================
function changeMonth(direction) {
    const dateInput = document.getElementById("filterDate");
    let current = new Date(dateInput.value);
    current.setMonth(current.getMonth() + direction);
    
    // Format YYYY-MM-DD kembali ke input date
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    renderTable();
}

// ==================== AMBIL & FILTER DATA KE TABEL ====================
function renderTable() {
    const tableBody = document.getElementById("catkaTableBody");
    const filterDateValue = document.getElementById("filterDate").value;
    const searchQuery = document.getElementById("globalSearch").value.toLowerCase();
    
    // Set Label Bulan Aktif di Header Tabel
    const opsiBulan = { month: 'long', year: 'numeric' };
    document.getElementById("currentViewLabel").textContent = new Date(filterDateValue).toLocaleDateString('id-ID', opsiBulan);

    tableBody.innerHTML = "";

    // Lakukan filter berdasarkan Bulan/Tahun terpilih dan kueri pencarian global
    const targetMonth = new Date(filterDateValue).getMonth();
    const targetYear = new Date(filterDateValue).getFullYear();

    const filteredData = catkaStorage.filter(item => {
        const itemDate = new Date(item.tanggal);
        const matchWaktu = itemDate.getMonth() === targetMonth && itemDate.getFullYear() === targetYear;
        
        const matchSearch = 
            item.noKa.toLowerCase().includes(searchQuery) ||
            item.namaKa.toLowerCase().includes(searchQuery) ||
            item.masinis.toLowerCase().includes(searchQuery) ||
            item.asmas.toLowerCase().includes(searchQuery) ||
            item.kdr.toLowerCase().includes(searchQuery) ||
            item.tka.toLowerCase().includes(searchQuery) ||
            item.lokomotif.toLowerCase().includes(searchQuery);

        return matchWaktu && matchSearch;
    });

    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b;">Tidak ada data CATKA yang cocok atau tersedia pada bulan ini.</td></tr>`;
        return;
    }

    // Suntikkan Baris Data ke DOM Tabel
    filteredData.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${item.tanggal}</strong></td>
            <td><span class="badge" style="background:#1e3a8a">${item.noKa}</span></td>
            <td>${item.namaKa}</td>
            <td><small><em>${item.arah}</em></small></td>
            <td>
                Msn: <strong>${item.masinis}</strong><br>
                Asm: ${item.asmas}<br>
                Kdr: ${item.kdr} | Tka: ${item.tka}
            </td>
            <td>🚂 ${item.lokomotif}</td>
            <td><div class="stam-list">${item.stamformasi}</div></td>
        `;
        tableBody.appendChild(row);
    });
}
