from __future__ import annotations

import hashlib
import re
from typing import Dict, List, Optional, Tuple

HEROES = [
    {"id": 0, "name_ru": "Аканэ (Алая мечница)", "name_en": "Akane (Crimson Samurai)", "color": "#f64258"},
    {"id": 1, "name_ru": "Рэн (Кибер-синоби)", "name_en": "Ren (Azure Cyber-Shinobi)", "color": "#3ed4ff"},
    {"id": 2, "name_ru": "Лумина (Звёздная ведьма)", "name_en": "Lumina (Astral Witch)", "color": "#e4e0fa"},
    {"id": 3, "name_ru": "Райдэн (Золотой паладин)", "name_en": "Raiden (Golden Paladin)", "color": "#ffd84a"},
    {"id": 4, "name_ru": "Куро (Теневой ронин)", "name_en": "Kuro (Shadow Ronin)", "color": "#b460f8"},
    {"id": 5, "name_ru": "Мидори (Хранительница ветра)", "name_en": "Midori (Emerald Ranger)", "color": "#50e898"},
]

SCENES = [
    {"id": 0, "name_ru": "Храм Сакуры у Фудзи", "name_en": "Sakura Shrine & Mt. Fuji"},
    {"id": 1, "name_ru": "Крыша Нео-Токио", "name_en": "Neo-Tokyo Cyberpunk Rooftop"},
    {"id": 2, "name_ru": "Лунный бамбуковый лес", "name_en": "Moonlight Bamboo Forest"},
    {"id": 3, "name_ru": "Небесная цитадель", "name_en": "Floating Sky Citadel"},
    {"id": 4, "name_ru": "Багровое поле битвы", "name_en": "Crimson Volcanic Battlefield"},
    {"id": 5, "name_ru": "Морская станция", "name_en": "Seaside Train Station"},
]

TIMES = [
    {"id": 0, "name_ru": "Аниме-закат", "name_en": "Golden Sunset"},
    {"id": 1, "name_ru": "Лунная полночь", "name_en": "Starry Midnight"},
    {"id": 2, "name_ru": "Ясный день (стиль Синкая)", "name_en": "Clear Shinkai Day"},
    {"id": 3, "name_ru": "Неоновый шторм", "name_en": "Neon Cyber Storm"},
]

FRAMINGS = [
    {"id": 0, "name_ru": "Общий план (сцена целиком)", "name_en": "Wide Establishing / Action Shot"},
    {"id": 1, "name_ru": "Средний план героя", "name_en": "Medium Hero Shot"},
    {"id": 2, "name_ru": "Крупный план (глаза и мимика)", "name_en": "Dramatic Anime Close-Up"},
    {"id": 3, "name_ru": "Дуэль двух персонажей", "name_en": "Duel Confrontation"},
]

ACTIONS = [
    {"id": 0, "name_ru": "Спокойный взгляд и ветер в волосах", "name_en": "Calm Wind & Gaze"},
    {"id": 1, "name_ru": "Диалог / Монолог (анимация речи)", "name_en": "Dialogue / Lip-Sync"},
    {"id": 2, "name_ru": "Стремительный рывок / бег", "name_en": "High-Speed Dash"},
    {"id": 3, "name_ru": "Сакуга: Удар катаной полумесяцем", "name_en": "Sakuga Crescent Katana Slash"},
    {"id": 4, "name_ru": "Магический луч / Заклинание", "name_en": "Arcane Energy Beam"},
    {"id": 5, "name_ru": "Пробуждение боевой ауры", "name_en": "Awakening Ki Aura"},
]

CAMERAS = [
    {"id": 0, "name_ru": "Статичная камера", "name_en": "Steady Cinema Tripod"},
    {"id": 1, "name_ru": "Панорама вправо", "name_en": "Smooth Pan Right"},
    {"id": 2, "name_ru": "Панорама влево", "name_en": "Smooth Pan Left"},
    {"id": 3, "name_ru": "Драматический наезд (зум)", "name_en": "Dramatic Zoom In"},
]

WEATHER_FX = [
    {"id": 0, "name_ru": "Лепестки сакуры", "name_en": "Drifting Sakura Petals"},
    {"id": 1, "name_ru": "Ливень", "name_en": "Heavy Anime Rain"},
    {"id": 2, "name_ru": "Огненные искры", "name_en": "Rising Fire Embers"},
    {"id": 3, "name_ru": "Звездопад / Снег", "name_en": "Falling Starlight / Snow"},
    {"id": 4, "name_ru": "Спидлайны экшена", "name_en": "Action Speedlines"},
]

# Semantic concept vocabulary (IDs 1..90) + hashed open vocabulary (IDs 91..255)
CONCEPT_VOCAB = {
    # Heroes
    "hero_akane": 1, "hero_ren": 2, "hero_lumina": 3,
    "hero_raiden": 4, "hero_kuro": 5, "hero_midori": 6,
    # Scenes
    "scene_sakura": 10, "scene_neotokyo": 11, "scene_bamboo": 12,
    "scene_sky": 13, "scene_battlefield": 14, "scene_seaside": 15,
    # Times
    "time_sunset": 20, "time_midnight": 21, "time_day": 22, "time_storm": 23,
    # Framings
    "frame_wide": 30, "frame_medium": 31, "frame_closeup": 32, "frame_duel": 33,
    # Actions
    "act_calm": 40, "act_talk": 41, "act_dash": 42,
    "act_slash": 43, "act_beam": 44, "act_aura": 45,
    # Weather / FX
    "fx_petals": 50, "fx_rain": 51, "fx_embers": 52, "fx_stars": 53, "fx_speed": 54,
}


def _stable_word_bucket(word: str) -> int:
    h = hashlib.md5(word.encode("utf-8")).digest()
    return 90 + (int.from_bytes(h[:2], "little") % 165)


def spec_to_bilingual_tokens(spec: Dict[str, int], extra_text: str = "") -> List[int]:
    """Produce 5 trained semantic token IDs aligned with hero, scene, time, action, framing."""
    h_tok = 1 + (spec.get("hero_id", 0) % 6)
    s_tok = 10 + (spec.get("scene_id", 0) % 6)
    t_tok = 20 + (spec.get("time_id", 0) % 4)
    a_tok = 40 + (spec.get("action_id", 0) % 6)
    f_tok = 30 + (spec.get("framing_id", 0) % 4)
    return [h_tok, s_tok, t_tok, a_tok, f_tok]


def parse_prompt_to_spec_and_tokens(
    prompt: str,
    overrides: Optional[Dict[str, Optional[int]]] = None,
    default_seed: int = 42,
) -> Tuple[Dict[str, int], List[int]]:
    """Parse Russian or English natural-language anime prompt into structured spec + 5 tokens."""
    text = (prompt or "").lower()
    h_hash = int.from_bytes(hashlib.sha256((text or "sakuga").encode("utf-8")).digest()[:4], "little")

    # 1. Hero detection
    hero_id = h_hash % 6
    if any(k in text for k in ["акан", "akane", "красн", "алая", "crimson", "red", "самура", "мечниц"]):
        hero_id = 0
    elif any(k in text for k in ["рэн", "рен", "ren", "синоб", "ниндз", "кибер", "синеволос", "голуб", "azure", "ninja", "shinobi", "cyber"]):
        hero_id = 1
    elif any(k in text for k in ["лумин", "lumina", "серебр", "ведьм", "маг", "колдун", "silver", "witch", "mage", "astral"]):
        hero_id = 2
    elif any(k in text for k in ["райд", "raiden", "золот", "блондин", "паладин", "молн", "gold", "paladin", "thunder"]):
        hero_id = 3
    elif any(k in text for k in ["куро", "kuro", "тенев", "ронин", "фиолет", "тьм", "shadow", "ronin", "violet", "dark"]):
        hero_id = 4
    elif any(k in text for k in ["мидор", "midori", "изумруд", "зелен", "лучниц", "рейнджер", "emerald", "green", "wind", "forest"]):
        hero_id = 5

    # 2. Scene detection
    scene_id = (h_hash >> 3) % 6
    if any(k in text for k in ["храм", "сакур", "тори", "фудзи", "shrine", "sakura", "torii", "fuji", "cherry"]):
        scene_id = 0
    elif any(k in text for k in ["токио", "киот", "крыш", "неон", "город", "мегаполис", "tokyo", "rooftop", "city", "neon", "cyberpunk"]):
        scene_id = 1
    elif any(k in text for k in ["бамбук", "лес", "рощ", "bamboo", "forest", "woods"]):
        scene_id = 2
    elif any(k in text for k in ["небес", "цитадел", "остров", "облак", "парящ", "sky", "floating", "citadel", "cloud"]):
        scene_id = 3
    elif any(k in text for k in ["вулкан", "лав", "битв", "пепел", "скал", "battlefield", "volcan", "lava", "cliff"]):
        scene_id = 4
    elif any(k in text for k in ["мор", "океан", "станц", "поезд", "берег", "пляж", "sea", "ocean", "station", "train", "beach"]):
        scene_id = 5

    # 3. Time / Lighting detection
    time_id = 0 if scene_id in (0, 5) else (1 if scene_id == 2 else (3 if scene_id == 1 else 2))
    if any(k in text for k in ["закат", "вечер", "сумерк", "рассвет", "sunset", "dusk", "golden", "dawn"]):
        time_id = 0
    elif any(k in text for k in ["ноч", "лун", "полноч", "звезд", "звёзд", "night", "moon", "midnight", "star"]):
        time_id = 1
    elif any(k in text for k in ["день", "днём", "ясн", "солнеч", "синка", "day", "sunny", "bright", "shinkai"]):
        time_id = 2
    elif any(k in text for k in ["шторм", "гроз", "киберпанк", "storm", "thunderstorm", "neon"]):
        time_id = 3

    # 4. Action detection
    action_id = 0
    if any(k in text for k in ["диалог", "говор", "речь", "монолог", "шепч", "крич", "сказ", "talk", "speak", "dialogue", "monologue"]):
        action_id = 1
    elif any(k in text for k in ["беж", "бег", "рывок", "мчит", "спеш", "run", "dash", "sprint", "rush"]):
        action_id = 2
    elif any(k in text for k in ["рубит", "удар", "катан", "меч", "клинок", "разрез", "атак", "сакуг", "slash", "sword", "katana", "strike", "blade", "cut"]):
        action_id = 3
    elif any(k in text for k in ["луч", "заклин", "маги", "шар", "энерг", "выстрел", "spell", "beam", "magic", "cast", "blast"]):
        action_id = 4
    elif any(k in text for k in ["аур", "пробужд", "сил", "вспыш", "заряд", "aura", "awaken", "power", "charge", "ki"]):
        action_id = 5
    elif any(k in text for k in ["спокой", "ветер", "стоит", "смотр", "взгляд", "calm", "wind", "idle", "gaze", "stand"]):
        action_id = 0

    # 5. Framing detection
    framing_id = 0
    if any(k in text for k in ["крупн", "лиц", "глаз", "портрет", "взгляд", "эмоц", "close", "closeup", "face", "eyes", "portrait"]):
        framing_id = 2
    elif any(k in text for k in ["дуэл", "против", "двое", "схватк", "столкнов", "битв", "бой", "duel", "versus", "vs", "clash", "rival"]):
        framing_id = 3
    elif any(k in text for k in ["средн", "по пояс", "medium", "waist"]):
        framing_id = 1

    # 6. Camera detection
    camera_id = 1 if action_id == 2 else 0
    if any(k in text for k in ["панорам", "вправ", "pan right", "pan"]):
        camera_id = 1
    elif any(k in text for k in ["влев", "pan left"]):
        camera_id = 2
    elif any(k in text for k in ["зум", "наезд", "приближ", "zoom"]):
        camera_id = 3

    # 7. Weather / FX detection
    fx_id = 0 if scene_id == 0 else (1 if time_id == 3 else (2 if scene_id == 4 else (4 if action_id >= 3 else 3)))
    if any(k in text for k in ["лепест", "сакур", "цветен", "petal", "blossom"]):
        fx_id = 0
    elif any(k in text for k in ["дожд", "ливень", "капл", "rain", "downpour"]):
        fx_id = 1
    elif any(k in text for k in ["искр", "пепел", "огон", "плам", "ember", "spark", "fire"]):
        fx_id = 2
    elif any(k in text for k in ["снег", "звездопад", "снежин", "snow", "starfall", "starlight"]):
        fx_id = 3
    elif any(k in text for k in ["спидлайн", "скорост", "линии", "speedline", "fast"]):
        fx_id = 4

    spec = {
        "hero_id": hero_id,
        "scene_id": scene_id,
        "time_id": time_id,
        "framing_id": framing_id,
        "action_id": action_id,
        "camera_id": camera_id,
        "fx_id": fx_id,
        "part_idx": 0,
        "variant_seed": int(default_seed) & 0xFFFF,
    }

    if overrides:
        for k, v in overrides.items():
            if v is not None and k in spec and int(v) >= 0:
                spec[k] = int(v)

    tokens = spec_to_bilingual_tokens(spec, extra_text=text)
    return spec, tokens
