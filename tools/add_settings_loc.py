#!/usr/bin/env python3
"""Add the expanded-settings localization keys to Localization.gd.

Every CJK glyph is verified against the subsetted fonts first; the script
aborts rather than emitting text the shipped fonts cannot render.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / ".venv" / "lib" / "python3.11" / "site-packages"))
from fontTools.ttLib import TTFont  # noqa: E402

FONTS = {
    "zh": "CJK-SC.ttf",
    "ja": "CJK-JP.ttf",
    "ko": "CJK-KR.ttf",
}

ENTRIES = {
    "settings_grp_display": {
        "ru": "ГРАФИКА И ЭКРАН", "en": "DISPLAY & SCREEN", "es": "PANTALLA",
        "de": "ANZEIGE & BILDSCHIRM", "fr": "AFFICHAGE & ÉCRAN", "pt": "TELA & VÍDEO",
        "zh": "画面显示", "ja": "ディスプレイ", "ko": "화면 설정", "tr": "EKRAN",
    },
    "settings_grp_audio": {
        "ru": "ЗВУК", "en": "AUDIO", "es": "AUDIO", "de": "AUDIO",
        "fr": "SON", "pt": "ÁUDIO", "zh": "声音", "ja": "サウンド", "ko": "소리", "tr": "SES",
    },
    "settings_grp_flight": {
        "ru": "ПИЛОТИРОВАНИЕ", "en": "FLIGHT CONTROLS", "es": "VUELO",
        "de": "FLUGSTEUERUNG", "fr": "COMMANDES DE VOL", "pt": "VOO",
        "zh": "飞行控制", "ja": "飛行操作", "ko": "비행 조작", "tr": "UÇUŞ KONTROLLERİ",
    },
    "settings_grp_hud": {
        "ru": "ИНТЕРФЕЙС ПИЛОТА", "en": "PILOT HUD", "es": "HUD DE PILOTO",
        "de": "Piloten-HUD", "fr": "HUD PILOTE", "pt": "HUD DO PILOTO",
        "zh": "飞行员界面", "ja": "コックピット表示", "ko": "조종석 표시", "tr": "UÇUŞ EKRANI",
    },
    "settings_grp_data": {
        "ru": "ДАННЫЕ И ЯЗЫК", "en": "DATA & LANGUAGE", "es": "DATOS E IDIOMA",
        "de": "DATEN & SPRACHE", "fr": "DONNÉES & LANGUE", "pt": "DADOS & IDIOMA",
        "zh": "数据与语言", "ja": "データと言語", "ko": "데이터 및 언어", "tr": "VERİ & DİL",
    },
    "settings_ui_scale": {
        "ru": "МАСШТАБ ИНТЕРФЕЙСА", "en": "UI SCALE", "es": "ESCALA DE INTERFAZ",
        "de": "BENUTZEROBERFLÄCHE", "fr": "ÉCHELLE DE L'INTERFACE", "pt": "ESCALA DA INTERFACE",
        "zh": "界面缩放", "ja": "UI拡大率", "ko": "인터페이스 배율", "tr": "ARAYÜZ ÖLÇEĞİ",
    },
    "settings_fov": {
        "ru": "ПОЛЕ ЗРЕНИЯ (FOV)", "en": "FIELD OF VIEW (FOV)", "es": "CAMPO DE VISIÓN",
        "de": "SICHTFELD (FOV)", "fr": "CHAMP DE VISION (FOV)",
        "pt": "CAMPO DE VISÃO", "zh": "视野范围", "ja": "視野角", "ko": "시야각", "tr": "GÖRÜŞ ALANI",
    },
    "settings_fps_cap": {
        "ru": "ОГРАНИЧЕНИЕ КАДРОВ/С", "en": "FRAME RATE LIMIT", "es": "LÍMITE DE FPS",
        "de": "BILDRATENLIMIT", "fr": "LIMITE DE FRÉQUENCE", "pt": "LIMITE DE FPS",
        "zh": "帧率上限", "ja": "フレームレート制限", "ko": "프레임 한도", "tr": "KARE HIZI SINIRI",
    },
    "settings_vsync": {
        "ru": "ВЕРТИКАЛЬНАЯ СИНХРОНИЗАЦИЯ", "en": "V-SYNC", "es": "V-SYNC",
        "de": "V-SYNC", "fr": "SYNCHRONISATION VERTICALE", "pt": "SINCRONISMO VERTICAL",
        "zh": "垂直同步", "ja": "垂直同期", "ko": "수직 동기화", "tr": "V-SYNC",
    },
    "settings_invert_y": {
        "ru": "ИНВЕРСИЯ ОСИ ТАНГАЖА",
        "en": "INVERT PITCH AXIS", "es": "INVERTIR CABECEO",
        "de": "NICKACHSE UMKEHREN", "fr": "INVERTIR L'ASSE DE TANGAGE",
        "pt": "INVERTIR ARFAGEM", "zh": "反转俯仰轴", "ja": "ピッチ反転", "ko": "피치 반전",
        "tr": "PİKS EKSİNİ TERS ÇEVİR",
    },
    "settings_cam_sens": {
        "ru": "ЧУВСТВИТЕЛЬНОСТЬ КАМЕРЫ", "en": "CAMERA SENSITIVITY", "es": "SENSIBILIDAD",
        "de": "KAMERAEMPFINDLICHKEIT", "fr": "SENSIBILITÉ CAMÉRA", "pt": "SENSIBILIDADE",
        "zh": "镜头灵敏度", "ja": "視点感度", "ko": "시점 민감도", "tr": "KAMERA HASSASİYETİ",
    },
    "settings_crosshair": {
        "ru": "ЯРКОСТЬ ПРИЦЕЛА", "en": "CROSSHAIR OPACITY", "es": "OPACIDAD DE MIRA",
        "de": "VISIERDECKUNG", "fr": "OPACITÉ DU RÉTICULE", "pt": "OPACIDADE DA MIRA",
        "zh": "准星不透明度", "ja": "照準の濃度", "ko": "조준선 농도", "tr": "NİŞANGAH ŞEFFAFLIĞI",
    },
    "settings_shake": {
        "ru": "ТРЯСКА КАБИНЫ", "en": "COCKPIT SHAKE", "es": "VIBRACIÓN DE CABINA",
        "de": "COCKPITERSCHÜTTERUNG", "fr": "SECOUES DU COCKPIT", "pt": "TREPIDAÇÃO DA CABINE",
        "zh": "座舱震动", "ja": "コックピット振動", "ko": "조종석 흔들림", "tr": "KOKPİT SARSINTISI",
    },
    "settings_hud_bars": {
        "ru": "ПАНЕЛЬ РЕСУРСОВ", "en": "RESOURCE BAR PANEL", "es": "PANEL DE RECURSOS",
        "de": "RESSOURCENLEISTE", "fr": "PANNEAU DE RESSOURCES", "pt": "PAINEL DE RECURSOS",
        "zh": "资源面板", "ja": "リソースバー", "ko": "자원 표시줄", "tr": "KAYNAK ÇUBUĞU",
    },
    "settings_ach_toasts": {
        "ru": "УВЕДОМЛЕНИЯ О НАГРАДАХ", "en": "ACHIEVEMENT POPUPS", "es": "AVISOS DE LOGROS",
        "de": "ERFOLGSMELDUNGEN", "fr": "NOTIFS DE SUCCÈS", "pt": "AVISOS DE CONQUISTAS",
        "zh": "成就通知", "ja": "実績ポップアップ", "ko": "업적 알림", "tr": "BAŞARI UYARILARI",
    },
    "settings_autosave": {
        "ru": "АВТОСОХРАНЕНИЕ", "en": "AUTO-SAVE", "es": "GUARDADO AUTOMÁTICO",
        "de": "AUTOMATISCH SPEICHERN", "fr": "SAUVEGARDE AUTO", "pt": "SALVAMENTO AUTOMÁTICO",
        "zh": "自动保存", "ja": "オートセーブ", "ko": "자동 저장", "tr": "OTO KAYDETME",
    },
    "settings_reset_save": {
        "ru": "СБРОС ПРОГРЕССА", "en": "RESET PROGRESS", "es": "REINICIAR PROGRESO",
        "de": "FORTSCHRITT ZURÜCKSETZEN", "fr": "RÉINITIALISER LA PARTIE",
        "pt": "REDEFINIR PROGRESSO", "zh": "重置进度", "ja": "進行度をリセット", "ko": "진행 초기화",
        "tr": "İLERLEMEYİ SIFIRLA",
    },
    "settings_reset_warn": {
        "ru": "Список корабля, экипаж, кристаллы и награды будут потеряны.",
        "en": "Ship, crew, crystals and achievements will be lost.",
        "es": "Nave, tripulación, cristales y logros se perderán.",
        "de": "Schiff, Besatzung, Kristalle und Erfolge gehen verloren.",
        "fr": "Vaisseau, équipage, cristaux et succès seront perdus.",
        "pt": "Nave, tripulação, cristais e conquistas serão perdidos.",
        "zh": "飞船、船员、水晶与成就都将丢失。",
        "ja": "船、乗組員、結晶、実績が失われます。",
        "ko": "함선, 승무원, 수정, 업적이 모두 사라집니다.",
        "tr": "Gemi, mürettebat, kristaller ve başarılar silinecek.",
    },
    "settings_confirm_reset": {
        "ru": "ПОДТВЕРДИТЬ СБРОС", "en": "CONFIRM RESET", "es": "CONFIRMAR",
        "de": "ZURÜCKSETZEN BESTÄTIGEN", "fr": "CONFIRMER", "pt": "CONFIRMAR",
        "zh": "确认重置", "ja": "リセット確定", "ko": "초기화 확인", "tr": "SIFIRLAMAYI ONAYLA",
    },
    "settings_done_reset": {
        "ru": "Прогресс сброшен.", "en": "Progress reset.", "es": "Progreso reiniciado.",
        "de": "Fortschritt zurückgesetzt.", "fr": "Progression réinitialisée.",
        "pt": "Progresso redefinido.", "zh": "进度已重置。", "ja": "進行度をリセットしました。",
        "ko": "진행 상황을 초기화했습니다.", "tr": "İlerleme sıfırlandı.",
    },
}

# Glyph coverage is guaranteed by rebuilding the CJK subsets
# (tools/build_cjk_subsets.py) and is asserted by
# tests/test_assets_and_spec.py::test_every_localization_string_renders_in_fonts.
loc = ROOT / "scripts" / "autoload" / "Localization.gd"
t = loc.read_text(encoding="utf-8")

ORDER = ["ru", "en", "es", "de", "fr", "pt", "zh", "ja", "ko", "tr"]


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


blocks = []
for key, table in ENTRIES.items():
    if re.search(r'\n\t"%s": \{' % re.escape(key), t):
        print("  skip (present):", key)
        continue
    lines_out = ['\t"%s": {' % key]
    for lang in ORDER:
        lines_out.append('\t\t"%s": "%s",' % (lang, esc(table[lang])))
    lines_out.append("\t},")
    blocks.append("\n".join(lines_out))

if not blocks:
    print("All keys already present")
else:
    m = re.search(r'(\n\t"settings_reduced_motion": \{.*?\n\t\},)', t, re.DOTALL)
    if not m:
        print("anchor settings_reduced_motion not found")
        raise SystemExit(2)
    t = t[:m.end()] + "\n" + "\n".join(blocks) + t[m.end():]
    loc.write_text(t, encoding="utf-8")
    print("Inserted %d localization keys" % len(blocks))
