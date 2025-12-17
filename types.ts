export interface Vector2 {
  x: number;
  y: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED', // Added Pause State
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
  SETTINGS = 'SETTINGS',
}

export enum GameMode {
  OFFLINE_SOLO = 'OFFLINE_SOLO',
  OFFLINE_COOP = 'OFFLINE_COOP',
  ONLINE = 'ONLINE'
}

export enum ZoneType {
  SKY = 'SKY',
  VOLCANO = 'VOLCANO',
}

export enum WeaponType {
  BLASTER = 'BLASTER',
  SHOTGUN = 'SHOTGUN',
  HELIX = 'HELIX',
  ROCKET = 'ROCKET', 
}

export enum PowerUpType {
  WEAPON = 'WEAPON',
  HEART = 'HEART'
}

export interface GameStats {
  score: number;
  level: number;
  highScore: number;
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

// Control Configuration Types
export interface PlayerKeyMap {
  up: string;
  down: string;
  left: string;
  right: string;
  shoot: string;
}

export interface ControlSettings {
  p1: PlayerKeyMap;
  p2: PlayerKeyMap;
}

// Multiplayer Types
export interface NetworkPlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tilt: number;
  weaponType: WeaponType;
  isShooting: boolean;
  color: string;
}

export interface NetworkEvent {
  type: 'SCORE' | 'LEVEL_UP';
  payload: any;
}