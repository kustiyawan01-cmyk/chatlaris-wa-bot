import React, { useState, useEffect } from 'react';
import { Package, Search, Edit2, Plus, DollarSign, Clock, CheckCircle, Trash2, X } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const socket = io();

function Orderku() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form State untuk Edit Status
  const [editForm, setEditForm] = useState({ status_pembayaran: '', status_pengiriman: '' });

  // Form State untuk Tambah Manual
  const [addForm, setAddForm] = useState({
    nama_pelanggan: '',
    no_whatsapp: '',
    items: '',
    total_harga: '',
    status_pembayaran: 'Belum Bayar',
    status_pengiriman: 'Diproses'
  });

  const fetchOrders = async (page = 1, searchQuery = '') => {
    try {
      const res = await fetch(`/api/orders?page=${page}&limit=10&search=${searchQuery}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      toast.error('Gagal mengambil data pesanan.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(currentPage, search);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, search]);

  useEffect(() => {

    // Dengarkan trigger order_baru dari Socket (Auto Order AI)
    socket.on('order_baru', () => {
      toast.success('Ada pesanan baru masuk secara otomatis dari AI!', {
        icon: '🤖',
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
      fetchOrders();
    });

    return () => {
      socket.off('order_baru');
    };
  }, []);

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setEditForm({
      status_pembayaran: order.status_pembayaran || 'Belum Bayar',
      status_pengiriman: order.status_pengiriman || 'Diproses'
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      toast.success('Status pesanan berhasil diperbarui!');
      setEditModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error('Gagal memperbarui status.');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          total_harga: parseInt(addForm.total_harga) || 0
        })
      });
      toast.success('Pesanan manual berhasil dibuat!');
      setAddModalOpen(false);
      setAddForm({
        nama_pelanggan: '', no_whatsapp: '', items: '', total_harga: '',
        status_pembayaran: 'Belum Bayar', status_pengiriman: 'Diproses'
      });
      fetchOrders();
    } catch (err) {
      toast.error('Gagal membuat pesanan manual.');
    }
  };

  const handleDeleteOrder = async (id) => {
    if(!window.confirm('Yakin ingin menghapus riwayat pesanan ini?')) return;
    try {
      await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      toast.success('Pesanan dihapus!');
      fetchOrders();
    } catch (err) {
      toast.error('Gagal menghapus pesanan.');
    }
  };

  // Metrics
  const totalOrders = orders.length;
  const totalPendapatan = orders.filter(o => o.status_pembayaran === 'Lunas').reduce((acc, curr) => acc + (parseInt(curr.total_harga) || 0), 0);
  const totalDiproses = orders.filter(o => o.status_pengiriman === 'Diproses').length;
  const totalSelesai = orders.filter(o => o.status_pengiriman === 'Selesai').length;

  // Since metrics are visible, ideally they'd be server-side, but for now we'll summarize the current view.
  const filteredOrders = orders; // Search is now done server-side

  const getPaymentBadgeColor = (status) => {
    if (status === 'Lunas') return { bg: '#dcfce7', text: '#16a34a' };
    if (status === 'Dibatalkan') return { bg: '#fee2e2', text: '#ef4444' };
    return { bg: '#fef9c3', text: '#ca8a04' }; // Belum Bayar
  };

  const getShippingBadgeColor = (status) => {
    if (status === 'Selesai') return { bg: '#dcfce7', text: '#16a34a' };
    if (status === 'Dikirim') return { bg: '#dbeafe', text: '#2563eb' };
    return { bg: '#f3f4f6', text: '#4b5563' }; // Diproses
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* HEADER METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '16px', color: '#3b82f6' }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Pesanan</p>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '800' }}>{totalOrders}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '16px', color: '#10b981' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Pendapatan</p>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '800' }}>Rp {totalPendapatan.toLocaleString('id-ID')}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '16px', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sedang Diproses</p>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '800' }}>{totalDiproses}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '16px', color: '#8b5cf6' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pesanan Selesai</p>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '800' }}>{totalSelesai}</h3>
          </div>
        </div>
      </div>

      {/* TABLE & ACTIONS */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Daftar Pesanan</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Cari ID, Nama, atau WA dari server..." 
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '10px 16px 10px 40px', borderRadius: '12px', border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', width: '250px'
                }}
              />
            </div>
            
            <button 
              onClick={() => setAddModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px',
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Plus size={18} /> Buat Manual
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Order ID & Waktu</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Pelanggan</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Barang (Items)</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Total (Rp)</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Pembayaran</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Pengiriman</th>
                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Belum ada pesanan masuk.
                  </td>
                </tr>
              ) : filteredOrders.map(order => {
                const payBadge = getPaymentBadgeColor(order.status_pembayaran);
                const shipBadge = getShippingBadgeColor(order.status_pengiriman);
                
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-bg)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{order.order_id}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(order.waktu).toLocaleString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600' }}>{order.nama_pelanggan}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.no_whatsapp}</div>
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.875rem' }}>
                      {order.items}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      {parseInt(order.total_harga).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: payBadge.bg, color: payBadge.text, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {order.status_pembayaran}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: shipBadge.bg, color: shipBadge.text, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {order.status_pengiriman}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => handleEditClick(order)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
      </div>

      {/* MODAL EDIT STATUS */}
      {editModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', padding: '2rem', borderRadius: '24px',
            width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Edit Status Pesanan</h2>
              <button onClick={() => setEditModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0f172a' }}>Status Pembayaran</label>
                <select 
                  value={editForm.status_pembayaran}
                  onChange={(e) => setEditForm({...editForm, status_pembayaran: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', outline: 'none' }}
                >
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="Lunas">Lunas</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0f172a' }}>Status Pengiriman</label>
                <select 
                  value={editForm.status_pengiriman}
                  onChange={(e) => setEditForm({...editForm, status_pengiriman: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', outline: 'none' }}
                >
                  <option value="Diproses">Diproses</option>
                  <option value="Dikirim">Dikirim</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH MANUAL */}
      {addModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', padding: '2rem', borderRadius: '24px',
            width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Buat Pesanan Manual</h2>
              <button onClick={() => setAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0f172a' }}>Nama Pelanggan *</label>
                <input required type="text" value={addForm.nama_pelanggan} onChange={e => setAddForm({...addForm, nama_pelanggan: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', outline: 'none' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0f172a' }}>No WhatsApp</label>
                <input type="text" value={addForm.no_whatsapp} onChange={e => setAddForm({...addForm, no_whatsapp: e.target.value})} placeholder="Contoh: 08123..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0f172a' }}>Detail Barang (Items) *</label>
                <input required type="text" value={addForm.items} onChange={e => setAddForm({...addForm, items: e.target.value})} placeholder="Contoh: Sepatu x1, Tas x2" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0f172a' }}>Total Harga (Rp) *</label>
                <input required type="number" value={addForm.total_harga} onChange={e => setAddForm({...addForm, total_harga: e.target.value})} placeholder="150000" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', outline: 'none' }} />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}>
                Simpan Pesanan
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Orderku;
