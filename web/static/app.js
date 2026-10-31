const PRESETS = {
  sakura: {
    title: "EP.01 КЛЯТВА САКУРЫ",
    synopsis: "Алая мечница Аканэ встречает теневого ронина Куро у Храма Сакуры на закате и наносит решающий сакуга-удар полумесяцем",
    seed: 2026
  },
  cyber: {
    title: "EP.02 НЕОНОВЫЙ КЛИНОК",
    synopsis: "Синеволосый кибер-синоби Рэн мчится по крыше Нео-Токио сквозь ливень в неоновый шторм и вступает в дуэль на катанах",
    seed: 3077
  },
  astral: {
    title: "EP.03 ЗВЁЗДНЫЙ ПОЕЗД",
    synopsis: "Сереброволосая ведьма Лумина стоит на морской станции на закате, произносит монолог и выпускает звёздный магический луч",
    seed: 4096
  },
  bamboo: {
    title: "EP.04 ТЕНЬ ЛУНЫ",
    synopsis: "Теневой ронин Куро идёт сквозь лунный бамбуковый лес в полночь, пробуждает боевую ауру и скрещивает мечи с паладином",
    seed: 5120
  }
};

let currentLabSession = null;
let appInfo = null;

function $(id) {
  return document.getElementById(id);
}

// Tab switching
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $(btn.dataset.tab).classList.add("active");
  });
});

// Range label sync
function bindRange(inputId, labelId, fmt) {
  const el = $(inputId);
  const lbl = $(labelId);
  const update = () => { lbl.textContent = fmt(el.value); };
  el.addEventListener("input", update);
  update();
}

bindRange("ep-shots", "lbl-ep-shots", (v) => `${v} (${Number(v) * 16} кадр.)`);
bindRange("ep-fps", "lbl-ep-fps", (v) => v);
bindRange("ep-ode", "lbl-ep-ode", (v) => v);
bindRange("ep-cfg", "lbl-ep-cfg", (v) => Number(v).toFixed(2));
bindRange("lab-ode", "lbl-lab-ode", (v) => v);
bindRange("lab-cfg", "lbl-lab-cfg", (v) => Number(v).toFixed(2));

// Presets
document.querySelectorAll(".chip[data-preset]").forEach((ch) => {
  ch.addEventListener("click", () => {
    const p = PRESETS[ch.dataset.preset];
    if (!p) return;
    $("ep-title").value = p.title;
    $("ep-synopsis").value = p.synopsis;
    $("ep-seed").value = p.seed;
  });
});

function populateSelect(selId, items) {
  const sel = $(selId);
  if (!sel) return;
  items.forEach((it) => {
    const opt = document.createElement("option");
    opt.value = it.id;
    opt.textContent = it.name_ru;
    sel.appendChild(opt);
  });
}

function renderDownloadButtons(containerId, urls) {
  const box = $(containerId);
  box.innerHTML = "";
  const entries = [
    ["apng", "⬇ APNG (Lossless)"],
    ["gif", "⬇ GIF89a"],
    ["mp4", "⬇ MP4 (H.264)"],
    ["wav", "⬇ OST .WAV"],
    ["storyboard", "⬇ Раскадровка PNG"]
  ];
  entries.forEach(([key, label]) => {
    if (urls && urls[key]) {
      const a = document.createElement("a");
      a.className = "dl-btn";
      a.href = urls[key];
      a.download = "";
      a.textContent = label;
      box.appendChild(a);
    }
  });
}

function displayEpisode(ep) {
  $("ep-now-playing").textContent = `${ep.title} (${ep.total_frames} кадров, ${ep.duration_sec} сек)`;
  const cacheBust = `?t=${Date.now()}`;
  // Prefer lossless 24-bit APNG for crisp browser playback, fallback to GIF
  $("ep-viewport-img").src = (ep.urls.apng || ep.urls.gif) + cacheBust;
  $("ep-res-tag").textContent = `256×256 • ${ep.total_frames} кадр. • ${ep.fps} FPS`;

  if (ep.urls.wav) {
    const aud = $("ep-audio");
    aud.src = ep.urls.wav + cacheBust;
  }

  $("ep-meta-line").textContent =
    `Сгенерировано за ${ep.generation_time_sec} с | ODE: ${ep.solver.toUpperCase()} (${ep.ode_steps} шаг., CFG ${ep.cfg_scale})`;

  renderDownloadButtons("ep-downloads", ep.urls);

  // Denoising progression strip
  const dstrip = $("ep-denoise-strip");
  dstrip.innerHTML = "";
  const taus = ["τ = 0.00 (Шум)", "τ = 0.20", "τ = 0.40", "τ = 0.60", "τ = 0.80", "τ = 1.00 (Кадр)"];
  (ep.denoise_urls || []).forEach((u, i) => {
    const div = document.createElement("div");
    div.className = "denoise-item";
    div.innerHTML = `<img class="pixel-img" src="${u}${cacheBust}" alt="step ${i}"/><span>${taus[i] || ""}</span>`;
    dstrip.appendChild(div);
  });

  // Storyboard cards
  const sb = $("ep-storyboard");
  sb.innerHTML = "";
  (ep.storyboard || []).forEach((sh) => {
    const card = document.createElement("div");
    card.className = "shot-card";
    const zBadge = sh.use_z_prev ? `<span class="zprev-pill">z_prev склейка</span>` : "";
    card.innerHTML = `
      <img class="pixel-img" src="${sh.keyframe_url}${cacheBust}" alt="Shot ${sh.shot_index}"/>
      <div class="shot-body">
        <div class="shot-head">
          <span>Сцена #${sh.shot_index} (${sh.gen_ms || "—"} мс)</span>
          ${zBadge}
        </div>
        <div class="shot-meta">${sh.framing_label} • ${sh.action_label}</div>
        <div class="shot-sub">${sh.subtitle || ""}</div>
      </div>
    `;
    sb.appendChild(card);
  });
}

function drawCurveChart(canvasId, values, color, label, isPercent = false) {
  const cv = $(canvasId);
  if (!cv || !values || !values.length) return;
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 48, padR = 18, padT = 22, padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const vals = isPercent ? values.map((v) => v * 100.0) : values;
  let minV = Math.min(...vals);
  let maxV = Math.max(...vals);
  if (Math.abs(maxV - minV) < 1e-5) maxV = minV + 1;

  // Grid lines
  ctx.strokeStyle = "#222645";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#8d95bd";
  ctx.font = "11px monospace";
  for (let g = 0; g <= 4; g++) {
    const y = padT + (plotH * g) / 4;
    const v = maxV - ((maxV - minV) * g) / 4;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.fillText(isPercent ? `${v.toFixed(0)}%` : v.toFixed(3), 6, y + 4);
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  grad.addColorStop(0, color + "55");
  grad.addColorStop(1, color + "05");

  ctx.beginPath();
  vals.forEach((v, i) => {
    const x = padL + (plotW * i) / Math.max(1, vals.length - 1);
    const y = padT + plotH * (1 - (v - minV) / (maxV - minV));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.lineTo(padL, padT + plotH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = "#e5e9ff";
  ctx.font = "bold 11px sans-serif";
  const lastVal = vals[vals.length - 1];
  ctx.fillText(
    `${label}: старт ${vals[0].toFixed(isPercent ? 1 : 3)}${isPercent ? "%" : ""} → финал ${lastVal.toFixed(isPercent ? 1 : 3)}${isPercent ? "%" : ""}`,
    padL + 6,
    15
  );
}

async function initStudio() {
  const res = await fetch("/api/info");
  appInfo = await res.json();

  const st = appInfo.stats;
  $("badge-params").textContent = `${(st.total_params / 1e6).toFixed(2)}M параметров (C++17)`;
  $("badge-steps").textContent = `Обучено: VAE ${st.vae_trained_steps} шаг. | DiT ${st.dit_trained_steps} шаг.`;

  const cat = appInfo.catalog;
  populateSelect("ep-hero", cat.heroes);
  populateSelect("ep-scene", cat.scenes);
  populateSelect("lab-hero", cat.heroes);
  populateSelect("lab-scene", cat.scenes);
  populateSelect("lab-time", cat.times);
  populateSelect("lab-framing", cat.framings);
  populateSelect("lab-action", cat.actions);
  populateSelect("lab-camera", cat.cameras);
  populateSelect("lab-fx", cat.fx);

  // Palette swatches
  const pgrid = $("palette-grid");
  pgrid.innerHTML = "";
  (appInfo.palette_hex || []).forEach((hex, idx) => {
    const s = document.createElement("div");
    s.className = "swatch";
    s.style.background = hex;
    s.title = `#${idx}: ${hex}`;
    pgrid.appendChild(s);
  });

  // Training curves
  const curves = (appInfo.metrics && appInfo.metrics.curves) || {};
  drawCurveChart("chart-vae", curves.vae_acc || [], "#50e898", "Точность пикселей VAE", true);
  drawCurveChart("chart-dit", curves.dit_loss || [], "#3ed4ff", "Rectified Flow MSE Loss", false);

  // Pre-loaded showcase episodes
  const switcher = $("showcase-switcher");
  switcher.innerHTML = "";
  if (appInfo.showcases && appInfo.showcases.length > 0) {
    appInfo.showcases.forEach((sc, idx) => {
      const ch = document.createElement("span");
      ch.className = "chip";
      ch.textContent = `▶ Демо ${idx + 1}: ${sc.title}`;
      ch.addEventListener("click", () => displayEpisode(sc));
      switcher.appendChild(ch);
    });
    displayEpisode(appInfo.showcases[0]);
  }
}

// Generate Full Episode
$("btn-gen-episode").addEventListener("click", async () => {
  const btn = $("btn-gen-episode");
  const status = $("ep-status");
  btn.disabled = true;
  const shots = Number($("ep-shots").value);
  status.textContent = `Генерация ${shots} сцен (${shots * 16} кадров 256×256) из гауссова шума через SakugaDiT + синтез WAV и MP4...`;

  try {
    const heroVal = Number($("ep-hero").value);
    const sceneVal = Number($("ep-scene").value);
    const payload = {
      title: $("ep-title").value,
      synopsis: $("ep-synopsis").value,
      num_shots: shots,
      fps: Number($("ep-fps").value),
      ode_steps: Number($("ep-ode").value),
      cfg_scale: Number($("ep-cfg").value),
      solver: $("ep-solver").value,
      use_scale2x: $("ep-scale2x").checked,
      subtitles: $("ep-subs").checked,
      hero_override: heroVal >= 0 ? heroVal : null,
      scene_override: sceneVal >= 0 ? sceneVal : null,
      seed: Number($("ep-seed").value) || 2026
    };

    const res = await fetch("/api/generate_episode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ep = await res.json();
    displayEpisode(ep);
    status.textContent = `Готово! Серия «${ep.title}» (${ep.total_frames} кадров) создана нейросетью за ${ep.generation_time_sec} сек.`;
  } catch (err) {
    status.textContent = `Ошибка генерации: ${err.message}`;
  } finally {
    btn.disabled = false;
  }
});

// Lab Single-Shot & Autoregressive Continuation
async function runLabShot(continuePrev) {
  const btnNew = $("btn-lab-new");
  const btnCont = $("btn-lab-cont");
  const status = $("lab-status");
  btnNew.disabled = true;
  btnCont.disabled = true;

  status.textContent = continuePrev
    ? "Авторегрессионное продолжение (+16 кадров) из латента последнего кадра z_prev..."
    : "Интегрирование ODE SakugaDiT из чистого гауссова шума z₀ ~ N(0, I)...";

  const optInt = (id) => {
    const v = Number($(id).value);
    return v >= 0 ? v : null;
  };

  try {
    const payload = {
      prompt: $("lab-prompt").value,
      session_id: continuePrev ? currentLabSession : null,
      continue_from_prev: continuePrev,
      hero_id: optInt("lab-hero"),
      scene_id: optInt("lab-scene"),
      time_id: optInt("lab-time"),
      framing_id: optInt("lab-framing"),
      action_id: optInt("lab-action"),
      camera_id: optInt("lab-camera"),
      fx_id: optInt("lab-fx"),
      ode_steps: Number($("lab-ode").value),
      cfg_scale: Number($("lab-cfg").value),
      solver: "heun",
      use_scale2x: true,
      fps: 10,
      seed: Number($("lab-seed").value) || 777
    };

    const res = await fetch("/api/generate_shot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    currentLabSession = data.session_id;
    const cb = `?t=${Date.now()}`;
    $("lab-viewport-img").src = data.urls.apng + cb;
    $("lab-audio").src = data.urls.wav + cb;
    $("lab-attn-img").src = data.attention_DataUrl;
    $("lab-len-badge").textContent = `${data.total_frames} кадров (${data.chunks_count}×16) @ 256×256`;

    renderDownloadButtons("lab-downloads", data.urls);

    const dstrip = $("lab-denoise-strip");
    dstrip.innerHTML = "";
    const taus = ["τ = 0.00 (Шум)", "τ = 0.20", "τ = 0.40", "τ = 0.60", "τ = 0.80", "τ = 1.00 (Финал)"];
    (data.denoise_DataUrls || []).forEach((du, idx) => {
      const div = document.createElement("div");
      div.className = "denoise-item";
      div.innerHTML = `<img class="pixel-img" src="${du}" alt="tau ${idx}"/><span>${taus[idx]}</span>`;
      dstrip.appendChild(div);
    });

    status.textContent = `Сгенерировано за ${data.gen_ms} мс! Длина ролика: ${data.total_frames} кадров. Нажмите «Продолжить (+16 кадр.)», чтобы дорастить сцену дальше!`;
    btnCont.disabled = false;
  } catch (err) {
    status.textContent = `Ошибка: ${err.message}`;
  } finally {
    btnNew.disabled = false;
    if (currentLabSession) btnCont.disabled = false;
  }
}

$("btn-lab-new").addEventListener("click", () => runLabShot(false));
$("btn-lab-cont").addEventListener("click", () => runLabShot(true));

// Live Fine-Tuning
$("btn-finetune").addEventListener("click", async () => {
  const btn = $("btn-finetune");
  const status = $("ft-status");
  btn.disabled = true;
  const steps = Number($("ft-steps").value) || 40;
  const lr = Number($("ft-lr").value) || 0.0003;
  status.textContent = `Выполняется ${steps} шагов обратного распространения ошибки (AdamW + EMA) в C++17 движке...`;

  try {
    const res = await fetch("/api/finetune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dit_steps: steps, lr })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const out = await res.json();
    status.textContent = `Дообучение завершено за ${out.elapsed_sec} с! Шагов DiT: ${out.stats.dit_trained_steps}, Flow-Matching MSE: ${out.loss_start} → ${out.loss_end}. Чекпоинт обновлён!`;
    await initStudio();
  } catch (err) {
    status.textContent = `Ошибка дообучения: ${err.message}`;
  } finally {
    btn.disabled = false;
  }
});

initStudio();
