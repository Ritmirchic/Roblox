// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Frame rendering, HUD and menu screens (included by game.cpp).
// ============================================================================
#include "game/game.h"
#include "platform/window.h"
#include <algorithm>
#include <cmath>

namespace aoh {

static f32 saturateF(f32 v) { return v < 0.0f ? 0.0f : (v > 1.0f ? 1.0f : v); }

static Vec4 rarityColor(int r) {
  switch (r) {
    case R_UNCOMMON:  return Vec4(0.45f, 0.85f, 0.45f, 1.0f);
    case R_RARE:      return Vec4(0.40f, 0.60f, 0.95f, 1.0f);
    case R_EPIC:      return Vec4(0.72f, 0.42f, 0.92f, 1.0f);
    case R_LEGENDARY: return Vec4(0.98f, 0.72f, 0.25f, 1.0f);
    default:          return Vec4(0.80f, 0.80f, 0.80f, 1.0f);
  }
}

// ---------------------------------------------------------------------------
// The loading screen is shown while the assets and the world are generated.
// ---------------------------------------------------------------------------
void Game::drawLoadingScreen(float progress, const char* label) {
  if (!m_renderer) return;
  int w = m_renderer->settings.width;
  int h = m_renderer->settings.height;

  // A simple camera so the sky can be rendered behind the artwork.
  CameraState cam;
  cam.pos = Vec3(0.0f, 40.0f, 0.0f);
  cam.forward = normalize(Vec3(0.0f, -0.12f, -1.0f));
  cam.up = Vec3(0.0f, 1.0f, 0.0f);
  Mat4 view = Mat4::lookAt(cam.pos, cam.pos + cam.forward, cam.up);
  f32 aspect = (f32)w / (f32)std::max(1, h);
  Mat4 proj = Mat4::perspective(60.0f * DEG, aspect, 0.1f, 900.0f);
  m_renderer->setCamera(view, proj, cam.pos);

  SkyState sky;
  sky.sunDir = normalize(Vec3(0.35f, 0.28f, -0.9f));
  sky.zenith = Vec3(0.035f, 0.045f, 0.085f);
  sky.horizon = Vec3(0.13f, 0.12f, 0.13f);
  sky.ground = Vec3(0.04f, 0.04f, 0.045f);
  sky.sunColor = Vec3(1.0f, 0.72f, 0.45f);
  sky.sunIntensity = 0.9f;
  sky.skyExposure = 0.7f;
  m_renderer->setSky(sky);
  FogState fog;
  fog.color = Vec3(0.09f, 0.09f, 0.10f);
  fog.density = 0.004f;
  fog.height = 8.0f;
  fog.start = 10.0f;
  m_renderer->setFog(fog);
  m_renderer->clearLights();
  m_renderer->setExposure(0.7f);
  m_renderer->setBloom(0.4f);
  m_renderer->setTime(m_time);
  m_renderer->setColorGrade(0.8f, 1.05f, Vec3(0.01f, 0.005f, 0.0f), Vec3(1, 1, 1), Vec3(1, 1, 1));
  m_renderer->setDamage(0.0f);
  m_renderer->setVignette(0.5f);
  m_renderer->setFade(0.0f, Vec3(0, 0, 0));

  m_ui.begin(w, h);
  f32 W = (f32)w, H = (f32)h;
  if (m_loadingBg) m_ui.imageCover(0, 0, W, H, m_loadingBg, Vec4(0.85f, 0.85f, 0.85f, 0.92f));
  m_ui.gradientV(0, 0, W, H, Vec4(0.02f, 0.02f, 0.025f, 0.55f), Vec4(0.03f, 0.03f, 0.03f, 0.85f));
  if (m_titleLogo) {
    f32 s = 256.0f;
    m_ui.image(W * 0.5f - s * 0.5f, H * 0.5f - s * 0.5f - 30.0f, s, s, m_titleLogo,
               Vec4(0.95f, 0.95f, 0.95f, 0.95f));
  }
  m_ui.text(W * 0.5f - 250.0f, H * 0.5f + 150.0f, "ASHES OF HUMANITY: LAST SIGNAL",
            Vec4(0.86f, 0.80f, 0.66f, 1.0f), 1.6f);
  m_ui.text(W * 0.5f - 60.0f, H * 0.5f + 190.0f, label, Vec4(0.62f, 0.63f, 0.66f, 1.0f), 1.1f);
  m_ui.bar(W * 0.5f - 220.0f, H * 0.5f + 212.0f, 440.0f, 6.0f, progress,
           Vec4(0.86f, 0.63f, 0.23f, 1.0f), Vec4(0.10f, 0.10f, 0.11f, 0.9f));
  m_ui.end();
  m_renderer->render();
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
void Game::render() {
  if (!m_renderer) return;
  m_renderer->beginFrame();

  // ---- camera ------------------------------------------------------------
  CameraState cam;
  m_playerCtrl.buildCamera(m_player, m_world, cam, m_firstPerson, m_settings.fov);
  if (m_cutsceneActive) {
    cam.pos = m_cutsceneCamPos;
    cam.forward = normalize(m_cutsceneCamTarget - m_cutsceneCamPos);
  }
  Mat4 view = Mat4::lookAt(cam.pos, cam.pos + cam.forward, cam.up);
  f32 aspect = (f32)m_renderer->settings.width / (f32)std::max(1, m_renderer->settings.height);
  Mat4 proj = Mat4::perspective(m_settings.fov * DEG, aspect, 0.08f, 900.0f);
  m_renderer->setCamera(view, proj, cam.pos);

  // ---- sky / sun ---------------------------------------------------------
  f32 tod = m_ctx.timeOfDay;
  f32 sunAngle = (tod / 24.0f) * TAU - PI * 0.5f;
  SkyState sky;
  sky.sunDir = normalize(Vec3(cosf(sunAngle) * 0.6f, sinf(sunAngle), cosf(sunAngle) * 0.4f + 0.3f));
  f32 day = saturateF(sky.sunDir.y * 1.4f + 0.25f);
  f32 dusk = saturateF(1.0f - fabsf(sky.sunDir.y) * 3.2f);
  sky.zenith = Vec3(lerpf(0.035f, 0.17f, day), lerpf(0.045f, 0.28f, day),
                    lerpf(0.085f, 0.46f, day));
  sky.horizon = Vec3(lerpf(0.10f, 0.46f, day) + dusk * 0.32f,
                     lerpf(0.10f, 0.48f, day) + dusk * 0.12f,
                     lerpf(0.13f, 0.50f, day));
  sky.ground = Vec3(0.05f, 0.05f, 0.055f);
  sky.sunColor = Vec3(1.0f, lerpf(0.62f, 0.94f, day), lerpf(0.38f, 0.86f, day));
  sky.sunIntensity = lerpf(0.15f, 3.4f, day) * (1.0f - m_weather.cloud * 0.55f);
  sky.skyExposure = lerpf(0.55f, 1.15f, day);
  m_renderer->setSky(sky);

  FogState fog;
  fog.color = Vec3(lerpf(0.06f, 0.46f, day), lerpf(0.07f, 0.47f, day), lerpf(0.09f, 0.50f, day));
  fog.density = m_weather.fog;
  fog.height = 6.0f;
  fog.start = 8.0f;
  m_renderer->setFog(fog);

  m_renderer->clearLights();
  LightEntry sun;
  sun.position = cam.pos + sky.sunDir * 200.0f;
  sun.direction = -sky.sunDir;
  sun.color = sky.sunColor;
  sun.intensity = sky.sunIntensity;
  sun.range = 500.0f;
  m_renderer->addLight(sun);

  // the player's torch / muzzle light
  if (m_state == GS_PLAYING) {
    LightEntry torch;
    torch.position = cam.pos;
    torch.direction = cam.forward;
    torch.color = Vec3(1.0f, 0.93f, 0.78f);
    torch.intensity = 2.2f;
    torch.range = 26.0f;
    torch.spot = true;
    m_renderer->addLight(torch);
  }

  // ---- world -------------------------------------------------------------
  renderWorld();

  // ---- particles ---------------------------------------------------------
  ParticleDraw pd;
  pd.texture = nullptr;
  for (const Particle& p : m_particles) {
    pd.offsets.push_back(p.pos);
    f32 a = (p.maxLife > 0.0f) ? saturateF(p.life / p.maxLife) : 1.0f;
    pd.colors.push_back(Vec4(p.color.x, p.color.y, p.color.z, a));
    pd.params.push_back(Vec3(p.size, 0.0f, 0.0f));
  }
  if (!pd.offsets.empty()) m_renderer->submitParticles(pd);

  // ---- post --------------------------------------------------------------
  f32 lowHp = 1.0f - saturateF(m_player.stats.health / std::max(1.0f, m_player.stats.maxHealth));
  m_renderer->setDamage(saturateF(m_damageFlash + lowHp * 0.35f));
  m_renderer->setVignette(0.35f + lowHp * 0.45f);
  m_renderer->setExposure(sky.skyExposure * (1.0f - m_weather.cloud * 0.2f));
  m_renderer->setBloom(m_settings.bloom ? 0.55f : 0.0f);
  m_renderer->setTime(m_time);
  m_renderer->setColorGrade(0.82f, 1.06f, Vec3(0.01f, 0.005f, 0.0f), Vec3(1, 1, 1), Vec3(1, 1, 1));

  // The interface is built and submitted first: the renderer draws the UI
  // batches inside its own frame, so they have to exist before render().
  renderUI();
  m_renderer->render();
}

// ---------------------------------------------------------------------------
void Game::renderUI() {
  if (!m_renderer) return;
  int w = m_renderer->settings.width;
  int h = m_renderer->settings.height;
  m_ui.begin(w, h);

  if (m_state == GS_PLAYING || m_state == GS_PAUSED || m_state == GS_BUILD ||
      m_state == GS_DEATH || m_state == GS_CUTSCENE) {
    drawHUD();
  }
  if (m_state != GS_PLAYING) drawScreen(m_state);
  m_ui.end();
}

// ---------------------------------------------------------------------------
void Game::drawHUD() {
  const Vec4 white(0.86f, 0.87f, 0.88f, 1.0f);
  const Vec4 dim(0.55f, 0.57f, 0.60f, 1.0f);
  const Vec4 accent(0.85f, 0.62f, 0.22f, 1.0f);
  const Vec4 danger(0.80f, 0.20f, 0.17f, 1.0f);
  const Vec4 good(0.35f, 0.72f, 0.40f, 1.0f);

  // ---- crosshair ---------------------------------------------------------
  if (m_state == GS_PLAYING) {
    f32 cx = m_ui.width() * 0.5f, cy = m_ui.height() * 0.5f;
    f32 spread = 6.0f;
    const ItemDef& idef = m_items.def(m_player.equip[EQ_MAIN].defId >= 0 ?
                                      m_player.equip[EQ_MAIN].defId : 0);
    if (idef.weaponId >= 0) {
      const WeaponDef& wd = m_weapons.def(idef.weaponId);
      spread = 4.0f + wd.spread * 900.0f * (m_player.ads ? 0.35f : 1.0f) *
               (1.0f + length(m_player.vel) * 0.12f);
    }
    for (int i = 0; i < 4; ++i) {
      f32 dx = (i == 0) ? -1 : (i == 1) ? 1 : 0;
      f32 dy = (i == 2) ? -1 : (i == 3) ? 1 : 0;
      m_ui.rect(cx + dx * spread, cy + dy * spread - 0.5f, dx ? 6.0f : 1.0f,
                dy ? 6.0f : 1.0f, Vec4(0.9f, 0.9f, 0.85f, 0.75f));
    }
    m_ui.rect(cx - 1.0f, cy - 1.0f, 2.0f, 2.0f, Vec4(0.95f, 0.85f, 0.5f, 0.9f));
  }

  // ---- vitals ------------------------------------------------------------
  f32 bx = 28.0f, by = m_ui.height() - 176.0f;
  const f32 barW = 236.0f;
  auto statBar = [&](const char* label, f32 value, f32 maxv, const Vec4& fill, f32 ox) {
    m_ui.text(bx + ox, by, label, dim, 1.0f);
    m_ui.bar(bx + ox, by + 10.0f, 108.0f, 9.0f, value / std::max(0.001f, maxv), fill,
             Vec4(0.08f, 0.09f, 0.10f, 0.85f));
  };
  statBar("HP", m_player.stats.health, m_player.stats.maxHealth,
          m_player.stats.health < m_player.stats.maxHealth * 0.3f ? danger : Vec4(0.62f, 0.20f, 0.18f, 1), 0);
  statBar("STA", m_player.stats.stamina, m_player.stats.maxStamina, Vec4(0.35f, 0.62f, 0.30f, 1), 128);
  statBar("FOOD", m_player.stats.hunger, 100.0f,
          m_player.stats.hunger < 25 ? danger : Vec4(0.60f, 0.48f, 0.22f, 1), 0);
  statBar("WATER", m_player.stats.thirst, 100.0f,
          m_player.stats.thirst < 25 ? danger : Vec4(0.22f, 0.45f, 0.62f, 1), 128);
  statBar("TEMP", (m_player.stats.temperature + 20.0f) * 2.0f, 100.0f,
          m_player.stats.temperature < 30 ? Vec4(0.30f, 0.55f, 0.85f, 1) : Vec4(0.72f, 0.44f, 0.24f, 1), 0);
  statBar("RAD", m_player.stats.radiation, 100.0f, Vec4(0.62f, 0.70f, 0.22f, 1), 128);
  statBar("INFC", m_player.stats.infection, 100.0f, Vec4(0.48f, 0.25f, 0.55f, 1), 0);
  statBar("STRESS", m_player.stats.stress, 100.0f, Vec4(0.55f, 0.35f, 0.55f, 1), 128);

  // bleeding warning
  if (m_player.body.totalBleed() > 0.0f) {
    m_ui.text(bx, by - 16.0f, "BLEEDING - PRESS F", danger, 1.2f);
  }

  // ---- ammo --------------------------------------------------------------
  f32 ax = m_ui.width() - 108.0f, ay = m_ui.height() - 74.0f;
  ItemStack& gun = m_player.equip[EQ_MAIN];
  if (gun.defId >= 0) {
    const ItemDef& idef = m_items.def(gun.defId);
    std::string ammo = std::to_string(gun.ammo) + " / " +
                       std::to_string(m_player.equip[EQ_MAIN].ammo);
    if (idef.weaponId >= 0) {
      const WeaponDef& wd = m_weapons.def(idef.weaponId);
      ammo = std::to_string(gun.ammo) + " | " + std::to_string(wd.magSize);
    }
    m_ui.textShadow(ax, ay, ammo, white, 2.4f);
    m_ui.text(ax, ay + 24.0f, idef.name, dim, 1.0f);
    if (m_player.reloading) {
      m_ui.text(ax - 40.0f, ay - 18.0f, "RELOADING", accent, 1.2f);
    }
  }

  // ---- compass -----------------------------------------------------------
  f32 compW = 320.0f;
  f32 compX = (m_ui.width() - compW) * 0.5f;
  m_ui.rect(compX, 18.0f, compW, 22.0f, Vec4(0.04f, 0.045f, 0.05f, 0.55f));
  static const char* dirs[8] = { "N", "NE", "E", "SE", "S", "SW", "W", "NW" };
  f32 yawDeg = m_player.yaw * 180.0f / PI;
  for (int i = 0; i < 8; ++i) {
    f32 d = (f32)i * 45.0f;
    f32 diff = d - yawDeg;
    while (diff > 180.0f) diff -= 360.0f;
    while (diff < -180.0f) diff += 360.0f;
    if (fabsf(diff) > 62.0f) continue;
    f32 px = compX + compW * 0.5f + diff / 62.0f * (compW * 0.5f);
    m_ui.text(px - 3.0f, 24.0f, dirs[i], (i % 2 == 0) ? white : dim, 1.0f);
  }
  m_ui.rect(compX + compW * 0.5f - 1.0f, 20.0f, 2.0f, 8.0f, accent);

  // ---- quest tracker -----------------------------------------------------
  f32 qy = 52.0f;
  int shown = 0;
  for (const Quest& q : m_quests.all()) {
    if (q.state != QS_ACTIVE) continue;
    if (shown >= 3) break;
    m_ui.text(28.0f, qy, q.title, accent, 1.0f);
    for (const Objective& o : q.objectives) {
      if (o.optional) continue;
      if (o.have >= o.need) continue;
      qy += 13.0f;
      m_ui.text(40.0f, qy, o.desc + "  (" + std::to_string(o.have) + "/" +
                                   std::to_string(o.need) + ")", dim, 1.0f);
    }
    qy += 20.0f;
    shown++;
  }

  // ---- boss bar ----------------------------------------------------------
  for (const Mutant& m : m_mutants) {
    if (m.boss < 0 || m.dead) continue;
    if (dist2D(m.pos, m_player.pos) > 45.0f) continue;
    const SpeciesDef& sp = m_ai.species(m.species);
    f32 bw = 520.0f;
    f32 bx2 = (m_ui.width() - bw) * 0.5f;
    m_ui.text(bx2, 62.0f, sp.name, Vec4(0.92f, 0.35f, 0.28f, 1.0f), 1.6f);
    m_ui.bar(bx2, 80.0f, bw, 12.0f, m.hp / m.maxHp, Vec4(0.68f, 0.16f, 0.14f, 1.0f),
             Vec4(0.06f, 0.05f, 0.05f, 0.9f));
    m_ui.text(bx2, 96.0f, "PHASE " + std::to_string(m.phase + 1), dim, 1.0f);
    break;
  }

  // ---- interaction prompt ------------------------------------------------
  if (!m_player.interactTarget.empty() && m_state == GS_PLAYING) {
    f32 px = m_ui.width() * 0.5f - 70.0f;
    m_ui.text(px, m_ui.height() * 0.5f + 46.0f, "[E]  SEARCH", white, 1.3f);
  }

  // ---- toast -------------------------------------------------------------
  if (m_toastTimer > 0.0f) {
    f32 a = saturateF(m_toastTimer);
    m_ui.textShadow(m_ui.width() * 0.5f - m_ui.textWidth(m_toast, 1.2f) * 0.5f,
                    m_ui.height() - 220.0f, m_toast, Vec4(0.92f, 0.88f, 0.72f, a), 1.2f);
  }

  // ---- performance overlay ----------------------------------------------
  if (m_showPerf && m_renderer) {
    char buf[160];
    snprintf(buf, sizeof(buf), "FPS %5.1f   FRAME %5.2f ms   DRAWS %d   TRIS %d",
             m_fps, m_frameMs, m_renderer->stats.drawCalls, m_renderer->stats.triangles);
    m_ui.text(14.0f, m_ui.height() - 268.0f, buf, Vec4(0.55f, 0.85f, 0.60f, 0.9f), 1.0f);
    const RegionDef& pr = m_world.region(m_world.regionAt(m_player.pos.x, m_player.pos.z));
    snprintf(buf, sizeof(buf), "POS %.1f %.1f %.1f   REGION %s   MUTANTS %d",
             m_player.pos.x, m_player.pos.y, m_player.pos.z, pr.name.c_str(),
             (int)m_mutants.size());
    m_ui.text(14.0f, m_ui.height() - 254.0f, buf, Vec4(0.55f, 0.85f, 0.60f, 0.9f), 1.0f);
  }

  // ---- region name -------------------------------------------------------
  int reg = m_world.regionAt(m_player.pos.x, m_player.pos.z);
  const RegionDef& r = m_world.region(reg);
  m_ui.text(m_ui.width() * 0.5f - m_ui.textWidth(r.name, 1.4f) * 0.5f, 104.0f,
            r.name, Vec4(0.80f, 0.80f, 0.78f, 0.85f), 1.4f);
  {
    int hour = (int)m_ctx.timeOfDay % 24;
    char tbuf[48];
    snprintf(tbuf, sizeof(tbuf), "%02d:00  DAY %d", hour, (int)(m_playTime / 300.0f) + 1);
    m_ui.text(m_ui.width() * 0.5f - 42.0f, 122.0f, tbuf, dim, 1.0f);
  }

  // ---- build mode --------------------------------------------------------
  if (m_state == GS_BUILD) {
    const char* pieces[BPB_COUNT] = { "1 Barricade", "2 Crate", "3 Sandbags", "4 Torch", "5 Wall" };
    for (int i = 0; i < BPB_COUNT; ++i) {
      Vec4 c = (i == m_buildPiece) ? accent : dim;
      m_ui.text(28.0f, m_ui.height() - 250.0f + i * 16.0f, pieces[i], c, 1.1f);
    }
    m_ui.text(m_ui.width() - 220.0f, m_ui.height() - 250.0f, "LEFT CLICK - PLACE", dim, 1.1f);
    m_ui.text(m_ui.width() - 220.0f, m_ui.height() - 232.0f, "ENTER - FINISH", dim, 1.1f);
  }
}

// ---------------------------------------------------------------------------
void Game::drawScreen(GameState s) {
  const Vec4 white(0.88f, 0.89f, 0.90f, 1.0f);
  const Vec4 dim(0.52f, 0.54f, 0.57f, 1.0f);
  const Vec4 accent(0.86f, 0.63f, 0.23f, 1.0f);
  f32 W = (f32)m_ui.width(), H = (f32)m_ui.height();

  switch (s) {
    case GS_MAIN_MENU: {
      if (m_menuBg) m_ui.imageCover(0, 0, W, H, m_menuBg, Vec4(1, 1, 1, 1));
      m_ui.gradientV(0, 0, W, H, Vec4(0.02f, 0.025f, 0.03f, 0.72f),
                     Vec4(0.06f, 0.055f, 0.05f, 0.35f));
      if (m_titleLogo) {
        f32 s = 240.0f;
        m_ui.image(W * 0.5f - s * 0.5f, H * 0.09f, s, s, m_titleLogo, Vec4(1, 1, 1, 0.92f));
      }
      m_ui.text(W * 0.5f - 320.0f, H * 0.18f, "ASHES OF HUMANITY", Vec4(0.86f, 0.83f, 0.78f, 1), 4.2f);
      m_ui.text(W * 0.5f - 128.0f, H * 0.18f + 42.0f, "LAST SIGNAL", accent, 3.0f);
      m_ui.rect(W * 0.5f - 190.0f, H * 0.18f + 76.0f, 380.0f, 1.0f, Vec4(0.45f, 0.38f, 0.26f, 0.7f));
      const char* entries[4] = { "NEW GAME", "CONTINUE", "SETTINGS", "QUIT" };
      for (int i = 0; i < 4; ++i) {
        f32 y = H * 0.45f + i * 30.0f;
        Vec4 c = (i == m_menuIndex) ? accent : white;
        if (i == m_menuIndex) m_ui.rect(W * 0.5f - 120.0f, y - 4.0f, 240.0f, 20.0f, Vec4(0.16f, 0.13f, 0.07f, 0.8f));
        m_ui.text(W * 0.5f - 70.0f, y, entries[i], c, 1.8f);
      }
      m_ui.text(W * 0.5f - 150.0f, H - 60.0f, "ORIGINAL GAME  /  WINDOWS 64-BIT  /  v1.0.0", dim, 1.0f);
      // menu input
      if (Input::keyPressed(KEY_W) || Input::keyPressed(KEY_UP)) m_menuIndex = (m_menuIndex + 3) % 4;
      if (Input::keyPressed(KEY_S) || Input::keyPressed(KEY_DOWN)) m_menuIndex = (m_menuIndex + 1) % 4;
      if (Input::keyPressed(KEY_ENTER) || Input::keyPressed(KEY_SPACE)) {
        m_audio.playUI(SND_UI_CLICK, 0.5f);
        switch (m_menuIndex) {
          case 0: setState(GS_NEW_GAME); break;
          case 1: {
            SaveData d;
            if (SaveSystem::read(d, 0)) {
              m_playerCtrl.applySave(m_player, d);
              m_quests.applySave(d);
              m_ctx.timeOfDay = d.timeOfDay;
              m_playTime = d.playTime;
              setState(GS_PLAYING);
            } else {
              m_toast = "No save found"; m_toastTimer = 2.0f;
            }
            break;
          }
          case 2: setState(GS_SETTINGS); break;
          case 3: m_quit = true; break;
        }
      }
      break;
    }
    case GS_NEW_GAME: {
      if (m_menuBg) m_ui.imageCover(0, 0, W, H, m_menuBg, Vec4(0.85f, 0.85f, 0.85f, 0.55f));
      m_ui.gradientV(0, 0, W, H, Vec4(0.02f, 0.025f, 0.03f, 0.88f),
                     Vec4(0.05f, 0.05f, 0.045f, 0.55f));
      m_ui.text(W * 0.5f - 160.0f, H * 0.20f, "ASHES OF HUMANITY", white, 3.4f);
      const char* lines[5] = {
        "Six years after the collapse, the dead do not stay down and the",
        "sky has not been properly blue in a very long time.  A radio signal",
        "repeats every hour on a frequency nobody should know.  Something in",
        "the Red Wasteland is calling for help.  You are the only one left",
        "listening."
      };
      for (int i = 0; i < 5; ++i)
        m_ui.text(W * 0.5f - 300.0f, H * 0.34f + i * 18.0f, lines[i], dim, 1.2f);
      m_ui.text(W * 0.5f - 90.0f, H * 0.58f, "[ENTER]  BEGIN", accent, 2.0f);
      if (Input::keyPressed(KEY_ENTER) || Input::keyPressed(KEY_SPACE)) {
        setState(GS_PLAYING);
        startCutscene(0);
      }
      if (Input::keyPressed(KEY_ESCAPE)) setState(GS_MAIN_MENU);
      break;
    }
    case GS_PAUSED: {
      m_ui.rect(0, 0, W, H, Vec4(0, 0, 0, 0.62f));
      m_ui.text(W * 0.5f - 70.0f, H * 0.22f, "PAUSED", white, 3.0f);
      const char* entries[6] = { "RESUME", "INVENTORY", "JOURNAL", "SKILLS", "SETTINGS", "MAIN MENU" };
      for (int i = 0; i < 6; ++i) {
        f32 y = H * 0.36f + i * 28.0f;
        Vec4 c = (i == m_menuIndex) ? accent : white;
        m_ui.text(W * 0.5f - 70.0f, y, entries[i], c, 1.7f);
      }
      if (Input::keyPressed(KEY_W) || Input::keyPressed(KEY_UP)) m_menuIndex = (m_menuIndex + 5) % 6;
      if (Input::keyPressed(KEY_S) || Input::keyPressed(KEY_DOWN)) m_menuIndex = (m_menuIndex + 1) % 6;
      if (Input::keyPressed(KEY_ENTER)) {
        switch (m_menuIndex) {
          case 0: setState(GS_PLAYING); break;
          case 1: setState(GS_INVENTORY); break;
          case 2: setState(GS_JOURNAL); break;
          case 3: setState(GS_SKILLS); break;
          case 4: setState(GS_SETTINGS); break;
          case 5: setState(GS_MAIN_MENU); break;
        }
      }
      break;
    }
    case GS_INVENTORY: {
      m_ui.rect(0, 0, W, H, Vec4(0.02f, 0.022f, 0.025f, 0.94f));
      m_ui.text(40.0f, 30.0f, "INVENTORY", white, 2.4f);
      // equipment
      // tabs
      const char* tabs[3] = { "GEAR", "MEDICAL", "WEAPON" };
      for (int t = 0; t < 3; ++t) {
        f32 tx = 40.0f + t * 120.0f;
        Vec4 c = (t == m_invTab) ? accent : dim;
        if (t == m_invTab) m_ui.rect(tx - 6.0f, 60.0f, 112.0f, 18.0f, Vec4(0.16f, 0.14f, 0.08f, 0.85f));
        m_ui.text(tx, 62.0f, tabs[t], c, 1.2f);
      }
      if (Input::keyPressed(KEY_Q)) m_invTab = (m_invTab + 2) % 3;
      if (Input::keyPressed(KEY_E) && m_invTab != 2) {
        // fall through to the equip handling below
      }
      m_ui.panel(40.0f, 76.0f, 210.0f, 220.0f);
      if (m_invTab == 0) {
        m_ui.text(52.0f, 88.0f, "EQUIPMENT", accent, 1.2f);
        for (int i = 0; i < EQ_COUNT; ++i) {
          f32 y = 108.0f + i * 26.0f;
          m_ui.text(52.0f, y, equipSlotName((EquipSlot)i), dim, 1.0f);
          const ItemStack& st = m_player.equip[i];
          if (st.defId >= 0) {
            const ItemDef& d = m_items.def(st.defId);
            m_ui.text(150.0f, y, d.name, white, 1.0f);
            if (d.durability > 0.0f && st.durability < 0.999f) {
              f32 f = st.durability;
              m_ui.bar(150.0f, y + 11.0f, 80.0f, 3.0f, f,
                       f > 0.4f ? Vec4(0.4f, 0.7f, 0.4f, 1) : Vec4(0.75f, 0.3f, 0.2f, 1),
                       Vec4(0.1f, 0.1f, 0.1f, 0.8f));
            }
          }
        }
      } else if (m_invTab == 1) {
        // medical / body report
        m_ui.text(52.0f, 88.0f, "BODY REPORT", accent, 1.2f);
        for (int i = 0; i < BP_COUNT; ++i) {
          f32 y = 108.0f + i * 24.0f;
          Vec4 c = white;
          f32 frac = (m_player.body.maxHp[i] > 0.0f)
                         ? m_player.body.hp[i] / m_player.body.maxHp[i] : 1.0f;
          if (frac < 0.25f) c = Vec4(0.85f, 0.22f, 0.18f, 1);
          else if (frac < 0.6f) c = Vec4(0.85f, 0.65f, 0.2f, 1);
          m_ui.text(52.0f, y, bodyPartName(i), dim, 1.0f);
          m_ui.bar(132.0f, y + 1.0f, 90.0f, 7.0f, frac, c, Vec4(0.08f, 0.08f, 0.09f, 0.9f));
          if (m_player.body.bleed[i] > 0.0f) m_ui.text(228.0f, y, "BLEED", Vec4(0.85f, 0.22f, 0.18f, 1), 0.9f);
          else if (m_player.body.broken[i]) m_ui.text(228.0f, y, "BROKEN", Vec4(0.85f, 0.22f, 0.18f, 1), 0.9f);
          else if (m_player.body.infected[i]) m_ui.text(228.0f, y, "INFECTED", Vec4(0.6f, 0.4f, 0.8f, 1), 0.9f);
        }
        m_ui.text(52.0f, 262.0f, "INFECTION " + std::to_string((int)m_player.stats.infection) +
                               "%   STRESS " + std::to_string((int)m_player.stats.stress) + "%",
                  dim, 0.9f);
        char tb[96];
        snprintf(tb, sizeof(tb), "RADIATION %d%%   CORE %.1f C",
                 (int)m_player.stats.radiation, m_player.stats.temperature);
        m_ui.text(52.0f, 276.0f, tb, dim, 0.9f);
      } else {
        // weapon modification
        m_ui.text(52.0f, 88.0f, "WEAPON BAY", accent, 1.2f);
        const ItemStack& gun = m_player.equip[EQ_MAIN];
        if (gun.defId < 0) {
          m_ui.text(52.0f, 110.0f, "NO WEAPON EQUIPPED", dim, 1.0f);
        } else {
          const ItemDef& idef = m_items.def(gun.defId);
          m_ui.text(52.0f, 110.0f, idef.name, white, 1.2f);
          if (idef.weaponId >= 0) {
            const WeaponDef& wd = m_weapons.def(idef.weaponId);
            char wb[160];
            snprintf(wb, sizeof(wb), "DMG %.0f  RPM %.0f  MAG %d  SPREAD %.3f",
                     wd.damage, wd.rpm, wd.magSize, wd.spread);
            m_ui.text(52.0f, 128.0f, wb, dim, 0.9f);
            snprintf(wb, sizeof(wb), "FALLOFF %.0f-%.0f m  RECOIL %.3f  DUR %.0f%%",
                     wd.falloffStart, wd.falloffEnd, wd.recoil, gun.durability * 100.0f);
            m_ui.text(52.0f, 142.0f, wb, dim, 0.9f);
            int slot = 0;
            for (const AttachmentDef& ad : m_weapons.attachments()) {
              f32 y = 162.0f + slot * 20.0f;
              int attItem = m_items.find(ad.name);
              bool owned = attItem >= 0 && inventoryCount(m_player, attItem) > 0;
              bool sel = (m_modIndex == slot);
              Vec4 c = sel ? accent : (owned ? white : dim);
              if (sel) m_ui.rect(48.0f, y - 3.0f, 194.0f, 17.0f, Vec4(0.16f, 0.14f, 0.08f, 0.8f));
              m_ui.text(54.0f, y, ad.name, c, 1.0f);
              m_ui.text(180.0f, y, owned ? "OWNED" : "-", owned ? Vec4(0.4f, 0.8f, 0.4f, 1) : dim, 0.9f);
              slot++;
              if (slot > 4) break;
            }
            m_ui.text(52.0f, 272.0f, "[W/S] SELECT   [ENTER] FIT", dim, 0.9f);
            int attCount = (int)m_weapons.attachments().size();
            if (attCount > 0) {
              if (Input::keyPressed(KEY_W)) m_modIndex = (m_modIndex + attCount - 1) % attCount;
              if (Input::keyPressed(KEY_S)) m_modIndex = (m_modIndex + 1) % attCount;
              if (Input::keyPressed(KEY_ENTER)) {
                // fit onto the equipped main-hand weapon
                if (fitAttachmentToEquipped(m_player, m_items, m_weapons, m_modIndex)) {
                  m_audio.playUI(SND_PICKUP, 0.5f);
                  m_toast = "Attachment fitted";
                  m_toastTimer = 2.0f;
                }
              }
            }
          }
        }
      }
      // grid
      const f32 cell = 46.0f;
      f32 gx = 280.0f, gy = 90.0f;
      for (int y = 0; y < Player::INV_H; ++y) {
        for (int x = 0; x < Player::INV_W; ++x) {
          f32 px = gx + x * cell, py = gy + y * cell;
          bool sel = (x == m_invSelX && y == m_invSelY);
          m_ui.rect(px, py, cell - 3.0f, cell - 3.0f,
                    sel ? Vec4(0.18f, 0.15f, 0.09f, 0.95f) : Vec4(0.055f, 0.06f, 0.065f, 0.9f));
          m_ui.rectOutline(px, py, cell - 3.0f, cell - 3.0f,
                           sel ? accent : Vec4(0.18f, 0.19f, 0.20f, 0.9f), 1.0f);
          const ItemStack& st = m_player.inv[y * Player::INV_W + x];
          if (st.defId >= 0) {
            const ItemDef& d = m_items.def(st.defId);
            m_ui.text(px + 4.0f, py + 5.0f, d.name.substr(0, 5), rarityColor(d.rarity), 1.0f);
            if (st.count > 1) m_ui.text(px + cell - 16.0f, py + 24.0f, std::to_string(st.count), dim, 1.0f);
            if (d.durability > 0.0f) {
              f32 f = st.durability / d.durability;
              m_ui.rect(px + 3.0f, py + cell - 9.0f, (cell - 9.0f) * f, 2.0f,
                        f > 0.4f ? Vec4(0.35f, 0.65f, 0.35f, 1) : Vec4(0.7f, 0.3f, 0.2f, 1));
            }
          }
        }
      }
      // details
      const ItemStack& sel = m_player.inv[m_invSelY * Player::INV_W + m_invSelX];
      m_ui.panel(gx, gy + Player::INV_H * cell + 14.0f, 460.0f, 96.0f);
      if (sel.defId >= 0) {
        const ItemDef& d = m_items.def(sel.defId);
        m_ui.text(gx + 12.0f, gy + Player::INV_H * cell + 26.0f, d.name, rarityColor(d.rarity), 1.3f);
        m_ui.text(gx + 12.0f, gy + Player::INV_H * cell + 44.0f, d.desc, dim, 1.0f);
        std::string info = "WEIGHT " + std::to_string((int)(d.weight * 100.0f) / 100.0f) +
                           "   DUR " + std::to_string((int)sel.durability) + "/" +
                           std::to_string((int)d.durability);
        m_ui.text(gx + 12.0f, gy + Player::INV_H * cell + 62.0f, info, dim, 1.0f);
        if (d.weaponId >= 0) {
          const WeaponDef& wd = m_weapons.def(d.weaponId);
          m_ui.text(gx + 12.0f, gy + Player::INV_H * cell + 78.0f,
                    "DMG " + std::to_string((int)wd.damage) + "   RPM " + std::to_string((int)wd.rpm) +
                    "   MAG " + std::to_string(wd.magSize),
                    dim, 1.0f);
        }
      } else {
        m_ui.text(gx + 12.0f, gy + Player::INV_H * cell + 30.0f, "EMPTY SLOT", dim, 1.1f);
      }
      // weight
      f32 wgt = inventoryWeight(m_player, m_items);
      m_ui.text(W - 220.0f, 30.0f, "WEIGHT " + std::to_string((int)(wgt * 10.0f) / 10.0f) +
                                   " KG", wgt > 22.0f ? Vec4(0.8f, 0.35f, 0.2f, 1) : dim, 1.2f);
      m_ui.text(W - 220.0f, 50.0f, "XP " + std::to_string((int)m_player.xp) + "/" +
                                   std::to_string((int)m_player.xpNext) + "  LVL " +
                                   std::to_string(m_player.level), white, 1.2f);
      // navigation
      if (Input::keyPressed(KEY_LEFT))  m_invSelX = (m_invSelX + Player::INV_W - 1) % Player::INV_W;
      if (Input::keyPressed(KEY_RIGHT)) m_invSelX = (m_invSelX + 1) % Player::INV_W;
      if (Input::keyPressed(KEY_UP))    m_invSelY = (m_invSelY + Player::INV_H - 1) % Player::INV_H;
      if (Input::keyPressed(KEY_DOWN))  m_invSelY = (m_invSelY + 1) % Player::INV_H;
      if (Input::keyPressed(KEY_E) && sel.defId >= 0) {
        // equip into a sensible slot
        const ItemDef& d = m_items.def(sel.defId);
        int slot = EQ_BACK;
        if (d.type == IT_WEAPON) slot = EQ_MAIN;
        else if (d.type == IT_ARMOR) {
          if (d.name.find("Helmet") != std::string::npos ||
              d.name.find("Hat") != std::string::npos) slot = EQ_HEAD;
          else if (d.name.find("Vest") != std::string::npos ||
                   d.name.find("Jacket") != std::string::npos) slot = EQ_TORSO;
          else if (d.name.find("Glove") != std::string::npos) slot = EQ_HANDS;
          else slot = EQ_LEGS;
        }
        if (equipItem(m_player, m_items, m_invSelY * Player::INV_W + m_invSelX, slot))
          m_audio.playUI(SND_UI_CLICK, 0.4f);
      }
      if (Input::keyPressed(KEY_F) && sel.defId >= 0)
        inventoryRemoveSlot(m_player, m_invSelY * Player::INV_W + m_invSelX);
      break;
    }
    case GS_SKILLS: {
      m_ui.rect(0, 0, W, H, Vec4(0.02f, 0.022f, 0.025f, 0.94f));
      m_ui.text(40.0f, 30.0f, "SKILLS", white, 2.4f);
      const char* trees[4] = { "COMBAT", "SURVIVAL", "ENGINEERING", "EXPLORATION" };
      const char* skills[4][5] = {
        { "Weapon Handling", "Marksmanship", "Melee", "First Aid", "Heavy Load" },
        { "Hunger", "Thirst", "Temperature", "Radiation", "Endurance" },
        { "Crafting", "Repair", "Barricade", "Chemistry", "Tuning" },
        { "Scouting", "Tracking", "Foraging", "Navigation", "Listening" }
      };
      for (int t = 0; t < 4; ++t) {
        f32 px = 40.0f + (t % 2) * (W * 0.46f);
        f32 py = 80.0f + (t / 2) * (H * 0.42f);
        m_ui.panel(px, py, W * 0.42f, H * 0.36f);
        m_ui.text(px + 14.0f, py + 12.0f, trees[t], accent, 1.5f);
        for (int i = 0; i < 5; ++i) {
          int idx = t * 5 + i;
          f32 y = py + 40.0f + i * 22.0f;
          int rank = m_player.skillRank[idx];
          bool sel = (m_skillIndex == idx);
          if (sel) m_ui.rect(px + 8.0f, y - 3.0f, W * 0.42f - 16.0f, 18.0f, Vec4(0.16f, 0.14f, 0.08f, 0.8f));
          m_ui.text(px + 16.0f, y, skills[t][i], sel ? white : dim, 1.1f);
          for (int r = 0; r < rank; ++r)
            m_ui.rect(px + W * 0.42f - 60.0f + r * 10.0f, y + 3.0f, 7.0f, 7.0f, accent);
          m_ui.text(px + W * 0.42f - 24.0f, y, std::to_string(rank), dim, 1.0f);
        }
      }
      m_ui.text(W * 0.5f - 130.0f, H - 42.0f,
                "SKILL POINTS " + std::to_string(m_player.skillPoints) +
                "   [ENTER] UNLOCK   [TAB] CLOSE", dim, 1.2f);
      if (Input::keyPressed(KEY_LEFT))  m_skillIndex = (m_skillIndex + 19) % 20;
      if (Input::keyPressed(KEY_RIGHT)) m_skillIndex = (m_skillIndex + 1) % 20;
      if (Input::keyPressed(KEY_UP))    m_skillIndex = (m_skillIndex + 15) % 20;
      if (Input::keyPressed(KEY_DOWN))  m_skillIndex = (m_skillIndex + 5) % 20;
      if (Input::keyPressed(KEY_ENTER) && m_player.skillPoints > 0) {
        if (m_player.skillRank[m_skillIndex] < 10) {
          m_player.skillRank[m_skillIndex]++;
          m_player.skillPoints--;
          m_audio.playUI(SND_PICKUP, 0.4f);
        }
      }
      break;
    }
    case GS_CRAFTING: {
      m_ui.rect(0, 0, W, H, Vec4(0.02f, 0.022f, 0.025f, 0.94f));
      m_ui.text(40.0f, 30.0f, "CRAFTING", white, 2.4f);
      const std::vector<Recipe>& recs = m_crafting.recipes();
      f32 y = 80.0f;
      int idx = 0;
      for (const Recipe& r : recs) {
        bool can = m_crafting.canCraft(r, m_player, m_items);
        bool sel = (idx == m_craftIndex);
        Vec4 c = !r.known ? Vec4(0.30f, 0.31f, 0.33f, 1)
                          : (can ? (sel ? accent : white) : Vec4(0.45f, 0.46f, 0.48f, 1));
        if (sel) m_ui.rect(44.0f, y - 4.0f, W - 120.0f, 18.0f, Vec4(0.16f, 0.14f, 0.08f, 0.75f));
        std::string label = r.known ? r.name : std::string("??? BLUEPRINT LOCKED");
        m_ui.text(56.0f, y, label, c, 1.2f);
        if (r.known) {
          std::string need;
          for (const auto& in : r.inputs) {
            const ItemDef& d = m_items.def(in.first);
            need += d.name + " " + std::to_string(in.second) + "   ";
          }
          m_ui.text(320.0f, y, need, dim, 1.0f);
          m_ui.text(W - 260.0f, y, can ? "[ENTER] CRAFT" : "MISSING MATERIALS",
                    can ? accent : dim, 1.0f);
        }
        y += 24.0f;
        ++idx;
        if (y > H - 120.0f) break;
      }
      m_ui.text(40.0f, H - 60.0f, "[W/S] SELECT   [ENTER] CRAFT   [TAB] CLOSE", dim, 1.2f);
      if (Input::keyPressed(KEY_W) || Input::keyPressed(KEY_UP))
        m_craftIndex = (m_craftIndex + (int)recs.size() - 1) % (int)recs.size();
      if (Input::keyPressed(KEY_S) || Input::keyPressed(KEY_DOWN))
        m_craftIndex = (m_craftIndex + 1) % (int)recs.size();
      if (Input::keyPressed(KEY_ENTER) && m_craftIndex < (int)recs.size()) {
        const Recipe& r = recs[(size_t)m_craftIndex];
        if (m_crafting.craft(m_player, m_items, r)) {
          m_audio.playUI(SND_PICKUP, 0.5f);
          m_toast = "Crafted " + r.name;
          m_toastTimer = 2.0f;
        }
      }
      break;
    }
    case GS_MAP: {
      m_ui.rect(0, 0, W, H, Vec4(0.02f, 0.022f, 0.025f, 0.96f));
      m_ui.text(40.0f, 30.0f, "MAP", white, 2.4f);
      m_ui.panel(40.0f, 76.0f, W - 80.0f, H - 150.0f);
      // schematic map of the six regions
      f32 mx = 60.0f, my = 100.0f;
      f32 mw = W - 120.0f, mh = H - 200.0f;
      f32 scale = mw / 1900.0f;
      for (const RegionDef& r : m_world.regions()) {
        f32 px = mx + (r.center.x + 950.0f) * scale;
        f32 pz = my + (r.center.z + 950.0f) * scale;
        f32 rr = r.radius * scale;
        Vec3 c = (r.id == m_world.regionAt(m_player.pos.x, m_player.pos.z))
                     ? Vec3(0.85f, 0.60f, 0.20f) : Vec3(0.35f, 0.40f, 0.46f);
        m_ui.rect(px - rr, pz - rr, rr * 2.0f, rr * 2.0f, Vec4(c.x, c.y, c.z, 0.22f));
        m_ui.rectOutline(px - rr, pz - rr, rr * 2.0f, rr * 2.0f, Vec4(c.x, c.y, c.z, 0.8f), 1.0f);
        m_ui.text(px - m_ui.textWidth(r.name, 1.0f) * 0.5f, pz - 4.0f, r.name, white, 1.0f);
      }
      // player marker
      f32 ppx = mx + (m_player.pos.x + 950.0f) * scale;
      f32 ppz = my + (m_player.pos.z + 950.0f) * scale;
      m_ui.rect(ppx - 3.0f, ppz - 3.0f, 6.0f, 6.0f, Vec4(0.9f, 0.25f, 0.2f, 1));
      // legend
      f32 ly = H - 140.0f;
      for (const RegionDef& r : m_world.regions()) {
        m_ui.text(60.0f, ly, r.name + "  -  " + r.subtitle, dim, 1.0f);
        ly += 14.0f;
      }
      break;
    }
    case GS_JOURNAL: {
      m_ui.rect(0, 0, W, H, Vec4(0.02f, 0.022f, 0.025f, 0.94f));
      m_ui.text(40.0f, 30.0f, "JOURNAL", white, 2.4f);
      m_ui.text(40.0f, 58.0f, "COMPLETED " + std::to_string(m_quests.completedCount()) +
                               " / " + std::to_string(m_quests.all().size()) +
                               "     ACTIVE " + std::to_string(m_quests.activeCount()), dim, 1.1f);
      f32 y = 90.0f;
      int shown = 0;
      for (const Quest& q : m_quests.all()) {
        if (shown++ > 16) break;
        if (q.state != QS_ACTIVE && q.state != QS_COMPLETE) continue;
        Vec4 c = (q.state == QS_COMPLETE) ? Vec4(0.40f, 0.62f, 0.42f, 1) : accent;
        m_ui.text(48.0f, y, (q.main ? "[MAIN] " : "[SIDE] ") + q.title, c, 1.2f);
        y += 14.0f;
        if (q.state == QS_ACTIVE) {
          for (const Objective& o : q.objectives) {
            if (o.optional) continue;
            m_ui.text(64.0f, y, "- " + o.desc + " (" + std::to_string(o.have) + "/" +
                                 std::to_string(o.need) + ")", dim, 1.0f);
            y += 12.0f;
          }
        }
        y += 8.0f;
      }
      break;
    }
    case GS_DIALOGUE: {
      m_ui.rect(0, 0, W, H, Vec4(0.0f, 0.0f, 0.0f, 0.35f));
      if (m_dialogueNode >= 0 && m_dialogueNode < (int)m_dialogue.size()) {
        const DialogueNode& n = m_dialogue[m_dialogueNode];
        f32 bw = W * 0.62f, bh = 150.0f;
        f32 bx = (W - bw) * 0.5f, by = H - bh - 60.0f;
        m_ui.panel(bx, by, bw, bh, 0.95f);
        m_ui.text(bx + 20.0f, by + 16.0f, n.speaker, accent, 1.4f);
        m_ui.text(bx + 20.0f, by + 42.0f, n.text, white, 1.2f);
        for (size_t i = 0; i < n.choices.size() && i < 4; ++i) {
          m_ui.text(bx + 20.0f, by + 74.0f + i * 18.0f,
                    std::to_string(i + 1) + ". " + n.choices[i], dim, 1.1f);
        }
      }
      break;
    }
    case GS_DEATH: {
      m_ui.rect(0, 0, W, H, Vec4(0.08f, 0.01f, 0.01f, 0.72f));
      m_ui.text(W * 0.5f - 110.0f, H * 0.40f, "YOU DIED", Vec4(0.72f, 0.12f, 0.10f, 1), 4.0f);
      m_ui.text(W * 0.5f - 160.0f, H * 0.40f + 60.0f,
                "PRESS [ENTER] TO WAKE UP ELSEWHERE", dim, 1.3f);
      if (Input::keyPressed(KEY_ENTER)) {
        // respawn at the last safe point with penalties
        m_playerCtrl.respawn(m_player, m_world);
        setState(GS_PLAYING);
      }
      break;
    }
    case GS_VICTORY: {
      m_ui.rect(0, 0, W, H, Vec4(0.02f, 0.03f, 0.04f, 0.85f));
      m_ui.text(W * 0.5f - 210.0f, H * 0.30f, "THE SIGNAL IS ANSWERED", accent, 3.0f);
      m_ui.text(W * 0.5f - 220.0f, H * 0.30f + 50.0f,
                "ASHES OF HUMANITY - LAST SIGNAL", white, 1.6f);
      m_ui.text(W * 0.5f - 120.0f, H * 0.30f + 90.0f,
                "PRESS [ENTER] TO RETURN", dim, 1.3f);
      if (Input::keyPressed(KEY_ENTER)) setState(GS_MAIN_MENU);
      break;
    }
    case GS_CUTSCENE: {
      // letterbox
      m_ui.rect(0, 0, W, H * 0.11f, Vec4(0, 0, 0, 0.95f));
      m_ui.rect(0, H * 0.89f, W, H * 0.11f, Vec4(0, 0, 0, 0.95f));
      const char* cap[4] = {
        "Six years after the collapse.",
        "The sky never cleared. Nobody remembered why it had been blue.",
        "And then, on an hour nobody was listening, a voice came out of the static.",
        "It said a name. Yours."
      };
      int idx = (int)(m_cutsceneTime / 3.5f);
      if (idx < 4) {
        m_ui.textShadow(W * 0.5f - m_ui.textWidth(cap[idx], 1.4f) * 0.5f, H * 0.78f,
                        cap[idx], Vec4(0.88f, 0.87f, 0.84f, 1.0f), 1.4f);
      }
      if (m_cutsceneTime > 16.0f) { m_cutsceneActive = false; setState(GS_PLAYING); }
      break;
    }
    case GS_SETTINGS: {
      m_ui.rect(0, 0, W, H, Vec4(0.02f, 0.022f, 0.025f, 0.95f));
      m_ui.text(40.0f, 30.0f, "SETTINGS", white, 2.4f);
      const char* labels[8] = { "GRAPHICS QUALITY", "SHADOWS", "BLOOM", "ANTI-ALIASING",
                                "FILM GRAIN", "FIELD OF VIEW", "MOUSE SENSITIVITY",
                                "MASTER VOLUME" };
      for (int i = 0; i < 8; ++i) {
        f32 y = 100.0f + i * 34.0f;
        Vec4 c = (i == m_settingsIndex) ? accent : white;
        m_ui.text(80.0f, y, labels[i], c, 1.3f);
        std::string val;
        switch (i) {
          case 0: val = std::to_string(m_settings.graphicsQuality); break;
          case 1: val = m_settings.shadows ? "ON" : "OFF"; break;
          case 2: val = m_settings.bloom ? "ON" : "OFF"; break;
          case 3: val = m_settings.fxaa ? "ON" : "OFF"; break;
          case 4: val = m_settings.grain ? "ON" : "OFF"; break;
          case 5: val = std::to_string((int)m_settings.fov) + " DEG"; break;
          case 6: val = std::to_string((int)(m_settings.mouseSensitivity * 10000.0f)); break;
          case 7: val = std::to_string((int)(m_settings.masterVolume * 100.0f)) + "%"; break;
        }
        m_ui.text(W * 0.55f, y, val, dim, 1.3f);
      }
      m_ui.text(80.0f, H - 70.0f, "[W/S] SELECT   [A/D] CHANGE   [TAB] BACK", dim, 1.2f);
      if (Input::keyPressed(KEY_W) || Input::keyPressed(KEY_UP))
        m_settingsIndex = (m_settingsIndex + 7) % 8;
      if (Input::keyPressed(KEY_S) || Input::keyPressed(KEY_DOWN))
        m_settingsIndex = (m_settingsIndex + 1) % 8;
      if (Input::keyPressed(KEY_A) || Input::keyPressed(KEY_LEFT) ||
          Input::keyPressed(KEY_D) || Input::keyPressed(KEY_RIGHT)) {
        int dir = (Input::keyPressed(KEY_A) || Input::keyPressed(KEY_LEFT)) ? -1 : 1;
        switch (m_settingsIndex) {
          case 0: m_settings.graphicsQuality = clampi(m_settings.graphicsQuality + dir, 0, 3); break;
          case 1: m_settings.shadows = !m_settings.shadows; break;
          case 2: m_settings.bloom = !m_settings.bloom; break;
          case 3: m_settings.fxaa = !m_settings.fxaa; break;
          case 4: m_settings.grain = !m_settings.grain; break;
          case 5: m_settings.fov = clampf(m_settings.fov + dir * 5.0f, 60.0f, 110.0f); break;
          case 6: m_settings.mouseSensitivity = clampf(m_settings.mouseSensitivity + dir * 0.0002f, 0.0004f, 0.01f); break;
          case 7: m_settings.masterVolume = clampf(m_settings.masterVolume + dir * 0.05f, 0.0f, 1.0f); break;
        }
        if (m_renderer) {
          RenderSettings rs = m_renderer->settings;
          rs.quality = m_settings.graphicsQuality;
          rs.shadows = m_settings.shadows;
          rs.bloom = m_settings.bloom;
          rs.fxaa = m_settings.fxaa;
          rs.grain = m_settings.grain;
          rs.fov = m_settings.fov;
          m_renderer->applySettings(rs);
        }
      }
      break;
    }
    default:
      break;
  }
}

} // namespace aoh
