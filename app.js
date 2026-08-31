// ==================== DATABASE INTERNAL & PETUGAS ====================
const defaultPetugas = {
    masinis: ["BUKHORI 63547", "HAFID 47291", "ARDI 49417", "HARIK 56547", "ANDRIAWAN 60629", "NAUFAL 70902"],
    asmas: ["MAULANA 61509", "LARASANDI 61718", "SAHIFUL 56589", "HARIYADI 44139", "MANAN 63548", "SUHARTO 61107"],
    kdr: ["HARI 61505", "MAULANA 61509", "FEBRIYAN 75407", "TAUFIQ 70418", "ARIF 77317", "ULHAQ 75408"],
    tka: ["IBAD 56631", "TITUS 56642", "DADANG 64331", "ARTONO 56518", "KHALIF 76136"],
    lokomotif: ["CC2019211", "CC2019202", "CC2018316", "CC2039808", "CC2017804", "CC2061317"]
};

// Data Awal Penyimpanan (Fallback jika LocalStorage masih kosong)
const initialCatka = [
    {
        id: 1722441600000,
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

// SOLUSI KUNCI: Ambil data dari LocalStorage, perbaikan eror deklarasi ganda
let databasePetugas = JSON.parse(localStorage.getItem("catka_petugas")) || defaultPetugas;
let catkaStorage = JSON.parse(localStorage.getItem("catka_data")) || initialCatka;

// ==================== INISIALISASI UTAMA ====================
document.addEventListener("DOMContentLoaded", () => {
    // Otomatis set kalender ke tanggal hari ini saat halaman dimuat
    const hariIni = new Date().toISOString().split('T')[0];
    document.getElementById("filterDate").value = hariIni;

    renderDropdowns();
    renderTable();

    document.getElementById("noKa").addEventListener("input", handleAutoStamformasi);
    document.getElementById("arahKa").addEventListener("change", handleAutoStamformasi);
    document.getElementById("catkaForm").addEventListener("submit", handleSubmitCatka);
    document.getElementById("globalSearch").addEventListener("input", renderTable);
    document.getElementById("filterDate").addEventListener("change", renderTable);
});

// Mengisi opsi pencarian/ dropdown otomatis datalist
function renderDropdowns() {
    const fields = ['masinis', 'asmas', 'kdr', 'tka', 'lokomotif'];
    fields.forEach(field => {
        const datalist = document.getElementById(`list_${field}`);
        if (!datalist) return;
        datalist.innerHTML = ""; 
        
        databasePetugas[field].sort().forEach(item => {
            let option = document.createElement("option");
            option.value = item;
            datalist.appendChild(option);
        });
    });
}

// ==================== LOGIKA AUTO REVERSE STAMFORMASI (REAL-TIME INPUT) ====================
function handleAutoStamformasi(e) {
    const inputNoKa = e.target.value.trim();
    if (!inputNoKa) return;

    const currentTanggal = document.getElementById("filterDate").value;

    // Cari data KA di hari yang sama (Nomor KA sama ATAU selisih satu angka / pasangannya)
    const kadiHariSama = catkaStorage.find(item => {
        const matchHari = item.tanggal === currentTanggal;
        
        // Amankan konversi nomor KA ke Integer untuk perbandingan matematika
        const nomorA = parseInt(item.noKa || item.noka || 0);
        const nomorB = parseInt(inputNoKa);
        
        const nomorSama = nomorA === nomorB;
        const nomorPasangan = (nomorA === nomorB + 1) || (nomorA === nomorB - 1);
        
        return matchHari && (nomorSama || nomorPasangan);
    });
    
    // Jika ditemukan data pembanding di hari yang sama, langsung suntikkan ke Form Input
    if (kadiHariSama) {
        // 1. Otomatis isi Nama Kereta Api
        document.getElementById("namaKa").value = kadiHariSama.namaKa || kadiHariSama.namaka || "";
        
        // 2. Ambil data stamformasi asli
        const stamAsli = kadiHariSama.stamformasi || kadiHariSama.stam_datang || kadiHariSama.stam_berangkat || "";
        
        if (stamAsli) {
            // 3. Pecah baris, balik urutan rangkaian menggunakan [...spread] agar data asli aman, lalu gabungkan kembali
            const susunanAsli = stamAsli.split("\n");
            const susunanTerbalik = [...susunanAsli].reverse().join("\n");
            
            // 4. Langsung masukkan susunan terbalik ke dalam Kotak Textarea Form Input
            document.getElementById("stamformasi").value = susunanTerbalik;
            
            // 5. Otomatis balikkan arah perjalanan di dropdown form input (KEDATANGAN <-> KEBERANGKATAN)
            const arahAsli = kadiHariSama.arah || "";
            document.getElementById("arahKa").value = arahAsli === "KEDATANGAN" ? "KEBERANGKATAN" : "KEDATANGAN";
        }
    }
}

// ==================== SIMPAN & UPDATE DATABASE PETUGAS ====================
function handleSubmitCatka(e) {
    e.preventDefault();

    const valMasinis = document.getElementById("masinis").value.trim().toUpperCase();
    const valAsmas = document.getElementById("asmas").value.trim().toUpperCase();
    const valKdr = document.getElementById("kdr").value.trim().toUpperCase();
    const valTka = document.getElementById("tka").value.trim().toUpperCase();
    const valLok = document.getElementById("lokomotif").value.trim().toUpperCase();

    const newData = {
        id: Date.now(), // ID Unik berbasis milidetik waktu untuk keperluan fungsi Hapus
        tanggal: document.getElementById("filterDate").value,
        noKa: document.getElementById("noKa").value.trim(),
        namaKa: document.getElementById("namaKa").value.trim() || "Reguler",
        arah: document.getElementById("arahKa").value,
        masinis: valMasinis,
        asmas: valAsmas,
        kdr: valKdr,
        tka: valTka,
        lokomotif: valLok,
        stamformasi: document.getElementById("stamformasi").value
    };

    // LOGIKA PENYUNTIKAN PETUGAS/SARANA MANUAL BARU KE DATABASE DROPDOWN
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

    if (databaseBerubah) {
        localStorage.setItem("catka_petugas", JSON.stringify(databasePetugas));
        renderDropdowns(); 
    }

    // Masukkan data baru dan kunci ke dalam LocalStorage browser
    catkaStorage.push(newData);
    localStorage.setItem("catka_data", JSON.stringify(catkaStorage));

    renderTable();
    
    // Reset isian teks pada formulir (Mengunci tanggal agar tidak perlu diset ulang)
    const tglSebelumnya = document.getElementById("filterDate").value;
    document.getElementById("catkaForm").reset();
    document.getElementById("filterDate").value = tglSebelumnya;

    alert(`Data CATKA ${newData.noKa} berhasil disimpan`);
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
        catkaStorage = catkaStorage.filter(item => item.id !== idCatka);
        localStorage.setItem("catka_data", JSON.stringify(catkaStorage));
        renderTable();
    }
}

// ==================== RENDERING TABEL & FILTER LIVE SEARCH ====================
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
        
        const sTanggal = (item.tanggal || "").toString();
        const sNoKa = (item.noKa || "").toString().toLowerCase();
        const sNamaKa = (item.namaKa || "").toString().toLowerCase();
        const sMasinis = (item.masinis || "").toString().toLowerCase();
        const sAsmas = (item.asmas || "").toString().toLowerCase();
        const sKdr = (item.kdr || "").toString().toLowerCase();
        const sTka = (item.tka || "").toString().toLowerCase();
        const sLok = (item.lokomotif || "").toString().toLowerCase();

        const matchSearch = 
            sTanggal.includes(searchQuery) || 
            sNoKa.includes(searchQuery) ||
            sNamaKa.includes(searchQuery) ||
            sMasinis.includes(searchQuery) ||
            sAsmas.includes(searchQuery) ||
            sKdr.includes(searchQuery) ||
            sTka.includes(searchQuery) ||
            sLok.includes(searchQuery);

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

    filteredData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    // FIX KUNCI: Struktur pembagian kolom <td> yang presisi agar tidak menumpuk di kiri
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
            <td>${item.lokomotif}</td>
            <td><div class="stam-list">${item.stamformasi}</div></td>
            <td>
                <button class="btn-delete" onclick="deleteCatka(${item.id || 0}, '${item.noKa}')">🗑️ Hapus</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
