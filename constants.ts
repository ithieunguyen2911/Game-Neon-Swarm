
import { ControlSettings, ZoneType } from './types';

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const PLAYER_SPEED = 500;
export const PLAYER_SIZE = 36;
export const PLAYER_DRAG = 0.92;
export const PLAYER_LIVES = 5;

export const BULLET_SPEED = 900;
export const FIRE_RATE_BASE = 0.15;

export const ENEMY_SPAWN_RATE_INITIAL = 0.8; 
export const ENEMY_BASE_SPEED = 150;
export const ENEMY_SIZE = 40;

// Cập nhật giới hạn level mới
export const MAX_WEAPON_LEVEL = 20;

export const COLORS = {
  player: '#3b82f6', 
  player2: '#22c55e', 
  powerup: '#fbbf24',
};

export const DEFAULT_CONTROLS: ControlSettings = {
  p1: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'KeyF' },
  p2: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Space' }
};

export interface MapConfig {
  id: number;
  name: string;
  zone: ZoneType;
  bgColor: string;
  bossName: string;
  bossLogic: string;
  difficultyScale: number;
}

export const MAP_PROGRESSION: MapConfig[] = [
  { id: 1, name: "YOLK START", zone: ZoneType.SKY, bgColor: '#1e1b4b', bossName: "SHIELD HEN", bossLogic: "Attack after it fires", difficultyScale: 1.0 },
  { id: 2, name: "GRILL GALAXY", zone: ZoneType.VOLCANO, bgColor: '#450a0a', bossName: "MAGMA ROOSTER", bossLogic: "Vulnerable during overheat", difficultyScale: 1.2 },
  { id: 3, name: "NEON NEBULA", zone: ZoneType.CYBER, bgColor: '#0f172a', bossName: "CYBER CLUCK", bossLogic: "Hit the side wings first", difficultyScale: 1.4 },
  { id: 4, name: "ICE INVASION", zone: ZoneType.ICE, bgColor: '#0c4a6e', bossName: "FROST FEATHER", bossLogic: "Stay close to melt armor", difficultyScale: 1.6 },
  { id: 5, name: "PLASMA PLAINS", zone: ZoneType.SPACE, bgColor: '#1e293b', bossName: "STAR STRIKER", bossLogic: "Dodge beam, hit the core", difficultyScale: 1.8 },
  { id: 6, name: "TOXIC TURMOIL", zone: ZoneType.VOLCANO, bgColor: '#064e3b', bossName: "ACID AVIAN", bossLogic: "Clear bubbles to reveal weakpoint", difficultyScale: 2.0 },
  { id: 7, name: "COSMIC COOP", zone: ZoneType.SPACE, bgColor: '#020617', bossName: "VOID VULTURE", bossLogic: "Wait for the dash to end", difficultyScale: 2.2 },
  { id: 8, name: "DIGITAL DESERT", zone: ZoneType.CYBER, bgColor: '#422006', bossName: "REBOOT RAPTOR", bossLogic: "Attack when it's glitching", difficultyScale: 2.5 },
  { id: 9, name: "SOLAR STORM", zone: ZoneType.SKY, bgColor: '#7c2d12', bossName: "SUN EMPEROR", bossLogic: "Strike during sunspot phase", difficultyScale: 2.8 },
  { id: 10, name: "OMEGA NEST", zone: ZoneType.SPACE, bgColor: '#000000', bossName: "THE MOTHER", bossLogic: "Destroy all life support cores", difficultyScale: 3.5 },
];

export const WEAPON_CONFIGS = {
  // Cập nhật damage cơ bản (Lv1) thành 10
  BLASTER: { name: "Egg Blaster", fireRate: 0.2, speed: 1100, damage: 10, color: '#38bdf8' },
  SHOTGUN: { name: "Feather Spreader", fireRate: 0.6, speed: 700, damage: 0.8, color: '#22d3ee' }, 
  HELIX: { name: "DNA Twister", fireRate: 0.1, speed: 600, damage: 0.6, color: '#a855f7' }, 
  ROCKET: { name: "Rooster Rocket", fireRate: 0.8, speed: 500, damage: 5, color: '#f97316' }, 
};

export const ZONE_CONFIGS = {
  SKY: { colors: { secondary: '#c084fc' }, physics: { wind: { x: 50, y: 10 }, drag: 0.95, heatCurve: 0 } },
  VOLCANO: { colors: { secondary: '#f97316' }, physics: { wind: { x: 0, y: -20 }, drag: 0.90, heatCurve: 200 } },
  SPACE: { colors: { secondary: '#38bdf8' }, physics: { wind: { x: 0, y: 0 }, drag: 0.98, heatCurve: 0 } },
  CYBER: { colors: { secondary: '#22c55e' }, physics: { wind: { x: 20, y: 20 }, drag: 0.94, heatCurve: 50 } },
  ICE: { colors: { secondary: '#ffffff' }, physics: { wind: { x: -30, y: 10 }, drag: 0.99, heatCurve: -100 } },
};
