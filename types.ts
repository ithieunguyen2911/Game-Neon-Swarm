
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
}

export enum MapPhase {
  NORMAL = 'NORMAL',
  ELITE = 'ELITE',
  BOSS = 'BOSS'
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
  HEART = 'HEART'
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

export interface NetworkPlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tilt: number;
  weaponType: WeaponType;
  weaponLevel: number;
  isShooting: boolean;
  color: string;
  lives: number;
  isDead: boolean;
}
