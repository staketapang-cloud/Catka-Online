// ==================== DATABASE INTERNAL & PETUGAS ====================
// ==================== INITIAL DATABASE FALLBACK ====================
const defaultPetugas = {
    masinis: ["BUKHORI 63547", "HAFID 47291", "ARDI 49417", "HARIK 56547", "ANDRIAWAN 60629", "NAUFAL 70902"],
    asmas: ["MAULANA 61509", "LARASANDI 61718", "SAHIFUL 56589", "HARIYADI 44139", "MANAN 63548", "SUHARTO 61107"],
    kdr: ["HARI 61505", "MAULANA 61509", "FEBRIYAN 75407", "TAUFIQ 70418", "ARIF 77317", "ULHAQ 75408"],
    tka: ["IBAD 56631", "TITUS 56642", "DADANG 64331", "ARTONO 56518", "KHALIF 76136"],
    lokomotif: ["CC2019211", "CC2019202", "CC2018316", "CC2039808", "CC2017804", "CC2061317"]
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

// SOLUSI KUNCI: Ambil data dari LocalStorage, jika kosong baru pakai defaultData
let databasePetugas = JSON.parse(localStorage.getItem("catka_petugas")) || defaultPetugas;
let catkaStorage = JSON.parse(localStorage.getItem("catka_data")) || catkaStorage;

// ==================== INISIALISASI SISTEM ====================
document.addEventListener("DOMContentLoaded", () => {
    // Set default penanggalan ke hari ini
    const hariIni = new Date().toISOString().split('T')[0];
    document.getElementById("filterDate").value = hariIni;

    renderDropdowns();
    renderTable();

    document.getElementById("noKa").addEventListener("input", handleAutoStamformasi);
    document.getElementById("catkaForm").addEventListener("submit", handleSubmitCatka);
    document.getElementById("globalSearch").addEventListener("input", renderTable);
    document.getElementById("filterDate").addEventListener("change", renderTable);
});

// Render/Update List Rekomendasi Dropdown ke elemen Datalist HTML5 [1]
function renderDropdowns() {
    const fields = ['masinis', 'asmas', 'kdr', 'tka', 'lokomotif'];
    fields.forEach(field => {
        const datalist = document.getElementById(`list_${field}`);
        datalist.innerHTML = ""; // Bersihkan list lama
        
        // Urutkan alfabetis agar mempermudah pencarian visual pengguna
        databasePetugas[field].sort().forEach(item => {
            let option = document.createElement("option");
            option.value = item;
            datalist.appendChild(option);
        });
    });
}

// ==================== LOGIKA AUTO REVERSE STAMFORMASI ====================
function handleAutoStamformasi(e) {
    const inputNoKa = e.target.value.trim();
    if (!inputNoKa) return;

    const currentTanggal = document.getElementById("filterDate").value;
    const kadiHariSama = catkaStorage.find(item => item.tanggal === currentTanggal);
    
    if (kadiHariSama) {
        if ((parseInt(inputNoKa) === parseInt(kadiHariSama.noKa) + 1) || 
            (parseInt(inputNoKa) === parseInt(kadiHariSama.noKa) - 1)) {
            
            const susunanAsli = kadiHariSama.stamformasi.split("\n");
            const susunanTerbalik = susunanAsli.reverse().join("\n");
            
            document.getElementById("stamformasi").value = susunanTerbalik;
            document.getElementById("namaKa").value = kadiHariSama.namaKa;
            document.getElementById("arahKa").value = kadiHariSama.arah === "KEDATANGAN" ? "KEBERANGKATAN" : "KEDATANGAN";
        }
    }
}

// ==================== SIMPAN & UPDATE DATABASE PETUGAS ====================
function handleSubmitCatka(e) {
    e.preventDefault();

    // Mengambil nilai input teks murni dari form
    const valMasinis = document.getElementById("masinis").value.trim().toUpperCase();
    const valAsmas = document.getElementById("asmas").value.trim().toUpperCase();
    const valKdr = document.getElementById("kdr").value.trim().toUpperCase();
    const valTka = document.getElementById("tka").value.trim().toUpperCase();
    const valLok = document.getElementById("lokomotif").value.trim().toUpperCase();

    const newData = {
        tanggal: document.getElementById("filterDate").value,
        noKa: document.getElementById("noKa").value,
        namaKa: document.getElementById("namaKa").value || "Reguler",
        arah: document.getElementById("arahKa").value,
        masinis: valMasinis,
        asmas: valAsmas,
        kdr: valKdr,
        tka: valTka,
        lokomotif: valLok,
        stamformasi: document.getElementById("stamformasi").value
    };

    // LOGIKA PENYUNTIKAN OTOMATIS KE DATABASE PETUGAS JIKA DATA BELUM ADA
    let databaseBerubah = false;
    const checkAndUpdateDB = (kategori, nilai) => {
        if (nilai && !databasePetugas[kategori].includes(nilai)) {
            databasePetugas[kategori].push(nilai);
            databaseBerubah = true;
        }
    };

    checkAndUpdateDB('masinis', valMasinis);
    checkAndUpdateDB('asmas', valAsmas);
    checkAndUpdateDB('kdr', valKdr);
    checkAndUpdateDB('tka', valTka);
    checkAndUpdateDB('lokomotif', valLok);

    // Jika ada kru/lokomotif baru, simpan ke memori database petugas lokal
    if (databaseBerubah) {
        localStorage.setItem("catka_petugas", JSON.stringify(databasePetugas));
        renderDropdowns(); // Gambar ulang elemen rekomendasi datalist [1]
    }

    // Simpan data log CATKA utama
    catkaStorage.push(newData);
    localStorage.setItem("catka_data", JSON.stringify(catkaStorage));

    renderTable();
    
    // Reset form isian dengan mengunci tanggal agar tidak perlu input ulang
    const tglSebelumnya = document.getElementById("filterDate").value;
    document.getElementById("catkaForm").reset();
    document.getElementById("filterDate").value = tglSebelumnya;

    alert(`Data CATKA KA ${newData.noKa} berhasil disimpan! Kru baru (jika ada) otomatis masuk ke daftar database.`);
}

// ==================== NAVIGASI KALENDER BULAN ====================
function changeMonth(direction) {
    const dateInput = document.getElementById("filterDate");
    let current = new Date(dateInput.value);
    current.setMonth(current.getMonth() + direction);
    
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    renderTable();
}

// ==================== FITUR HAPUS DATA ====================
function deleteCatka(idCatka, noKa) {
    if (confirm(`Apakah Anda yakin ingin menghapus permanen data CATKA Kereta Api ${noKa}?`)) {
        // Filter array untuk membuang ID yang dipilih
        catkaStorage = catkaStorage.filter(item => item.id !== idCatka);
        // Perbarui LocalStorage utama
        localStorage.setItem("catka_data", JSON.stringify(catkaStorage));
        // Gambar Ulang Tabel
        renderTable();
    }
}

// ==================== AMBIL & FILTER DATA KE TABEL ====================
function renderTable() {
    const tableBody = document.getElementById("catkaTableBody");
    const filterDateValue = document.getElementById("filterDate").value;
    const searchQuery = document.getElementById("globalSearch").value.toLowerCase().trim();
    const opsiBulan = { month: 'long', year: 'numeric' };
    
    tableBody.innerHTML = "";

    const targetMonth = new Date(filterDateValue).getMonth();
    const targetYear = new Date(filterDateValue).getFullYear();

    const filteredData = catkaStorage.filter(item => {
        const itemDate = new Date(item.tanggal);
        const matchWaktuDefault = itemDate.getMonth() === targetMonth && itemDate.getFullYear() === targetYear;
        
        const matchSearch = 
            item.tanggal.includes(searchQuery) || 
            item.noKa.toLowerCase().includes(searchQuery) ||
            item.namaKa.toLowerCase().includes(searchQuery) ||
            item.masinis.toLowerCase().includes(searchQuery) ||
            item.asmas.toLowerCase().includes(searchQuery) ||
            item.kdr.toLowerCase().includes(searchQuery) ||
            item.tka.toLowerCase().includes(searchQuery) ||
            item.lokomotif.toLowerCase().includes(searchQuery);

        if (searchQuery !== "") {
            return matchSearch;
        } else {
            return matchWaktuDefault;
        }
    });

    const currentLabelElement = document.getElementById("currentViewLabel");
    if (searchQuery !== "") {
        currentLabelElement.textContent = `🔍 Hasil Pencarian: "${searchQuery}"`;
        currentLabelElement.style.background = "#ef4444";
    } else {
        currentLabelElement.textContent = new Date(filterDateValue).toLocaleDateString('id-ID', opsiBulan);
        currentLabelElement.style.background = "var(--secondary-color)";
    }

    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#64748b; padding: 2rem;">❌ Tidak ada data CATKA yang cocok.</td></tr>`;
        return;
    }

    // Urutkan record data dari tanggal terkini
    filteredData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

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
