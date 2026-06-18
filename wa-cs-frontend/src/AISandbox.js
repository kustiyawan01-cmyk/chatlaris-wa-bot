import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Send, User, Bot, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function AISandbox() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Halo! Saya adalah sistem pengujian. Ketikkan pesan di bawah untuk mengetes bagaimana AI akan membalas pelanggan Anda.", sender: 'AI' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'Tester' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesan: userMessage.text })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Server error');
      
      setMessages(prev => [...prev, { id: Date.now() + 1, text: data.balasan, sender: 'AI' }]);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungi AI. Pastikan API Key benar.');
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "❌ Maaf, sistem gagal membalas. Cek pengaturan API Key atau console.", sender: 'AI' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
      
      <div className="glass-card" style={{ width: '100%', padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Smartphone size={28} color="#10b981" /> Simulator Chat AI
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Uji coba pengaturan Prompt dan Persona AI secara langsung tanpa perlu WhatsApp.</p>
      </div>

      {/* MOCKUP HP PREMIUM (iPhone Style) */}
      <div style={{
        width: '100%', maxWidth: '380px', height: '700px', background: '#f6f6f6', borderRadius: '45px',
        border: '12px solid #1a1a1a', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 2px #444',
      }}>
        
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
          width: '120px', height: '30px', background: '#000', borderRadius: '20px', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px'
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#111', border: '1px solid #333' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1a1a1a' }}></div>
        </div>

        {/* Header WA Modern */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', 
          padding: '40px 16px 12px 16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10,
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
            <Bot size={24} color="white" />
          </div>
          <div>
            <div style={{ color: '#111827', fontWeight: 'bold', fontSize: '16px' }}>Chatlaris AI</div>
            <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>Online</div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="custom-scrollbar" style={{ 
          flex: 1, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', 
          backgroundColor: '#efeae2',
          backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', 
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay', opacity: 0.95
        }}>
          {messages.map((msg, index) => {
            const isMe = msg.sender === 'Tester';
            return (
              <div key={msg.id} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                background: isMe ? '#d9fdd3' : '#ffffff',
                color: '#111827',
                padding: '10px 14px',
                borderRadius: '16px',
                borderTopRightRadius: isMe ? '4px' : '16px',
                borderTopLeftRadius: isMe ? '16px' : '4px',
                maxWidth: '85%',
                fontSize: '14.5px',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 1px 0 rgba(0,0,0,0.05)',
                position: 'relative'
              }}>
                {msg.text}
                <div style={{ fontSize: '10px', color: '#667781', textAlign: 'right', marginTop: '4px', marginBottom: '-4px' }}>
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ alignSelf: 'flex-start', background: '#ffffff', padding: '12px', borderRadius: '16px', borderTopLeftRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '20px' }}>
                <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
              </div>
              <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ background: '#f0f2f5', padding: '10px', paddingBottom: '24px' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ 
              flex: 1, background: '#ffffff', borderRadius: '24px', padding: '10px 16px', 
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center'
            }}>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan pengujian..." 
                style={{ 
                  width: '100%', border: 'none', background: 'transparent',
                  color: '#111827', outline: 'none', fontSize: '15px' 
                }} 
              />
            </div>
            <button type="submit" disabled={!input.trim() || loading} style={{
              background: '#10b981', border: 'none', width: '44px', height: '44px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'default', opacity: input.trim() && !loading ? 1 : 0.5,
              transition: 'all 0.2s', flexShrink: 0, boxShadow: '0 2px 5px rgba(16, 185, 129, 0.3)'
            }}>
              <Send size={20} color="white" style={{ marginLeft: '2px', marginTop: '2px' }} />
            </button>
          </form>
          {/* Home indicator (iPhone line) */}
          <div style={{ width: '120px', height: '4px', background: '#ccc', borderRadius: '4px', margin: '14px auto 0 auto' }}></div>
        </div>

      </div>
    </div>
  );
}

export default AISandbox;
