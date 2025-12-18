
import { Vector2, FormationType, EnemyType, ZoneType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ENEMY_SIZE } from '../constants';
import { Enemy } from './Entities';

export interface WaveData {
  slots: Vector2[];
  type: FormationType;
  enemyCount: number;
}

export class SpawnController {
  currentWave: number = 0;
  private zone: ZoneType;
  private mapIndex: number;

  constructor(zone: ZoneType, mapIndex: number) {
    this.zone = zone;
    this.mapIndex = mapIndex;
  }

  getFormation(type: FormationType, count: number, scale: number): Vector2[] {
    const slots: Vector2[] = [];
    const centerX = CANVAS_WIDTH / 2;
    const centerY = 350;

    switch (type) {
      case FormationType.GRID:
        const cols = 10;
        const spacingX = 140 * scale;
        const spacingY = 110 * scale;
        const totalW = (cols - 1) * spacingX;
        for (let i = 0; i < count; i++) {
          const r = Math.floor(i / cols);
          const c = i % cols;
          slots.push({
            x: centerX - totalW / 2 + c * spacingX,
            y: 120 + r * spacingY
          });
        }
        break;

      case FormationType.V_SHAPE:
        const vSpacingX = 120 * scale;
        const vSpacingY = 80 * scale;
        for (let i = 0; i < count; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const step = Math.floor(i / 2);
          slots.push({
            x: centerX + side * step * vSpacingX,
            y: 100 + step * vSpacingY
          });
        }
        break;

      case FormationType.CIRCLE:
        const radius = (320 + (this.mapIndex * 20)) * scale;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          slots.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        }
        break;

      default:
        for (let i = 0; i < count; i++) {
          slots.push({ x: centerX + (i % 5) * 100 * scale - 250 * scale, y: 150 + Math.floor(i / 5) * 100 * scale });
        }
    }
    return slots;
  }

  prepareNextWave(scale: number): WaveData {
    this.currentWave++;
    const types = [FormationType.GRID, FormationType.V_SHAPE, FormationType.CIRCLE];
    const type = types[Math.floor(Math.random() * types.length)];
    const enemyCount = 18 + (this.mapIndex * 6);
    const slots = this.getFormation(type, enemyCount, scale);
    return { slots, type, enemyCount };
  }

  spawnEnemiesFromSlots(slots: Vector2[], scale: number): Enemy[] {
    const enemies: Enemy[] = [];
    const hpScale = Math.pow(1.5, this.mapIndex);
    
    slots.forEach((slot, idx) => {
      const startPos = {
        x: Math.random() < 0.5 ? -200 : CANVAS_WIDTH + 200,
        y: -100 - Math.random() * 300
      };
      
      let eType = EnemyType.NORMAL;
      if (Math.random() < 0.25) eType = EnemyType.ARMORED;
      if (this.mapIndex > 3 && Math.random() < 0.1) eType = EnemyType.ELITE;
      
      const hp = Math.floor((eType === EnemyType.ARMORED ? 15 : (eType === EnemyType.ELITE ? 30 : 5)) * hpScale);
      const enemy = new Enemy(startPos, hp, ENEMY_SIZE * scale, this.zone, eType);
      enemy.setFormationSlot(slot, 2.0 + Math.random() * 1.0); // Entry chậm rãi
      enemies.push(enemy);
    });
    
    return enemies;
  }
}
