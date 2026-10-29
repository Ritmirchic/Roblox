// fx.cpp - particles, fire propagation, explosions, shockwaves
#include "frac.h"

FX g_fx;

void FX::init() {
    parts.assign(maxParts, Particle{});
    for (auto& p : parts) p.active = false;
    fire.clear();
    decals.clear();
    shockwaves.clear();
    shockAge.clear();
    activeParts = 0;
    shake = 0;
}

void FX::clear() {
    for (auto& p : parts) p.active = false;
    fire.clear();
    decals.clear();
    shockwaves.clear();
    shockAge.clear();
    activeParts = 0;
    shake = 0;
}

Particle* FX::spawn(const Vec3& p, const Vec3& v, float life, float s0, float s1, uint32_t col,
                    float grav, int tex, int add) {
    int cap = int(maxParts * quality);
    for (int i = 0; i < cap && i < int(parts.size()); i++) {
        if (!parts[i].active) {
            Particle& q = parts[i];
            q.pos = p;
            q.vel = v;
            q.life = 0;
            q.maxLife = life;
            q.size0 = s0;
            q.size1 = s1;
            q.col = col;
            q.gravity = grav;
            q.drag = 0.6f;
            q.tex = tex;
            q.additive = add;
            q.rot = g_rng.range(0, 6.28f);
            q.spin = g_rng.range(-3, 3);
            q.active = true;
            activeParts++;
            return &q;
        }
    }
    return nullptr;
}

void FX::impact(const Vec3& p, const Vec3& n, uint8_t m, float power) {
    int kind = kMats[m].kind;
    Vec3 base = p + n * 0.05f;
    int count = int(clampf(4 + power * 2, 3, 22) * quality);
    switch (kind) {
        case K_GLASS: {
            for (int i = 0; i < count; i++) {
                Vec3 v = n * g_rng.range(1, 4) + g_rng.dir() * g_rng.range(0.5f, 3.0f);
                spawn(base, v, g_rng.range(0.7f, 1.6f), g_rng.range(0.02f, 0.06f), 0.02f,
                      rgba(210, 235, 250, 200), 1.6f, 3, 0);
            }
            g_audio.play(SND_GLASS_BREAK, p, 0.7f * saturate(power / 3.0f + 0.35f),
                         g_rng.range(0.9f, 1.15f));
            break;
        }
        case K_WOOD: {
            for (int i = 0; i < count; i++) {
                Vec3 v = n * g_rng.range(1, 3) + g_rng.dir() * g_rng.range(0.3f, 2.0f);
                spawn(base, v, g_rng.range(0.6f, 1.3f), g_rng.range(0.02f, 0.05f), 0.015f,
                      rgba(150, 110, 70, 220), 1.2f, 3, 0);
            }
            for (int i = 0; i < count / 2; i++)
                spawn(base, n * g_rng.range(0.5f, 1.5f) + g_rng.dir() * 0.8f,
                      g_rng.range(0.4f, 0.9f), 0.10f, 0.3f, rgba(150, 130, 100, 90), 0.1f, 7, 0);
            g_audio.play(SND_WOOD_HIT, p, saturate(0.4f + power * 0.2f), g_rng.range(0.9f, 1.1f));
            break;
        }
        case K_METAL: {
            Vec3 c = kMats[m].density > 7000 ? Vec3(1.0f, 0.85f, 0.45f) : Vec3(1, 0.8f, 0.4f);
            sparks(p, n, count + 6, packColor(c.x, c.y, c.z, 1));
            for (int i = 0; i < count / 2; i++)
                spawn(base, n * g_rng.range(0.4f, 1.2f), g_rng.range(0.3f, 0.7f), 0.06f, 0.2f,
                      rgba(200, 200, 200, 70), 0.2f, 7, 0);
            g_audio.play(SND_METAL_HIT, p, saturate(0.4f + power * 0.2f), g_rng.range(0.85f, 1.2f));
            break;
        }
        case K_SOIL: {
            for (int i = 0; i < count; i++)
                spawn(base, n * g_rng.range(0.5f, 2.0f) + g_rng.dir() * 1.2f,
                      g_rng.range(0.5f, 1.2f), 0.05f, 0.16f, rgba(110, 88, 60, 200), 1.4f, 7, 0);
            g_audio.play(SND_DIRT, p, saturate(0.3f + power * 0.15f), g_rng.range(0.9f, 1.1f));
            break;
        }
        case K_STONE:
        case K_CONCRETE:
        case K_REINFORCED:
        case K_BRICK:
        case K_PLASTER:
        default: {
            for (int i = 0; i < count; i++) {
                Vec3 v = n * g_rng.range(0.8f, 3.0f) + g_rng.dir() * g_rng.range(0.2f, 1.8f);
                spawn(base, v, g_rng.range(0.5f, 1.2f), g_rng.range(0.02f, 0.05f), 0.015f,
                      rgba(170, 168, 162, 220), 1.6f, 3, 0);
            }
            for (int i = 0; i < count / 2 + 2; i++)
                spawn(base, n * g_rng.range(0.3f, 1.4f) + g_rng.dir() * 1.0f,
                      g_rng.range(0.6f, 1.5f), 0.12f, 0.42f, rgba(215, 212, 205, 110), 0.15f, 0, 0);
            g_audio.play(SND_CONCRETE_BREAK, p, saturate(0.35f + power * 0.18f),
                         g_rng.range(0.9f, 1.1f));
            break;
        }
    }
    addShake(clampf(power * 0.02f, 0.0f, 0.25f), 0.18f);
}

void FX::sparks(const Vec3& p, const Vec3& n, int count, uint32_t col) {
    for (int i = 0; i < count; i++) {
        Vec3 v = n * g_rng.range(1.5f, 6.0f) + g_rng.dir() * g_rng.range(1.0f, 4.0f);
        spawn(p, v, g_rng.range(0.25f, 0.7f), 0.03f, 0.005f, col, 1.1f, 1, 1);
    }
}

void FX::smokePuff(const Vec3& p, int count, float size) {
    for (int i = 0; i < count; i++) {
        Vec3 v(g_rng.range(-0.6f, 0.6f), g_rng.range(0.2f, 1.2f), g_rng.range(-0.6f, 0.6f));
        spawn(p + g_rng.dir() * size * 0.3f, v, g_rng.range(1.2f, 2.8f), size * 0.5f,
              size * g_rng.range(1.6f, 2.6f), rgba(120, 118, 115, 110), -0.15f, 0, 0);
    }
}

void FX::dustCloud(const Vec3& p, float radius, int count, uint8_t m) {
    Vec3 col = Vec3(0.85f, 0.83f, 0.79f);
    if (kMats[m].kind == K_SOIL) col = Vec3(0.55f, 0.45f, 0.33f);
    if (kMats[m].kind == K_WOOD) col = Vec3(0.62f, 0.48f, 0.32f);
    if (kMats[m].kind == K_METAL) col = Vec3(0.6f, 0.6f, 0.62f);
    uint32_t c = packColor(col.x, col.y, col.z, 0.42f);
    int n = int(count * quality);
    for (int i = 0; i < n; i++) {
        Vec3 d = g_rng.dir();
        Vec3 v = Vec3(d.x, fabsf(d.y) * 0.7f, d.z) * g_rng.range(0.6f, radius * 1.3f);
        spawn(p + d * radius * 0.4f, v, g_rng.range(1.4f, 3.4f), radius * g_rng.range(0.25f, 0.5f),
              radius * g_rng.range(0.8f, 1.7f), c, -0.25f, 7, 0);
    }
    for (int i = 0; i < n / 3; i++) {
        Vec3 d = g_rng.dir();
        spawn(p, d * g_rng.range(2, 6), g_rng.range(0.6f, 1.4f), 0.06f, 0.02f,
              packColor(col.x * 0.8f, col.y * 0.8f, col.z * 0.8f, 1), 1.5f, 3, 0);
    }
}

void FX::addDecal(const Vec3& p, const Vec3& n, float size, int tex, uint32_t col) {
    Decal d;
    d.pos = p + n * 0.02f;
    d.nrm = n;
    d.size = size;
    d.life = 30.0f;
    d.col = col;
    d.tex = tex;
    if (decals.size() > 120) decals.erase(decals.begin());
    decals.push_back(d);
}

void FX::ignite(const Vec3& p, float radius) {
    if (!g_game.sandboxOpts.fireEnabled && g_game.sandbox) return;
    World& w = g_game.world;
    int r = int(radius / VOXSZ);
    int cx = int(p.x / VOXSZ), cy = int(p.y / VOXSZ), cz = int(p.z / VOXSZ);
    int added = 0;
    for (int z = cz - r; z <= cz + r && added < 40; z++)
        for (int y = cy - r; y <= cy + r && added < 40; y++)
            for (int x = cx - r; x <= cx + r && added < 40; x++) {
                if (!w.inside(x, y, z)) continue;
                uint8_t m = w.get(x, y, z);
                if (!m || kMats[m].flammability < 0.25f) continue;
                if (w.get(x, y + 1, z) != MAT_AIR) continue;   // needs air above to burn
                Vec3 wp((x + 0.5f) * VOXSZ, (y + 0.5f) * VOXSZ, (z + 0.5f) * VOXSZ);
                if (length(wp - p) > radius) continue;
                bool exists = false;
                for (auto& f : fire)
                    if (f.cell.x == x && f.cell.y == y && f.cell.z == z) { exists = true; break; }
                if (exists) continue;
                if (int(fire.size()) > 200) return;
                FireCell fc;
                fc.cell = Vec3i(x, y, z);
                fc.heat = 0.3f;
                fc.fuel = 1.0f + kMats[m].flammability;
                fc.smoke = 0;
                fire.push_back(fc);
                added++;
            }
}

void FX::extinguish(const Vec3& p, float radius) {
    for (int i = int(fire.size()) - 1; i >= 0; i--) {
        Vec3 wp((fire[i].cell.x + 0.5f) * VOXSZ, (fire[i].cell.y + 0.5f) * VOXSZ,
                (fire[i].cell.z + 0.5f) * VOXSZ);
        if (length(wp - p) < radius) {
            for (int k = 0; k < 3; k++)
                spawn(wp, g_rng.dir() * 1.2f, g_rng.range(0.8f, 1.6f), 0.12f, 0.4f,
                      rgba(220, 225, 230, 120), -0.1f, 0, 0);
            fire.erase(fire.begin() + i);
        }
    }
}

void FX::applyExplosionDamage(World& w, const Vec3& p, float power, float radius) {
    int removed = 0;
    int strength = int(3.0f + power * 2.2f);
    w.carveSphere(p, radius, strength, removed);
    // secondary ring of weaker damage
    for (int i = 0; i < 5; i++) {
        Vec3 d = g_rng.dir();
        Vec3 q = p + d * radius * 0.75f;
        int rem2 = 0;
        w.carveSphere(q, radius * 0.34f, strength / 2, rem2);
        removed += rem2;
    }
    g_game.totalDestroyed += removed;
    if (removed > 0) {
        int debrisCount = clampi(removed / 6, 3, 26);
        debrisCount = int(debrisCount * g_phys.quality);
        RayHit h = w.raycast(p + Vec3(0, 0.4f, 0), Vec3(0, -1, 0), 6.0f);
        uint8_t mat = h.hit ? h.mat : MAT_CONCRETE;
        for (int i = 0; i < debrisCount; i++) {
            Vec3 d = g_rng.dir();
            Vec3 v = d * g_rng.range(2.0f, 9.0f) + Vec3(0, g_rng.range(1.0f, 5.0f), 0);
            float s = VOXSZ * g_rng.range(1.0f, 2.6f);
            g_phys.spawnDebris(p + d * g_rng.range(0.2f, radius * 0.7f), v, Vec3(s, s * 0.8f, s),
                               mat, g_rng.dir() * g_rng.range(2, 10));
        }
    }
    g_phys.collapseQueue.push_back(p);
}

void FX::explosion(const Vec3& p, float power, World& w) {
    float ps = g_game.sandboxOpts.explosionScale;
    power *= ps;
    float radius = 0.9f + power * 0.42f;
    // visuals
    int n = int(clampf(10 + power * 5, 10, 60) * quality);
    for (int i = 0; i < n; i++) {
        Vec3 d = g_rng.dir();
        spawn(p, d * g_rng.range(1.0f, 3.0f + power), g_rng.range(0.12f, 0.34f),
              g_rng.range(0.25f, 0.7f) * (0.6f + power * 0.1f), 0.05f,
              packColor(1.0f, g_rng.range(0.55f, 0.85f), g_rng.range(0.15f, 0.35f), 1), 0.4f, 2, 1);
    }
    for (int i = 0; i < n; i++) {
        Vec3 d = g_rng.dir();
        spawn(p + d * 0.3f, d * g_rng.range(1.0f, 5.0f + power * 0.5f),
              g_rng.range(1.5f, 3.6f), 0.5f * power * 0.35f + 0.3f,
              g_rng.range(2.5f, 5.0f) + power * 0.25f, rgba(90, 88, 86, 150), -0.4f, 0, 0);
    }
    dustCloud(p, radius * 0.8f, int(18 + power * 3), MAT_CONCRETE);
    for (int i = 0; i < int(14 * quality); i++) {
        Vec3 d = g_rng.dir();
        spawn(p, d * g_rng.range(6, 18 + power * 2), g_rng.range(0.4f, 1.2f), 0.04f, 0.01f,
              rgba(255, 210, 120, 255), 1.2f, 1, 1);
    }
    shockwaves.push_back(p);
    shockAge.push_back(0);
    addShake(clampf(0.25f + power * 0.09f, 0.2f, 1.4f), 0.7f);
    g_audio.play(power > 6 ? SND_EXPLOSION_BIG : SND_EXPLOSION, p,
                 saturate(0.6f + power * 0.06f), g_rng.range(0.85f, 1.1f));
    applyExplosionDamage(w, p, power, radius);
    if (power > 2.0f) ignite(p, radius * 0.5f);
    // dynamic light
    g_renderer.addLight(p, Vec3(1.0f, 0.62f, 0.28f), radius * 3.0f + 4.0f, 3.0f);
    // torch nearby vehicles
    for (int i = 0; i < MAX_VEHICLES; i++)
        if (g_game.vehicles[i].active && length(g_game.vehicles[i].pos - p) < radius)
            g_game.vehicles[i].health -= power * 8.0f;
}

void FX::addShake(float amt, float time) {
    if (amt > shake) {
        shake = amt;
        shakeTime = time;
    }
}

void FX::update(float dt, World& w) {
    dt = fminf(dt, 0.05f);
    // particles
    for (auto& p : parts) {
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
            p.active = false;
            activeParts--;
            continue;
        }
        p.vel.y -= 9.81f * p.gravity * dt;
        p.vel *= (1.0f - fminf(0.9f, p.drag * dt));
        p.pos += p.vel * dt;
        p.rot += p.spin * dt;
    }
    // fire
    World* wp = &w;
    for (int i = int(fire.size()) - 1; i >= 0; i--) {
        FireCell& f = fire[i];
        f.heat += dt * 1.6f;
        f.fuel -= dt * 0.16f;
        Vec3 fp((f.cell.x + 0.5f) * VOXSZ, (f.cell.y + 0.7f) * VOXSZ, (f.cell.z + 0.5f) * VOXSZ);
        uint8_t m = wp->get(f.cell.x, f.cell.y, f.cell.z);
        if (m == MAT_AIR || f.fuel <= 0) {
            fire.erase(fire.begin() + i);
            continue;
        }
        // visual flames
        if (g_rng.f() < dt * 9.0f * quality) {
            spawn(fp + Vec3(g_rng.range(-0.08f, 0.08f), 0, g_rng.range(-0.08f, 0.08f)),
                  Vec3(g_rng.range(-0.3f, 0.3f), g_rng.range(0.8f, 2.0f), g_rng.range(-0.3f, 0.3f)),
                  g_rng.range(0.35f, 0.8f), 0.16f, 0.05f,
                  packColor(1.0f, g_rng.range(0.45f, 0.8f), 0.12f, 1), -0.35f, 2, 1);
        }
        if (g_rng.f() < dt * 2.5f * quality)
            spawn(fp + Vec3(0, 0.3f, 0), Vec3(g_rng.range(-0.2f, 0.2f), g_rng.range(0.6f, 1.4f),
                                             g_rng.range(-0.2f, 0.2f)),
                  g_rng.range(1.2f, 2.4f), 0.3f, 0.9f, rgba(50, 48, 46, 120), -0.2f, 0, 0);
        if (int(fire.size()) > 3 && g_rng.f() < dt * 0.012f)
            g_renderer.addLight(fp, Vec3(1.0f, 0.5f, 0.15f), 5.0f, 1.6f);
        // damage the burning voxel over time
        if (f.heat > 1.2f && g_rng.f() < dt * 0.5f) {
            int rem = 0;
            if (kMats[m].kind == K_WOOD) {
                wp->set(f.cell.x, f.cell.y, f.cell.z, MAT_CONCRETE_DIRTY);
                f.heat = 0;
            } else if (g_rng.f() < 0.3f) {
                wp->set(f.cell.x, f.cell.y, f.cell.z, MAT_AIR);
                rem = 1;
                g_phys.collapseQueue.push_back(fp);
            }
            (void)rem;
        }
        // spread
        if (g_rng.f() < dt * 0.55f) {
            static const int DX[6] = {1, -1, 0, 0, 0, 0}, DY[6] = {0, 0, 1, -1, 0, 0},
                             DZ[6] = {0, 0, 0, 0, 1, -1};
            int k = g_rng.irange(0, 5);
            int nx = f.cell.x + DX[k], ny = f.cell.y + DY[k], nz = f.cell.z + DZ[k];
            uint8_t nm = wp->get(nx, ny, nz);
            if (nm && kMats[nm].flammability > 0.3f && int(fire.size()) < 200) {
                bool exists = false;
                for (auto& o : fire)
                    if (o.cell.x == nx && o.cell.y == ny && o.cell.z == nz) { exists = true; break; }
                if (!exists) {
                    FireCell nf;
                    nf.cell = Vec3i(nx, ny, nz);
                    nf.heat = 0.1f;
                    nf.fuel = 1.0f;
                    nf.smoke = 0;
                    fire.push_back(nf);
                }
            }
        }
    }
    for (auto& d : decals) d.life -= dt;
    while (!decals.empty() && decals.front().life <= 0) decals.erase(decals.begin());
    for (size_t i = 0; i < shockAge.size();) {
        shockAge[i] += dt;
        if (shockAge[i] > 0.55f) {
            shockAge.erase(shockAge.begin() + i);
            shockwaves.erase(shockwaves.begin() + i);
        } else
            i++;
    }
    if (shakeTime > 0) {
        shakeTime -= dt;
        shake *= (1.0f - fminf(1.0f, dt * 3.5f));
        if (shakeTime <= 0) shake = 0;
    }
}

void FX::render() {
    Renderer& R = g_renderer;
    for (auto& p : parts) {
        if (!p.active) continue;
        float t = p.life / fmaxf(0.001f, p.maxLife);
        float size = lerpf(p.size0, p.size1, t);
        float alpha = 1.0f;
        if (t > 0.6f) alpha = 1.0f - (t - 0.6f) / 0.4f;
        uint32_t c = p.col;
        float a = ((c >> 24) & 255) / 255.0f * alpha;
        if (kMats[0].kind == 0 && p.tex == 3) a *= 1.0f;
        Sprite s;
        s.pos = p.pos;
        s.size = size;
        s.color = c | 0xFF000000u;
        s.alpha = saturate(a);
        s.tex = p.tex;
        s.rot = p.rot;
        s.additive = p.additive;
        if (s.alpha > 0.01f) R.spriteList.push_back(s);
    }
    // fire glow sprites
    for (auto& f : fire) {
        Vec3 fp((f.cell.x + 0.5f) * VOXSZ, (f.cell.y + 0.6f) * VOXSZ, (f.cell.z + 0.5f) * VOXSZ);
        Sprite s;
        s.pos = fp;
        s.size = 0.32f + f.heat * 0.08f;
        s.color = 0xFFFF9A30;
        s.alpha = 0.45f;
        s.tex = 2;
        s.rot = 0;
        s.additive = 1;
        R.spriteList.push_back(s);
    }
    for (size_t i = 0; i < shockwaves.size(); i++) {
        float t = shockAge[i] / 0.55f;
        Sprite s;
        s.pos = shockwaves[i];
        s.size = 1.0f + t * 9.0f;
        s.color = 0xFFFFFFFF;
        s.alpha = (1.0f - t) * 0.55f;
        s.tex = 4;
        s.rot = 0;
        s.additive = 1;
        R.spriteList.push_back(s);
    }
}
