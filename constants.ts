import { ControlSettings } from './types';

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const PLAYER_SPEED = 500;
export const PLAYER_SIZE = 36; // Increased from 32 (~12%)
export const PLAYER_DRAG = 0.92;
export const PLAYER_LIVES = 5; // Default Lives

export const BULLET_SPEED = 900;
export const FIRE_RATE_BASE = 0.15;

export const ENEMY_SPAWN_RATE_INITIAL = 0.8; 
export const ENEMY_BASE_SPEED = 150;
export const ENEMY_SIZE = 40; // Increased from 35 (~14%)

export const MAX_WEAPON_LEVEL = 4;

export const COLORS = {
  player: '#3b82f6', 
  player2: '#22c55e', 
  powerup: '#fbbf24',
};

export const DEFAULT_CONTROLS: ControlSettings = {
  p1: {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    shoot: 'KeyF' 
  },
  p2: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    shoot: 'Space' 
  }
};

export const ZONE_CONFIGS = {
  SKY: {
    name: "YOLK STAR",
    colors: {
      background: '#1e1b4b',
      primary: '#38bdf8', 
      secondary: '#c084fc', 
      enemy: '#ffffff', 
      particle: '#fef08a', 
    },
    physics: {
      wind: { x: 50, y: 10 },
      drag: 0.95,
      heatCurve: 0,
    }
  },
  VOLCANO: {
    name: "GRILL GALAXY",
    colors: {
      background: '#450a0a', 
      primary: '#ef4444', 
      secondary: '#f97316', 
      enemy: '#b45309', 
      particle: '#78350f', 
    },
    physics: {
      wind: { x: 0, y: -20 },
      drag: 0.90,
      heatCurve: 200,
    }
  }
};

export const WEAPON_CONFIGS = {
  BLASTER: { name: "Egg Blaster", fireRate: 0.15, speed: 800, damage: 1, color: '#facc15' },
  SHOTGUN: { name: "Feather Spreader", fireRate: 0.6, speed: 700, damage: 0.8, color: '#22d3ee' }, 
  HELIX: { name: "DNA Twister", fireRate: 0.1, speed: 600, damage: 0.6, color: '#a855f7' }, 
  ROCKET: { name: "Rooster Rocket", fireRate: 0.8, speed: 500, damage: 5, color: '#f97316' }, 
};