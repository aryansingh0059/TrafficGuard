import { useEffect, useState } from 'react';

// Dynamic premium startup chime using Web Audio API
const playSynthesizedChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Tone 1: Warm base frequency (D4 to D5 glide)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(293.66, ctx.currentTime); 
    osc1.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.4); 
    
    gain1.gain.setValueAtTime(0.001, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.85);

    // Tone 2: Bright chime frequency (A4 to A5 glide) starting at 0.1s delay
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440.00, ctx.currentTime + 0.1); 
    osc2.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.5); 
    
    gain2.gain.setValueAtTime(0.001, ctx.currentTime);
    gain2.gain.setValueAtTime(0.001, ctx.currentTime + 0.1);
    gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 1.05);
  } catch (e) {
    // Autoplay policy restriction catch
  }
};

const speakWelcome = () => {
  // Check if browser supports speech
  if (!window.speechSynthesis) {
    console.log('Speech synthesis not supported');
    return null;
  }

  // Stop any existing speech first
  window.speechSynthesis.cancel();
  
  const message = new SpeechSynthesisUtterance();
  
  // Official announcement text
  message.text = 
    "Welcome to the official portal of the " +
    "Government of India. " +
    "Traffic and Accident Management System. " +
    "Developed by the Ministry of Road Transport. " +
    "This system is for authorized personnel only. " +
    "Unauthorized access is strictly prohibited. " +
    "Please proceed to login.";
  
  // Voice configurations
  message.lang   = 'en-IN';  // Indian English accent
  message.rate   = 0.85;     // Slightly slower = formal tone
  message.pitch  = 0.95;     // Authoritative pitch
  message.volume = 1.0;
  
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Fallback queue for best sounding voices
    const preferred = [
      'Google UK English Female',
      'Google UK English Male', 
      'Google US English',
      'Microsoft Zira',
      'Microsoft David',
      'en-IN',
      'en-GB',
      'en-US',
    ];
    
    let selectedVoice = null;
    for (const name of preferred) {
      const found = voices.find(v => 
        v.name.includes(name) || v.lang === name
      );
      if (found) {
        selectedVoice = found;
        break;
      }
    }
    
    if (selectedVoice) {
      message.voice = selectedVoice;
    }
    
    window.speechSynthesis.speak(message);
  };
  
  if (window.speechSynthesis.getVoices().length > 0) {
    loadVoices();
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  
  message.onstart = () => console.log('Welcome announcement started');
  message.onend = () => console.log('Welcome announcement finished');
  message.onerror = (e) => console.log('Speech error:', e.error);
  
  return message;
};

export default function SplashScreen({ onComplete }) {
  const [started, setStarted]       = useState(false);
  const [muted, setMuted]           = useState(false);
  const [phase, setPhase]           = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [fadeOut, setFadeOut]       = useState(false);
  const [typingStarted, setTypingStarted] = useState(false);
  
  const TITLE = 'TRAFFIC & ACCIDENT MANAGEMENT SYSTEM';
  
  // Run main splash sequence phase animations (completes exactly in 3.5s total)
  useEffect(() => {
    if (!started) return;

    // Play startup audio chime if not muted
    if (!muted) {
      const audio = new Audio('/sounds/startup.mp3');
      audio.volume = 0.3;
      audio.play()
        .catch(() => {
          // Play Web Audio synth chime as fallback
          playSynthesizedChime();
        });
      
      // Trigger voice announcement
      speakWelcome();
    }

    // Phase timings
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => setPhase(3), 2400);
    const t4 = setTimeout(() => setPhase(4), 3000);
    const t5 = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 400);
    }, 3500);
    
    return () => {
      // Do NOT cancel speech synthesis on unmount so the voice continues playing on the login page
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
    };
  }, [started, onComplete]);

  // Trigger typewriter start exactly once when phase reaches 2
  useEffect(() => {
    if (phase >= 2 && !typingStarted) {
      setTypingStarted(true);
    }
  }, [phase, typingStarted]);

  // Typewriter effect starting at Phase 2
  useEffect(() => {
    if (!typingStarted) return;
    let i = 0;
    const interval = setInterval(() => {
      setTypedTitle(TITLE.slice(0, i + 1));
      i++;
      if (i >= TITLE.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [typingStarted]);

  const toggleMute = () => {
    if (muted) {
      setMuted(false);
      speakWelcome();
    } else {
      setMuted(true);
      window.speechSynthesis?.cancel();
    }
  };

  // ── PRE-SPLASH GATING SCREEN ──
  if (!started) {
    return (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0a1628',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={() => setStarted(true)}
      >
        {/* Tricolor top stripe */}
        <div style={{
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '4px', 
          display: 'flex',
        }}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: 'white' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>
        
        {/* Pulsing Emblem Gate */}
        <div style={{
          width: '100px', 
          height: '100px',
          borderRadius: '50%',
          border: '2px solid #d4a017',
          background: '#1a3a5c',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2.5rem',
          boxShadow: '0 8px 32px rgba(10, 22, 40, 0.6), 0 0 16px rgba(212, 160, 23, 0.2)',
          animation: 'gatePulse 2s ease-in-out infinite',
        }}>
          <div style={{ fontSize: '36px', color: '#d4a017', lineHeight: '1.2' }}>⛨</div>
          <div style={{
            color: 'white', 
            fontSize: '9px',
            fontWeight: 'bold', 
            letterSpacing: '3px',
            marginTop: '2px',
            paddingLeft: '3px',
          }}>TAMS</div>
        </div>
        
        {/* Metadata Details */}
        <p style={{
          color: 'white',
          fontSize: '16px',
          letterSpacing: '3px',
          marginBottom: '8px',
          fontWeight: '500',
          textAlign: 'center',
        }}>
          GOVERNMENT OF INDIA
        </p>
        <p style={{
          color: '#d4a017',
          fontSize: '13px',
          letterSpacing: '2px',
          marginBottom: '3rem',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          TRAFFIC & ACCIDENT MANAGEMENT SYSTEM
        </p>
        
        {/* Action Button */}
        <div style={{
          border: '2px solid #d4a017',
          borderRadius: '30px',
          padding: '12px 36px',
          color: '#d4a017',
          fontSize: '13px',
          letterSpacing: '3px',
          fontWeight: 'bold',
          background: 'rgba(212, 160, 23, 0.05)',
          boxShadow: '0 4px 15px rgba(212, 160, 23, 0.1)',
          animation: 'buttonPulse 1.5s ease-in-out infinite',
          transition: 'all 0.3s',
        }}>
          ▶ &nbsp; CLICK TO ENTER
        </div>
        
        <p style={{
          position: 'absolute',
          bottom: '30px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '11px',
          letterSpacing: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>🔊</span> Audio announcement will play on entry
        </p>

        <style>{`
          @keyframes gatePulse {
            0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(10, 22, 40, 0.6), 0 0 16px rgba(212, 160, 23, 0.2); }
            50%       { transform: scale(1.03); box-shadow: 0 8px 32px rgba(10, 22, 40, 0.6), 0 0 24px rgba(212, 160, 23, 0.35); }
          }
          @keyframes buttonPulse {
            0%, 100% { transform: scale(1); opacity: 0.95; background: rgba(212, 160, 23, 0.05); }
            50%       { transform: scale(1.05); opacity: 1; background: rgba(212, 160, 23, 0.15); box-shadow: 0 6px 20px rgba(212, 160, 23, 0.2); }
          }
        `}</style>
      </div>
    );
  }

  // ── MAIN SPLASH ANIMATION SCREEN ──
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.4s ease',
      overflow: 'hidden',
    }}>
      
      {/* Background Gradient Fade-in Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.8s ease',
        zIndex: 0,
      }} />

      {/* Tricolor top stripe */}
      <div style={{
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0,
        height: '4px', 
        display: 'flex',
        zIndex: 10,
      }}>
        <div style={{ flex: 1, background: '#FF9933', boxShadow: '0 2px 8px rgba(255, 153, 51, 0.4)' }} />
        <div style={{ flex: 1, background: '#ffffff', boxShadow: '0 2px 8px rgba(255, 255, 255, 0.4)' }} />
        <div style={{ flex: 1, background: '#138808', boxShadow: '0 2px 8px rgba(19, 136, 8, 0.4)' }} />
      </div>

      {/* Mute/Unmute Toggle Button */}
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        title={muted ? 'Unmute voice' : 'Mute voice'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      
      {/* Background pulse circles (3 concentric depth orbs) */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(26,58,92,0.25)',
        top: '-150px',
        left: '-150px',
        filter: 'blur(50px)',
        animation: 'pulseBg 4s ease-in-out infinite',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'rgba(26,58,92,0.25)',
        bottom: '-250px',
        right: '-250px',
        filter: 'blur(70px)',
        animation: 'pulseBg 6s ease-in-out infinite',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: 'rgba(26,58,92,0.15)',
        top: '15%',
        right: '-300px',
        filter: 'blur(80px)',
        animation: 'pulseBg 8s ease-in-out infinite',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Security Watermark Texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 12px)',
        opacity: 0.6,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      
      {/* Content wrapper */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}>
        {/* EMBLEM — shown from phase 1 */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.3)',
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          marginBottom: '2.5rem',
          position: 'relative',
        }}>
          {/* Spinning outer ring */}
          <div style={{
            width: '136px', height: '136px',
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTop: '3px solid #d4a017',
            borderRight: '3px solid #d4a017',
            position: 'absolute', 
            inset: '-8px',
            animation: 'spin 2s linear infinite',
          }} />
          
          {/* Main emblem circle */}
          <div style={{
            width: '120px', height: '120px',
            borderRadius: '50%',
            background: '#1a3a5c',
            border: '2px solid #d4a017',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(10, 22, 40, 0.5), inset 0 0 20px rgba(212, 160, 23, 0.1)',
          }}>
            {/* Unicode Shield Symbol */}
            <div style={{ fontSize: '48px', color: '#d4a017', lineHeight: '1.2' }}>⛨</div>
            <div style={{
              color: 'white', 
              fontSize: '10px',
              fontWeight: 'bold', 
              letterSpacing: '4px',
              marginTop: '4px',
              paddingLeft: '4px',
            }}>TAMS</div>
          </div>
        </div>
        
        {/* TITLE — typewriter from phase 2 */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.3s ease',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '3px',
            fontFamily: "'Courier New', Courier, monospace",
            minHeight: '84px',
            lineHeight: '1.4',
          }}>
            {typedTitle.length <= 18 ? (
              <span style={{ color: 'white' }}>
                {typedTitle}
                {typedTitle.length < TITLE.length && (
                  <span style={{ animation: 'blink 0.7s infinite', color: '#d4a017' }}>|</span>
                )}
              </span>
            ) : (
              <>
                <span style={{ color: 'white' }}>TRAFFIC & ACCIDENT</span>
                <br />
                <span style={{ color: '#d4a017' }}>
                  {typedTitle.slice(19)}
                  {typedTitle.length < TITLE.length && (
                    <span style={{ animation: 'blink 0.7s infinite', color: '#d4a017' }}>|</span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* SUBTITLE — from phase 3 */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '13px',
            letterSpacing: '2px',
            marginBottom: '1.2rem',
            fontWeight: '500',
          }}>
            Ministry of Road Transport — Government of India
          </p>
          
          {/* Gold expanding line */}
          <div style={{
            height: '1px',
            background: '#d4a017',
            width: phase >= 3 ? '200px' : '0px',
            transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
            marginBottom: '1.2rem',
            boxShadow: '0 0 8px rgba(212, 160, 23, 0.5)',
          }} />
          
          {/* Warning text */}
          <p style={{
            color: '#ff4444',
            fontSize: '11px',
            letterSpacing: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
            fontWeight: 'bold',
          }}>
            AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
      </div>
      
      {/* LOADING BAR — phase 4 */}
      <div style={{
        position: 'absolute',
        bottom: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '320px',
        opacity: phase >= 4 ? 1 : 0,
        transition: 'opacity 0.3s ease',
        textAlign: 'center',
        zIndex: 2,
      }}>
        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '11px',
          marginBottom: '10px',
          letterSpacing: '1px',
        }}>
          Initializing secure portal...
        </p>
        <div style={{
          height: '3px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #d4a017, #f3e5ab)',
            width: phase >= 4 ? '100%' : '0%',
            transition: 'width 0.5s linear',
            borderRadius: '2px',
            boxShadow: '0 0 8px rgba(212, 160, 23, 0.8)',
          }} />
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes pulseBg {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
