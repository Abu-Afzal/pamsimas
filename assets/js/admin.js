<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard PAMSIMAS</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons (Untuk ikon yang cantik) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-light">

    <!-- Navbar Atas -->
    <nav class="navbar navbar-dark bg-primary shadow-sm sticky-top">
        <div class="container-fluid">
            <span class="navbar-brand fw-bold mb-0 h1">
                <i class="bi bi-droplet-fill"></i> PAMSIMAS
            </span>
            <div class="d-flex align-items-center text-white">
                <span id="userInfo" class="me-3 small d-none d-md-inline"></span>
                <button class="btn btn-outline-light btn-sm" onclick="logout()">
                    <i class="bi bi-box-arrow-right"></i> Logout
                </button>
            </div>
        </div>
    </nav>

    <!-- Area Konten Utama -->
    <div class="container-fluid p-3 p-md-4">
        <!-- Tab Navigasi (Akan di-generate oleh JS sesuai Role) -->
        <ul class="nav nav-tabs mb-3" id="roleTabs" role="tablist"></ul>

        <!-- Tempat Konten Berubah-ubah -->
        <div class="tab-content bg-white p-3 p-md-4 rounded shadow-sm" id="mainContent">
            <p class="text-muted text-center mt-5">Memuat data...</p>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- App Scripts -->
    <script src="assets/js/app.js"></script>
    <script src="assets/js/admin.js"></script>
    <!-- Nanti kita tambahkan petugas.js dan pelanggan.js di sini -->
</body>
</html>
