import React, { useState, useEffect } from 'react';

function Settings({ initialTab = 'template' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'template' or 'pengiriman'
  const [form, setForm] = useState({
    nama_toko: '',
    nama_cs: '',
    gender_cs: '',
    gaya_bahasa: '',
    sapaan: '',
    job_description: '',
    informasi_toko: '',
    faq: '',
    template_order: '',
    ai_boundary: '',
    gudang_id: '',
    ekspedisi_aktif: 'jne,sicepat,jnt',
    diskon_ongkir: '0',
    diskon_produk: '0',
    promo_aktif: '1',
    coverage_ongkir: 'Seluruh Indonesia',
    diskon_pembayaran: '0',
    pembayaran_cod: '0',
    pembayaran_transfer: '1',
    rekening_bank: '[]',
    custom_templates: '[]',
    jam_buka: '08:00',
    jam_tutup: '17:00',
    ai_aktif_luar_jam: 'false',
    pesan_luar_jam: 'Maaf, toko kami sedang tutup. Silakan tinggalkan pesan dan kami akan membalas di jam operasional berikutnya.'
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [expandedCourier, setExpandedCourier] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [newBank, setNewBank] = useState({ bank: 'BCA', norek: '', nama: '' });
  
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ judul: '', isi: '' });

  const [accountForm, setAccountForm] = useState({
    username: '',
    email: '',
    nama_lengkap: '',
    nomor_wa: '',
    password: ''
  });
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState('');

  const activeCouriers = form.ekspedisi_aktif ? form.ekspedisi_aktif.split(',') : [];

  const toggleCourier = (courierId) => {
    let newCouriers = [...activeCouriers];
    if (newCouriers.includes(courierId)) {
      newCouriers = newCouriers.filter(c => c !== courierId);
    } else {
      newCouriers.push(courierId);
    }
    setForm({ ...form, ekspedisi_aktif: newCouriers.join(',') });
  };

  const couriersList = [
    { id: 'jne', name: 'JNE', logo: '/couriers/jne.png', services: ['Regular', 'Trucking / Cargo'] },
    { id: 'sicepat', name: 'SICEPAT', logo: '/couriers/sicepat.png', services: ['Regular', 'Gokil'] },
    { id: 'idexpress', name: 'ID EXPRESS', logo: '/couriers/id-express.png', services: ['Standard', 'Same Day'] },
    { id: 'jnt', name: 'J&T EXPRESS', logo: '/couriers/jnt.png', services: ['EZ', 'Super'] },
    { id: 'jnt-cargo', name: 'J&T CARGO', logo: '/couriers/jnt-cargo.png', services: ['Standard'] },
    { id: 'spx', name: 'SHOPEE XPRESS', logo: '/couriers/spx.png', services: ['Standard', 'Sameday'] }
  ];

  useEffect(() => {
    fetchSettings();
    fetchAccount();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.error) {
        setAccountForm({
          username: data.username || '',
          email: data.email || '',
          nama_lengkap: data.nama_lengkap || '',
          nomor_wa: data.nomor_wa || '',
          password: ''
        });
      }
    } catch (err) {
      console.error('Gagal mengambil data akun:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/settings');
      const data = await res.json();
      if (data) {
        setForm({
          nama_toko: data.nama_toko || '',
          nama_cs: data.nama_cs || '',
          gender_cs: data.gender_cs || '',
          gaya_bahasa: data.gaya_bahasa || '',
          sapaan: data.sapaan || '',
          job_description: data.job_description || '',
          informasi_toko: data.informasi_toko || '',
          faq: data.faq || '',
          template_order: data.template_order || '',
          ai_boundary: data.ai_boundary || '',
          gudang_id: data.gudang_id || '',
          ekspedisi_aktif: data.ekspedisi_aktif || 'jne,sicepat,jnt',
          diskon_ongkir: data.diskon_ongkir || '0',
          diskon_produk: data.diskon_produk || '0',
          promo_aktif: data.promo_aktif || '1',
          coverage_ongkir: data.coverage_ongkir || 'Seluruh Indonesia',
          diskon_pembayaran: data.diskon_pembayaran || '0',
          pembayaran_cod: data.pembayaran_cod || '0',
          pembayaran_transfer: data.pembayaran_transfer || '1',
          rekening_bank: data.rekening_bank || '[]'
        });
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan:', err);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'akun') {
      handleAccountSubmit();
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const res = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setStatus('Pengaturan berhasil disimpan!');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      console.error('Gagal menyimpan pengaturan:', err);
      setStatus('Gagal menyimpan pengaturan.');
    }
    setLoading(false);
  };

  const handleAccountSubmit = async () => {
    setAccountLoading(true);
    setAccountStatus('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(accountForm)
      });
      if (res.ok) {
        setAccountStatus('Profil berhasil diperbarui!');
        setTimeout(() => setAccountStatus(''), 3000);
        
        // Refresh account data
        fetchAccount();
      } else {
        setAccountStatus('Gagal memperbarui profil.');
      }
    } catch (err) {
      console.error('Gagal menyimpan profil:', err);
      setAccountStatus('Gagal memperbarui profil.');
    }
    setAccountLoading(false);
  };

  const handleAddBank = () => {
    if (!newBank.norek || !newBank.nama) return;
    const currentBanks = (() => { try { return JSON.parse(form.rekening_bank); } catch(e) { return []; } })();
    currentBanks.push(newBank);
    setForm({ ...form, rekening_bank: JSON.stringify(currentBanks) });
    setNewBank({ bank: 'BCA', norek: '', nama: '' });
    setShowBankForm(false);
  };

  const handleRemoveBank = (idx) => {
    const currentBanks = (() => { try { return JSON.parse(form.rekening_bank); } catch(e) { return []; } })();
    currentBanks.splice(idx, 1);
    setForm({ ...form, rekening_bank: JSON.stringify(currentBanks) });
  };

  const parsedBanks = (() => {
    try { return JSON.parse(form.rekening_bank); } catch(e) { return []; }
  })();

  const handleAddTemplate = () => {
    if (!newTemplate.judul || !newTemplate.isi) return;
    const currentTemplates = (() => { try { return JSON.parse(form.custom_templates || '[]'); } catch { return []; } })();
    currentTemplates.push(newTemplate);
    setForm({ ...form, custom_templates: JSON.stringify(currentTemplates) });
    setNewTemplate({ judul: '', isi: '' });
    setShowTemplateForm(false);
  };

  const handleRemoveTemplate = (idx) => {
    const currentTemplates = (() => { try { return JSON.parse(form.custom_templates || '[]'); } catch { return []; } })();
    currentTemplates.splice(idx, 1);
    setForm({ ...form, custom_templates: JSON.stringify(currentTemplates) });
  };

  const parsedTemplates = (() => {
    try { return JSON.parse(form.custom_templates || '[]'); } catch(e) { return []; }
  })();

  const getBankLogo = (bankName) => {
    const map = {
      'BCA': '/bank/bca.png',
      'BNI': '/bank/bni.png',
      'BRI': '/bank/bri.png',
      'Mandiri': '/bank/mandiri.png',
      'SeaBank': '/bank/seabank.png',
      'OVO': '/bank/ovo.png',
      'Dana': '/bank/dana.png',
      'GoPay': '/bank/gopay.png',
      'ShopeePay': '/bank/shopeepay.png',
      'QRIS': '/bank/qris.png'
    };
    return map[bankName] || null;
  };

  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' };

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* TAB NAVIGATION AS SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
        <div
          onClick={() => setActiveTab('akun')}
          className="glass-card"
          style={{
            padding: '1.5rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s',
            border: activeTab === 'akun' ? '2px solid var(--primary-color)' : '1px solid transparent',
            background: activeTab === 'akun' ? 'rgba(14, 165, 233, 0.05)' : 'white',
            transform: activeTab === 'akun' ? 'translateY(-4px)' : 'none',
            boxShadow: activeTab === 'akun' ? '0 10px 25px rgba(14, 165, 233, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Akun Saya</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Profil, Sandi & Kontak</p>
        </div>
        <div
          onClick={() => setActiveTab('template')}
          className="glass-card"
          style={{
            padding: '1.5rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s',
            border: activeTab === 'template' ? '2px solid var(--primary-color)' : '1px solid transparent',
            background: activeTab === 'template' ? 'rgba(14, 165, 233, 0.05)' : 'white',
            transform: activeTab === 'template' ? 'translateY(-4px)' : 'none',
            boxShadow: activeTab === 'template' ? '0 10px 25px rgba(14, 165, 233, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Template Chat</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Atur instruksi, FAQ & format balas</p>
        </div>

        <div
          onClick={() => setActiveTab('pengiriman')}
          className="glass-card"
          style={{
            padding: '1.5rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s',
            border: activeTab === 'pengiriman' ? '2px solid var(--primary-color)' : '1px solid transparent',
            background: activeTab === 'pengiriman' ? 'rgba(14, 165, 233, 0.05)' : 'white',
            transform: activeTab === 'pengiriman' ? 'translateY(-4px)' : 'none',
            boxShadow: activeTab === 'pengiriman' ? '0 10px 25px rgba(14, 165, 233, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Pengiriman & Promo</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Kurir, Ongkir Otomatis & Diskon</p>
        </div>

        <div
          onClick={() => setActiveTab('pembayaran')}
          className="glass-card"
          style={{
            padding: '1.5rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s',
            border: activeTab === 'pembayaran' ? '2px solid var(--primary-color)' : '1px solid transparent',
            background: activeTab === 'pembayaran' ? 'rgba(14, 165, 233, 0.05)' : 'white',
            transform: activeTab === 'pembayaran' ? 'translateY(-4px)' : 'none',
            boxShadow: activeTab === 'pembayaran' ? '0 10px 25px rgba(14, 165, 233, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Pembayaran</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Transfer Bank & COD</p>
        </div>

        <div
          onClick={() => setActiveTab('operasional')}
          className="glass-card"
          style={{
            padding: '1.5rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s',
            border: activeTab === 'operasional' ? '2px solid var(--primary-color)' : '1px solid transparent',
            background: activeTab === 'operasional' ? 'rgba(14, 165, 233, 0.05)' : 'white',
            transform: activeTab === 'operasional' ? 'translateY(-4px)' : 'none',
            boxShadow: activeTab === 'operasional' ? '0 10px 25px rgba(14, 165, 233, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f3e8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Operasional</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Jam Kerja & Auto-Reply</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {activeTab === 'akun' && 'Pengaturan Akun & Keamanan'}
          {activeTab === 'template' && 'Pengaturan Template Chat & Perilaku'}
          {activeTab === 'pengiriman' && 'Pengaturan Gudang & Ekspedisi'}
          {activeTab === 'pembayaran' && 'Pengaturan Metode Pembayaran'}
          {activeTab === 'operasional' && 'Pengaturan Jam Operasional Toko'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {activeTab === 'akun' && 'Kelola profil Anda, email, nomor kontak, serta kata sandi masuk sistem.'}
          {activeTab === 'template' && 'Ajari AI Anda bagaimana merespons layaknya Customer Service profesional.'}
          {activeTab === 'pengiriman' && 'Pilih kurir, tentukan lokasi pengiriman asal, dan atur promosi otomatis.'}
          {activeTab === 'pembayaran' && 'Atur layanan Bayar Ditempat (COD) dan rekening transfer bank Anda.'}
          {activeTab === 'operasional' && 'Tentukan kapan AI merespons pesanan dan atur balasan saat toko tutup.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* TAB 0: AKUN SAYA */}
          {activeTab === 'akun' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Informasi Profil</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Username *</label>
                  <input
                    type="text"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({...accountForm, username: e.target.value})}
                    placeholder="Username untuk login"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nama Lengkap *</label>
                  <input
                    type="text"
                    value={accountForm.nama_lengkap}
                    onChange={(e) => setAccountForm({...accountForm, nama_lengkap: e.target.value})}
                    placeholder="Nama Lengkap Anda"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Alamat Email</label>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                    placeholder="Alamat Email aktif"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={accountForm.nomor_wa}
                    onChange={(e) => setAccountForm({...accountForm, nomor_wa: e.target.value})}
                    placeholder="Contoh: 8123456789"
                    style={inputStyle}
                  />
                </div>
              </div>

              <h3 style={{ margin: '1rem 0 0 0', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Keamanan</h3>

              <div>
                <label style={labelStyle}>Kata Sandi Baru (Opsional)</label>
                <input
                  type="password"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({...accountForm, password: e.target.value})}
                  placeholder="Kosongkan jika tidak ingin mengubah sandi"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* TAB 1: TEMPLATE CHAT */}
          {activeTab === 'template' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Customer Service Personality</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Nama Toko/Brand *</label>
                  <input
                    type="text"
                    name="nama_toko"
                    value={form.nama_toko}
                    onChange={handleInputChange}
                    placeholder="Contoh: Chatlaris Shop"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nama Customer Service AI *</label>
                  <input
                    type="text"
                    name="nama_cs"
                    value={form.nama_cs}
                    onChange={handleInputChange}
                    placeholder="Contoh: Clara"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Gender *</label>
                  <input
                    type="text"
                    name="gender_cs"
                    value={form.gender_cs}
                    onChange={handleInputChange}
                    placeholder="e.g Perempuan / Laki-laki"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Gaya Bahasa *</label>
                  <input
                    type="text"
                    name="gaya_bahasa"
                    value={form.gaya_bahasa}
                    onChange={handleInputChange}
                    placeholder="e.g Formal, Friendly"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Sapaan *</label>
                  <input
                    type="text"
                    name="sapaan"
                    value={form.sapaan}
                    onChange={handleInputChange}
                    placeholder="e.g Kak, Can, Bro etc"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Job Description *</label>
                <textarea
                  name="job_description"
                  value={form.job_description}
                  onChange={handleInputChange}
                  placeholder="Beri salam sesuai waktu:&#10;* 'Selamat pagi' (05:00-10:59)&#10;* 'Selamat siang' (11:00-14:59)&#10;..."
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <h3 style={{ margin: '1rem 0 0 0', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Pengetahuan Tambahan</h3>

              <div>
                <label style={labelStyle}>Informasi Dasar Toko</label>
                <textarea
                  name="informasi_toko"
                  value={form.informasi_toko}
                  onChange={handleInputChange}
                  placeholder="Contoh: Buka Senin-Jumat jam 08.00-17.00. Pengiriman dari Jakarta."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>FAQ (Pertanyaan Umum)</label>
                <textarea
                  name="faq"
                  value={form.faq}
                  onChange={handleInputChange}
                  placeholder="Q: Apakah bisa retur? A: Bisa, maksimal 3 hari. Q: Bisa COD? A: Ya, dukung COD se-Indonesia."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Template Formulir Checkout</label>
                <textarea
                  name="template_order"
                  value={form.template_order}
                  onChange={handleInputChange}
                  placeholder="Jika pelanggan ingin beli, berikan: Nama / No HP / Alamat Lengkap / Produk."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Batasan AI (Pantangan)</label>
                <textarea
                  name="ai_boundary"
                  value={form.ai_boundary}
                  onChange={handleInputChange}
                  placeholder="Contoh: Jangan memberikan diskon di luar yang sudah diatur. Jangan berikan nomor HP pribadi."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Template Chat Tambahan</h3>
                <button type="button" onClick={() => setShowTemplateForm(!showTemplateForm)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  + Buat Template
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {showTemplateForm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <input type="text" placeholder="Judul Template (misal: Harga Reseller)" value={newTemplate.judul} onChange={e => setNewTemplate({...newTemplate, judul: e.target.value})} style={inputStyle} />
                    <textarea placeholder="Isi template atau informasi detail yang akan dihafal oleh AI..." value={newTemplate.isi} onChange={e => setNewTemplate({...newTemplate, isi: e.target.value})} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                    <button type="button" onClick={handleAddTemplate} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}>Simpan Template</button>
                  </div>
                )}

                {parsedTemplates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Belum ada template khusus. Anda bisa tambahkan template harga, alamat gudang, kebijakan garansi, dll.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {parsedTemplates.map((t, idx) => (
                      <div key={idx} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '15px' }}>{t.judul}</h4>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{t.isi}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveTemplate(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PENGIRIMAN & PROMO */}
          {activeTab === 'pengiriman' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Informasi Gudang & Kurir</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>ID Kota/Kabupaten Gudang (Asal) *</label>
                  <input 
                    type="text" 
                    name="gudang_id" 
                    value={form.gudang_id} 
                    onChange={handleInputChange} 
                    placeholder="Contoh ID RajaOngkir: 152 (Jakarta Pusat)" 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pilih Ekspedisi *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {couriersList.map(c => {
                      const isActive = activeCouriers.includes(c.id);
                      const isExpanded = expandedCourier === c.id;
                      return (
                        <div key={c.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                          <div 
                            style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isActive ? 'rgba(249, 115, 22, 0.05)' : 'transparent', transition: 'all 0.2s' }}
                            onClick={() => setExpandedCourier(isExpanded ? null : c.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <img src={c.logo} alt={c.name} style={{ height: '30px', objectFit: 'contain' }} />
                              <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.5px' }}>{c.name}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                              <div 
                                onClick={(e) => { e.stopPropagation(); toggleCourier(c.id); }}
                                style={{ width: '48px', height: '26px', borderRadius: '13px', background: isActive ? '#ff5722' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                              >
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: isActive ? '24px' : '2px', transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                              </div>
                              <svg style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s', color: 'var(--text-secondary)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="animate-fade-in" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {c.services.map((svc, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '500' }}>{svc}</span>
                                  <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: isActive ? '#ff5722' : '#e5e7eb', position: 'relative', opacity: isActive ? 1 : 0.4, transition: '0.3s' }}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: isActive ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Promo & Diskon</h3>
                <div 
                  onClick={() => setForm({ ...form, promo_aktif: form.promo_aktif === '1' ? '0' : '1' })}
                  style={{ width: '48px', height: '26px', borderRadius: '13px', background: form.promo_aktif === '1' ? '#ff5722' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: form.promo_aktif === '1' ? '24px' : '2px', transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              {form.promo_aktif === '1' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Diskon Ongkir</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Besar Diskon (%)</label>
                      <input type="number" name="diskon_ongkir" value={form.diskon_ongkir} onChange={handleInputChange} style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Coverage</label>
                      <select name="coverage_ongkir" value={form.coverage_ongkir} onChange={handleInputChange} style={{...inputStyle, WebkitAppearance: 'auto', MozAppearance: 'auto', appearance: 'auto'}}>
                        <option value="Seluruh Indonesia">Seluruh Indonesia</option>
                        <option value="Pulau Jawa">Pulau Jawa</option>
                        <option value="Luar Pulau Jawa">Luar Pulau Jawa</option>
                        <option value="Jabodetabek">Jabodetabek</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Diskon Produk</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Besar Diskon (%)</label>
                      <input type="number" name="diskon_produk" value={form.diskon_produk} onChange={handleInputChange} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Diskon Pembayaran</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Besar Diskon (%)</label>
                      <input type="number" name="diskon_pembayaran" value={form.diskon_pembayaran} onChange={handleInputChange} style={inputStyle} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PEMBAYARAN */}
          {activeTab === 'pembayaran' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Metode Pembayaran</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: '#fafafa', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="checkbox" 
                    checked={form.pembayaran_cod === '1'} 
                    onChange={(e) => setForm({ ...form, pembayaran_cod: e.target.checked ? '1' : '0' })} 
                    style={{ width: '18px', height: '18px' }} 
                  />
                  <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>Bayar Ditempat (COD)</span>
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input 
                        type="checkbox" 
                        checked={form.pembayaran_transfer === '1'} 
                        onChange={(e) => setForm({ ...form, pembayaran_transfer: e.target.checked ? '1' : '0' })} 
                        style={{ width: '18px', height: '18px' }} 
                      />
                      <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>Transfer Bank</span>
                    </div>
                    {form.pembayaran_transfer === '1' && (
                      <button type="button" onClick={() => setShowBankForm(!showBankForm)} style={{ background: '#f97316', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                        + Tambah Rekening
                      </button>
                    )}
                  </div>
                  
                  {form.pembayaran_transfer === '1' && (
                    <div style={{ marginTop: '10px' }}>
                      {showBankForm && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr auto', gap: '10px', alignItems: 'center', marginBottom: '16px', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <select value={newBank.bank} onChange={e => setNewBank({...newBank, bank: e.target.value})} style={inputStyle}>
                            <option value="BCA">BCA</option>
                            <option value="Mandiri">Mandiri</option>
                            <option value="BNI">BNI</option>
                            <option value="BRI">BRI</option>
                            <option value="BSI">BSI</option>
                            <option value="SeaBank">SeaBank</option>
                            <option value="Jago">Jago</option>
                            <option value="OVO">OVO</option>
                            <option value="GoPay">GoPay</option>
                            <option value="Dana">Dana</option>
                            <option value="ShopeePay">ShopeePay</option>
                            <option value="QRIS">QRIS</option>
                          </select>
                          <input type="text" placeholder="No Rekening / Keterangan" value={newBank.norek} onChange={e => setNewBank({...newBank, norek: e.target.value})} style={inputStyle} />
                          <input type="text" placeholder="Atas Nama" value={newBank.nama} onChange={e => setNewBank({...newBank, nama: e.target.value})} style={inputStyle} />
                          <button type="button" onClick={handleAddBank} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
                        </div>
                      )}

                      {parsedBanks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                          <div style={{ fontSize: '24px', opacity: 0.2, marginBottom: '8px' }}>🔍</div>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>Belum ada data rekening</div>
                          <div style={{ fontSize: '12px' }}>Tambahkan rekening kamu</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {parsedBanks.map((b, idx) => {
                            const logo = getBankLogo(b.bank);
                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                  {logo ? (
                                    <img src={logo} alt={b.bank} style={{ height: '24px', objectFit: 'contain' }} />
                                  ) : (
                                    <span style={{ fontWeight: '800', color: '#1f2937', fontStyle: 'italic' }}>{b.bank}</span>
                                  )}
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '700', color: '#1f2937', fontSize: '14px' }}>{b.norek}</span>
                                    <span style={{ color: '#6b7280', fontSize: '12px' }}>a/n {b.nama}</span>
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleRemoveBank(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>&times;</button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OPERASIONAL */}
          {activeTab === 'operasional' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Jadwal Operasional Toko</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Jam Buka <span style={{ color: 'red' }}>*</span></label>
                  <input type="time" name="jam_buka" value={form.jam_buka} onChange={handleInputChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--input-bg)', color: 'var(--text-primary)' }} required />
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Waktu mulai AI aktif melayani pelanggan.</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Jam Tutup <span style={{ color: 'red' }}>*</span></label>
                  <input type="time" name="jam_tutup" value={form.jam_tutup} onChange={handleInputChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--input-bg)', color: 'var(--text-primary)' }} required />
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Waktu AI beralih ke mode toko tutup.</p>
                </div>
              </div>

              <h3 style={{ margin: '1rem 0 0 0', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Tindakan Luar Jam Operasional</h3>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.ai_aktif_luar_jam === 'true'} onChange={(e) => setForm(prev => ({ ...prev, ai_aktif_luar_jam: e.target.checked ? 'true' : 'false' }))} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>AI Tetap Menjawab Di Luar Jam</span>
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '28px' }}>Jika dicentang, AI akan tetap melayani tanya jawab seperti biasa walau toko sudah tutup.</p>
              </div>

              {form.ai_aktif_luar_jam !== 'true' && (
                <div className="animate-fade-in">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Pesan Otomatis (Auto-Reply) Saat Tutup</label>
                  <textarea name="pesan_luar_jam" value={form.pesan_luar_jam} onChange={handleInputChange} rows="3" placeholder="Maaf, toko kami sedang tutup..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}></textarea>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Pesan statis yang akan dikirim satu kali jika ada pelanggan chat di luar jam.</p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="submit" disabled={loading || accountLoading} style={{
              padding: '14px 28px', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white',
              border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px',
              cursor: (loading || accountLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)'
            }}>
              {(loading || accountLoading) ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            
            {(status || accountStatus) && (
              <span style={{ color: (status.includes('Gagal') || accountStatus.includes('Gagal')) ? '#ef4444' : '#10b981', fontWeight: '600', fontSize: '14px' }}>
                {status || accountStatus}
              </span>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  marginBottom: '8px'
};

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  outline: 'none',
  fontSize: '14px',
  fontFamily: 'inherit',
  background: 'var(--input-bg)',
  color: 'var(--text-primary)',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};

export default Settings;
