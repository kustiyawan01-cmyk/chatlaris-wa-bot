import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Search, Edit2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

function ProductSettings() {
  const [produk, setProduk] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({ nama: '', harga: '', deskripsi: '', kategori: '', stok: 'Tersedia', link_pembelian: '', gambar: null });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, nama: '', harga: '', deskripsi: '', kategori: '', stok: 'Tersedia', link_pembelian: '', gambar: null });
  const [editLoading, setEditLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch when page or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProduk(currentPage, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery]);

  const fetchProduk = async (page = 1, search = '') => {
    try {
      setFetching(true);
      const res = await fetch(`http://localhost:3001/api/produk?page=${page}&limit=10&search=${search}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProduk(data);
      } else {
        setProduk(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error('Gagal mengambil produk:', err);
      toast.error('Gagal memuat produk dari server.');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'gambar') {
      setForm({ ...form, gambar: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'gambar') {
      setEditForm({ ...editForm, gambar: files[0] });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.harga) return toast.error('Nama dan harga wajib diisi!');
    setLoading(true);

    const formData = new FormData();
    formData.append('nama', form.nama);
    formData.append('harga', form.harga);
    formData.append('deskripsi', form.deskripsi);
    formData.append('kategori', form.kategori);
    formData.append('stok', form.stok);
    formData.append('link_pembelian', form.link_pembelian);
    if (form.gambar) {
      formData.append('gambar', form.gambar);
    }

    try {
      const res = await fetch('http://localhost:3001/api/produk', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setProduk([data, ...produk]); 
      setForm({ nama: '', harga: '', deskripsi: '', kategori: '', stok: 'Tersedia', link_pembelian: '', gambar: null }); 
      document.getElementById('gambarUpload').value = ''; // Reset file input
      toast.success('Produk berhasil ditambahkan!');
    } catch (err) {
      console.error('Gagal menambah produk:', err);
      toast.error('Terjadi kesalahan saat menyimpan produk.');
    }
    setLoading(false);
  };

  const openEditModal = (p) => {
    setEditForm({
      id: p.id,
      nama: p.nama || '',
      harga: p.harga || '',
      deskripsi: p.deskripsi || '',
      kategori: p.kategori || '',
      stok: p.stok || 'Tersedia',
      link_pembelian: p.link_pembelian || '',
      gambar: null // File direset, kalau tidak diisi berarti tidak diganti
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.nama || !editForm.harga) return toast.error('Nama dan harga wajib diisi!');
    setEditLoading(true);

    const formData = new FormData();
    formData.append('nama', editForm.nama);
    formData.append('harga', editForm.harga);
    formData.append('deskripsi', editForm.deskripsi);
    formData.append('kategori', editForm.kategori);
    formData.append('stok', editForm.stok);
    formData.append('link_pembelian', editForm.link_pembelian);
    if (editForm.gambar) {
      formData.append('gambar', editForm.gambar);
    }

    try {
      const res = await fetch(`http://localhost:3001/api/produk/${editForm.id}`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
         setProduk(produk.map(p => p.id === editForm.id ? { 
             ...p, 
             nama: editForm.nama, 
             harga: editForm.harga, 
             deskripsi: editForm.deskripsi,
             kategori: editForm.kategori,
             stok: editForm.stok,
             link_pembelian: editForm.link_pembelian,
             ...(data.gambar && { gambar: data.gambar })
         } : p));
         toast.success('Produk berhasil diperbarui!');
         setEditModalOpen(false);
      }
    } catch (err) {
      console.error('Gagal update produk:', err);
      toast.error('Gagal memperbarui produk.');
    }
    setEditLoading(false);
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await fetch(`http://localhost:3001/api/produk/${deleteConfirmId}`, { method: 'DELETE' });
      setProduk(produk.filter(p => p.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      toast.success('Produk dihapus!');
    } catch (err) {
      console.error('Gagal menghapus produk:', err);
      toast.error('Gagal menghapus produk.');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/produk/${id}/toggle`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setProduk(produk.map(p => p.id === id ? { ...p, is_active: data.is_active } : p));
      }
    } catch (err) {
      console.error('Gagal toggle produk:', err);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const renderFormFields = (data, changeHandler, isEdit = false) => (
    <>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={labelStyle}>Nama Produk *</label>
          <input type="text" name="nama" value={data.nama} onChange={changeHandler} placeholder="Cth: Sepatu Lari X-Speed" style={inputStyle} required />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={labelStyle}>Harga *</label>
          <input type="text" name="harga" value={data.harga} onChange={changeHandler} placeholder="Cth: Rp 250.000" style={inputStyle} required />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={labelStyle}>Kategori</label>
          <input type="text" name="kategori" value={data.kategori} onChange={changeHandler} placeholder="Cth: Sepatu" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={labelStyle}>Link Pembelian (Opsional)</label>
          <input type="text" name="link_pembelian" value={data.link_pembelian} onChange={changeHandler} placeholder="https://shopee.co.id/..." style={inputStyle} />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={labelStyle}>Stok Barang</label>
          <select name="stok" value={data.stok} onChange={changeHandler} style={inputStyle}>
            <option value="Tersedia">Tersedia</option>
            <option value="Habis">Habis</option>
            <option value="Pre-Order">Pre-Order</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={labelStyle}>Gambar / Thumbnail</label>
          <input id={!isEdit ? "gambarUpload" : "gambarUploadEdit"} type="file" name="gambar" onChange={changeHandler} accept="image/*" style={{...inputStyle, padding: '10px'}} />
          {isEdit && <small style={{color: 'var(--text-secondary)'}}>* Biarkan kosong jika tidak ingin mengubah gambar.</small>}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label style={labelStyle}>Deskripsi / Keunggulan</label>
        <textarea name="deskripsi" value={data.deskripsi} onChange={changeHandler} placeholder="Tulis deskripsi singkat, warna, atau ukuran yang tersedia..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
      </div>
    </>
  );

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Form Tambah Produk */}
      <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Tambah Produk Pengetahuan AI
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Masukkan detail produk Anda di sini. AI akan menggunakan data ini untuk menjawab pertanyaan pelanggan dan memberikan link produk.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          {renderFormFields(form, handleInputChange, false)}
          <button type="submit" disabled={loading} style={{
            padding: '14px 28px', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white',
            border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer', alignSelf: 'flex-start',
            transition: 'all 0.3s', marginTop: '1.5rem',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)'
          }}>
            {loading ? 'Menyimpan...' : '+ Simpan Produk'}
          </button>
        </form>
      </div>

      {/* Tabel Daftar Produk */}
      <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Daftar Produk ({totalItems})
            </h2>
            <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                    type="text" 
                    placeholder="Cari produk dari server..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ ...inputStyle, paddingLeft: '40px' }} 
                />
            </div>
        </div>
        
        {fetching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '80px', borderRadius: '12px', background: 'var(--border-color)', animation: 'pulse 1.5s infinite', opacity: 0.5 }}></div>
            ))}
          </div>
        ) : produk.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
            Belum ada produk yang ditemukan.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={thStyle}>Gambar</th>
                  <th style={thStyle}>Info Produk</th>
                  <th style={thStyle}>Stok</th>
                  <th style={thStyle}>Harga</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status & Aksi</th>
                </tr>
              </thead>
              <tbody>
                {produk.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: p.is_active === 0 ? 0.6 : 1 }}>
                    <td style={{ ...tdStyle, width: '80px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {p.gambar ? (
                                <img src={`http://localhost:3001${p.gambar}`} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <ImageIcon size={24} color="var(--text-secondary)" />
                            )}
                        </div>
                    </td>
                    <td style={tdStyle}>
                        <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{p.nama}</strong>
                        {p.kategori && <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--primary-color)', color: 'white', fontSize: '11px', borderRadius: '12px', marginBottom: '6px' }}>{p.kategori}</span>}
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.deskripsi}</div>
                        {p.link_pembelian && (
                            <a href={p.link_pembelian} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--primary-color)', marginTop: '6px', textDecoration: 'none' }}>
                                <LinkIcon size={12} /> Buka Link Produk
                            </a>
                        )}
                    </td>
                    <td style={tdStyle}>
                        <span style={{
                            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                            background: p.stok === 'Tersedia' ? '#dcfce7' : p.stok === 'Habis' ? '#fee2e2' : '#fef9c3',
                            color: p.stok === 'Tersedia' ? '#166534' : p.stok === 'Habis' ? '#991b1b' : '#854d0e'
                        }}>
                            {p.stok || 'Tersedia'}
                        </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--text-primary)' }}>{p.harga}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                        <div 
                          onClick={() => handleToggle(p.id)}
                          style={{ 
                            width: '42px', height: '24px', borderRadius: '12px', 
                            background: p.is_active !== 0 ? '#10b981' : '#e5e7eb', 
                            position: 'relative', cursor: 'pointer', transition: '0.3s' 
                          }}
                        >
                          <div style={{ 
                            width: '20px', height: '20px', borderRadius: '50%', background: 'white', 
                            position: 'absolute', top: '2px', left: p.is_active !== 0 ? '20px' : '2px', 
                            transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                          }} />
                        </div>
                        <button onClick={() => openEditModal(p)} style={{
                          padding: '6px', backgroundColor: '#e0f2fe', color: '#0ea5e9',
                          border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex'
                        }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(p.id)} style={{
                          padding: '6px 12px', backgroundColor: '#fee2e2', color: '#ef4444',
                          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s'
                        }}>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'var(--bg-secondary)' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Sebelumnya
                </button>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Halaman {currentPage} dari {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage === totalPages ? 'var(--bg-secondary)' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL EDIT PRODUK */}
      {editModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', padding: '2rem', borderRadius: '24px',
            width: '100%', maxWidth: '800px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Edit Produk</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                {renderFormFields(editForm, handleEditInputChange, true)}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setEditModalOpen(false)} style={{
                        padding: '12px 24px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
                    }}>
                        Batal
                    </button>
                    <button type="submit" disabled={editLoading} style={{
                        padding: '12px 24px', background: 'var(--primary-color)', color: 'white', border: 'none',
                        borderRadius: '12px', fontWeight: 'bold', cursor: editLoading ? 'not-allowed' : 'pointer'
                    }}>
                        {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirmId && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#ffffff', padding: '24px', borderRadius: '20px',
            width: '90%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '18px' }}>Hapus Produk?</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Tindakan ini tidak dapat dibatalkan. Produk akan dihapus secara permanen.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={confirmDelete} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer'
              }}>
                Ya, Hapus
              </button>
              <button onClick={() => setDeleteConfirmId(null)} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer'
              }}>
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  marginBottom: '6px'
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

const thStyle = {
  padding: '12px 16px',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '16px',
  fontSize: '14px',
  verticalAlign: 'top'
};

export default ProductSettings;
