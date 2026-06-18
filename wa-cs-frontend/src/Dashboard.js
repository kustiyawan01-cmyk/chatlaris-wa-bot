import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MessageSquare, Package, DollarSign, ShoppingCart, TrendingUp, Sparkles, Server } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

function Dashboard() {
  const [stats, setStats] = useState({
    totalPendapatan: 0,
    totalPesanan: 0,
    totalPesanAI: 0,
    produkAktif: 0,
    statusServer: 'Online'
  });

  const [timeFilter, setTimeFilter] = useState('semua');
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [productData, setProductData] = useState([]);

  const fetchData = async () => {
    try {
      // Ambil Dashboard Stats
      const resStats = await fetch(`http://localhost:3001/api/dashboard-stats?filter=${timeFilter}`);
      const dataStats = await resStats.json();
      
      setOrders(dataStats.recentOrders || []);

      setStats({
        totalPendapatan: dataStats.totalPendapatan,
        totalPesanan: dataStats.totalPesanan,
        totalPesanAI: dataStats.totalPesanAI,
        produkAktif: dataStats.produkAktif,
        statusServer: 'Online'
      });

      // Proses data chart sederhana (berdasarkan 7 hari terakhir)
      // Disini kita buat data dummy yang dinamis atau chart aktivitas
      const mockChartData = [
        { name: 'Sen', penjualan: 450000 },
        { name: 'Sel', penjualan: 520000 },
        { name: 'Rab', penjualan: 380000 },
        { name: 'Kam', penjualan: 650000 },
        { name: 'Jum', penjualan: 850000 },
        { name: 'Sab', penjualan: 1200000 },
        { name: 'Min', penjualan: 1500000 },
      ];
      setChartData(mockChartData);

      const resProduk = await fetch('http://localhost:3001/api/produk');
      const dataProduk = await resProduk.json();
      const productList = Array.isArray(dataProduk) ? dataProduk : dataProduk.data || [];

      // Data produk top 4
      const topProducts = productList.slice(0, 4).map(p => ({
        name: p.nama.substring(0, 10),
        klik: Math.floor(Math.random() * 50) + 10 // Mock clicks
      }));
      setProductData(topProducts.length > 0 ? topProducts : [
        { name: 'Sepatu', klik: 45 }, { name: 'Jaket', klik: 30 }, { name: 'Tas', klik: 25 }, { name: 'Topi', klik: 15 }
      ]);

    } catch (err) {
      console.error('Gagal mengambil data dashboard', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  useEffect(() => {

    socket.on('pesan_baru', () => {
      fetchData(); // Auto update when new message
    });

    socket.on('order_baru', () => {
      fetchData(); // Auto update when new order
    });

    return () => {
      socket.off('pesan_baru');
      socket.off('order_baru');
    };
  }, []);

  const getPaymentBadge = (status) => {
    if (status === 'Lunas') return { bg: '#dcfce7', text: '#16a34a' };
    if (status === 'Dibatalkan') return { bg: '#fee2e2', text: '#ef4444' };
    return { bg: '#fef9c3', text: '#ca8a04' }; // Belum Bayar
  };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Ringkasan Bisnis</h2>
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value)}
          style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', fontWeight: '600' }}
        >
          <option value="semua">Sepanjang Waktu</option>
          <option value="hari_ini">Hari Ini</option>
          <option value="minggu_ini">Minggu Ini</option>
          <option value="bulan_ini">Bulan Ini</option>
        </select>
      </div>

      {/* 1. STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        
        {/* Card: Total Pendapatan */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #34d399, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)', zIndex: 1 }}>
            <DollarSign size={32} />
          </div>
          <div style={{ zIndex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total Pendapatan</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rp {stats.totalPendapatan.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Card: Total Pesanan */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 15px rgba(59, 130, 246, 0.3)', zIndex: 1 }}>
            <ShoppingCart size={28} />
          </div>
          <div style={{ zIndex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pesanan Masuk</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats.totalPesanan}</div>
          </div>
        </div>

        {/* Card: Aktivitas AI */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 15px rgba(139, 92, 246, 0.3)', zIndex: 1 }}>
            <Sparkles size={28} />
          </div>
          <div style={{ zIndex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pesan Dijawab AI</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats.totalPesanAI}</div>
          </div>
        </div>

        {/* Card: Produk Aktif */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 15px rgba(245, 158, 11, 0.3)', zIndex: 1 }}>
            <Package size={28} />
          </div>
          <div style={{ zIndex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Produk Aktif</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stats.produkAktif}
            </div>
          </div>
        </div>

      </div>

      {/* 2. CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Trend Penjualan */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              <TrendingUp size={20} color="#10b981" /> Tren Penjualan (7 Hari)
            </h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis width={80} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rp ${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                />
                <Area type="monotone" dataKey="penjualan" stroke="#10b981" fillOpacity={1} fill="url(#colorPv)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Produk */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
            <Package size={20} color="#3b82f6" /> Top Produk Terpopuler
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-secondary)" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar dataKey="klik" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. RECENT ORDERS (LIVE FEED) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
          <ShoppingCart size={20} color="#8b5cf6" /> Live Feed Pesanan Terbaru
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <th style={{ padding: '12px', fontWeight: '600' }}>Order ID</th>
                <th style={{ padding: '12px', fontWeight: '600' }}>Waktu</th>
                <th style={{ padding: '12px', fontWeight: '600' }}>Pelanggan</th>
                <th style={{ padding: '12px', fontWeight: '600' }}>Total Belanja</th>
                <th style={{ padding: '12px', fontWeight: '600' }}>Status Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada pesanan terbaru.</td>
                </tr>
              ) : orders.map(order => {
                const payBadge = getPaymentBadge(order.status_pembayaran);
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{order.order_id}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(order.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{order.nama_pelanggan}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      Rp {parseInt(order.total_harga).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: payBadge.bg, color: payBadge.text, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {order.status_pembayaran}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
