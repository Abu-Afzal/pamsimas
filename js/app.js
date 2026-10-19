// Modular Firebase Setup (Firebase SDK v10)
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBs5FCHTWJrL15RRdnJbEsvnsZvm90Xc8s",
    authDomain: "pamsimas-c5545.firebaseapp.com",
    projectId: "pamsimas-c5545",
    storageBucket: "pamsimas-c5545.firebasestorage.app",
    messagingSenderId: "742328626568",
    appId: "1:742328626568:web:1723bc4c56f4255cc91e3d",
    measurementId: "G-ELFLYV6687"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Inisialisasi Secondary App khusus untuk Admin mendaftarkan user baru tanpa logout
const secondaryApp = getApps().find(app => app.name === "SecondaryApp") 
    ? getApp("SecondaryApp") 
    : initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

const TARIF_PER_M3 = 2500;
const BIAYA_BEBAN = 5000;

let globalPelanggan = [];
let globalTagihan = [];
let currentUserRole = null;

document.addEventListener("DOMContentLoaded", () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById("input-periode").value = currentMonth;
    document.getElementById("filter-periode-bendahara").value = currentMonth;

    listenPelanggan();
    listenTagihan();
    setupAuthListener();
}

// -------------------------------------------------------------
// AUTHENTICATION & ROLE MANAGEMENT
// -------------------------------------------------------------

function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        const authContainer = document.getElementById("auth-action-container");
        
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                currentUserRole = userData.role; // 'admin', 'petugas', 'bendahara', 'sekretaris', 'ketua'
                
                authContainer.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="text-xs text-blue-100 hidden sm:inline">Halo, <b>${userData.nama}</b> (${userData.role.toUpperCase()})</span>
                        <button onclick="handleLogout()" class="bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition shadow">
                            <i class="fa-solid fa-right-from-bracket"></i> Logout
                        </button>
                    </div>
                `;

                applyRoleAccess(currentUserRole);
            } else {
                showAlert("Akun terautentikasi tetapi profil role tidak ditemukan di database.", "bg-rose-100 text-rose-800");
                signOut(auth);
            }
        } else {
            currentUserRole = null;
            authContainer.innerHTML = `
                <button onclick="toggleModalLogin(true)" class="bg-white text-[#0e6396] px-4 py-2 rounded-xl text-sm font-bold shadow hover:bg-blue-50 transition flex items-center gap-2">
                    <i class="fa-solid fa-right-to-bracket"></i> Login Pengurus
                </button>
            `;
            applyRoleAccess(null);
        }
    });
}

function applyRoleAccess(role) {
    const btnPetugas = document.getElementById("tab-petugas");
    const btnBendahara = document.getElementById("tab-bendahara");
    const btnLaporan = document.getElementById("tab-laporan");
    const btnAdmin = document.getElementById("tab-admin");

    btnPetugas.classList.add("hidden");
    btnBendahara.classList.add("hidden");
    btnLaporan.classList.add("hidden");
    btnAdmin.classList.add("hidden");

    if (role === "admin") {
        btnAdmin.classList.remove("hidden");
        btnPetugas.classList.remove("hidden");
        btnBendahara.classList.remove("hidden");
        btnLaporan.classList.remove("hidden");
        switchTab("admin");
    } else if (role === "petugas") {
        btnPetugas.classList.remove("hidden");
        switchTab("petugas");
    } else if (role === "bendahara") {
        btnBendahara.classList.remove("hidden");
        switchTab("bendahara");
    } else if (role === "ketua" || role === "sekretaris") {
        btnLaporan.classList.remove("hidden");
        switchTab("laporan");
    } else {
        switchTab("warga");
    }
}

window.handleLogout = async () => {
    await signOut(auth);
    showAlert("Anda telah keluar dari sistem.", "bg-blue-100 text-blue-800");
};

// -------------------------------------------------------------
// EVENT LISTENERS & HANDLERS
// -------------------------------------------------------------

function setupEventListeners() {
    // Form Login Submit
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-password").value;

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            toggleModalLogin(false);
            showAlert("Login berhasil! Selamat datang di Panel Pengurus.", "bg-emerald-100 text-emerald-800");
            document.getElementById("form-login").reset();
        } catch (err) {
            console.error(err);
            showAlert("Gagal Login: Periksa kembali Email dan Password Anda.", "bg-rose-100 text-rose-800");
        }
    });

    // Form Pendaftaran User Baru oleh Admin
    document.getElementById("form-tambah-user").addEventListener("submit", async (e) => {
        e.preventDefault();
        const nama = document.getElementById("admin-nama").value.trim();
        const email = document.getElementById("admin-email").value.trim();
        const password = document.getElementById("admin-password").value.trim();
        const role = document.getElementById("admin-role").value;

        try {
            // Buat akun di Auth menggunakan secondary instance agar admin tidak logout
            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUid = userCred.user.uid;

            // Simpan profil & role ke Firestore koleksi 'users'
            await setDoc(doc(db, "users", newUid), {
                nama: nama,
                email: email,
                role: role,
                created_at: serverTimestamp()
            });

            showAlert(`Sukses! Akun ${nama} (${role}) berhasil didaftarkan.`, "bg-emerald-100 text-emerald-800");
            document.getElementById("form-tambah-user").reset();
        } catch (err) {
            console.error(err);
            showAlert("Gagal mendaftarkan user: " + err.message, "bg-rose-100 text-rose-800");
        }
    });

    document.getElementById("input-pelanggan").addEventListener("change", (e) => {
        const idPel = e.target.value;
        const meterLalu = getMeteranLalu(idPel);
        document.getElementById("input-meter-lalu").value = meterLalu;
        calculateInputForm();
    });

    document.getElementById("input-meter-kini").addEventListener("input", calculateInputForm);

    document.getElementById("form-input-meter").addEventListener("submit", async (e) => {
        e.preventDefault();
        await simpanCatatanAir();
    });

    document.getElementById("form-tambah-pelanggan").addEventListener("submit", async (e) => {
        e.preventDefault();
        await simpanPelangganBaru();
    });

    document.getElementById("form-cari-warga").addEventListener("submit", (e) => {
        e.preventDefault();
        cariTagihanWarga();
    });

    document.getElementById("filter-periode-bendahara").addEventListener("change", renderTableBendahara);
}

// -------------------------------------------------------------
// FIRESTORE LISTENERS & LOGIC
// -------------------------------------------------------------

function listenPelanggan() {
    const colRef = collection(db, "pelanggan");
    onSnapshot(colRef, (snapshot) => {
        globalPelanggan = [];
        const selectEl = document.getElementById("input-pelanggan");
        selectEl.innerHTML = '<option value="">-- Pilih Pelanggan --</option>';
        
        const tableBody = document.getElementById("table-pelanggan-body");
        tableBody.innerHTML = "";

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada data pelanggan.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = { idDoc: docSnap.id, ...docSnap.data() };
            globalPelanggan.push(data);

            const opt = document.createElement("option");
            opt.value = data.id_pelanggan;
            opt.textContent = `${data.id_pelanggan} - ${data.nama}`;
            selectEl.appendChild(opt);

            const tr = document.createElement("tr");
            tr.className = "border-b hover:bg-slate-50";
            tr.innerHTML = `
                <td class="p-3 font-semibold">${data.id_pelanggan}</td>
                <td class="p-3">${data.nama}</td>
                <td class="p-3">${data.rt_rw}</td>
                <td class="p-3">${data.no_hp || '-'}</td>
                <td class="p-3">
                    <button onclick="quickInput('${data.id_pelanggan}')" class="text-xs bg-blue-100 text-[#0079bf] px-2 py-1 rounded hover:bg-blue-200 font-semibold">
                        Catat Air
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        updateDashboardStats();
    });
}

function listenTagihan() {
    const colRef = collection(db, "tagihan_air");
    onSnapshot(colRef, (snapshot) => {
        globalTagihan = [];
        snapshot.forEach((docSnap) => {
            globalTagihan.push({ idDoc: docSnap.id, ...docSnap.data() });
        });
        renderTableBendahara();
        updateDashboardStats();
    });
}

function getMeteranLalu(idPelanggan) {
    const filtered = globalTagihan
        .filter(t => t.id_pelanggan === idPelanggan)
        .sort((a, b) => b.periode.localeCompare(a.periode));
    
    return filtered.length > 0 ? filtered[0].meter_kini : 0;
}

function calculateInputForm() {
    const meterLalu = parseFloat(document.getElementById("input-meter-lalu").value) || 0;
    const meterKini = parseFloat(document.getElementById("input-meter-kini").value) || 0;

    let volume = meterKini - meterLalu;
    if (volume < 0) volume = 0;

    const totalRp = (volume * TARIF_PER_M3) + BIAYA_BEBAN;

    document.getElementById("calc-m3").textContent = `${volume} m³`;
    document.getElementById("calc-rp").textContent = `Rp ${totalRp.toLocaleString('id-ID')}`;
}

async function simpanCatatanAir() {
    const idPel = document.getElementById("input-pelanggan").value;
    const periode = document.getElementById("input-periode").value;
    const meterLalu = parseFloat(document.getElementById("input-meter-lalu").value) || 0;
    const meterKini = parseFloat(document.getElementById("input-meter-kini").value) || 0;

    if (meterKini < meterLalu) {
        showAlert("Angka meteran baru tidak boleh lebih kecil dari meteran lalu!", "bg-rose-100 text-rose-800");
        return;
    }

    const pelData = globalPelanggan.find(p => p.id_pelanggan === idPel);
    const volume = meterKini - meterLalu;
    const totalBayar = (volume * TARIF_PER_M3) + BIAYA_BEBAN;

    try {
        await addDoc(collection(db, "tagihan_air"), {
            id_pelanggan: idPel,
            nama_pelanggan: pelData ? pelData.nama : "-",
            rt_rw: pelData ? pelData.rt_rw : "-",
            periode: periode,
            meter_lalu: meterLalu,
            meter_kini: meterKini,
            pemakaian_m3: volume,
            total_bayar: totalBayar,
            status: "Belum Lunas",
            created_at: serverTimestamp()
        });

        showAlert("Data catatan air berhasil disimpan!", "bg-emerald-100 text-emerald-800");
        document.getElementById("form-input-meter").reset();
        document.getElementById("calc-m3").textContent = "0 m³";
        document.getElementById("calc-rp").textContent = "Rp 0";
    } catch (err) {
        console.error(err);
        showAlert("Gagal menyimpan data.", "bg-rose-100 text-rose-800");
    }
}

async function simpanPelangganBaru() {
    const idPel = document.getElementById("new-id-pelanggan").value.trim();
    const nama = document.getElementById("new-nama").value.trim();
    const rt = document.getElementById("new-rt").value.trim();
    const hp = document.getElementById("new-hp").value.trim();

    try {
        await addDoc(collection(db, "pelanggan"), {
            id_pelanggan: idPel,
            nama: nama,
            rt_rw: rt,
            no_hp: hp
        });
        showAlert("Pelanggan baru berhasil ditambahkan!", "bg-emerald-100 text-emerald-800");
        toggleModalPelanggan(false);
        document.getElementById("form-tambah-pelanggan").reset();
    } catch (err) {
        console.error(err);
        showAlert("Gagal menambah pelanggan.", "bg-rose-100 text-rose-800");
    }
}

window.bayarTagihan = async (idDoc) => {
    if (!confirm("Konfirmasi pembayaran tagihan ini menjadi LUNAS?")) return;
    try {
        const docRef = doc(db, "tagihan_air", idDoc);
        await updateDoc(docRef, {
            status: "Lunas",
            tanggal_bayar: new Date().toISOString()
        });
        showAlert("Tagihan diperbarui menjadi LUNAS.", "bg-emerald-100 text-emerald-800");
    } catch (err) {
        console.error(err);
        showAlert("Gagal memperbarui status.", "bg-rose-100 text-rose-800");
    }
};

function renderTableBendahara() {
    const filterBulan = document.getElementById("filter-periode-bendahara").value;
    const body = document.getElementById("table-tagihan-body");
    body.innerHTML = "";

    const filtered = globalTagihan.filter(t => !filterBulan || t.periode === filterBulan);

    if (filtered.length === 0) {
        body.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-slate-400">Tidak ada data tagihan pada periode ini.</td></tr>';
        return;
    }

    filtered.forEach((t) => {
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-slate-50";
        const isLunas = t.status === "Lunas";

        tr.innerHTML = `
            <td class="p-3 font-medium">${t.periode}</td>
            <td class="p-3"><div class="font-bold text-slate-800">${t.nama_pelanggan}</div><div class="text-xs text-slate-400">${t.id_pelanggan}</div></td>
            <td class="p-3">${t.rt_rw || '-'}</td>
            <td class="p-3 text-right">${t.meter_lalu} / ${t.meter_kini}</td>
            <td class="p-3 text-right font-semibold">${t.pemakaian_m3} m³</td>
            <td class="p-3 text-right font-bold text-[#0079bf]">Rp ${t.total_bayar.toLocaleString('id-ID')}</td>
            <td class="p-3 text-center">
                <span class="px-2.5 py-1 text-xs font-bold rounded-full ${isLunas ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                    ${t.status}
                </span>
            </td>
            <td class="p-3 text-center no-print">
                ${!isLunas ? `<button onclick="bayarTagihan('${t.idDoc}')" class="bg-[#0079bf] text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#026aa7]">Tandai Lunas</button>` : '<i class="fa-solid fa-check text-emerald-600 font-bold"></i>'}
            </td>
        `;
        body.appendChild(tr);
    });
}

function updateDashboardStats() {
    let totalRpLunas = 0;
    let totalRpHutang = 0;
    let totalM3 = 0;

    globalTagihan.forEach(t => {
        totalM3 += (t.pemakaian_m3 || 0);
        if (t.status === "Lunas") {
            totalRpLunas += (t.total_bayar || 0);
        } else {
            totalRpHutang += (t.total_bayar || 0);
        }
    });

    document.getElementById("stat-total-penerimaan").textContent = `Rp ${totalRpLunas.toLocaleString('id-ID')}`;
    document.getElementById("stat-total-tunggakan").textContent = `Rp ${totalRpHutang.toLocaleString('id-ID')}`;
    document.getElementById("stat-total-m3").textContent = `${totalM3} m³`;
    document.getElementById("stat-total-pelanggan").textContent = globalPelanggan.length;
}

function cariTagihanWarga() {
    const kw = document.getElementById("cari-keyword").value.trim().toLowerCase();
    const resultDiv = document.getElementById("hasil-pencarian-warga");

    const found = globalTagihan.find(t => 
        t.id_pelanggan.toLowerCase() === kw || t.nama_pelanggan.toLowerCase().includes(kw)
    );

    if (!found) {
        showAlert("Data tagihan tidak ditemukan.", "bg-rose-100 text-rose-800");
        resultDiv.classList.add("hidden");
        return;
    }

    resultDiv.classList.remove("hidden");
    document.getElementById("warga-id").textContent = found.id_pelanggan;
    document.getElementById("warga-nama").textContent = found.nama_pelanggan;
    document.getElementById("warga-rt").textContent = found.rt_rw || '-';
    document.getElementById("warga-periode").textContent = found.periode;
    document.getElementById("warga-meter-lalu").textContent = `${found.meter_lalu} m³`;
    document.getElementById("warga-meter-ini").textContent = `${found.meter_kini} m³`;
    document.getElementById("warga-m3").textContent = `${found.pemakaian_m3} m³`;
    document.getElementById("warga-total-rp").textContent = `Rp ${found.total_bayar.toLocaleString('id-ID')}`;

    const badge = document.getElementById("warga-status-badge");
    badge.textContent = found.status;
    badge.className = `px-3 py-1 text-xs font-semibold rounded-full ${found.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`;
}

// Global UI Helpers
window.switchTab = (tabName) => {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("bg-[#0b4f78]", "text-white"));

    const targetSec = document.getElementById(`sec-${tabName}`);
    const targetBtn = document.getElementById(`tab-${tabName}`);
    
    if (targetSec) targetSec.classList.remove("hidden");
    if (targetBtn) targetBtn.classList.add("bg-[#0b4f78]", "text-white");
};

window.toggleModalLogin = (show) => {
    document.getElementById("modal-login").classList.toggle("hidden", !show);
};

window.toggleModalPelanggan = (show) => {
    document.getElementById("modal-pelanggan").classList.toggle("hidden", !show);
};

window.quickInput = (idPel) => {
    window.switchTab("petugas");
    document.getElementById("input-pelanggan").value = idPel;
    document.getElementById("input-pelanggan").dispatchEvent(new Event("change"));
};

window.exportToExcel = () => {
    if (globalTagihan.length === 0) {
        showAlert("Tidak ada data untuk di-export.", "bg-rose-100 text-rose-800");
        return;
    }
    const dataExcel = globalTagihan.map(t => ({
        "Periode": t.periode,
        "ID Pelanggan": t.id_pelanggan,
        "Nama Pelanggan": t.nama_pelanggan,
        "RT/RW": t.rt_rw,
        "Meter Lalu": t.meter_lalu,
        "Meter Kini": t.meter_kini,
        "Pemakaian (m3)": t.pemakaian_m3,
        "Total Tagihan (Rp)": t.total_bayar,
        "Status": t.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Air PAMSIMAS");
    XLSX.writeFile(workbook, "Laporan_PAMSIMAS_Desa_Lamanda.xlsx");
};

function showAlert(msg, bgClass) {
    const box = document.getElementById("alert-box");
    box.className = `mb-6 p-4 rounded-xl shadow-sm flex items-center justify-between ${bgClass}`;
    document.getElementById("alert-msg").textContent = msg;
    box.classList.remove("hidden");
    setTimeout(() => box.classList.add("hidden"), 4000);
}

window.closeAlert = () => {
    document.getElementById("alert-box").classList.add("hidden");
};