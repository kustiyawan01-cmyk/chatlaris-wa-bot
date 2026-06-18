import React, { useState, useEffect, useRef } from 'react';
import { History, User, Bot, Search, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

function ChatHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.reverse()); // Data dari backend ORDER BY id DESC (terbaru di atas), kita balik agar kronologis untuk render
    } catch (err) {
      console.error('Gagal mengambil riwayat:', err);
      toast.error('Gagal memuat riwayat percakapan.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Mengelompokkan chat berdasarkan nomor pelanggan
  const groupedChats = history.reduce((acc, chat) => {
    // Jika tidak ada nomor_pelanggan, kita gunakan 'Unknown'
    const phone = chat.nomor_pelanggan || 'Unknown';
    if (!acc[phone]) acc[phone] = [];
    acc[phone].push(chat);
    return acc;
  }, {});

  // Daftar nomor unik
  const phoneNumbers = Object.keys(groupedChats).filter(num => num.includes(searchQuery.toLowerCase()));

  // Fungsi untuk format nomor HP agar terlihat lebih premium dan rapi
  const formatPhoneNumber = (rawNum) => {
    if (!rawNum) return 'Unknown';
    if (rawNum === 'SandboxUser' || rawNum === 'Unknown') return rawNum;
    
    let cleanNum = rawNum.split('@')[0];
    
    // Khusus untuk nomor Indonesia (62)
    if (cleanNum.startsWith('62') && cleanNum.length >= 10) {
      const part1 = cleanNum.substring(2, 5); // misal: 821
      const part2 = cleanNum.substring(5, 9); // misal: 1391
      const part3 = cleanNum.substring(9);    // misal: 7023
      return `+62 ${part1}-${part2}-${part3}`;
    }
    
    // Jika itu deretan angka tapi bukan 62
    if (/^\d+$/.test(cleanNum)) {
      // Kita tambahkan + di depan agar lebih rapi
      return `+${cleanNum}`;
    }

    return cleanNum;
  };

  // Auto-scroll ke bawah saat chat berganti
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedNumber, history]);

  // Pilih otomatis kontak pertama jika ada dan belum memilih
  useEffect(() => {
    if (phoneNumbers.length > 0 && !selectedNumber) {
      setSelectedNumber(phoneNumbers[0]);
    }
  }, [phoneNumbers, selectedNumber]);

  const activeChats = selectedNumber ? groupedChats[selectedNumber] : [];

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', gap: '24px' }}>
      
      {/* Sidebar Daftar Kontak */}
      <div className="glass-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="#3b82f6" /> Histori Pelanggan
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari nomor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px', 
                border: '1px solid var(--border-color)', background: 'var(--input-bg)', 
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>
        </div>
        
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {loading ? (
             <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat...</div>
          ) : phoneNumbers.length === 0 ? (
             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada histori.</div>
          ) : (
            phoneNumbers.map(num => {
              const lastMsg = groupedChats[num][groupedChats[num].length - 1];
              const isSelected = selectedNumber === num;
              return (
                <div 
                  key={num} 
                  onClick={() => setSelectedNumber(num)}
                  style={{ 
                    padding: '12px', borderRadius: '12px', cursor: 'pointer', marginBottom: '8px',
                    background: isSelected ? 'var(--chat-customer-bg)' : 'transparent',
                    borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <User size={20} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {formatPhoneNumber(num)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '4px' }}>
                      {lastMsg.pesan}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Area Chat Detail */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#efeae2', backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover', backgroundBlendMode: 'overlay', opacity: 0.95 }}>
        
        {/* Header Chat */}
        {selectedNumber && (
          <div style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)', zIndex: 10 }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)' }}>
              <User size={24} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{formatPhoneNumber(selectedNumber)}</div>
              <div style={{ fontSize: '13px', color: '#667781' }}>Riwayat Percakapan Pelanggan</div>
            </div>
          </div>
        )}

        {/* Isi Chat */}
        <div className="custom-scrollbar" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!selectedNumber ? (
            <div style={{ margin: 'auto', textAlign: 'center', background: 'rgba(255,255,255,0.8)', padding: '20px', borderRadius: '20px' }}>
              <Phone size={48} color="#6b7280" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ color: '#374151', fontSize: '16px' }}>Pilih pelanggan di sidebar untuk melihat riwayat obrolan.</p>
            </div>
          ) : activeChats.length === 0 ? (
            <div style={{ margin: 'auto', color: '#374151' }}>Belum ada histori percakapan.</div>
          ) : (
            activeChats.map((chat) => {
              const isAI = chat.dari === 'AI';
              const isAgen = chat.dari === 'Agen';
              const isSystem = isAI || isAgen;

              return (
                <div key={chat.id} style={{
                  alignSelf: isSystem ? 'flex-end' : 'flex-start',
                  background: isSystem ? '#d9fdd3' : '#ffffff',
                  color: '#111827',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  borderTopRightRadius: isSystem ? '4px' : '16px',
                  borderTopLeftRadius: isSystem ? '16px' : '4px',
                  maxWidth: '75%',
                  fontSize: '14.5px',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 1px 0 rgba(0,0,0,0.05)',
                  position: 'relative'
                }}>
                  {/* Penanda Pengirim (Bila itu Agen vs AI) */}
                  {isSystem && (
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: isAgen ? '#8b5cf6' : '#10b981', marginBottom: '4px' }}>
                      {isAgen ? '👨‍💻 Agen CS' : '🤖 Chatlaris AI'}
                    </div>
                  )}
                  
                  {chat.pesan}
                  
                  <div style={{ fontSize: '10px', color: '#667781', textAlign: 'right', marginTop: '4px', marginBottom: '-4px' }}>
                    {formatDate(chat.waktu)}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

    </div>
  );
}

export default ChatHistory;
