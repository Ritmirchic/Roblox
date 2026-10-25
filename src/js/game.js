// Space Miner - Premium Space Mining Adventure
// Core Game Engine - Canvas 2D with procedural VFX
const ASSET = p => `./assets/${p}`;

const RESOURCES = [
  {id:'iron', name:'Iron', color:'#b8b8ba', glow:'#d0d0d2', value:12, rarity:1, hardness:1, icon:'res_iron.png'},
  {id:'copper', name:'Copper', color:'#c9783c', glow:'#e8a060', value:18, rarity:1, hardness:1, icon:'res_copper.png'},
  {id:'nickel', name:'Nickel', color:'#9eb0a0', glow:'#c2d2c2', value:22, rarity:1, hardness:1.2, icon:'res_nickel.png'},
  {id:'titanium', name:'Titanium', color:'#d0d8e0', glow:'#e8eef4', value:45, rarity:2, hardness:1.5, icon:'res_titanium.png'},
  {id:'silver', name:'Silver', color:'#d6dde6', glow:'#eef2f8', value:55, rarity:2, hardness:1.2, icon:'res_silver.png'},
  {id:'gold', name:'Gold', color:'#ffd700', glow:'#ffe85c', value:85, rarity:2, hardness:1, icon:'res_gold.png'},
  {id:'platinum', name:'Platinum', color:'#d8e0e8', glow:'#eef4ff', value:120, rarity:3, hardness:1.8, icon:'res_platinum.png'},
  {id:'uranium', name:'Uranium', color:'#64dc50', glow:'#8cff7a', value:150, rarity:3, hardness:2, icon:'res_uranium.png'},
  {id:'crystal', name:'Aether Crystal', color:'#78dcff', glow:'#a0f0ff', value:180, rarity:3, hardness:1.6, icon:'res_crystal.png'},
  {id:'plasma_ore', name:'Plasma Ore', color:'#ff7814', glow:'#ff9a3c', value:220, rarity:4, hardness:2.2, icon:'res_plasma_ore.png'},
  {id:'void_crystal', name:'Void Crystal', color:'#b450ff', glow:'#d080ff', value:350, rarity:4, hardness:2.5, icon:'res_void_crystal.png'},
  {id:'cobalt', name:'Cobalt', color:'#3278c8', glow:'#5aa0ff', value:70, rarity:2, hardness:1.7, icon:'res_cobalt.png'},
  {id:'iridium', name:'Iridium', color:'#b4a0d2', glow:'#d2c0f0', value:280, rarity:4, hardness:2, icon:'res_iridium.png'},
  {id:'dark_matter', name:'Dark Matter', color:'#404050', glow:'#606080', value:500, rarity:5, hardness:3, icon:'res_dark_matter.png'},
  {id:'quantum_core', name:'Quantum Core', color:'#ff3278', glow:'#ff6a9a', value:900, rarity:5, hardness:3.5, icon:'res_quantum_core.png'},
];
const RES_MAP = Object.fromEntries(RESOURCES.map(r=>[r.id,r]));

const SECTORS = [
  {id:1, name:'Starter Belt', desc:'Common asteroids. Ideal for new miners. Low danger.', bg:'nebula_starter.png', danger:1, reqLevel:1, reqCredits:0, color:'#3a8bff',
   asteroids:['asteroid_common_1.png','asteroid_common_2.png','asteroid_common_3.png'],
   resources:[['iron',40],['copper',25],['nickel',15],['titanium',8],['silver',7],['gold',3],['cobalt',2]],
   enemies:[{type:'scout', weight:1}],
   env:'dust'},
  {id:2, name:'Crystal Nebula', desc:'Luminous crystal fields. Moderate drone patrols.', bg:'nebula_crystal.png', danger:2, reqLevel:3, reqCredits:1500, color:'#b450ff',
   asteroids:['asteroid_crystal_1.png','asteroid_crystal_2.png','asteroid_crystal_3.png'],
   resources:[['crystal',28],['titanium',14],['silver',12],['gold',10],['platinum',8],['cobalt',10],['iridium',6],['uranium',5],['iron',7]],
   enemies:[{type:'scout',weight:0.6},{type:'raider',weight:0.4}],
   env:'nebula'},
  {id:3, name:'Iron Graveyard', desc:'Abandoned fleet debris. Hostile scavenger drones.', bg:'nebula_graveyard.png', danger:3, reqLevel:6, reqCredits:6000, color:'#c9783c',
   asteroids:['asteroid_iron_1.png','asteroid_iron_2.png','asteroid_iron_3.png'],
   resources:[['iron',18],['titanium',16],['platinum',14],['uranium',12],['iridium',10],['gold',8],['plasma_ore',8],['cobalt',8],['void_crystal',3],['dark_matter',3]],
   enemies:[{type:'raider',weight:0.5},{type:'heavy',weight:0.5}],
   env:'debris'},
  {id:4, name:'Plasma Storm', desc:'Electrical hazards and superheated minerals. Extreme danger.', bg:'nebula_plasma.png', danger:4, reqLevel:10, reqCredits:18000, color:'#ff7814',
   asteroids:['asteroid_plasma_1.png','asteroid_plasma_2.png','asteroid_plasma_3.png'],
   resources:[['plasma_ore',24],['uranium',14],['void_crystal',12],['iridium',10],['platinum',8],['crystal',8],['dark_matter',8],['quantum_core',4],['gold',6],['titanium',6]],
   enemies:[{type:'heavy',weight:0.4},{type:'plasma',weight:0.6}],
   env:'storm'},
  {id:5, name:'Void Frontier', desc:'Edge of known space. Legendary riches guard the abyss.', bg:'nebula_void.png', danger:5, reqLevel:15, reqCredits:45000, color:'#ff3278',
   asteroids:['asteroid_void_1.png','asteroid_void_2.png','asteroid_void_3.png'],
   resources:[['void_crystal',18],['dark_matter',16],['quantum_core',10],['plasma_ore',12],['iridium',12],['uranium',8],['platinum',8],['crystal',8],['gold',8]],
   enemies:[{type:'plasma',weight:0.4},{type:'sentinel',weight:0.6}],
   env:'void'},
];

const SHIPS = [
  {id:'scout', name:'Scout Runner', desc:'Agile explorer. Fast boost, long scanner range.', icon:'ship_scout.png', hull:90, shield:40, speed:280, cargo:80, energy:120, price:0, unlocked:true},
  {id:'miner', name:'Matter Hauler', desc:'Industrial miner. Massive cargo, strong laser.', icon:'ship_miner.png', hull:130, shield:60, speed:220, cargo:160, energy:150, price:8500, unlocked:false},
  {id:'vanguard', name:'Vanguard Warden', desc:'Combat escort. Heavy hull, dual weapons.', icon:'ship_vanguard.png', hull:160, shield:90, speed:240, cargo:120, energy:140, price:22000, unlocked:false},
];

const UPGRADES = [
  {id:'laser_power', name:'Mining Laser Power', desc:'+25% asteroid damage per level. Melts rock faster.', icon:'◈', max:5, base:500, inc:1.6, stat:'laserPower'},
  {id:'laser_speed', name:'Beam Efficiency', desc:'+20% mining tick speed and -10% energy drain.', icon:'⚡', max:5, base:450, inc:1.5, stat:'laserSpeed'},
  {id:'cargo', name:'Cargo Expansion', desc:'+40 cargo capacity. Carry more before selling.', icon:'⬢', max:6, base:600, inc:1.5, stat:'cargoCap'},
  {id:'engine', name:'Thruster Tuning', desc:'+12% max speed and +15% acceleration.', icon:'▲', max:5, base:550, inc:1.5, stat:'engine'},
  {id:'hull', name:'Reinforced Hull', desc:'+30 max hull. Survive brutal impacts.', icon:'⬣', max:5, base:700, inc:1.6, stat:'hull'},
  {id:'shield', name:'Shield Capacitor', desc:'+25 shield and +15% recharge rate.', icon:'⬔', max:5, base:650, inc:1.6, stat:'shield'},
  {id:'energy', name:'Reactor Overclock', desc:'+25 max energy and +20% regen speed.', icon:'⬥', max:5, base:500, inc:1.5, stat:'energy'},
  {id:'scanner', name:'Resource Scanner', desc:'Highlights valuable asteroids and shows contents (R to scan).', icon:'◎', max:3, base:800, inc:1.7, stat:'scanner'},
  {id:'drone_cap', name:'Drone Command', desc:'+1 active drone slot. Build your fleet.', icon:'⬡', max:4, base:1200, inc:1.8, stat:'droneCap'},
  {id:'drone_speed', name:'Drone Thrusters', desc:'Drones move +18% faster and mine +15% quicker.', icon:'⬪', max:4, base:900, inc:1.6, stat:'droneSpeed'},
  {id:'weapon', name:'Pulse Cannons', desc:'+20% weapon damage and -12% fire cooldown.', icon:'⬆', max:5, base:750, inc:1.6, stat:'weapon'},
  {id:'collector', name:'Mag-Collector', desc:'+40% resource auto-pickup radius and +15% attraction speed.', icon:'⬙', max:4, base:650, inc:1.5, stat:'collector'},
];

const ENEMIES_DEF = {
  scout: {name:'Scout Drone', hp:35, dmg:8, speed:160, reward:120, xp:12, size:44, color:'#ff4a4a', img:'enemy_scout.png'},
  raider: {name:'Raider', hp:70, dmg:14, speed:140, reward:250, xp:22, size:48, color:'#ff9a2c', img:'enemy_raider.png'},
  heavy: {name:'Heavy Drone', hp:130, dmg:20, speed:90, reward:420, xp:35, size:54, color:'#ff3b3b', img:'enemy_heavy.png'},
  plasma: {name:'Plasma Hunter', hp:95, dmg:26, speed:170, reward:580, xp:45, size:52, color:'#4af0ff', img:'enemy_plasma.png'},
  sentinel: {name:'Void Sentinel', hp:260, dmg:34, speed:110, reward:1100, xp:80, size:62, color:'#b450ff', img:'enemy_sentinel.png'},
};

const ACHIEVEMENTS = [
  {id:'first_ore', name:'First Haul', desc:'Collect your first resource'},
  {id:'cargo_full', name:'Overburdened', desc:'Fill cargo to capacity'},
  {id:'first_drone', name:'Automated', desc:'Deploy your first drone'},
  {id:'sector2', name:'Crystal Sight', desc:'Unlock Crystal Nebula'},
  {id:'enemy_kill', name:'Debris Field', desc:'Destroy an enemy'},
  {id:'rich', name:'Prosperity', desc:'Reach 10,000 credits'},
  {id:'level5', name:'Veteran Miner', desc:'Reach level 5'},
  {id:'void', name:'Into the Void', desc:'Enter Void Frontier'},
];

// Utility
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const rand=(a,b)=>a+Math.random()*(b-a);
const choice=a=>a[Math.floor(Math.random()*a.length)];

class ImageCache{
  constructor(){this.map=new Map()}
  get(src){
    if(this.map.has(src)) return this.map.get(src);
    const img=new Image(); img.src=src; this.map.set(src,img); return img;
  }
}

class Particle{
  constructor(x,y,vx,vy,life,color,size,decay=0.98){
    this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.life=life;this.maxLife=life;this.color=color;this.size=size;this.decay=decay;this.alpha=1;
  }
  update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.vx*=this.decay; this.vy*=this.decay; this.life-=dt; this.alpha=clamp(this.life/this.maxLife,0,1); return this.life>0; }
  draw(ctx){ ctx.globalAlpha=this.alpha*0.9; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.size*this.alpha,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
}

class Game{
  constructor(){
    this.canvas=document.getElementById('game-canvas');
    this.ctx=this.canvas.getContext('2d');
    this.minimap=document.getElementById('minimap');
    this.mctx=this.minimap.getContext('2d');
    this.images=new ImageCache();
    this.keys={}; this.mouse={x:0,y:0,down:false};
    this.particles=[]; this.projectiles=[]; this.effects=[];
    this.asteroids=[]; this.resourcesEnt=[]; this.enemies=[]; this.drones=[]; this.hazards=[];
    this.sectorId=1; this.shipDef=SHIPS[0]; this.upgrades={}; this.inventory={}; this.credits=0; this.xp=0; this.level=1; this.xpNext=500;
    this.achievements={}; this.cargoUsed=0; this.time=0; this.paused=false; this.scanActive=0; this.screenShake=0;
    this.unlockedSectors=[1]; this.unlockedShips=['scout']; this.activeShip='scout';
    // ship state
    this.ship={x:0,y:0,vx:0,vy:0,angle:0,hp:100,maxHp:100,shield:50,maxShield:50,energy:100,maxEnergy:100,shieldRegenTimer:0, cargo:0, maxCargo:80, laserPower:1, laserSpeed:1, engineMult:1, hullMult:1, shieldMult:1, energyMult:1, weaponMult:1, collectorMult:1, droneCap:0, droneSpeed:1};
    this.worldSize=3000;
    this.camera={x:0,y:0};
    this.stars=[]; this.dust=[];
    this.spawnTimer=0; this.enemySpawnTimer=0; this.saveTimer=0;
    this.setupInput(); this.setupUI(); this.loadSave(); this.genStars(); this.applyUpgrades();
    this.resize(); window.addEventListener('resize',()=>this.resize());
    this.loadingDone=false;
  }
  resize(){
    const dpr=Math.min(devicePixelRatio||1,2);
    this.canvas.width=innerWidth*dpr; this.canvas.height=innerHeight*dpr;
    this.canvas.style.width=innerWidth+'px'; this.canvas.style.height=innerHeight+'px';
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.viewW=innerWidth; this.viewH=innerHeight;
  }
  genStars(){
    this.stars=[]; for(let i=0;i<400;i++) this.stars.push({x:rand(-this.worldSize,this.worldSize), y:rand(-this.worldSize,this.worldSize), b:rand(0.4,1), s:rand(0.6,1.6), tw:rand(0,Math.PI*2)});
    this.dust=[]; for(let i=0;i<180;i++) this.dust.push({x:rand(-this.worldSize,this.worldSize), y:rand(-this.worldSize,this.worldSize), v:rand(0.2,0.8)});
  }
  applyUpgrades(){
    const lvl=id=>this.upgrades[id]||0;
    const shipBase = SHIPS.find(s=>s.id===this.activeShip) || SHIPS[0];
    this.shipDef=shipBase;
    const cargoBase = shipBase.cargo + lvl('cargo')*40;
    const hullBase = shipBase.hull + lvl('hull')*30;
    const shieldBase = shipBase.shield + lvl('shield')*25;
    const energyBase = shipBase.energy + lvl('energy')*25;
    this.ship.maxCargo=cargoBase;
    this.ship.maxHp=hullBase; this.ship.maxShield=shieldBase; this.ship.maxEnergy=energyBase;
    this.ship.laserPower=1+lvl('laser_power')*0.25;
    this.ship.laserSpeed=1+lvl('laser_speed')*0.20;
    this.ship.engineMult=1+lvl('engine')*0.12;
    this.ship.shieldMult=1+lvl('shield')*0.15;
    this.ship.energyMult=1+lvl('energy')*0.20;
    this.ship.weaponMult=1+lvl('weapon')*0.20;
    this.ship.collectorMult=1+lvl('collector')*0.40;
    this.ship.droneCap=lvl('drone_cap');
    this.ship.droneSpeed=1+lvl('drone_speed')*0.18;
    // clamp current
    this.ship.hp=clamp(this.ship.hp,0,this.ship.maxHp);
    this.ship.shield=clamp(this.ship.shield,0,this.ship.maxShield);
    this.ship.energy=clamp(this.ship.energy,0,this.ship.maxEnergy);
  }
  resetWorld(){
    const sec=this.getSector();
    this.asteroids=[]; this.resourcesEnt=[]; this.enemies=[]; this.hazards=[]; this.particles=[];
    this.ship.x=0; this.ship.y=0; this.ship.vx=0; this.ship.vy=0; this.ship.angle=-Math.PI/2;
    this.spawnAsteroids(28);
    this.genStars();
    this.enemySpawnTimer=0;
  }
  spawnAsteroids(n){
    const sec=this.getSector();
    let attempts=0;
    while(this.asteroids.length<n && attempts<500){
      attempts++;
      const a=this.createAsteroid(false);
      // validate not inside player
      if(Math.hypot(a.x-this.ship.x,a.y-this.ship.y) < 180) continue;
      // validate not overlapping existing asteroids heavily
      let overlap=false;
      for(const b of this.asteroids){ if(Math.hypot(a.x-b.x,a.y-b.y) < (a.r+b.r)*0.85){ overlap=true; break; } }
      if(overlap) continue;
      this.asteroids.push(a);
    }
  }
  createAsteroid(fromEdge=false){
    const sec=this.getSector();
    let x,y;
    if(fromEdge){
      const edge=Math.floor(Math.random()*4);
      const pad=400;
      if(edge===0){ x=rand(this.ship.x-this.worldSize/2, this.ship.x+this.worldSize/2); y=this.ship.y - this.worldSize/2 - pad; }
      else if(edge===1){ x=this.ship.x + this.worldSize/2 + pad; y=rand(this.ship.y-this.worldSize/2, this.ship.y+this.worldSize/2); }
      else if(edge===2){ x=rand(this.ship.x-this.worldSize/2, this.ship.x+this.worldSize/2); y=this.ship.y + this.worldSize/2 + pad; }
      else { x=this.ship.x - this.worldSize/2 - pad; y=rand(this.ship.y-this.worldSize/2, this.ship.y+this.worldSize/2); }
    } else {
      x=rand(-this.worldSize/2+120, this.worldSize/2-120);
      y=rand(-this.worldSize/2+120, this.worldSize/2-120);
    }
    // choose resource distribution for asteroid
    const pool=sec.resources;
    // weighted pick primary resource
    let total=pool.reduce((s,[,w])=>s+w,0);
    let r=Math.random()*total; let primary=null;
    for(const [id,w] of pool){ r-=w; if(r<=0){ primary=id; break; } }
    if(!primary) primary=pool[0][0];
    const rdef=RES_MAP[primary];
    const sizeCat=Math.random()<0.55?'med': Math.random()<0.5?'big':'small';
    let rSize = sizeCat==='small'? rand(22,32) : sizeCat==='med'? rand(36,52) : rand(58,78);
    let hp = Math.floor( (rSize*1.2) * (0.8 + rdef.hardness*0.6) * rand(0.9,1.2));
    // small chance for rich asteroid (double hp, more resources)
    const rich = Math.random()<0.12;
    if(rich) { hp*=1.6; rSize*=1.12; }
    // resource payload: quantity
    const qty = Math.floor(rand(3,7) * (rSize/38) * (rich?1.8:1));
    // hardness affects mining speed
    const imgName = choice(sec.asteroids);
    return {
      x,y, vx:rand(-12,12), vy:rand(-12,12), r:rSize, hp, maxHp:hp, primary, hardness:rdef.hardness, qty, rich,
      rot:rand(0,Math.PI*2), rotSpeed:rand(-0.4,0.4), img:imgName, hitFlash:0, resourcesCache:null
    };
  }
  getSector(){ return SECTORS.find(s=>s.id===this.sectorId) || SECTORS[0]; }
  setupInput(){
    addEventListener('keydown',e=>{
      this.keys[e.key.toLowerCase()]=true;
      if(['i','u','m','o','b'].includes(e.key.toLowerCase())) this.togglePanel(e.key.toLowerCase());
      if(e.key.toLowerCase()==='t') this.sellAll();
      if(e.key.toLowerCase()==='e') this.tryCollect();
      if(e.key.toLowerCase()==='r') this.scanActive=3;
      if(e.key==='Escape'){ this.togglePause(); }
      if(e.key.toLowerCase()==='q') this.shieldBurst();
    });
    addEventListener('keyup',e=>{ this.keys[e.key.toLowerCase()]=false; });
    this.canvas.addEventListener('mousemove',e=>{
      const rect=this.canvas.getBoundingClientRect();
      this.mouse.x=e.clientX - rect.left; this.mouse.y=e.clientY - rect.top;
    });
    this.canvas.addEventListener('mousedown',e=>{
      if(e.button===0) this.mouse.down=true;
      // avoid ui
      if(e.target.closest('.hud-panel')||e.target.closest('.overlay-panel')) return;
    });
    addEventListener('mouseup',e=>{ if(e.button===0) this.mouse.down=false; });
    this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
    // touch
    this.canvas.addEventListener('touchstart',e=>{
      const t=e.touches[0]; if(t){ this.mouse.x=t.clientX; this.mouse.y=t.clientY; this.mouse.down=true; }
    },{passive:false});
    addEventListener('touchmove',e=>{
      const t=e.touches[0]; if(t){ this.mouse.x=t.clientX; this.mouse.y=t.clientY; }
    },{passive:false});
    addEventListener('touchend',()=>{ this.mouse.down=false; });
  }
  setupUI(){
    const closeBtns=document.querySelectorAll('.panel-close');
    closeBtns.forEach(b=>b.addEventListener('click',()=>{ document.getElementById(b.dataset.close).classList.remove('open'); this.paused=false; }));
    document.getElementById('btn-play').addEventListener('click',()=>this.startGame(false));
    document.getElementById('btn-continue').addEventListener('click',()=>this.startGame(true));
    document.getElementById('btn-ship-select').addEventListener('click',()=>{ this.renderShop(); document.getElementById('panel-shop').classList.add('open'); });
    document.getElementById('btn-settings-menu').addEventListener('click',()=>document.getElementById('panel-settings').classList.add('open'));
    document.getElementById('btn-achievements-menu').addEventListener('click',()=>{ this.renderAchievements(); document.getElementById('panel-achievements').classList.add('open'); });
    document.getElementById('hud-btn-inv').addEventListener('click',()=>this.togglePanel('i'));
    document.getElementById('hud-btn-upgrades').addEventListener('click',()=>this.togglePanel('u'));
    document.getElementById('hud-btn-map').addEventListener('click',()=>this.togglePanel('m'));
    document.getElementById('hud-btn-drones').addEventListener('click',()=>this.togglePanel('o'));
    document.getElementById('hud-btn-shop').addEventListener('click',()=>{ this.renderShop(); document.getElementById('panel-shop').classList.add('open'); });
    document.getElementById('btn-pause').addEventListener('click',()=>this.togglePause());
    document.getElementById('btn-save').addEventListener('click',()=>{ this.save(); this.toast('Progress saved'); });
    document.getElementById('btn-sell-all').addEventListener('click',()=>this.sellAll());
    document.getElementById('btn-buy-drone').addEventListener('click',()=>this.buyDrone());
    document.getElementById('btn-reset-save').addEventListener('click',()=>{ if(confirm('Reset all progress?')){ localStorage.removeItem('space_miner_save_v1'); location.reload(); }});
    document.getElementById('btn-close-settings').addEventListener('click',()=>document.getElementById('panel-settings').classList.remove('open'));
    document.getElementById('btn-resume').addEventListener('click',()=>this.togglePause());
    document.getElementById('btn-pause-save').addEventListener('click',()=>{ this.save(); this.togglePause(); this.toast('Saved'); });
    document.getElementById('btn-quit-menu').addEventListener('click',()=>{ this.save(); this.quitToMenu(); });
    // overlay click to close
    document.querySelectorAll('.overlay-panel').forEach(p=>{
      p.addEventListener('click',e=>{ if(e.target===p){ p.classList.remove('open'); if(p.id==='panel-pause') this.paused=false; }});
    });
  }
  togglePanel(k){
    const map={i:'panel-inventory', u:'panel-upgrades', m:'panel-map', o:'panel-drones', b:'panel-shop'};
    const id=map[k]; if(!id) return;
    const el=document.getElementById(id);
    const isOpen=el.classList.contains('open');
    // close all
    document.querySelectorAll('.overlay-panel').forEach(p=>p.classList.remove('open'));
    if(!isOpen){
      if(id==='panel-inventory') this.renderInventory();
      if(id==='panel-upgrades') this.renderUpgrades();
      if(id==='panel-map') this.renderSectors();
      if(id==='panel-drones') this.renderDrones();
      if(id==='panel-shop') this.renderShop();
      el.classList.add('open');
    } else {
      // resume if not pause panel
    }
  }
  togglePause(){
    const p=document.getElementById('panel-pause');
    if(p.classList.contains('open')){ p.classList.remove('open'); this.paused=false; }
    else { p.classList.add('open'); this.paused=true; }
  }
  toast(msg, col){
    const c=document.getElementById('toast-container');
    const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
    if(col) t.style.borderColor=col;
    c.appendChild(t); setTimeout(()=>t.remove(), 2800);
  }
  startGame(useContinue){
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-container').classList.add('active');
    if(!useContinue){
      // keep current load but reset world position
    }
    this.resetWorld();
    this.ship.hp=this.ship.maxHp; this.ship.shield=this.ship.maxShield; this.ship.energy=this.ship.maxEnergy;
    this.paused=false;
    if(!this.loopStarted){ this.loopStarted=true; requestAnimationFrame((t)=>this.loop(t)); }
  }
  quitToMenu(){
    document.getElementById('panel-pause').classList.remove('open');
    document.getElementById('game-container').classList.remove('active');
    document.getElementById('main-menu').classList.remove('hidden');
    this.updateMenuInfo();
  }
  updateMenuInfo(){
    document.getElementById('menu-credits').textContent=this.credits.toLocaleString();
    document.getElementById('menu-level').textContent=this.level;
    document.getElementById('menu-sector').textContent=this.getSector().name;
    document.getElementById('preview-cargo').textContent=`${this.cargoUsed} / ${this.ship.maxCargo}`;
    document.getElementById('preview-drones').textContent=this.drones.length;
    const cont=document.getElementById('continue-info');
    const hasSave=!!localStorage.getItem('space_miner_save_v1');
    cont.textContent=hasSave? `Level ${this.level} • ${this.credits} CR` : 'No save';
  }

  // ---- Save System ----
  save(){
    const data={
      v:1, credits:this.credits, xp:this.xp, level:this.level, xpNext:this.xpNext,
      upgrades:this.upgrades, inventory:this.inventory, cargoUsed:this.cargoUsed,
      sectorId:this.sectorId, unlockedSectors:this.unlockedSectors,
      unlockedShips:this.unlockedShips, activeShip:this.activeShip,
      achievements:this.achievements, shipHp:this.ship.hp, shipShield:this.ship.shield, shipEnergy:this.ship.energy
    };
    try{ localStorage.setItem('space_miner_save_v1', JSON.stringify(data)); }
    catch(e){ console.warn('save failed',e); }
  }
  loadSave(){
    try{
      const raw=localStorage.getItem('space_miner_save_v1');
      if(!raw) return;
      const d=JSON.parse(raw);
      if(d.v!==1) throw new Error('version mismatch');
      this.credits=d.credits||0; this.xp=d.xp||0; this.level=d.level||1; this.xpNext=d.xpNext||500;
      this.upgrades=d.upgrades||{}; this.inventory=d.inventory||{}; this.cargoUsed=d.cargoUsed||0;
      this.sectorId=d.sectorId||1; this.unlockedSectors=d.unlockedSectors||[1];
      this.unlockedShips=d.unlockedShips||['scout']; this.activeShip=d.activeShip||'scout';
      this.achievements=d.achievements||{};
      this.ship.hp=d.shipHp||null; this.ship.shield=d.shipShield||null; this.ship.energy=d.shipEnergy||null;
      this.applyUpgrades();
      if(this.ship.hp!==null){ this.ship.hp=clamp(d.shipHp,0,this.ship.maxHp); this.ship.shield=clamp(d.shipShield,0,this.ship.maxShield); this.ship.energy=clamp(d.shipEnergy,0,this.ship.maxEnergy); }
      this.updateMenuInfo();
    }catch(e){
      console.warn('corrupted save, resetting',e);
      localStorage.removeItem('space_miner_save_v1');
    }
  }
  addXP(amt){
    this.xp+=amt;
    while(this.xp>=this.xpNext){
      this.xp-=this.xpNext; this.level++; this.xpNext=Math.floor(this.xpNext*1.6);
      this.toast(`LEVEL UP! Now level ${this.level}`, '#00e5ff');
      this.unlockCheck();
      this.achieveCheck();
      // heal a bit on level
      this.ship.hp=clamp(this.ship.hp+Math.floor(this.ship.maxHp*0.25),0,this.ship.maxHp);
      this.particles.push(new Particle(this.ship.x,this.ship.y,0,0,0.8,'#00e5ff',18));
    }
  }
  unlockCheck(){
    for(const s of SECTORS){
      if(!this.unlockedSectors.includes(s.id) && this.level>=s.reqLevel && this.credits>=s.reqCredits){
        // auto unlock notification but require manual purchase? Spec says unlock via progression; we'll auto-unlock when level reached and allow purchase via map
      }
    }
  }
  unlockSector(id){
    const sec=SECTORS.find(s=>s.id===id);
    if(this.unlockedSectors.includes(id)) { this.warpTo(id); return; }
    if(this.level < sec.reqLevel){ this.toast(`Requires level ${sec.reqLevel}`, '#ff3b5b'); return; }
    if(this.credits < sec.reqCredits){ this.toast(`Need ${sec.reqCredits} CR`, '#ffb800'); return; }
    this.credits-=sec.reqCredits; this.unlockedSectors.push(id);
    this.achieve('sector2');
    if(id===5) this.achieve('void');
    this.toast(`Unlocked ${sec.name}!`, sec.color);
    this.warpTo(id);
  }
  warpTo(id){
    this.sectorId=id; this.resetWorld(); this.save();
    document.getElementById('panel-map').classList.remove('open');
    this.toast(`Warped to ${this.getSector().name}`, this.getSector().color);
    // warp effect particles
    for(let i=0;i<30;i++) this.particles.push(new Particle(this.ship.x+rand(-40,40), this.ship.y+rand(-40,40), rand(-120,120), rand(-120,120), 0.6, this.getSector().color, rand(3,7)));
  }

  // ---- Rendering Helpers ----
  worldToScreen(x,y){ return {x: x - this.camera.x + this.viewW/2, y: y - this.camera.y + this.viewH/2}; }
  screenToWorld(sx,sy){ return {x: sx - this.viewW/2 + this.camera.x, y: sy - this.viewH/2 + this.camera.y}; }

  // ---- Game Loop ----
  loop(t){
    if(!this.lastT) this.lastT=t;
    const dt=Math.min((t-this.lastT)/1000, 0.033); this.lastT=t;
    if(!this.paused){
      this.update(dt);
    }
    this.render();
    this.updateHUD();
    requestAnimationFrame((nt)=>this.loop(nt));
  }
  update(dt){
    this.time+=dt;
    // shield burst cooldown etc
    if(this.scanActive>0) this.scanActive-=dt;

    // Ship controls
    this.updateShip(dt);
    // Camera follow lerp
    this.camera.x=lerp(this.camera.x, this.ship.x, 0.08);
    this.camera.y=lerp(this.camera.y, this.ship.y, 0.08);
    // Screen shake decay
    if(this.screenShake>0) this.screenShake-=dt*6;

    // Asteroids update
    for(const a of this.asteroids){
      a.x+=a.vx*dt; a.y+=a.vy*dt; a.rot+=a.rotSpeed*dt; a.hitFlash=Math.max(0,a.hitFlash-dt*4);
      // wrap loosely - keep world bounded, bounce if outside worldSize
      if(a.x < -this.worldSize/2-200) a.x=this.worldSize/2+190;
      if(a.x > this.worldSize/2+200) a.x=-this.worldSize/2-190;
      if(a.y < -this.worldSize/2-200) a.y=this.worldSize/2+190;
      if(a.y > this.worldSize/2+200) a.y=-this.worldSize/2-190;
    }
    // Mining
    this.updateMining(dt);
    // Resources physics
    this.updateResources(dt);
    // Drones
    this.updateDrones(dt);
    // Enemies
    this.updateEnemies(dt);
    // Projectiles
    this.updateProjectiles(dt);
    // Particles
    this.particles=this.particles.filter(p=>p.update(dt));
    // Energy regen
    this.ship.energy=clamp(this.ship.energy + (4 + this.ship.energyMult*1.5)*dt, 0, this.ship.maxEnergy);
    // Shield regen after 3s no damage
    this.ship.shieldRegenTimer=Math.max(0,this.ship.shieldRegenTimer-dt);
    if(this.ship.shieldRegenTimer<=0 && this.ship.shield < this.ship.maxShield){
      this.ship.shield=clamp(this.ship.shield + (6*this.ship.shieldMult)*dt,0,this.ship.maxShield);
    }
    // Hazards per sector env
    this.updateHazards(dt);
    // Spawning
    this.spawnTimer+=dt; if(this.spawnTimer>2){
      this.spawnTimer=0;
      if(this.asteroids.length<32){
        const a=this.createAsteroid(true); this.asteroids.push(a);
      }
    }
    this.enemySpawnTimer+=dt;
    const sec=this.getSector();
    const enemyRate = sec.danger===1? 12 : sec.danger===2? 9 : sec.danger===3? 7 : sec.danger===4? 6 : 5;
    if(this.enemySpawnTimer>enemyRate){
      this.enemySpawnTimer=0;
      if(this.enemies.length< (sec.danger+1) ){
        this.spawnEnemy();
      }
    }
    // Cargo check achievement
    if(this.cargoUsed>=this.ship.maxCargo) this.achieve('cargo_full');
    // Auto-save timer
    this.saveTimer+=dt; if(this.saveTimer>15){ this.saveTimer=0; this.save(); }
    // Check death
    if(this.ship.hp<=0){
      this.onDeath();
    }
  }
  updateShip(dt){
    const k=this.keys;
    // rotation toward mouse
    const worldMouse=this.screenToWorld(this.mouse.x,this.mouse.y);
    const dx=worldMouse.x - this.ship.x; const dy=worldMouse.y - this.ship.y;
    const targetAngle=Math.atan2(dy,dx);
    // smooth rotate
    let diff=targetAngle - this.ship.angle;
    while(diff>Math.PI) diff-=Math.PI*2;
    while(diff<-Math.PI) diff+=Math.PI*2;
    this.ship.angle+=diff*0.18;

    // thrust
    const thrust= (k['w']||k['arrowup'])?1:0;
    const brake= (k['s']||k['arrowdown'])?1:0;
    const strafeL=(k['a']||k['arrowleft'])?1:0;
    const strafeR=(k['d']||k['arrowright'])?1:0;
    const boost=k['shift']?1.7:1;
    const speedMult=this.ship.engineMult*boost;

    const baseAccel=380 * this.ship.engineMult;
    const maxSpeedBase=this.shipDef.speed * this.ship.engineMult;

    if(thrust){
      const ax=Math.cos(this.ship.angle)*baseAccel; const ay=Math.sin(this.ship.angle)*baseAccel;
      this.ship.vx+=ax*dt; this.ship.vy+=ay*dt;
      // engine particles
      if(Math.random()<0.6){
        const offX = -Math.cos(this.ship.angle)*22; const offY=-Math.sin(this.ship.angle)*22;
        const side=rand(-6,6); const sx=Math.cos(this.ship.angle+Math.PI/2)*side; const sy=Math.sin(this.ship.angle+Math.PI/2)*side;
        this.particles.push(new Particle(this.ship.x+offX+sx, this.ship.y+offY+sy, -Math.cos(this.ship.angle)*rand(80,160)+rand(-20,20), -Math.sin(this.ship.angle)*rand(80,160)+rand(-20,20), 0.4, thrust? (boost>1?'#00e5ff':'#ffb84a') : '#ff9a2c', rand(3,6)));
      }
      if(Math.random()<0.12) this.particles.push(new Particle(this.ship.x -Math.cos(this.ship.angle)*26, this.ship.y -Math.sin(this.ship.angle)*26, rand(-30,30), rand(-30,30), 0.25, '#ffffff', 2));
    }
    if(brake){
      this.ship.vx*=Math.pow(0.55,dt*4); this.ship.vy*=Math.pow(0.55,dt*4);
    }
    if(strafeL){
      const ax=Math.cos(this.ship.angle-Math.PI/2)*baseAccel*0.6; const ay=Math.sin(this.ship.angle-Math.PI/2)*baseAccel*0.6;
      this.ship.vx+=ax*dt; this.ship.vy+=ay*dt;
    }
    if(strafeR){
      const ax=Math.cos(this.ship.angle+Math.PI/2)*baseAccel*0.6; const ay=Math.sin(this.ship.angle+Math.PI/2)*baseAccel*0.6;
      this.ship.vx+=ax*dt; this.ship.vy+=ay*dt;
    }
    // friction in space slight
    this.ship.vx*=Math.pow(0.985, dt*60); this.ship.vy*=Math.pow(0.985, dt*60);
    // clamp speed
    const spd=Math.hypot(this.ship.vx,this.ship.vy);
    const maxSpd = maxSpeedBase * (boost>1?1.25:1);
    if(spd>maxSpd){ this.ship.vx*=maxSpd/spd; this.ship.vy*=maxSpd/spd; }
    this.ship.x+=this.ship.vx*dt; this.ship.y+=this.ship.vy*dt;
    // world bounds bounce
    const b=this.worldSize/2;
    if(this.ship.x < -b){ this.ship.x=-b; this.ship.vx*=-0.6; }
    if(this.ship.x > b){ this.ship.x=b; this.ship.vx*=-0.6; }
    if(this.ship.y < -b){ this.ship.y=-b; this.ship.vy*=-0.6; }
    if(this.ship.y > b){ this.ship.y=b; this.ship.vy*=-0.6; }

    // energy drain for boost
    if(boost>1 && thrust) this.ship.energy=clamp(this.ship.energy - 8*dt,0,this.ship.maxEnergy);

    // ship-asteroid collision (push)
    for(const a of this.asteroids){
      const d=Math.hypot(this.ship.x-a.x, this.ship.y-a.y);
      const minDist=a.r+18;
      if(d<minDist && d>0.1){
        const nx=(this.ship.x-a.x)/d; const ny=(this.ship.y-a.y)/d;
        const overlap=minDist-d;
        this.ship.x+=nx*overlap; this.ship.y+=ny*overlap;
        // bounce
        const dot=this.ship.vx*nx + this.ship.vy*ny;
        this.ship.vx-=nx*dot*1.1; this.ship.vy-=ny*dot*1.1;
        // damage if high speed
        const impact=Math.abs(dot);
        if(impact>120){
          const dmg=Math.floor(impact*0.04);
          this.damageShip(dmg, 'asteroid');
          this.screenShake=Math.min(8, impact*0.02);
          // sparks
          for(let i=0;i<5;i++) this.particles.push(new Particle(this.ship.x-nx*10, this.ship.y-ny*10, nx*rand(-80,80)-ny*rand(30,60), ny*rand(-80,80)+nx*rand(30,60), 0.3, '#ffcc66', 3));
        }
      }
    }
  }
  updateMining(dt){
    const isMining=this.mouse.down || this.keys[' '];
    if(!isMining){ this.miningTarget=null; return; }
    if(this.ship.energy<=2){ this.toast('Low energy', '#00e5ff'); return; }
    // ray toward mouse
    const worldMouse=this.screenToWorld(this.mouse.x,this.mouse.y);
    const dx=worldMouse.x - this.ship.x; const dy=worldMouse.y - this.ship.y;
    const mouseDist=Math.hypot(dx,dy);
    const dirX=mouseDist>0?dx/mouseDist:0; const dirY=mouseDist>0?dy/mouseDist:0;
    const maxRange=420;
    // find closest asteroid intersecting ray
    let best=null; let bestDist=Infinity;
    for(const a of this.asteroids){
      // vector to asteroid
      const ax=a.x - this.ship.x; const ay=a.y - this.ship.y;
      const proj = ax*dirX + ay*dirY; // projection along ray
      if(proj<0 || proj>maxRange) continue;
      const closestX=this.ship.x + dirX*proj; const closestY=this.ship.y + dirY*proj;
      const d=Math.hypot(a.x-closestX, a.y-closestY);
      if(d < a.r+6){
        if(proj<bestDist){ bestDist=proj; best=a; }
      }
    }
    this.miningTarget=best;
    this.miningBeam={x:worldMouse.x, y:worldMouse.y, hit:best?{x:best.x,y:best.y}:null, dist:bestDist};
    if(best){
      // consume energy
      const energyCost = 9 * dt * (1 - (this.ship.laserSpeed-1)*0.4); // efficiency reduces cost
      this.ship.energy=clamp(this.ship.energy - energyCost,0,this.ship.maxEnergy);
      // damage per tick: base 85 dps * power * speed
      const dps= 38 * this.ship.laserPower * this.ship.laserSpeed;
      const dmg= dps * dt;
      best.hp-=dmg;
      best.hitFlash=1;
      // mining particles at impact
      if(Math.random()<0.55){
        const ang=Math.atan2(best.y-this.ship.y, best.x-this.ship.x)+rand(-0.3,0.3);
        this.particles.push(new Particle(best.x+Math.cos(ang+Math.PI)*best.r*0.5, best.y+Math.sin(ang+Math.PI)*best.r*0.5, Math.cos(ang)*rand(40,90), Math.sin(ang)*rand(40,90), 0.35, RES_MAP[best.primary].glow, rand(3,5)));
      }
      // beam sparks
      if(Math.random()<0.35){
        this.particles.push(new Particle(best.x+rand(-6,6), best.y+rand(-6,6), rand(-60,60), rand(-60,60), 0.25, '#ffffff', 2.5));
        this.particles.push(new Particle(best.x, best.y, rand(-40,40), rand(-40,40), 0.2, '#ffcc33', 2));
      }
      if(best.hp<=0){
        this.destroyAsteroid(best);
      }
    } else {
      // still drain small energy if firing into void
      this.ship.energy=clamp(this.ship.energy - 2*dt,0,this.ship.maxEnergy);
    }
  }
  destroyAsteroid(ast){
    // remove
    const idx=this.asteroids.indexOf(ast); if(idx>=0) this.asteroids.splice(idx,1);
    // explosion
    const col=RES_MAP[ast.primary].color;
    for(let i=0;i<14;i++){
      this.particles.push(new Particle(ast.x,ast.y, rand(-180,180), rand(-180,180), rand(0.4,0.8), choice([col,'#ffaa3a','#ffffff']), rand(4,8)));
    }
    for(let i=0;i<6;i++){
      this.particles.push(new Particle(ast.x+rand(-10,10), ast.y+rand(-10,10), rand(-60,60), rand(-60,60), 0.5, '#888888', rand(3,5)));
    }
    this.screenShake=Math.min(10, ast.r*0.12);
    // spawn resource entities
    const total=ast.qty;
    // determine resource mix: 70% primary, 30% secondary random from sector pool
    const sec=this.getSector();
    for(let i=0;i<total;i++){
      let resId=ast.primary;
      if(Math.random()<0.3){
        const pick=choice(sec.resources);
        resId=pick[0];
      }
      // occasional rare upgrade chance
      if(ast.rich && Math.random()<0.08){
        // pick a rare from global rare pool
        resId=choice(['void_crystal','dark_matter','quantum_core','iridium','plasma_ore']);
      }
      const ang=rand(0,Math.PI*2); const spd=rand(40,120);
      this.resourcesEnt.push({
        x:ast.x+rand(-ast.r*0.3,ast.r*0.3), y:ast.y+rand(-ast.r*0.3,ast.r*0.3),
        vx:Math.cos(ang)*spd + ast.vx*0.5, vy:Math.sin(ang)*spd + ast.vy*0.5,
        resId, life:22, collected:false, magnet:0
      });
    }
    // xp
    this.addXP(Math.floor(ast.maxHp*0.6 + (ast.rich?15:0)));
    // if no asteroids left, spawn a few more quickly
    if(this.asteroids.length<8) this.spawnAsteroids(6);
  }
  updateResources(dt){
    const attractRadius= 90 * this.ship.collectorMult; // base 90
    const magnetSpeed= 520 * this.ship.collectorMult;
    for(let i=this.resourcesEnt.length-1;i>=0;i--){
      const r=this.resourcesEnt[i];
      r.x+=r.vx*dt; r.y+=r.vy*dt;
      r.vx*=Math.pow(0.96, dt*60); r.vy*=Math.pow(0.96, dt*60);
      r.life-=dt; if(r.life<=0){ this.resourcesEnt.splice(i,1); continue; }
      const d=Math.hypot(r.x-this.ship.x, r.y-this.ship.y);
      // auto magnet if within radius or if 'E' held? we do always magnet within radius, plus E extends
      const wantCollect = this.keys['e'] ? d<260 : d<attractRadius;
      if(wantCollect){
        const ang=Math.atan2(this.ship.y - r.y, this.ship.x - r.x);
        const pull=magnetSpeed*dt;
        r.vx+=Math.cos(ang)*pull*dt*8; r.vy+=Math.sin(ang)*pull*dt*8;
        // direct lerp when close
        if(d<28){
          // try to add to cargo
          if(this.cargoUsed < this.ship.maxCargo){
            this.addResource(r.resId,1);
            // collection effect
            this.particles.push(new Particle(this.ship.x,this.ship.y, rand(-40,40), rand(-40,40), 0.4, RES_MAP[r.resId].glow, 5));
            this.resourcesEnt.splice(i,1);
            continue;
          } else {
            // cargo full - bounce
            r.vx*=-0.3; r.vy*=-0.3;
            if(Math.random()<0.05) this.toast('Cargo full! Press [T] to sell', '#ffb800');
          }
        }
      }
      // resource-asteroid collision bounce tiny
      for(const a of this.asteroids){
        const da=Math.hypot(r.x-a.x, r.y-a.y);
        if(da < a.r+8){ const nx=(r.x-a.x)/da, ny=(r.y-a.y)/da; r.x=a.x+nx*(a.r+10); r.y=a.y+ny*(a.r+10); r.vx+=nx*60; r.vy+=ny*60; }
      }
    }
  }
  tryCollect(){
    // manual collection already handled via E magnet, but also instant pickup radius 120
    let collected=0;
    for(let i=this.resourcesEnt.length-1;i>=0;i--){
      const r=this.resourcesEnt[i];
      const d=Math.hypot(r.x-this.ship.x, r.y-this.ship.y);
      if(d<140 && this.cargoUsed<this.ship.maxCargo){
        this.addResource(r.resId,1);
        this.resourcesEnt.splice(i,1);
        collected++;
      }
    }
    if(collected>0) this.toast(`Collected ${collected} resources`);
  }
  addResource(id, amt){
    this.inventory[id]=(this.inventory[id]||0)+amt;
    this.cargoUsed+=amt;
    this.achieve('first_ore');
    this.save();
  }
  sellAll(){
    let total=0; let count=0;
    for(const [id,amt] of Object.entries(this.inventory)){
      const v=RES_MAP[id].value;
      // sector market multiplier: higher sectors pay more for rare
      const secMult=1 + (this.sectorId-1)*0.08;
      const rarityMult=1 + (RES_MAP[id].rarity-1)*0.12;
      const value=Math.floor(v * secMult * rarityMult);
      total+=value*amt; count+=amt;
    }
    if(count===0){ this.toast('No cargo to sell'); return; }
    this.credits+=total; this.inventory={}; this.cargoUsed=0;
    this.addXP(Math.floor(total*0.08));
    this.toast(`Sold ${count} units for ${total} CR`, '#ffb800');
    // sell effect
    for(let i=0;i<10;i++) this.particles.push(new Particle(this.ship.x, this.ship.y, rand(-120,120), rand(-120,120), 0.6, '#ffb800', 5));
    if(this.credits>=10000) this.achieve('rich');
    this.save(); this.updateHUD();
  }

  // ---- Drones ----
  buyDrone(){
    const price= 500 * Math.pow(1.75, this.drones.length);
    const p=Math.floor(price);
    if(this.drones.length >= (3 + this.ship.droneCap*1) ) { this.toast('Drone bay full - upgrade Drone Command'); return; }
    if(this.credits < p){ this.toast(`Need ${p} CR`,'#ffb800'); return; }
    this.credits-=p; this.createDrone(); this.save(); this.toast('Drone deployed','00e5ff'); this.achieve('first_drone');
  }
  createDrone(){
    const d={
      x:this.ship.x+rand(-40,40), y:this.ship.y+rand(-40,40),
      vx:0, vy:0, angle:0, state:'seek', target:null, cargo:{}, cargoUsed:0, maxCargo:12, mineTimer:0, returnTimer:0, img:choice(['drone_miner.png','drone_miner.png','drone_hauler.png'])
    };
    this.drones.push(d);
  }
  updateDrones(dt){
    const speedBase=110 * this.ship.droneSpeed;
    const minePower= 35 * this.ship.droneSpeed;
    for(const dr of this.drones){
      // states: seek -> move to asteroid -> mine -> collect -> return
      if(dr.state==='seek'){
        // find nearest asteroid
        let best=null; let bestD=Infinity;
        for(const a of this.asteroids){
          const d=Math.hypot(a.x-dr.x, a.y-dr.y);
          if(d<bestD && d<900){ bestD=d; best=a; }
        }
        if(best){ dr.target=best; dr.state='approach'; }
        else {
          // wander near ship
          dr.vx+=rand(-20,20)*dt; dr.vy+=rand(-20,20)*dt;
          // orbit ship
          const ang=Math.atan2(dr.y-this.ship.y, dr.x-this.ship.x);
          dr.vx+=Math.cos(ang+Math.PI/2)*10*dt; dr.vy+=Math.sin(ang+Math.PI/2)*10*dt;
        }
      } else if(dr.state==='approach'){
        if(!dr.target || !this.asteroids.includes(dr.target)){ dr.state='seek'; dr.target=null; continue; }
        const dx=dr.target.x - dr.x, dy=dr.target.y - dr.y; const d=Math.hypot(dx,dy);
        const ang=Math.atan2(dy,dx); dr.angle=ang;
        const spd=speedBase;
        dr.vx+=Math.cos(ang)*spd*dt*3; dr.vy+=Math.sin(ang)*spd*dt*3;
        dr.vx*=Math.pow(0.96,dt*60); dr.vy*=Math.pow(0.96,dt*60);
        dr.x+=dr.vx*dt; dr.y+=dr.vy*dt;
        if(d < dr.target.r+22){
          dr.state='mine'; dr.mineTimer=0;
        }
        // avoid asteroids
        for(const a of this.asteroids){
          if(a===dr.target) continue;
          const da=Math.hypot(dr.x-a.x, dr.y-a.y);
          if(da < a.r+18){ const nx=(dr.x-a.x)/da, ny=(dr.y-a.y)/da; dr.x+=nx*2; dr.y+=ny*2; dr.vx+=nx*40*dt; dr.vy+=ny*40*dt; }
        }
      } else if(dr.state==='mine'){
        if(!dr.target || !this.asteroids.includes(dr.target)){ dr.state='seek'; continue; }
        dr.mineTimer+=dt;
        // face asteroid
        dr.angle=Math.atan2(dr.target.y-dr.y, dr.target.x-dr.x);
        // mining beam visual particles
        if(Math.random()<0.4){
          const mx=lerp(dr.x, dr.target.x, 0.5)+rand(-4,4); const my=lerp(dr.y, dr.target.y,0.5)+rand(-4,4);
          this.particles.push(new Particle(mx,my, rand(-20,20), rand(-20,20), 0.25, '#00e5ff', 2));
        }
        // damage asteroid
        if(dr.mineTimer>0.18){
          dr.mineTimer=0;
          dr.target.hp-=minePower*0.18;
          dr.target.hitFlash=1;
          this.particles.push(new Particle(dr.target.x+rand(-8,8), dr.target.y+rand(-8,8), rand(-40,40), rand(-40,40), 0.2, RES_MAP[dr.target.primary].glow, 3));
          if(dr.target.hp<=0){
            // collect immediately into drone cargo if space, else spawn resources
            const ast=dr.target;
            // drone collects portion
            const take=Math.min(ast.qty, dr.maxCargo - dr.cargoUsed);
            if(take>0){
              // mix resources similar to destroy
              for(let i=0;i<take;i++){
                let rid=ast.primary; if(Math.random()<0.3) rid=choice(this.getSector().resources)[0];
                dr.cargo[rid]=(dr.cargo[rid]||0)+1; dr.cargoUsed++;
              }
              ast.qty-=take;
              // if still qty left, spawn remainder as entities
              if(ast.qty>0){
                this.destroyAsteroid(ast); // will spawn remainder but we already took some, adjust by removing some spawned
                // remove some of spawned to account for drone taking - crude: remove 'take' from resourcesEnt tail
                for(let i=0;i<take && this.resourcesEnt.length>0;i++) this.resourcesEnt.pop();
              } else {
                // fully consumed
                const idx=this.asteroids.indexOf(ast); if(idx>=0) this.asteroids.splice(idx,1);
                this.addXP(Math.floor(ast.maxHp*0.6));
                for(let i=0;i<8;i++) this.particles.push(new Particle(ast.x,ast.y, rand(-120,120), rand(-120,120), 0.5, RES_MAP[ast.primary].glow, 4));
              }
            } else {
              // drone full -> destroy normally and drone will return
              this.destroyAsteroid(ast);
            }
            dr.state='return';
          }
        }
        // if drone cargo full, return
        if(dr.cargoUsed>=dr.maxCargo) dr.state='return';
      } else if(dr.state==='return'){
        const dx=this.ship.x - dr.x, dy=this.ship.y - dr.y; const d=Math.hypot(dx,dy);
        const ang=Math.atan2(dy,dx); dr.angle=ang;
        const spd=speedBase*1.15;
        dr.vx+=Math.cos(ang)*spd*dt*3; dr.vy+=Math.sin(ang)*spd*dt*3;
        dr.vx*=Math.pow(0.96,dt*60); dr.vy*=Math.pow(0.96,dt*60);
        dr.x+=dr.vx*dt; dr.y+=dr.vy*dt;
        if(d<34){
          // transfer cargo to ship if space
          let transferred=0;
          for(const [id,amt] of Object.entries(dr.cargo)){
            const space=this.ship.maxCargo - this.cargoUsed;
            if(space<=0) break;
            const take=Math.min(amt, space);
            this.addResource(id, take);
            dr.cargo[id]-=take; dr.cargoUsed-=take; transferred+=take;
            if(dr.cargo[id]<=0) delete dr.cargo[id];
          }
          if(transferred>0) this.toast(`Drone delivered ${transferred} units`, '#00e5ff');
          // if still has cargo but ship full, hover nearby
          if(dr.cargoUsed>0){
            // jostle
            dr.x+=rand(-20,20); dr.y+=rand(-20,20);
          } else {
            dr.state='seek'; dr.target=null;
          }
        }
      }
      // clamp speed
      const sp=Math.hypot(dr.vx,dr.vy);
      const maxSp=speedBase*1.2;
      if(sp>maxSp){ dr.vx*=maxSp/sp; dr.vy*=maxSp/sp; }
      // world bounds
      const b=this.worldSize/2;
      if(dr.x<-b) dr.x=-b+10; if(dr.x>b) dr.x=b-10;
      if(dr.y<-b) dr.y=-b+10; if(dr.y>b) dr.y=b-10;
    }
  }

  // ---- Enemies ----
  spawnEnemy(){
    const sec=this.getSector();
    // weighted pick
    let total=sec.enemies.reduce((s,e)=>s+e.weight,0); let r=Math.random()*total; let pick=null;
    for(const e of sec.enemies){ r-=e.weight; if(r<=0){ pick=e.type; break; } }
    if(!pick) pick=sec.enemies[0].type;
    const def=ENEMIES_DEF[pick];
    const ang=rand(0,Math.PI*2); const distSpawn=rand(700,1100);
    const x=this.ship.x+Math.cos(ang)*distSpawn; const y=this.ship.y+Math.sin(ang)*distSpawn;
    // avoid spawning inside asteroid
    let ok=true; for(const a of this.asteroids) if(Math.hypot(x-a.x,y-a.y)<a.r+40) ok=false;
    if(!ok) return;
    this.enemies.push({
      type:pick, x,y, vx:0,vy:0, hp:def.hp, maxHp:def.hp, angle:ang, state:'patrol', stateTimer:rand(1,3), shootCooldown:rand(0.5,1.2), img:def.img
    });
  }
  updateEnemies(dt){
    for(let i=this.enemies.length-1;i>=0;i--){
      const e=this.enemies[i]; const def=ENEMIES_DEF[e.type];
      const dToShip=Math.hypot(e.x-this.ship.x, e.y-this.ship.y);
      // state machine
      if(dToShip<520) e.state='chase';
      else if(dToShip>900 && e.state==='chase') e.state='patrol';
      // movement
      if(e.state==='chase'){
        const ang=Math.atan2(this.ship.y - e.y, this.ship.x - e.x);
        e.angle=lerp(e.angle, ang, 0.08);
        const spd=def.speed;
        e.vx+=Math.cos(e.angle)*spd*dt*2.5; e.vy+=Math.sin(e.angle)*spd*dt*2.5;
        // shooting
        e.shootCooldown-=dt;
        if(e.shootCooldown<=0 && dToShip<580){
          e.shootCooldown= (e.type==='sentinel'?1.8 : e.type==='heavy'?1.1 : e.type==='plasma'?0.7 : 0.9) * (1 - Math.min(0.2, this.ship.weaponMult*0.02));
          this.enemyShoot(e);
        }
      } else {
        e.stateTimer-=dt;
        if(e.stateTimer<=0){ e.angle+=rand(-1.2,1.2); e.stateTimer=rand(1.5,3.5); }
        e.vx+=Math.cos(e.angle)*def.speed*0.5*dt; e.vy+=Math.sin(e.angle)*def.speed*0.5*dt;
      }
      e.vx*=Math.pow(0.97,dt*60); e.vy*=Math.pow(0.97,dt*60);
      e.x+=e.vx*dt; e.y+=e.vy*dt;
      // avoid asteroids
      for(const a of this.asteroids){
        const da=Math.hypot(e.x-a.x, e.y-a.y);
        if(da < a.r+ e.size*0.6){ const nx=(e.x-a.x)/da, ny=(e.y-a.y)/da; e.x+=nx*2; e.y+=ny*2; e.vx+=nx*50*dt; e.vy+=ny*50*dt; }
      }
      // enemy vs ship collision
      if(dToShip < 30){
        this.damageShip(def.dmg*dt*1.2, 'enemy');
        // knockback
        const nx=(this.ship.x-e.x)/dToShip, ny=(this.ship.y-e.y)/dToShip;
        this.ship.vx+=nx*140*dt*10; this.ship.vy+=ny*140*dt*10;
      }
      // check if enemy hit by player projectiles handled in updateProjectiles
      // despawn if far
      if(dToShip>2200){ this.enemies.splice(i,1); continue; }
      // death
      if(e.hp<=0){
        this.killEnemy(e,i);
      }
    }
    // player shooting
    this.updatePlayerShooting(dt);
  }
  enemyShoot(e){
    const def=ENEMIES_DEF[e.type];
    const ang=Math.atan2(this.ship.y - e.y, this.ship.x - e.x)+rand(-0.12,0.12);
    const spd= 420;
    const offset= e.size*0.5;
    this.projectiles.push({
      x:e.x+Math.cos(ang)*offset, y:e.y+Math.sin(ang)*offset,
      vx:Math.cos(ang)*spd + e.vx*0.3, vy:Math.sin(ang)*spd + e.vy*0.3,
      dmg:def.dmg, life:2.2, hostile:true, color:def.color, size:4
    });
    // muzzle flash
    this.particles.push(new Particle(e.x+Math.cos(ang)*offset, e.y+Math.sin(ang)*offset, Math.cos(ang)*60, Math.sin(ang)*60, 0.18, def.color, 6));
  }
  playerShootingCD=0;
  updatePlayerShooting(dt){
    this.playerShootingCD=Math.max(0,this.playerShootingCD-dt);
    const wantShoot = this.mouse.down && this.miningTarget===null; // shoot when not mining (i.e., no asteroid under cursor) or with right click? We'll allow shooting with LMB when not mining, and also with key 'f'
    const pressF=this.keys['f'];
    if((wantShoot || pressF) && this.playerShootingCD<=0 && this.ship.energy>4){
      // fire from ship nose
      const ang=this.ship.angle;
      const spd=640;
      this.projectiles.push({
        x:this.ship.x+Math.cos(ang)*24, y:this.ship.y+Math.sin(ang)*24,
        vx:Math.cos(ang)*spd + this.ship.vx*0.4, vy:Math.sin(ang)*spd + this.ship.vy*0.4,
        dmg: Math.floor(18 * this.ship.weaponMult), life:1.6, hostile:false, color:'#00e5ff', size:5
      });
      this.playerShootingCD= 0.22 * (1 - (this.ship.weaponMult-1)*0.18);
      this.ship.energy=clamp(this.ship.energy-4,0,this.ship.maxEnergy);
      this.particles.push(new Particle(this.ship.x+Math.cos(ang)*28, this.ship.y+Math.sin(ang)*28, Math.cos(ang)*80, Math.sin(ang)*80, 0.14, '#ffffff', 4));
      // recoil
      this.ship.vx-=Math.cos(ang)*18; this.ship.vy-=Math.sin(ang)*18;
    }
  }
  updateProjectiles(dt){
    for(let i=this.projectiles.length-1;i>=0;i--){
      const p=this.projectiles[i];
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
      if(p.life<=0){ this.projectiles.splice(i,1); continue; }
      // trail
      if(Math.random()<0.4) this.particles.push(new Particle(p.x,p.y, rand(-20,20), rand(-20,20), 0.22, p.color, 2.5));
      // check hit
      if(p.hostile){
        const d=Math.hypot(p.x-this.ship.x, p.y-this.ship.y);
        if(d<18){
          this.damageShip(p.dmg, 'projectile');
          this.particles.push(new Particle(p.x,p.y, rand(-80,80), rand(-80,80), 0.3, p.color, 6));
          this.projectiles.splice(i,1);
          continue;
        }
        // hit asteroids also block
        for(const a of this.asteroids){
          if(Math.hypot(p.x-a.x,p.y-a.y)<a.r){
            this.particles.push(new Particle(p.x,p.y, rand(-60,60), rand(-60,60), 0.2, '#ffcc66', 4));
            this.projectiles.splice(i,1); break;
          }
        }
      } else {
        // player projectile vs enemies
        for(let j=this.enemies.length-1;j>=0;j--){
          const e=this.enemies[j]; const def=ENEMIES_DEF[e.type];
          const d=Math.hypot(p.x-e.x, p.y-e.y);
          if(d < def.size*0.5 + p.size){
            e.hp-=p.dmg;
            e.vx+=p.vx*0.08; e.vy+=p.vy*0.08;
            this.particles.push(new Particle(p.x,p.y, rand(-60,60), rand(-60,60), 0.25, '#00e5ff', 4));
            this.particles.push(new Particle(p.x,p.y, rand(-40,40), rand(-40,40), 0.18, '#ffffff', 3));
            this.projectiles.splice(i,1);
            // hit flash could be
            this.screenShake=Math.min(6, p.dmg*0.15);
            break;
          }
        }
        // vs asteroids - minor damage?
        for(const a of this.asteroids){
          if(Math.hypot(p.x-a.x,p.y-a.y)<a.r+4){
            a.hp-=p.dmg*0.5; a.hitFlash=1;
            this.particles.push(new Particle(p.x,p.y, rand(-40,40), rand(-40,40), 0.2, '#ffcc66', 3));
            this.projectiles.splice(i,1);
            if(a.hp<=0) this.destroyAsteroid(a);
            break;
          }
        }
      }
      if(p.x < -this.worldSize/2-300 || p.x>this.worldSize/2+300 || p.y < -this.worldSize/2-300 || p.y>this.worldSize/2+300) this.projectiles.splice(i,1);
    }
  }
  damageShip(amt, source){
    if(this.ship.shield>0){
      const absorbed=Math.min(this.ship.shield, amt);
      this.ship.shield-=absorbed; amt-=absorbed;
      this.screenShake=Math.min(7, absorbed*0.25);
      // shield impact effect
      this.particles.push(new Particle(this.ship.x,this.ship.y, rand(-60,60), rand(-60,60), 0.3, '#7a6cff', 12));
      this.ship.shieldRegenTimer=3;
    }
    if(amt>0){
      this.ship.hp-=amt;
      this.ship.shieldRegenTimer=3;
      this.screenShake=Math.min(9, amt*0.35);
      this.particles.push(new Particle(this.ship.x,this.ship.y, rand(-40,40), rand(-40,40), 0.25, '#ff3b5b', 8));
    }
  }
  shieldBurst(){
    if(this.ship.energy<30){ this.toast('Insufficient energy for shield burst'); return; }
    if(this.ship.shieldBurstCD>0) return;
    this.ship.energy-=30; this.ship.shield=clamp(this.ship.shield+35,0,this.ship.maxShield);
    this.ship.shieldBurstCD=8;
    // pulse
    for(let i=0;i<18;i++){
      const ang=rand(0,Math.PI*2); this.particles.push(new Particle(this.ship.x,this.ship.y, Math.cos(ang)*rand(80,180), Math.sin(ang)*rand(80,180), 0.6, '#7a6cff', 5));
    }
    this.toast('Shield burst!');
  }
  killEnemy(e, idx){
    this.enemies.splice(idx,1);
    const def=ENEMIES_DEF[e.type];
    // credits & xp
    this.credits+=def.reward; this.addXP(def.xp);
    this.toast(`+${def.reward} CR - ${def.name} destroyed`, def.color);
    this.achieve('enemy_kill');
    // explosion
    for(let i=0;i<20;i++) this.particles.push(new Particle(e.x,e.y, rand(-200,200), rand(-200,200), rand(0.5,0.9), choice([def.color,'#ffaa3a','#ffffff']), rand(5,9)));
    this.screenShake=Math.min(12, def.hp*0.08);
    // drop resources chance
    if(Math.random()<0.6){
      const rid=choice(['iron','copper','titanium','plasma_ore','crystal'] );
      this.resourcesEnt.push({x:e.x,y:e.y,vx:rand(-60,60),vy:rand(-60,60),resId:rid,life:18, collected:false});
    }
    this.save();
  }
  updateHazards(dt){
    const sec=this.getSector();
    if(sec.env==='storm'){
      // lightning periodic hazard near player if in storm area (whole world is storm, but occasional strike)
      if(Math.random()<0.008){
        const lx=this.ship.x+rand(-600,600), ly=this.ship.y+rand(-600,600);
        // strike effect
        for(let i=0;i<12;i++) this.particles.push(new Particle(lx+rand(-20,20), ly+rand(-20,20), rand(-100,100), rand(-100,100), 0.4, '#ffff7a', rand(3,6)));
        // damage if close
        const d=Math.hypot(lx-this.ship.x, ly-this.ship.y);
        if(d<180) this.damageShip(14,'plasma storm');
        this.screenShake=5;
      }
    } else if(sec.env==='void'){
      // void pulses
      if(Math.random()<0.005){
        for(let i=0;i<10;i++) this.particles.push(new Particle(this.ship.x+rand(-300,300), this.ship.y+rand(-300,300), rand(-40,40), rand(-40,40), 0.7, '#b450ff', 4));
      }
    }
  }
  onDeath(){
    this.ship.hp=this.ship.maxHp; this.ship.shield=this.ship.maxShield; this.ship.energy=this.ship.maxEnergy;
    this.ship.x=0; this.ship.y=0; this.ship.vx=0; this.ship.vy=0;
    // lose some cargo
    const lost=Math.floor(this.cargoUsed*0.25);
    if(lost>0){
      // remove random resources
      let toRemove=lost;
      for(const id of Object.keys(this.inventory)){
        const amt=this.inventory[id];
        const take=Math.min(amt, Math.ceil(toRemove * Math.random()));
        this.inventory[id]-=take; if(this.inventory[id]<=0) delete this.inventory[id];
        toRemove-=take; if(toRemove<=0) break;
      }
      this.cargoUsed=Math.max(0, this.cargoUsed-lost);
      this.toast(`Ship destroyed! Lost ${lost} cargo - respawned`, '#ff3b5b');
    } else {
      this.toast('Ship destroyed! Respawning...', '#ff3b5b');
    }
    this.screenShake=14;
    for(let i=0;i<30;i++) this.particles.push(new Particle(this.ship.x,this.ship.y, rand(-220,220), rand(-220,220), rand(0.6,1), choice(['#ff3b5b','#ff9a2c','#ffffff']), rand(6,10)));
    this.save();
  }

  // ---- UI Renderers ----
  renderInventory(){
    const grid=document.getElementById('inv-grid'); grid.innerHTML='';
    let totalVal=0;
    for(const r of RESOURCES){
      const amt=this.inventory[r.id]||0;
      if(amt===0) continue;
      const el=document.createElement('div'); el.className='inv-item';
      el.innerHTML=`<img src="${ASSET(r.icon)}"><div class="meta"><div class="name">${r.name}</div><div class="amt">${amt} units</div></div><div class="val">${r.value} CR</div>`;
      grid.appendChild(el);
      totalVal+= amt * r.value;
    }
    if(grid.innerHTML==='') grid.innerHTML='<div style="color:var(--muted);padding:20px;text-align:center">Cargo empty - mine asteroids to collect resources. Autofill via magnet [E] or proximity.</div>';
    document.getElementById('inv-total-value').textContent=totalVal.toLocaleString()+' CR';
  }
  renderUpgrades(){
    const g=document.getElementById('upgrade-grid'); g.innerHTML='';
    for(const u of UPGRADES){
      const lvl=this.upgrades[u.id]||0; const isMax=lvl>=u.max;
      const price=isMax?0: Math.floor(u.base * Math.pow(u.inc, lvl));
      const canAfford=this.credits>=price;
      const card=document.createElement('div'); card.className='upgrade-card'+(isMax?' maxed': (lvl>0?' owned':'' ) );
      card.innerHTML=`
        <div class="upgrade-level">Lv ${lvl}/${u.max}</div>
        <div class="upgrade-icon">${u.icon}</div>
        <h3>${u.name}</h3><p>${u.desc}</p>
        <div class="upgrade-meta"><div class="upgrade-price">${isMax?'MAX':price+' CR'}</div><button class="btn-upgrade" ${isMax||!canAfford?'disabled':''}>${isMax?'MAXED':'UPGRADE'}</button></div>
        <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${(lvl/u.max)*100}%"></div></div>
      `;
      const btn=card.querySelector('button');
      btn.addEventListener('click',()=>{
        if(isMax) return;
        if(this.credits<price){ this.toast('Not enough credits','ffb800'); return; }
        this.credits-=price; this.upgrades[u.id]=(this.upgrades[u.id]||0)+1; this.applyUpgrades(); this.save();
        this.toast(`${u.name} upgraded to Lv ${this.upgrades[u.id]}`,'3a8bff');
        this.renderUpgrades(); this.updateHUD();
      });
      g.appendChild(card);
    }
  }
  renderSectors(){
    const g=document.getElementById('sector-grid'); g.innerHTML='';
    for(const s of SECTORS){
      const unlocked=this.unlockedSectors.includes(s.id);
      const canUnlock=this.level>=s.reqLevel && this.credits>=s.reqCredits;
      const isActive=this.sectorId===s.id;
      const card=document.createElement('div'); card.className='sector-card'+(unlocked?'':' locked')+(isActive?' active':'');
      card.innerHTML=`
        <div class="sector-thumb" style="background-image:url('${ASSET(s.bg)}')"></div>
        <div class="sector-info">
          <div class="sector-name" style="color:${s.color}">${s.name}</div>
          <div class="sector-desc">${s.desc}</div>
          <div class="sector-meta"><span>LVL ${s.reqLevel}+</span><span>${s.reqCredits? s.reqCredits+' CR':'FREE'}</span><span>${s.danger}/5 Danger</span></div>
          <button class="btn-main ${unlocked?'primary':'secondary'}" style="width:100%;margin-top:8px;padding:8px;font-size:12px">${isActive?'CURRENT SECTOR': unlocked?'WARP':'UNLOCK'}</button>
        </div>
      `;
      const btn=card.querySelector('button');
      btn.addEventListener('click',()=>this.unlockSector(s.id));
      g.appendChild(card);
    }
  }
  renderDrones(){
    const g=document.getElementById('drone-grid'); g.innerHTML='';
    const defs=[
      {id:'miner', name:'Miner Drone', desc:'Standard mining drone. Mines asteroids and hauls to ship.', icon:'drone_miner.png'},
      {id:'hauler', name:'Hauler Drone', desc:'Large cargo variant. +50% cargo capacity.', icon:'drone_hauler.png'},
    ];
    for(const d of defs){
      const card=document.createElement('div'); card.className='drone-card';
      card.innerHTML=`<img src="${ASSET(d.icon)}"><div class="drone-stats"><div class="drone-name">${d.name}</div><div class="drone-desc">${d.desc}</div></div>`;
      g.appendChild(card);
    }
    document.getElementById('drone-active-count').textContent=`${this.drones.length} / ${3+this.ship.droneCap}`;
    const price=Math.floor(500 * Math.pow(1.75, this.drones.length));
    document.getElementById('drone-price').textContent=price+' CR';
  }
  renderShop(){
    const g=document.getElementById('ship-grid'); g.innerHTML='';
    for(const s of SHIPS){
      const owned=this.unlockedShips.includes(s.id);
      const isActive=this.activeShip===s.id;
      const card=document.createElement('div'); card.className='ship-card';
      card.style.borderColor=isActive?'var(--accent)':'var(--border)';
      card.innerHTML=`
        <img src="${ASSET(s.icon)}">
        <h3 style="color:${isActive?'var(--accent2)':''}">${s.name} ${isActive?'(ACTIVE)':''}</h3>
        <p>${s.desc}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span style="font-size:11px;color:var(--muted)">Hull ${s.hull} &bull; Cargo ${s.cargo} &bull; Speed ${s.speed}</span>
        </div>
        <button class="btn-main ${owned? (isActive?'secondary':'primary'):'primary'}" style="width:100%;margin-top:10px;padding:10px;font-size:12px">${owned? (isActive?'ACTIVE':'SELECT') : `BUY - ${s.price} CR`}</button>
        ${owned && !isActive?'<div class="ship-owned">Owned</div>':''}
        ${!owned?`<div class="ship-price">${s.price} CR</div>`:''}
      `;
      const btn=card.querySelector('button');
      btn.addEventListener('click',()=>{
        if(!owned){
          if(this.credits < s.price){ this.toast('Not enough credits','ffb800'); return; }
          this.credits-=s.price; this.unlockedShips.push(s.id); this.toast(`Unlocked ${s.name}!`); this.save();
        }
        this.activeShip=s.id; this.applyUpgrades(); this.save(); this.renderShop(); this.updateHUD(); this.updateMenuInfo();
        this.toast(`Selected ${s.name}`,'00e5ff');
      });
      g.appendChild(card);
    }
  }
  renderAchievements(){
    const c=document.getElementById('achievements-body'); c.innerHTML='';
    const grid=document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(2,1fr)'; grid.style.gap='10px';
    for(const a of ACHIEVEMENTS){
      const done=!!this.achievements[a.id];
      const el=document.createElement('div');
      el.style.background=done?'rgba(46,204,113,0.12)':'rgba(255,255,255,0.05)';
      el.style.border='1px solid '+(done?'rgba(46,204,113,0.3)':'var(--border)');
      el.style.borderRadius='12px'; el.style.padding='12px'; el.style.display='flex'; el.style.gap='12px'; el.style.alignItems='center';
      el.innerHTML=`<div style="width:38px;height:38px;border-radius:10px;background:${done?'#2ecc71':'#2a365f'};display:grid;place-items:center;font-weight:900">${done?'✓':'◌'}</div><div><div style="font-weight:800;font-size:13px">${a.name}</div><div style="font-size:11px;color:var(--muted)">${a.desc}</div></div>`;
      grid.appendChild(el);
    }
    c.appendChild(grid);
    const stats=document.createElement('div'); stats.style.marginTop='12px'; stats.style.background='rgba(255,255,255,0.04)'; stats.style.border='1px solid var(--border)'; stats.style.borderRadius='12px'; stats.style.padding='12px';
    stats.innerHTML=`<div style="font-weight:800;font-size:12px">STATISTICS</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:8px;font-size:12px"><div>Level <b>${this.level}</b></div><div>Credits <b>${this.credits}</b></div><div>Sector <b>${this.getSector().name}</b></div><div>Cargo <b>${this.cargoUsed}/${this.ship.maxCargo}</b></div><div>Drones <b>${this.drones.length}</b></div><div>Kills <b>${this.enemies.length}</b></div></div>`;
    c.appendChild(stats);
  }
  achieve(id){
    if(this.achievements[id]) return;
    this.achievements[id]=true;
    const a=ACHIEVEMENTS.find(x=>x.id===id);
    if(a) this.toast(`Achievement: ${a.name}`, '#00e5ff');
    this.save();
  }
  achieveCheck(){
    if(this.level>=5) this.achieve('level5');
  }

  updateHUD(){
    document.getElementById('hud-sector-name').textContent=this.getSector().name.toUpperCase();
    document.getElementById('hud-sector-num').textContent=`SECTOR ${this.sectorId}/5`;
    document.getElementById('hud-level').textContent=this.level;
    document.getElementById('hud-xp').textContent=`${this.xp}/${this.xpNext}`;
    document.getElementById('hud-credits').textContent=this.credits.toLocaleString();
    document.getElementById('hud-cargo').textContent=`${this.cargoUsed} / ${this.ship.maxCargo}`;
    document.getElementById('hud-cargo').style.color=this.cargoUsed>=this.ship.maxCargo?'#ff3b5b':'';
    document.getElementById('hud-drones').textContent=this.drones.length;
    document.getElementById('hud-energy-text').textContent=`${Math.floor(this.ship.energy)}/${this.ship.maxEnergy}`;
    document.getElementById('hud-energy-bar').style.width=(this.ship.energy/this.ship.maxEnergy*100)+'%';
    document.getElementById('hud-shield-text').textContent=`${Math.floor(this.ship.shield)}/${this.ship.maxShield}`;
    document.getElementById('hud-shield-bar').style.width=(this.ship.shield/this.ship.maxShield*100)+'%';
    document.getElementById('hud-hull-text').textContent=`${Math.floor(this.ship.hp)}/${this.ship.maxHp}`;
    document.getElementById('hud-hull-bar').style.width=(this.ship.hp/this.ship.maxHp*100)+'%';
    // cargo preview
    const chips=document.getElementById('hud-resources'); chips.innerHTML='';
    // show top 4 resources in hud
    const entries=Object.entries(this.inventory).sort((a,b)=>b[1]-a[1]).slice(0,5);
    for(const [id,amt] of entries){
      const r=RES_MAP[id];
      const el=document.createElement('div'); el.className='res-chip';
      el.innerHTML=`<img src="${ASSET(r.icon)}"><b>${r.name}</b> x${amt}`;
      chips.appendChild(el);
    }
    if(entries.length===0){ const d=document.createElement('div'); d.style.fontSize='11px'; d.style.color='var(--muted)'; d.textContent='No cargo - mine asteroids'; chips.appendChild(d); }
    this.updateMinimap();
  }
  updateMinimap(){
    const ctx=this.mctx; const s=180;
    ctx.clearRect(0,0,s,s);
    // bg
    ctx.fillStyle='#0e142b'; ctx.fillRect(0,0,s,s);
    // grid
    ctx.strokeStyle='rgba(120,140,200,0.08)'; ctx.lineWidth=1;
    for(let i=0;i<=s;i+=30){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(s,0); ctx.stroke(); }
    // world to minimap: worldSize 3000 -> minimap 180, center is ship
    const scale= s / (this.worldSize*1.15);
    const toMini=(wx,wy)=>({x: s/2 + (wx - this.camera.x)*scale, y: s/2 + (wy - this.camera.y)*scale});
    // asteroids
    for(const a of this.asteroids){
      const p=toMini(a.x,a.y); if(p.x<-10||p.x>s+10||p.y<-10||p.y>s+10) continue;
      ctx.fillStyle=RES_MAP[a.primary].color; ctx.globalAlpha=0.9;
      ctx.beginPath(); ctx.arc(p.x,p.y, Math.max(1.5, a.r*scale*0.9),0,Math.PI*2); ctx.fill();
      // rich glow
      if(a.rich){ ctx.strokeStyle='#ffd700'; ctx.lineWidth=1; ctx.stroke(); }
      if(this.scanActive>0){
        ctx.fillStyle='#ffffff'; ctx.font='7px monospace'; ctx.fillText(a.primary.slice(0,3), p.x+3, p.y-3);
      }
    }
    ctx.globalAlpha=1;
    // resources
    for(const r of this.resourcesEnt){
      const p=toMini(r.x,r.y); if(p.x<0||p.x>s||p.y<0||p.y>s) continue;
      ctx.fillStyle=RES_MAP[r.resId].glow; ctx.beginPath(); ctx.arc(p.x,p.y,2.2,0,Math.PI*2); ctx.fill();
    }
    // enemies red
    for(const e of this.enemies){
      const p=toMini(e.x,e.y); ctx.fillStyle='#ff3b5b'; ctx.beginPath(); ctx.arc(p.x,p.y,3.2,0,Math.PI*2); ctx.fill();
    }
    // drones blue
    for(const d of this.drones){
      const p=toMini(d.x,d.y); ctx.fillStyle='#00e5ff'; ctx.beginPath(); ctx.arc(p.x,p.y,2.8,0,Math.PI*2); ctx.fill();
    }
    // ship
    const sp=toMini(this.ship.x,this.ship.y);
    ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(sp.x,sp.y,4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#00e5ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sp.x,sp.y); ctx.lineTo(sp.x+Math.cos(this.ship.angle)*12, sp.y+Math.sin(this.ship.angle)*12); ctx.stroke();
    // sector name
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='8px monospace'; ctx.fillText(this.getSector().name.toUpperCase(), 6, s-6);
  }

  // ---- Render ----
  render(){
    const ctx=this.ctx; const w=this.viewW, h=this.viewH;
    ctx.clearRect(0,0,w,h);
    ctx.save();
    // screen shake
    if(this.screenShake>0){
      ctx.translate(rand(-this.screenShake, this.screenShake), rand(-this.screenShake, this.screenShake));
    }
    // background - parallax nebula via image + stars
    this.renderBackground(ctx,w,h);
    // world transform (camera)
    ctx.save();
    ctx.translate(w/2 - this.camera.x, h/2 - this.camera.y);

    // space dust parallax (slightly move with camera? static world)
    ctx.fillStyle='rgba(255,255,255,0.15)';
    for(const d of this.dust){
      const s=this.worldToScreen(d.x,d.y);
      // dust already in world coords but we are in world transform now: just draw at world pos with small drift
      ctx.globalAlpha=0.25;
      ctx.fillRect(d.x, d.y, 1.2, 1.2);
    }
    ctx.globalAlpha=1;

    // hazards - plasma storm lines
    const sec=this.getSector();
    if(sec.env==='storm' && Math.random()<0.04){
      ctx.strokeStyle='rgba(255,255,80,0.12)'; ctx.lineWidth=1;
      ctx.beginPath();
      const sx=this.ship.x+rand(-700,700), sy=this.ship.y+rand(-700,700);
      ctx.moveTo(sx,sy); for(let i=0;i<4;i++) ctx.lineTo(sx+rand(-80,80), sy+rand(-80,80));
      ctx.stroke();
    }

    // asteroids
    for(const a of this.asteroids){
      ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.rot);
      const img=this.images.get(ASSET(a.img));
      const sz=a.r*2.2;
      // shadow
      ctx.globalAlpha=0.18; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(8,12, a.r*0.9, a.r*0.7,0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      // asteroid image
      if(img.complete && img.naturalWidth){
        ctx.drawImage(img, -sz/2, -sz/2, sz, sz);
      } else {
        ctx.fillStyle=RES_MAP[a.primary].color; ctx.beginPath(); ctx.arc(0,0,a.r,0,Math.PI*2); ctx.fill();
      }
      // hit flash
      if(a.hitFlash>0){
        ctx.globalAlpha=a.hitFlash*0.35; ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(0,0,a.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      }
      // hardness indicator small bar
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(-a.r, -a.r-10, a.r*2, 4);
      ctx.fillStyle=a.rich?'#ffd700':RES_MAP[a.primary].color; ctx.fillRect(-a.r, -a.r-10, a.r*2*(a.hp/a.maxHp), 4);
      // rich shimmer
      if(a.rich){
        ctx.strokeStyle='rgba(255,215,0,0.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,0,a.r+3,0,Math.PI*2); ctx.stroke();
      }
      // scanner highlight
      if(this.scanActive>0){
        ctx.strokeStyle=RES_MAP[a.primary].glow; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.arc(0,0,a.r+6,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='#ffffff'; ctx.font='10px monospace'; ctx.textAlign='center'; ctx.fillText(a.primary.toUpperCase(),0,-a.r-16);
      }
      ctx.restore();
    }

    // resources
    for(const r of this.resourcesEnt){
      const res=RES_MAP[r.resId];
      const img=this.images.get(ASSET(res.icon));
      ctx.save(); ctx.translate(r.x,r.y);
      // glow
      ctx.globalAlpha=0.35; ctx.fillStyle=res.glow; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      // bobbing
      const bob=Math.sin(this.time*3 + r.x*0.01)*3;
      if(img.complete && img.naturalWidth) ctx.drawImage(img, -16, -16+bob, 32,32);
      else { ctx.fillStyle=res.color; ctx.beginPath(); ctx.arc(0,bob,8,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    }

    // drones
    for(const d of this.drones){
      ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(d.angle);
      const img=this.images.get(ASSET(d.img));
      if(img.complete && img.naturalWidth) ctx.drawImage(img, -22, -22, 44,44);
      else { ctx.fillStyle='#00e5ff'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); }
      // mining beam to target
      if(d.state==='mine' && d.target){
        ctx.restore(); ctx.save(); // need world coords for line
        ctx.strokeStyle='rgba(0,229,255,0.7)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.target.x,d.target.y); ctx.stroke();
        ctx.globalAlpha=0.18; ctx.strokeStyle='#00e5ff'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.target.x,d.target.y); ctx.stroke(); ctx.globalAlpha=1;
        ctx.restore(); continue;
      }
      ctx.restore();
      // drone cargo indicator
      if(d.cargoUsed>0){
        ctx.fillStyle='#ffb800'; ctx.font='9px monospace'; ctx.textAlign='center'; ctx.fillText(`${d.cargoUsed}/${d.maxCargo}`, d.x, d.y-20);
      }
    }

    // enemies
    for(const e of this.enemies){
      const def=ENEMIES_DEF[e.type];
      ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.angle+Math.PI/2);
      const img=this.images.get(ASSET(def.img));
      const sz=def.size*1.4;
      if(img.complete && img.naturalWidth) ctx.drawImage(img, -sz/2, -sz/2, sz,sz);
      else { ctx.fillStyle=def.color; ctx.beginPath(); ctx.arc(0,0,def.size/2,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
      // health bar
      ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(e.x-def.size/2, e.y-def.size/2-14, def.size, 4);
      ctx.fillStyle=def.color; ctx.fillRect(e.x-def.size/2, e.y-def.size/2-14, def.size*(e.hp/def.maxHp),4);
    }

    // projectiles
    for(const p of this.projectiles){
      ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      // trail line
      ctx.strokeStyle=p.color; ctx.globalAlpha=0.5; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*0.05, p.y - p.vy*0.05); ctx.stroke(); ctx.globalAlpha=1;
    }

    // ship
    ctx.save(); ctx.translate(this.ship.x,this.ship.y); ctx.rotate(this.ship.angle);
    // shield bubble if active
    if(this.ship.shield>0){
      ctx.globalAlpha=0.12 + Math.sin(this.time*4)*0.06;
      ctx.strokeStyle='#7a6cff'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=0.06; ctx.fillStyle='#7a6cff'; ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    }
    // engine glow under
    ctx.globalAlpha=0.9;
    // thruster flame when thrusting
    const thrusting=!!(this.keys['w']||this.keys['arrowup']);
    if(thrusting){
      ctx.fillStyle= this.keys['shift'] ? '#00e5ff' : '#ffb84a';
      ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=12;
      ctx.beginPath(); ctx.ellipse(-18,0,10,6,0,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      // inner white
      ctx.fillStyle='#ffffff'; ctx.globalAlpha=0.9; ctx.beginPath(); ctx.ellipse(-18,0,6,3,0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    }
    const shipImg=this.images.get(ASSET(this.shipDef.icon));
    if(shipImg.complete && shipImg.naturalWidth) ctx.drawImage(shipImg, -32, -32, 64,64);
    else {
      ctx.fillStyle='#c8d0e8'; ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-12,-10); ctx.lineTo(-10,0); ctx.lineTo(-12,10); ctx.closePath(); ctx.fill();
    }
    // mining beam origin
    // weapon hardpoints
    ctx.restore();

    // mining beam visual (world space)
    if(this.miningBeam && this.miningTarget){
      const target=this.miningTarget;
      ctx.strokeStyle='#00e5ff'; ctx.lineWidth=2; ctx.shadowColor='#00e5ff'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.moveTo(this.ship.x + Math.cos(this.ship.angle)*18, this.ship.y + Math.sin(this.ship.angle)*18);
      // slight waver
      const mx=target.x + rand(-2,2), my=target.y+rand(-2,2);
      ctx.lineTo(mx,my); ctx.stroke(); ctx.shadowBlur=0;
      // outer glow
      ctx.globalAlpha=0.18; ctx.strokeStyle='#00e5ff'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(this.ship.x, this.ship.y); ctx.lineTo(mx,my); ctx.stroke(); ctx.globalAlpha=1;
      // impact ring
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(target.x,target.y, 10 + Math.sin(this.time*10)*3,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='#00e5ff'; ctx.globalAlpha=0.6; ctx.beginPath(); ctx.arc(target.x,target.y,4,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    } else if(this.miningBeam && !this.miningTarget){
      // firing into void short beam
      const ang=this.ship.angle; const len=220;
      ctx.strokeStyle='rgba(0,229,255,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([6,6]);
      ctx.beginPath(); ctx.moveTo(this.ship.x+Math.cos(ang)*18, this.ship.y+Math.sin(ang)*18); ctx.lineTo(this.ship.x+Math.cos(ang)*len, this.ship.y+Math.sin(ang)*len); ctx.stroke(); ctx.setLineDash([]);
    }

    // particles (world)
    for(const p of this.particles){
      p.draw(ctx);
    }

    // world border
    ctx.strokeStyle='rgba(120,140,220,0.08)'; ctx.lineWidth=2; ctx.setLineDash([12,12]);
    const b=this.worldSize/2; ctx.strokeRect(-b,-b, this.worldSize, this.worldSize); ctx.setLineDash([]);

    ctx.restore(); // world

    // HUD overlays like collection hint
    if(this.cargoUsed>=this.ship.maxCargo){
      ctx.fillStyle='#ff3b5b'; ctx.font='700 13px monospace'; ctx.textAlign='center';
      ctx.fillText('CARGO FULL - PRESS [T] TO SELL', w/2, h-80);
    } else if(this.resourcesEnt.length>0){
      const near=this.resourcesEnt.some(r=>Math.hypot(r.x-this.ship.x, r.y-this.ship.y)<120);
      if(near){ ctx.fillStyle='#00e5ff'; ctx.font='12px monospace'; ctx.textAlign='center'; ctx.fillText('PRESS [E] TO COLLECT  •  HOLD [E] FOR MAGNET', w/2, h-48); }
    }

    // crosshair
    ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=1;
    const cx=this.mouse.x, cy=this.mouse.y;
    ctx.beginPath(); ctx.moveTo(cx-10,cy); ctx.lineTo(cx-4,cy); ctx.moveTo(cx+4,cy); ctx.lineTo(cx+10,cy); ctx.moveTo(cx,cy-10); ctx.lineTo(cx,cy-4); ctx.moveTo(cx,cy+4); ctx.lineTo(cx,cy+10); ctx.stroke();
    ctx.fillStyle=this.miningTarget?'#00e5ff':'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fill();

    ctx.restore(); // screen shake
  }
  renderBackground(ctx,w,h){
    const sec=this.getSector();
    // base
    ctx.fillStyle='#070c1c'; ctx.fillRect(0,0,w,h);
    // parallax nebula tiles - draw two layers based on camera
    const img=this.images.get(ASSET(sec.bg));
    if(img.complete && img.naturalWidth){
      // calculate parallax offset
      const ox= (this.camera.x*0.18) % 512; const oy= (this.camera.y*0.18)%512;
      const cols=Math.ceil(w/512)+2; const rows=Math.ceil(h/512)+2;
      ctx.globalAlpha=0.55;
      for(let y=-1;y<rows;y++) for(let x=-1;x<cols;x++){
        ctx.drawImage(img, x*512 - ox, y*512 - oy, 512,512);
      }
      ctx.globalAlpha=1;
      // second layer subtle
      ctx.globalAlpha=0.18;
      const ox2=(this.camera.x*0.08)%512, oy2=(this.camera.y*0.08)%512;
      for(let y=-1;y<rows;y++) for(let x=-1;x<cols;x++){
        ctx.drawImage(img, x*512 - ox2 + 80, y*512 - oy2 + 60, 512,512);
      }
      ctx.globalAlpha=1;
    }
    // stars parallax
    ctx.fillStyle='#ffffff';
    for(const s of this.stars){
      const sx = (s.x - this.camera.x*0.5) % w; const sy=(s.y - this.camera.y*0.5)%h;
      // wrap
      let px=sx; if(px<0) px+=w; let py=sy; if(py<0) py+=h;
      const tw=Math.sin(this.time*1.2 + s.tw)*0.3+0.7;
      ctx.globalAlpha=s.b*tw*0.9;
      ctx.beginPath(); ctx.arc(px,py,s.s,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    // vignette
    const grad=ctx.createRadialGradient(w/2,h/2, Math.min(w,h)*0.4, w/2,h/2, Math.max(w,h)*1.1);
    grad.addColorStop(0,'transparent'); grad.addColorStop(1,'rgba(7,12,28,0.75)');
    ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
    // sector color tint
    ctx.fillStyle=sec.color; ctx.globalAlpha=0.04; ctx.fillRect(0,0,w,h); ctx.globalAlpha=1;
  }
}

// Boot loading sequence
const loadingBar=document.getElementById('loading-bar');
const loadingText=document.getElementById('loading-text');
let prog=0;
const steps=[
  'Initializing quantum drives...',
  'Calibrating mining lasers...',
  'Generating asteroid fields...',
  'Loading nebula textures...',
  'Arming defense systems...',
  'Ready for launch, Miner.'
];
let step=0;
const loadInterval=setInterval(()=>{
  prog+=rand(12,22); if(prog>100) prog=100;
  loadingBar.style.width=prog+'%';
  if(prog> (step+1)*16 && step<steps.length-1){ step++; loadingText.textContent=steps[step]; }
  if(prog>=100){
    clearInterval(loadInterval);
    setTimeout(()=>{
      document.getElementById('loading-screen').classList.add('hidden');
      game.updateMenuInfo();
      game.updateHUD();
    },600);
  }
},180);

const game=new Game();
window.game=game;
window.GAME=game; // for tests
console.log('Space Miner initialized - sectors:', SECTORS.length, 'resources:', RESOURCES.length);
