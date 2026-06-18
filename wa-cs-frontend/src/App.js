import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, Package, Warehouse, Truck, Users, CircleDollarSign, UserPlus, Settings, Sparkles, AlertTriangle, Smartphone, Sun, Moon, Bell, ChevronLeft, ChevronRight, MessageSquare, Rocket, History as HistoryIcon } from 'lucide-react';
import { io } from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import LiveChat from './LiveChat';
import ProductSettings from './ProductSettings';
import AppSettings from './Settings';
import Dashboard from './Dashboard';
import ChatHistory from './ChatHistory';
import AISandbox from './AISandbox';
import Orderku from './Orderku';
import Login from './Login';
import { LogOut, X } from 'lucide-react';

const socket = io('http://localhost:3001');

function App() {
  const [activeMenu, setActiveMenu] = useState('Fitur Pendukung');
  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 768);
  const [isMuted, setIsMuted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('template');
  const [userProfile, setUserProfile] = useState(null);
  
  // Fetch user profile on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetch('http://localhost:3001/api/me')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setUserProfile(data);
        })
        .catch(err => console.error('Failed to fetch profile', err));
    }
  }, [isAuthenticated]);

  // WhatsApp State
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [waStatus, setWaStatus] = useState('disconnected'); // disconnected, waiting_scan, connected
  const [waInfo, setWaInfo] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Fetch initial status
    fetch('http://localhost:3001/api/wa-status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'CONNECTED') {
          setWaStatus('connected');
          setWaInfo(data.info);
        } else if (data.status === 'QR_READY') {
          setWaStatus('waiting_scan');
          setQrCodeUrl(data.qr);
        } else {
          setWaStatus('disconnected');
        }
      })
      .catch(console.error);

    socket.on('wa-qr', (url) => {
      setQrCodeUrl(url);
      setWaStatus('waiting_scan');
    });

    socket.on('wa-ready', (info) => {
      setWaStatus('connected');
      setQrCodeUrl(null);
      if (info && typeof info === 'object') {
        setWaInfo(info);
      }
    });

    socket.on('wa-disconnected', () => {
      setWaStatus('disconnected');
      setQrCodeUrl(null);
      setWaInfo(null);
    });

    // Audio Notification handler
    const handleNewMessage = (data) => {
      if (data.dari !== 'AI' && data.dari !== 'Agen') {
        if (!isMuted) playNotificationSound();
      }
    };
    socket.on('pesan_baru', handleNewMessage);
    socket.on('order_baru', () => { if (!isMuted) playNotificationSound() });

    return () => {
      socket.off('wa-qr');
      socket.off('wa-ready');
      socket.off('wa-disconnected');
      socket.off('pesan_baru', handleNewMessage);
      socket.off('order_baru');
    };
  }, [isMuted]);

  // Audio synthesis for notification ding
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Slide up to A6

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch(err) {
      console.error('Audio play failed:', err);
    }
  };

  // Toggle Dark Mode
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  // Handle Mobile Responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: <img src="/dashboard.png" alt="Dashboard" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Orderku', icon: <img src="/order.png" alt="Orderku" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Produk', icon: <img src="/prodak.png" alt="Produk" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Gudang', icon: <img src="/gudang.png" alt="Gudang" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Pick Up', icon: <img src="/pickup.png" alt="Pick Up" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Pelanggan', icon: <img src="/pelanggan.png" alt="Pelanggan" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Keuangan', icon: <img src="/keuangan.png" alt="Keuangan" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Team', icon: <img src="/team.png" alt="Team" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Pengaturan', icon: <img src="/pengaturan.png" alt="Pengaturan" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Fitur Pendukung', icon: <img src="/fiturpendukung.png" alt="Fitur Pendukung" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Riwayat', icon: <HistoryIcon size={24} /> },
    { name: 'Tester AI', icon: <Sparkles size={24} /> },
    { name: 'Kendala', icon: <img src="/feedback_914257.png" alt="Kendala" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: isDark ? 'invert(1) brightness(2)' : 'none', mixBlendMode: isDark ? 'normal' : 'multiply' }} /> },
    { name: 'Aplikasiku', icon: <img src="/ChatLaris_icon_only.png" alt="Aplikasiku" style={{ width: '24px', height: '24px', objectFit: 'contain' }} /> },
  ];

  const renderContent = () => {
    if (activeMenu === 'Fitur Pendukung') {
      return (
        <div className="glass-card" style={{ borderRadius: '24px', maxWidth: '500px', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Integrasi WhatsApp</h2>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #a7f3d0, #34d399)', height: '180px', borderRadius: '16px 16px 0 0',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative',
              overflow: 'hidden', boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.05)'
            }}>
               {/* Mock Illustration */}
               <img src="/whatsapp.png" alt="WhatsApp" style={{ width: '80px', height: '80px', zIndex: 2, marginBottom: '20px', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }} />
               <div style={{ position: 'absolute', bottom: '0', width: '100%', height: '50px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', zIndex: 1 }}></div>
               
               {/* Floating WA Bubble */}
               <div style={{ position: 'absolute', top: '20px', left: '40px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '15px', borderRadius: '50%', fontSize: '32px', boxShadow: '0 8px 20px rgba(22, 163, 74, 0.4)', zIndex: 3 }}>
                 💬
                 <div style={{ position: 'absolute', top: '0', right: '0', backgroundColor: '#ef4444', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white' }}></div>
               </div>
            </div>

            <div className="glass-panel" style={{ borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#f97316', fontSize: '20px', fontWeight: '800' }}>Whatsapp</h3>
                
                {/* Custom Toggle Switch */}
                <div style={{ width: '50px', height: '28px', background: 'linear-gradient(90deg, #f97316, #ea580c)', borderRadius: '14px', position: 'relative', cursor: 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}></div>
                </div>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '2rem' }}>
                Integrasikan nomor WhatsApp bisnis kamu untuk mengaktifkan fitur Balasan AI Otomatis dan Live Chat.
              </p>
              
              {waStatus === 'disconnected' && (
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--input-bg)', borderRadius: '12px' }}>
                  <p style={{ margin: 0, fontWeight: '600' }}>Sedang menyambungkan ke server...</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>Pastikan terminal backend sudah berjalan.</p>
                </div>
              )}

              {waStatus === 'waiting_scan' && qrCodeUrl && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '1rem' }}>Scan QR Code ini menggunakan WhatsApp tertaut di HP Anda</p>
                  <div style={{ background: 'white', padding: '10px', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    <img src={qrCodeUrl} alt="WhatsApp QR Code" style={{ width: '200px', height: '200px' }} />
                  </div>
                </div>
              )}

              {waStatus === 'connected' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 1rem auto', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>
                    ✓
                  </div>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>WhatsApp Terhubung!</h3>
                  
                  {waInfo && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.2rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <span style={{ fontWeight: '800', color: '#059669', fontSize: '16px' }}>+{waInfo.number.split('@')[0]}</span>
                      {waInfo.pushname && <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{waInfo.pushname}</span>}
                    </div>
                  )}

                  <button 
                    onClick={() => setActiveMenu('Live Chat')}
                    style={{
                      width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                      border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', transition: 'all 0.3s', marginBottom: '12px'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Buka Live Chat
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm('Yakin ingin mengeluarkan nomor ini? Anda harus melakukan scan QR Code ulang setelahnya.')){
                        setWaStatus('disconnected');
                        socket.emit('wa-logout');
                      }
                    }}
                    style={{
                      background: 'transparent', border: '1px solid #ef4444', color: '#ef4444',
                      padding: '10px', width: '100%', borderRadius: '10px', cursor: 'pointer', fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.target.style.background = '#fef2f2'; }}
                    onMouseOut={(e) => { e.target.style.background = 'transparent'; }}
                  >
                    Ganti Nomor / Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else if (activeMenu === 'Live Chat') {
      return <LiveChat />;
    } else if (activeMenu === 'Produk') {
      return <ProductSettings />;
    } else if (activeMenu === 'Pengaturan') {
      return <AppSettings initialTab={settingsTab} />;
    } else if (activeMenu === 'Dashboard') {
      return <Dashboard />;
    } else if (activeMenu === 'Riwayat') {
      return <ChatHistory />;
    } else if (activeMenu === 'Tester AI') {
      return <AISandbox />;
    } else if (activeMenu === 'Orderku') {
      return <Orderku />;
    } else {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div className="glass-card" style={{ 
            padding: '4rem', textAlign: 'center', borderRadius: '30px', 
            maxWidth: '600px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              width: '120px', height: '120px', margin: '0 auto 2rem auto', 
              background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(199, 210, 254, 0.5)', color: '#4f46e5'
            }}>
              <Rocket size={64} style={{ filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.1))' }} />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Halaman {activeMenu}
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              Fitur premium ini sedang dalam tahap perakitan oleh tim teknis kami.
            </p>
          </div>
        </div>
      );
    }
  };

  const handleLogout = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ 
      display: 'flex', minHeight: '100vh', padding: '1.5rem', gap: '1.5rem',
      boxSizing: 'border-box', overflow: 'hidden', height: '100vh'
    }}>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--card-bg)', color: 'var(--text-primary)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }
      }} />
      
      {/* Sidebar - Floating iPadOS Style */}
      <aside className="glass-panel" style={{
        width: isSidebarCollapsed ? '80px' : '260px', 
        borderRadius: '30px',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Logo Area */}
        <div style={{ 
          padding: isSidebarCollapsed ? '2rem 0' : '2rem', 
          display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', 
          borderBottom: '1px solid var(--border-color)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isSidebarCollapsed ? (
              <img src="/ChatLaris_icon_only.png" alt="ChatLaris" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
            ) : (
              <img src="/ChatLaris_logo_transparan.png" alt="ChatLaris" style={{ height: '55px', objectFit: 'contain', marginLeft: '-5px' }} />
            )}
          </div>
          {!isSidebarCollapsed && (
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1.5rem 0', overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
          {isSidebarCollapsed && (
             <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '1rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setIsSidebarCollapsed(false)}>
               <ChevronRight size={20} />
             </div>
          )}
          {menuItems.map(item => {
            const isActive = activeMenu === item.name || (activeMenu === 'Live Chat' && item.name === 'Fitur Pendukung');
            
            return (
              <div 
                key={item.name} 
                onClick={() => setActiveMenu(item.name)}
                style={{
                  padding: isSidebarCollapsed ? '14px 0' : '14px 1.5rem', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  gap: '15px',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  fontWeight: isActive ? '700' : '500',
                  transition: 'all 0.2s ease',
                  margin: isActive ? '0.2rem 1rem' : '0.2rem 1rem',
                  borderRadius: '16px',
                  boxShadow: 'none'
                }}
                onMouseOver={(e) => {
                  if(!isActive) e.currentTarget.style.background = 'var(--hover-bg)';
                }}
                onMouseOut={(e) => {
                  if(!isActive) e.currentTarget.style.background = 'transparent';
                }}
                title={isSidebarCollapsed ? item.name : ''}
              >
                <span style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                {!isSidebarCollapsed && (
                  <>
                    <span style={{ fontSize: '15px' }}>{item.name}</span>
                    {/* Arrow Icon for sub-menus */}
                    {['Orderku', 'Produk', 'Gudang', 'Pick Up', 'Pelanggan', 'Keuangan', 'Team', 'Pengaturan', 'Kendala'].includes(item.name) && (
                      <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: isActive ? 0.8 : 0.4 }}>▶</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Header - Floating iPadOS Style */}
        <header className="glass-panel" style={{
          height: '70px', borderRadius: '35px', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem',
          marginBottom: '1.5rem', flexShrink: 0
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {activeMenu}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
                transition: 'all 0.3s'
              }}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell & Sound Toggle */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div 
                onClick={() => setIsMuted(!isMuted)}
                style={{ 
                  background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                  width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMuted ? 'var(--text-secondary)' : 'var(--primary-color)',
                }}
                title={isMuted ? "Bunyikan Notifikasi" : "Senyapkan Notifikasi"}
              >
                {isMuted ? <span style={{ fontSize: '18px' }}>🔕</span> : <span style={{ fontSize: '18px' }}>🔔</span>}
              </div>
            </div>
            {/* WA Status Indicator */}
            <div 
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: waStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '6px 12px', borderRadius: '20px',
                border: `1px solid ${waStatus === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: waStatus === 'connected' ? '#10b981' : '#ef4444', boxShadow: `0 0 8px ${waStatus === 'connected' ? '#10b981' : '#ef4444'}` }}></div>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: waStatus === 'connected' ? '#10b981' : '#ef4444' }}>
                {waStatus === 'connected' ? 'WA Terhubung' : (waStatus === 'waiting_scan' ? 'Scan QR' : 'Terputus')}
              </span>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>

            <div style={{ 
              background: 'var(--input-bg)', border: '1px solid var(--border-color)',
              width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
              position: 'relative'
            }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>

            <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
              {userProfile && userProfile.nama_lengkap ? userProfile.nama_lengkap.split(' ')[0] : 'Admin'}
            </span>
            
            {/* User Avatar */}
            <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }} onClick={() => { setActiveMenu('Pengaturan'); setSettingsTab('akun'); }}>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '20px', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                }}>
                  {userProfile && userProfile.nama_lengkap ? userProfile.nama_lengkap.charAt(0).toUpperCase() : 'A'}
                </div>
                <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', backgroundColor: '#10b981', border: '2px solid white', borderRadius: '50%' }}></div>
              </div>

              <button 
                onClick={handleLogout}
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
            
          </div>
        </header>

        {/* Dynamic Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
          <div key={activeMenu} className="page-transition" style={{ height: '100%' }}>
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Custom Logout Modal */}
      {logoutModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', padding: '2rem', borderRadius: '24px',
            width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            textAlign: 'center', border: '1px solid #e2e8f0'
          }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <LogOut size={32} />
            </div>
            <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Konfirmasi Keluar</h2>
            <p style={{ color: '#475569', marginBottom: '2rem' }}>Apakah Anda yakin ingin keluar dari Dashboard SaaS? Anda perlu memasukkan kredensial lagi untuk masuk.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setLogoutModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
              <button onClick={() => { setLogoutModalOpen(false); confirmLogout(); }} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>Keluar Sistem</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;