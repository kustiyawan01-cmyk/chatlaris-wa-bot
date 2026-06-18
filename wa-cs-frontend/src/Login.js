import React, { useState, useEffect, useRef } from 'react';
import { Lock, LogIn, Eye, EyeOff, Sparkles, Command, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function Login({ onLoginSuccess }) {
  const [viewState, setViewState] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [resetToken, setResetToken] = useState(null);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot/Reset States
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vanta.js Ref
  const vantaRef = useRef(null);

  useEffect(() => {
    let effect = null;

    // Fungsi untuk inisialisasi Vanta
    const initVanta = () => {
      if (!effect && vantaRef.current && window.VANTA && window.VANTA.NET) {
        try {
          effect = window.VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x0ea5e9, // ChatLaris bright blue
            backgroundColor: 0x09090b,
            points: 12.00,
            maxDistance: 22.00,
            spacing: 16.00
          });
        } catch (err) {
          console.error("Vanta initialization error:", err);
        }
      }
    };

    // Coba inisialisasi, jika belum load, pakai interval
    if (window.VANTA) {
      initVanta();
    } else {
      const checkVanta = setInterval(() => {
        if (window.VANTA && window.VANTA.NET) {
          initVanta();
          clearInterval(checkVanta);
        }
      }, 500);

      // Cleanup interval jika unmount sebelum load
      return () => {
        clearInterval(checkVanta);
        if (effect) effect.destroy();
      };
    }

    return () => {
      if (effect) effect.destroy();
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'success') {
      toast.success('Email berhasil diverifikasi! Silakan Login.', { icon: '✅' });
      window.history.replaceState(null, '', window.location.pathname);
    }
    const token = urlParams.get('reset');
    if (token) {
      setResetToken(token);
      setViewState('reset');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        toast.success('Login berhasil! Menyinkronkan sistem...', { icon: '👋' });
        setTimeout(() => onLoginSuccess(), 1000);
      } else {
        toast.error(data.error || 'Login gagal.');
      }
    } catch (err) {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) return toast.error('Password tidak cocok!');
    setIsLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, nama_lengkap: regName, nomor_wa: regPhone, password: regPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Pendaftaran berhasil! Cek email Anda.', { duration: 5000, icon: '✉️' });
        setRegEmail(''); setRegName(''); setRegPhone(''); setRegPassword(''); setRegConfirmPassword('');
        setTimeout(() => setViewState('login'), 2000);
      } else {
        toast.error(data.error || 'Gagal mendaftar.');
      }
    } catch (err) {
      toast.error('Kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { duration: 5000, icon: '🔑' });
        setViewState('login');
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return toast.error('Password tidak cocok!');
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { icon: '✨' });
        setViewState('login');
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  // UI Components
  const LeftPanel = () => (
    <div className="hide-on-mobile" style={{ width: '50%', background: 'transparent', position: 'relative', display: 'flex', flexDirection: 'column', padding: '4rem', justifyContent: 'space-between', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Overlay gradient text shadow for better readability on image */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)', zIndex: 0 }}></div>

      <div style={{ position: 'relative', zIndex: 10, animation: 'fadeInSlideRight 0.8s ease forwards' }}>
        <div style={{ 
          marginBottom: '4rem', 
          display: 'inline-block', 
          background: 'rgba(255, 255, 255, 0.9)', 
          backdropFilter: 'blur(10px)',
          padding: '0.75rem 1.5rem', 
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 1)'
        }}>
          <img src="/ChatLaris_logo_transparan.png" alt="ChatLaris" style={{ height: '42px', display: 'block' }} />
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1', color: '#ffffff', marginBottom: '1.5rem', letterSpacing: '-0.03em', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          Kelola Chat.<br />
          <span style={{ color: '#0ea5e9', textShadow: '0 0 20px rgba(14, 165, 233, 0.5)' }}>Tingkatkan</span><br />
          Penjualan.
        </h1>
        <p style={{ color: '#e4e4e7', fontSize: '1.1rem', maxWidth: '420px', lineHeight: '1.6', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Platform cerdas untuk sentralisasi WhatsApp bisnis. Bantu tim CS Anda merespons lebih cepat, pantau performa, dan raih lebih banyak konversi.
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 10, alignSelf: 'flex-start', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'floatSlow 6s ease-in-out infinite', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}>
          <Sparkles size={20} />
        </div>
        <div>
          <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '14px' }}>Sistem Tersinkronisasi</div>
          <div style={{ color: '#a1a1aa', fontSize: '12px' }}>Koneksi WhatsApp Real-time</div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={vantaRef} style={{ minHeight: '100vh', display: 'flex', position: 'relative', fontFamily: '"Inter", sans-serif' }}>
      {/* Fallback dark overlay just in case Vanta takes a moment to load */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,9,11,0.6)', backdropFilter: 'blur(2px)', zIndex: -1 }}></div>

      <Toaster position="top-right" toastOptions={{ style: { background: 'rgba(24,24,27,0.9)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      <LeftPanel />

      <div className="full-width-mobile" style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}>

        {/* LOGIN VIEW */}
        {viewState === 'login' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div className="animate-fade-up-1" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', backdropFilter: 'blur(10px)' }}>
                <img src="/ChatLaris_icon_only.png" alt="Logo" style={{ width: '32px' }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em' }}>Selamat Datang</h2>
              <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>Akses dasbor Anda untuk mulai mengelola pesan WhatsApp dan mendorong skala bisnis ke tingkat selanjutnya.</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="saas-input-group animate-fade-up-2">
                <label className="saas-label">Email / Username</label>
                <input type="text" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="name@company.com" className="saas-input" />
              </div>

              <div className="saas-input-group animate-fade-up-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="saas-label" style={{ marginBottom: 0 }}>Password</label>
                  <button type="button" onClick={() => setViewState('forgot')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Lupa sandi?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="saas-input" style={{ paddingRight: '45px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="animate-fade-up-4" style={{ marginTop: '2rem' }}>
                <button type="submit" disabled={isLoading} className="saas-btn-primary">
                  {isLoading ? 'Mengautentikasi...' : <><LogIn size={18} /> Masuk ke Dashboard</>}
                </button>
              </div>
            </form>

            <div className="animate-fade-up-4" style={{ textAlign: 'center', marginTop: '2rem' }}>
              <span style={{ color: '#71717a', fontSize: '14px' }}>Belum punya akun? </span>
              <button onClick={() => setViewState('register')} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Daftar sekarang</button>
            </div>
          </div>
        )}

        {/* REGISTER VIEW */}
        {viewState === 'register' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div className="animate-fade-up-1" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', backdropFilter: 'blur(10px)' }}>
                <img src="/ChatLaris_icon_only.png" alt="Logo" style={{ width: '32px' }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em' }}>Registrasi Klien</h2>
              <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem' }}>Buka akses ke fitur enterprise ChatLaris.</p>
            </div>

            <form onSubmit={handleRegister}>
              <div className="saas-input-group animate-fade-up-2">
                <label className="saas-label">Email Valid</label>
                <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="name@company.com" className="saas-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="animate-fade-up-2">
                <div className="saas-input-group">
                  <label className="saas-label">Nama Lengkap</label>
                  <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="John Doe" className="saas-input" />
                </div>
                <div className="saas-input-group">
                  <label className="saas-label">WhatsApp</label>
                  <input type="text" required value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="081234..." className="saas-input" />
                </div>
              </div>

              <div className="saas-input-group animate-fade-up-3">
                <label className="saas-label">Password</label>
                <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Min. 8 karakter" className="saas-input" />
              </div>

              <div className="saas-input-group animate-fade-up-3">
                <label className="saas-label">Konfirmasi Password</label>
                <input type={showConfirmPassword ? "text" : "password"} required value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} placeholder="Ulangi password" className="saas-input" />
              </div>

              <div className="animate-fade-up-4" style={{ marginTop: '1.5rem' }}>
                <button type="submit" disabled={isLoading} className="saas-btn-primary">
                  {isLoading ? 'Memproses...' : <>Daftar Ruang Kerja <ArrowRight size={18} /></>}
                </button>
              </div>
            </form>

            <div className="animate-fade-up-4" style={{ textAlign: 'center', marginTop: '2rem' }}>
              <span style={{ color: '#71717a', fontSize: '14px' }}>Sudah punya akun? </span>
              <button onClick={() => setViewState('login')} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Masuk ke sini</button>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {viewState === 'forgot' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div className="animate-fade-up-1" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', backdropFilter: 'blur(10px)' }}>
                <img src="/ChatLaris_icon_only.png" alt="Logo" style={{ width: '32px' }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em' }}>Pemulihan Akses</h2>
              <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem' }}>Verifikasi email untuk mereset kunci keamanan.</p>
            </div>

            <form onSubmit={handleForgot}>
              <div className="saas-input-group animate-fade-up-2">
                <label className="saas-label">Alamat Email</label>
                <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="name@company.com" className="saas-input" />
              </div>

              <div className="animate-fade-up-3" style={{ marginTop: '2rem' }}>
                <button type="submit" disabled={isLoading} className="saas-btn-primary">
                  {isLoading ? 'Mengirim...' : 'Kirim Instruksi Reset'}
                </button>
              </div>
            </form>

            <div className="animate-fade-up-4" style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button onClick={() => setViewState('login')} style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                &larr; Kembali ke halaman Masuk
              </button>
            </div>
          </div>
        )}

        {/* RESET PASSWORD VIEW */}
        {viewState === 'reset' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div className="animate-fade-up-1" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', backdropFilter: 'blur(10px)' }}>
                <img src="/ChatLaris_icon_only.png" alt="Logo" style={{ width: '32px' }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em' }}>Kunci Baru</h2>
              <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem' }}>Buat kredensial baru dengan standar keamanan tinggi.</p>
            </div>

            <form onSubmit={handleReset}>
              <div className="saas-input-group animate-fade-up-2">
                <label className="saas-label">Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? "text" : "password"} required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 karakter" className="saas-input" style={{ paddingRight: '45px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="saas-input-group animate-fade-up-3">
                <label className="saas-label">Konfirmasi Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPassword ? "text" : "password"} required value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Ulangi password" className="saas-input" style={{ paddingRight: '45px' }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="animate-fade-up-4" style={{ marginTop: '2rem' }}>
                <button type="submit" disabled={isLoading} className="saas-btn-primary">
                  {isLoading ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default Login;
