

export interface Vector2 {
  x: number;
  y: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
  SETTINGS = 'SETTINGS',
  GALLERY = 'GALLERY',
  STORY = 'STORY' // Màn hình hiển thị cốt truyện
}

export enum MapOrientation {
  UP = 0,
  RIGHT = 90,
  DOWN = 180,
  LEFT = 270
}

export interface MapPuzzle {
  keyItemName: string;
  requiredCount: number;
  currentCount: number;
  hint: string;
  isResolved: boolean;
}

// Cấu trúc mới cho Map
export interface MapDefinition {
  id: number;
  name: string;
  storySnippet: string;
  bgColor: string;
  orientation: MapOrientation;
  puzzle: MapPuzzle;
  hazardsFrequency: number; // Tần suất xuất hiện vật cản
  ambientEffect: 'WIND' | 'ASH' | 'CYBER_STATIC' | 'SNOW' | 'NONE';
}

export interface VersionDefinition {
  versionId: string;
  title: string;
  description: string;
  maps: MapDefinition[];
}

export enum PlayerState {
  ALIVE = 'ALIVE',
  RESPAWNING = 'RESPAWNING',
  DEAD = 'DEAD'
}

export enum MapPhase {
  NORMAL = 'NORMAL',
  ELITE = 'ELITE',
  BOSS = 'BOSS'
}

export enum EnemyState {
  ENTRY = 'ENTRY',
  FORMATION = 'FORMATION',
  DIVE = 'DIVE',
  RETURN = 'RETURN'
}

export enum FormationType {
  GRID = 'GRID',
  V_SHAPE = 'V_SHAPE',
  CIRCLE = 'CIRCLE',
  SNAKE = 'SNAKE'
}

export enum GameMode {
  OFFLINE_SOLO = 'OFFLINE_SOLO',
  OFFLINE_COOP = 'OFFLINE_COOP',
  ONLINE = 'ONLINE'
}

export enum ZoneType {
  SKY = 'SKY',
  VOLCANO = 'VOLCANO',
  SPACE = 'SPACE',
  CYBER = 'CYBER',
  ICE = 'ICE'
}

export enum EnemyType {
  NORMAL = 'NORMAL',
  ARMORED = 'ARMORED',
  ELITE = 'ELITE',
}

export enum WeaponType {
  BLASTER = 'BLASTER',
  SHOTGUN = 'SHOTGUN',
  HELIX = 'HELIX',
  ROCKET = 'ROCKET', 
  LASER = 'LASER'
}

export enum PowerUpType {
  WEAPON = 'WEAPON',
  HEART = 'HEART',
  POWER_BOOST = 'POWER_BOOST',
  KEY_ITEM = 'KEY_ITEM' // Loại item mới để giải mã map
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shooting: boolean;
  pointer?: Vector2; 
  usePointer: boolean;
}

export interface InputState {
  p1: PlayerInput;
  p2: PlayerInput; 
}

// Added ControlSettings for constants.ts and InputHandler.ts
export interface ControlSettings {
  p1: { up: string; down: string; left: string; right: string; shoot: string };
  p2: { up: string; down: string; left: string; right: string; shoot: string };
}

// Added NetworkPlayerState for MultiplayerService.ts
export interface NetworkPlayerState {
  id: string;
  position: Vector2;
  velocity: Vector2;
  state: PlayerState;
  weaponType: WeaponType;
  weaponLevel: number;
}