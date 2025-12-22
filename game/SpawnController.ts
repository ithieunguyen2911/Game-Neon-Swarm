
import { Vector2, FormationType, EnemyType, ZoneType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ENEMY_SIZE } from '../constants';
import { Enemy } from './Entities';

export interface WaveData {
  slots: Vector2[];
  type: FormationType;
  enemyCount: number;
}

export class SpawnController {
  private zone: ZoneType;
  private mapIndex: number;

  constructor(zone: ZoneType, mapIndex: number) {
    this.zone = zone;
    this.mapIndex = mapIndex;
  }

  getFormation(type: FormationType, count: number, scale: number): Vector2[] {
    const slots: Vector2[] = [];
    // Tăng padding an toàn để tránh gà sát mép màn hình
    const safePadding = 120 * scale; 
    const availableWidth = CANVAS_WIDTH - safePadding * 2;
    const centerX = CANVAS_WIDTH / 2;
    const topY = 160;

    switch (type) {
      case FormationType.GRID:
        // Giới hạn số cột để không tràn chiều ngang
        const maxCols = Math.min(8, Math.floor(availableWidth / (130 * scale)));
        const cols = Math.max(4, maxCols);
        const spacingX = Math.min(150 * scale, availableWidth / (cols - 1 || 1));
        const spacingY = 100 * scale;
        const totalW = (cols - 1) * spacingX;
        
        for (let i = 0; i < count; i++) {
          const r = Math.floor(i / cols);
          const c = i % cols;
          slots.push({
            x: centerX - totalW / 2 + c * spacingX,
            y: topY + r * spacingY
          });
        }
        break;

      case FormationType.V_SHAPE:
        // V-Shape hẹp hơn để nằm trong màn hình
        const vSpacingX = Math.min(110 * scale, availableWidth / 14);
        const vSpacingY = 70 * scale;
        for (let i = 0; i < count; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const step = Math.floor(i / 2);
          slots.push({
            x: centerX + side * step * vSpacingX,
            y: topY + step * vSpacingY
          });
        }
        break;

      case FormationType.CIRCLE:
        // Giới hạn bán kính vòng tròn
        const maxRadius = Math.min(380 * scale, (CANVAS_WIDTH / 2) - safePadding);
        const centerY = 380;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          slots.push({
            x: centerX + Math.cos(angle) * maxRadius,
            y: centerY + Math.sin(angle) * maxRadius * 0.65 // Dẹt theo chiều dọc để cân đối
          });
        }
        break;

      default:
        // Ngẫu nhiên trong vùng an toàn
        for (let i = 0; i < count; i++) {
          slots.push({ 
            x: safePadding + Math.random() * availableWidth, 
            y: topY + Math.random() * 350 
          });
        }
    }
    return slots;
  }

  prepareNextWave(waveIndex: number, scale: number): WaveData {
    const types = [FormationType.GRID, FormationType.V_SHAPE, FormationType.CIRCLE];
    const type = types[waveIndex % types.length];
    
    // Số lượng gà tăng dần theo map và wave
    const enemyCount = 12 + (this.mapIndex * 3) + (waveIndex * 2);
    const slots = this.getFormation(type, enemyCount, scale);
    
    return { slots, type, enemyCount };
  }

  spawnEnemiesFromSlots(slots: Vector2[], scale: number, forcedType?: EnemyType): Enemy[] {
    const enemies: Enemy[] = [];
    const hpScale = 1 + (this.mapIndex * 0.4);
    
    slots.forEach((slot) => {
      // Điểm bắt đầu bên ngoài để bay vào (nhưng slot đích phải trong màn hình)
      const startPos = {
        x: Math.random() < 0.5 ? -200 : CANVAS_WIDTH + 200,
        y: -150 - Math.random() * 300
      };
      
      let eType = forcedType || EnemyType.NORMAL;
      if (!forcedType) {
          const rand = Math.random();
          if (rand < 0.12 + (this.mapIndex * 0.04)) eType = EnemyType.ELITE;
          else if (rand < 0.28 + (this.mapIndex * 0.04)) eType = EnemyType.ARMORED;
      }
      
      const baseHp = eType === EnemyType.ARMORED ? 30 : (eType === EnemyType.ELITE ? 75 : 15);
      const hp = Math.floor(baseHp * hpScale);
      
      const enemy = new Enemy(startPos, hp, ENEMY_SIZE * scale, this.zone, eType);
      enemy.setFormationSlot(slot, 1.0 + Math.random() * 0.8);
      enemies.push(enemy);
    });
    
    return enemies;
  }
}
