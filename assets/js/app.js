// ==========================================
// 1. INISIALISASI DATABASE DUMMY (localStorage)
// ==========================================
function initDummyData() {
    if (!localStorage.getItem('pamsimas_users')) {
        const users = [
            { id: 1, name: 'Admin Pusat', role: 'admin', username: 'admin', password: 'admin123' },
            { id: 2, name: 'Pak Joko', role: 'petugas', username: 'petugas', password: 'petugas123' },
            { id: 3, name: 'Budi Santoso', role: 'pelanggan', username: '1001', password: 'budi123', meter_number: '1001' }
        ];
        localStorage.setItem('pamsimas_users', JSON.stringify(users));
    }

    if (!localStorage.getItem('pamsimas_pelanggan')) {
        const pelanggan = [
            { id: 1, name: 'Budi Santoso', address: 'Jl. Mawar No. 1', phone: '08123456789', meter_number: '1001', initial_meter: 100 },
            { id: 2, name: 'Siti Aminah', address: 'Jl. Melati No. 2', phone: '08198765432', meter_number: '1002', initial_meter: 50 }
        ];
        localStorage.setItem('pamsimas_pelanggan', JSON.stringify(pelanggan));
    }

    if (!localStorage.getItem('pamsimas_pengaturan')) {
        const pengaturan = { price_per_m3: 3000, fixed_fee: 15000 };
        localStorage.setItem('pamsimas_pengaturan', JSON.stringify(pengaturan));
    }
    
    if (!localStorage.getItem('pamsimas_tagihan')) {
        localStorage.setItem('pamsimas_tagihan', JSON.stringify([]));
    }
}

// Jalankan inisialisasi saat file dimuat
initDummyData();

// ==========================================
// 2. LOGIKA LOGIN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Cek apakah user sudah login, jika ya langsung redirect
    const currentUser = JSON.parse(localStorage.getItem('pamsimas_current_user'));
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('inputUsername').value.trim();
            const password = document.getElementById('inputPassword').value.trim();
            const errorDiv = document.getElementById('loginError');

            const users = JSON.parse(localStorage.getItem('pamsimas_users'));
            const foundUser = users.find(u => u.username === username && u.password === password);

            if (foundUser) {
                // Simpan sesi user
                localStorage.setItem('pamsimas_current_user', JSON.stringify(foundUser));
                // Redirect ke dashboard
                window.location.href = 'dashboard.html';
            } else {
                errorDiv.textContent = 'Username atau Password salah!';
                errorDiv.classList.remove('d-none');
            }
        });
    }
});

// ==========================================
// 3. HELPER FUNCTIONS (Akan dipakai di Modul selanjutnya)
// ==========================================
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('pamsimas_current_user'));
}

function logout() {
    localStorage.removeItem('pamsimas_current_user');
    window.location.href = 'index.html';
}

function formatRupiah(angka) {
    return 'Rp ' + angka.toLocaleString('id-ID');
}
