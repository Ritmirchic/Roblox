// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// ui/style.js — the entire interface stylesheet
// ============================================================

export const CSS = `
:root{
  --paper:#d3ccba; --paper-2:#b3ac9a; --dim:#807d70; --dimmer:#5c5a51;
  --bg:#0a0c0a; --panel:rgba(14,16,14,.94); --panel-2:rgba(20,23,19,.96);
  --line:#2c3029; --line-2:#3b4136;
  --amber:#c9963f; --amber-2:#e0b463; --amber-dim:#6f5222;
  --red:#b04632; --red-2:#d4664c; --green:#8fa36a; --blue:#79a0b4; --violet:#9a7fbd;
  --shadow:0 18px 50px rgba(0,0,0,.65);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;background:#050605;overflow:hidden;
  font-family:"Barlow Condensed","Oswald","Arial Narrow",Inter,"Segoe UI",system-ui,sans-serif;
  color:var(--paper);-webkit-font-smoothing:antialiased;user-select:none}
canvas{display:block}
#ui{position:fixed;inset:0;pointer-events:none;z-index:10;font-size:15px;letter-spacing:.02em}
#ui *{pointer-events:none}
#ui .pe,#ui .pe *{pointer-events:auto}
.mono{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-variant-numeric:tabular-nums}
.caps{text-transform:uppercase;letter-spacing:.16em}
.tiny{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.hr{height:1px;background:var(--line);margin:10px 0}
svg{display:block}
.icon{display:inline-flex;align-items:center;justify-content:center}
.icon svg,.st-ic svg{width:100%;height:100%}

/* ------------------------------------------------ HUD shell */
#hud{position:absolute;inset:0;opacity:1;transition:opacity .35s ease}
#hud.hidden{opacity:0}
.hud-corner{position:absolute;width:54px;height:54px;border:1px solid rgba(201,150,63,.25);pointer-events:none}
.hud-corner.tl{top:14px;left:14px;border-right:0;border-bottom:0}
.hud-corner.tr{top:14px;right:14px;border-left:0;border-bottom:0}
.hud-corner.bl{bottom:14px;left:14px;border-right:0;border-top:0}
.hud-corner.br{bottom:14px;right:14px;border-left:0;border-top:0}

/* top-left vitals badge */
#hud-top-left{position:absolute;top:26px;left:30px;min-width:230px}
.lvl-row{display:flex;align-items:center;gap:10px}
.lvl-badge{width:46px;height:46px;border:1px solid var(--amber-dim);background:rgba(10,12,10,.7);
  display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.lvl-badge:after{content:"";position:absolute;inset:3px;border:1px solid rgba(201,150,63,.18)}
.lvl-badge b{font-size:19px;line-height:1;color:var(--amber-2);font-weight:600}
.lvl-badge span{font-size:8px;letter-spacing:.2em;color:var(--dim);margin-top:2px}
.lvl-meta{flex:1}
.lvl-name{font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--paper-2)}
.xp-track{height:3px;background:#20241e;margin-top:6px;position:relative;overflow:hidden}
.xp-fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--amber-dim),var(--amber));transition:width .4s ease}
.xp-text{font-size:10px;color:var(--dim);margin-top:4px;letter-spacing:.12em}
#region-line{font-size:11px;letter-spacing:.26em;color:var(--dimmer);text-transform:uppercase;margin-top:10px}

/* bottom-left meters */
#hud-vitals{position:absolute;left:30px;bottom:26px;width:290px}
.health-block{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.body-mini{width:44px;height:72px;position:relative;opacity:.95}
.body-map{width:100%;height:100%}
.body-map .bp{fill:rgba(20,24,19,.8);stroke:#434a3d;stroke-width:1.4;transition:fill .25s}
.body-map .bp.crit{fill:rgba(140,50,34,.55);stroke:#b04632}
.body-map .bp.hurt{fill:rgba(150,104,44,.42);stroke:#a37b3e}
.body-map .bp.ok{fill:rgba(78,92,58,.45);stroke:#6d7d52}
.meters{flex:1}
.meter{margin-bottom:6px}
.meter-head{display:flex;justify-content:space-between;align-items:baseline;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.meter-head b{font-size:12px;color:var(--paper-2);letter-spacing:.06em}
.track{height:5px;background:#1c201b;margin-top:3px;position:relative;overflow:hidden}
.track .fill{position:absolute;inset:0;width:0;transition:width .25s ease,background .3s}
.track.thin{height:3px}
.fill.health{background:linear-gradient(90deg,#6d8a4c,#a8bd7c)}
.fill.health.low{background:linear-gradient(90deg,#8a3626,#c85b3e)}
.fill.stamina{background:linear-gradient(90deg,#8a7530,#c9ae57)}
.fill.stamina.low{background:linear-gradient(90deg,#6b5a24,#8f7a35)}
.fill.rad{background:linear-gradient(90deg,#5f7a2c,#a8c75a)}
.fill.inf{background:linear-gradient(90deg,#5f7a6a,#8fbfa8)}
.fill.bleed{background:linear-gradient(90deg,#7d2b1e,#c05038)}

.status-strip{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.stat-chip{display:flex;align-items:center;gap:4px;background:rgba(14,17,14,.72);
  border:1px solid var(--line);padding:3px 6px;font-size:10px;letter-spacing:.08em;color:var(--dim)}
.stat-chip b{color:var(--paper-2);font-size:11px;font-weight:500}
.stat-chip .st-ic{color:var(--dimmer)}
.stat-chip.warn{border-color:rgba(176,70,50,.5);color:#d49a86}
.stat-chip.warn .st-ic{color:#c86a50}
.stat-chip.warn b{color:#e0a48e}
.stat-chip.cold{border-color:rgba(90,130,160,.45);color:#8fb2c8}
.stat-chip.cold .st-ic{color:#7aa6be}

.bleed-warn{display:none;align-items:center;gap:8px;margin-top:8px;padding:5px 8px;
  border:1px solid rgba(176,70,50,.55);background:rgba(90,24,16,.35);color:#e0a48e;
  font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;animation:pulse 1.6s infinite}
.bleed-warn.on{display:flex}
@keyframes pulse{0%,100%{opacity:.65}50%{opacity:1}}

/* weapon block */
#hud-weapon{position:absolute;right:30px;bottom:26px;min-width:230px;text-align:right}
.w-name{font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:var(--paper)}
.w-name .w-mode{color:var(--amber);font-size:10px;letter-spacing:.16em;margin-left:8px}
.w-ammo{display:flex;align-items:baseline;justify-content:flex-end;gap:6px;margin-top:2px}
.w-ammo b{font-size:40px;line-height:.95;font-weight:500;color:var(--paper);font-family:"SFMono-Regular",Consolas,monospace}
.w-ammo b.empty{color:var(--red-2)}
.w-ammo i{font-style:normal;font-size:16px;color:var(--dim)}
.w-ammo span{font-size:15px;color:var(--paper-2);font-family:"SFMono-Regular",Consolas,monospace}
.w-sub{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dimmer);margin-top:4px}
.w-durab{height:2px;background:#1e221d;margin-top:7px;position:relative;overflow:hidden}
.w-durab i{position:absolute;left:0;top:0;bottom:0;background:var(--amber);display:block}
#quick-slots{display:flex;gap:5px;justify-content:flex-end;margin-top:10px}
.qslot{width:40px;height:40px;border:1px solid var(--line-2);background:rgba(12,14,12,.72);
  position:relative;display:flex;align-items:center;justify-content:center;color:var(--paper-2)}
.qslot .num{position:absolute;top:1px;left:3px;font-size:8px;color:var(--dimmer);letter-spacing:.1em}
.qslot .cnt{position:absolute;bottom:1px;right:3px;font-size:9px;color:var(--paper-2);font-family:monospace}
.qslot.active{border-color:var(--amber);background:rgba(40,32,16,.6)}
.qslot .icon{width:26px;height:26px}

/* top-right time/weather */
#hud-top-right{position:absolute;top:26px;right:30px;text-align:right}
.clock{font-size:22px;letter-spacing:.1em;font-family:"SFMono-Regular",Consolas,monospace;color:var(--paper)}
.clock small{font-size:10px;letter-spacing:.24em;color:var(--dimmer);display:block;margin-top:2px}
.weather{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--amber);margin-top:8px}
.weather .temp{color:var(--paper-2);margin-left:8px;letter-spacing:.1em}

/* compass */
#compass{position:absolute;top:24px;left:50%;transform:translateX(-50%);width:420px;height:38px;overflow:hidden;
  mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent);
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent)}
#compass-inner{position:absolute;top:0;left:0;height:100%;display:flex;align-items:center;white-space:nowrap}
.cmp-tick{display:inline-block;width:44px;text-align:center;font-size:10px;letter-spacing:.2em;color:var(--dimmer)}
.cmp-tick.card{color:var(--paper-2);font-size:12px}
.cmp-tick.card.n{color:var(--amber-2)}
#compass-center{position:absolute;left:50%;top:0;transform:translateX(-50%);width:1px;height:34px;background:var(--amber);opacity:.8}
#compass-markers{position:absolute;inset:0}
.cmp-marker{position:absolute;top:2px;transform:translateX(-50%);font-size:8px;letter-spacing:.1em;color:var(--amber-2);text-align:center}
.cmp-marker .dot{width:5px;height:5px;background:var(--amber);margin:0 auto 2px;transform:rotate(45deg)}

/* crosshair */
#crosshair{position:absolute;left:50%;top:50%;width:34px;height:34px;transform:translate(-50%,-50%);opacity:.9}
#crosshair .ch{position:absolute;background:rgba(226,220,204,.85);box-shadow:0 0 3px rgba(0,0,0,.9)}
#crosshair .ch.t{width:1px;height:7px;left:16.5px;top:0}
#crosshair .ch.b{width:1px;height:7px;left:16.5px;bottom:0}
#crosshair .ch.l{height:1px;width:7px;top:16.5px;left:0}
#crosshair .ch.r{height:1px;width:7px;top:16.5px;right:0}
#crosshair .dot{position:absolute;width:2px;height:2px;background:var(--amber-2);left:16px;top:16px}
#crosshair.hidden{display:none}
#hitmark{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(45deg);width:22px;height:22px;opacity:0}
#hitmark span{position:absolute;background:#e8e2cf;width:1.5px;height:7px}
#hitmark span:nth-child(1){left:0;top:0}
#hitmark span:nth-child(2){right:0;top:0}
#hitmark span:nth-child(3){left:0;bottom:0}
#hitmark span:nth-child(4){right:0;bottom:0}
#hitmark.show{animation:hit .28s ease-out}
#hitmark.kill span{background:var(--red-2)}
@keyframes hit{0%{opacity:1;transform:translate(-50%,-50%) rotate(45deg) scale(.7)}100%{opacity:0;transform:translate(-50%,-50%) rotate(45deg) scale(1.25)}}

/* damage vignette */
#vignette{position:absolute;inset:0;opacity:0;transition:opacity .18s;
  background:radial-gradient(ellipse at center,transparent 42%,rgba(120,26,16,.55) 100%)}
#lowhealth{position:absolute;inset:0;opacity:0;box-shadow:inset 0 0 160px rgba(120,20,10,.7);transition:opacity .5s}
#radiation-fx{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,transparent 50%,rgba(120,150,60,.24));transition:opacity 1s}

/* prompt, objective, notifications */
#prompt{position:absolute;left:50%;bottom:19%;transform:translateX(-50%);opacity:0;transition:opacity .2s;
  background:rgba(10,12,10,.82);border:1px solid var(--line-2);padding:7px 14px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--paper-2)}
#prompt.on{opacity:1}
#prompt b{color:var(--amber-2);font-weight:500}

#objective{position:absolute;left:30px;top:150px;width:300px;text-align:left;opacity:0;transition:opacity .3s}
#objective.on{opacity:1}
.obj-head{font-size:10px;letter-spacing:.26em;color:var(--amber);text-transform:uppercase}
.obj-title{font-size:14px;letter-spacing:.1em;color:var(--paper);margin-top:3px;text-transform:uppercase}
.obj-list{margin-top:7px;font-size:11.5px;line-height:1.5;color:var(--paper-2)}
.obj-list div{position:relative;padding-right:2px}
.obj-list div:before{content:"—";color:var(--amber-dim);margin-right:6px}
.obj-list div.done{color:var(--dimmer);text-decoration:line-through}
.obj-count{color:var(--amber-2);margin-left:5px;font-family:monospace;font-size:11px}

#notifications{position:absolute;right:30px;top:112px;width:310px;display:flex;flex-direction:column;gap:6px;align-items:stretch}
.note{background:rgba(10,12,10,.9);border-right:2px solid var(--amber);border-left:0;padding:7px 12px 7px 14px;width:100%;text-align:left;
  animation:noteIn .3s ease-out;transition:opacity .4s,transform .4s}
.note.fade{opacity:0;transform:translateY(-6px)}
.note .n-title{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--amber-2)}
.note .n-text{font-size:12px;color:var(--paper-2);margin-top:2px;line-height:1.4;white-space:pre-line}
.note.quest{border-right-color:var(--violet)}
.note.quest .n-title{color:#c0a4d8}
.note.danger{border-right-color:var(--red)}
.note.danger .n-title{color:var(--red-2)}
.note.good{border-right-color:var(--green)}
.note.good .n-title{color:#b6c894}
@keyframes noteIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}

/* boss bar */
#bossbar{position:absolute;left:50%;top:110px;transform:translateX(-50%);width:560px;opacity:0;transition:opacity .4s}
#bossbar.on{opacity:1}
.boss-name{font-size:13px;letter-spacing:.34em;text-transform:uppercase;text-align:center;color:#d9c9a8}
.boss-phases{display:flex;gap:4px;justify-content:center;margin:5px 0 6px}
.boss-phases i{width:64px;height:2px;background:#2a2118}
.boss-phases i.on{background:var(--red)}
.boss-track{height:7px;background:#1a1512;border:1px solid #3a2a22;position:relative;overflow:hidden}
.boss-track i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#7d2b1e,#c05038)}
.boss-tag{text-align:center;font-size:9px;letter-spacing:.3em;color:#8a6a52;margin-top:4px;text-transform:uppercase}

/* ------------------------------------------------ overlays */
.overlay{position:absolute;inset:0;background:rgba(5,6,5,.82);opacity:0;visibility:hidden;
  transition:opacity .22s ease,visibility .22s;backdrop-filter:blur(3px);z-index:20}
.overlay.open{opacity:1;visibility:visible}
.scr{position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:auto}
.scr-head{display:flex;align-items:center;justify-content:space-between;padding:22px 34px 14px;border-bottom:1px solid var(--line)}
.scr-head h1{margin:0;font-size:22px;letter-spacing:.4em;font-weight:400;text-transform:uppercase;color:var(--paper)}
.scr-head .tabs{display:flex;gap:2px}
.tab{padding:8px 15px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);
  border:1px solid transparent;cursor:pointer;transition:color .15s,border-color .15s}
.tab:hover{color:var(--paper-2)}
.tab.on{color:var(--amber-2);border-color:var(--amber-dim);background:rgba(201,150,63,.06)}
.scr-body{flex:1;display:flex;min-height:0;padding:20px 34px 26px;gap:22px}
.scr-foot{padding:10px 34px;border-top:1px solid var(--line);display:flex;justify-content:space-between;
  align-items:center;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.panel{background:var(--panel);border:1px solid var(--line)}
.panel-pad{padding:16px}
.panel-title{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--amber);margin-bottom:12px}
.close-x{width:34px;height:34px;border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;
  color:var(--dim);cursor:pointer;transition:.15s}
.close-x:hover{color:var(--paper);border-color:var(--amber-dim)}
.close-x svg{width:14px;height:14px}
.btn{border:1px solid var(--line-2);background:rgba(24,27,23,.7);color:var(--paper-2);padding:9px 16px;
  font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:.15s;font-family:inherit}
.btn:hover{background:rgba(38,42,34,.9);color:var(--paper);border-color:var(--amber-dim)}
.btn.primary{border-color:var(--amber-dim);color:var(--amber-2);background:rgba(201,150,63,.08)}
.btn.primary:hover{background:rgba(201,150,63,.16)}
.btn.danger{border-color:rgba(176,70,50,.6);color:var(--red-2)}
.btn.danger:hover{background:rgba(140,40,26,.22)}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn.sm{padding:5px 9px;font-size:9.5px;letter-spacing:.14em}

/* ------------------------------------------------ inventory */
.inv-wrap{flex:1;display:grid;grid-template-columns:250px 1fr 290px;gap:20px;min-height:0}
.equip-col{display:flex;flex-direction:column;gap:14px;min-height:0}
.char-doll{position:relative;height:250px;border:1px solid var(--line);background:
  radial-gradient(ellipse at 50% 40%,rgba(50,58,44,.35),rgba(10,12,10,.6));display:flex;align-items:center;justify-content:center}
.char-doll .body-map{height:210px;width:auto;opacity:.9}
.eq-slots{position:absolute;inset:0}
.eq-slot{position:absolute;width:48px;height:48px;border:1px solid var(--line-2);background:rgba(10,12,10,.8);
  display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--paper-2)}
.eq-slot .icon{width:32px;height:32px}
.eq-slot .lbl{position:absolute;bottom:-13px;left:0;right:0;text-align:center;font-size:8px;letter-spacing:.14em;color:var(--dimmer);text-transform:uppercase}
.eq-slot.filled{border-color:var(--amber-dim)}
.eq-slot:hover{border-color:var(--amber)}
.eq-slot[data-slot="head"]{left:6px;top:6px}
.eq-slot[data-slot="body"]{left:6px;top:64px}
.eq-slot[data-slot="back"]{left:6px;top:122px}
.eq-slot[data-slot="light"]{right:6px;top:6px}
.eq-slot[data-slot="utility"]{right:6px;top:64px}
.eq-slot[data-slot="melee"]{right:6px;top:122px}
.eq-slot[data-slot="weapon1"]{left:6px;bottom:8px}
.eq-slot[data-slot="weapon2"]{right:6px;bottom:8px}
@media (max-width:1200px){.eq-slot[data-slot="weapon1"],.eq-slot[data-slot="weapon2"]{display:none}}

.stat-lines{font-size:11px;color:var(--paper-2)}
.stat-line{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(44,48,41,.6)}
.stat-line span{color:var(--dim);letter-spacing:.1em}
.stat-line b{font-weight:500;color:var(--paper)}
.stat-line b.warn{color:var(--red-2)}

.grid-col{display:flex;flex-direction:column;min-height:0}
.grid-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px}
.carry{font-size:11px;color:var(--dim);letter-spacing:.1em}
.carry b{color:var(--paper);font-weight:500}
.carry.over b{color:var(--red-2)}
.inv-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;background:rgba(8,9,8,.5);padding:8px;
  border:1px solid var(--line);position:relative;touch-action:none}
.inv-cell{aspect-ratio:1;background:rgba(22,25,21,.5);border:1px solid rgba(44,48,41,.5);position:relative}
.inv-cell.hover{background:rgba(60,70,50,.35);border-color:var(--line-2)}
.inv-cell.bad{background:rgba(120,40,30,.22);border-color:rgba(176,70,50,.4)}
.item{position:absolute;border:1px solid #4a4d40;background:linear-gradient(160deg,rgba(48,52,44,.92),rgba(26,29,25,.95));
  display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;transition:border-color .12s,filter .12s}
.item:hover{border-color:var(--amber);filter:brightness(1.12)}
.item.sel{border-color:var(--amber-2);box-shadow:0 0 0 1px var(--amber-dim) inset}
.item.dragging{opacity:.4}
.item .icon{width:78%;height:78%}
.item .qty{position:absolute;right:2px;bottom:1px;font-size:10px;color:#e6e0cc;font-family:monospace;text-shadow:0 1px 2px #000}
.item .dur{position:absolute;left:2px;right:2px;bottom:2px;height:2px;background:rgba(0,0,0,.6)}
.item .dur i{display:block;height:100%;background:var(--green)}
.item .dur i.low{background:var(--red)}
.item.rare{border-color:#8a6fa8}
.item.quest{border-color:#9a7fbd}
.inv-foot{display:flex;justify-content:space-between;margin-top:10px;align-items:center}
.gold{display:flex;align-items:center;gap:6px;font-size:12px;letter-spacing:.1em;color:var(--paper-2)}
.gold b{color:var(--amber-2);font-family:monospace;font-size:14px;font-weight:500}
.gold svg{width:14px;height:14px;color:var(--amber)}

.detail-col{display:flex;flex-direction:column;gap:0;min-height:0}
.detail-empty{color:var(--dimmer);font-size:12px;letter-spacing:.14em;text-align:center;padding:40px 10px;text-transform:uppercase}
.d-title{font-size:16px;letter-spacing:.12em;color:var(--paper);text-transform:uppercase}
.d-cat{font-size:9.5px;letter-spacing:.24em;color:var(--amber);text-transform:uppercase;margin-top:3px}
.d-desc{font-size:12px;line-height:1.55;color:var(--paper-2);margin-top:12px}
.d-stats{margin-top:14px;font-size:11px}
.d-stat{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(44,48,41,.55)}
.d-stat span{color:var(--dim);letter-spacing:.12em;text-transform:uppercase}
.d-stat b{font-weight:500;color:var(--paper)}
.d-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
.d-hint{font-size:10px;letter-spacing:.1em;color:var(--dimmer);margin-top:10px;line-height:1.6}
.att-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(44,48,41,.5);font-size:11px}
.att-row span{color:var(--dim)}

/* tooltip */
#tooltip{position:fixed;z-index:60;background:rgba(8,10,8,.97);border:1px solid var(--line-2);padding:10px 12px;
  max-width:260px;opacity:0;transition:opacity .12s;pointer-events:none;box-shadow:var(--shadow)}
#tooltip.on{opacity:1}
#tooltip .tt-name{font-size:12px;letter-spacing:.12em;color:var(--paper);text-transform:uppercase}
#tooltip .tt-cat{font-size:9px;letter-spacing:.22em;color:var(--amber);margin-top:2px;text-transform:uppercase}
#tooltip .tt-desc{font-size:11px;color:var(--dim);margin-top:6px;line-height:1.45}
#tooltip .tt-extra{font-size:10px;color:var(--paper-2);margin-top:6px;line-height:1.5}

/* ------------------------------------------------ skills */
.skill-trees{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;min-height:0}
.tree{border:1px solid var(--line);background:rgba(12,14,12,.55);display:flex;flex-direction:column;min-height:0}
.tree-head{padding:12px 14px;border-bottom:1px solid var(--line);position:relative}
.tree-head h3{margin:0;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--paper)}
.tree-head .t-desc{font-size:10px;color:var(--dimmer);margin-top:4px;line-height:1.4;letter-spacing:.04em}
.tree-head .t-count{position:absolute;right:12px;top:12px;font-size:10px;color:var(--amber);font-family:monospace}
.tree-body{padding:10px 12px 14px;display:flex;flex-direction:column;gap:6px;overflow:auto;min-height:0}
.sk{display:flex;gap:8px;align-items:flex-start;padding:7px 8px;border:1px solid rgba(44,48,41,.8);
  background:rgba(18,21,18,.5);cursor:pointer;transition:.14s;position:relative}
.sk:hover{border-color:var(--line-2);background:rgba(26,30,25,.7)}
.sk.locked{opacity:.5}
.sk.maxed{border-color:rgba(201,150,63,.5)}
.sk.can{border-color:rgba(201,150,63,.35)}
.sk-icon{width:22px;height:22px;border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;
  color:var(--amber);font-size:10px;font-family:monospace;flex:0 0 auto;margin-top:1px}
.sk-main{flex:1;min-width:0}
.sk-name{font-size:11.5px;letter-spacing:.08em;color:var(--paper-2);text-transform:uppercase}
.sk-desc{font-size:10px;color:var(--dimmer);line-height:1.4;margin-top:2px}
.sk-meta{display:flex;justify-content:space-between;margin-top:3px;font-size:9px;letter-spacing:.1em;color:var(--amber-dim)}
.sk-pips{display:flex;gap:2px}
.sk-pips i{width:7px;height:3px;background:#2a2e26}
.sk-pips i.on{background:var(--amber)}
.skill-points{font-size:12px;letter-spacing:.16em;color:var(--amber-2);text-transform:uppercase}
.skill-points b{font-family:monospace;font-size:15px}

/* ------------------------------------------------ journal */
.journal-wrap{flex:1;display:grid;grid-template-columns:250px 1fr;gap:20px;min-height:0}
.act-list{overflow:auto;border:1px solid var(--line)}
.act{padding:10px 14px;border-bottom:1px solid rgba(44,48,41,.6);cursor:pointer}
.act:hover{background:rgba(30,34,28,.5)}
.act.on{background:rgba(201,150,63,.08);border-left:2px solid var(--amber)}
.act .a-num{font-size:9px;letter-spacing:.24em;color:var(--amber-dim)}
.act .a-name{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--paper-2);margin-top:2px}
.act .a-sub{font-size:9.5px;color:var(--dimmer);margin-top:2px}
.quest-list{overflow:auto;padding-right:4px}
.q-card{border:1px solid var(--line);background:rgba(14,16,14,.6);margin-bottom:8px;padding:13px 15px;cursor:pointer;transition:.14s}
.q-card:hover{border-color:var(--line-2);background:rgba(22,25,21,.7)}
.q-card.on{border-color:var(--amber-dim)}
.q-card.done{opacity:.68}
.q-num{font-size:9px;letter-spacing:.24em;color:var(--amber-dim)}
.q-name{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:var(--paper);margin-top:2px}
.q-short{font-size:11px;color:var(--dim);line-height:1.5;margin-top:5px}
.q-obj{margin-top:9px;font-size:11px;color:var(--paper-2)}
.q-obj div{padding:2px 0}
.q-obj div:before{content:"·";color:var(--amber);margin-right:7px}
.q-obj div.done{color:var(--dimmer);text-decoration:line-through}
.q-reward{margin-top:9px;font-size:10px;letter-spacing:.08em;color:var(--dim)}
.q-reward b{color:var(--amber-2);font-weight:500}
.q-tag{display:inline-block;font-size:8.5px;letter-spacing:.2em;padding:2px 6px;border:1px solid var(--line-2);color:var(--dim);margin-left:6px;text-transform:uppercase}
.q-tag.main{border-color:rgba(201,150,63,.45);color:var(--amber)}
.q-tag.done{border-color:rgba(143,163,106,.45);color:var(--green)}
.empty-state{color:var(--dimmer);font-size:12px;text-align:center;padding:60px 20px;letter-spacing:.14em;text-transform:uppercase}

/* ------------------------------------------------ map */
.map-wrap{flex:1;display:grid;grid-template-columns:1fr 260px;gap:20px;min-height:0}
#map-canvas-wrap{border:1px solid var(--line);position:relative;background:#0b0d0b;overflow:hidden}
#map-canvas{width:100%;height:100%;display:block;cursor:crosshair}
.map-legend{position:absolute;left:12px;bottom:12px;font-size:9.5px;color:var(--dim);line-height:1.7;letter-spacing:.1em;background:rgba(8,10,8,.7);padding:8px 10px;border:1px solid var(--line)}
.map-legend i{display:inline-block;width:7px;height:7px;margin-right:6px}
.poi-list{overflow:auto;border:1px solid var(--line)}
.poi-row{padding:8px 12px;border-bottom:1px solid rgba(44,48,41,.5);font-size:11px;display:flex;justify-content:space-between;cursor:pointer}
.poi-row:hover{background:rgba(30,34,28,.5)}
.poi-row .p-name{color:var(--paper-2);letter-spacing:.1em}
.poi-row .p-dist{color:var(--dimmer);font-family:monospace;font-size:10px}
.poi-row.undiscovered .p-name{color:var(--dimmer);font-style:italic}

/* ------------------------------------------------ craft / build */
.craft-wrap{flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;align-content:start;overflow:auto;min-height:0;padding-right:6px}
.recipe{border:1px solid var(--line);background:rgba(14,16,14,.65);padding:13px 15px;display:flex;flex-direction:column}
.recipe.cant{opacity:.6}
.r-head{display:flex;gap:10px;align-items:center}
.r-icon{width:38px;height:38px;border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;color:var(--paper-2)}
.r-icon .icon{width:28px;height:28px}
.r-name{font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--paper)}
.r-sub{font-size:9.5px;letter-spacing:.14em;color:var(--amber);text-transform:uppercase;margin-top:2px}
.r-desc{font-size:10.5px;color:var(--dim);margin:9px 0;line-height:1.5;flex:1}
.r-ing{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.ing{font-size:10px;padding:2px 6px;border:1px solid var(--line-2);color:var(--paper-2);letter-spacing:.06em}
.ing.miss{color:var(--red-2);border-color:rgba(176,70,50,.4)}
.r-foot{display:flex;justify-content:space-between;align-items:center}
.r-time{font-size:9.5px;color:var(--dimmer);letter-spacing:.14em}
.tab-bar{display:flex;gap:2px;margin-bottom:14px;flex-wrap:wrap}

/* ------------------------------------------------ settings */
.settings-wrap{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:26px;overflow:auto;min-height:0;align-content:start;padding-right:6px}
.set-group{border:1px solid var(--line);padding:16px 18px;background:rgba(13,15,13,.6)}
.set-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(44,48,41,.5);gap:12px}
.set-row:last-child{border-bottom:0}
.set-label{font-size:11px;letter-spacing:.1em;color:var(--paper-2)}
.set-label small{display:block;font-size:9.5px;color:var(--dimmer);letter-spacing:.04em;margin-top:2px}
.set-ctl{display:flex;align-items:center;gap:8px;min-width:150px;justify-content:flex-end}
input[type=range]{-webkit-appearance:none;appearance:none;width:130px;height:2px;background:#333a30;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:14px;background:var(--amber);cursor:pointer;border-radius:0}
input[type=range]::-moz-range-thumb{width:10px;height:14px;background:var(--amber);border:0;cursor:pointer;border-radius:0}
.set-val{font-size:10px;color:var(--paper-2);font-family:monospace;min-width:34px;text-align:right}
.seg{display:flex;gap:1px}
.seg button{background:rgba(22,25,21,.7);border:1px solid var(--line-2);color:var(--dim);font-size:9.5px;
  letter-spacing:.1em;padding:4px 8px;cursor:pointer;font-family:inherit;text-transform:uppercase}
.seg button.on{color:var(--amber-2);border-color:var(--amber-dim);background:rgba(201,150,63,.1)}
.keys-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}
.key-row{display:flex;justify-content:space-between;padding:3px 0;font-size:10.5px;color:var(--dim)}
.key-row kbd{font-family:monospace;font-size:10px;background:rgba(30,34,28,.8);border:1px solid var(--line-2);padding:1px 5px;color:var(--paper-2)}

/* ------------------------------------------------ dialogue */
#dialogue{position:absolute;left:50%;bottom:56px;transform:translateX(-50%);width:min(940px,88vw);
  background:linear-gradient(180deg,rgba(10,12,10,.96),rgba(14,17,14,.98));border:1px solid #3a3f34;
  box-shadow:var(--shadow);opacity:0;visibility:hidden;transition:.2s;z-index:30}
#dialogue.open{opacity:1;visibility:visible}
.dlg-head{display:flex;align-items:center;gap:14px;padding:14px 20px 10px;border-bottom:1px solid var(--line)}
.dlg-portrait{width:52px;height:52px;border:1px solid var(--line-2);background:rgba(20,24,19,.9);
  display:flex;align-items:center;justify-content:center;font-size:19px;color:var(--amber);letter-spacing:.04em;
  font-family:"Barlow Condensed","Arial Narrow",sans-serif;position:relative;overflow:hidden}
.dlg-portrait:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(201,150,63,.12))}
.dlg-id{flex:1}
.dlg-name{font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:var(--paper)}
.dlg-role{font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--amber-dim);margin-top:2px}
.dlg-body{padding:16px 22px 6px;min-height:86px}
.dlg-text{font-size:14.5px;line-height:1.65;color:var(--paper-2);letter-spacing:.015em;white-space:pre-line;max-width:78ch}
.dlg-caret{display:inline-block;width:6px;height:14px;background:var(--amber);margin-left:2px;animation:blink 1s steps(2) infinite;vertical-align:-2px}
@keyframes blink{50%{opacity:0}}
.dlg-choices{padding:6px 22px 18px;display:flex;flex-direction:column;gap:3px}
.dlg-choice{display:flex;gap:10px;align-items:baseline;padding:6px 9px;font-size:12.5px;color:var(--paper-2);
  border-left:1px solid transparent;cursor:pointer;letter-spacing:.02em;transition:.12s}
.dlg-choice:hover,.dlg-choice.hl{color:var(--paper);border-left-color:var(--amber);background:rgba(201,150,63,.06)}
.dlg-choice .n{font-size:9.5px;color:var(--amber-dim);font-family:monospace;min-width:14px}
.dlg-choice.dim{color:var(--dimmer)}

/* ------------------------------------------------ shop */
#shop{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(980px,92vw);height:min(620px,84vh);
  display:flex;flex-direction:column;background:rgba(10,12,10,.97);border:1px solid #3a3f34;box-shadow:var(--shadow);
  opacity:0;visibility:hidden;transition:.2s;z-index:31}
#shop.open{opacity:1;visibility:visible}
.shop-body{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:0}
.shop-col{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--line)}
.shop-col:last-child{border-right:0}
.shop-col h3{margin:0;padding:12px 16px;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--amber);border-bottom:1px solid var(--line)}
.shop-list{flex:1;overflow:auto;padding:6px}
.shop-row{display:flex;align-items:center;gap:10px;padding:7px 8px;border-bottom:1px solid rgba(44,48,41,.45);cursor:pointer}
.shop-row:hover{background:rgba(30,34,28,.55)}
.shop-row .icon{width:30px;height:30px;flex:0 0 auto}
.shop-row .s-main{flex:1;min-width:0}
.shop-row .s-name{font-size:11.5px;color:var(--paper-2);letter-spacing:.06em}
.shop-row .s-qty{font-size:9.5px;color:var(--dimmer);font-family:monospace}
.shop-row .s-price{font-size:11px;color:var(--amber-2);font-family:monospace;min-width:44px;text-align:right}

/* ------------------------------------------------ medical */
.med-wrap{flex:1;display:grid;grid-template-columns:300px 1fr;gap:24px;min-height:0}
.med-doll{border:1px solid var(--line);background:radial-gradient(ellipse at 50% 40%,rgba(50,58,44,.3),rgba(10,12,10,.6));
  display:flex;align-items:center;justify-content:center;position:relative}
.med-doll .body-map{height:74%;width:auto}
.med-parts{display:flex;flex-direction:column;gap:8px;overflow:auto;min-height:0}
.med-part{border:1px solid var(--line);padding:10px 12px;background:rgba(14,16,14,.6)}
.med-part.crit{border-color:rgba(176,70,50,.5)}
.med-part-head{display:flex;justify-content:space-between;align-items:baseline}
.med-part-name{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--paper-2)}
.med-part-val{font-size:10px;color:var(--dim);font-family:monospace}
.med-bar{height:4px;background:#1c201b;margin:6px 0}
.med-bar i{display:block;height:100%;background:linear-gradient(90deg,#6d8a4c,#a8bd7c)}
.med-bar i.mid{background:linear-gradient(90deg,#8a7530,#c9ae57)}
.med-bar i.bad{background:linear-gradient(90deg,#8a3626,#c85b3e)}
.med-tags{display:flex;gap:5px;flex-wrap:wrap}
.med-tag{font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;padding:1px 5px;border:1px solid rgba(176,70,50,.45);color:var(--red-2)}
.med-tag.ok{border-color:rgba(143,163,106,.35);color:var(--green)}
.med-actions{display:flex;gap:5px;margin-top:7px;flex-wrap:wrap}

/* ------------------------------------------------ pause / main menu / death */
#pause,#death,#mainmenu{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  opacity:0;visibility:hidden;transition:.25s;z-index:40}
#pause.open,#death.open,#mainmenu.open{opacity:1;visibility:visible}
#pause{background:rgba(6,7,6,.86);backdrop-filter:blur(6px)}
.pause-box{width:380px;border:1px solid var(--line-2);background:var(--panel);padding:26px 28px;box-shadow:var(--shadow)}
.pause-box h2{margin:0 0 4px;font-size:14px;letter-spacing:.42em;text-transform:uppercase;color:var(--paper);font-weight:400}
.pause-box .p-sub{font-size:9.5px;letter-spacing:.22em;color:var(--dimmer);text-transform:uppercase;margin-bottom:20px}
.pause-box .btn{width:100%;margin-bottom:7px;text-align:left;padding:11px 15px}

#death{background:radial-gradient(ellipse at center,rgba(40,10,8,.5),rgba(4,4,4,.94));flex-direction:column;z-index:41}
.death-title{font-size:56px;letter-spacing:.5em;text-transform:uppercase;color:#b8483a;font-weight:300;
  text-shadow:0 0 40px rgba(160,40,20,.45);margin-bottom:6px}
.death-sub{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#8a6a5c;margin-bottom:30px}
.death-stats{display:flex;gap:34px;margin-bottom:34px}
.death-stat{text-align:center}
.death-stat b{display:block;font-size:24px;color:var(--paper-2);font-family:monospace;font-weight:400}
.death-stat span{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--dimmer)}

#mainmenu{background:radial-gradient(ellipse at 50% 120%,rgba(60,52,34,.4),rgba(5,6,5,.96));flex-direction:column;z-index:50}
.mm-title{text-align:center;margin-bottom:6px}
.mm-title h1{margin:0;font-size:clamp(26px,5.4vw,64px);letter-spacing:clamp(.1em,.24em,.24em);font-weight:300;
  text-transform:uppercase;white-space:nowrap;padding:0 18px;
  color:#ded6c0;text-shadow:0 2px 50px rgba(0,0,0,.9)}
.mm-title h2{margin:6px 0 0;font-size:clamp(9px,1.3vw,13px);letter-spacing:clamp(.4em,.9em,.9em);color:var(--amber);font-weight:400;text-transform:uppercase}
.mm-sub{margin-top:22px;font-size:10px;letter-spacing:.34em;color:var(--dimmer);text-transform:uppercase}
.mm-menu{margin-top:clamp(18px,3vh,38px);display:flex;flex-direction:column;gap:4px;width:min(270px,74vw)}
.mm-menu .btn{text-align:left;padding:12px 18px;font-size:11px;letter-spacing:.26em}
.mm-foot{position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:9.5px;letter-spacing:.26em;color:var(--dimmer);text-transform:uppercase}
.mm-build{position:absolute;top:26px;right:30px;font-size:9.5px;letter-spacing:.2em;color:var(--dimmer);text-align:right;line-height:1.7}
#loading{position:absolute;inset:0;background:#060706;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:60;transition:opacity .6s}
#loading.done{opacity:0;pointer-events:none}
.load-title{font-size:13px;letter-spacing:.5em;color:var(--paper-2);text-transform:uppercase;margin-bottom:20px}
.load-bar{width:320px;height:2px;background:#1c201b;position:relative;overflow:hidden}
.load-bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--amber);transition:width .3s}
.load-step{font-size:9.5px;letter-spacing:.22em;color:var(--dimmer);text-transform:uppercase;margin-top:10px;height:14px}
.load-tip{position:absolute;bottom:40px;font-size:10px;letter-spacing:.16em;color:var(--dimmer);max-width:520px;text-align:center;line-height:1.7}

/* scrollbars */
 ::-webkit-scrollbar{width:7px;height:7px}
::-webkit-scrollbar-track{background:rgba(12,14,12,.6)}
::-webkit-scrollbar-thumb{background:#333a30;border:1px solid #22261f}
::-webkit-scrollbar-thumb:hover{background:#4a5242}

/* fades */
.fade-in{animation:fadeIn .25s ease-out}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.hidden{display:none!important}
.no-anim *{transition:none!important;animation:none!important}
`;
