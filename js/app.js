// ==================== ROUTING MODULAR ====================
// Fungsi untuk memuat halaman dari folder 'pages'
async function loadPage(pageName) {
    const container = document.getElementById('page-container');
    const titleElement = document.getElementById('page-title');
    
    // Tampilkan loading
    container.innerHTML = '<div style="text-align:center; padding:50px; color:#7f8c8d;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Memuat halaman...</p></div>';

    try {
        // Fetch file HTML dari folder pages
        const response = await fetch(`pages/${pageName}.html`);
        
        if (!response.ok) throw new Error('Halaman tidak ditemukan');
        
        const html = await response.text();
        container.innerHTML = html;
        
        // Update judul di topbar
        const pageTitle = pageName.replace(/-/g, ' ').toUpperCase();
        titleElement.innerText = pageTitle;

        // Update status active di sidebar
        document.querySelectorAll('.menu-link, .submenu-item').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });

    } catch (error) {
        container.innerHTML = `<div class="content-card"><h3>Error 404</h3><p>Halaman <strong>${pageName}.html</strong> tidak ditemukan di folder pages/.</p></div>`;
    }
}

// Event Listener untuk semua link menu
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard secara default saat pertama kali dibuka
    loadPage('dashboard');

    // Tangani klik pada menu
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            loadPage(page);
            
            // Tutup sidebar di mobile setelah klik
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('show');
            }
        });
    });
});

// ==================== TOGGLE SIDEBAR & SUBMENU ====================
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

// ==================== MODAL CEK TAGIHAN PUBLIK ====================
function openPublicCheck() {
    document.getElementById('publicModal').classList.add('show');
    document.getElementById('searchPelanggan').focus();
}

function closePublicCheck() {
    document.getElementById('publicModal').classList.remove('show');
    document.getElementById('hasilPencarian').innerHTML = '';
    document.getElementById('searchPelanggan').value = '';
}

// Data Dummy Pelanggan
const dataPelanggan = [
    { nomor: 'PLG-001', nama: 'Budi Santoso', alamat: 'Jl. Melati No. 12', pemakaian: 15, total: 75000, status: 'Belum Lunas' },
    { nomor: 'PLG-002', nama: 'Siti Aminah', alamat: 'Jl. Mawar No. 5', pemakaian: 10, total: 50000, status: 'Lunas' }
];

function cariTagihan() {
    const keyword = document.getElementById('searchPelanggan').value.toLowerCase().trim();
    const hasilDiv = document.getElementById('hasilPencarian');
    
    if (keyword === '') { hasilDiv.innerHTML = '<p style="color:red;">Masukkan kata kunci!</p>'; return; }
    
    const hasil = dataPelanggan.filter(p => p.nama.toLowerCase().includes(keyword) || p.nomor.toLowerCase().includes(keyword));
    
    if (hasil.length === 0) {
        hasilDiv.innerHTML = '<p style="color:red;">Data tidak ditemukan.</p>';
    } else {
        let html = '';
        hasil.forEach(p => {
            const warna = p.status === 'Lunas' ? 'green' : 'red';
            html += `<div class="tagihan-item">
                        <h5>${p.nama} (${p.nomor})</h5>
                        <p>Pemakaian: ${p.pemakaian} m³</p>
                        <p style="font-size:18px; font-weight:bold; color:#1abc9c;">Rp ${p.total.toLocaleString('id-ID')}</p>
                        <p>Status: <span style="color:${warna}; font-weight:bold;">${p.status}</span></p>
                     </div>`;
        });
        hasilDiv.innerHTML = html;
    }
}

// Tutup modal jika klik di luar area
document.getElementById('publicModal').addEventListener('click', function(e) {
    if (e.target === this) closePublicCheck();
});
