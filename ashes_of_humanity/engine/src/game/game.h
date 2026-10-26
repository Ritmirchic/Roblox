// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Game orchestrator: states, world streaming, rendering and UI flow.
// ============================================================================
#pragma once
#include "game/ai.h"
#include "game/anim.h"
#include "game/audio.h"
#include "game/combat.h"
#include "game/context.h"
#include "game/items.h"
#include "game/player.h"
#include "game/quests.h"
#include "game/save.h"
#include "game/ui.h"
#include "game/world.h"
#include "platform/window.h"
#include <string>
#include <vector>

namespace aoh {

enum GameState {
  GS_BOOT = 0, GS_MAIN_MENU, GS_NEW_GAME, GS_LOADING, GS_PLAYING, GS_PAUSED,
  GS_INVENTORY, GS_SKILLS, GS_CRAFTING, GS_MAP, GS_JOURNAL, GS_DIALOGUE,
  GS_BUILD, GS_DEATH, GS_VICTORY, GS_CUTSCENE, GS_SETTINGS
};

enum BuildPiece { BPB_BARRIER = 0, BPB_CRATE, BPB_SANDBAG, BPB_TORCH, BPB_WALL, BPB_COUNT };

struct PlacedPiece {
  int meshIndex = -1;
  Vec3 pos;
  f32  yaw = 0.0f;
  f32  durability = 100.0f;
  int  piece = 0;
};

struct TerrainChunk {
  GpuMesh* mesh = nullptr;
  int region = 0;
  AABB bounds;
};

struct StaticInstance {
  GpuMesh* mesh = nullptr;
  Mat4 model;
  int region = 0;
  bool solid = true;
};

struct WeatherState {
  f32 cloud = 0.4f;
  f32 rain = 0.0f;
  f32 fog = 0.01f;
  f32 wind = 0.4f;
  f32 temperature = 16.0f;
  int  kind = 0;   // 0 clear, 1 overcast, 2 rain, 3 storm, 4 fog, 5 radiation storm
};

struct DialogueNode {
  std::string speaker;
  std::string text;
  std::vector<std::string> choices;
  std::vector<int> next;
};

class Game {
public:
  bool init(void* nativeWindow, int width, int height);
  void shutdown();
  void run();
  void requestClose() { m_quit = true; }
  void setWindow(Window* w) { m_window = w; }

  // Exposed for the automated test harness.
  GameState state() const { return m_state; }
  Player& player() { return m_player; }
  World& world() { return m_world; }
  QuestSystem& quests() { return m_quests; }
  void setState(GameState s);
  int  runTests();
  // Runs the gameplay simulation headlessly for the given number of seconds.
  void simulate(f32 seconds);

private:
  // --- setup ---
  bool loadAssets();
  bool loadBranding();
  void drawLoadingScreen(float progress, const char* label);
  void buildWorld(u32 seed);
  void spawnWorld();
  void spawnPlayer();

  // --- loop ---
  void update(f32 dt);
  void render();
  void renderWorld();
  void renderUI();
  void drawHUD();
  void drawScreen(GameState s);

  // --- systems ---
  void updateWeather(f32 dt);
  void updateInteraction(f32 dt);
  void updateLoot();
  void updateWorldEvents(f32 dt);
  void updateBuildMode(f32 dt);
  void updateCamera(f32 dt);
  void handleHotkeys();
  void autosave();
  void startCutscene(int index);
  void updateCutscene(f32 dt);
  void startDialogue(int node);
  void updateDialogue();

  // --- helpers ---
  TextureSet resolveTextures(const Material& mat);
  void drawTerrainChunk(const TerrainChunk& c);
  void drawStatic(const StaticInstance& inst);
  void submitMeshByName(const std::string& name, const Mat4& xform);
  f32  damageFalloffVisual() const;

  // --- state ---
  GameState m_state = GS_BOOT;
  bool m_quit = false;
  bool m_firstPerson = false;
  f32  m_time = 0.0f;
  f32  m_playTime = 0.0f;
  f32  m_autosaveTimer = 0.0f;
  u32  m_seed = 20241;

  Renderer* m_renderer = nullptr;
  Window* m_window = nullptr;
  UIRenderer m_ui;
  AudioSystem m_audio;
  AssetManager m_assets;
  AnimLibrary m_animLib;
  Animator m_animator;

  World m_world;
  ItemDatabase m_items;
  WeaponDatabase m_weapons;
  QuestSystem m_quests;
  CraftingSystem m_crafting;
  PlayerController m_playerCtrl;
  CombatSystem m_combat;
  AISystem m_ai;
  Player m_player;

  GameContext m_ctx;
  std::vector<Projectile> m_projectiles;
  std::vector<Particle> m_particles;
  std::vector<Decal> m_decals;
  std::vector<FloatingText> m_texts;
  std::vector<Mutant> m_mutants;

  WeatherState m_weather;
  std::vector<PlacedPiece> m_pieces;
  int  m_buildPiece = BPB_BARRIER;
  bool m_buildValid = false;
  Vec3 m_buildPos;
  f32  m_buildYaw = 0.0f;

  std::vector<StaticInstance> m_statics;
  std::vector<TerrainChunk> m_chunks;
  std::map<std::string, GpuMesh*> m_meshCache;
  std::map<std::string, int> m_setIndexByName;
  std::map<std::string, GpuTexture*> m_texCache;
  std::map<int, GpuTexture*> m_setCache;   // texture set index -> albedo
  std::map<int, std::map<int, GpuTexture*>> m_setCacheFull;
  GpuTexture* m_menuBg = nullptr;
  GpuTexture* m_loadingBg = nullptr;
  GpuTexture* m_titleLogo = nullptr;


  // dialogue
  std::vector<DialogueNode> m_dialogue;
  int  m_dialogueNode = -1;
  int  m_dialogueChoice = 0;

  // cutscene
  bool m_cutsceneActive = false;
  f32  m_cutsceneTime = 0.0f;
  int  m_cutsceneIndex = 0;
  Vec3 m_cutsceneCamPos;
  Vec3 m_cutsceneCamTarget;

  // menu navigation
  int  m_menuIndex = 0;
  int  m_skillIndex = 0;
  int  m_craftIndex = 0;
  int  m_mapIndex = 0;
  int  m_journalIndex = 0;
  int  m_settingsIndex = 0;
  int  m_invSelX = 0, m_invSelY = 0;
  std::string m_toast;
  f32  m_toastTimer = 0.0f;
  SaveSettings m_settings;
  f32  m_damageFlash = 0.0f;
  f32  m_lowHealthPulse = 0.0f;
  f32  m_frameMs = 0.0f;
  f32  m_fps = 0.0f;
  bool m_showPerf = false;
  int  m_invTab = 0;            // 0 gear, 1 medical, 2 weapon mod
  int  m_modIndex = 0;
};

} // namespace aoh
