const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrcodeData = require('qrcode');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const http = require('http');
require('dotenv').config();
const { Server } = require('socket.io');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_wa_cs_key_2026';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/') },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-')) }
});
const upload = multer({ storage: storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Static route untuk gambar
app.use('/uploads', express.static('uploads'));

// Middleware API
app.use(cors());
app.use(express.json());

// Middleware Autentikasi JWT
function authenticateToken(req, res, next) {
    const publicPaths = ['/login', '/register', '/verify', '/forgot-password', '/reset-password'];
    if (publicPaths.includes(req.path)) return next(); // Abaikan endpoint auth
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Akses ditolak. Token tidak ada.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token tidak valid.' });
        req.user = user;
        next();
    });
}

// Pasang middleware pelindung ke semua API
app.use('/api', authenticateToken);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const db = {
    exec: async (query) => pool.query(query),
    run: async (query, params = []) => {
        let i = 1;
        let finalQuery = query.replace(/\?/g, () => `$${i++}`);
        if (finalQuery.includes('INSERT OR REPLACE INTO pengaturan')) {
             finalQuery = finalQuery.replace('INSERT OR REPLACE INTO pengaturan (kunci, nilai) VALUES ($1, $2)', 'INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai');
        }
        return pool.query(finalQuery, params);
    },
    get: async (query, params = []) => {
        let i = 1;
        const pgQuery = query.replace(/\?/g, () => `$${i++}`);
        const res = await pool.query(pgQuery, params);
        return res.rows[0];
    },
    all: async (query, params = []) => {
        let i = 1;
        const pgQuery = query.replace(/\?/g, () => `$${i++}`);
        const res = await pool.query(pgQuery, params);
        return res.rows;
    }
};

// Fungsi untuk inisialisasi Database Postgres
async function initDatabase() {
    // Membuat tabel untuk menyimpan antrean chat jika belum ada
    await db.exec(`
        CREATE TABLE IF NOT EXISTS antrean_chat (
            id SERIAL PRIMARY KEY,
            dari TEXT,
            pesan TEXT,
            waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Coba tambahkan kolom nomor_pelanggan untuk pengelompokan chat
    try {
        await db.exec(`ALTER TABLE antrean_chat ADD COLUMN nomor_pelanggan TEXT`);
    } catch (err) {
        // Kolom sudah ada, abaikan error
    }

    // Membuat tabel untuk produk (Pengetahuan AI)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS produk (
            id SERIAL PRIMARY KEY,
            nama TEXT NOT NULL,
            harga TEXT NOT NULL,
            deskripsi TEXT,
            is_active INTEGER DEFAULT 1,
            waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tambahkan kolom is_active jika tabel sudah ada (migration)
    try { await db.exec('ALTER TABLE produk ADD COLUMN is_active INTEGER DEFAULT 1'); } catch (err) { }
    try { await db.exec('ALTER TABLE produk ADD COLUMN gambar TEXT'); } catch (err) { }
    try { await db.exec('ALTER TABLE produk ADD COLUMN kategori TEXT'); } catch (err) { }
    try { await db.exec('ALTER TABLE produk ADD COLUMN stok TEXT DEFAULT \'Tersedia\''); } catch (err) { }
    try { await db.exec('ALTER TABLE produk ADD COLUMN link_pembelian TEXT'); } catch (err) { }

    // Membuat tabel untuk pesanan (Order Management)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS pesanan (
            id SERIAL PRIMARY KEY,
            order_id TEXT UNIQUE,
            nama_pelanggan TEXT,
            no_whatsapp TEXT,
            items TEXT,
            total_harga INTEGER,
            status_pembayaran TEXT DEFAULT 'Belum Bayar',
            status_pengiriman TEXT DEFAULT 'Diproses',
            waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Membuat tabel untuk pengaturan AI
    await db.exec(`
        CREATE TABLE IF NOT EXISTS pengaturan (
            kunci TEXT PRIMARY KEY,
            nilai TEXT
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS kontak (
            nomor_wa TEXT PRIMARY KEY,
            nama TEXT,
            is_ai_active INTEGER DEFAULT 1
        )
    `);

    // Membuat tabel admin untuk keamanan (Login)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS admin (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            email TEXT,
            nama_lengkap TEXT,
            nomor_wa TEXT,
            is_verified BOOLEAN DEFAULT FALSE,
            verification_token TEXT
        )
    `);

    // Tambahkan kolom jika belum ada (Safe Migrations)
    try { await db.exec('ALTER TABLE admin ADD COLUMN email TEXT'); } catch (err) { }
    try { await db.exec('ALTER TABLE admin ADD COLUMN nama_lengkap TEXT'); } catch (err) { }
    try { await db.exec('ALTER TABLE admin ADD COLUMN nomor_wa TEXT'); } catch (err) { }
    try { await db.exec('ALTER TABLE admin ADD COLUMN is_verified BOOLEAN DEFAULT FALSE'); } catch (err) { }
    try { await db.exec('ALTER TABLE admin ADD COLUMN verification_token TEXT'); } catch (err) { }

    try {
        const adminCheck = await db.all('SELECT * FROM admin');
        if (adminCheck.length === 0) {
            const hashedPwd = await bcrypt.hash('rahasia123', 10);
            await db.run('INSERT INTO admin (username, password, email, is_verified) VALUES ($1, $2, $3, $4)', ['admin', hashedPwd, 'admin@localhost', true]);
            console.log('Akun Admin Default Berhasil Dibuat: username=admin | password=rahasia123');
        } else {
            // Set admin pertama sebagai verified
            await db.run('UPDATE admin SET is_verified = true WHERE username = $1', ['admin']);
        }
    } catch (err) {
        console.error('Gagal mengecek admin:', err);
    }

    console.log('Database Neon (PostgreSQL) Siap & Terhubung!');
}

// Jalankan Inisialisasi Database
initDatabase();

// Inisialisasi client WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let waStatus = 'DISCONNECTED';
let currentQrCode = null;

client.on('qr', async (qr) => {
    console.log('=== SILAKAN SCAN QR CODE DI BAWAH INI ===');
    waStatus = 'QR_READY';
    qrcode.generate(qr, { small: true });
    try {
        const url = await qrcodeData.toDataURL(qr);
        currentQrCode = url;
        io.emit('wa-qr', url);
    } catch (err) {
        console.error('Failed to generate QR data url', err);
    }
});

client.on('ready', () => {
    console.log('\n==================================');
    console.log('WhatsApp Client is READY & Terhubung!');
    console.log('==================================\n');
    waStatus = 'CONNECTED';
    currentQrCode = null;
    const waInfo = client.info ? { pushname: client.info.pushname, number: client.info.wid.user } : null;
    io.emit('wa-ready', waInfo);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp terputus / dilogout:', reason);
    waStatus = 'DISCONNECTED';
    currentQrCode = null;
    io.emit('wa-disconnected', true);
    client.destroy();
    setTimeout(() => {
        client.initialize();
    }, 2000);
});

// Endpoint untuk mendapatkan status WhatsApp
app.get('/api/wa-status', (req, res) => {
    res.json({ 
        status: waStatus, 
        qr: currentQrCode,
        info: client.info ? { pushname: client.info.pushname, number: client.info.wid.user } : null
    });
});

app.post('/api/wa-logout', async (req, res) => {
    try {
        if (waStatus === 'CONNECTED') {
            await client.logout();
        }
        res.json({ success: true, message: 'Berhasil memulai ulang sesi WhatsApp' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mendengarkan pesan masuk
client.on('message', async (msg) => {
    // Dapatkan nomor asli pelanggan (menghindari ID @lid)
    let realNumber = msg.from;
    try {
        const contact = await msg.getContact();
        if (contact) {
            if (msg.from.includes('@lid') || (contact.id && contact.id._serialized.includes('@lid'))) {
                // Jika itu adalah LID (Linked Device / Hidden Number), gunakan nama profil WhatsApp-nya
                realNumber = contact.pushname || contact.name || `User (${contact.number || 'LID'})`;
            } else if (contact.number) {
                realNumber = contact.number;
            }
        }
    } catch (e) {
        console.error('Gagal mendapatkan kontak:', e);
    }

    // 1. SIMPAN PESAN KE DATABASE
    try {
        await db.run(
            'INSERT INTO antrean_chat (dari, pesan, nomor_pelanggan) VALUES (?, ?, ?)',
            [msg.from, msg.body, realNumber]
        );
        console.log(`[Database] Pesan dari ${realNumber} berhasil disimpan.`);
    } catch (err) {
        console.error('Gagal menyimpan ke database:', err);
    }

    // 2. KIRIM LIVE KE FRONTEND VIA SOCKET.IO
    io.emit('pesan_baru', { dari: msg.from, pesan: msg.body, nomor_pelanggan: realNumber });
    console.log(`[Multi-Agent] Pesan dari ${realNumber} diteruskan ke Dasbor.`);

    // 2.5 CEK STATUS HANDOFF (APAKAH AI AKTIF UNTUK KONTAK INI)
    try {
        const kontakInfo = await db.get('SELECT is_ai_active FROM kontak WHERE nomor_wa = $1', [realNumber]);
        if (kontakInfo && kontakInfo.is_ai_active === 0) {
            console.log(`[Handoff] AI dimatikan untuk ${realNumber}. Mengabaikan pesan.`);
            return; // Hentikan proses AI
        }
    } catch (err) {
        console.error('Gagal mengecek status kontak:', err);
    }

    // 3. PROSES DENGAN GEMINI AI
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            console.log('Gemini API Key belum diatur di file .env. Mengabaikan AI auto-reply.');
            return;
        }

        const rows = await db.all('SELECT * FROM pengaturan');
        const settingsMap = {};
        rows.forEach(row => {
            settingsMap[row.kunci] = row.nilai;
        });

        // 3.5 CEK JAM OPERASIONAL
        const jamBuka = settingsMap['jam_buka'] || "00:00";
        const jamTutup = settingsMap['jam_tutup'] || "23:59";
        const aiAktifLuarJam = settingsMap['ai_aktif_luar_jam'] === 'true';
        const pesanLuarJam = settingsMap['pesan_luar_jam'] || "Maaf, toko kami sedang tutup. Silakan tinggalkan pesan dan kami akan membalas di jam operasional berikutnya.";

        const now = new Date();
        const currentHourStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const isLuarJam = currentHourStr < jamBuka || currentHourStr > jamTutup;

        if (isLuarJam && !aiAktifLuarJam) {
            console.log(`[Operasional] Pesan dari ${realNumber} masuk di luar jam. Mengirim pesan otomatis.`);
            // Cek apakah pesan auto-reply ini sudah dikirim dalam 1 jam terakhir untuk menghindari spam
            // Untuk kesederhanaan, kita langsung balas saja.
            const balasanAuto = pesanLuarJam;
            await msg.reply(balasanAuto);
            await db.run('INSERT INTO antrean_chat (dari, pesan, nomor_pelanggan) VALUES (?, ?, ?)', ['AI (Auto)', balasanAuto, realNumber]);
            io.emit('pesan_baru', { dari: 'AI', pesan: balasanAuto, nomor_pelanggan: realNumber });
            return;
        }

        const roApiKey = process.env.RAJAONGKIR_API_KEY;
        const gudangId = settingsMap['gudang_id'] || "";
        const kurirAktif = settingsMap['ekspedisi_aktif'] || "jne";
        const promoAktif = settingsMap['promo_aktif'] || "1";
        const diskonOngkir = settingsMap['diskon_ongkir'] || "0";
        const coverageOngkir = settingsMap['coverage_ongkir'] || "Seluruh Indonesia";
        const diskonProduk = settingsMap['diskon_produk'] || "0";
        const diskonPembayaran = settingsMap['diskon_pembayaran'] || "0";
        const pembayaranCod = settingsMap['pembayaran_cod'] || "0";
        const pembayaranTransfer = settingsMap['pembayaran_transfer'] || "1";
        const rekeningBank = settingsMap['rekening_bank'] || "[]";

        const infoToko = settingsMap['informasi_toko'] || "";
        const faq = settingsMap['faq'] || "";
        const templateOrder = settingsMap['template_order'] || "";
        const aiBoundary = settingsMap['ai_boundary'] || "";
        const customTemplates = settingsMap['custom_templates'] || "[]";
        
        const namaToko = settingsMap['nama_toko'] || "Toko Kami";
        const namaCs = settingsMap['nama_cs'] || "AI";
        const genderCs = settingsMap['gender_cs'] || "Netral";
        const gayaBahasa = settingsMap['gaya_bahasa'] || "Ramah";
        const sapaan = settingsMap['sapaan'] || "Kak";
        const jobDesc = settingsMap['job_description'] || "Jawab pertanyaan pelanggan dengan sopan.";

        const produkList = await db.all('SELECT * FROM produk WHERE is_active = 1 OR is_active IS NULL ORDER BY id DESC');
        let produkTeks = produkList.map(p => `- ${p.nama} (Harga: ${p.harga}) [Stok: ${p.stok || 'Tersedia'}] [Kategori: ${p.kategori || '-'}] - Deskripsi: ${p.deskripsi}. Link Pembelian: ${p.link_pembelian || 'Tidak ada link'}.`).join('\n');
        
        if (produkTeks.length === 0) {
            produkTeks = "Saat ini toko belum memiliki produk.";
        }

        let systemPrompt = `
Kamu adalah Customer Service AI dari toko bernama "${namaToko}".
Nama Kamu: ${namaCs}
Gender Kamu: ${genderCs}
Gaya Bahasa: ${gayaBahasa}
Sapaan ke pelanggan: ${sapaan}

Tugas Utama (Job Description):
${jobDesc}

Berikut adalah daftar produk yang dijual di toko ini:
${produkTeks}

Aturan Penjawab:
Jawab pesan dari pelanggan di bawah ini. Jawab sesuai dengan Persona dan Gaya Bahasa di atas. Jangan mengarang produk yang tidak ada di daftar.
`;
        
        if (infoToko) {
            systemPrompt += `\nINFORMASI TOKO:\n${infoToko}\n`;
        }
        if (faq) {
            systemPrompt += `\nFAQ / PERTANYAAN UMUM:\n${faq}\nGunakan FAQ ini sebagai referensi jika relevan.\n`;
        }
        if (templateOrder) {
            systemPrompt += `\nTEMPLATE ORDER / FORMULIR PEMESANAN:\n${templateOrder}\nBerikan form pemesanan ini HANYA JIKA pelanggan sudah menyatakan setuju untuk membeli.\n`;
        }

        systemPrompt += `\n[SANGAT PENTING - AUTO ORDER SYSTEM]\nJika pelanggan SUDAH FIX/SETUJU untuk memesan dan data pesanannya sudah jelas (Nama, Pesanan, Total Harga), KAMU WAJIB menyertakan format teks persis seperti ini di bagian paling akhir balasanmu:\n[BUAT_ORDER: {"nama_pelanggan": "Nama Pelanggan", "pesanan": "Nama Barang x1", "total_harga": 150000}]\nTotal harga harus berupa angka tanpa titik atau koma. Sistem akan otomatis memproses pesanan tersebut ke database tanpa kamu beri tahu ke pelanggan.\n`;

        if (aiBoundary) {
            systemPrompt += `\nBATASAN / PANTANGAN (SANGAT PENTING DIIKUTI):\n${aiBoundary}\n`;
        }

        try {
            const parsedTemplates = JSON.parse(customTemplates);
            if (parsedTemplates && parsedTemplates.length > 0) {
                systemPrompt += `\nTEMPLATE CHAT / INFORMASI TAMBAHAN:\n`;
                parsedTemplates.forEach(t => {
                    systemPrompt += `[${t.judul}]:\n${t.isi}\n\n`;
                });
                systemPrompt += `Gunakan template di atas jika pelanggan menanyakan informasi terkait.\n`;
            }
        } catch (e) {
            console.error('Error parsing custom templates:', e);
        }

        systemPrompt += `\nKurir yang didukung: ${kurirAktif}.\n`;
        if (promoAktif === '1') {
            systemPrompt += `Promo Aktif Saat Ini:\n- Diskon Ongkir: ${diskonOngkir}% (Coverage: ${coverageOngkir})\n- Diskon Harga Produk: ${diskonProduk}%\n- Diskon Pembayaran: ${diskonPembayaran}%\nBeritahukan promo ini kepada pelanggan jika relevan!\n`;
        }
        
        systemPrompt += `\nMetode Pembayaran:\n`;
        if (pembayaranCod === '1') systemPrompt += `- Bayar Ditempat (COD)\n`;
        if (pembayaranTransfer === '1') {
            systemPrompt += `- Transfer Bank\n`;
            try {
                const banks = JSON.parse(rekeningBank);
                if (banks.length > 0) {
                    systemPrompt += `  Daftar Rekening:\n`;
                    banks.forEach(b => {
                        systemPrompt += `  * ${b.bank} - ${b.norek} a/n ${b.nama}\n`;
                    });
                }
            } catch (e) {
                console.error('Error parsing rekening bank:', e);
            }
        }

        systemPrompt += `\nPesan pelanggan: "${msg.body}"`;

        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "cek_ongkir",
                        description: "Menghitung ongkos kirim (ongkir) dari gudang ke kota/kabupaten tujuan. Gunakan HANYA SAAT pelanggan menanyakan harga ongkir.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                kota_tujuan: {
                                    type: "STRING",
                                    description: "Nama kota atau kabupaten tujuan (misal: 'Bandung', 'Jakarta Selatan')"
                                },
                                kurir: {
                                    type: "STRING",
                                    description: `Kode kurir yang dipilih pelanggan (misal: ${kurirAktif}). Jika tidak disebutkan, pilih salah satu dari kurir yang didukung.`
                                }
                            },
                            required: ["kota_tujuan", "kurir"]
                        }
                    }
                ]
            }
        ];

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", tools });
        const chat = model.startChat();
        
        let result = await chat.sendMessage(systemPrompt);
        let balasanAI = "";

        const calls = result.response.functionCalls();
        if (calls && calls.length > 0) {
            const call = calls[0];
            if (call.name === "cek_ongkir") {
                const { kota_tujuan, kurir } = call.args;
                console.log(`[AI Function Call] Cek Ongkir ke ${kota_tujuan} via ${kurir}...`);
                
                let ongkirInfo = "";
                if (!roApiKey || !gudangId) {
                    ongkirInfo = "Admin belum mengatur API Key RajaOngkir atau Gudang ID. Katakan ongkir belum bisa dicek otomatis.";
                } else {
                    try {
                        const cityRes = await fetch('https://api.rajaongkir.com/starter/city', { headers: { 'key': roApiKey } });
                        const cityData = await cityRes.json();
                        const cities = cityData.rajaongkir?.results || [];
                        const matchedCity = cities.find(c => c.city_name.toLowerCase().includes(kota_tujuan.toLowerCase()));
                        
                        if (!matchedCity) {
                            ongkirInfo = `Kota/Kabupaten '${kota_tujuan}' tidak ditemukan di database RajaOngkir. Minta kota yang lebih spesifik.`;
                        } else {
                            const costRes = await fetch('https://api.rajaongkir.com/starter/cost', {
                                method: 'POST',
                                headers: { 'key': roApiKey, 'content-type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({ origin: gudangId, destination: matchedCity.city_id, weight: 1000, courier: kurir.toLowerCase() }).toString()
                            });
                            const costData = await costRes.json();
                            if (costData.rajaongkir.status.code !== 200) {
                                ongkirInfo = `Gagal cek ongkir: ${costData.rajaongkir.status.description}`;
                            } else if (costData.rajaongkir.results[0].costs.length === 0) {
                                ongkirInfo = `Layanan kurir ${kurir} tidak tersedia untuk rute ke ${matchedCity.city_name}.`;
                            } else {
                                const layanan = costData.rajaongkir.results[0].costs[0];
                                const hargaAwal = layanan.cost[0].value;
                                const etd = layanan.cost[0].etd;
                                const dskn = parseInt(diskonOngkir) || 0;
                                const hargaAkhir = hargaAwal - (hargaAwal * (dskn / 100));
                                ongkirInfo = `Ongkir ke ${matchedCity.city_name} dengan ${kurir.toUpperCase()} (${layanan.service}) adalah Rp${hargaAkhir.toLocaleString('id-ID')} (Harga asli Rp${hargaAwal.toLocaleString('id-ID')}, diskon ongkir ${dskn}%). Estimasi ${etd} hari.`;
                            }
                        }
                    } catch (e) {
                        ongkirInfo = "Koneksi ke server RajaOngkir terputus.";
                    }
                }
                
                // Berikan hasil kembali ke Gemini
                const result2 = await chat.sendMessage([{
                    functionResponse: {
                        name: "cek_ongkir",
                        response: { result: ongkirInfo }
                    }
                }]);
                balasanAI = result2.response.text();
            }
        } else {
            balasanAI = result.response.text();
        }

        // --- INTERCEPT BUAT_ORDER ---
        const orderRegex = /\[BUAT_ORDER:\s*(\{.*?\})\s*\]/is;
        const match = balasanAI.match(orderRegex);
        if (match && match[1]) {
            try {
                const orderData = JSON.parse(match[1]);
                const newOrderId = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
                
                await db.run(
                    'INSERT INTO pesanan (order_id, nama_pelanggan, no_whatsapp, items, total_harga) VALUES ($1, $2, $3, $4, $5)',
                    [newOrderId, orderData.nama_pelanggan || realNumber, realNumber, orderData.pesanan, orderData.total_harga || 0]
                );
                
                console.log(`[Database] Auto-Order berhasil dibuat: ${newOrderId}`);
                io.emit('order_baru'); // Beritahu frontend ada order baru
                
                // Hapus string [BUAT_ORDER: {...}] dari balasan yang dikirim ke pelanggan
                balasanAI = balasanAI.replace(orderRegex, '').trim();
            } catch (err) {
                console.error('Gagal parsing atau insert Auto-Order:', err);
            }
        }
        // -----------------------------

        // 4. KIRIM BALASAN KE WHATSAPP
        await msg.reply(balasanAI);

        // 5. SIMPAN BALASAN AI KE DATABASE DAN EMIT KE FRONTEND
        await db.run(
            'INSERT INTO antrean_chat (dari, pesan, nomor_pelanggan) VALUES (?, ?, ?)',
            ['AI', balasanAI, realNumber]
        );
        io.emit('pesan_baru', { dari: 'AI', pesan: balasanAI, nomor_pelanggan: realNumber });
        console.log(`[AI] Membalas ke ${realNumber}: ${balasanAI}`);

    } catch (err) {
        console.error('Terjadi kesalahan pada proses AI:', err);
    }
});

// Setup Socket.io untuk komunikasi ke Frontend React
io.on('connection', async (socket) => {
    console.log('Frontend React terhubung ke Socket.io');

    // KETIKA REACT TERHUBUNG, AMBIL SEMUA DATA LAMA DARI DATABASE
    try {
        const dataLama = await db.all('SELECT dari, pesan FROM antrean_chat ORDER BY id ASC');
        // Kirim data lama tersebut ke React yang baru login/refresh
        socket.emit('load_data_lama', dataLama);
    } catch (err) {
        console.error('Gagal mengambil data lama:', err);
    }

    if (client.info) {
        const waInfo = { pushname: client.info.pushname, number: client.info.wid.user };
        socket.emit('wa-ready', waInfo);
    }

    // --- KODE BARU YANG DITAMBAHKAN ---
    // Mendengarkan perintah balasan pesan dari Agen di React Dashboard
    socket.on('balas_pesan', async (data) => {
        try {
            // Mengirim pesan balik ke WA pelanggan
            await client.sendMessage(data.ke, data.pesan);
            console.log(`[Agen] Berhasil membalas ke ${data.ke}: ${data.pesan}`);

            // Simpan juga balasan agen ke database sebagai riwayat
            await db.run(
                'INSERT INTO antrean_chat (dari, pesan, nomor_pelanggan) VALUES (?, ?, ?)',
                ['Agen', data.pesan, data.ke]
            );
        } catch (err) {
            console.error('Gagal membalas pesan WhatsApp:', err);
        }
    });

    // Mendengarkan perintah logout (Ganti Nomor)
    socket.on('wa-logout', async () => {
        console.log('Permintaan logout diterima dari UI.');
        io.emit('wa-disconnected', true);
        try {
            await client.logout();
            console.log('Sesi dihapus. Memulai ulang klien...');
        } catch (err) {
            console.error('Gagal logout dengan mulus:', err);
        }
        
        try {
            await client.destroy();
        } catch(e) {}
        
        setTimeout(() => {
            console.log('Menginisialisasi klien baru untuk mengambil QR...');
            client.initialize();
        }, 3000);
    });
    // ----------------------------------
});

// --- REST API UNTUK LOGIN (PUBLIC) ---
app.post('/api/login', async (req, res) => {
    try {
        // Karena form diubah, kita menangkap 'email', tetapi pengguna mungkin memasukkan admin
        const email = req.body.email || req.body.username;
        const password = req.body.password;

        const admin = await db.get('SELECT * FROM admin WHERE email = $1 OR username = $1', [email]);
        
        if (!admin) return res.status(401).json({ error: 'Email salah atau tidak terdaftar' });
        
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) return res.status(401).json({ error: 'Password salah' });

        if (!admin.is_verified) {
            return res.status(401).json({ error: 'Akun belum diverifikasi. Silakan cek kotak masuk Email/Gmail Anda.' });
        }
        
        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { nama_lengkap: admin.nama_lengkap, email: admin.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await db.get('SELECT * FROM admin WHERE email = $1', [email]);
        if (!admin) return res.status(404).json({ error: 'Email tidak ditemukan' });

        const resetToken = require('crypto').randomBytes(20).toString('hex');
        await db.run('UPDATE admin SET verification_token = $1 WHERE id = $2', [resetToken, admin.id]);

        const resetLink = `http://localhost:3000/login?reset=${resetToken}`;
        
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: admin.email,
                subject: 'Reset Password - ChatLaris',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                        <h2 style="color: #0f172a;">Reset Password Anda</h2>
                        <p style="color: #475569; font-size: 16px;">Seseorang baru saja meminta pengaturan ulang kata sandi untuk akun Anda. Jika itu bukan Anda, abaikan email ini.</p>
                        <p style="color: #475569; font-size: 16px;">Klik tombol di bawah ini untuk membuat kata sandi baru:</p>
                        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Reset Password</a>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);
        } else {
            console.log("MOCK EMAIL RESET URL:", resetLink);
        }

        res.json({ success: true, message: 'Link reset password telah dikirim ke email Anda' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ error: 'Token dan kata sandi baru diperlukan' });

        const admin = await db.get('SELECT * FROM admin WHERE verification_token = $1', [token]);
        if (!admin) return res.status(400).json({ error: 'Link reset password tidak valid atau sudah kedaluwarsa' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run('UPDATE admin SET password = $1, verification_token = NULL WHERE id = $2', [hashedPassword, admin.id]);

        res.json({ success: true, message: 'Password berhasil diubah! Silakan login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REST API UNTUK REGISTER (PUBLIC) ---
app.post('/api/register', async (req, res) => {
    try {
        const { email, nama_lengkap, nomor_wa, password } = req.body;
        
        if (!email || !password || !nama_lengkap || !nomor_wa) {
            return res.status(400).json({ error: 'Semua kolom wajib diisi!' });
        }

        const existingAdmin = await db.get('SELECT * FROM admin WHERE email = $1 OR username = $1', [email]);
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email sudah terdaftar, silakan login.' });
        }
        
        const hashedPwd = await bcrypt.hash(password, 10);
        const verificationToken = require('crypto').randomBytes(32).toString('hex');
        
        // username = email untuk fallback legacy
        await db.run(
            'INSERT INTO admin (username, password, email, nama_lengkap, nomor_wa, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
            [email, hashedPwd, email, nama_lengkap, nomor_wa, false, verificationToken]
        );
        
        // Kirim Email Verifikasi
        const verifyLink = `http://localhost:3001/api/verify?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verifikasi Email - Pendaftaran Sukses',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #0f172a; margin-top: 0;">Halo, ${nama_lengkap}! 👋</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Terima kasih telah mendaftar di sistem kami. Hanya tersisa satu langkah lagi untuk mengaktifkan akun Anda.</p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Silakan klik tombol di bawah ini untuk memverifikasi email Anda:</p>
                        <a href="${verifyLink}" style="display: block; width: fit-content; padding: 14px 28px; margin: 25px auto; color: #ffffff; background: linear-gradient(135deg, #f97316, #ea580c); text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center;">Verifikasi Akun Saya</a>
                        <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-bottom: 0;">Atau *copy-paste* tautan berikut di browser Anda:</p>
                        <p style="color: #3b82f6; font-size: 12px; text-align: center; word-break: break-all; margin-top: 5px;">${verifyLink}</p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Berhasil didaftarkan, namun gagal mengirim email verifikasi.' });
            }
            res.json({ success: true, message: 'Pendaftaran sukses! Silakan cek kotak masuk/SPAM Email Anda untuk verifikasi.' });
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REST API UNTUK VERIFY EMAIL ---
app.get('/api/verify', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.send('Token tidak valid.');

        const user = await db.get('SELECT * FROM admin WHERE verification_token = $1', [token]);
        if (!user) return res.send('Tautan verifikasi tidak valid atau kadaluarsa.');

        await db.run('UPDATE admin SET is_verified = true, verification_token = NULL WHERE id = $1', [user.id]);
        
        // Redirect kembali ke frontend dengan parameter
        res.redirect('http://localhost:3000/?verified=success');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// --- REST API UNTUK MENDAPATKAN DATA PROFIL ADMIN ---
app.get('/api/me', async (req, res) => {
    try {
        const userId = req.user.id;
        const admin = await db.get('SELECT username, email, nama_lengkap, nomor_wa FROM admin WHERE id = $1', [userId]);
        if (!admin) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json(admin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REST API UNTUK UPDATE DATA PROFIL ADMIN ---
app.put('/api/me', async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email, nama_lengkap, nomor_wa, password } = req.body;
        
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.run(
                'UPDATE admin SET username = $1, email = $2, nama_lengkap = $3, nomor_wa = $4, password = $5 WHERE id = $6',
                [username, email, nama_lengkap, nomor_wa, hashedPassword, userId]
            );
        } else {
            await db.run(
                'UPDATE admin SET username = $1, email = $2, nama_lengkap = $3, nomor_wa = $4 WHERE id = $5',
                [username, email, nama_lengkap, nomor_wa, userId]
            );
        }
        res.json({ success: true, message: 'Profil berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REST API UNTUK KONTAK (HANDOFF AI) ---
app.get('/api/kontak/:nomor', async (req, res) => {
    try {
        const { nomor } = req.params;
        const kontak = await db.get('SELECT * FROM kontak WHERE nomor_wa = $1', [nomor]);
        if (!kontak) {
            // Default: AI is active
            return res.json({ nomor_wa: nomor, is_ai_active: 1 });
        }
        res.json(kontak);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/kontak/toggle-ai', async (req, res) => {
    try {
        const { nomor_wa, is_ai_active } = req.body;
        const existing = await db.get('SELECT * FROM kontak WHERE nomor_wa = $1', [nomor_wa]);
        if (existing) {
            await db.run('UPDATE kontak SET is_ai_active = $1 WHERE nomor_wa = $2', [is_ai_active ? 1 : 0, nomor_wa]);
        } else {
            await db.run('INSERT INTO kontak (nomor_wa, is_ai_active) VALUES ($1, $2)', [nomor_wa, is_ai_active ? 1 : 0]);
        }
        res.json({ success: true, nomor_wa, is_ai_active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REST API UNTUK PRODUK ---
app.get('/api/produk', async (req, res) => {
    try {
        if (!req.query.page && !req.query.search) {
            const produkList = await db.all('SELECT * FROM produk ORDER BY id DESC');
            return res.json(produkList);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM produk';
        let countQuery = 'SELECT COUNT(*) as total FROM produk';
        const params = [];

        if (search) {
            query += ' WHERE nama ILIKE $1 OR kategori ILIKE $1';
            countQuery += ' WHERE nama ILIKE $1 OR kategori ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const dataParams = [...params, limit, offset];

        const produkList = await db.all(query, dataParams);
        const countRes = await db.get(countQuery, params);
        
        res.json({
            data: produkList,
            total: parseInt(countRes.total),
            page,
            limit,
            totalPages: Math.ceil(parseInt(countRes.total) / limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint untuk mengambil riwayat percakapan (semua pesan di antrean_chat)
app.get('/api/history', async (req, res) => {
    try {
        const rows = await db.all('SELECT id, dari, pesan, waktu, nomor_pelanggan FROM antrean_chat ORDER BY id DESC LIMIT 500');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sandbox', async (req, res) => {
    try {
        const { pesan } = req.body;
        const sandboxNumber = 'SandboxUser';
        await db.run('INSERT INTO antrean_chat (dari, pesan, nomor_pelanggan) VALUES (?, ?, ?)', ['Tester', pesan, sandboxNumber]);
        io.emit('pesan_baru', { dari: 'Tester', pesan: pesan, nomor_pelanggan: sandboxNumber });

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) return res.status(500).json({ error: 'API Key belum diatur.' });

        const rows = await db.all('SELECT * FROM pengaturan');
        const settingsMap = {};
        rows.forEach(row => { settingsMap[row.kunci] = row.nilai; });

        const namaToko = settingsMap['nama_toko'] || "Toko Kami";
        const namaCs = settingsMap['nama_cs'] || "AI";
        const genderCs = settingsMap['gender_cs'] || "Netral";
        const gayaBahasa = settingsMap['gaya_bahasa'] || "Ramah";
        const sapaan = settingsMap['sapaan'] || "Kak";
        const jobDesc = settingsMap['job_description'] || "Jawab pertanyaan pelanggan dengan sopan.";

        const produkList = await db.all('SELECT * FROM produk WHERE is_active = 1 OR is_active IS NULL ORDER BY id DESC');
        let produkTeks = produkList.map(p => `- ${p.nama} (Harga: ${p.harga}) [Stok: ${p.stok || 'Tersedia'}] [Kategori: ${p.kategori || '-'}] - Deskripsi: ${p.deskripsi}. Link Pembelian: ${p.link_pembelian || 'Tidak ada link'}.`).join('\n');
        if (produkTeks.length === 0) produkTeks = "Belum ada produk.";

        let systemPrompt = `Kamu adalah Customer Service AI dari toko bernama "${namaToko}".
Nama Kamu: ${namaCs} (Gender: ${genderCs})
Gaya Bahasa: ${gayaBahasa}
Sapaan: ${sapaan}
Tugas:\n${jobDesc}\nDaftar produk:\n${produkTeks}\n`;

        const customTemplates = settingsMap['custom_templates'] || "[]";
        const parsedTemplates = JSON.parse(customTemplates);
        if (parsedTemplates && parsedTemplates.length > 0) {
            systemPrompt += `\nTEMPLATE CHAT:\n`;
            parsedTemplates.forEach(t => { systemPrompt += `[${t.judul}]:\n${t.isi}\n\n`; });
        }

        systemPrompt += `\n\nPesan Pelanggan (Tester): ${pesan}`;

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const chat = model.startChat();
        let result = await chat.sendMessage(systemPrompt);
        let balasanAI = result.response.text();

        await db.run('INSERT INTO antrean_chat (dari, pesan, nomor_pelanggan) VALUES (?, ?, ?)', ['AI', balasanAI, sandboxNumber]);
        io.emit('pesan_baru', { dari: 'AI', pesan: balasanAI, nomor_pelanggan: sandboxNumber });
        
        res.json({ balasan: balasanAI });
    } catch (err) {
        console.error('Sandbox error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/produk', upload.single('gambar'), async (req, res) => {
    try {
        const { nama, harga, deskripsi, kategori, stok, link_pembelian } = req.body;
        const gambarUrl = req.file ? `/uploads/${req.file.filename}` : null;
        
        const result = await db.run(
            'INSERT INTO produk (nama, harga, deskripsi, is_active, gambar, kategori, stok, link_pembelian) VALUES ($1, $2, $3, 1, $4, $5, $6, $7) RETURNING id',
            [nama, harga, deskripsi, gambarUrl, kategori, stok || 'Tersedia', link_pembelian]
        );
        const newId = result.rows[0].id;
        res.json({ id: newId, nama, harga, deskripsi, is_active: 1, gambar: gambarUrl, kategori, stok: stok || 'Tersedia', link_pembelian });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/produk/:id', upload.single('gambar'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, harga, deskripsi, kategori, stok, link_pembelian } = req.body;
        
        if (req.file) {
            const gambarUrl = `/uploads/${req.file.filename}`;
            await db.run(
                'UPDATE produk SET nama = $1, harga = $2, deskripsi = $3, gambar = $4, kategori = $5, stok = $6, link_pembelian = $7 WHERE id = $8',
                [nama, harga, deskripsi, gambarUrl, kategori, stok, link_pembelian, id]
            );
            res.json({ success: true, gambar: gambarUrl });
        } else {
            await db.run(
                'UPDATE produk SET nama = $1, harga = $2, deskripsi = $3, kategori = $4, stok = $5, link_pembelian = $6 WHERE id = $7',
                [nama, harga, deskripsi, kategori, stok, link_pembelian, id]
            );
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/produk/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run('DELETE FROM produk WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/produk/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const produk = await db.get('SELECT is_active FROM produk WHERE id = $1', [id]);
        if (!produk) return res.status(404).json({ error: 'Not found' });
        
        const newStatus = produk.is_active === 0 ? 1 : 0;
        await db.run('UPDATE produk SET is_active = $1 WHERE id = $2', [newStatus, id]);
        res.json({ success: true, is_active: newStatus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REST API UNTUK PESANAN ---
app.get('/api/orders', async (req, res) => {
    try {
        if (!req.query.page && !req.query.search) {
            const orders = await db.all('SELECT * FROM pesanan ORDER BY id DESC');
            return res.json(orders);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM pesanan';
        let countQuery = 'SELECT COUNT(*) as total FROM pesanan';
        const params = [];

        if (search) {
            query += ' WHERE order_id ILIKE $1 OR nama_pelanggan ILIKE $1 OR no_whatsapp ILIKE $1';
            countQuery += ' WHERE order_id ILIKE $1 OR nama_pelanggan ILIKE $1 OR no_whatsapp ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const dataParams = [...params, limit, offset];

        const ordersList = await db.all(query, dataParams);
        const countRes = await db.get(countQuery, params);
        
        res.json({
            data: ordersList,
            total: parseInt(countRes.total),
            page,
            limit,
            totalPages: Math.ceil(parseInt(countRes.total) / limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { order_id, nama_pelanggan, no_whatsapp, items, total_harga, status_pembayaran, status_pengiriman } = req.body;
        const newOrderId = order_id || `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        await db.run(
            'INSERT INTO pesanan (order_id, nama_pelanggan, no_whatsapp, items, total_harga, status_pembayaran, status_pengiriman) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [newOrderId, nama_pelanggan, no_whatsapp, items, total_harga, status_pembayaran || 'Belum Bayar', status_pengiriman || 'Diproses']
        );
        res.json({ success: true, order_id: newOrderId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status_pembayaran, status_pengiriman } = req.body;
        
        if (status_pembayaran) {
            await db.run('UPDATE pesanan SET status_pembayaran = $1 WHERE id = $2', [status_pembayaran, id]);
        }
        if (status_pengiriman) {
            await db.run('UPDATE pesanan SET status_pengiriman = $1 WHERE id = $2', [status_pengiriman, id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run('DELETE FROM pesanan WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REST API UNTUK DASHBOARD STATS ---
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const filter = req.query.filter || 'semua';
        let dateCondition = '';
        const params = [];
        
        if (filter !== 'semua') {
            dateCondition = 'WHERE waktu >= $1';
            let dateObj = new Date();
            if (filter === 'hari_ini') {
                dateObj.setHours(0,0,0,0);
            } else if (filter === 'minggu_ini') {
                const day = dateObj.getDay();
                const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
                dateObj.setDate(diff);
                dateObj.setHours(0,0,0,0);
            } else if (filter === 'bulan_ini') {
                dateObj.setDate(1);
                dateObj.setHours(0,0,0,0);
            }
            params.push(dateObj.toISOString());
        }

        const stats = {
            totalPendapatan: 0,
            totalPesanan: 0,
            totalPesanAI: 0,
            produkAktif: 0,
            recentOrders: []
        };

        const pesanan = await db.all(`SELECT * FROM pesanan ${dateCondition} ORDER BY id DESC`, params);
        stats.totalPesanan = pesanan.length;
        stats.totalPendapatan = pesanan.filter(o => o.status_pembayaran === 'Lunas').reduce((acc, curr) => acc + (parseInt(curr.total_harga) || 0), 0);
        stats.recentOrders = pesanan.slice(0, 5);

        const historyQuery = filter !== 'semua' ? `SELECT COUNT(*) as count FROM antrean_chat WHERE dari = 'AI' AND waktu >= $1` : `SELECT COUNT(*) as count FROM antrean_chat WHERE dari = 'AI'`;
        const historyData = await db.get(historyQuery, params);
        stats.totalPesanAI = parseInt(historyData.count) || 0;

        const produkData = await db.get(`SELECT COUNT(*) as count FROM produk WHERE is_active = 1`);
        stats.produkAktif = parseInt(produkData.count) || 0;

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REST API UNTUK PENGATURAN ---
app.get('/api/settings', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM pengaturan');
        const settings = {};
        rows.forEach(row => {
            settings[row.kunci] = row.nilai;
        });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { 
            nama_toko, nama_cs, gender_cs, gaya_bahasa, sapaan, job_description, 
            informasi_toko, faq, template_order, ai_boundary, custom_templates,
            gudang_id, ekspedisi_aktif, promo_aktif, diskon_ongkir, coverage_ongkir, diskon_produk, diskon_pembayaran,
            pembayaran_cod, pembayaran_transfer, rekening_bank
        } = req.body;
        
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['nama_toko', nama_toko]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['nama_cs', nama_cs]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['gender_cs', gender_cs]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['gaya_bahasa', gaya_bahasa]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['sapaan', sapaan]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['job_description', job_description]);
        
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['informasi_toko', informasi_toko]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['faq', faq]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['template_order', template_order]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['ai_boundary', ai_boundary]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['custom_templates', custom_templates]);

        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['gudang_id', gudang_id]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['ekspedisi_aktif', ekspedisi_aktif]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['promo_aktif', promo_aktif]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['diskon_ongkir', diskon_ongkir]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['coverage_ongkir', coverage_ongkir]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['diskon_produk', diskon_produk]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['diskon_pembayaran', diskon_pembayaran]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['pembayaran_cod', pembayaran_cod]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['pembayaran_transfer', pembayaran_transfer]);
        await db.run('INSERT INTO pengaturan (kunci, nilai) VALUES ($1, $2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai', ['rekening_bank', rekening_bank]);

        res.json({ message: 'Pengaturan berhasil disimpan!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -----------------------------

client.initialize();
server.listen(3001, () => {
    console.log('Server Backend berjalan di port 3001');
});