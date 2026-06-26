'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

// ── Canvas layout ──────────────────────────────────────────
const CW = 720, CH = 420;
const ROAD_Y = 270;          // top of road strip
const ROAD_H = 150;          // road height → bottom = 420
const LANE_Y = ROAD_Y + ROAD_H * 0.55; // center of driving lane
const CAR_SCREEN_X = 110;    // car's fixed horizontal position on screen
const CAR_W = 92, CAR_H = 36;
const WHEEL_R = 13;
const WHEEL_Y = LANE_Y + CAR_H / 2 + WHEEL_R - 4;

// Traffic light world position
const TL_WORLD_X = 820;
const STOP_WORLD_X = TL_WORLD_X - 55;      // stop line in front of TL
// Car front world X = worldOffset + CAR_SCREEN_X + CAR_W
// Fail when: worldOffset + CAR_SCREEN_X + CAR_W >= STOP_WORLD_X && light===red/yellow
const FAIL_OFFSET = STOP_WORLD_X - CAR_SCREEN_X - CAR_W; // ~563
const PASS_OFFSET = TL_WORLD_X - CAR_SCREEN_X + 40;      // ~750

// ── Car definitions ────────────────────────────────────────
const CARS = [
  {
    id: 'damas', name: 'Damas', desc: 'Yengil mikroavtobus',
    img: 'https://upload.wikimedia.org/wikipedia/commons/6/65/New_damas_2010y_side.jpg',
    body: '#E2E8F0', roof: '#94A3B8', win: 'rgba(186,230,253,0.75)',
    maxSpd: 2.8, acc: 0.045, brk: 0.09,
    topSpeed: '90 km/h',
  },
  {
    id: 'gentra', name: 'Gentra', desc: "O'rta klass sedan",
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Daewoo_gentra_2013_%282%29.JPG/640px-Daewoo_gentra_2013_%282%29.JPG',
    body: '#2563EB', roof: '#1E40AF', win: 'rgba(186,230,253,0.75)',
    maxSpd: 4.2, acc: 0.075, brk: 0.12,
    topSpeed: '150 km/h',
  },
  {
    id: 'nexia', name: 'Nexia', desc: 'Klassik sedan',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Daewoo_Nexia_en_Tjumeno_01.jpg/640px-Daewoo_Nexia_en_Tjumeno_01.jpg',
    body: '#DC2626', roof: '#991B1B', win: 'rgba(186,230,253,0.75)',
    maxSpd: 3.6, acc: 0.060, brk: 0.10,
    topSpeed: '120 km/h',
  },
];

// ── Draw helpers ───────────────────────────────────────────
function drawRoad(ctx, wo) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, ROAD_Y);
  sky.addColorStop(0, '#93C5FD');
  sky.addColorStop(1, '#DBEAFE');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, ROAD_Y);

  // Far grass strip
  ctx.fillStyle = '#86EFAC';
  ctx.fillRect(0, ROAD_Y - 28, CW, 28);
  // Near grass
  ctx.fillStyle = '#4ADE80';
  ctx.fillRect(0, ROAD_Y + ROAD_H - 8, CW, 8);

  // Road body
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, ROAD_Y, CW, ROAD_H);

  // Road edge lines
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, ROAD_Y); ctx.lineTo(CW, ROAD_Y); ctx.stroke();

  // Center dashes
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 3;
  ctx.setLineDash([40, 30]);
  ctx.lineDashOffset = -(wo % 70);
  ctx.beginPath();
  ctx.moveTo(0, ROAD_Y + ROAD_H * 0.5);
  ctx.lineTo(CW, ROAD_Y + ROAD_H * 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // Trees (world-space repeating)
  for (let wx = 50; wx < wo + CW + 120; wx += 160) {
    const sx = wx - wo;
    if (sx < -60 || sx > CW + 60) continue;
    drawTree(ctx, sx, ROAD_Y - 28);
    drawTree(ctx, sx, ROAD_Y + ROAD_H - 4);
  }
}

function drawTree(ctx, x, baseY) {
  ctx.fillStyle = '#78350F';
  ctx.fillRect(x - 4, baseY - 32, 8, 32);
  ctx.fillStyle = '#15803D';
  ctx.beginPath(); ctx.arc(x, baseY - 42, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#16A34A';
  ctx.beginPath(); ctx.arc(x - 4, baseY - 50, 15, 0, Math.PI * 2); ctx.fill();
}

function drawCar(ctx, car, x, y, angle = 0) {
  ctx.save();
  ctx.translate(x + CAR_W / 2, y + CAR_H / 2);
  ctx.rotate(angle);
  const hw = CAR_W / 2, hh = CAR_H / 2;

  // Body
  ctx.fillStyle = car.body;
  if (car.id === 'damas') {
    // Boxy van
    ctx.beginPath();
    ctx.moveTo(-hw, hh);
    ctx.lineTo(-hw, -hh + 4);
    ctx.quadraticCurveTo(-hw, -hh, -hw + 6, -hh);
    ctx.lineTo(hw - 4, -hh);
    ctx.quadraticCurveTo(hw, -hh, hw, -hh + 4);
    ctx.lineTo(hw, hh);
    ctx.closePath();
    ctx.fill();
    // Windshield (slightly slanted)
    ctx.fillStyle = car.win;
    ctx.fillRect(-hw + 4, -hh + 2, 18, hh * 2 - 4);
    // Side windows
    ctx.fillRect(-hw + 26, -hh + 3, 16, hh * 2 - 6);
    ctx.fillRect(-hw + 46, -hh + 3, 16, hh * 2 - 6);
  } else {
    // Sedan body
    ctx.beginPath();
    ctx.moveTo(-hw + 5, hh);
    ctx.lineTo(-hw, hh - 6);
    ctx.quadraticCurveTo(-hw, -hh + 12, -hw + 16, -hh + 2);
    ctx.lineTo(hw - 14, -hh + 2);
    ctx.quadraticCurveTo(hw, -hh + 12, hw, hh - 5);
    ctx.lineTo(hw - 4, hh);
    ctx.closePath();
    ctx.fill();
    // Roof
    ctx.fillStyle = car.roof;
    ctx.beginPath();
    ctx.moveTo(-hw + 20, -hh + 3);
    ctx.lineTo(-hw + 14, hh - 6);
    ctx.lineTo(hw - 16, hh - 6);
    ctx.lineTo(hw - 20, -hh + 3);
    ctx.closePath();
    ctx.fill();
    // Windows
    ctx.fillStyle = car.win;
    ctx.fillRect(-hw + 16, -hh + 4, 20, hh * 2 - 10);
    ctx.fillRect(-hw + 40, -hh + 4, 18, hh * 2 - 10);
  }

  // Headlight
  ctx.fillStyle = '#FEF9C3';
  ctx.fillRect(hw - 3, -8, 4, 8);
  // Taillight
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(-hw - 1, -8, 4, 8);

  ctx.restore();

  // Wheels
  const wx1 = x + 16, wx2 = x + CAR_W - 16;
  const wy = y + CAR_H + WHEEL_R - 2;
  [[wx1, wy], [wx2, wy]].forEach(([wx, wy]) => {
    ctx.fillStyle = '#0F172A';
    ctx.beginPath(); ctx.arc(wx, wy, WHEEL_R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.arc(wx, wy, WHEEL_R * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath(); ctx.arc(wx, wy, WHEEL_R * 0.22, 0, Math.PI * 2); ctx.fill();
  });
}

function drawTrafficLight(ctx, screenX, lightState) {
  // Pole
  ctx.fillStyle = '#6B7280';
  ctx.fillRect(screenX - 5, ROAD_Y - 140, 10, 140);

  // Housing box
  ctx.fillStyle = '#1F2937';
  roundRect(ctx, screenX - 22, ROAD_Y - 148, 44, 110, 8);
  ctx.fill();

  // Three lights
  const colors = {
    off: { red: '#7F1D1D', yellow: '#78350F', green: '#14532D' },
    on:  { red: '#EF4444', yellow: '#FBBF24', green: '#22C55E' },
    glow:{ red: '#FCA5A5', yellow: '#FDE68A', green: '#86EFAC' },
  };
  ['red','yellow','green'].forEach((c, i) => {
    const active = lightState === c;
    const cy = ROAD_Y - 132 + i * 34;
    if (active) {
      ctx.fillStyle = colors.glow[c];
      ctx.beginPath(); ctx.arc(screenX, cy, 18, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = active ? colors.on[c] : colors.off[c];
    ctx.beginPath(); ctx.arc(screenX, cy, 13, 0, Math.PI * 2); ctx.fill();
  });

  // Stop line on road
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(screenX - 55, ROAD_Y, 4, ROAD_H * 0.55);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawHUD(ctx, speed, maxSpd, lightState, message) {
  // Speed box
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, 12, 12, 130, 52, 8); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px monospace';
  const kmh = Math.round((speed / maxSpd) * 120);
  ctx.fillText(`${kmh} km/h`, 22, 38);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Tezlik', 22, 56);

  // Message banner
  if (message) {
    const colors = {
      red: '#EF4444', green: '#22C55E', blue: '#3B82F6', yellow: '#FBBF24'
    };
    const msgColor = lightState === 'green' ? 'green' : lightState === 'red' ? 'red' : 'yellow';
    ctx.fillStyle = `rgba(${lightState==='green'?'0,80,0':lightState==='red'?'80,0,0':'80,60,0'},0.82)`;
    roundRect(ctx, CW/2 - 200, 14, 400, 44, 8); ctx.fill();
    ctx.fillStyle = colors[msgColor];
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, CW / 2, 42);
    ctx.textAlign = 'left';
  }
}


// ── Main component ─────────────────────────────────────────
export default function OyinPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const [phase, setPhase] = useState('select'); // select | playing | result
  const [selectedCar, setSelectedCar] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) router.push('/login');
  }, []);

  // Start game
  function startGame(car) {
    setSelectedCar(car);
    setPhase('playing');
  }

  // Main game loop
  useEffect(() => {
    if (phase !== 'playing' || !selectedCar) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const G = {
      worldOffset: 0,
      speed: 0,
      lightState: 'red',
      lightTimer: 0,
      lightTimerActive: false,
      gameStatus: 'driving', // driving | stopped | passed | failed
      message: '',
      msgTimer: 0,
      keys: {},
      wheelAngle: 0,
      carTiltAngle: 0,
    };
    gameRef.current = G;

    function onKey(e) {
      const k = e.key;
      if (['ArrowUp','ArrowDown','w','s','W','S',' '].includes(k)) {
        e.preventDefault();
        G.keys[k] = e.type === 'keydown';
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    function showMsg(msg) { G.message = msg; G.msgTimer = 180; }

    function update() {
      const G = gameRef.current;
      const gas = G.keys['ArrowUp'] || G.keys['w'] || G.keys['W'] || G.keys[' '];
      const brk = G.keys['ArrowDown'] || G.keys['s'] || G.keys['S'];

      if (G.gameStatus === 'driving' || G.gameStatus === 'stopped') {
        if (gas && G.gameStatus !== 'stopped') {
          G.speed = Math.min(G.speed + selectedCar.acc, selectedCar.maxSpd);
          G.carTiltAngle = Math.min(G.carTiltAngle + 0.003, 0.04);
        } else {
          G.carTiltAngle = G.carTiltAngle * 0.9;
        }
        if (brk) {
          G.speed = Math.max(G.speed - selectedCar.brk, 0);
        } else if (!gas) {
          G.speed = Math.max(G.speed - 0.015, 0);
        }

        G.worldOffset += G.speed;
        G.wheelAngle += G.speed * 0.15;

        // TL screen X
        const tlScreenX = TL_WORLD_X - G.worldOffset;

        // Activate timer when TL is 320px away
        if (!G.lightTimerActive && tlScreenX < 380) {
          G.lightTimerActive = true;
          G.lightTimer = 200; // frames (≈3.3s at 60fps)
          showMsg('Qizil chiroq — to\'xtang!');
        }

        // TL countdown
        if (G.lightTimerActive && G.lightState === 'red') {
          G.lightTimer--;
          if (G.lightTimer <= 0) {
            G.lightState = 'yellow';
            G.lightTimer = 40; // yellow for ~0.7s
            showMsg('Sariq — tayyor bo\'ling!');
          }
        } else if (G.lightState === 'yellow') {
          G.lightTimer--;
          if (G.lightTimer <= 0) {
            G.lightState = 'green';
            if (G.gameStatus === 'stopped') G.gameStatus = 'driving';
            showMsg('Yashil — yuring!');
          }
        }

        // Stop line check (red or yellow)
        if ((G.lightState === 'red' || G.lightState === 'yellow') && G.worldOffset >= FAIL_OFFSET) {
          if (G.speed > 0.5) {
            // Ran red light
            G.gameStatus = 'failed';
            G.speed = 0;
            showMsg("Qizil chiroqdan o'tdingiz! Jarima!");
            setTimeout(() => finishGame(false), 2500);
          } else {
            // Stopped correctly
            G.gameStatus = 'stopped';
            G.speed = 0;
            showMsg('Yaxshi! Yashil chiroqni kuting...');
          }
        }

        // Passed traffic light
        if (G.lightState === 'green' && G.worldOffset >= PASS_OFFSET) {
          G.gameStatus = 'passed';
          G.speed = 0;
          showMsg("Barakallo! Muvaffaqiyatli o'tdingiz!");
          setTimeout(() => finishGame(true), 2000);
        }
      }

      if (G.msgTimer > 0) G.msgTimer--;
      if (G.msgTimer === 0) G.message = '';
    }

    function draw() {
      const G = gameRef.current;
      const tlScreenX = TL_WORLD_X - G.worldOffset;

      drawRoad(ctx, G.worldOffset);

      // Traffic light (only show when on screen)
      if (tlScreenX < CW + 50 && tlScreenX > -50) {
        drawTrafficLight(ctx, tlScreenX, G.lightState);
      }

      // Car
      const carY = LANE_Y - CAR_H / 2;
      drawCar(ctx, selectedCar, CAR_SCREEN_X, carY, -G.carTiltAngle);

      // HUD
      const dispMsg = G.msgTimer > 0 ? G.message : '';
      drawHUD(ctx, G.speed, selectedCar.maxSpd, G.lightState, dispMsg);

      // Control hint
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(ctx, CW - 170, 12, 158, 44, 8); ctx.fill();
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '12px sans-serif';
      ctx.fillText('↑ W — Gaz  ↓ S — Tormoz', CW - 162, 30);
      ctx.fillText('Yoki Space — gaz', CW - 162, 48);
    }

    function loop() {
      update();
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [phase, selectedCar]);

  function finishGame(success) {
    cancelAnimationFrame(rafRef.current);
    setResult(success);
    setPhase('result');
  }

  // ── Render ───────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <>
        <Navbar />
        <div className="container" style={{maxWidth:800}}>
          <div style={{textAlign:'center',marginBottom:'2rem'}}>
            <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'0.4rem',color:'var(--text)'}}>Mashina haydash o'yini</h1>
            <p style={{color:'var(--text-muted)'}}>Mashina tanlang va svetafordan o'ting!</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'1.25rem',marginBottom:'2rem'}}>
            {CARS.map(car => (
              <div key={car.id}
                style={{background:'var(--surface)',border:'2px solid var(--border)',borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(37,99,235,0.18)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}
                onClick={() => startGame(car)}>
                <div style={{width:'100%',height:160,overflow:'hidden',background:'#F1F5F9',position:'relative'}}>
                  <img
                    src={car.img}
                    alt={car.name}
                    style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block'}}
                  />
                </div>
                <div style={{padding:'1rem 1.25rem'}}>
                  <div style={{fontWeight:700,fontSize:'1.1rem',color:'var(--text)',marginBottom:'0.2rem'}}>{car.name}</div>
                  <div style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>{car.desc}</div>
                  <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                    <span style={{fontSize:'0.78rem',background:'#EFF6FF',color:'#1D4ED8',borderRadius:6,padding:'2px 8px'}}>Max: {car.topSpeed}</span>
                  </div>
                  <button style={{marginTop:'0.875rem',width:'100%',padding:'0.6rem',background:'var(--primary)',color:'white',border:'none',borderRadius:8,fontWeight:600,fontSize:'0.9rem',cursor:'pointer'}}>
                    Tanlash
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'1rem 1.25rem',fontSize:'0.875rem',color:'var(--text-muted)'}}>
            <strong style={{color:'var(--text)'}}>Boshqaruv:</strong> &nbsp;
            <kbd style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 8px',fontFamily:'monospace'}}>W</kbd> yoki
            <kbd style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 8px',fontFamily:'monospace',margin:'0 4px'}}>↑</kbd> — gaz &nbsp;|&nbsp;
            <kbd style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 8px',fontFamily:'monospace'}}>S</kbd> yoki
            <kbd style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 8px',fontFamily:'monospace',margin:'0 4px'}}>↓</kbd> — tormoz &nbsp;|&nbsp;
            <kbd style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 8px',fontFamily:'monospace'}}>Space</kbd> — gaz
          </div>
        </div>
      </>
    );
  }

  if (phase === 'result') {
    return (
      <>
        <Navbar />
        <div style={{maxWidth:520,margin:'3rem auto',padding:'0 1rem',textAlign:'center'}}>
          <div style={{background:'var(--surface)',border:`2px solid ${result?'#22C55E':'#EF4444'}`,borderRadius:16,padding:'2.5rem 2rem'}}>
            <div style={{fontSize:'3.5rem',marginBottom:'0.75rem'}}>{result ? '✅' : '🚨'}</div>
            <h2 style={{fontSize:'1.4rem',fontWeight:800,marginBottom:'0.5rem',color:'var(--text)'}}>
              {result ? 'Barakallo! Muvaffaqiyatli o\'tdingiz!' : 'Qizil chiroqdan o\'tdingiz!'}
            </h2>
            <p style={{color:'var(--text-muted)',marginBottom:'1.75rem',fontSize:'0.95rem'}}>
              {result
                ? `${selectedCar.name} bilan svetafordan to'g'ri o'tdingiz. Endi yo'lda ham shunday qiling!`
                : `Qizil chiroqda to'xtash shart edi. Qayta urinib ko'ring.`}
            </p>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={() => { setPhase('select'); setSelectedCar(null); setResult(null); }}
                className="btn btn-primary">Qayta o'ynash</button>
              <Link href="/" className="btn btn-outline">Bosh sahifa</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Playing phase
  return (
    <>
      <Navbar />
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'1rem'}}>
        <div style={{marginBottom:'0.75rem',display:'flex',alignItems:'center',gap:'1rem',width:'100%',maxWidth:CW}}>
          <button onClick={() => { cancelAnimationFrame(rafRef.current); setPhase('select'); setSelectedCar(null); }}
            style={{padding:'0.4rem 0.875rem',border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',color:'var(--text)',cursor:'pointer',fontSize:'0.85rem'}}>
            ← Chiqish
          </button>
          <span style={{fontWeight:700,color:'var(--text)',fontSize:'0.95rem'}}>{selectedCar.name} — Svetafordan o'ting!</span>
        </div>
        <canvas ref={canvasRef} width={CW} height={CH}
          style={{width:'100%',maxWidth:CW,borderRadius:12,display:'block',border:'2px solid var(--border)',background:'#93C5FD'}} />
        <p style={{marginTop:'0.75rem',fontSize:'0.8rem',color:'var(--text-muted)',textAlign:'center',padding:'0 1rem'}}>
          Sahifaga bosing, so'ng <strong>W / ↑</strong> — gaz &nbsp;|&nbsp; <strong>S / ↓</strong> — tormoz
        </p>
      </div>
    </>
  );
}
