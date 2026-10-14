// ==================== KONFIGURASI PATH (PENTING UNTUK GITHUB PAGES) ====================
const BASE_PATH = window.location.pathname.includes('/pamsimas/') ? '/pamsimas/' : '/';

// ==================== DATA DUMMY PELANGGAN (GLOBAL) ====================
// Digunakan oleh Modal Cek Tagihan dan Halaman Cek Tagihan Publik
const DATA_PELANGGAN_DUMMY = [
    { nomor: 'PLG-001', nama: 'Budi Santoso', alamat: 'Jl. Melati No. 12', pemakaian: 15, total: 75000, status: 'Belum Lunas', periode: 'Oktober 2026' },
    { nomor: 'PLG-002', nama: 'Siti Aminah', alamat: 'Jl. Mawar No. 5', pemakaian: 10, total: 50000, status: 'Lunas', periode: 'Oktober 2026' },
    { nomor: 'PLG-003', nama: 'Ahmad Rizki', alamat: 'Jl. Anggrek No. 8', pemakaian: 25, total: 125000, status: 'Belum Lunas', periode: 'Oktober 2026' }
];

// ==================== DATABASE USER (MOCK) ====================
const USERS_DB = [
    { id: 1, nama: 'Administrator', username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, nama: 'Pak Ketua', username: 'ketua', password: 'ketua123', role: 'ketua' },
    { id: 3, nama: 'Bu Sekretaris', username: 'sekretaris', password: 'sekretaris123', role: 'sekretaris' },
    { id: 4, nama: 'Bu Bendahara', username: 'bendahara', password: 'bendahara123', role: 'bendahara' },
    { id: 5, nama: 'Pak Petugas 1', username: 'petugas1', password: 'petugas123', role: 'petugas', zona: 'Zona 1 - Pusat' }
];

// ==================== DEFINISI MENU PER ROLE ====================
const MENU_BY_ROLE = {
    admin: [
        { label: 'Beranda', icon: 'fa-home', page: 'dashboard' },
        { label: 'ADMINISTRASI', icon: 'fa-user-shield', children: [{ label: 'Manajemen Pengguna', page: 'manajemen-user' }] },
        { label: 'Laporan Keuangan', icon: 'fa-chart-line', page: 'laporan-keuangan' }
    ],
    ketua: [
        { label: 'Dashboard', icon: 'fa-tachometer-alt', page: 'dashboard' },
        { label: 'Laporan Pemakaian', icon: 'fa-chart-bar', page: 'laporan-pemakaian' },
        { label: 'Laporan Keuangan', icon: 'fa-chart-line', page: 'laporan-keuangan' }
    ],
    sekretaris: [
        { label: 'Dashboard', icon: 'fa-home', page: 'dashboard' },
        { label: 'DATA MASTER', icon: 'fa-database', children: [
            { label: 'Data Pelanggan', page: 'data-pelanggan' },
            { label: 'Data Zona/Wilayah', page: 'data-zona' },
            { label: 'Tarif Air', page: 'tarif-air' }
        ]},
        { label: 'MANAJEMEN', icon: 'fa-user-hard-hat', children: [{ label: 'Manajemen Petugas', page: 'manajemen-petugas' }] }
    ],
    bendahara: [
        { label: 'Dashboard', icon: 'fa-home', page: 'dashboard' },
        { label: 'TRANSAKSI', icon: 'fa-exchange-alt', children: [
            { label: 'Generate Tagihan', page: 'generate-tagihan' },
            { label: 'Pembayaran', page: 'pembayaran' }
        ]},
        { label: 'Laporan Keuangan', icon: 'fa-chart-line', page: 'laporan-keuangan' }
    ],
    petugas: [
        { label: 'Dashboard', icon: 'fa-home', page: 'dashboard' },
        { label: 'Pencatatan Meter', icon: 'fa-tachometer-alt', page: 'pencatatan-meter' },
        { label: 'Riwayat Input', icon: 'fa-history', page: 'riwayat-input' }
    ]
};

// ==================== INISIALISASI APLIKASI ====================
document.addEventListener('DOMContentLoaded', () => {
    updatePeriode();
    const session = getSession();
    if (session) {
        initApp(session);
    } else {
        loadPage('login', true);
    }
});

// ==================== FUNGSI LOGIN & LOGOUT ====================
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('loginError');
    
    const user = USERS_DB.find(u => u.username === username && u.password === password);
    
    if (user) {
        const session = { id: user.id, nama: user.nama, username: user.username, role: user.role, zona: user.zona || 'Umum' };
        localStorage.setItem('sipams_session', JSON.stringify(session));
        initApp(session);
    } else {
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Username atau password salah!';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    if (confirm('Yakin ingin keluar dari aplikasi?')) {
        localStorage.removeItem('sipams_session');
        location.reload();
    }
}

// ==================== INISIALISASI SETELAH LOGIN ====================
function initApp(session) {
    const userInfoBox = document.getElementById('userInfoBox');
    const topbarActions = document.getElementById('topbarActions');
    if (userInfoBox) userInfoBox.style.display = 'flex';
    if (topbarActions) topbarActions.style.display = 'flex';

    document.getElementById('currentUser').innerText = session.nama;
    const roleBadge = document.getElementById('currentRole');
    roleBadge.innerText = session.role.toUpperCase();
    roleBadge.className = `role-badge role-${session.role}`;
    
    if (session.zona) {
        document.getElementById('zona-aktif').innerText = session.zona;
    }

    renderSidebarMenu(session.role);
    loadPage('dashboard');
}

// ==================== RENDER SIDEBAR ====================
function renderSidebarMenu(role) {
    const menuContainer = document.getElementById('dynamic-sidebar-menu');
    const menuData = MENU_BY_ROLE[role] || [];
    let html = '';
    
    menuData.forEach((item, index) => {
        if (item.children) {
            const submenuId = `submenu-${index}`;
            html += `
                <div class="menu-section">
                    <a href="#" class="menu-link" onclick="toggleSubmenu('${submenuId}')">
                        <i class="fas ${item.icon}"></i><span>${item.label}</span>
                        <i class="fas fa-chevron-down arrow" id="arrow-${submenuId}"></i>
                    </a>
                    <div class="submenu collapsed" id="${submenuId}">
                        ${item.children.map(child => `<a href="#" class="submenu-item" data-page="${child.page}">${child.label}</a>`).join('')}
                    </div>
                </div>`;
        } else {
            html += `
                <div class="menu-section">
                    <a href="#" class="menu-link" data-page="${item.page}">
                        <i class="fas ${item.icon}"></i><span>${item.label}</span>
                    </a>
                </div>`;
        }
    });
    
    menuContainer.innerHTML = html;
    attachMenuListeners();
}

function attachMenuListeners() {
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage(link.getAttribute('data-page'));
            if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('show');
        });
    });
}

// ==================== ROUTING HALAMAN ====================
async function loadPage(pageName, isLogin = false) {
    const container = document.getElementById('page-container');
    const titleElement = document.getElementById('page-title');
    const sidebar = document.getElementById('sidebar');
    const topbarActions = document.getElementById('topbarActions');
    const mainContent = document.getElementById('mainContent');
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Memuat...</p></div>';

    try {
        const response = await fetch(`${BASE_PATH}pages/${pageName}.html`);
        if (!response.ok) throw new Error('Halaman tidak ditemukan');
        
        const html = await response.text();
        container.innerHTML = html;
        
        // Halaman yang harus tampil full-screen (tanpa sidebar)
        const fullScreenPages = ['login', 'cek-tagihan'];
        
        if (fullScreenPages.includes(pageName)) {
            titleElement.innerText = pageName === 'login' ? 'Login Sistem' : 'Cek Tagihan Pelanggan';
            sidebar.style.display = 'none';
            topbarActions.style.display = 'none';
            mainContent.style.marginLeft = '0';
            
            if (pageName === 'login') {
                setTimeout(() => {
                    const form = document.getElementById('formLogin');
                    if (form) form.addEventListener('submit', handleLogin);
                }, 100);
            }
        } else {
            titleElement.innerText = pageName.replace(/-/g, ' ').toUpperCase();
            sidebar.style.display = 'flex';
            topbarActions.style.display = 'flex';
            mainContent.style.marginLeft = '260px';
        }
        
        document.querySelectorAll('.menu-link, .submenu-item').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) link.classList.add('active');
        });
        
        attachPageHandlers(pageName);
    } catch (error) {
        container.innerHTML = `<div class="content-card"><h3>Error 404</h3><p>Halaman <strong>${pageName}.html</strong> tidak ditemukan di folder pages/.</p></div>`;
    }
}

// ==================== HANDLER KHUSUS HALAMAN ====================
function attachPageHandlers(pageName) {
    if (pageName === 'manajemen-user') {
        const form = document.getElementById('formTambahUser');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('✅ User berhasil ditambahkan! (Simulasi)');
                renderDaftarUser();
                form.reset();
            });
        }
        renderDaftarUser();
    }
    if (pageName === 'manajemen-petugas') {
        const form = document.getElementById('formTambahPetugas');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('✅ Petugas berhasil ditambahkan! (Simulasi)');
                renderDaftarPetugas();
                form.reset();
            });
        }
        renderDaftarPetugas();
    }
}

function renderDaftarUser() {
    const container = document.getElementById('daftarUser');
    if (!container) return;
    const users = USERS_DB.filter(u => ['ketua', 'sekretaris', 'bendahara'].includes(u.role));
    container.innerHTML = users.map(u => `
        <div class="user-item">
            <div class="user-info">
                <i class="fas fa-user-circle"></i>
                <div><strong>${u.nama}</strong><div class="user-meta">@${u.username} • <span class="role-badge role-${u.role}">${u.role.toUpperCase()}</span></div></div>
            </div>
        </div>`).join('');
}

function renderDaftarPetugas() {
    const container = document.getElementById('daftarPetugas');
    if (!container) return;
    const petugas = USERS_DB.filter(u => u.role === 'petugas');
    container.innerHTML = petugas.map(p => `
        <div class="user-item">
            <div class="user-info">
                <i class="fas fa-user-hard-hat"></i>
                <div><strong>${p.nama}</strong><div class="user-meta">@${p.username} • ${p.zona || 'Belum ada zona'}</div></div>
            </div>
        </div>`).join('');
}

// ==================== UTILITIES ====================
function getSession() {
    const data = localStorage.getItem('sipams_session');
    return data ? JSON.parse(data) : null;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function toggleSubmenu(menuId) {
    const submenu = document.getElementById(menuId);
    const arrow = document.getElementById('arrow-' + menuId);
    const menuLink = arrow.parentElement;
    submenu.classList.toggle('collapsed');
    menuLink.classList.toggle('collapsed');
}

function updatePeriode() {
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const sekarang = new Date();
    const el = document.getElementById('periode-tagihan');
    if (el) el.innerText = `${bulan[sekarang.getMonth()]} ${sekarang.getFullYear()}`;
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// ==================== FITUR CEK TAGIHAN (MODAL & HALAMAN) ====================
function openPublicCheck() {
    document.getElementById('publicModal').classList.add('show');
    document.getElementById('searchPelanggan').focus();
}

function closePublicCheck() {
    document.getElementById('publicModal').classList.remove('show');
    document.getElementById('hasilPencarian').innerHTML = '';
    document.getElementById('searchPelanggan').value = '';
}

function showPublicCheck() {
    loadPage('cek-tagihan');
}

function cariTagihan() {
    const keyword = document.getElementById('searchPelanggan').value.toLowerCase().trim();
    const hasilDiv = document.getElementById('hasilPencarian');
    if (keyword === '') { hasilDiv.innerHTML = '<p style="color:red;">Masukkan kata kunci!</p>'; return; }
    
    const hasil = DATA_PELANGGAN_DUMMY.filter(p => p.nama.toLowerCase().includes(keyword) || p.nomor.toLowerCase().includes(keyword));
    
    if (hasil.length === 0) {
        hasilDiv.innerHTML = '<p style="color:red;">Data tidak ditemukan.</p>';
    } else {
        let html = '';
        hasil.forEach(p => {
            const warna = p.status === 'Lunas' ? 'green' : 'red';
            html += `<div class="tagihan-item">
                        <h5>${p.nama} (${p.nomor})</h5>
                        <p>Pemakaian: ${p.pemakaian} m³</p>
                        <p style="font-size:18px; font-weight:bold; color:#1abc9c; margin-top:5px;">Rp ${p.total.toLocaleString('id-ID')}</p>
                        <p>Status: <span style="color:${warna}; font-weight:bold;">${p.status}</span></p>
                     </div>`;
        });
        hasilDiv.innerHTML = html;
    }
}

function cekTagihanPublik() {
    const keyword = document.getElementById('searchNomor').value.toLowerCase().trim();
    const hasilDiv = document.getElementById('hasilCekTagihan');
    
    if (keyword === '') {
        hasilDiv.innerHTML = '<p style="color: #e74c3c; text-align: center;"><i class="fas fa-exclamation-circle"></i> Masukkan nomor/nama pelanggan!</p>';
        return;
    }
    
    const hasil = DATA_PELANGGAN_DUMMY.filter(p => p.nama.toLowerCase().includes(keyword) || p.nomor.toLowerCase().includes(keyword));
    
    if (hasil.length === 0) {
        hasilDiv.innerHTML = '<p style="color: #e74c3c; text-align: center;"><i class="fas fa-search"></i> Data pelanggan tidak ditemukan.</p>';
    } else {
        let html = '';
        hasil.forEach(p => {
            const statusClass = p.status === 'Lunas' ? 'status-lunas' : 'status-belum';
            const statusIcon = p.status === 'Lunas' ? 'fa-check-circle' : 'fa-times-circle';
            html += `
                <div class="tagihan-result">
                    <h4><i class="fas fa-user"></i> ${p.nama}</h4>
                    <div class="row"><span class="label">Nomor Pelanggan:</span><span class="value">${p.nomor}</span></div>
                    <div class="row"><span class="label">Alamat:</span><span class="value">${p.alamat}</span></div>
                    <div class="row"><span class="label">Periode:</span><span class="value">${p.periode}</span></div>
                    <div class="row"><span class="label">Pemakaian:</span><span class="value">${p.pemakaian} m³</span></div>
                    <div class="row"><span class="label">Status:</span><span class="${statusClass}"><i class="fas ${statusIcon}"></i> ${p.status}</span></div>
                    <div class="total"><div class="row"><span>Total Tagihan:</span><span>Rp ${p.total.toLocaleString('id-ID')}</span></div></div>
                </div>`;
        });
        hasilDiv.innerHTML = html;
    }
}

// Event Listeners Global
document.addEventListener('keypress', function(e) {
    if (e.target && e.target.id === 'searchNomor' && e.key === 'Enter') {
        cekTagihanPublik();
    }
});

const publicModal = document.getElementById('publicModal');
if (publicModal) {
    publicModal.addEventListener('click', function(e) {
        if (e.target === this) closePublicCheck();
    });
}