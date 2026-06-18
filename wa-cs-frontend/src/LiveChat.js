import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io();

function LiveChat() {
  const [chats, setChats] = useState([]);
  const [targetWa, setTargetWa] = useState('');
  const [pesanBalasan, setPesanBalasan] = useState('');
  const [isAiActive, setIsAiActive] = useState(true);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    socket.on('load_data_lama', (dataLama) => {
      setChats(dataLama);
    });

    socket.on('pesan_baru', (data) => {
      setChats((prevChats) => [...prevChats, data]);
    });

    return () => {
      socket.off('load_data_lama');
      socket.off('pesan_baru');
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  // Fetch AI status when target changes
  useEffect(() => {
    if (targetWa) {
      fetch(`/api/kontak/${targetWa}`)
        .then(res => res.json())
        .then(data => {
          setIsAiActive(data.is_ai_active === 1);
        })
        .catch(err => console.error('Failed to fetch AI status:', err));
    }
  }, [targetWa]);

  const toggleAiForContact = async () => {
    const newStatus = !isAiActive;
    setIsAiActive(newStatus);
    try {
      await fetch('/api/kontak/toggle-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor_wa: targetWa, is_ai_active: newStatus })
      });
    } catch (err) {
      console.error('Failed to toggle AI status:', err);
      // Revert if failed
      setIsAiActive(!newStatus);
    }
  };

  const kirimPesan = () => {
    if (!targetWa) return alert('Pilih dulu pesan pelanggan yang mau dibalas!');
    if (!pesanBalasan) return alert('Ketikan pesan tidak boleh kosong!');

    socket.emit('balas_pesan', { ke: targetWa, pesan: pesanBalasan });
    setChats((prevChats) => [...prevChats, { dari: 'Agen', pesan: pesanBalasan, ke: targetWa }]);
    setPesanBalasan('');
  };

  return (
    <div className="glass-card" style={{
      width: '100%', maxWidth: '800px',
      borderRadius: '24px', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', height: 'calc(100vh - 120px)', minHeight: '500px',
      margin: '0 auto'
    }}>
      
      {/* Chat Header */}
      <div style={{
        padding: '1.5rem', borderBottom: '1px solid var(--border-color)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.02)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0 0 4px 0' }}>Live Chat Monitor</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {targetWa ? (
              <>
                <span>Sedang melayani: <strong style={{ color: 'var(--primary-color)' }}>{targetWa}</strong></span>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: isAiActive ? '#10b981' : '#64748b' }}>
                    AI: {isAiActive ? 'ON' : 'OFF'}
                  </span>
                  <div 
                    onClick={toggleAiForContact}
                    style={{
                      width: '36px', height: '20px', borderRadius: '20px',
                      background: isAiActive ? '#10b981' : '#cbd5e1',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                    }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '2px',
                      left: isAiActive ? '18px' : '2px',
                      transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              </>
            ) : (
              'Pilih pesan pelanggan untuk mulai membalas.'
            )}
          </div>
        </div>
        {targetWa && (
          <button 
            onClick={() => setTargetWa('')}
            style={{
              fontSize: '12px', padding: '6px 12px', borderRadius: '20px',
              backgroundColor: '#f3f4f6', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: '600'
            }}
          >
            Batal Pilih
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="custom-scrollbar"
        style={{
          flex: 1, padding: '2rem', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '1rem'
        }}
      >
        {chats.length === 0 ? (
          <div style={{
            margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
          }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--input-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              📭
            </div>
            <p style={{ fontSize: '15px' }}>Belum ada pesan masuk.</p>
          </div>
        ) : (
          chats.map((chat, index) => {
            const isAgen = chat.dari === 'Agen';
            const isTarget = chat.dari === targetWa || chat.ke === targetWa;
            
            return (
              <div key={index} className="animate-fade-in" style={{
                display: 'flex', flexDirection: 'column', 
                alignItems: isAgen ? 'flex-end' : 'flex-start',
                opacity: targetWa && !isTarget && !isAgen ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: isAgen ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isAgen ? 'var(--chat-agent-bg)' : 'var(--chat-customer-bg)',
                  color: isAgen ? '#ffffff' : 'var(--text-primary)',
                  boxShadow: 'var(--glass-shadow)',
                  border: isAgen ? 'none' : '1px solid var(--chat-customer-border)',
                  position: 'relative',
                  backdropFilter: 'blur(8px)'
                }}>
                  <div style={{ fontSize: '15px', lineHeight: '1.5' }}>{chat.pesan}</div>
                </div>
                
                <div style={{
                  fontSize: '12px', color: 'var(--text-secondary)', 
                  marginTop: '6px', padding: '0 4px',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span>{isAgen ? 'Anda' : chat.dari}</span>
                  
                  {!isAgen && chat.dari !== targetWa && (
                    <button
                      onClick={() => setTargetWa(chat.dari)}
                        style={{
                        fontSize: '11px', padding: '6px 12px', cursor: 'pointer', 
                        background: 'var(--input-bg)', color: 'var(--text-primary)', 
                        border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.target.style.background = 'var(--primary-color)'; e.target.style.color = 'white'; e.target.style.borderColor = 'var(--primary-color)'; }}
                      onMouseOut={(e) => { e.target.style.background = 'var(--input-bg)'; e.target.style.color = 'var(--text-primary)'; e.target.style.borderColor = 'var(--border-color)'; }}
                    >
                      Balas Ini
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chat Input */}
      <div style={{
        padding: '1.25rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', gap: '12px', alignItems: 'center',
        background: 'rgba(0,0,0,0.02)'
      }}>
        <input
          type="text"
          value={pesanBalasan}
          onChange={(e) => setPesanBalasan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && kirimPesan()}
          placeholder={targetWa ? `Ketik balasan untuk ${targetWa}...` : "Pilih pesan di atas untuk membalas..."}
          disabled={!targetWa}
              style={{ 
            flex: 1, padding: '14px 20px', borderRadius: '30px', 
            border: '1px solid var(--border-color)', outline: 'none',
            fontSize: '15px', background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; e.target.style.boxShadow = '0 0 0 2px rgba(14, 165, 233, 0.2)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          onClick={kirimPesan}
          disabled={!targetWa || !pesanBalasan}
          style={{ 
            padding: '14px 28px', 
            background: targetWa && pesanBalasan ? 'var(--primary-color)' : 'var(--input-bg)', 
            color: targetWa && pesanBalasan ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)', borderRadius: '30px', 
            cursor: targetWa && pesanBalasan ? 'pointer' : 'not-allowed', 
            fontWeight: '600', fontSize: '15px',
            transition: 'all 0.2s',
            boxShadow: targetWa && pesanBalasan ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
          }}
          onMouseOver={(e) => { if(targetWa && pesanBalasan) { e.target.style.background = 'var(--primary-hover)'; e.target.style.borderColor = 'var(--primary-hover)'; } }}
          onMouseOut={(e) => { if(targetWa && pesanBalasan) { e.target.style.background = 'var(--primary-color)'; e.target.style.borderColor = 'var(--border-color)'; } }}
        >
          Kirim
        </button>
      </div>
    </div>
  );
}

export default LiveChat;
