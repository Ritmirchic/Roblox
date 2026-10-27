extends Node

signal language_changed(new_lang: String)

const SUPPORTED_LANGUAGES: Array[Dictionary] = [
	{"code": "ru", "native": "Русский", "short": "RU"},
	{"code": "en", "native": "English", "short": "EN"},
	{"code": "es", "native": "Español", "short": "ES"},
	{"code": "de", "native": "Deutsch", "short": "DE"},
	{"code": "fr", "native": "Français", "short": "FR"},
	{"code": "pt", "native": "Português", "short": "PT"},
	{"code": "zh", "native": "简体中文", "short": "中文"},
	{"code": "ja", "native": "日本語", "short": "日本語"},
	{"code": "ko", "native": "한국어", "short": "한국어"},
	{"code": "tr", "native": "Türkçe", "short": "TR"},
]

const LANG_ORDER: Array[String] = ["ru", "en", "es", "de", "fr", "pt", "zh", "ja", "ko", "tr"]

var current_lang: String = "ru"

const UI_STRINGS: Dictionary = {
	"menu_tagline": {
		"ru": "МОДУЛЬНАЯ 3D-ИНЖЕНЕРИЯ • ДОБЫЧА РУДЫ • КОЛЛЕКЦИЯ БОЙЦОВ",
		"en": "MODULAR 3D SHIP ENGINEERING • ASTEROID MINING • CREW CARDS",
		"es": "INGENIERÍA 3D MODULAR • MINERÍA ESPACIAL • CARTAS DE TRIPULACIÓN",
		"de": "MODULARER 3D-SCHIFFSBAU • ASTEROIDENBERGBAU • CREW-KARTEN",
		"fr": "INGÉNIERIE 3D MODULAIRE • MINAGE SPATIAL • CARTES D'ÉQUIPAGE",
		"pt": "ENGENHARIA 3D MODULAR • MINERAÇÃO ESPACIAL • CARTAS DE TRIPULAÇÃO",
		"zh": "模块化3D星舰建造 • 小行星采矿 • 战士典藏卡牌",
		"ja": "モジュール式3D宇宙船建造 • 小惑星採掘 • クルーカード",
		"ko": "모듈형 3D 우주선 건조 • 소행성 채굴 • 크루 카드",
		"tr": "MODÜLER 3D GEMİ İNŞASI • ASTEROİT MADENCİLİĞİ • MÜRETTEBAT KARTLARI",
	},
	"crew_foil_perks": {
		"ru": "ПОКРЫТИЯ МОСТИКА: РЫНОК +%d%% • РАДАР +%d%% • РЕМОНТ +%d%%",
		"en": "BRIDGE FOILS: MARKET +%d%% • RADAR +%d%% • REPAIR +%d%%",
		"es": "ACABADOS DEL PUENTE: MERCADO +%d%% • RADAR +%d%% • REPARACIÓN +%d%%",
		"de": "BRÜCKEN-FOLIEN: MARKT +%d%% • RADAR +%d%% • REPARATUR +%d%%",
		"fr": "FINITIONS DU PONT : MARCHÉ +%d%% • RADAR +%d%% • RÉPARATION +%d%%",
		"pt": "ACABAMENTOS DA PONTE: MERCADO +%d%% • RADAR +%d%% • REPARO +%d%%",
		"zh": "舰桥涂层：市场 +%d%% • 雷达 +%d%% • 维修 +%d%%",
		"ja": "ブリッジ加工：市場 +%d%% • レーダー +%d%% • 修復 +%d%%",
		"ko": "브리지 코팅: 시장 +%d%% • 레이더 +%d%% • 수리 +%d%%",
		"tr": "KÖPRÜ FOLYOLARI: PAZAR +%d%% • RADAR +%d%% • ONARIM +%d%%",
	},

	"hud_threat": {
		"ru": "УГРОЗА",
		"en": "THREAT",
		"es": "AMENAZA",
		"de": "BEDROHUNG",
		"fr": "MENACE",
		"pt": "AMEAÇA",
		"zh": "威胁",
		"ja": "脅威",
		"ko": "위협",
		"tr": "TEHDİT",
	},
	"threat_elite_inbound": {
		"ru": "ЭЛИТНОЕ КРЫЛО ВЫХОДИТ НА ПОЗИЦИЮ",
		"en": "ELITE WING INBOUND",
		"es": "ALa ÉLITE ENCAMINO",
		"de": "ELITE-STAFFEL IM ANFLUG",
		"fr": "ESCADRE D'ÉLITE EN APPROCHE",
		"pt": "ALA DE ELITE A CAMINHO",
		"zh": "精英中队正在接近",
		"ja": "精鋭飛行隊が接近中",
		"ko": "정예 편대 접근 중",
		"tr": "ELİT FİLO YAKLAŞIYOR",
	},
	"threat_heavy_inbound": {
		"ru": "ТЯЖЁЛЫЙ ПАТРУЛЬ ОТВЕЧАЕТ НА ПРОМЫСЕЛ",
		"en": "HEAVY PATROL RESPONDING TO MINING",
		"es": "PATRULLA PESADA EN RESPUESTA",
		"de": "SCHWERE PATROLLE REAGIERT",
		"fr": "PATROUILLE LOURDE EN RÉACTION",
		"pt": "PATRULHA PESADA EM REAÇÃO",
		"zh": "重型巡逻队正在回应采矿活动",
		"ja": "重警戒パトロールが採掘に反応",
		"ko": "중무장 순찰대가 채굴에 대응",
		"tr": "AĞIR DEVRIYE KAZIYA CEVAP VERİYOR",
	},
	"threat_standing_down": {
		"ru": "УГРОЗА СПАДАЕТ — ПАТРУЛИ ОТХОДЯТ",
		"en": "THREAT STANDING DOWN — PATROLS PULLING BACK",
		"es": "AMENAZA EN DESCENSO",
		"de": "BEDROHUNG SINKT — PATROLLEN ZIEHEN AB",
		"fr": "MENACE EN BAISSE — PATROUILLES EN RETRAIT",
		"pt": "AMEAÇA CAINDO — PATRULHAS RECUANDO",
		"zh": "威胁下降 — 巡逻队撤退",
		"ja": "脅威低下 — 哨戒が後退",
		"ko": "위협 감소 — 순찰대 후퇴",
		"tr": "TEHDİT DÜŞÜYOR — DEVRİYELER ÇEKİLİYOR",
	},
	"crew_salvage_card": {
		"ru": "ТРОФЕЙ: КАРТА %1$s • ПОКРЫТИЕ %2$s",
		"en": "SALVAGE: CARD %1$s • FINISH %2$s",
		"es": "SALVAMENTO: CARTA %1$s • ACABADO %2$s",
		"de": "BERGEGUT: KARTE %1$s • FINISH %2$s",
		"fr": "SALVE : CARTE %1$s • FINITION %2$s",
		"pt": "SALVADO: CARTA %1$s • ACABAMENTO %2$s",
		"zh": "打捞：卡牌 %1$s • 涂层 %2$s",
		"ja": "戦利品：カード %1$s • 仕上げ %2$s",
		"ko": "전리품: 카드 %1$s • 코팅 %2$s",
		"tr": "GANYMET: KART %1$s • KAPLAMA %2$s",
	},
	"foil_label": {
		"ru": "ПОКРЫТИЕ",
		"en": "FOIL FINISH",
		"es": "ACABADO",
		"de": "FINISH",
		"fr": "FINITION",
		"pt": "ACABAMENTO",
		"zh": "涂层",
		"ja": "仕上げ加工",
		"ko": "코팅",
		"tr": "KAPLAMA",
	},
	"foil_upgraded": {
		"ru": "ПОКРЫТИЕ УЛУЧШЕНО: %s",
		"en": "FOIL UPGRADED: %s",
		"es": "ACABADO MEJORADO: %s",
		"de": "FINISH VERBESSERT: %s",
		"fr": "FINITION AMÉLIORÉE : %s",
		"pt": "ACABAMENTO MELHORADO: %s",
		"zh": "涂层升级：%s",
		"ja": "仕上げアップグレード：%s",
		"ko": "코팅 업그레이드: %s",
		"tr": "KAPLAMA YÜKSELDİ: %s",
	},
	"menu_commander_status": {
		"ru": "Статус командира: %d КР  •  %d КРИСТ  •  %d/42 карт экипажа",
		"en": "Commander: %d CR  •  %d CRY  •  %d/42 Crew Cards",
		"es": "Comandante: %d CR  •  %d CRI  •  %d/42 Cartas",
		"de": "Kommandant: %d CR  •  %d KRI  •  %d/42 Crew-Karten",
		"fr": "Commandant : %d CR  •  %d CRI  •  %d/42 Cartes",
		"pt": "Comandante: %d CR  •  %d CRI  •  %d/42 Cartas",
		"zh": "指挥官状态：%d 信用点 • %d 水晶 • %d/42 船员卡",
		"ja": "司令官ステータス: %d CR • %d クリスタル • %d/42 クルー",
		"ko": "지휘관 상태: %d CR • %d 크리스탈 • %d/42 크루 카드",
		"tr": "Komutan: %d KR  •  %d KRİ  •  %d/42 Mürettebat Kartı",
	},
	"menu_enter_hangar": {
		"ru": "ВОЙТИ В 3D ОРБИТАЛЬНЫЙ АНГАР",
		"en": "ENTER 3D ORBITAL HANGAR",
		"es": "ENTRAR AL HANGAR ORBITAL 3D",
		"de": "3D-ORBITALHANGAR BETRETEN",
		"fr": "ENTRER DANS LE HANGAR ORBITAL 3D",
		"pt": "ENTRAR NO HANGAR ORBITAL 3D",
		"zh": "进入 3D 轨道机库",
		"ja": "3D 軌道ハンガーへ入る",
		"ko": "3D 궤도 격납고 입장",
		"tr": "3B YÖRÜNGE HANGARINA GİR",
	},
	"menu_quick_launch": {
		"ru": "БЫСТРЫЙ ВЫЛЕТ (ПОЯС НОВИЧКОВ)",
		"en": "QUICK LAUNCH (STARTER BELT)",
		"es": "VUELO RÁPIDO (CINTURÓN INICIAL)",
		"de": "SCHNELLSTART (STARTERGÜRTEL)",
		"fr": "VOL RAPIDE (CEINTURE INITIALE)",
		"pt": "VOO RÁPIDO (CINTURÃO INICIAL)",
		"zh": "快速出击（新手星带）",
		"ja": "クイック出撃（スターターベルト）",
		"ko": "빠른 출격 (초보자 소행성대)",
		"tr": "HIZLI UÇUŞ (BAŞLANGIÇ KUŞAĞI)",
	},
	"menu_hall_of_achievements": {
		"ru": "ЗАЛ СЛАВЫ • ДОСТИЖЕНИЯ",
		"en": "HALL OF ACHIEVEMENTS",
		"es": "SALÓN DE LOGROS",
		"de": "HALLE DER ERFOLGE",
		"fr": "SALLE DES RÉALISATIONS",
		"pt": "SALÃO DAS CONQUISTAS",
		"zh": "成就殿堂",
		"ja": "実績の殿堂",
		"ko": "업적의 전당",
		"tr": "BAŞARI SALONU",
	},
	"menu_back": {
		"ru": "НАЗАД В АНГАР",
		"en": "BACK TO HANGAR",
		"es": "VOLVER AL HANGAR",
		"de": "ZURÜCK ZUR HANGAR",
		"fr": "RETOUR AU HANGAR",
		"pt": "VOLTAR AO HANGAR",
		"zh": "返回机库",
		"ja": "ハンガーへ戻る",
		"ko": "행거로 돌아가기",
		"tr": "HANGARA DÖN",
	},
	"ach_rarity": {
		"ru": "РЕДКОСТЬ",
		"en": "RARITY",
		"es": "RAREZA",
		"de": "SELTENHEIT",
		"fr": "RARETÉ",
		"pt": "RARIDADE",
		"zh": "稀有度",
		"ja": "稀有度",
		"ko": "희소도",
		"tr": "NADİRLİK",
	},
	"hall_hint": {
		"ru": "Перетаскивайте — осмотреться · Колесо — сблизиться · Клик по карте — досье · ESC — назад",
		"en": "Drag to look around · Wheel to zoom · Click a card for its dossier · ESC to leave",
		"es": "Arrastra para mirar · Rueda para acercar · Clic en una tarjeta para su ficha · ESC para salir",
		"de": "Ziehen zum Umschauen · Rad zoomt · Klick auf eine Karte zeigt das Dossier · ESC verlassen",
		"fr": "Glissez pour regarder · Molette pour zoomer · Clic sur une carte pour sa fiche · ESC pour sortir",
		"pt": "Arraste para olhar · Roda para zoom · Clique num cartão para ver a ficha · ESC para sair",
		"zh": "拖动环顾 · 滚轮缩放 · 点击卡片查看资料 · ESC 离开",
		"ja": "ドラッグで視点移動 · ホイールで拡大 · カードクリックで詳細 · ESCで退出",
		"ko": "드래그로 둘러보기 · 휠로 확대 · 카드를 누르면 상세 · ESC로 나가기",
		"tr": "Çevirmek için sürükleyin · Tekerlekle yakınlaş · Kartın üstüne tıklayın · ESC ile çıkın",
	},
	"hall_subtitle": {
		"ru": "ЗАЛ СЛАВЫ · КАЖДАЯ ЗАВОЁВАННАЯ НАГРАДА ПЛАВАЕТ ЗДЕСЬ В ОТКРЫТОМ КОСМОСЕ",
		"en": "HALL OF GLORY · EVERY MEDAL YOU EARN FLOATS HERE IN OPEN SPACE",
		"es": "SALÓN DE LA FAMA · CADA MEDALLA QUE GANAS FLOTA AQUÍ EN EL ESPACIO",
		"de": "RUHMESHALLE · JEDE ERKAMPFTE MEDAILLE SCHWEBT HIER IM ALL",
		"fr": "PANTHÉON · CHAQUE MÉDAILLE GAGNÉE FLOTTE ICI DANS L'ESPACE",
		"pt": "SALÃO DA FAMA · CADA MEDALHA CONQUISTADA FLUTUA AQUI NO ESPAÇO",
		"zh": "荣誉殿堂 · 你赢得的每一枚奖章都漂浮在这片太空中",
		"ja": "名誉の殿堂 · 獲得した勲章が宇宙に浮かぶ",
		"ko": "명예의 전당 · 획득한 모든 훈장이 우주에 떠 있습니다",
		"tr": "ŞEREF SALONU · KAZANDIĞINIZ HER MADALYA AÇIK UZAYDA YÜZER",
	},
	"menu_settings": {
		"ru": "НАСТРОЙКИ, ЗВУК И ЯЗЫК",
		"en": "GRAPHICS, AUDIO & LANGUAGE",
		"es": "AJUSTES, AUDIO E IDIOMA",
		"de": "GRAFIK, AUDIO & SPRACHE",
		"fr": "OPTIONS, AUDIO ET LANGUE",
		"pt": "OPÇÕES, ÁUDIO E IDIOMA",
		"zh": "画面、音效与语言设置",
		"ja": "設定・サウンド・言語",
		"ko": "그래픽, 오디오 및 언어 설정",
		"tr": "AYARLAR, SES VE DİL",
	},
	"menu_new_career": {
		"ru": "НОВАЯ КАРЬЕРА (СБРОС ПРОГРЕССА)",
		"en": "NEW CAREER (RESET SAVE)",
		"es": "NUEVA CARRERA (REINICIAR)",
		"de": "NEUE KARRIERE (ZURÜCKSETZEN)",
		"fr": "NOUVELLE CARRIÈRE (RÉINITIALISER)",
		"pt": "NOVA CARREIRA (REINICIAR)",
		"zh": "新生涯（重置存档）",
		"ja": "ニューキャリア（リセット）",
		"ko": "새 커리어 (저장 초기화)",
		"tr": "YENİ KARİYER (SIFIRLA)",
	},
	"menu_exit": {
		"ru": "ВЫХОД НА РАБОЧИЙ СТОЛ",
		"en": "EXIT TO DESKTOP",
		"es": "SALIR AL ESCRITORIO",
		"de": "ZUM DESKTOP BEENDEN",
		"fr": "QUITTER VERS LE BUREAU",
		"pt": "SAIR PARA A ÁREA DE TRABALHO",
		"zh": "退出至桌面",
		"ja": "デスクトップへ終了",
		"ko": "바탕화면으로 종료",
		"tr": "MASAÜSTÜNE ÇIK",
	},
	"menu_version": {
		"ru": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
		"en": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
		"es": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
		"de": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
		"fr": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
		"pt": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
		"zh": "v2.1.0 Windows 64位正式版  •  Orbital Forge Interactive",
		"ja": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
		"ko": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
		"tr": "v2.1.0 Windows 64-Bit  •  Orbital Forge Interactive",
	},
	"menu_reset_confirm": {
		"ru": "Начать новую карьеру?\nКорабль, кредиты, карты экипажа и улучшения будут сброшены.",
		"en": "Start a brand-new career?\nYour ship, credits, crew cards, and upgrades will be reset.",
		"es": "¿Iniciar una nueva carrera?\nSe reiniciarán tu nave, créditos, cartas y mejoras.",
		"de": "Neue Karriere starten?\nSchiff, Credits, Crew-Karten und Upgrades werden zurückgesetzt.",
		"fr": "Commencer une nouvelle carrière ?\nVotre vaisseau, crédits et cartes seront réinitialisés.",
		"pt": "Iniciar uma nova carreira?\nSua nave, créditos, cartas e melhorias serão reiniciados.",
		"zh": "确定开始全新生涯？\n当前的星舰、信用点、船员卡和升级都将被重置。",
		"ja": "新しいキャリアを始めますか？\n現在の艦船、クレジット、カード、強化が初期化されます。",
		"ko": "새로운 커리어를 시작하시겠습니까?\n함선, 크레딧, 크루 카드 및 업그레이드가 초기화됩니다.",
		"tr": "Yeni kariyer başlatılsın mı?\nGemi, krediler, kartlar ve geliştirmeler sıfırlanacak.",
	},
	"menu_reset_yes": {
		"ru": "СБРОСИТЬ И НАЧАТЬ",
		"en": "RESET & START",
		"es": "REINICIAR",
		"de": "ZURÜCKSETZEN",
		"fr": "RÉINITIALISER",
		"pt": "REINICIAR",
		"zh": "重置并开始",
		"ja": "リセットして開始",
		"ko": "초기화 후 시작",
		"tr": "SIFIRLA VE BAŞLA",
	},
	"nav_menu": {
		"ru": "ГЛАВНОЕ МЕНЮ",
		"en": "MAIN MENU",
		"es": "MENÚ PRINCIPAL",
		"de": "HAUPTMENÜ",
		"fr": "MENU PRINCIPAL",
		"pt": "MENU PRINCIPAL",
		"zh": "返回主菜单",
		"ja": "メインメニュー",
		"ko": "메인 메뉴",
		"tr": "ANA MENÜ",
	},
	"hangar_constructor": {
		"ru": "3D КОНСТРУКТОР КОРАБЛЯ",
		"en": "3D SHIP CONSTRUCTOR",
		"es": "CONSTRUCTOR 3D DE NAVE",
		"de": "3D-SCHIFFSKONSTRUKTEUR",
		"fr": "CONSTRUCTEUR 3D DU VAISSEAU",
		"pt": "CONSTRUTOR 3D DA NAVE",
		"zh": "3D 星舰建造台",
		"ja": "3D 艦船コンストラクター",
		"ko": "3D 함선 건조대",
		"tr": "3B GEMİ İNŞA PANELİ",
	},
	"buy_cell_btn": {
		"ru": "+ ЯЧЕЙКА КОРПУСА (%d КР)",
		"en": "+ EXPANSION CELL (%d CR)",
		"es": "+ CELDA DE CASCO (%d CR)",
		"de": "+ HÜLLENZELLE (%d CR)",
		"fr": "+ CELLULE DE COQUE (%d CR)",
		"pt": "+ CÉLULA DE CASCO (%d CR)",
		"zh": "+ 购买扩展舱格 (%d CR)",
		"ja": "+ 拡張セル購入 (%d CR)",
		"ko": "+ 확장 셀 구매 (%d CR)",
		"tr": "+ GÖVDE HÜCRESİ (%d KR)",
	},
	"not_enough_credits": {
		"ru": "Недостаточно кредитов для покупки ячейки корпуса!",
		"en": "Insufficient Credits to purchase Expansion Cell!",
		"es": "¡Créditos insuficientes para comprar celda!",
		"de": "Nicht genügend Credits für Hüllenzelle!",
		"fr": "Crédits insuffisants pour acheter une cellule !",
		"pt": "Créditos insuficientes para comprar célula!",
		"zh": "信用点不足，无法购买扩展舱格！",
		"ja": "クレジットが不足しています！",
		"ko": "크레딧이 부족하여 확장 셀을 구매할 수 없습니다!",
		"tr": "Gövde hücresi için yeterli kredi yok!",
	},
	"crew_slots_info": {
		"ru": "Слоты мостика: %d • Куплено ячеек: %d (%d/10 до слота)",
		"en": "Crew Slots: %d • Cells: %d (Next: %d/10)",
		"es": "Ranuras: %d • Celdas: %d (Sig.: %d/10)",
		"de": "Crew-Plätze: %d • Zellen: %d (Nächster: %d/10)",
		"fr": "Postes : %d • Cellules : %d (Suiv. : %d/10)",
		"pt": "Vagas: %d • Células: %d (Próx.: %d/10)",
		"zh": "船员槽位：%d • 已购舱格：%d（下个槽位 %d/10）",
		"ja": "クルースロット: %d • 購入セル: %d (次まで %d/10)",
		"ko": "크루 슬롯: %d • 구매 셀: %d (다음 %d/10)",
		"tr": "Mürettebat Yuvası: %d • Hücre: %d (Sonraki: %d/10)",
	},
	"rotate_btn": {
		"ru": "ПОВ [R]",
		"en": "ROT [R]",
		"es": "ROT [R]",
		"de": "DREH [R]",
		"fr": "ROT [R]",
		"pt": "GIR [R]",
		"zh": "旋转 [R]",
		"ja": "回転 [R]",
		"ko": "회전 [R]",
		"tr": "DÖN [R]",
	},
	"layout_placeholder": {
		"ru": "Имя чертежа...",
		"en": "Blueprint name...",
		"es": "Nombre del plano...",
		"de": "Bauplanname...",
		"fr": "Nom du plan...",
		"pt": "Nome do projeto...",
		"zh": "输入蓝图名称...",
		"ja": "設計図名...",
		"ko": "설계도 이름...",
		"tr": "Şema adı...",
	},
	"save_layout": {
		"ru": "СОХР.",
		"en": "SAVE",
		"es": "GUARDAR",
		"de": "SPEICH.",
		"fr": "SAUV.",
		"pt": "SALVAR",
		"zh": "保存",
		"ja": "保存",
		"ko": "저장",
		"tr": "KAYDET",
	},
	"load_layout": {
		"ru": "ЗАГР.",
		"en": "LOAD",
		"es": "CARGAR",
		"de": "LADEN",
		"fr": "CHARG.",
		"pt": "ABRIR",
		"zh": "读取",
		"ja": "読込",
		"ko": "불러오기",
		"tr": "YÜKLE",
	},
	"saved_layout_msg": {
		"ru": "Чертёж корабля «%s» сохранён.",
		"en": "Saved ship blueprint '%s'.",
		"es": "Plano '%s' guardado.",
		"de": "Bauplan '%s' gespeichert.",
		"fr": "Plan '%s' sauvegardé.",
		"pt": "Projeto '%s' salvo.",
		"zh": "已保存星舰蓝图「%s」。",
		"ja": "設計図「%s」を保存しました。",
		"ko": "설계도 '%s' 저장 완료.",
		"tr": "'%s' şeması kaydedildi.",
	},
	"loaded_layout_msg": {
		"ru": "Чертёж корабля «%s» загружен.",
		"en": "Loaded ship blueprint '%s'.",
		"es": "Plano '%s' cargado.",
		"de": "Bauplan '%s' geladen.",
		"fr": "Plan '%s' chargé.",
		"pt": "Projeto '%s' carregado.",
		"zh": "已载入星舰蓝图「%s」。",
		"ja": "設計図「%s」を読み込みました。",
		"ko": "설계도 '%s' 불러오기 완료.",
		"tr": "'%s' şeması yüklendi.",
	},
	"hangar_telemetry": {
		"ru": "ТЕЛЕМЕТРИЯ И ФИЗИКА КОРАБЛЯ",
		"en": "SHIP TELEMETRY & PHYSICS",
		"es": "TELEMETRÍA Y FÍSICA DE NAVE",
		"de": "TELEMETRIE & SCHIFFSPHYSIK",
		"fr": "TÉLÉMÉTRIE ET PHYSIQUE",
		"pt": "TELEMETRIA E FÍSICA DA NAVE",
		"zh": "星舰物理与实时遥测",
		"ja": "艦船テレメトリ＆物理特性",
		"ko": "함선 텔레메트리 및 물리 제원",
		"tr": "GEMİ TELEMETRİSİ VE FİZİK",
	},
	"stat_modules": {
		"ru": "Модулей установлено",
		"en": "Installed Modules",
		"es": "Módulos instalados",
		"de": "Installierte Module",
		"fr": "Modules installés",
		"pt": "Módulos instalados",
		"zh": "已安装模块",
		"ja": "搭載モジュール数",
		"ko": "장착 모듈 수",
		"tr": "Kurulu Modül",
	},
	"stat_balance": {
		"ru": "Балансировка тяги",
		"en": "Thrust Balance",
		"es": "Equilibrio de empuje",
		"de": "Schubbalance",
		"fr": "Équilibre de poussée",
		"pt": "Equilíbrio de empuxo",
		"zh": "推力平衡度",
		"ja": "推力バランス",
		"ko": "추력 밸런스",
		"tr": "İtki Dengesi",
	},
	"stat_mass": {
		"ru": "Масса (+груз)",
		"en": "Mass (+Cargo)",
		"es": "Masa (+Carga)",
		"de": "Masse (+Fracht)",
		"fr": "Masse (+Cargaison)",
		"pt": "Massa (+Carga)",
		"zh": "总质量 (+货舱)",
		"ja": "総質量 (+貨物)",
		"ko": "총 질량 (+화물)",
		"tr": "Kütle (+Kargo)",
	},
	"stat_com": {
		"ru": "Центр масс (ЦМ)",
		"en": "Center of Mass",
		"es": "Centro de masa",
		"de": "Schwerpunkt (CoM)",
		"fr": "Centre de masse",
		"pt": "Centro de massa",
		"zh": "质心坐标 (CoM)",
		"ja": "重心位置 (CoM)",
		"ko": "질량 중심 (CoM)",
		"tr": "Kütle Merkezi",
	},
	"stat_thrust": {
		"ru": "Тяга двигателей",
		"en": "Engine Thrust",
		"es": "Empuje total",
		"de": "Gesamtschub",
		"fr": "Poussée totale",
		"pt": "Empuxo total",
		"zh": "引擎总推力",
		"ja": "エンジン総推力",
		"ko": "엔진 총 추력",
		"tr": "Toplam İtki",
	},
	"stat_accel": {
		"ru": "Разгон / Поворот",
		"en": "Accel / Turn",
		"es": "Acel. / Giro",
		"de": "Beschl. / Drehung",
		"fr": "Accél. / Rotation",
		"pt": "Acel. / Giro",
		"zh": "加速度 / 转向",
		"ja": "加速度 / 旋回性能",
		"ko": "가속도 / 선회력",
		"tr": "İvme / Dönüş",
	},
	"stat_hull_shield": {
		"ru": "Корпус / Щиты",
		"en": "Hull / Shield",
		"es": "Casco / Escudo",
		"de": "Hülle / Schild",
		"fr": "Coque / Bouclier",
		"pt": "Casco / Escudo",
		"zh": "装甲 / 护盾容量",
		"ja": "船体HP / シールド",
		"ko": "선체 / 보호막",
		"tr": "Gövde / Kalkan",
	},
	"stat_power": {
		"ru": "Генерация / Расход",
		"en": "Power Gen / Draw",
		"es": "Energía Gen / Uso",
		"de": "Energie Gen / Last",
		"fr": "Énergie Prod / Conso",
		"pt": "Energia Ger / Uso",
		"zh": "发电功率 / 负载",
		"ja": "発電量 / 消費電力",
		"ko": "발전량 / 소비 전력",
		"tr": "Üretim / Tüketim",
	},
	"stat_dps": {
		"ru": "Бурение / Оружие",
		"en": "Mining / Weapon DPS",
		"es": "Minería / Armas DPS",
		"de": "Bergbau / Waffen-DPS",
		"fr": "Minage / Armes DPS",
		"pt": "Mineração / Armas DPS",
		"zh": "采矿 / 武器每秒伤害",
		"ja": "採掘 / 兵器 DPS",
		"ko": "채굴 / 무기 DPS",
		"tr": "Kazı / Silah DPS",
	},
	"stat_magnet_cargo": {
		"ru": "Магнит / Трюм",
		"en": "Magnet / Cargo",
		"es": "Imán / Bodega",
		"de": "Magnet / Fracht",
		"fr": "Aimant / Soute",
		"pt": "Ímã / Carga",
		"zh": "磁吸半径 / 货舱",
		"ja": "吸引範囲 / 貨物倉",
		"ko": "자력 반경 / 화물칸",
		"tr": "Mıknatıs / Kargo",
	},
	"hangar_cam_help": {
		"ru": "ПКМ: Орбита • СКМ/WASD: Сдвиг • Колесо: Зум\nЛКМ по грани: Установить • R: Поворот • X: Снять",
		"en": "RMB: Orbit • MMB/WASD: Pan • Wheel: Zoom\nLMB on hull face: Attach • R: Rotate • X: Remove",
		"es": "Clic Der.: Órbita • WASD: Mover • Rueda: Zoom\nClic Izq.: Instalar • R: Rotar • X: Quitar",
		"de": "RMT: Orbit • WASD: Schwenk • Mausrad: Zoom\nLMT: Montieren • R: Drehen • X: Entfernen",
		"fr": "Clic Droit : Orbite • WASD : Déplacer • Molette : Zoom\nClic Gauche : Poser • R : Tourner • X : Retirer",
		"pt": "BDM: Órbita • WASD: Mover • Roda: Zoom\nBEM: Instalar • R: Girar • X: Remover",
		"zh": "右键拖动：环绕视角 • WASD/中键：平移 • 滚轮：缩放\n左键点击船体表面：安装模块 • R：旋转 • X：拆卸",
		"ja": "右ドラッグ: 回転 • WASD/中ボタン: 移動 • ホイール: ズーム\n左クリック: モジュール装着 • R: 回転 • X: 撤去",
		"ko": "우클릭 드래그: 회전 • WASD/휠클릭: 이동 • 휠: 줌\n좌클릭: 모듈 장착 • R: 회전 • X: 분리",
		"tr": "Sağ Tık: Yörünge • WASD: Kaydır • Tekerlek: Yakınlaş\nSol Tık: Tak • R: Döndür • X: Sök",
	},
	"hangar_status_default": {
		"ru": "Наведите курсор на грань корабля для установки модуля или выберите отсек на нижней панели.",
		"en": "Hover any ship hull face to attach hardware, or open a station from the Bottom Dock.",
		"es": "Apunta a una cara del casco para instalar módulos o usa la barra inferior.",
		"de": "Fahre über eine Schiffskante zur Montage oder wähle unten eine Station.",
		"fr": "Survolez une face de la coque pour installer un module ou ouvrez un terminal en bas.",
		"pt": "Aponte para o casco para acoplar módulos ou abra uma estação na barra inferior.",
		"zh": "将光标移至船体表面即可安装模块，或从底部快捷坞打开各功能站。",
		"ja": "船体面にカーソルを合わせて装備を装着するか、下部ドックから施設を開きます。",
		"ko": "선체 표면에 마우스를 올려 모듈을 장착하거나 하단 독에서 시설을 여세요.",
		"tr": "Modül takmak için gemi yüzeyine gelin veya alt panelden bir istasyon açın.",
	},
	"status_remove_hint": {
		"ru": "Нажмите ЛКМ, чтобы снять модуль и вернуть на склад.",
		"en": "Click LMB to detach module back to Hangar storage.",
		"es": "Clic izquierdo para desmontar el módulo al almacén.",
		"de": "Linksklick, um das Modul ins Lager zurückzulegen.",
		"fr": "Clic gauche pour démonter le module vers l'entrepôt.",
		"pt": "Clique para desmontar o módulo de volta ao depósito.",
		"zh": "点击左键拆卸该模块并收回机库仓库。",
		"ja": "左クリックでモジュールを取り外して倉庫へ戻します。",
		"ko": "좌클릭하여 모듈을 분리하고 보관함으로 되돌립니다.",
		"tr": "Modülü söküp depoya geri almak için sol tıklayın.",
	},
	"status_place_hint": {
		"ru": "РЕЖИМ СБОРКИ: наведите на грань корабля для установки.",
		"en": "BUILD MODE: Hover any module face to attach hardware.",
		"es": "MODO CONSTRUCCIÓN: apunta al casco para instalar.",
		"de": "BAUMODUS: Über eine Modulfläche fahren zum Anbauen.",
		"fr": "MODE CONSTRUCTION : survolez une face pour installer.",
		"pt": "MODO CONSTRUÇÃO: aponte para uma face para acoplar.",
		"zh": "建造模式：悬停在模块表面进行安装。",
		"ja": "建造モード: モジュール面に合わせて装着します。",
		"ko": "건조 모드: 모듈 표면에 마우스를 올려 장착하세요.",
		"tr": "İNŞA MODU: Takmak için modül yüzeyine gelin.",
	},
	"status_click_station": {
		"ru": "Нажмите ЛКМ по 3D-терминалу: %s",
		"en": "Click 3D Terminal to open: %s",
		"es": "Clic en terminal 3D para abrir: %s",
		"de": "3D-Terminal anklicken zum Öffnen: %s",
		"fr": "Cliquez sur le terminal 3D : %s",
		"pt": "Clique no terminal 3D para abrir: %s",
		"zh": "左键点击 3D 终端以打开：%s",
		"ja": "3Dターミナルをクリックして開く: %s",
		"ko": "3D 터미널을 클릭하여 열기: %s",
		"tr": "Açmak için 3B terminale tıklayın: %s",
	},
	"warp_gate_3d": {
		"ru": "ВАРП-ВРАТА В АНГАР",
		"en": "HANGAR WARP GATE",
		"es": "PORTAL AL HANGAR",
		"de": "HANGAR-WARPTOR",
		"fr": "PORTAIL DU HANGAR",
		"pt": "PORTAL DO HANGAR",
		"zh": "返回机库跃迁门",
		"ja": "ハンガーワープゲート",
		"ko": "격납고 워프 게이트",
		"tr": "HANGAR SIÇRAMA KAPISI",
	},
	"hud_power": {
		"ru": "ЭНЕРГИЯ",
		"en": "POWER",
		"es": "ENERGÍA",
		"de": "ENERGIE",
		"fr": "ÉNERGIE",
		"pt": "ENERGIA",
		"zh": "能量核心",
		"ja": "電力",
		"ko": "에너지",
		"tr": "ENERJİ",
	},
	"hud_flight_hint": {
		"ru": "WASD/Space/Ctrl: 6-ДОФ • Shift: разгон • Мышь: прицел 360° (C — центр) • Q/E: бочка • ЛКМ: огонь ПО ЗЕЛЁНОЙ ЗАХВАЧЕННОЙ ЦЕЛИ (T) • ПКМ/F: бур по астероидам • Z: стабилизатор • Esc/Tab: пауза • Выход: warp-портал",
		"en": "WASD/Space/Ctrl: 6-DOF • Shift: boost • Mouse: 360 steer (C: center) • Q/E: roll • LMB: fire at the GREEN locked target (T) • RMB/F: mining beam on rocks • Z: stabilizer • Esc/Tab: pause • Exit: warp portal",
		"es": "WASD/Espacio/Ctrl: 6-DOF • Shift: impulso • Ratón: giro 360° (C: centro) • Q/E: tonel • Clic Izq.: fuego al objetivo VERD (T) • Clic Der./F: rayo minero • Z: estabilizador • Esc/Tab: pausa • Salida: portal warp",
		"de": "WASD/Space/Strg: 6-DOF • Shift: Schub • Maus: 360° Steuern (C: Mitte) • Q/E: Rollen • LMT: Feuer auf das GRÜNE Ziel (T) • RMT/F: Bohrstrahl • Z: Stabilisator • Esc/Tab: Pause • Ausgang: Warp-Portal",
		"fr": "WASD/Espace/Ctrl : 6-DOF • Shift : boost • Souris : 360° (C : centre) • Q/E : tonneau • Clic G : tir sur la cible VERTE (T) • Clic D/F : foreuse • Z : stabilisateur • Esc/Tab : pause • Sortie : portail warp",
		"pt": "WASD/Espaço/Ctrl: 6-DOF • Shift: impulso • Mouse: giro 360° (C: centro) • Q/E: rolagem • BEM: fogo no alvo VERDE travado (T) • BDM/F: raio de mineração • Z: estabilizador • Esc/Tab: pausa • Saída: portal warp",
		"zh": "WASD/空格/Ctrl：六自由度机动 • Shift：加速 • 鼠标：360°转向 (C 归中) • Q/E：翻滚 • 左键：攻击绿色锁定目标 (T) • 右键/F：采矿光束 • Z：稳定器 • Esc/Tab：暂停 • 出口：跃迁门",
		"ja": "WASD/Space/Ctrl: 6軸移動 • Shift: ブースト • マウス: 360°旋回 (C: 中央) • Q/E: ロール • 左クリック: 緑のロック目標へ射撃 (T) • 右/F: 採掘ビーム • Z: 安定化 • Esc/Tab: 一時停止 • 出口: ワープ門",
		"ko": "WASD/Space/Ctrl: 6자유도 • Shift: 부스트 • 마우스: 360° 조종 (C: 중앙) • Q/E: 롤링 • 좌클릭: 초록 잠금 대상 사격 (T) • 우클릭/F: 채굴 빔 • Z: 안정화 • Esc/Tab: 일시정지 • 출구: 워프 포털",
		"tr": "WASD/Space/Ctrl: 6-DOF • Shift: ivme • Fare: 360° yön (C: merkez) • Q/E: yatış • Sol Tık: YEŞİL kilitli hedefe ateş (T) • Sağ/F: maden ışını • Z: dengeleyici • Esc/Tab: duraklat • Çıkış: warp kapısı",
	},


	"hud_minute_task": {
		"ru": "МИНУТНАЯ ЦЕЛЬ (%dс): %s (%d/%d)  •  +%d КРИСТ",
		"en": "MINUTE TASK (%ds): %s (%d/%d)  •  +%d CRY",
		"es": "META POR MINUTO (%ds): %s (%d/%d)  •  +%d CRI",
		"de": "MINUTENZIEL (%ds): %s (%d/%d)  •  +%d KRI",
		"fr": "OBJECTIF MINUTE (%ds) : %s (%d/%d)  •  +%d CRI",
		"pt": "META DE MINUTO (%ds): %s (%d/%d)  •  +%d CRI",
		"zh": "每分任务 (%d秒)：%s (%d/%d)  •  +%d 水晶",
		"ja": "分次ミッション (%d秒): %s (%d/%d)  •  +%d CRY",
		"ko": "분간 임무 (%d초): %s (%d/%d)  •  +%d 크리스탈",
		"tr": "DAKİKALIK GÖREV (%dsn): %s (%d/%d)  •  +%d KRİ",
	},
	"hud_plasma_warn": {
		"ru": "▲ ВНИМАНИЕ: РАЗРЯД ПЛАЗМЕННОГО ШТОРМА!",
		"en": "▲ WARNING: PLASMA STORM DISCHARGE IMMINENT!",
		"es": "▲ ¡ALERTA: DESCARGA DE TORMENTA DE PLASMA!",
		"de": "▲ WARNUNG: PLASMASTURM-ENTLADUNG STEHT BEVOR!",
		"fr": "▲ ALERTE : DÉCHARGE DE TEMPÊTE DE PLASMA !",
		"pt": "▲ ALERTA: DESCARGA DE TEMPESTADE DE PLASMA!",
		"zh": "▲ 警告：等离子风暴雷电即将袭来！",
		"ja": "▲ 警告：プラズマ嵐の放電が接近中！",
		"ko": "▲ 경고: 플라즈마 폭풍 낙뢰 임박!",
		"tr": "▲ UYARI: PLAZMA FIRTINASI YILDIRIMI YAKLAŞIYOR!",
	},
	"pause_title": {
		"ru": "КОМАНДНАЯ ПАУЗА ЭКСПЕДИЦИИ",
		"en": "EXPEDITION COMMAND PAUSE",
		"es": "PAUSA DE EXPEDICIÓN",
		"de": "EXPEDITIONSKOMMANDO",
		"fr": "PAUSE DE L'EXPÉDITION",
		"pt": "COMANDO DA EXPEDIÇÃO",
		"zh": "远征指挥暂停菜单",
		"ja": "遠征コマンドメニュー",
		"ko": "원정 지휘 일시정지",
		"tr": "SEFER KOMUTA DURAKLATMA",
	},
	"pause_resume": {
		"ru": "ПРОДОЛЖИТЬ ПОЛЁТ [ESC]",
		"en": "RESUME FLIGHT [ESC]",
		"es": "REANUDAR VUELO [ESC]",
		"de": "WEITERFLIEGEN [ESC]",
		"fr": "REPRENDRE LE VOL [ESC]",
		"pt": "RETOMAR VOO [ESC]",
		"zh": "继续太空航行 [ESC]",
		"ja": "フライトを再開 [ESC]",
		"ko": "비행 재개 [ESC]",
		"tr": "UÇUŞA DEVAM ET [ESC]",
	},
	"game_subtitle": {
		"ru": "МОДУЛЬНАЯ 3D-ИНЖЕНЕРИЯ • ДОБЫЧА РУДЫ • КАРТЫ ЭКИПАЖА",
		"en": "MODULAR 3D SHIP ENGINEERING • ASTEROID MINING • CREW CARDS",
		"es": "INGENIERÍA 3D MODULAR • MINERÍA ESPACIAL • CARTAS DE TRIPULACIÓN",
		"de": "MODULARER 3D-SCHIFFSBAU • ASTEROIDENBERGBAU • CREW-KARTEN",
		"fr": "INGÉNIERIE 3D MODULAIRE • MINAGE SPATIAL • CARTES D'ÉQUIPAGE",
		"pt": "ENGENHARIA 3D MODULAR • MINERAÇÃO ESPACIAL • CARTAS DE TRIPULAÇÃO",
		"zh": "模块化3D星舰建造 • 小行星采矿 • 船员卡牌",
		"ja": "モジュール式3D宇宙船建造 • 小惑星採掘 • クルーカード",
		"ko": "모듈형 3D 우주선 건조 • 소행성 채굴 • 크루 카드",
		"tr": "MODÜLER 3D GEMİ İNŞASI • ASTEROİT MADENCİLİĞİ • MÜRETTEBAT KARTLARI",
	},
	"commander_status": {
		"ru": "Статус командира: %d КР  •  %d КРИСТ  •  %d/42 карт экипажа",
		"en": "Commander: %d CR  •  %d CRY  •  %d/42 Crew Cards",
		"es": "Comandante: %d CR  •  %d CRI  •  %d/42 Cartas",
		"de": "Kommandant: %d CR  •  %d KRI  •  %d/42 Crew-Karten",
		"fr": "Commandant : %d CR  •  %d CRI  •  %d/42 Cartes",
		"pt": "Comandante: %d CR  •  %d CRI  •  %d/42 Cartas",
		"zh": "指挥官状态：%d 信用点 • %d 水晶 • %d/42 船员卡",
		"ja": "司令官ステータス: %d CR • %d クリスタル • %d/42 クルー",
		"ko": "지휘관 상태: %d CR • %d 크리스탈 • %d/42 크루 카드",
		"tr": "Komutan: %d KR  •  %d KRİ  •  %d/42 Mürettebat Kartı",
	},
	"enter_hangar": {
		"ru": "ВОЙТИ В 3D ОРБИТАЛЬНЫЙ АНГАР",
		"en": "ENTER 3D ORBITAL HANGAR",
		"es": "ENTRAR AL HANGAR ORBITAL 3D",
		"de": "3D-ORBITALHANGAR BETRETEN",
		"fr": "ENTRER DANS LE HANGAR ORBITAL 3D",
		"pt": "ENTRAR NO HANGAR ORBITAL 3D",
		"zh": "进入 3D 轨道机库",
		"ja": "3D 軌道ハンガーへ入る",
		"ko": "3D 궤도 격납고 입장",
		"tr": "3B YÖRÜNGE HANGARINA GİR",
	},
	"quick_launch": {
		"ru": "БЫСТРЫЙ ВЫЛЕТ (ПОЯС НОВИЧКОВ)",
		"en": "QUICK LAUNCH (STARTER BELT)",
		"es": "VUELO RÁPIDO (CINTURÓN INICIAL)",
		"de": "SCHNELLSTART (STARTERGÜRTEL)",
		"fr": "VOL RAPIDE (CEINTURE INITIALE)",
		"pt": "VOO RÁPIDO (CINTURÃO INICIAL)",
		"zh": "快速出击（新手星带）",
		"ja": "クイック出撃（スターターベルト）",
		"ko": "빠른 출격 (초보자 소행성대)",
		"tr": "HIZLI UÇUŞ (BAŞLANGIÇ KUŞAĞI)",
	},
	"settings_btn": {
		"ru": "НАСТРОЙКИ, ЗВУК И ЯЗЫК",
		"en": "GRAPHICS, AUDIO & LANGUAGE",
		"es": "AJUSTES, AUDIO E IDIOMA",
		"de": "GRAFIK, AUDIO & SPRACHE",
		"fr": "OPTIONS, AUDIO ET LANGUE",
		"pt": "OPÇÕES, ÁUDIO E IDIOMA",
		"zh": "画面、音效与语言设置",
		"ja": "設定・サウンド・言語",
		"ko": "그래픽, 오디오 및 언어 설정",
		"tr": "AYARLAR, SES VE DİL",
	},
	"new_career": {
		"ru": "НОВАЯ КАРЬЕРА (СБРОС)",
		"en": "NEW CAREER (RESET SAVE)",
		"es": "NUEVA CARRERA (REINICIAR)",
		"de": "NEUE KARRIERE (ZURÜCKSETZEN)",
		"fr": "NOUVELLE CARRIÈRE (RÉINITIALISER)",
		"pt": "NOVA CARREIRA (REINICIAR)",
		"zh": "新生涯（重置存档）",
		"ja": "ニューキャリア（リセット）",
		"ko": "새 커리어 (저장 초기화)",
		"tr": "YENİ KARİYER (SIFIRLA)",
	},
	"exit_desktop": {
		"ru": "ВЫХОД НА РАБОЧИЙ СТОЛ",
		"en": "EXIT TO DESKTOP",
		"es": "SALIR AL ESCRITORIO",
		"de": "ZUM DESKTOP BEENDEN",
		"fr": "QUITTER VERS LE BUREAU",
		"pt": "SAIR PARA A ÁREA DE TRABALHO",
		"zh": "退出至桌面",
		"ja": "デスクトップへ終了",
		"ko": "바탕화면으로 종료",
		"tr": "MASAÜSTÜNE ÇIK",
	},
	"confirm_reset_title": {
		"ru": "НАЧАТЬ НОВУЮ КАРЬЕРУ?",
		"en": "START A FRESH CAREER?",
		"es": "¿INICIAR NUEVA CARRERA?",
		"de": "NEUE KARRIERE STARTEN?",
		"fr": "COMMENCER UNE NOUVELLE CARRIÈRE ?",
		"pt": "INICIAR NOVA CARREIRA?",
		"zh": "确定开始新生涯？",
		"ja": "新しいキャリアを始めますか？",
		"ko": "새 커리어를 시작하시겠습니까?",
		"tr": "YENİ KARİYER BAŞLATILSIN MI?",
	},
	"confirm_reset_desc": {
		"ru": "Корабль, кредиты, карты экипажа и улучшения будут сброшены. Продолжить?",
		"en": "Your current ship, credits, crew cards, and upgrades will be reset. Continue?",
		"es": "Se reiniciarán tu nave, créditos, cartas y mejoras. ¿Continuar?",
		"de": "Schiff, Credits, Crew-Karten und Upgrades werden zurückgesetzt. Fortfahren?",
		"fr": "Votre vaisseau, crédits, cartes et améliorations seront réinitialisés. Continuer ?",
		"pt": "Sua nave, créditos, cartas e melhorias serão reiniciados. Continuar?",
		"zh": "当前的飞船、信用点、船员卡和升级将被重置。是否继续？",
		"ja": "現在の艦船・クレジット・カード・強化がリセットされます。続けますか？",
		"ko": "현재 함선, 크레딧, 카드, 업그레이드가 초기화됩니다. 계속할까요?",
		"tr": "Mevcut geminiz, kredileriniz, kartlarınız ve geliştirmeleriniz sıfırlanacak.",
	},
	"cancel": {
		"ru": "ОТМЕНА", "en": "CANCEL", "es": "CANCELAR", "de": "ABBRECHEN", "fr": "ANNULER",
		"pt": "CANCELAR", "zh": "取消", "ja": "キャンセル", "ko": "취소", "tr": "İPTAL",
	},
	"reset_save": {
		"ru": "СБРОСИТЬ ПРОГРЕСС", "en": "RESET SAVE", "es": "REINICIAR", "de": "ZURÜCKSETZEN", "fr": "RÉINITIALISER",
		"pt": "REINICIAR", "zh": "确认重置", "ja": "リセット実行", "ko": "초기화 실행", "tr": "KAYDI SIFIRLA",
	},
	"close": {
		"ru": "ЗАКРЫТЬ [ESC]", "en": "CLOSE [ESC]", "es": "CERRAR [ESC]", "de": "SCHLIESSEN [ESC]", "fr": "FERMER [ESC]",
		"pt": "FECHAR [ESC]", "zh": "关闭 [ESC]", "ja": "閉じる [ESC]", "ko": "닫기 [ESC]", "tr": "KAPAT [ESC]",
	},
	"main_menu_btn": {
		"ru": "◄ МЕНЮ", "en": "◄ MENU", "es": "◄ MENÚ", "de": "◄ MENÜ", "fr": "◄ MENU",
		"pt": "◄ MENU", "zh": "◄ 主菜单", "ja": "◄ メニュー", "ko": "◄ 메뉴", "tr": "◄ MENÜ",
	},
	"hangar_title": {
		"ru": "ОРБИТАЛЬНЫЙ АНГАР", "en": "ORBITAL HANGAR", "es": "HANGAR ORBITAL", "de": "ORBITALHANGAR", "fr": "HANGAR ORBITAL",
		"pt": "HANGAR ORBITAL", "zh": "轨道建造机库", "ja": "軌道建造ハンガー", "ko": "궤도 건조 격납고", "tr": "YÖRÜNGE HANGARI",
	},
	"tab_shop": {
		"ru": "Магазин модулей", "en": "Equipment Shop", "es": "Tienda de Módulos", "de": "Modul-Shop", "fr": "Boutique Modules",
		"pt": "Loja de Módulos", "zh": "装备商店", "ja": "モジュールショップ", "ko": "장비 상점", "tr": "Modül Mağazası",
	},
	"tab_crew": {
		"ru": "Экипаж (42)", "en": "Crew Cards (42)", "es": "Tripulación (42)", "de": "Crew-Karten (42)", "fr": "Équipage (42)",
		"pt": "Tripulação (42)", "zh": "船员卡牌 (42)", "ja": "クルーカード (42)", "ko": "크루 카드 (42)", "tr": "Mürettebat (42)",
	},
	"tab_packs": {
		"ru": "Кристальные паки", "en": "Crystal Packs", "es": "Sobres Cristal", "de": "Kristall-Packs", "fr": "Packs Cristal",
		"pt": "Pacotes Cristal", "zh": "水晶卡包", "ja": "クリスタルパック", "ko": "크리스탈 팩", "tr": "Kristal Paketler",
	},
	"tab_upgrades": {
		"ru": "Ядро улучшений", "en": "Upgrade Core", "es": "Núcleo Mejoras", "de": "Upgrade-Kern", "fr": "Cœur d'Amélior.",
		"pt": "Núcleo Melhorias", "zh": "核心升级", "ja": "アップグレード核", "ko": "업그레이드 코어", "tr": "Geliştirme Çekirdeği",
	},
	"tab_achievements": {
		"ru": "Достижения (30)", "en": "Achievements (30)", "es": "Logros (30)", "de": "Erfolge (30)", "fr": "Succès (30)",
		"pt": "Conquistas (30)", "zh": "成就图鉴 (30)", "ja": "実績カード (30)", "ko": "업적 카드 (30)", "tr": "Başarımlar (30)",
	},
	"tab_launch": {
		"ru": "В КОСМОС ▶", "en": "LAUNCH ▶", "es": "DESPEGAR ▶", "de": "STARTEN ▶", "fr": "DÉCOLLER ▶",
		"pt": "LANÇAR ▶", "zh": "出击远征 ▶", "ja": "宇宙へ出撃 ▶", "ko": "우주 출격 ▶", "tr": "UÇUŞA GEÇ ▶",
	},
	"tab_settings": {
		"ru": "Настройки", "en": "Settings", "es": "Ajustes", "de": "Optionen", "fr": "Options",
		"pt": "Opções", "zh": "游戏设置", "ja": "設定", "ko": "설정", "tr": "Ayarlar",
	},
	"ship_constructor": {
		"ru": "3D КОНСТРУКТОР КОРАБЛЯ", "en": "3D SHIP CONSTRUCTOR", "es": "CONSTRUCTOR 3D", "de": "3D-SCHIFFSBAU", "fr": "CONSTRUCTEUR 3D",
		"pt": "CONSTRUTOR 3D", "zh": "3D 星舰建造台", "ja": "3D 艦船コンストラクター", "ko": "3D 함선 건조기", "tr": "3B GEMİ İNŞASI",
	},
	"buy_cell": {
		"ru": "+ ЯЧЕЙКА КОРПУСА (%d КР)", "en": "+ EXPANSION CELL (%d CR)", "es": "+ CELDA CASCO (%d CR)", "de": "+ HÜLLENZELLE (%d CR)", "fr": "+ CELLULE COQUE (%d CR)",
		"pt": "+ CÉLULA CASCO (%d CR)", "zh": "+ 购买扩展舱格 (%d CR)", "ja": "+ 船体セル購入 (%d CR)", "ko": "+ 선체 셀 구매 (%d CR)", "tr": "+ GÖVDE HÜCRESİ (%d KR)",
	},
	"crew_slots_prog": {
		"ru": "Слоты экипажа: %d  •  Куплено ячеек: %d (%d/10)",
		"en": "Crew Slots: %d  •  Cells Bought: %d (%d/10)",
		"es": "Ranuras: %d  •  Celdas: %d (%d/10)",
		"de": "Crew-Plätze: %d  •  Zellen: %d (%d/10)",
		"fr": "Postes : %d  •  Cellules : %d (%d/10)",
		"pt": "Vagas: %d  •  Células: %d (%d/10)",
		"zh": "船员槽：%d  •  已购舱格：%d (%d/10)",
		"ja": "クルー枠: %d • 購入セル: %d (%d/10)",
		"ko": "크루 슬롯: %d • 구매 셀: %d (%d/10)",
		"tr": "Mürettebat Yuvası: %d • Hücre: %d (%d/10)",
	},
	"mode_place": {
		"ru": "Установка", "en": "Place", "es": "Colocar", "de": "Bauen", "fr": "Placer",
		"pt": "Instalar", "zh": "安装", "ja": "設置", "ko": "설치", "tr": "Yerleştir",
	},
	"mode_remove": {
		"ru": "Снятие [X]", "en": "Remove [X]", "es": "Quitar [X]", "de": "Abbau [X]", "fr": "Retirer [X]",
		"pt": "Remover [X]", "zh": "拆除 [X]", "ja": "撤去 [X]", "ko": "제거 [X]", "tr": "Sök [X]",
	},
	"mode_rotate": {
		"ru": "Поворот [R]", "en": "Rotate [R]", "es": "Rotar [R]", "de": "Drehen [R]", "fr": "Pivoter [R]",
		"pt": "Girar [R]", "zh": "旋转 [R]", "ja": "回転 [R]", "ko": "회전 [R]", "tr": "Döndür [R]",
	},
	"owned_modules_hdr": {
		"ru": "СКЛАД МОДУЛЕЙ (ЛКМ ПО ГРАНИ КОРАБЛЯ)",
		"en": "OWNED MODULES (CLICK SHIP FACE)",
		"es": "MÓDULOS EN ALMACÉN (CLIC EN NAVE)",
		"de": "MODULLAGER (SCHIFFSSEITE KLICKEN)",
		"fr": "MODULES DISPONIBLES (CLIC VAISSEAU)",
		"pt": "MÓDULOS NO ARMAZÉM (CLIQUE NA NAVE)",
		"zh": "已拥有模块（左键点击舰体表面安装）",
		"ja": "所持モジュール（船体面をクリックして装着）",
		"ko": "보유 모듈 (선체 면을 클릭하여 장착)",
		"tr": "MODÜL DEPOSU (GEMİ YÜZEYİNE TIKLA)",
	},
	"blueprints_hdr": {
		"ru": "ЧЕРТЕЖИ КОРАБЛЯ", "en": "SHIP BLUEPRINTS", "es": "PLANOS DE NAVE", "de": "SCHIFFS-BLAUPAUSEN", "fr": "PLANS DU VAISSEAU",
		"pt": "PROJETOS DA NAVE", "zh": "星舰蓝图", "ja": "艦船ブループリント", "ko": "함선 설계도", "tr": "GEMİ ŞABLONLARI",
	},
	"blueprint_placeholder": {
		"ru": "Название чертежа...", "en": "Blueprint name...", "es": "Nombre del plano...", "de": "Blaupausenname...", "fr": "Nom du plan...",
		"pt": "Nome do projeto...", "zh": "输入蓝图名称...", "ja": "設計図名...", "ko": "설계도 이름...", "tr": "Şablon adı...",
	},
	"save_btn": {
		"ru": "Сохр.", "en": "Save", "es": "Guardar", "de": "Speich.", "fr": "Sauv.",
		"pt": "Salvar", "zh": "保存", "ja": "保存", "ko": "저장", "tr": "Kaydet",
	},
	"load_btn": {
		"ru": "Загр.", "en": "Load", "es": "Cargar", "de": "Laden", "fr": "Charger",
		"pt": "Abrir", "zh": "读取", "ja": "読込", "ko": "로드", "tr": "Yükle",
	},
	"telemetry_hdr": {
		"ru": "ТЕЛЕМЕТРИЯ КОРАБЛЯ", "en": "SHIP TELEMETRY", "es": "TELEMETRÍA", "de": "SCHIFFS-TELEMETRIE", "fr": "TÉLÉMÉTRIE",
		"pt": "TELEMETRIA", "zh": "星舰实时遥测", "ja": "艦船テレメトリ", "ko": "함선 텔레메트리", "tr": "GEMİ TELEMETRİSİ",
	},
	"cam_controls_hint": {
		"ru": "ПКМ: Орбита • СКМ/WASD: Сдвиг • Колесо: Зум\nЛКМ: Модуль / 3D-терминал • R: Поворот • X: Снятие",
		"en": "RMB: Orbit • MMB/WASD: Pan • Wheel: Zoom\nLMB: Snap Module / Terminal • R: Rotate • X: Remove",
		"es": "BDR: Órbita • WASD: Mover • Rueda: Zoom\nBIZ: Módulo / Terminal • R: Rotar • X: Quitar",
		"de": "RMT: Orbit • WASD: Schwenk • Rad: Zoom\nLMT: Modul / Terminal • R: Drehen • X: Abbau",
		"fr": "Clic D: Orbite • WASD: Vue • Molette: Zoom\nClic G: Module / Terminal • R: Tourner • X: Retirer",
		"pt": "BD: Órbita • WASD: Mover • Roda: Zoom\nBE: Módulo / Terminal • R: Girar • X: Remover",
		"zh": "右键拖动: 旋转视角 • WASD: 平移 • 滚轮: 缩放\n左键: 安装模块/终端 • R: 旋转 • X: 拆除",
		"ja": "右ドラッグ: 回転 • WASD: 移動 • ホイール: ズーム\n左クリック: 装着/端末 • R: 回転 • X: 撤去",
		"ko": "우클릭: 회전 • WASD: 이동 • 휠: 줌\n좌클릭: 장착/단말기 • R: 회전 • X: 제거",
		"tr": "Sağ Tık: Yörünge • WASD: Kaydır • Tekerlek: Yakınlaş\nSol Tık: Modül/Terminal • R: Döndür • X: Sök",
	},
	"hangar_idle_hint": {
		"ru": "Наведите курсор на грань корабля для стыковки модуля или выберите станцию в нижней панели",
		"en": "Hover any ship module face to attach hardware, or open a station from the bottom dock",
		"es": "Apunta a una cara de la nave para acoplar módulos o usa la barra inferior",
		"de": "Auf Schiffsseite zeigen zum Anbauen oder unten eine Station öffnen",
		"fr": "Survolez une face du vaisseau pour fixer un module ou ouvrez une station en bas",
		"pt": "Aponte para a nave para acoplar módulos ou abra uma estação na barra inferior",
		"zh": "将鼠标悬停在船体模块表面以拼接装备，或点击下方空间站功能坞",
		"ja": "船体の面にカーソルを合わせて装備を接続するか、下部ドックから施設を開きます",
		"ko": "선체 표면에 마우스를 올려 장비를 부착하거나 하단 독에서 시설을 여세요",
		"tr": "Modül takmak için gemi yüzeyine gelin veya alt panelden istasyon açın",
	},
	"shop_installed_hdr": {
		"ru": "УСТАНОВЛЕННЫЕ МОДУЛИ (УЛУЧШЕНИЕ УР. 1–5)",
		"en": "INSTALLED HARDWARE (UPGRADE LV 1–5)",
		"es": "MÓDULOS INSTALADOS (MEJORAR NV 1–5)",
		"de": "INSTALLIERTE MODULE (UPGRADE ST. 1–5)",
		"fr": "MODULES INSTALLÉS (AMÉLIORER NIV. 1–5)",
		"pt": "MÓDULOS INSTALADOS (MELHORAR NV 1–5)",
		"zh": "已安装装备（可强化 Lv.1–5）",
		"ja": "装着済みモジュール（Lv.1〜5強化）",
		"ko": "장착된 모듈 (Lv.1~5 강화)",
		"tr": "KURULU MODÜLLER (SV. 1–5 GELİŞTİR)",
	},
	"buy_btn": {
		"ru": "КУПИТЬ • %d КР", "en": "BUY • %d CR", "es": "COMPRAR • %d CR", "de": "KAUFEN • %d CR", "fr": "ACHETER • %d CR",
		"pt": "COMPRAR • %d CR", "zh": "购买 • %d CR", "ja": "購入 • %d CR", "ko": "구매 • %d CR", "tr": "SATIN AL • %d KR",
	},
	"upgrade_btn": {
		"ru": "УЛУЧШИТЬ (%d КР)", "en": "UPGRADE (%d CR)", "es": "MEJORAR (%d CR)", "de": "UPGRADE (%d CR)", "fr": "AMÉLIORER (%d CR)",
		"pt": "MELHORAR (%d CR)", "zh": "强化 (%d CR)", "ja": "強化 (%d CR)", "ko": "강화 (%d CR)", "tr": "GELİŞTİR (%d KR)",
	},
	"max_level": {
		"ru": "МАКС. УРОВЕНЬ", "en": "MAX LEVEL", "es": "NIVEL MÁX.", "de": "MAX. STUFE", "fr": "NIVEAU MAX",
		"pt": "NÍVEL MÁX.", "zh": "已满级", "ja": "最大レベル", "ko": "최대 레벨", "tr": "MAKS. SEVİYE",
	},
	"owned_stock": {
		"ru": "На складе: %d", "en": "In Stock: %d", "es": "En almacén: %d", "de": "Auf Lager: %d", "fr": "En stock : %d",
		"pt": "No estoque: %d", "zh": "库存: %d", "ja": "在庫: %d", "ko": "보유: %d", "tr": "Stok: %d",
	},
	"crew_active_bridge": {
		"ru": "Активный мостик: %d / %d слотов  •  Коллекция: %d / 42 бойцов",
		"en": "Active Bridge: %d / %d Slots  •  Collection: %d / 42 Fighters",
		"es": "Puente activo: %d / %d  •  Colección: %d / 42",
		"de": "Aktive Brücke: %d / %d  •  Sammlung: %d / 42",
		"fr": "Pont actif : %d / %d  •  Collection : %d / 42",
		"pt": "Ponte ativa: %d / %d  •  Coleção: %d / 42",
		"zh": "舰桥编组: %d / %d 槽位 • 已收集: %d / 42 名船员",
		"ja": "ブリッジ編成: %d / %d 枠 • コレクション: %d / 42 名",
		"ko": "함교 편성: %d / %d 슬롯 • 수집: %d / 42 명",
		"tr": "Aktif Köprü: %d / %d Yuva • Koleksiyon: %d / 42",
	},
	"crew_select_prompt": {
		"ru": "Выберите карту бойца слева, чтобы изучить досье и назначить в экипаж.",
		"en": "Select any fighter card on the left to inspect dossier and assign to bridge.",
		"es": "Selecciona una carta a la izquierda para ver su expediente y asignarla.",
		"de": "Wähle links eine Karte, um das Dossier zu prüfen und sie zuzuweisen.",
		"fr": "Sélectionnez une carte à gauche pour voir le dossier et l'assigner.",
		"pt": "Selecione uma carta à esquerda para ver o dossiê e escalar na ponte.",
		"zh": "点击左侧任意船员卡牌查看详细档案并编入舰桥。",
		"ja": "左側のカードを選択して詳細データを確認・編成できます。",
		"ko": "왼쪽 카드를 선택해 상세 기록을 확인하고 함교에 배치하세요.",
		"tr": "Dosyayı incelemek ve köprüye atamak için soldan bir kart seçin.",
	},
	"equip_crew": {
		"ru": "НАЗНАЧИТЬ НА МОСТИК", "en": "ASSIGN TO BRIDGE", "es": "ASIGNAR AL PUENTE", "de": "AUF BRÜCKE SETZEN", "fr": "ASSIGNER AU PONT",
		"pt": "ESCALAR NA PONTE", "zh": "编入舰桥执勤", "ja": "ブリッジに編成", "ko": "함교에 배치", "tr": "KÖPRÜYE ATA",
	},
	"unequip_crew": {
		"ru": "СНЯТЬ С ДЕЖУРСТВА", "en": "REMOVE FROM BRIDGE", "es": "RETIRAR DEL PUENTE", "de": "VON BRÜCKE ABZIEHEN", "fr": "RETIRER DU PONT",
		"pt": "REMOVER DA PONTE", "zh": "卸下执勤船员", "ja": "編成から外す", "ko": "배치 해제", "tr": "GÖREVDEN AL",
	},
	"locked_crew_hint": {
		"ru": "Не открыт — открывайте Кристальные паки!", "en": "Locked — Open Crystal Packs to recruit!", "es": "¡Bloqueado — Abre sobres de cristal!",
		"de": "Gesperrt — Öffne Kristall-Packs!", "fr": "Verrouillé — Ouvrez des packs cristal !", "pt": "Bloqueado — Abra pacotes de cristal!",
		"zh": "尚未解锁 — 开启水晶卡包招募！", "ja": "未入手 — クリスタルパックで獲得！", "ko": "미획득 — 크리스탈 팩에서 영입 가능!", "tr": "Kilitli — Kristal Paket açarak kazan!",
	},
	"equipped_badge": {
		"ru": "◆ В ЭКИПАЖЕ", "en": "◆ ACTIVE", "es": "◆ ACTIVO", "de": "◆ AKTIV", "fr": "◆ ACTIF",
		"pt": "◆ ATIVO", "zh": "◆ 执勤中", "ja": "◆ 編成中", "ko": "◆ 배치됨", "tr": "◆ AKTİF",
	},
	"locked_badge": {
		"ru": "НЕ ОТКРЫТ", "en": "LOCKED", "es": "BLOQUEADO", "de": "GESPERRT", "fr": "VERROUILLÉ",
		"pt": "BLOQUEADO", "zh": "未解锁", "ja": "未解放", "ko": "잠김", "tr": "KİLİTLİ",
	},
	"pack_contains_3": {
		"ru": "Содержит 3 коллекционные карты бойцов • Дубликаты дают Кредиты",
		"en": "Contains 3 Collectible Fighter Cards • Duplicates grant Credits",
		"es": "Contiene 3 cartas de tripulación • Duplicadas dan créditos",
		"de": "Enthält 3 Sammelkarten • Duplikate geben Credits",
		"fr": "Contient 3 cartes d'équipage • Les doublons donnent des crédits",
		"pt": "Contém 3 cartas colecionáveis • Duplicadas rendem créditos",
		"zh": "内含 3 张船员收藏卡 • 重复卡牌自动折算信用点",
		"ja": "クルーカード3枚封入 • 重複カードはクレジット変換",
		"ko": "크루 카드 3장 포함 • 중복 카드는 크레딧으로 자동 환급",
		"tr": "3 Mürettebat Kartı içerir • Kopyalar Kredi kazandırır",
	},
	"pack_drop_rates": {
		"ru": "ШАНСЫ ВЫПАДЕНИЯ РЕДКОСТЕЙ:", "en": "RARITY DROP PROBABILITIES:", "es": "PROBABILIDADES DE RAREZA:", "de": "SELTENHEITS-WAHRSCHEINLICHKEIT:", "fr": "PROBABILITÉS DE RARETÉ :",
		"pt": "CHANCES DE RARIDADE:", "zh": "稀有度掉落概率公示：", "ja": "レアリティ提供割合:", "ko": "희귀도 획득 확률:", "tr": "NADİRLİK OLASILIKLARI:",
	},
	"pack_fifth_slot_bonus": {
		"ru": "◆ Редкий бонус: %.1f%% шанс навсегда открыть 5-й слот Ядра улучшений!",
		"en": "◆ Bonus Jackpot: %.1f%% chance to permanently unlock 5th Upgrade Slot!",
		"es": "◆ Bono especial: ¡%.1f%% de desbloquear la 5.ª ranura de mejora!",
		"de": "◆ Bonus-Chance: %.1f%% auf dauerhaften 5. Upgrade-Platz!",
		"fr": "◆ Bonus rare : %.1f%% de débloquer le 5e emplacement d'amélioration !",
		"pt": "◆ Bônus raro: %.1f%% de chance de liberar o 5º espaço de melhoria!",
		"zh": "◆ 稀有大奖：%.1f%% 概率永久解锁第 5 个核心升级槽！",
		"ja": "◆ レア特典: %.1f%% の確率で第5アップグレード枠を永久解放！",
		"ko": "◆ 특별 보너스: %.1f%% 확률로 5번째 업그레이드 슬롯 영구 해금!",
		"tr": "◆ Özel Bonus: %% %.1f şansla 5. Geliştirme Yuvasını kalıcı açar!",
	},
	"open_pack_btn": {
		"ru": "ОТКРЫТЬ ПАК (%d КРИСТ)", "en": "OPEN PACK (%d CRY)", "es": "ABRIR SOBRE (%d CRI)", "de": "PACK ÖFFNEN (%d KRI)", "fr": "OUVRIR PACK (%d CRI)",
		"pt": "ABRIR PACOTE (%d CRI)", "zh": "开启卡包 (%d 水晶)", "ja": "パック開封 (%d クリスタル)", "ko": "팩 개봉 (%d 크리스탈)", "tr": "PAKETİ AÇ (%d KRİ)",
	},
	"pack_standard_name": {
		"ru": "Галактический кристальный пак", "en": "Galactic Crystal Pack", "es": "Sobre Galáctico de Cristal", "de": "Galaktisches Kristall-Pack", "fr": "Pack Cristal Galactique",
		"pt": "Pacote Galáctico de Cristal", "zh": "星系水晶标准包", "ja": "ギャラクティック・パック", "ko": "은하 크리스탈 스탠다드 팩", "tr": "Galaktik Kristal Paketi",
	},
	"pack_elite_name": {
		"ru": "Элитный мифический ковчег", "en": "Mythic Sovereign Vault Pack", "es": "Bóveda Mítica Soberana", "de": "Mythisches Tresor-Pack", "fr": "Coffre Mythique Souverain",
		"pt": "Cofre Mítico Soberano", "zh": "神话秘宝至尊包", "ja": "ミシック・ヴォールトパック", "ko": "신화 볼트 엘리트 팩", "tr": "Mitik Hazine Paketi",
	},
	"pack_ceremony_opening": {
		"ru": "РАСПЕЧАТЫВАЕМ КРИСТАЛЬНОЕ ЯДРО...", "en": "UNSEALING CRYSTAL VAULT...", "es": "ABRIENDO NÚCLEO DE CRISTAL...", "de": "KRISTALLKERN WIRD GEÖFFNET...", "fr": "OUVERTURE DU NOYAU CRISTAL...",
		"pt": "ABRINDO NÚCLEO DE CRISTAL...", "zh": "正在解封水晶秘匣...", "ja": "クリスタルコア開封中...", "ko": "크리스탈 코어 봉인 해제 중...", "tr": "KRİSTAL ÇEKİRDEK AÇILIYOR...",
	},
	"pack_ceremony_click": {
		"ru": "НАЖМИТЕ НА КАРТУ ДЛЯ РАСКРЫТИЯ — ИЛИ «РАСКРЫТЬ ВСЕ»",
		"en": "CLICK EACH CARD TO REVEAL — OR PRESS REVEAL ALL",
		"es": "HAZ CLIC EN CADA CARTA O PULSA REVELAR TODO",
		"de": "KARTEN ANKLICKEN ZUM AUFDECKEN ODER ALLE AUFDECKEN",
		"fr": "CLIQUEZ SUR CHAQUE CARTE OU TOUT RÉVÉLER",
		"pt": "CLIQUE EM CADA CARTA OU EM REVELAR TUDO",
		"zh": "点击每张卡牌逐一揭晓 — 或点击“全部揭晓”",
		"ja": "カードをクリックして開示 — または「すべて開示」",
		"ko": "카드를 클릭해 공개하거나 '모두 공개'를 누르세요",
		"tr": "AÇMAK İÇİN KARTLARA TIKLAYIN VEYA TÜMÜNÜ AÇIN",
	},
	"pack_ceremony_done": {
		"ru": "ПАК ОТКРЫТ! ВСЕ КАРТЫ ДОБАВЛЕНЫ В КОЛЛЕКЦИЮ",
		"en": "PACK COMPLETE! CARDS ADDED TO YOUR ROSTER",
		"es": "¡SOBRE COMPLETADO! CARTAS AÑADIDAS",
		"de": "PACK GEÖFFNET! KARTEN ZUR SAMMLUNG HINZUGEFÜGT",
		"fr": "PACK TERMINÉ ! CARTES AJOUTÉES À LA COLLECTION",
		"pt": "PACOTE CONCLUÍDO! CARTAS ADICIONADAS",
		"zh": "开包完成！所有卡牌已收录至舰队名册",
		"ja": "開封完了！カードがコレクションに追加されました",
		"ko": "개봉 완료! 모든 카드가 컬렉션에 추가되었습니다",
		"tr": "PAKET AÇILDI! KARTLAR KOLEKSİYONA EKLENDİ",
	},
	"reveal_all": {
		"ru": "РАСКРЫТЬ ВСЕ", "en": "REVEAL ALL", "es": "REVELAR TODO", "de": "ALLE AUFDECKEN", "fr": "TOUT RÉVÉLER",
		"pt": "REVELAR TUDO", "zh": "全部揭晓", "ja": "すべて開示", "ko": "모두 공개", "tr": "TÜMÜNÜ AÇ",
	},
	"collect_continue": {
		"ru": "ЗАБРАТЬ И ПРОДОЛЖИТЬ", "en": "COLLECT & CONTINUE", "es": "RECOGER Y CONTINUAR", "de": "SAMMELN & WEITER", "fr": "COLLECTER ET CONTINUER",
		"pt": "COLETAR E CONTINUAR", "zh": "收下并继续", "ja": "受け取って続ける", "ko": "수령 및 계속", "tr": "TOPLA VE DEVAM ET",
	},
	"new_card_tag": {
		"ru": "◆ НОВЫЙ БОЕЦ ОТКРЫТ!", "en": "◆ NEW FIGHTER UNLOCKED!", "es": "◆ ¡NUEVO TRIPULANTE!", "de": "◆ NEUER CREW-SPEZIALIST!", "fr": "◆ NOUVEAU SPÉCIALISTE !",
		"pt": "◆ NOVO TRIPULANTE!", "zh": "◆ 新船员解锁！", "ja": "◆ 新クルー解放！", "ko": "◆ 신규 크루 해금!", "tr": "◆ YENİ MÜRETTEBAT AÇILDI!",
	},
	"dup_card_tag": {
		"ru": "ДУБЛИКАТ  +%d КР", "en": "DUPLICATE  +%d CR", "es": "DUPLICADA  +%d CR", "de": "DUPLIKAT  +%d CR", "fr": "DOUBLON  +%d CR",
		"pt": "DUPLICADA  +%d CR", "zh": "重复折算 +%d CR", "ja": "重複ボーナス +%d CR", "ko": "중복 보너스 +%d CR", "tr": "KOPYA +%d KR",
	},
	"upg_slot_title": {
		"ru": "СЛОТ ПРОТОКОЛА #%d", "en": "PROTOCOL SLOT #%d", "es": "RANURA #%d", "de": "PROTOKOLL-PLATZ #%d", "fr": "EMPLACEMENT #%d",
		"pt": "ESPAÇO #%d", "zh": "协议插槽 #%d", "ja": "プロトコル枠 #%d", "ko": "프로토콜 슬롯 #%d", "tr": "PROTOKOL YUVASI #%d",
	},
	"empty_slot": {
		"ru": "[ СВОБОДНЫЙ СЛОТ ]", "en": "[ EMPTY SLOT ]", "es": "[ RANURA VACÍA ]", "de": "[ LEERER PLATZ ]", "fr": "[ EMPLACEMENT VIDE ]",
		"pt": "[ ESPAÇO VAZIO ]", "zh": "[ 空置插槽 ]", "ja": "[ 空きスロット ]", "ko": "[ 빈 슬롯 ]", "tr": "[ BOŞ YUVA ]",
	},
	"unlock_4th_slot": {
		"ru": "ОТКРЫТЬ 4-Й СЛОТ (%d КР)", "en": "UNLOCK 4TH SLOT (%d CR)", "es": "ABRIR 4.ª RANURA (%d CR)", "de": "4. PLATZ FREISCHALTEN (%d CR)", "fr": "DÉBLOQUER 4E SLOT (%d CR)",
		"pt": "LIBERAR 4º ESPAÇO (%d CR)", "zh": "解锁第4槽 (%d CR)", "ja": "第4枠を解放 (%d CR)", "ko": "4번 슬롯 해금 (%d CR)", "tr": "4. YUVAYI AÇ (%d KR)",
	},
	"unlock_4th_slot_both": {
		"ru": "ОТКРЫТЬ (%d КР + %d КРИСТ)", "en": "UNLOCK (%d CR + %d CRY)", "es": "ABRIR (%d CR + %d CRI)", "de": "FREISCHALTEN (%d CR + %d KRI)", "fr": "OUVRIR (%d CR + %d CRI)",
		"pt": "ABRIR (%d CR + %d CRI)", "zh": "解锁 (%d CR + %d 水晶)", "ja": "解放 (%d CR + %d CRY)", "ko": "해금 (%d CR + %d CRY)", "tr": "AÇ (%d KR + %d KRİ)",
	},
	"upg_protocols_hdr": {
		"ru": "ПРОТОКОЛЫ ЯДРА УЛУЧШЕНИЙ (18 ТЕХНОЛОГИЙ  •  АКТИВНО СЛОТОВ: %d / %d)",
		"en": "UPGRADE CORE PROTOCOLS (18 TECHNOLOGIES  •  ACTIVE SLOTS: %d / %d)",
		"es": "PROTOCOLOS DEL NÚCLEO (18 TECNOLOGÍAS  •  RANURAS ACTIVAS: %d / %d)",
		"de": "UPGRADE-KERNPROTOKOLLE (18 TECHNOLOGIEN  •  AKTIVE PLÄTZE: %d / %d)",
		"fr": "PROTOCOLES DU CŒUR (18 TECHNOLOGIES  •  SLOTS ACTIFS : %d / %d)",
		"pt": "PROTOCOLOS DO NÚCLEO (18 TECNOLOGIAS  •  ESPAÇOS ATIVOS: %d / %d)",
		"zh": "核心升级协议（18  •  已启用插槽：%d / %d）",
		"ja": "アップグレード核プロトコル（18  •  有効枠: %d / %d）",
		"ko": "코어 강화 프로토콜 (총 18종 기술  •  활성 슬롯: %d / %d)",
		"tr": "ÇEKİRDEK PROTOKOLLERİ (18 TEKNOLOJİ  •  AKTİF YUVA: %d / %d)",
	},
	"upg_modules_hdr": {
		"ru": "МОДЕРНИЗАЦИЯ УСТАНОВЛЕННЫХ МОДУЛЕЙ КОРАБЛЯ (УРОВНИ 1–5)",
		"en": "INSTALLED SHIP HARDWARE UPGRADES (LEVELS 1–5)",
		"es": "MEJORA DE MÓDULOS INSTALADOS EN LA NAVE (NIVELES 1–5)",
		"de": "INSTALLIERTE SCHIFFSMODULE VERBESSERN (STUFEN 1–5)",
		"fr": "AMÉLIORATION DES MODULES INSTALLÉS DU VAISSEAU (NIVEAUX 1–5)",
		"pt": "MELHORIA DOS MÓDULOS INSTALADOS NA NAVE (NÍVEIS 1–5)",
		"zh": "已安装装备强化升级（Lv.1 – Lv.5）",
		"ja": "装着済みモジュールの強化（Lv.1〜5）",
		"ko": "장착된 모듈 강화 업그레이드 (Lv.1~5)",
		"tr": "GEMİYE KURULU MODÜL GELİŞTİRMELERİ (SEVİYE 1–5)",
	},
	"upg_no_modules_hint": {
		"ru": "На корабле пока нет улучшаемых модулей — пристыкуйте двигатели, лазеры, орудия или радар в 3D-конструкторе!",
		"en": "No upgradeable hardware installed yet — attach engines, mining lasers, weapons, or radar in the 3D bay!",
		"es": "Aún no hay módulos mejorables instalados: acopla motores, láseres o armas en el hangar 3D.",
		"de": "Noch keine aufrüstbaren Module installiert — baue Triebwerke, Laser oder Waffen im 3D-Hangar an!",
		"fr": "Aucun module améliorable installé — fixez moteurs, lasers ou armes dans le hangar 3D !",
		"pt": "Nenhum módulo melhorável instalado — acople motores, lasers ou armas no hangar 3D!",
		"zh": "船体未安装可强化装备——请在 3D 机库拼接装备！",
		"ja": "装着済みモジュールなし — 3D格納庫で装備を接続します！",
		"ko": "장착된 모듈 없음 — 3D 격납고에서 장비를 부착하세요!",
		"tr": "Henüz geliştirilebilir modül takılı değil — 3D hangarda motor, lazer veya silah ekleyin!",
	},
	"slot_5_hint": {
		"ru": "Редкий дроп 1.0% в Кристальных паках", "en": "Rare 1.0% drop from Crystal Packs", "es": "1.0% de probabilidad en sobres", "de": "Seltene 1,0%-Chance in Packs", "fr": "1,0 % de chance dans les packs",
		"pt": "1,0% de chance nos pacotes", "zh": "开启水晶卡包有 1.0% 概率掉落", "ja": "クリスタルパックから1.0%で出現", "ko": "크리스탈 팩에서 1.0% 확률로 획득", "tr": "Kristal Paketlerden %1,0 şansla çıkar",
	},
	"equip_btn": {
		"ru": "АКТИВИРОВАТЬ", "en": "ACTIVATE", "es": "ACTIVAR", "de": "AKTIVIEREN", "fr": "ACTIVER",
		"pt": "ATIVAR", "zh": "启用协议", "ja": "有効化", "ko": "활성화", "tr": "ETKİNLEŞTİR",
	},
	"unequip_btn": {
		"ru": "ОТКЛЮЧИТЬ", "en": "DEACTIVATE", "es": "DESACTIVAR", "de": "DEAKTIVIEREN", "fr": "DÉSACTIVER",
		"pt": "DESATIVAR", "zh": "卸下协议", "ja": "解除", "ko": "해제", "tr": "DEVRE DIŞI",
	},
	"ach_minute": {
		"ru": "Минутные (5)", "en": "Minute (5)", "es": "Minuto (5)", "de": "Minütlich (5)", "fr": "Minute (5)",
		"pt": "Minuto (5)", "zh": "每分钟 (5)", "ja": "毎分任務 (5)", "ko": "분간 임무 (5)", "tr": "Dakikalık (5)",
	},
	"ach_hourly": {
		"ru": "Часовые (3)", "en": "Hourly (3)", "es": "Por hora (3)", "de": "Stündlich (3)", "fr": "Horaire (3)",
		"pt": "Por Hora (3)", "zh": "每小时 (3)", "ja": "毎時任務 (3)", "ko": "시간 임무 (3)", "tr": "Saatlik (3)",
	},
	"ach_daily": {
		"ru": "Ежедневные (7)", "en": "Daily (7)", "es": "Diarios (7)", "de": "Täglich (7)", "fr": "Quotidien (7)",
		"pt": "Diárias (7)", "zh": "每日 (7)", "ja": "デイリー (7)", "ko": "일일 임무 (7)", "tr": "Günlük (7)",
	},
	"ach_weekly": {
		"ru": "Недельные (15)", "en": "Weekly (15)", "es": "Semanales (15)", "de": "Wöchentlich (15)", "fr": "Hebdo (15)",
		"pt": "Semanais (15)", "zh": "每周 (15)", "ja": "ウィークリー (15)", "ko": "주간 임무 (15)", "tr": "Haftalık (15)",
	},
	"ach_timer": {
		"ru": "До обновления UTC: %s  •  В альбоме открыто: %d карт",
		"en": "UTC Reset in: %s  •  Album Collected: %d Cards",
		"es": "Reinicio UTC en: %s  •  Álbum: %d Cartas",
		"de": "UTC-Reset in: %s  •  Album: %d Karten",
		"fr": "Réinit. UTC dans : %s  •  Album : %d Cartes",
		"pt": "Reinício UTC em: %s  •  Álbum: %d Cartas",
		"zh": "UTC 刷新倒计时：%s  •  图鉴已收录：%d 张",
		"ja": "UTC更新まで: %s • アルバム収集: %d 枚",
		"ko": "UTC 초기화까지: %s • 앨범 수집: %d 장",
		"tr": "UTC Yenilenme: %s  •  Albüm: %d Kart",
	},
	"claim_crystals": {
		"ru": "ЗАБРАТЬ +%d КРИСТ", "en": "CLAIM +%d CRY", "es": "RECLAMAR +%d CRI", "de": "ABHOLEN +%d KRI", "fr": "RÉCLAMER +%d CRI",
		"pt": "RESGATAR +%d CRI", "zh": "领取 +%d 水晶", "ja": "+%d クリスタル受取", "ko": "+%d 크리스탈 수령", "tr": "+%d KRİSTAL AL",
	},
	"claimed_check": {
		"ru": "ПОЛУЧЕНО ◈", "en": "CLAIMED ◈", "es": "RECLAMADO ◈", "de": "ABGEHOLT ◈", "fr": "RÉCLAMÉ ◈",
		"pt": "RESGATADO ◈", "zh": "已领取 ◈", "ja": "受取済み ◈", "ko": "수령 완료 ◈", "tr": "ALINDI ◈",
	},
	"in_progress": {
		"ru": "ВЫПОЛНЯЕТСЯ (+%d КРИСТ)", "en": "IN PROGRESS (+%d CRY)", "es": "EN CURSO (+%d CRI)", "de": "AKTIV (+%d KRI)", "fr": "EN COURS (+%d CRI)",
		"pt": "EM PROGRESSO (+%d CRI)", "zh": "进行中 (+%d 水晶)", "ja": "進行中 (+%d クリスタル)", "ko": "진행 중 (+%d 크리스탈)", "tr": "DEVAM EDİYOR (+%d KRİ)",
	},
	"cargo_refinery_status": {
		"ru": "Трюм руды: %d / %d ед.   •   Стоимость переработки: %d КР",
		"en": "Cargo Hold: %d / %d u   •   Refinery Smelt Value: %d CR",
		"es": "Bodega: %d / %d u   •   Valor en refinería: %d CR",
		"de": "Frachtraum: %d / %d E   •   Raffinerie-Wert: %d CR",
		"fr": "Soute : %d / %d u   •   Valeur de raffinage : %d CR",
		"pt": "Porão: %d / %d u   •   Valor na refinaria: %d CR",
		"zh": "矿石货舱：%d / %d 单位   •   精炼出售价值：%d CR",
		"ja": "鉱石カーゴ: %d / %d u   •   精錬売却額: %d CR",
		"ko": "광물 화물칸: %d / %d u   •   정제 판매 가치: %d CR",
		"tr": "Kargo: %d / %d br   •   Rafineri Değeri: %d KR",
	},
	"sell_cargo_btn": {
		"ru": "ПЕРЕРАБОТАТЬ И ПРОДАТЬ РУДУ (+%d КР)",
		"en": "SMELT & SELL ALL CARGO (+%d CR)",
		"es": "FUNDIR Y VENDER CARGA (+%d CR)",
		"de": "FRACHT EINSCHMELZEN & VERKAUFEN (+%d CR)",
		"fr": "RAFFINER ET VENDRE LA SOUTE (+%d CR)",
		"pt": "REFINAR E VENDER CARGA (+%d CR)",
		"zh": "精炼并出售全部矿石 (+%d CR)",
		"ja": "全鉱石を精錬・売却 (+%d CR)",
		"ko": "전체 광물 정제 및 판매 (+%d CR)",
		"tr": "KARGOYU İŞLE VE SAT (+%d KR)",
	},
	"launch_expedition_btn": {
		"ru": "ВЫЛЕТ В СЕКТОР ▶", "en": "LAUNCH EXPEDITION ▶", "es": "LANZAR EXPEDICIÓN ▶", "de": "EXPEDITION STARTEN ▶", "fr": "LANCER L'EXPÉDITION ▶",
		"pt": "LANÇAR EXPEDIÇÃO ▶", "zh": "出击该星区 ▶", "ja": "この宙域へ出撃 ▶", "ko": "이 섹터로 출격 ▶", "tr": "SEFERE ÇIK ▶",
	},
	"unlock_sector_btn": {
		"ru": "ОТКРЫТЬ СЕКТОР (%d КР • %d яч.)",
		"en": "UNLOCK SECTOR (%d CR • %d Cells)",
		"es": "DESBLOQUEAR (%d CR • %d Celdas)",
		"de": "FREISCHALTEN (%d CR • %d Zellen)",
		"fr": "DÉBLOQUER (%d CR • %d Cell.)",
		"pt": "DESBLOQUEAR (%d CR • %d Cél.)",
		"zh": "解锁星区 (%d CR • 需%d舱格)",
		"ja": "宙域解放 (%d CR • %dセル必要)",
		"ko": "섹터 해금 (%d CR • %d셀 필요)",
		"tr": "SEKTÖRÜ AÇ (%d KR • %d Hücre)",
	},
	"settings_language": {
		"ru": "Язык интерфейса / Language", "en": "Language / Язык", "es": "Idioma / Language", "de": "Sprache / Language", "fr": "Langue / Language",
		"pt": "Idioma / Language", "zh": "界面语言 / Language", "ja": "表示言語 / Language", "ko": "언어 / Language", "tr": "Oyun Dili / Language",
	},
	"settings_master_vol": {
		"ru": "Общая громкость", "en": "Master Volume", "es": "Volumen maestro", "de": "Gesamtlautstärke", "fr": "Volume principal",
		"pt": "Volume geral", "zh": "主音量", "ja": "マスター音量", "ko": "마스터 볼륨", "tr": "Ana Ses",
	},
	"settings_music_vol": {
		"ru": "Музыка и атмосфера", "en": "Ambient & Music", "es": "Música y ambiente", "de": "Musik & Atmosphäre", "fr": "Musique et ambiance",
		"pt": "Música e ambiente", "zh": "背景音乐与氛围", "ja": "BGM・環境音", "ko": "배경음 및 앰비언트", "tr": "Müzik ve Atmosfer",
	},
	"settings_sfx_vol": {
		"ru": "Звуковые эффекты", "en": "Sound Effects (SFX)", "es": "Efectos de sonido", "de": "Soundeffekte (SFX)", "fr": "Effets sonores",
		"pt": "Efeitos sonoros", "zh": "游戏音效 (SFX)", "ja": "効果音 (SFX)", "ko": "효과음 (SFX)", "tr": "Ses Efektleri",
	},
	"settings_mute": {
		"ru": "Отключить весь звук", "en": "Mute All Audio", "es": "Silenciar todo", "de": "Ton stummschalten", "fr": "Couper tout le son",
		"pt": "Silenciar tudo", "zh": "全部静音", "ja": "すべてミュート", "ko": "전체 음소거", "tr": "Tüm Sesi Kapat",
	},
	"settings_cam_sens": {
		"ru": "Чувствительность прицела и камеры", "en": "Camera & Aim Sensitivity", "es": "Sensibilidad de cámara", "de": "Kamera-Empfindlichkeit", "fr": "Sensibilité caméra",
		"pt": "Sensibilidade da câmera", "zh": "镜头与瞄准灵敏度", "ja": "カメラ・照準感度", "ko": "카메라 및 조준 감도", "tr": "Kamera Hassasiyeti",
	},
	"settings_gfx": {
		"ru": "Качество 3D-графики:", "en": "3D Graphics Quality:", "es": "Calidad gráfica 3D:", "de": "3D-Grafikqualität:", "fr": "Qualité graphique 3D :",
		"pt": "Qualidade gráfica 3D:", "zh": "3D 画面品质：", "ja": "3Dグラフィック品質:", "ko": "3D 그래픽 품질:", "tr": "3B Grafik Kalitesi:",
	},
	"settings_fullscreen": {
		"ru": "Полноэкранный режим", "en": "Fullscreen Mode", "es": "Pantalla completa", "de": "Vollbildmodus", "fr": "Mode plein écran",
		"pt": "Tela cheia", "zh": "全屏显示模式", "ja": "フルスクリーン表示", "ko": "전체 화면 모드", "tr": "Tam Ekran Modu",
	},
	"settings_reduced_motion": {
		"ru": "Уменьшить тряску экрана и вспышки", "en": "Reduced Screen Shake & Flashes", "es": "Reducir vibración de pantalla", "de": "Weniger Kamerawackeln", "fr": "Réduire les secousses d'écran",
		"pt": "Reduzir tremor de tela", "zh": "减弱屏幕震动与闪光", "ja": "画面揺れ・フラッシュ軽減", "ko": "화면 흔들림 감소", "tr": "Ekran Sarsıntısını Azalt",
	},
	"settings_grp_display": {
		"ru": "ГРАФИКА И ЭКРАН",
		"en": "DISPLAY & SCREEN",
		"es": "PANTALLA",
		"de": "ANZEIGE & BILDSCHIRM",
		"fr": "AFFICHAGE & ÉCRAN",
		"pt": "TELA & VÍDEO",
		"zh": "画面显示",
		"ja": "ディスプレイ",
		"ko": "화면 설정",
		"tr": "EKRAN",
	},
	"settings_grp_audio": {
		"ru": "ЗВУК",
		"en": "AUDIO",
		"es": "AUDIO",
		"de": "AUDIO",
		"fr": "SON",
		"pt": "ÁUDIO",
		"zh": "声音",
		"ja": "サウンド",
		"ko": "소리",
		"tr": "SES",
	},
	"settings_grp_flight": {
		"ru": "ПИЛОТИРОВАНИЕ",
		"en": "FLIGHT CONTROLS",
		"es": "VUELO",
		"de": "FLUGSTEUERUNG",
		"fr": "COMMANDES DE VOL",
		"pt": "VOO",
		"zh": "飞行控制",
		"ja": "飛行操作",
		"ko": "비행 조작",
		"tr": "UÇUŞ KONTROLLERİ",
	},
	"settings_grp_hud": {
		"ru": "ИНТЕРФЕЙС ПИЛОТА",
		"en": "PILOT HUD",
		"es": "HUD DE PILOTO",
		"de": "Piloten-HUD",
		"fr": "HUD PILOTE",
		"pt": "HUD DO PILOTO",
		"zh": "飞行员界面",
		"ja": "コックピット表示",
		"ko": "조종석 표시",
		"tr": "UÇUŞ EKRANI",
	},
	"settings_grp_data": {
		"ru": "ДАННЫЕ И ЯЗЫК",
		"en": "DATA & LANGUAGE",
		"es": "DATOS E IDIOMA",
		"de": "DATEN & SPRACHE",
		"fr": "DONNÉES & LANGUE",
		"pt": "DADOS & IDIOMA",
		"zh": "数据与语言",
		"ja": "データと言語",
		"ko": "데이터 및 언어",
		"tr": "VERİ & DİL",
	},
	"settings_ui_scale": {
		"ru": "МАСШТАБ ИНТЕРФЕЙСА",
		"en": "UI SCALE",
		"es": "ESCALA DE INTERFAZ",
		"de": "BENUTZEROBERFLÄCHE",
		"fr": "ÉCHELLE DE L'INTERFACE",
		"pt": "ESCALA DA INTERFACE",
		"zh": "界面缩放",
		"ja": "UI拡大率",
		"ko": "인터페이스 배율",
		"tr": "ARAYÜZ ÖLÇEĞİ",
	},
	"settings_fov": {
		"ru": "ПОЛЕ ЗРЕНИЯ (FOV)",
		"en": "FIELD OF VIEW (FOV)",
		"es": "CAMPO DE VISIÓN",
		"de": "SICHTFELD (FOV)",
		"fr": "CHAMP DE VISION (FOV)",
		"pt": "CAMPO DE VISÃO",
		"zh": "视野范围",
		"ja": "視野角",
		"ko": "시야각",
		"tr": "GÖRÜŞ ALANI",
	},
	"settings_fps_cap": {
		"ru": "ОГРАНИЧЕНИЕ КАДРОВ/С",
		"en": "FRAME RATE LIMIT",
		"es": "LÍMITE DE FPS",
		"de": "BILDRATENLIMIT",
		"fr": "LIMITE DE FRÉQUENCE",
		"pt": "LIMITE DE FPS",
		"zh": "帧率上限",
		"ja": "フレームレート制限",
		"ko": "프레임 한도",
		"tr": "KARE HIZI SINIRI",
	},
	"settings_vsync": {
		"ru": "ВЕРТИКАЛЬНАЯ СИНХРОНИЗАЦИЯ",
		"en": "V-SYNC",
		"es": "V-SYNC",
		"de": "V-SYNC",
		"fr": "SYNCHRONISATION VERTICALE",
		"pt": "SINCRONISMO VERTICAL",
		"zh": "垂直同步",
		"ja": "垂直同期",
		"ko": "수직 동기화",
		"tr": "V-SYNC",
	},
	"settings_invert_y": {
		"ru": "ИНВЕРСИЯ ОСИ ТАНГАЖА",
		"en": "INVERT PITCH AXIS",
		"es": "INVERTIR CABECEO",
		"de": "NICKACHSE UMKEHREN",
		"fr": "INVERTIR L'ASSE DE TANGAGE",
		"pt": "INVERTIR ARFAGEM",
		"zh": "反转俯仰轴",
		"ja": "ピッチ反転",
		"ko": "피치 반전",
		"tr": "PİKS EKSİNİ TERS ÇEVİR",
	},
	"settings_crosshair": {
		"ru": "ЯРКОСТЬ ПРИЦЕЛА",
		"en": "CROSSHAIR OPACITY",
		"es": "OPACIDAD DE MIRA",
		"de": "VISIERDECKUNG",
		"fr": "OPACITÉ DU RÉTICULE",
		"pt": "OPACIDADE DA MIRA",
		"zh": "准星不透明度",
		"ja": "照準の濃度",
		"ko": "조준선 농도",
		"tr": "NİŞANGAH ŞEFFAFLIĞI",
	},
	"settings_shake": {
		"ru": "ТРЯСКА КАБИНЫ",
		"en": "COCKPIT SHAKE",
		"es": "VIBRACIÓN DE CABINA",
		"de": "COCKPITERSCHÜTTERUNG",
		"fr": "SECOUES DU COCKPIT",
		"pt": "TREPIDAÇÃO DA CABINE",
		"zh": "座舱震动",
		"ja": "コックピット振動",
		"ko": "조종석 흔들림",
		"tr": "KOKPİT SARSINTISI",
	},
	"settings_hud_bars": {
		"ru": "ПАНЕЛЬ РЕСУРСОВ",
		"en": "RESOURCE BAR PANEL",
		"es": "PANEL DE RECURSOS",
		"de": "RESSOURCENLEISTE",
		"fr": "PANNEAU DE RESSOURCES",
		"pt": "PAINEL DE RECURSOS",
		"zh": "资源面板",
		"ja": "リソースバー",
		"ko": "자원 표시줄",
		"tr": "KAYNAK ÇUBUĞU",
	},
	"settings_ach_toasts": {
		"ru": "УВЕДОМЛЕНИЯ О НАГРАДАХ",
		"en": "ACHIEVEMENT POPUPS",
		"es": "AVISOS DE LOGROS",
		"de": "ERFOLGSMELDUNGEN",
		"fr": "NOTIFS DE SUCCÈS",
		"pt": "AVISOS DE CONQUISTAS",
		"zh": "成就通知",
		"ja": "実績ポップアップ",
		"ko": "업적 알림",
		"tr": "BAŞARI UYARILARI",
	},
	"settings_autosave": {
		"ru": "АВТОСОХРАНЕНИЕ",
		"en": "AUTO-SAVE",
		"es": "GUARDADO AUTOMÁTICO",
		"de": "AUTOMATISCH SPEICHERN",
		"fr": "SAUVEGARDE AUTO",
		"pt": "SALVAMENTO AUTOMÁTICO",
		"zh": "自动保存",
		"ja": "オートセーブ",
		"ko": "자동 저장",
		"tr": "OTO KAYDETME",
	},
	"settings_reset_save": {
		"ru": "СБРОС ПРОГРЕССА",
		"en": "RESET PROGRESS",
		"es": "REINICIAR PROGRESO",
		"de": "FORTSCHRITT ZURÜCKSETZEN",
		"fr": "RÉINITIALISER LA PARTIE",
		"pt": "REDEFINIR PROGRESSO",
		"zh": "重置进度",
		"ja": "進行度をリセット",
		"ko": "진행 초기화",
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
		"ru": "ПОДТВЕРДИТЬ СБРОС",
		"en": "CONFIRM RESET",
		"es": "CONFIRMAR",
		"de": "ZURÜCKSETZEN BESTÄTIGEN",
		"fr": "CONFIRMER",
		"pt": "CONFIRMAR",
		"zh": "确认重置",
		"ja": "リセット確定",
		"ko": "초기화 확인",
		"tr": "SIFIRLAMAYI ONAYLA",
	},
	"settings_done_reset": {
		"ru": "Прогресс сброшен.",
		"en": "Progress reset.",
		"es": "Progreso reiniciado.",
		"de": "Fortschritt zurückgesetzt.",
		"fr": "Progression réinitialisée.",
		"pt": "Progresso redefinido.",
		"zh": "进度已重置。",
		"ja": "進行度をリセットしました。",
		"ko": "진행 상황을 초기화했습니다.",
		"tr": "İlerleme sıfırlandı.",
	},
	"hud_hull": {
		"ru": "КОРПУС", "en": "HULL", "es": "CASCO", "de": "HÜLLE", "fr": "COQUE",
		"pt": "CASCO", "zh": "装甲", "ja": "船体", "ko": "선체", "tr": "GÖVDE",
	},
	"hud_shield": {
		"ru": "ЩИТ", "en": "SHIELD", "es": "ESCUDO", "de": "SCHILD", "fr": "BOUCLIER",
		"pt": "ESCUDO", "zh": "护盾", "ja": "シールド", "ko": "실드", "tr": "KALKAN",
	},
	"hud_energy": {
		"ru": "ЭНЕРГИЯ", "en": "ENERGY", "es": "ENERGÍA", "de": "ENERGIE", "fr": "ÉNERGIE",
		"pt": "ENERGIA", "zh": "能量", "ja": "電力", "ko": "에너지", "tr": "ENERJİ",
	},
	"hud_heat": {
		"ru": "НАГРЕВ", "en": "HEAT", "es": "CALOR", "de": "HITZE", "fr": "CHALEUR",
		"pt": "CALOR", "zh": "热量", "ja": "熱量", "ko": "열량", "tr": "ISI",
	},
	"hud_cargo": {
		"ru": "ТРЮМ: %d/%d ед. (%.0f т)  •  КР: %d",
		"en": "CARGO: %d/%d u (%.0f t)  •  CR: %d",
		"es": "CARGA: %d/%d u (%.0f t)  •  CR: %d",
		"de": "FRACHT: %d/%d E (%.0f t)  •  CR: %d",
		"fr": "SOUTE : %d/%d u (%.0f t)  •  CR : %d",
		"pt": "CARGA: %d/%d u (%.0f t)  •  CR: %d",
		"zh": "货舱: %d/%d (%.0f吨) • 信用点: %d",
		"ja": "カーゴ: %d/%d u (%.0ft) • CR: %d",
		"ko": "화물: %d/%d u (%.0ft) • CR: %d",
		"tr": "KARGO: %d/%d br (%.0ft) • KR: %d",
	},
	"hud_mag_radar": {
		"ru": "  •  МАГ-РАДАР: %.0fм", "en": "  •  MAG-RADAR: %.0fm", "es": "  •  MAG-RADAR: %.0fm", "de": "  •  MAG-RADAR: %.0fm", "fr": "  •  RADAR-MAG : %.0fm",
		"pt": "  •  MAG-RADAR: %.0fm", "zh": "  •  磁力制导: %.0f米", "ja": "  •  磁気誘導: %.0fm", "ko": "  •  자력 유도: %.0fm", "tr": "  •  MAG-RADAR: %.0fm",
	},
	"storm_warning": {
		"ru": "▲ РАЗРЯД ПЛАЗМЕННОГО ШТОРМА! ▲", "en": "▲ PLASMA STORM DISCHARGE! ▲", "es": "▲ ¡TORMENTA DE PLASMA! ▲", "de": "▲ PLASMASTURM-ENTLADUNG! ▲", "fr": "▲ DÉCHARGE DE TEMPÊTE PLASMA ! ▲",
		"pt": "▲ DESCARGA DE PLASMA! ▲", "zh": "▲ 等离子风暴电弧来袭！ ▲", "ja": "▲ プラズマストーム放電警報！ ▲", "ko": "▲ 플라즈마 폭풍 방전 경보! ▲", "tr": "▲ PLAZMA FIRTINASI DEŞARJI! ▲",
	},
	"emergency_tow": {
		"ru": "АВАРИЙНАЯ ЭВАКУАЦИЯ — КОРАБЛЬ ДОСТАВЛЕН В АНГАР",
		"en": "EMERGENCY TOW COMPLETE — HULL RECOVERED TO HANGAR",
		"es": "REMOLQUE DE EMERGENCIA — NAVE RECUPERADA EN HANGAR",
		"de": "NOTBERGUNG ABGESCHLOSSEN — ZURÜCK IM HANGAR",
		"fr": "REMORQUAGE D'URGENCE — VAISSEAU RÉCUPÉRÉ AU HANGAR",
		"pt": "REBOQUE DE EMERGÊNCIA — NAVE RECUPERADA NO HANGAR",
		"zh": "紧急救援完成 — 舰体已拖回轨道机库修复",
		"ja": "緊急曳航完了 — 船体をハンガーへ回収しました",
		"ko": "긴급 예인 완료 — 함선이 격납고로 회수되었습니다",
		"tr": "ACİL ÇEKİCİ TAMAMLANDI — GEMİ HANGARA KURTARILDI",
	},
	# --- v2.2.0 reactor load governor + sector market ---
	"hud_reactor": {"ru": "РЕАКТОР", "en": "REACTOR", "es": "REACTOR", "de": "REAKTOR", "fr": "RÉACTEUR", "pt": "REATOR", "zh": "反应堆", "ja": "リアクター", "ko": "원자로", "tr": "REAKTÖR"},
	"hud_brownout": {"ru": "ПРОСАДКА", "en": "BROWN-OUT", "es": "CAÍDA", "de": "SPANABFALL", "fr": "CHUTE", "pt": "QUEDA", "zh": "降压", "ja": "電圧降下", "ko": "전압 강하", "tr": "GERİLİM DÜŞÜŞÜ"},
	"pwr_title": {"ru": "РАСПРЕДЕЛЕНИЕ НАГРУЗКИ РЕАКТОРА", "en": "REACTOR LOAD ALLOCATION", "es": "ASIGNACIÓN DE CARGA DEL REACTOR", "de": "REAKTORLASTVERTEILUNG", "fr": "RÉPARTITION DE CHARGE DU RÉACTEUR", "pt": "ALOCAÇÃO DE CARGA DO REATOR", "zh": "反应堆负载分配", "ja": "リアクター負荷配分", "ko": "원자로 부하 배분", "tr": "REAKTÖR YÜK DAĞILIMI"},
	"pwr_hint": {
		"ru": "Каждая подсистема получает долю непрерывной мощности реактора. Превышение бюджета снижает скорость бурения и темп турелей; при просадке конденсатора добыча и орудия отключаются первыми.",
		"en": "Each subsystem gets a share of continuous reactor output. Exceeding its budget slows the mining beam and stretches turret cycles; when the capacitor collapses, mining and guns shed first.",
		"es": "Cada subsistema recibe una parte de la potencia continua del reactor. Superar su presupuesto ralentiza el rayo minero y los ciclos de las torretas.",
		"de": "Jedes Subsystem erhält einen Anteil der Dauerleistung des Reaktors. Über dem Budget sinken Bohrleistung und Turmataktrate; bei Ausfall fallen Bergbau und Geschütze zuerst weg.",
		"fr": "Chaque sous-système reçoit une part de la puissance continue du réacteur. Au-delà du budget, foreuse et tourelles ralentissent ; en cas de chute, ils sont délestés en premier.",
		"pt": "Cada subsistema recebe uma parte da potência contínua do reator. Acima do orçamento, o raio de mineração e as torres perdem ritmo; na queda, são os primeiros a serem desligados.",
		"zh": "每个子系统获得反应堆持续输出功率的一份配额；超支会降低采掘光束与炮塔射速，电容塌陷时采掘与武器最先被切除。",
		"ja": "各サブシステムはリアクターの連続出力の割り当てを受けます。予算超過では掘削ビームとターンの連射が遅くなり、コンデンサ低下では採掘と火器が最初に切断されます。",
		"ko": "각 하위 시스템은 원자로 연속 출력의 일부를 할당받습니다. 한도를 넘으면 채굴 빔과 포탑 연사가 느려지고, 커패시터가 떨어지면 채굴과 화기가 먼저 차단됩니다.",
		"tr": "Her alt sistem reaktörün sürekli gücünden bir pay alır. Bütçeyi aşmak madencilik ışınını ve taret döngülerini yavaşlatır; kapasitör düştüğünde ilk kesilen madencilik ve toplar olur.",
	},
	"pwr_balanced": {"ru": "СБАЛАНСИРОВАННЫЙ", "en": "BALANCED", "es": "EQUILIBRADO", "de": "AUSGEGLICHEN", "fr": "ÉQUILIBRÉ", "pt": "EQUILIBRADO", "zh": "均衡", "ja": "バランス", "ko": "균형", "tr": "DENGE"},
	"pwr_mine_focus": {"ru": "ДОБЫЧА", "en": "MINING FOCUS", "es": "FOCO DE MINERÍA", "de": "BERGBAUFOKUS", "fr": "FOCUS FOREUSE", "pt": "FOCO DE MINERAÇÃO", "zh": "采掘优先", "ja": "採掘優先", "ko": "채굴 우선", "tr": "MADENCİLİK ODAĞI"},
	"pwr_combat_focus": {"ru": "БОЙ", "en": "COMBAT FOCUS", "es": "FOCO DE COMBATE", "de": "KAMPFFOKUS", "fr": "FOCUS COMBAT", "pt": "FOCO DE COMBATE", "zh": "作战优先", "ja": "戦闘優先", "ko": "전투 우선", "tr": "ÇATIŞMA ODAĞI"},
	"pwr_sustain": {"ru": "ПОДДЕРЖАНИЕ", "en": "SUSTAIN", "es": "SOSTENIMIENTO", "de": "DAUERBETRIEB", "fr": "SOUTIEN", "pt": "SUSTENTAÇÃO", "zh": "持续运作", "ja": "持続運用", "ko": "지속 운용", "tr": "SÜRDÜRÜLEBİLİR"},
	"pwr_burst_drive": {"ru": "РЫВОК", "en": "BURST DRIVE", "es": "IMPULSO", "de": "SCHUBBURST", "fr": "PUSH RAPIDE", "pt": "IMPULSO", "zh": "急加速", "ja": "加速バースト", "ko": "순간 가속", "tr": "ANİ İVMENME"},
	"pwr_share": {"ru": "БУР %d%% · ОРУДИЯ %d%% · ДВИГАТЕЛИ %d%% · РЕМОНТ %d%%", "en": "BEAM %d%% · GUNS %d%% · ENGINES %d%% · REPAIR %d%%", "es": "RAYO %d%% · CAÑONES %d%% · MOTORES %d%% · REPARACIÓN %d%%", "de": "STRAHL %d%% · GESCHÜTZE %d%% · TRIEBWERKE %d%% · REPARATUR %d%%", "fr": "RAYON %d%% · CANONS %d%% · MOTEURS %d%% · RÉPARATION %d%%", "pt": "RAIO %d%% · CANHÕES %d%% · MOTORES %d%% · REPARO %d%%", "zh": "光束 %d%% · 火炮 %d%% · 引擎 %d%% · 维修 %d%%", "ja": "ビーム %d%% · 砲 %d%% · エンジン %d%% · 修復 %d%%", "ko": "빔 %d%% · 포 %d%% · 엔진 %d%% · 수리 %d%%", "tr": "IŞIN %d%% · TOP %d%% · MOTOR %d%% · ONARIM %d%%"},
	"pwr_applied": {"ru": "ПРОФИЛЬ ПИТАНИЯ: %s", "en": "POWER PROFILE: %s", "es": "PERFIL DE ENERGÍA: %s", "de": "ENERGIEPROFIL: %s", "fr": "PROFIL D'ÉNERGIE : %s", "pt": "PERFIL DE ENERGIA: %s", "zh": "电力配置：%s", "ja": "電力プロファイル: %s", "ko": "전원 프로파일: %s", "tr": "GÜÇ PROFİLİ: %s"},
	"mkt_title": {"ru": "РЫНОК СЕКТОРА", "en": "SECTOR MARKET", "es": "MERCADO DEL SECTOR", "de": "SEKTORMARKT", "fr": "MARCHÉ DU SECTEUR", "pt": "MERCADO DO SETOR", "zh": "星区市场", "ja": "セクター市場", "ko": "구역 시장", "tr": "SEKTÖR PAZARI"},
	"mkt_hint": {
		"ru": "Индексы пересчитываются в 00:00 UTC. Продажа идёт по ценам выбранного сектора.",
		"en": "Indices re-price at 00:00 UTC. Cargo sells at the selected sector's rates.",
		"es": "Los índices se recalculan a las 00:00 UTC. La carga se vende al precio del sector elegido.",
		"de": "Indizes werden um 00:00 UTC neu bewertet. Ladung wird zum Preis des gewählten Sektors verkauft.",
		"fr": "Les indices sont recalculés à 00:00 UTC. Le fret se vend aux taux du secteur choisi.",
		"pt": "Os índices são recalculados às 00:00 UTC. A carga é vendida pelos preços do setor escolhido.",
		"zh": "指数在每日 00:00 UTC 重新定价；货物按所选星区的行情出售。",
		"ja": "指数は毎日 00:00 UTC に再計算され、貨物は選択したセクターの相場売却されます。",
		"ko": "지수는 매일 00:00 UTC에 갱신되며 화물은 선택한 구역 시세로 매도됩니다.",
		"tr": "Endeksler 00:00 UTC'de yeniden fiyatlanır; yük seçilen sektör fiyatlarından satılır.",
	},
	"mkt_sell_into": {"ru": "ПРОДАЖА ПО РЫНКУ: %s", "en": "SELLING INTO: %s", "es": "VENTA EN: %s", "de": "VERKAUF IN: %s", "fr": "VENTE : %s", "pt": "VENDA EM: %s", "zh": "出售市场：%s", "ja": "売却先: %s", "ko": "매도 시장: %s", "tr": "SATIŞ PAZARI: %s"},
	"mkt_col_base": {"ru": "БАЗА", "en": "BASE", "es": "BASE", "de": "BASIS", "fr": "BASE", "pt": "BASE", "zh": "基准", "ja": "基準", "ko": "기준", "tr": "TABAN"},
	"mkt_col_price": {"ru": "ЦЕНА", "en": "PRICE", "es": "PRECIO", "de": "PREIS", "fr": "PRIX", "pt": "PREÇO", "zh": "价格", "ja": "価格", "ko": "가격", "tr": "FİYAT"},
	"mkt_col_mineral": {"ru": "МИНЕРАЛ", "en": "MINERAL", "es": "MINERAL", "de": "MINERAL", "fr": "MINÉRAL", "pt": "MINERAL", "zh": "矿物", "ja": "鉱物", "ko": "광물", "tr": "MİNERAL"},
	"mkt_col_index": {"ru": "ИНДЕКС", "en": "INDEX", "es": "ÍNDICE", "de": "INDEX", "fr": "INDICE", "pt": "ÍNDICE", "zh": "指数", "ja": "指数", "ko": "지수", "tr": "ENDEKS"},
	"cargo_spill": {"ru": "ГРУЗ РАССЫПАН: %d ед.", "en": "CARGO SPILLED: %d UNITS", "es": "CARGA DERRAMADA: %d UNIDADES", "de": "LADUNG VERLOREN: %d EINHEITEN", "fr": "FRET RÉPANDU : %d UNITÉS", "pt": "CARGA DERRAMADA: %d UNIDADES", "zh": "货物散落：%d 单位", "ja": "貨物が流出：%d 個", "ko": "화물 유실: %d 단위", "tr": "YÜK DÖKÜLDÜ: %d BİRİM"},
}

const CATEGORIES: Dictionary = {
	"All": {"ru": "Все", "en": "All", "es": "Todos", "de": "Alle", "fr": "Tous", "pt": "Todos", "zh": "全部", "ja": "すべて", "ko": "전체", "tr": "Tümü"},
	"Core": {"ru": "Ядро", "en": "Core", "es": "Núcleo", "de": "Kern", "fr": "Cœur", "pt": "Núcleo", "zh": "核心", "ja": "コア", "ko": "코어", "tr": "Çekirdek"},
	"Structure": {"ru": "Корпус", "en": "Structure", "es": "Estructura", "de": "Struktur", "fr": "Structure", "pt": "Estrutura", "zh": "结构", "ja": "構造", "ko": "구조", "tr": "Yapı"},
	"Propulsion": {"ru": "Двигатели", "en": "Propulsion", "es": "Propulsión", "de": "Antrieb", "fr": "Propulsion", "pt": "Propulsão", "zh": "推进", "ja": "推進", "ko": "추진", "tr": "İtki"},
	"Mining": {"ru": "Добыча", "en": "Mining", "es": "Minería", "de": "Bergbau", "fr": "Minage", "pt": "Mineração", "zh": "采矿", "ja": "採掘", "ko": "채굴", "tr": "Madencilik"},
	"Collection": {"ru": "Сбор руды", "en": "Collection", "es": "Recolección", "de": "Sammler", "fr": "Collecte", "pt": "Coleta", "zh": "收集", "ja": "回収", "ko": "수집", "tr": "Toplama"},
	"Weapons": {"ru": "Оружие", "en": "Weapons", "es": "Armas", "de": "Waffen", "fr": "Armes", "pt": "Armas", "zh": "武器", "ja": "兵器", "ko": "무기", "tr": "Silahlar"},
	"Defense": {"ru": "Защита", "en": "Defense", "es": "Defensa", "de": "Abwehr", "fr": "Défense", "pt": "Defesa", "zh": "防御", "ja": "防衛", "ko": "방어", "tr": "Savunma"},
	"Utility": {"ru": "Системы", "en": "Utility", "es": "Sistemas", "de": "Systeme", "fr": "Systèmes", "pt": "Sistemas", "zh": "辅助系统", "ja": "補助装置", "ko": "유틸리티", "tr": "Sistemler"},
}

const RARITIES: Dictionary = {
	"Common": {"ru": "Обычная", "en": "Common", "es": "Común", "de": "Gewöhnlich", "fr": "Commune", "pt": "Comum", "zh": "普通", "ja": "コモン", "ko": "일반", "tr": "Sıradan"},
	"Uncommon": {"ru": "Необычная", "en": "Uncommon", "es": "Poco común", "de": "Ungewöhnlich", "fr": "Peu commune", "pt": "Incomum", "zh": "优秀", "ja": "アンコモン", "ko": "고급", "tr": "Gelişmiş"},
	"Rare": {"ru": "Редкая", "en": "Rare", "es": "Rara", "de": "Selten", "fr": "Rare", "pt": "Rara", "zh": "稀有", "ja": "レア", "ko": "희귀", "tr": "Nadir"},
	"Epic": {"ru": "Эпическая", "en": "Epic", "es": "Épica", "de": "Episch", "fr": "Épique", "pt": "Épica", "zh": "史诗", "ja": "エピック", "ko": "영웅", "tr": "Epik"},
	"Legendary": {"ru": "Легендарная", "en": "Legendary", "es": "Legendaria", "de": "Legendär", "fr": "Légendaire", "pt": "Lendária", "zh": "传说", "ja": "レジェンダリー", "ko": "전설", "tr": "Efsanevi"},
	"Mythic": {"ru": "Мифическая", "en": "Mythic", "es": "Mítica", "de": "Mythisch", "fr": "Mythique", "pt": "Mítica", "zh": "神话", "ja": "ミシック", "ko": "신화", "tr": "Mitik"},
	"Secret": {"ru": "Секретная", "en": "Secret", "es": "Secreta", "de": "Geheim", "fr": "Secrète", "pt": "Secreta", "zh": "秘藏", "ja": "シークレット", "ko": "시크릿", "tr": "Gizli"},
}

const FOIL_NAMES: Dictionary = {
	"plain": {"ru": "Стандартное", "en": "Standard Print", "es": "Estándar", "de": "Standarddruck", "fr": "Tirage standard", "pt": "Padrão", "zh": "普通印刷", "ja": "通常版", "ko": "일반 인쇄", "tr": "Standart Baskı"},
	"silver": {"ru": "Серебрение", "en": "Silvered", "es": "Plateada", "de": "Versilbert", "fr": "Argentée", "pt": "Prateada", "zh": "银色镀层", "ja": "シルバー加工", "ko": "실버 도금", "tr": "Gümüş Kaplama"},
	"holo": {"ru": "Голография", "en": "Holographic", "es": "Holográfica", "de": "Holografisch", "fr": "Holographique", "pt": "Holográfica", "zh": "全息闪膜", "ja": "ホログラム", "ko": "홀로그램", "tr": "Holografik"},
	"glitter": {"ru": "Блёстки", "en": "Glitter Foil", "es": "Glitter", "de": "Glitzer-Folie", "fr": "Pailletée", "pt": "Glitter", "zh": "闪粉箔膜", "ja": "グリッター", "ko": "글리터 호일", "tr": "Simli Folyo"},
	"glow": {"ru": "Свечение", "en": "Luminous", "es": "Luminosa", "de": "Leuchtend", "fr": "Luminescente", "pt": "Luminosa", "zh": "夜光涂层", "ja": "発光加工", "ko": "야광 코팅", "tr": "Işıklı Kaplama"},
}

const FOIL_EFFECTS: Dictionary = {
	"plain": {"ru": "Без бонусов покрытия", "en": "No finish bonus", "es": "Sin bonus de acabado", "de": "Kein Finish-Bonus", "fr": "Aucun bonus de finition", "pt": "Sem bônus de acabamento", "zh": "无涂层加成", "ja": "加工ボーナスなし", "ko": "코팅 보너스 없음", "tr": "Kaplama bonusu yok"},
	"silver": {"ru": "+15% к бонусам карты, +4% к цене руды", "en": "+15% card bonuses, +4% ore price", "es": "+15% bonos, +4% precio mineral", "de": "+15% Kartenboni, +4% Erzpreis", "fr": "+15% bonus carte, +4% prix minerai", "pt": "+15% bônus, +4% preço do minério", "zh": "卡牌加成 +15%，矿石售价 +4%", "ja": "カード報酬 +15%、鉱石価格 +4%", "ko": "카드 보너스 +15%, 광물 가격 +4%", "tr": "+15% kart bonusu, +4% cevher fiyatı"},
	"holo": {"ru": "+25% к бонусам карты, +6% к дальности радара", "en": "+25% card bonuses, +6% radar range", "es": "+25% bonos, +6% alcance de radar", "de": "+25% Kartenboni, +6% Radarsicht", "fr": "+25% bonus carte, +6% portée radar", "pt": "+25% bônus, +6% alcance de radar", "zh": "卡牌加成 +25%，雷达距离 +6%", "ja": "カード報酬 +25%、レーダー範囲 +6%", "ko": "카드 보너스 +25%, 레이더 범위 +6%", "tr": "+25% kart bonusu, +6% radar menzili"},
	"glitter": {"ru": "+40% к бонусам карты, +5% к авторемонту", "en": "+40% card bonuses, +5% auto-repair", "es": "+40% bonos, +5% auto-reparación", "de": "+40% Kartenboni, +5% Autoreparatur", "fr": "+40% bonus carte, +5% autoréparation", "pt": "+40% bônus, +5% autorreparo", "zh": "卡牌加成 +40%，自动维修 +5%", "ja": "カード報酬 +40%、自動修復 +5%", "ko": "카드 보너스 +40%, 자동 수리 +5%", "tr": "+40% kart bonusu, +5% oto-onarım"},
	"glow": {"ru": "+60% к бонусам, +8% к цене руды, +6% к авторемонту", "en": "+60% bonuses, +8% ore price, +6% repair", "es": "+60% bonos, +8% precio, +6% reparación", "de": "+60% Boni, +8% Erzpreis, +6% Reparatur", "fr": "+60% bonus, +8% prix minerai, +6% réparation", "pt": "+60% bônus, +8% preço, +6% reparo", "zh": "加成 +60%，矿石售价 +8%，维修 +6%", "ja": "報酬 +60%、鉱石価格 +8%、修復 +6%", "ko": "보너스 +60%, 광물 가격 +8%, 수리 +6%", "tr": "+60% bonus, +8% cevher fiyatı, +6% onarım"},
}

const ROLES: Dictionary = {
	"Miner": {"ru": "Шахтёр", "en": "Miner", "es": "Minero", "de": "Bergmann", "fr": "Mineur", "pt": "Minerador", "zh": "采矿师", "ja": "マイナー", "ko": "채굴사", "tr": "Madenci"},
	"Pilot": {"ru": "Пилот", "en": "Pilot", "es": "Piloto", "de": "Pilot", "fr": "Pilote", "pt": "Piloto", "zh": "王牌飞行员", "ja": "パイロット", "ko": "파일럿", "tr": "Pilot"},
	"Engineer": {"ru": "Инженер", "en": "Engineer", "es": "Ingeniero", "de": "Ingenieur", "fr": "Ingénieur", "pt": "Engenheiro", "zh": "轮机工程师", "ja": "エンジニア", "ko": "엔지니어", "tr": "Mühendis"},
	"Gunner": {"ru": "Стрелок", "en": "Gunner", "es": "Artillero", "de": "Kanonier", "fr": "Artilleur", "pt": "Artilheiro", "zh": "火控炮手", "ja": "ガンナー", "ko": "포수", "tr": "Topçu"},
	"Collector": {"ru": "Сборщик", "en": "Collector", "es": "Recolector", "de": "Sammler", "fr": "Collecteur", "pt": "Coletor", "zh": "牵引专家", "ja": "コレクター", "ko": "수집가", "tr": "Toplayıcı"},
	"Navigator": {"ru": "Штурман", "en": "Navigator", "es": "Navegante", "de": "Navigator", "fr": "Navigateur", "pt": "Navegador", "zh": "领航员", "ja": "ナビゲーター", "ko": "항해사", "tr": "Rotacı"},
	"Scientist": {"ru": "Учёный", "en": "Scientist", "es": "Científico", "de": "Forscher", "fr": "Scientifique", "pt": "Cientista", "zh": "天体科学家", "ja": "科学者", "ko": "과학자", "tr": "Bilim İnsanı"},
	"Commander": {"ru": "Командор", "en": "Commander", "es": "Comandante", "de": "Kommandant", "fr": "Commandant", "pt": "Comandante", "zh": "舰队指挥官", "ja": "コマンダー", "ko": "사령관", "tr": "Komutan"},
}

const RESOURCES_LOC: Dictionary = {
	"iron": {"ru": "Ферритное железо", "en": "Ferrite Iron", "es": "Hierro ferrita", "de": "Ferrit-Eisen", "fr": "Fer ferrite", "pt": "Ferro ferrita", "zh": "铁氧矿石", "ja": "フェライト鉄", "ko": "페라이트 철", "tr": "Ferrit Demiri"},
	"titanium": {"ru": "Звёздный титан", "en": "Star Titanium", "es": "Titanio estelar", "de": "Sternentitan", "fr": "Titane stellaire", "pt": "Titânio estelar", "zh": "星辰钛合金", "ja": "スターチタン", "ko": "스타 티타늄", "tr": "Yıldız Titanyumu"},
	"crystal": {"ru": "Кристалл туманности", "en": "Nebula Crystal", "es": "Cristal nebular", "de": "Nebelkristall", "fr": "Cristal nébulaire", "pt": "Cristal nebular", "zh": "星云棱晶", "ja": "ネビュラ結晶", "ko": "성운 크리스탈", "tr": "Bulutsu Kristali"},
	"plasma_core": {"ru": "Сгущённая плазма", "en": "Condensed Plasma", "es": "Plasma condensado", "de": "Kondensplasma", "fr": "Plasma condensé", "pt": "Plasma condensado", "zh": "凝聚等离子核", "ja": "凝縮プラズマ", "ko": "응축 플라즈마", "tr": "Yoğun Plazma"},
	"void_iridium": {"ru": "Иридий Бездны", "en": "Void Iridium", "es": "Iridio del Vacío", "de": "Leeren-Iridium", "fr": "Iridium du Vide", "pt": "Irídio do Vazio", "zh": "虚空铱晶", "ja": "ヴォイドイリジウム", "ko": "보이드 이리듐", "tr": "Hiçlik İridyumu"},
}

const MODULES_RU: Dictionary = {
	"cockpit_mk1": ["Командный мостик Mk1", "Бронированная кабина управления с жизнеобеспечением, стартовым реактором и трюмом на 40 ед."],
	"hull_cell": ["Силовая ячейка корпуса", "Укреплённый титановый блок пространственной рамы с 6 точками крепления оборудования."],
	"engine_basic": ["Ионный двигатель Mk1", "Надёжный маршевый ионный ускоритель с системой стабилизации и маневровыми соплами."],
	"mining_basic": ["Базовый буровой лазер", "Двухлучевой промышленный термальный излучатель для раскола железных и силикатных пород."],
	"mining_advanced": ["Продвинутый буровой лазер", "Поворотная двухствольная оптическая установка с охлаждением и увеличенной дальностью."],
	"plasma_drill": ["Плазменный бур", "Сверхгорячий индукционный излучатель, плавящий плотную руду и кристаллические геоды (+20% добычи)."],
	"crystal_extractor": ["Гармонический экстрактор", "Резонансный призматический луч, сохраняющий хрупкие кристаллы (+40% выхода минералов)."],
	"heavy_mining_beam": ["Осадный мега-экскаватор", "Двухблочный осевой буровой комплекс, раскалывающий монолиты Бездны за секунды (+55% добычи)."],
	"magnet_basic": ["Магнитный сборщик", "Двухконтурное электромагнитное кольцо, притягивающее обломки руды прямо в трюм."],
	"magnet_advanced": ["Гравиметрическая антенна", "Трёхполюсная гравитационная тарелка для быстрого сбора минералов на средней дистанции."],
	"vacuum_collector": ["Вихревой вакуум-коллектор", "Высокопроизводительная подпространственная воронка для массового захвата руды."],
	"wide_collector": ["Дальний пилон притяжения", "Двухблочный тяговый комплекс, очищающий целые скопления астероидов от ценных минералов."],
	"machine_gun": ["Роторная автопушка", "Шестиствольная скорострельная турель, ведущая огонь вольфрамовыми кинетическими снарядами."],
	"laser_cannon": ["Импульсная лазерная турель", "Высокоточная турель мгновенного наведения со спаренными когерентными излучателями."],
	"plasma_cannon": ["Тяжёлый плазмомёт", "Выпускает сгустки перегретой плазмы, прожигающие энергощиты и тяжёлую броню дронов."],
	"rocket_launcher": ["Залповый ракетный блок", "Бронированная 6-трубная пусковая установка с фугасными ракетами площадного поражения."],
	"missile_battery": ["Батарея самонаводящихся ракет", "Вертикальная шахта умных ракет-перехватчиков с активным захватом манёвренных целей."],
	"railgun": ["Гиперскоростной рельсотрон", "Двухблочное электромагнитное орудие, пробивающее броню на колоссальной дистанции."],
	"shield_gen": ["Проектор щита «Эгида»", "Создаёт регенерирующий гексагональный энергобарьер против вражеского огня и молний шторма."],
	"armor_plate": ["Реактивная композитная броня", "Сверхплотная наклонная бронеплита с огромным запасом прочности и -8% урона по всему корпусу."],
	"repair_module": ["Нано-ремонтный отсек", "Выпускает рой ремонтных нанитов, непрерывно восстанавливающих обшивку в полёте."],
	"defense_drone_bay": ["Ангар боевых дронов", "Запускает орбитального 3D-дрона прикрытия, который атакует врагов вокруг вашего корабля."],
	"magnetic_radar": ["Магнитный радар наведения", "Намагничивает все ваши пули и снаряды — в полёте они сами доворачивают прямо во врагов!"],
	"radar": ["Тактический радар дальнего обзора", "Вращающаяся параболическая антенна, расширяющая обзор угроз и повышающая шанс крит. попадания."],
	"resource_scanner": ["Спектрографический сканер руд", "Подсвечивает богатые жилы в 3D-пространстве и даёт +12% к шансу редких минералов."],
	"energy_generator": ["Термоядерный реактор «Токамак»", "Компактное тороидальное ядро синтеза: +52 МВт чистой мощности и +90 МДж ёмкости батарей."],
	"cargo_pod": ["Герметичный грузовой модуль", "Крупнотоннажный контейнер для минералов, увеличивающий вместимость трюма на +85 ед."],
	"thruster_booster": ["Векторный форсажный ускоритель", "Сдвоенные поворотные сопла высокой тяги для стремительного разгона и манёвренности."],
}

const CREW_BIOS_RU: Dictionary = {
	"crew_01": "Потомственный проходчик пояса с десятью тысячами часов работы в открытом космосе.",
	"crew_02": "Бывший пилот орбитальных курьерских челноков, мастер безупречных стыковок.",
	"crew_03": "Заставляет старые ионные коллекторы выдавать мощность сверх заводских пределов.",
	"crew_04": "Специалист зенитной обороны конвойных фрегатов Внешнего Кольца.",
	"crew_05": "Тонко настраивает гармоники тягового луча для захвата мельчайших осколков руды.",
	"crew_06": "Виртуоз плотной укладки руды даже в самых тесных грузовых отсеках.",
	"crew_07": "Находит богатейшие хондритовые жилы ещё до включения бурового лазера.",
	"crew_08": "Заваривает микротрещины обшивки сверхпрочными бор-углеродными заплатами.",
	"crew_09": "Ас астероидного слалома на ручных маневровых двигателях.",
	"crew_10": "Выбивает лучшие расценки на переработку руды на орбитальных станциях.",
	"crew_11": "Старший мастер глубинного плазменного бурения со станции Церера.",
	"crew_12": "Калибрует роторные автопушки до кучности снайперского выстрела без отдачи.",
	"crew_13": "Лётчик-испытатель экспериментальных двухконтурных векторных ускорителей.",
	"crew_14": "Автономный кибер-инженер, подключённый напрямую к телеметрии реактора.",
	"crew_15": "Ведёт двухфазное электромагнитное траление сквозь плотные поля обломков.",
	"crew_16": "Исследователь спектроскопии редких изотопов и кристаллических аномалий.",
	"crew_17": "Хладнокровный офицер мостика, мастер фаланговой фокусировки щитов.",
	"crew_18": "Прокладывает идеальные траектории даже с перегруженным трюмом.",
	"crew_19": "Вундеркинд гравитационного захвата, искривляющий локальную инерцию обломков.",
	"crew_20": "Прославленный охотник на пиратов с безупречным сопровождением целей.",
	"crew_21": "Раскалывает кристаллические геоды точно по природным линиям резонанса.",
	"crew_22": "Непобедимая гонщица, оседлавшая вихри Плазменного шторма.",
	"crew_23": "Управляет роями микро-сварщиков, чинящих броню прямо под вражеским огнём.",
	"crew_24": "Кристалло-геолог, чувствующий пульсацию редчайших жил туманности.",
	"crew_25": "Ветеран флотилии, укрепляющий гармоники дефлекторных щитов.",
	"crew_26": "Главный инженер эпического класса, выводящий «Токамак» на пик синтеза.",
	"crew_27": "Перегружает плазменные ускорители с сокрушительной точностью.",
	"crew_28": "Его модифицированные осадные лучи испаряют шлаковую броню за секунды.",
	"crew_29": "Кибер-ас со сверхчеловеческой реакцией, способный уйти от любой ракеты.",
	"crew_30": "Промышленный ИИ-комплекс, отбирающий каждый грамм драгоценных минералов.",
	"crew_31": "Пионер квантово-резонансного сканирования в эпицентре Плазменного шторма.",
	"crew_32": "Легендарный стрелок: нейроинтерфейс наведения утраивает огневую мощь корабля.",
	"crew_33": "Легендарный пилот, превращающий ионный выхлоп в релятивистский рывок.",
	"crew_34": "Живая легенда Глубокого Пояса — перед ним рассыпаются древние монолиты.",
	"crew_35": "Верховный стратег флота, дарующий кораблю несокрушимую защиту.",
	"crew_36": "Властелин энергии нулевой точки и сверхпроводящих контуров.",
	"crew_37": "Мифический шахтёр: гармоническая экстракция умножает добычу руды в пять раз!",
	"crew_38": "Мифический командор, разворачивающий непробиваемый бастионный щит.",
	"crew_39": "Повелитель парных сингулярных ядер наведения с дальнего рубежа галактики.",
	"crew_40": "Скользит по подпространственным потокам, невидимым для обычных сенсоров.",
	"crew_41": "Секретный учёный Бездны, раскрывший трансмутацию тёмной материи.",
	"crew_42": "Таинственное сознание Предтеч, пробуждающее древнюю мощь всех систем корабля.",
}

const UPGRADES_RU: Dictionary = {
	"upg_01": ["Форсированная линза луча", "+25% к мощности буровых лазеров"],
	"upg_02": ["Подпространственный пресс руды", "+35% к общей вместимости трюма"],
	"upg_03": ["Сверхпроводящие катушки", "+30% к регенерации энергии реактора"],
	"upg_04": ["Усилитель магнитного потока", "+35% к радиусу магнитного сбора"],
	"upg_05": ["Вольфрамовые подкалиберные ленты", "+28% к урону всего оружия"],
	"upg_06": ["Гармоническое реле щита", "+35% к ёмкости энергощита"],
	"upg_07": ["Крио-клапаны форсажа", "+24% к скорости полёта корабля"],
	"upg_08": ["Протокол плавильной очистки", "+30% к цене продажи минералов"],
	"upg_09": ["Глубинное спектро-сканирование", "+14% к шансу редких минералов"],
	"upg_10": ["Нанитный сшиватель обшивки", "+9 ед./с пассивного ремонта корпуса"],
	"upg_11": ["Гироскопические стабилизаторы", "+38% к манёвренности поворота"],
	"upg_12": ["Призматический расщепитель жил", "+40% к выходу руды из астероидов"],
	"upg_13": ["Импульсный блок конденсаторов", "+140 МДж к запасу энергии"],
	"upg_14": ["Форсаж зенитного огня", "+28% к скорострельности орудий"],
	"upg_15": ["Матрица реактивных переборок", "+45% к прочности модулей"],
	"upg_16": ["Квантовая тяговая сингулярность", "+65% к радиусу магнитного сбора"],
	"upg_17": ["Осадная прошивка излучателей", "+60% к мощности буровых лазеров"],
	"upg_18": ["Ядро Вершителя Галактики", "+30% ко всем боевым, буровым и защитным системам"],
}

const SECTORS_LOC: Dictionary = {
	"sector_1": {
		"ru": ["1. Пояс новичков", "Хондритовые астероиды • Низкая угроза", "Освещённый солнцем орбитальный карьер, богатый железом и титаном. Встречаются лишь лёгкие дроны-разведчики."],
		"es": ["1. Cinturón Inicial", "Asteroides comunes • Riesgo bajo", "Cantera orbital rica en hierro y titanio patrullada por drones exploradores."],
		"de": ["1. Startergürtel", "Gewöhnliche Asteroiden • Geringe Gefahr", "Sonniger Orbitalbruch reich an Eisen und Titan mit leichten Späherdrohnen."],
		"fr": ["1. Ceinture Initiale", "Astéroïdes communs • Risque faible", "Carrière orbitale riche en fer et titane patrouillée par des drones éclaireurs."],
		"pt": ["1. Cinturão Inicial", "Asteroides comuns • Risco baixo", "Pedreira orbital rica em ferro e titânio patrulhada por drones batedores."],
		"zh": ["1. 新手小行星带", "普通硅铁矿岩 • 低威胁空域", "阳光充沛的轨道采矿场，盛产铁氧矿与星辰钛，仅有少量侦察无人机巡逻。"],
		"ja": ["1. スターターベルト", "一般的な小惑星帯 • 危険度：低", "鉄とチタンが豊富な軌道採掘場。小型スカウトドローンのみ出現。"],
		"ko": ["1. 초보자 소행성대", "일반 규산염 소행성 • 낮은 위험도", "철과 티타늄이 풍부한 궤도 채굴장. 경량 정찰 드론만 출몰합니다."],
		"tr": ["1. Başlangıç Kuşağı", "Sıradan Asteroitler • Düşük Tehlike", "Demir ve titanyum açısından zengin yörünge ocağı. Hafif keşif dronları devriye gezer."],
	},
	"sector_2": {
		"ru": ["2. Кристальная туманность", "Светящиеся геоды • Пиратские рейдеры", "Призматическое облако ионизированного газа с чистейшими кристаллами под охраной рейдеров."],
		"es": ["2. Nebulosa Cristal", "Geodas luminosas • Corsarios", "Nube ionizada con cristales de alta pureza custodiada por incursores piratas."],
		"de": ["2. Kristallnebel", "Leuchtende Geoden • Piraten-Raider", "Ionisierte Gaswolke voller reiner Nebelkristalle und feindlicher Raider-Schiffe."],
		"fr": ["2. Nébuleuse Cristalline", "Géodes lumineuses • Pirates", "Nuage ionisé abritant des cristaux purs gardés par des pillards pirates."],
		"pt": ["2. Nebulosa de Cristal", "Geodos luminosos • Piratas", "Nuvem ionizada rica em cristais puros guardada por naves saqueadoras."],
		"zh": ["2. 棱晶星云", "发光晶洞群 • 海盗劫掠舰", "绚丽的电离星云内蕴藏着高纯度星云水晶，由侦察机与海盗战舰把守。"],
		"ja": ["2. クリスタル星雲", "発光ジオード群 • 海賊レイダー", "高純度ネビュラ結晶が眠る電離ガス雲。海賊襲撃艦が徘徊する宙域。"],
		"ko": ["2. 크리스탈 성운", "발광 정동석 군락 • 해적 약탈선", "고순도 성운 크리스탈이 매장된 이온 가스 구름입니다."],
		"tr": ["2. Kristal Bulutsusu", "Parlayan Jeotlar • Korsan Akıncılar", "Yüksek saflıkta kristaller barındıran iyonize bulutsu."],
	},
	"sector_3": {
		"ru": ["3. Кладбище кораблей", "Остовы флота • Тяжёлые бронедроны", "Разбитое поле древнего сражения из обломков грузовозов, титанового шлака и тяжёлых боевых дронов."],
		"es": ["3. Cementerio de Hierro", "Restos de flota • Drones pesados", "Antiguo campo de batalla repleto de restos metálicos y drones blindados."],
		"de": ["3. Eisenfriedhof", "Flottenwracks • Schwere Kampfdrohnen", "Trümmerfeld verlassener Frachter, bewacht von gepanzerten schweren Drohnen."],
		"fr": ["3. Cimetière de Fer", "Épaves de flotte • Drones lourds", "Champ de bataille dévasté peuplé de débris métalliques et de drones blindés."],
		"pt": ["3. Cemitério de Ferro", "Destroços de frota • Drones pesados", "Antigo campo de batalha repleto de destroços metálicos e drones blindados."],
		"zh": ["3. 钢铁舰冢", "废弃舰队残骸 • 重装战斗无人机", "遍布巨型货舰残骸与富钛熔渣的古战场，游荡着极具攻击性的重装无人机。"],
		"ja": ["3. アイアン・グレイブヤード", "放棄艦隊の残骸 • 重装甲ドローン", "朽ちた輸送船の残骸と金属岩塊が漂う戦場跡。重武装ドローンが警戒中。"],
		"ko": ["3. 강철의 무덤", "폐함선 잔해 • 중장갑 드론", "파괴된 함선 잔해와 중장갑 자동화 드론이 도사리는 전장입니다."],
		"tr": ["3. Demir Mezarlığı", "Filo Enkazları • Ağır Zırhlı Dronlar", "Terk edilmiş yük gemileri ve ağır silahlı dronlarla dolu savaş alanı."],
	},
	"sector_4": {
		"ru": ["4. Плазменный шторм", "Электрические разряды • Сгущённая плазма", "Бушующий вихрь, где дуги молний бьют меж фульгуритовых шпилей и охотятся призрачные Плазменные охотники."],
		"es": ["4. Tormenta de Plasma", "Rayos eléctricos • Plasma condensado", "Vórtice sobrecargado con descargas eléctricas y letales Cazadores de Plasma."],
		"de": ["4. Plasmasturm", "Blitzentladungen • Kondensplasma", "Elektrischer Mahlstrom mit Fulgurit-Spitzen und getarnten Plasmajägern."],
		"fr": ["4. Tempête de Plasma", "Arcs électriques • Plasma condensé", "Maelström survolté où rôdent de redoutables Chasseurs à plasma."],
		"pt": ["4. Tempestade de Plasma", "Raios elétricos • Plasma condensado", "Turbilhão elétrico onde raios cruzam espirais e Caçadores de Plasma espreitam."],
		"zh": ["4. 等离子风暴眼", "闪电电弧灾害 • 凝聚等离子核", "狂暴的高能电磁漩涡，闪电在雷击石尖塔间跃动，潜伏着等离子猎杀舰。"],
		"ja": ["4. プラズマストーム", "落雷ハザード • 凝縮プラズマ", "稲妻が走る超高圧嵐域。ステルス型のプラズマハンターが獲物を狙う。"],
		"ko": ["4. 플라즈마 폭풍", "번개 방전 위험 • 응축 플라즈마", "번개가 몰아치는 폭풍 지대로 플라즈마 헌터가 암약합니다."],
		"tr": ["4. Plazma Fırtınası", "Yıldırım Tehlikesi • Yoğun Plazma", "Şimşeklerin çaktığı ve Plazma Avcılarının pusuda beklediği fırtına."],
	},
	"sector_5": {
		"ru": ["5. Рубеж Бездны", "Обсидиановые монолиты • Стражи Бездны", "Край изведанного космоса с бесценными монолитами Иридия Бездны под защитой дредноутов-Стражей."],
		"es": ["5. Frontera del Vacío", "Monolitos de obsidiana • Centinelas", "El confín del espacio con iridio del vacío defendido por acorazados Centinela."],
		"de": ["5. Leerengrenze", "Obsidian-Monolithen • Leerenwächter", "Am Rand des bekannten Raums ruht Leeren-Iridium, bewacht von Dreadnoughts."],
		"fr": ["5. Frontière du Vide", "Monolithes d'obsidienne • Sentinelles", "Aux confins de l'espace, de précieux monolithes défendus par les Sentinelles du Vide."],
		"pt": ["5. Fronteira do Vazio", "Monólitos de obsidiana • Sentinelas", "Nos confins do espaço, monólitos de irídio defendidos por encouraçados Sentinelas."],
		"zh": ["5. 虚空边境", "黑曜石巨碑 • 虚空守卫无畏舰", "已知星域的尽头，无价的虚空铱晶巨碑由巨型虚空守卫主力舰严密守护。"],
		"ja": ["5. ヴォイド・フロンティア", "黒曜石モノリス • ヴォイドセンチネル", "既知宇宙の果て。超弩級ヴォイドセンチネルが守護するイリジウム鉱脈。"],
		"ko": ["5. 보이드 프론티어", "흑요석 모놀리스 • 보이드 센티넬", "미지의 우주 끝자락, 드레드노트급 보이드 센티넬이 지키는 성역입니다."],
		"tr": ["5. Hiçlik Sınırı", "Obsidyen Monolitler • Hiçlik Muhafızları", "Bilinen uzayın ucunda paha biçilmez İridyum monolitleri."],
	},
}

const ACH_TITLES_RU: Dictionary = {
	"min_ast": ["Быстрый раскол", "Расколите ближайшие породы пояса."],
	"min_chunk": ["Магнитный трал", "Соберите разлетевшиеся осколки минералов."],
	"min_iron": ["Железная лихорадка", "Добудьте партию ферритного железа."],
	"min_dist": ["Прожиг сопел", "Совершите манёвренный перелёт в космосе."],
	"min_beam": ["Термальный рез", "Удерживайте буровой излучатель в работе."],
	"min_cred": ["Быстрая выручка", "Заработайте кредиты продажей руды или боем."],
	"min_drone": ["Зачистка периметра", "Нейтрализуйте вражеских разведчиков."],
	"hr_mine": ["Проходчик пояса", "Разработайте богатое скопление астероидов."],
	"hr_enemy": ["Патруль сектора", "Уничтожьте вражеские корабли в секторе."],
	"hr_res": ["Тяжёлый рудовоз", "Заполните грузовые отсеки ценной рудой."],
	"day_mine": ["Глубинный бурильщик", "Расколите сотню космических астероидов."],
	"day_cred": ["Орбитальный магнат", "Соберите внушительный капитал в вылетах."],
	"day_exp": ["Ветеран вылетов", "Совершите вылеты и благополучно вернитесь в ангар."],
	"day_upg": ["Главный модернизатор", "Улучшите установленные модули корабля."],
	"day_enemy": ["Охотник на корсаров", "Очистите рудные трассы от пиратов."],
	"day_pack": ["Призыв новобранцев", "Пополните коллекцию карт экипажа."],
	"day_sell": ["Контракт плавильни", "Переработайте добытые минералы в кредиты."],
	"wk_01": ["Титан пояса", "Промышленное разрушение астероидных полей."],
	"wk_02": ["Великий сокрушитель", "Обратите в пыль целые сектора астероидов."],
	"wk_03": ["Эскадрилья асов", "Завоюйте превосходство в космических боях."],
	"wk_04": ["Покоритель армад", "Разгромите пиратские флотилии и стражей."],
	"wk_05": ["Первопроходец пустоты", "Совершите серию дальних экспедиций."],
	"wk_06": ["Галактическая одиссея", "Мастер пятидесяти орбитальных вылетов."],
	"wk_07": ["Хартия фронтира", "Проложите путь в новый опасный сектор."],
	"wk_08": ["Архитектор корпуса", "Расширьте модульную конструкцию корабля."],
	"wk_09": ["Создатель дредноута", "Постройте исполинский флагманский корпус."],
	"wk_10": ["Коллекционер офицеров", "Соберите уникальных специалистов мостика."],
	"wk_11": ["Знаток ковчегов", "Вскройте серию галактических паков."],
	"wk_12": ["Мастер-инженер", "Доведите оборудование корабля до пика мощности."],
	"wk_13": ["Мега-транспортник", "Добудьте тысячи фрагментов минерального сырья."],
	"wk_14": ["Звёздный олигарх", "Накопите состояние на просторах галактики."],
	"wk_15": ["Межзвёздный странник", "Налетайте огромную дистанцию в открытом космосе."],
}

func _ready() -> void:
	# Russian is primary per user specification
	current_lang = "ru"

func set_language(lang_code: String, save_now: bool = true) -> void:
	var valid := false
	for item in SUPPORTED_LANGUAGES:
		if item["code"] == lang_code:
			valid = true
			break
	if not valid:
		lang_code = "ru"
	if current_lang == lang_code:
		return
	current_lang = lang_code
	language_changed.emit(current_lang)
	if save_now and has_node("/root/SaveManager"):
		SaveManager.save_game()

func get_language_index() -> int:
	for i in range(SUPPORTED_LANGUAGES.size()):
		if SUPPORTED_LANGUAGES[i]["code"] == current_lang:
			return i
	return 0

func tr_ui(key: String, args: Array = []) -> String:
	var entry: Dictionary = UI_STRINGS.get(key, {})
	var tmpl: String = str(entry.get(current_lang, entry.get("en", key)))
	if args.is_empty():
		return tmpl
	return tmpl % args

func cat_name(cat_id: String) -> String:
	var d: Dictionary = CATEGORIES.get(cat_id, {})
	return str(d.get(current_lang, d.get("en", cat_id)))

func rarity_name(rar: String) -> String:
	var d: Dictionary = RARITIES.get(rar, {})
	return str(d.get(current_lang, d.get("en", rar)))

func foil_name(fid: String) -> String:
	var d: Dictionary = FOIL_NAMES.get(fid, FOIL_NAMES["plain"])
	return str(d.get(current_lang, d.get("en", fid)))


func foil_effect(fid: String) -> String:
	var d: Dictionary = FOIL_EFFECTS.get(fid, FOIL_EFFECTS["plain"])
	return str(d.get(current_lang, d.get("en", "")))


func role_name(role_id: String) -> String:
	var d: Dictionary = ROLES.get(role_id, {})
	return str(d.get(current_lang, d.get("en", role_id)))

func resource_name(res_id: String) -> String:
	var d: Dictionary = RESOURCES_LOC.get(res_id, {})
	return str(d.get(current_lang, d.get("en", res_id)))

func pack_name(pack_id: String) -> String:
	return tr_ui("pack_elite_name" if pack_id == "elite" else "pack_standard_name")

func mod_name(mid: String) -> String:
	if current_lang == "ru" and MODULES_RU.has(mid):
		return str(MODULES_RU[mid][0])
	if GameData.modules.has(mid):
		var en_name := str(GameData.modules[mid]["name"])
		if current_lang == "en":
			return en_name
		return "%s [%s]" % [en_name, cat_name(str(GameData.modules[mid]["category"]))] if false else _translate_mod_name_fallback(mid, en_name)
	return mid

func mod_desc(mid: String) -> String:
	if current_lang == "ru" and MODULES_RU.has(mid):
		return str(MODULES_RU[mid][1])
	if GameData.modules.has(mid):
		if current_lang == "en":
			return str(GameData.modules[mid]["description"])
		return _build_dynamic_mod_desc(GameData.modules[mid])
	return ""

func _translate_mod_name_fallback(mid: String, en_name: String) -> String:
	var table: Dictionary = {
		"cockpit_mk1": {"es": "Cabina de Mando Mk1", "de": "Kommandocockpit Mk1", "fr": "Cockpit de Commande Mk1", "pt": "Cabine de Comando Mk1", "zh": "指挥座舱 Mk1", "ja": "コマンドコックピット Mk1", "ko": "지휘 콕핏 Mk1", "tr": "Komuta Kokpiti Mk1"},
		"hull_cell": {"es": "Celda Estructural", "de": "Struktur-Hüllenzelle", "fr": "Cellule de Coque", "pt": "Célula Estrutural", "zh": "强化船体舱格", "ja": "構造船体セル", "ko": "구조 선체 셀", "tr": "Yapısal Gövde Hücresi"},
		"engine_basic": {"es": "Propulsor Iónico Mk1", "de": "Ionentriebwerk Mk1", "fr": "Propulseur Ionique Mk1", "pt": "Propulsor Iônico Mk1", "zh": "离子推进器 Mk1", "ja": "イオンスラスター Mk1", "ko": "이온 추진기 Mk1", "tr": "İyon İticisi Mk1"},
		"mining_basic": {"es": "Láser Minero Básico", "de": "Basis-Bergbaulaser", "fr": "Laser Minier Basique", "pt": "Laser de Mineração Básico", "zh": "基础采矿激光", "ja": "基本採掘レーザー", "ko": "기본 채굴 레이저", "tr": "Temel Maden Lazeri"},
		"mining_advanced": {"es": "Láser Minero Avanzado", "de": "Erweiterter Bergbaulaser", "fr": "Laser Minier Avancé", "pt": "Laser Minero Avançado", "zh": "进阶双管采矿激光", "ja": "改良型採掘レーザー", "ko": "고급 채굴 레이저", "tr": "Gelişmiş Maden Lazeri"},
		"plasma_drill": {"es": "Taladro de Plasma", "de": "Plasmabohrer", "fr": "Foreuse à Plasma", "pt": "Broca de Plasma", "zh": "等离子熔岩钻", "ja": "プラズマボアドリル", "ko": "플라즈마 보어 드릴", "tr": "Plazma Delici"},
		"crystal_extractor": {"es": "Extractor Armónico", "de": "Harmonischer Extraktor", "fr": "Extracteur Harmonique", "pt": "Extrator Harmônico", "zh": "谐振棱晶提取器", "ja": "ハーモニック抽出機", "ko": "하모닉 크리스탈 추출기", "tr": "Harmonik Kristal Çıkarıcı"},
		"heavy_mining_beam": {"es": "Excavador Pesado", "de": "Belagerungs-Baggerlaser", "fr": "Excavateur de Siège", "pt": "Escavador de Cerco", "zh": "重型攻城采矿阵列", "ja": "重攻城採掘ビーム", "ko": "중형 공성 채굴 빔", "tr": "Ağır Kuşatma Kazıcısı"},
		"magnet_basic": {"es": "Colector Magnético", "de": "Magnetsammler", "fr": "Collecteur Magnétique", "pt": "Coletor Magnético", "zh": "电磁牵引收集器", "ja": "マグネットコレクター", "ko": "자기장 수집기", "tr": "Manyetik Toplayıcı"},
		"magnet_advanced": {"es": "Antena Gravimétrica", "de": "Gravimetrische Schüssel", "fr": "Antenne Gravimétrique", "pt": "Antena Gravimétrica", "zh": "重力波牵引盘", "ja": "重力トラクターディッシュ", "ko": "중력장 수집 디쉬", "tr": "Gravimetrik Çanak"},
		"vacuum_collector": {"es": "Matriz de Vacío", "de": "Vortex-Vakuumfeld", "fr": "Collecteur Vortex", "pt": "Matriz de Vácuo", "zh": "漩涡亚空间吸纳器", "ja": "ヴォルテックス吸引器", "ko": "보텍스 진공 수집기", "tr": "Girdap Vakum Dizisi"},
		"wide_collector": {"es": "Pilón Tractor Amplio", "de": "Weitbereichs-Traktor", "fr": "Pylône Tracteur Large", "pt": "Pilão Trator Amplo", "zh": "广域重型牵引塔", "ja": "広域トラクターパイロン", "ko": "광역 트랙터 파일런", "tr": "Geniş Menzilli Çekici"},
		"machine_gun": {"es": "Autocañón Rotativo", "de": "Rotations-Autokanone", "fr": "Autocanon Rotatif", "pt": "Autocanhão Rotativo", "zh": "六管加特林机炮", "ja": "ロータリー機関砲", "ko": "로터리 기관포", "tr": "Döner Otomatik Top"},
		"laser_cannon": {"es": "Torreta Láser de Pulso", "de": "Pulslaser-Geschütz", "fr": "Tourelle Laser Pulsé", "pt": "Torreta Laser de Pulso", "zh": "脉冲激光炮塔", "ja": "パルスレーザー砲塔", "ko": "펄스 레이저 포탑", "tr": "Darbeli Lazer Tareti"},
		"plasma_cannon": {"es": "Cañón de Plasma Pesado", "de": "Schwere Plasmakanone", "fr": "Canon à Plasma Lourd", "pt": "Canhão de Plasma Pesado", "zh": "重型等离子加速炮", "ja": "重プラズマキャノン", "ko": "중형 플라즈마 캐논", "tr": "Ağır Plazma Topu"},
		"rocket_launcher": {"es": "Lanzacohetes de Salva", "de": "Salven-Raketenwerfer", "fr": "Lance-Roquettes Salve", "pt": "Lança-Foguetes", "zh": "六联齐射火箭巢", "ja": "サルボロケットポッド", "ko": "다연장 로켓 포드", "tr": "Salvo Roketatar"},
		"missile_battery": {"es": "Batería de Misiles Guía", "de": "Suchraketen-Batterie", "fr": "Batterie de Missiles Guidés", "pt": "Bateria de Mísseis", "zh": "追踪导弹发射井", "ja": "シーカーミサイル砲台", "ko": "유도 미사일 포대", "tr": "Güdümlü Füze Bataryası"},
		"railgun": {"es": "Cañón de Riel Hiperveloz", "de": "Hypergeschwindigkeits-Railgun", "fr": "Canon Électromagnétique", "pt": "Canhão Elétrico Railgun", "zh": "超高速电磁轨道炮", "ja": "超高速レールガン", "ko": "초고속 레일건", "tr": "Hiperhızlı Railgun"},
		"shield_gen": {"es": "Proyector de Escudo Aegis", "de": "Aegis-Schildprojektor", "fr": "Bouclier Égide", "pt": "Projetor de Escudo Aegis", "zh": "神盾能量护盾发生器", "ja": "イージスシールド発生器", "ko": "이지스 실드 생성기", "tr": "Aegis Kalkan Projektörü"},
		"armor_plate": {"es": "Blindaje Reactivo", "de": "Reaktiv-Verbundpanzerung", "fr": "Blindage Réactif", "pt": "Blindagem Reativa", "zh": "反应复合装甲板", "ja": "リアクティブ複合装甲", "ko": "반응성 복합 장갑판", "tr": "Reaktif Kompozit Zırh"},
		"repair_module": {"es": "Bahía Nano-Reparadora", "de": "Nano-Reparaturbucht", "fr": "Baie Nano-Réparation", "pt": "Baía Nano-Reparo", "zh": "纳米自动维修舱", "ja": "ナノリペアベイ", "ko": "나노 수리 모듈", "tr": "Nano-Onarım Bölmesi"},
		"defense_drone_bay": {"es": "Bahía de Dron Defensivo", "de": "Kampfdrohnen-Bucht", "fr": "Baie de Drone Défensif", "pt": "Hangar de Drone", "zh": "自主护卫无人机舱", "ja": "自律防衛ドローンベイ", "ko": "자율 방어 드론 베이", "tr": "Otonom Dron Bölmesi"},
		"magnetic_radar": {"es": "Radar Magnético Guía", "de": "Magnet-Zielradar", "fr": "Radar Magnétique Guidé", "pt": "Radar Magnético Guia", "zh": "磁力自动制导雷达", "ja": "磁気ホーミングレーダー", "ko": "자력 자동유도 레이더", "tr": "Manyetik Güdüm Radarı"},
		"radar": {"es": "Radar Táctico Profundo", "de": "Tiefenraum-Taktikradar", "fr": "Radar Tactique Spatial", "pt": "Radar Tático Espacial", "zh": "深空战术雷达", "ja": "深宇宙戦術レーダー", "ko": "심우주 전술 레이더", "tr": "Derin Uzay Radarı"},
		"resource_scanner": {"es": "Escáner de Minerales", "de": "Erz-Spektralsensor", "fr": "Scanner de Minerais", "pt": "Scanner de Minérios", "zh": "光谱矿脉扫描仪", "ja": "分光鉱脈スキャナー", "ko": "분광 광물 스캐너", "tr": "Cevher Tarayıcı"},
		"energy_generator": {"es": "Reactor de Fusión Tokamak", "de": "Tokamak-Fusionsreaktor", "fr": "Réacteur à Fusion Tokamak", "pt": "Reator de Fusão Tokamak", "zh": "托卡马克聚变反应堆", "ja": "トカマク核融合炉", "ko": "토카막 핵융합 원자로", "tr": "Tokamak Füzyon Reaktörü"},
		"cargo_pod": {"es": "Módulo de Carga", "de": "Druck-Frachtkapsel", "fr": "Module de Soute", "pt": "Cápsula de Carga", "zh": "加压重型货舱", "ja": "加圧カーゴポッド", "ko": "가압 화물 포드", "tr": "Basınçlı Kargo Kapsülü"},
		"thruster_booster": {"es": "Impulsor Postcombustión", "de": "Vektor-Nachbrenner", "fr": "Postcombustion Vectorielle", "pt": "Propulsor Pós-Combustão", "zh": "矢量加力推进器", "ja": "ベクターアフターバーナー", "ko": "벡터 애프터버너 부스터", "tr": "Vektör Art Yakıcı"},
	}
	if table.has(mid) and table[mid].has(current_lang):
		return str(table[mid][current_lang])
	return en_name

func _build_dynamic_mod_desc(m: Dictionary) -> String:
	var parts: Array[String] = []
	parts.append("%s • HP %.0f • %.1ft" % [cat_name(str(m["category"])), float(m["max_hp"]), float(m["mass"])])
	if m.has("bullet_magnet_range"):
		parts.append("MAG %.0fm" % float(m["bullet_magnet_range"]))
	if m.has("mining_dps"):
		parts.append("Mining %.0f DPS" % float(m["mining_dps"]))
	if m.has("weapon_damage"):
		parts.append("DMG %.0f × %.1f/s" % [float(m["weapon_damage"]), float(m["fire_rate"])])
	if m.has("shield_cap"):
		parts.append("Shield +%.0f" % float(m["shield_cap"]))
	if m.has("magnet_range"):
		parts.append("Range %.0fm" % float(m["magnet_range"]))
	return "  |  ".join(parts)

func crew_bonus(card: Dictionary) -> String:
	var bt := str(card.get("buff_type", ""))
	var v := float(card.get("buff_value", 0.0))
	if current_lang == "en":
		return str(card.get("bonus_text", ""))
	var pct := int(round(v * 100.0))
	var bonus_templates: Dictionary = {
		"mining_mult": {"ru": "+%d%% к мощности бура", "es": "+%d%% potencia minera", "de": "+%d%% Bergbaustärke", "fr": "+%d%% puissance minière", "pt": "+%d%% poder de mineração", "zh": "+%d%% 采矿光束威力", "ja": "採掘レーザー威力 +%d%%", "ko": "채굴 빔 위력 +%d%%", "tr": "+%%%d Maden Gücü"},
		"speed_mult": {"ru": "+%d%% к скорости полёта", "es": "+%d%% velocidad", "de": "+%d%% Flugtempo", "fr": "+%d%% vitesse de vol", "pt": "+%d%% velocidade", "zh": "+%d%% 推进飞行速度", "ja": "推進飛行速度 +%d%%", "ko": "비행 추진 속도 +%d%%", "tr": "+%%%d Uçuş Hızı"},
		"energy_regen_mult": {"ru": "+%d%% регенерации энергии", "es": "+%d%% regen. energía", "de": "+%d%% Energieregen.", "fr": "+%d%% régén. énergie", "pt": "+%d%% regen. energia", "zh": "+%d%% 能量恢复速率", "ja": "エネルギー回復 +%d%%", "ko": "에너지 재생 +%d%%", "tr": "+%%%d Enerji Yenileme"},
		"damage_mult": {"ru": "+%d%% к урону оружия", "es": "+%d%% daño de armas", "de": "+%d%% Waffenschaden", "fr": "+%d%% dégâts d'armes", "pt": "+%d%% dano de armas", "zh": "+%d%% 武器伤害", "ja": "武器ダメージ +%d%%", "ko": "무기 피해량 +%d%%", "tr": "+%%%d Silah Hasarı"},
		"magnet_range_mult": {"ru": "+%d%% радиус магнита", "es": "+%d%% rango imán", "de": "+%d%% Magnetreichweite", "fr": "+%d%% portée aimant", "pt": "+%d%% alcance imã", "zh": "+%d%% 牵引磁力范围", "ja": "マグネット範囲 +%d%%", "ko": "자석 수집 반경 +%d%%", "tr": "+%%%d Mıknatıs Menzili"},
		"cargo_mult": {"ru": "+%d%% объём трюма", "es": "+%d%% capacidad carga", "de": "+%d%% Frachtraum", "fr": "+%d%% soute", "pt": "+%d%% carga", "zh": "+%d%% 货舱容量", "ja": "カーゴ容量 +%d%%", "ko": "화물칸 용량 +%d%%", "tr": "+%%%d Kargo Kapasitesi"},
		"loot_mult": {"ru": "+%d%% добычи руды", "es": "+%d%% botín mineral", "de": "+%d%% Erzausbeute", "fr": "+%d%% rendement minerai", "pt": "+%d%% extração mineral", "zh": "+%d%% 矿石产出量", "ja": "鉱石獲得量 +%d%%", "ko": "광물 채굴량 +%d%%", "tr": "+%%%d Cevher Verimi"},
		"hull_mult": {"ru": "+%d%% прочность корпуса", "es": "+%d%% salud módulos", "de": "+%d%% Modulstruktur", "fr": "+%d%% solidité coque", "pt": "+%d%% durabilidade", "zh": "+%d%% 舰体模块耐久", "ja": "船体モジュール耐久 +%d%%", "ko": "모듈 내구도 +%d%%", "tr": "+%%%d Gövde Dayanıklılığı"},
		"turn_mult": {"ru": "+%d%% манёвренность", "es": "+%d%% giro", "de": "+%d%% Wendigkeit", "fr": "+%d%% maniabilité", "pt": "+%d%% manobrabilidade", "zh": "+%d%% 转向机动性", "ja": "旋回機動性 +%d%%", "ko": "선회 기동성 +%d%%", "tr": "+%%%d Dönüş Çevikliği"},
		"credit_mult": {"ru": "+%d%% цена продажи руды", "es": "+%d%% valor venta", "de": "+%d%% Erz-Verkaufswert", "fr": "+%d%% prix de vente", "pt": "+%d%% valor de venda", "zh": "+%d%% 矿石售价", "ja": "鉱石売却額 +%d%%", "ko": "광물 판매가 +%d%%", "tr": "+%%%d Satış Değeri"},
		"rare_chance_add": {"ru": "+%d%% шанс редкой руды", "es": "+%d%% mineral raro", "de": "+%d%% Seltenerz-Chance", "fr": "+%d%% minerai rare", "pt": "+%d%% minério raro", "zh": "+%d%% 稀有矿石率", "ja": "希少鉱石確率 +%d%%", "ko": "희귀 광물 확률 +%d%%", "tr": "+%%%d Nadir Cevher"},
		"shield_mult": {"ru": "+%d%% ёмкость щита", "es": "+%d%% escudo", "de": "+%d%% Schildstärke", "fr": "+%d%% bouclier", "pt": "+%d%% escudo", "zh": "+%d%% 护盾容量", "ja": "シールド容量 +%d%%", "ko": "실드 용량 +%d%%", "tr": "+%%%d Kalkan Kapasitesi"},
		"all_stats_mult": {"ru": "+%d%% ко всем системам", "es": "+%d%% todos los sistemas", "de": "+%d%% alle Systeme", "fr": "+%d%% tous systèmes", "pt": "+%d%% todos sistemas", "zh": "+%d%% 全舰系统属性", "ja": "全艦システム +%d%%", "ko": "모든 함선 시스템 +%d%%", "tr": "+%%%d Tüm Sistemler"},
	}
	if bt == "repair_add":
		var rep_map := {"ru": "+%.0f ОЗ/с авто-ремонт", "es": "+%.0f HP/s reparación", "de": "+%.0f HP/s Reparatur", "fr": "+%.0f PV/s réparation", "pt": "+%.0f PV/s reparo", "zh": "+%.0f 耐久/秒 自动维修", "ja": "自動修復 +%.0f HP/秒", "ko": "자동 수리 +%.0f HP/초", "tr": "+%.0f CP/sn Onarım"}
		return str(rep_map.get(current_lang, "+%.0f HP/s")).replace("%.0f", "%.0f" % v)
	if bt == "damage_total_mult":
		var d_map := {"ru": "×%.1f урон всего оружия", "es": "×%.1f daño total", "de": "×%.1f Gesamtschaden", "fr": "×%.1f dégâts d'armes", "pt": "×%.1f dano total", "zh": "×%.1f 武器总伤害", "ja": "武器総ダメージ ×%.1f", "ko": "무기 총 피해량 ×%.1f", "tr": "×%.1f Silah Hasarı"}
		return str(d_map.get(current_lang, "x%.1f DMG")) % v
	if bt == "speed_total_mult":
		var s_map := {"ru": "×%.1f скорость корабля", "es": "×%.1f velocidad total", "de": "×%.1f Fluggeschwindigkeit", "fr": "×%.1f vitesse vaisseau", "pt": "×%.1f velocidade total", "zh": "×%.1f 飞船总航速", "ja": "艦船航行速度 ×%.1f", "ko": "함선 비행 속도 ×%.1f", "tr": "×%.1f Uçuş Hızı"}
		return str(s_map.get(current_lang, "x%.1f SPD")) % v
	if bt == "loot_total_mult":
		var l_map := {"ru": "×%.1f добыча ресурсов", "es": "×%.1f recursos minados", "de": "×%.1f Ressourcen-Beute", "fr": "×%.1f butin minier", "pt": "×%.1f recursos extraídos", "zh": "×%.1f 采矿总产出", "ja": "採掘資源獲得 ×%.1f", "ko": "채굴 자원 획득 ×%.1f", "tr": "×%.1f Maden Ganimeti"}
		return str(l_map.get(current_lang, "x%.1f Loot")) % v
	if bonus_templates.has(bt) and bonus_templates[bt].has(current_lang):
		return str(bonus_templates[bt][current_lang]) % pct
	return str(card.get("bonus_text", ""))

func crew_desc(card: Dictionary) -> String:
	var cid := str(card.get("id", ""))
	if current_lang == "ru" and CREW_BIOS_RU.has(cid):
		return str(CREW_BIOS_RU[cid])
	if current_lang == "en":
		return str(card.get("description", ""))
	return "%s • %s — %s" % [rarity_name(str(card.get("rarity", "Common"))), role_name(str(card.get("role", "Miner"))), crew_bonus(card)]

func upg_name(u: Dictionary) -> String:
	var uid := str(u.get("id", ""))
	if current_lang == "ru" and UPGRADES_RU.has(uid):
		return str(UPGRADES_RU[uid][0])
	if current_lang == "en":
		return str(u.get("name", uid))
	return "%s #%s" % [tr_ui("tab_upgrades"), uid.trim_prefix("upg_")]

func upg_effect(u: Dictionary) -> String:
	var uid := str(u.get("id", ""))
	if current_lang == "ru" and UPGRADES_RU.has(uid):
		return str(UPGRADES_RU[uid][1])
	if current_lang == "en":
		return str(u.get("effect_text", ""))
	var fake_card := {"buff_type": str(u.get("stat", "")), "buff_value": float(u.get("value", 0.0)), "bonus_text": str(u.get("effect_text", ""))}
	if fake_card["buff_type"] == "energy_cap_add":
		return "+%.0f MJ" % float(u.get("value", 0.0))
	if fake_card["buff_type"] == "fire_rate_mult":
		return "+%d%% Fire Rate" % int(round(float(u.get("value", 0.0)) * 100.0))
	return crew_bonus(fake_card)

func sector_name(sec: Dictionary) -> String:
	var sid := str(sec.get("id", ""))
	if current_lang != "en" and SECTORS_LOC.has(sid) and SECTORS_LOC[sid].has(current_lang):
		return str(SECTORS_LOC[sid][current_lang][0])
	return str(sec.get("name", ""))

func sector_sub(sec: Dictionary) -> String:
	var sid := str(sec.get("id", ""))
	if current_lang != "en" and SECTORS_LOC.has(sid) and SECTORS_LOC[sid].has(current_lang):
		return str(SECTORS_LOC[sid][current_lang][1])
	return str(sec.get("subtitle", ""))

func sector_desc(sec: Dictionary) -> String:
	var sid := str(sec.get("id", ""))
	if current_lang != "en" and SECTORS_LOC.has(sid) and SECTORS_LOC[sid].has(current_lang):
		return str(SECTORS_LOC[sid][current_lang][2])
	return str(sec.get("description", ""))

func ach_name(task: Dictionary) -> String:
	var tid := str(task.get("id", ""))
	if current_lang == "ru" and ACH_TITLES_RU.has(tid):
		return str(ACH_TITLES_RU[tid][0])
	if current_lang == "en":
		return str(task.get("name", ""))
	return ach_objective(task)

func ach_desc(task: Dictionary) -> String:
	var tid := str(task.get("id", ""))
	if current_lang == "ru" and ACH_TITLES_RU.has(tid):
		return str(ACH_TITLES_RU[tid][1])
	if current_lang == "en":
		return str(task.get("description", ""))
	return ach_objective(task)

func ach_objective(task: Dictionary) -> String:
	if current_lang == "en":
		return str(task.get("objective", ""))
	var ev := str(task.get("event_type", ""))
	var tgt := int(task.get("target", 1))
	var ev_map: Dictionary = {
		"mine_asteroid": {"ru": "Расколоть астероидов: %d", "es": "Minar %d asteroides", "de": "%d Asteroiden abbauen", "fr": "Miner %d astéroïdes", "pt": "Minerar %d asteroides", "zh": "击碎小行星：%d 颗", "ja": "小惑星を %d 個採掘", "ko": "소행성 %d개 채굴", "tr": "%d Asteroit Kaz"},
		"collect_resources": {"ru": "Собрать кусков руды: %d", "es": "Recoger %d minerales", "de": "%d Erzbrocken sammeln", "fr": "Collecter %d minerais", "pt": "Coletar %d minérios", "zh": "收集矿石碎片：%d 个", "ja": "資源チャンクを %d 個回収", "ko": "자원 조각 %d개 수집", "tr": "%d Cevher Topla"},
		"collect_iron": {"ru": "Добыть железа: %d ед.", "es": "Recoger %d de hierro", "de": "%d Eisen sammeln", "fr": "Collecter %d fer", "pt": "Coletar %d ferro", "zh": "采集铁氧矿：%d", "ja": "フェライト鉄を %d 回収", "ko": "철 %d개 수집", "tr": "%d Demir Topla"},
		"travel_distance": {"ru": "Пролететь в космосе: %d м", "es": "Volar %d m", "de": "%d m im All fliegen", "fr": "Parcourir %d m", "pt": "Voar %d m", "zh": "太空航行距离：%d 米", "ja": "宇宙空間を %d m航行", "ko": "우주 %dm 비행", "tr": "%d m Uçuş Yap"},
		"mining_seconds": {"ru": "Работать буровым лучом: %d с", "es": "Usar láser minero %d s", "de": "Bergbaulaser %d s nutzen", "fr": "Laser minier %d s", "pt": "Usar laser por %d s", "zh": "持续发射采矿光束：%d 秒", "ja": "採掘レーザーを %d 秒照射", "ko": "채굴 빔 %d초 가동", "tr": "%d sn Lazer Çalıştır"},
		"earn_credits": {"ru": "Заработать кредитов: %d КР", "es": "Ganar %d créditos", "de": "%d Credits verdienen", "fr": "Gagner %d crédits", "pt": "Ganhar %d créditos", "zh": "累计赚取信用点：%d", "ja": "%d クレジット獲得", "ko": "%d 크레딧 획득", "tr": "%d Kredi Kazan"},
		"defeat_enemy": {"ru": "Уничтожить врагов: %d", "es": "Derrotar %d enemigos", "de": "%d Feinde besiegen", "fr": "Vaincre %d ennemis", "pt": "Derrotar %d inimigos", "zh": "击毁敌方战机：%d 架", "ja": "敵機を %d 機撃破", "ko": "적 함선 %d기 격파", "tr": "%d Düşman Yok Et"},
		"complete_expedition": {"ru": "Завершить экспедиций: %d", "es": "Completar %d expediciones", "de": "%d Expeditionen beenden", "fr": "Terminer %d expéditions", "pt": "Concluir %d expedições", "zh": "完成太空远征：%d 次", "ja": "遠征を %d 回完了", "ko": "원정 %d회 완료", "tr": "%d Sefer Tamamla"},
		"upgrade_equipment": {"ru": "Улучшить модули: %d раз", "es": "Mejorar módulos %d veces", "de": "Module %d× verbessern", "fr": "Améliorer %d modules", "pt": "Melhorar módulos %d×", "zh": "强化舰船模块：%d 次", "ja": "装備を %d 回強化", "ko": "장비 %d회 강화", "tr": "%d Kez Modül Geliştir"},
		"open_pack": {"ru": "Открыть кристальных паков: %d", "es": "Abrir %d sobres", "de": "%d Packs öffnen", "fr": "Ouvrir %d packs", "pt": "Abrir %d pacotes", "zh": "开启水晶卡包：%d 个", "ja": "パックを %d 個開封", "ko": "카드 팩 %d개 개봉", "tr": "%d Paket Aç"},
		"sell_minerals": {"ru": "Продать минералов: %d ед.", "es": "Vender %d minerales", "de": "%d Mineralien verkaufen", "fr": "Vendre %d minerais", "pt": "Vender %d minérios", "zh": "精炼出售矿石：%d", "ja": "鉱石を %d 個売却", "ko": "광물 %d개 판매", "tr": "%d Cevher Sat"},
		"unlock_sector": {"ru": "Открыть новых секторов: %d", "es": "Desbloquear %d sector", "de": "%d Sektor freischalten", "fr": "Débloquer %d secteur", "pt": "Desbloquear %d setor", "zh": "解锁新星区：%d 个", "ja": "新宙域を %d 箇所解放", "ko": "새 섹터 %d개 해금", "tr": "%d Yeni Sektör Aç"},
		"expand_ship": {"ru": "Купить ячеек корпуса: %d", "es": "Comprar %d celdas", "de": "%d Hüllenzellen kaufen", "fr": "Acheter %d cellules", "pt": "Comprar %d células", "zh": "购买扩展舱格：%d 个", "ja": "拡張セルを %d 個購入", "ko": "확장 셀 %d개 구매", "tr": "%d Gövde Hücresi Al"},
		"collect_crew_card": {"ru": "Открыть новых бойцов: %d", "es": "Reclutar %d tripulantes", "de": "%d neue Crew-Karten", "fr": "Obtenir %d spécialistes", "pt": "Obter %d tripulantes", "zh": "收集新船员卡：%d 张", "ja": "新クルーを %d 名獲得", "ko": "신규 크루 %d명 수집", "tr": "%d Yeni Mürettebat Bul"},
	}
	if ev_map.has(ev) and ev_map[ev].has(current_lang):
		return str(ev_map[ev][current_lang]) % tgt
	return str(task.get("objective", ""))

func localize_reason(reason: String) -> String:
	if current_lang == "en" or reason.is_empty():
		return reason
	var map: Dictionary = {
		"Valid placement.": {"ru": "Готово к установке [ЛКМ].", "es": "Listo para instalar.", "de": "Bereit zur Montage.", "fr": "Prêt à installer.", "pt": "Pronto para instalar.", "zh": "可正常安装 [左键]。", "ja": "設置可能 [左クリック]。", "ko": "장착 가능 [좌클릭].", "tr": "Montaja hazır."},
		"No unplaced Expansion Cells owned. Purchase a cell first.": {"ru": "Нет свободных ячеек корпуса. Сначала купите ячейку!", "es": "Sin celdas disponibles. Compra una celda primero.", "de": "Keine freien Hüllenzellen. Kaufe zuerst eine Zelle.", "fr": "Aucune cellule libre. Achetez une cellule.", "pt": "Sem células livres. Compre uma célula primeiro.", "zh": "没有未安装的扩展舱格，请先购买。", "ja": "未使用の拡張セルがありません。", "ko": "보유한 확장 셀이 없습니다.", "tr": "Boş gövde hücresi yok."},
		"Module not in Hangar storage. Buy it in the Equipment Shop.": {"ru": "Модуля нет на складе ангара. Купите его в Магазине модулей.", "es": "Módulo no disponible. Cómpralo en la tienda.", "de": "Modul nicht im Lager. Im Modul-Shop kaufen.", "fr": "Module absent du stock. Achetez-le à la boutique.", "pt": "Módulo fora do estoque. Compre na loja.", "zh": "机库库存中无此模块，请前往商店购买。", "ja": "格納庫に在庫がありません。", "ko": "보관함에 모듈이 없습니다.", "tr": "Depoda modül yok."},
		"Overlaps an existing module.": {"ru": "Пересекается с уже установленным модулем.", "es": "Se superpone con otro módulo.", "de": "Überlappt ein bestehendes Modul.", "fr": "Chevauche un module existant.", "pt": "Sobrepõe um módulo existente.", "zh": "与现有模块位置重叠。", "ja": "既存モジュールと重なっています。", "ko": "기존 모듈과 겹칩니다.", "tr": "Mevcut modülle çakışıyor."},
		"Outside construction grid bounds.": {"ru": "За пределами строительной сетки стапеля.", "es": "Fuera de los límites de la cuadrícula.", "de": "Außerhalb des Konstruktionsrasters.", "fr": "Hors des limites de construction.", "pt": "Fora dos limites da grade.", "zh": "超出建造网格边界。", "ja": "建造グリッド範囲外です。", "ko": "건조 그리드 범위를 벗어났습니다.", "tr": "İnşa ızgarası dışında."},
		"Must connect directly to existing ship structure.": {"ru": "Модуль должен вплотную примыкать к корпусу корабля.", "es": "Debe conectarse directamente al casco.", "de": "Muss direkt mit der Schiffsstruktur verbunden sein.", "fr": "Doit toucher la structure du vaisseau.", "pt": "Deve conectar-se diretamente à estrutura.", "zh": "必须直接连接现有舰体结构。", "ja": "既存の船体構造に隣接させる必要があります。", "ko": "기존 함체 구조에 직접 연결해야 합니다.", "tr": "Gemi gövdesine doğrudan bağlanmalı."},
		"Engine exhaust nozzle is blocked by another module.": {"ru": "Сопло двигателя перекрыто соседним модулем!", "es": "La tobera del motor está bloqueada.", "de": "Triebwerksdüse wird blockiert!", "fr": "La tuyère du moteur est bloquée !", "pt": "O bocal do motor está bloqueado!", "zh": "引擎喷口被相邻模块阻挡！", "ja": "エンジン噴射口が塞がれています！", "ko": "엔진 노즐이 다른 모듈에 막혔습니다!", "tr": "Motor nozulu başka modülle kapalı!"},
		"Command Cockpit cannot be removed.": {"ru": "Командный мостик снимать нельзя.", "es": "La cabina de mando no se puede quitar.", "de": "Kommandocockpit kann nicht entfernt werden.", "fr": "Le cockpit ne peut pas être retiré.", "pt": "A cabine de comando não pode ser removida.", "zh": "指挥驾驶舱无法拆卸。", "ja": "指令コックピットは取り外せません。", "ko": "지휘 콕핏은 분리할 수 없습니다.", "tr": "Komuta kokpiti sökülemez."},
		"No module at this grid cell.": {"ru": "В этой ячейке нет установленного модуля.", "es": "No hay módulo en esta celda.", "de": "Kein Modul an dieser Position.", "fr": "Aucun module sur cette case.", "pt": "Nenhum módulo nesta célula.", "zh": "该网格位置没有模块。", "ja": "このセルにはモジュールがありません。", "ko": "이 셀에는 모듈이 없습니다.", "tr": "Bu hücrede modül yok."},
		"Cannot remove: other modules depend on this structural link!": {"ru": "Нельзя снять: на этом узле держатся соседние модули!", "es": "¡No se puede quitar: sostiene otros módulos!", "de": "Entfernen unmöglich: trägt andere Module!", "fr": "Impossible : d'autres modules en dépendent !", "pt": "Impossível remover: sustenta outros módulos!", "zh": "无法拆卸：其他模块依赖此结构连接！", "ja": "取り外し不可：他のモジュールが接続されています！", "ko": "분리 불가: 다른 모듈이 연결되어 있습니다!", "tr": "Sökülemez: diğer modüller buna bağlı!"},
		"0 Crew Slots unlocked. Purchase 10 Ship Expansion Cells to unlock Crew Slot #1!": {"ru": "Открыто 0 слотов экипажа. Купите 10 ячеек корпуса для открытия 1-го слота!", "es": "0 ranuras de tripulación. ¡Compra 10 celdas para abrir la 1.ª!", "de": "0 Crew-Plätze frei. Kaufe 10 Hüllenzellen für Platz #1!", "fr": "0 poste d'équipage. Achetez 10 cellules pour ouvrir le 1er !", "pt": "0 vagas de tripulação. Compre 10 células para abrir a 1ª!", "zh": "尚未解锁船员槽位。购买 10 个扩展舱格即可解锁第 1 个槽位！", "ja": "クルースロット未解放。拡張セルを10個購入すると解放されます！", "ko": "크루 슬롯 0개. 확장 셀 10개를 구매하면 첫 슬롯이 해금됩니다!", "tr": "0 Mürettebat Yuvası açık. 1. yuva için 10 gövde hücresi alın!"},
	}
	if map.has(reason) and map[reason].has(current_lang):
		return str(map[reason][current_lang])
	if reason.begins_with("All ") and reason.find("Crew Slots are full") >= 0:
		var m := {"ru": "Все открытые слоты мостика заняты. Снимите бойца или купите ещё 10 ячеек.", "es": "Todas las ranuras están llenas.", "de": "Alle Crew-Plätze sind belegt.", "fr": "Tous les postes sont occupés.", "pt": "Todas as vagas estão ocupadas.", "zh": "已解锁的舰桥槽位已满。", "ja": "解放済みスロットが満員です。", "ko": "모든 크루 슬롯이 가득 찼습니다.", "tr": "Tüm mürettebat yuvaları dolu."}
		if m.has(current_lang):
			return str(m[current_lang])
	return reason

