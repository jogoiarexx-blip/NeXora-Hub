"use strict";

/* ============================================================
   AUDIO (WebAudio, procedural, no files)
============================================================ */
const sfx = (function(){
  let actx = null;
  let master = null;
  let noiseBuffer = null;
  const loops = {};
  function ensure(){
    if(actx) return;
    try{
      actx = new (window.AudioContext||window.webkitAudioContext)();
      master = actx.createGain();
      master.gain.value = save.settings.volume;
      master.connect(actx.destination);
      noiseBuffer = makeNoiseBuffer();
    }catch(e){}
  }
  function makeNoiseBuffer(){
    const len = actx.sampleRate * 2;
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
    return buf;
  }
  function enabled(){ return save.settings.sound; }
  function setVolume(v){ if(master) master.gain.value = v; }

  function playClick(){
    if(!enabled()) return; ensure();
    const o = actx.createOscillator(); const g = actx.createGain();
    o.type='sine'; o.frequency.value=520;
    g.gain.setValueAtTime(0.18, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime+0.12);
    o.connect(g); g.connect(master);
    o.start(); o.stop(actx.currentTime+0.13);
  }
  function playPop(){
    if(!enabled()) return; ensure();
    const src = actx.createBufferSource(); src.buffer = noiseBuffer;
    const bp = actx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1800; bp.Q.value=1.2;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.22, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime+0.18);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(); src.stop(actx.currentTime+0.2);
  }
  function playChime(){
    if(!enabled()) return; ensure();
    [660,880,1100].forEach((f,i)=>{
      const o = actx.createOscillator(); const g = actx.createGain();
      o.type='triangle'; o.frequency.value=f;
      const t0 = actx.currentTime + i*0.08;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.15, t0+0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0+0.4);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0+0.42);
    });
  }
  function playVictory(){
    if(!enabled()) return; ensure();
    [523,659,784,1046].forEach((f,i)=>{
      const o = actx.createOscillator(); const g = actx.createGain();
      o.type='triangle'; o.frequency.value=f;
      const t0 = actx.currentTime + i*0.14;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.2, t0+0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t0+0.6);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0+0.62);
    });
  }
  function playDefeat(){
    if(!enabled()) return; ensure();
    const o = actx.createOscillator(); const g = actx.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(300, actx.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, actx.currentTime+0.9);
    g.gain.setValueAtTime(0.18, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime+0.95);
    o.connect(g); g.connect(master);
    o.start(); o.stop(actx.currentTime+1);
  }
  function startLoop(name, setup){
    if(!enabled()){ return; }
    ensure();
    if(loops[name]) return;
    loops[name] = setup();
  }
  function stopLoop(name){
    const l = loops[name];
    if(l){ try{ l.stop(); }catch(e){} delete loops[name]; }
  }
  function fireLoop(){
    const src = actx.createBufferSource(); src.buffer=noiseBuffer; src.loop=true;
    const lp = actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900;
    const g = actx.createGain(); g.gain.value=0.05;
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start();
    return { stop(){ src.stop(); }, setLevel(v){ g.gain.value = 0.02+0.09*v; lp.frequency.value=400+900*v; } };
  }
  function windLoop(){
    const src = actx.createBufferSource(); src.buffer=noiseBuffer; src.loop=true;
    const bp = actx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=500; bp.Q.value=0.6;
    const g = actx.createGain(); g.gain.value=0.0;
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start();
    return { stop(){ src.stop(); }, setLevel(v){ g.gain.value = 0.1*v; } };
  }
  function rainLoop(){
    const src = actx.createBufferSource(); src.buffer=noiseBuffer; src.loop=true;
    const hp = actx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=2500;
    const g = actx.createGain(); g.gain.value=0.0;
    src.connect(hp); hp.connect(g); g.connect(master);
    src.start();
    return { stop(){ src.stop(); }, setLevel(v){ g.gain.value = 0.12*v; } };
  }
  return { ensure, playClick, playPop, playChime, playVictory, playDefeat, startLoop, stopLoop, fireLoop, windLoop, rainLoop, setVolume, loops };
})();

