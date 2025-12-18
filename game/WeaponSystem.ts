
import { Vector2, WeaponType } from '../types';
import { WEAPON_CONFIGS, COLORS } from '../constants';
import { 
    Projectile, 
    EggBlasterBullet, 
    FeatherShotgunBullet, 
    HelixDNAProjectile, 
    RoosterRocket, 
    PhotonLaser 
} from './entities/Combat';

interface WeaponStats {
  bullets: number;
  damage: number;
  hz: number;
  overloadPerShot: number; // Mức sinh nhiệt mỗi lần bắn (%)
}

const BLASTER_TABLE: Record<number, WeaponStats> = {
  1:  { bullets: 1, damage: 10, hz: 5.0, overloadPerShot: 2.2 },
  2:  { bullets: 1, damage: 11, hz: 5.0, overloadPerShot: 2.3 },
  3:  { bullets: 1, damage: 12, hz: 5.1, overloadPerShot: 2.4 },
  4:  { bullets: 2, damage: 13, hz: 5.1, overloadPerShot: 2.5 },
  5:  { bullets: 2, damage: 14, hz: 5.2, overloadPerShot: 2.6 },
  6:  { bullets: 2, damage: 15, hz: 5.3, overloadPerShot: 2.7 },
  7:  { bullets: 3, damage: 16, hz: 5.4, overloadPerShot: 2.8 },
  8:  { bullets: 3, damage: 17, hz: 5.5, overloadPerShot: 2.9 },
  9:  { bullets: 3, damage: 18, hz: 5.6, overloadPerShot: 3.0 },
  10: { bullets: 4, damage: 20, hz: 6.0, overloadPerShot: 3.2 },

  11: { bullets: 4, damage: 22, hz: 6.2, overloadPerShot: 3.4 },
  12: { bullets: 4, damage: 24, hz: 6.4, overloadPerShot: 3.6 },
  13: { bullets: 5, damage: 26, hz: 6.6, overloadPerShot: 3.8 },
  14: { bullets: 5, damage: 28, hz: 6.8, overloadPerShot: 4.0 },
  15: { bullets: 5, damage: 30, hz: 7.0, overloadPerShot: 4.2 },
  16: { bullets: 6, damage: 33, hz: 7.2, overloadPerShot: 4.3 },
  17: { bullets: 6, damage: 36, hz: 7.3, overloadPerShot: 4.4 },
  18: { bullets: 6, damage: 39, hz: 7.4, overloadPerShot: 4.5 },
  19: { bullets: 7, damage: 42, hz: 7.5, overloadPerShot: 4.6 },
  20: { bullets: 7, damage: 45, hz: 7.6, overloadPerShot: 4.8 },
};


const SHOTGUN_TABLE: Record<number, WeaponStats> = {
  1:  { bullets: 2,  damage: 6,  hz: 1.8, overloadPerShot: 6.0 },
  2:  { bullets: 3,  damage: 6.5, hz: 1.9, overloadPerShot: 6.3 },
  3:  { bullets: 4,  damage: 7,  hz: 2.0, overloadPerShot: 6.6 },
  4:  { bullets: 5,  damage: 7.5, hz: 2.1, overloadPerShot: 7.0 },
  5:  { bullets: 6,  damage: 8,  hz: 2.2, overloadPerShot: 7.5 },

  6:  { bullets: 7,  damage: 8.5, hz: 2.3, overloadPerShot: 7.8 },
  7:  { bullets: 8,  damage: 9,  hz: 2.4, overloadPerShot: 8.2 },
  8:  { bullets: 9,  damage: 9.5, hz: 2.5, overloadPerShot: 8.6 },
  9:  { bullets: 10, damage: 10, hz: 2.6, overloadPerShot: 9.0 },
  10: { bullets: 11, damage: 11, hz: 2.7, overloadPerShot: 9.5 },

  11: { bullets: 12, damage: 12, hz: 2.8, overloadPerShot: 10.0 },
  12: { bullets: 13, damage: 13, hz: 2.9, overloadPerShot: 10.5 },
  13: { bullets: 14, damage: 14, hz: 3.0, overloadPerShot: 11.0 },
  14: { bullets: 15, damage: 15, hz: 3.1, overloadPerShot: 11.5 },
  15: { bullets: 16, damage: 16, hz: 3.2, overloadPerShot: 12.0 },

  16: { bullets: 17, damage: 17, hz: 3.3, overloadPerShot: 12.5 },
  17: { bullets: 18, damage: 18, hz: 3.4, overloadPerShot: 13.0 },
  18: { bullets: 19, damage: 19, hz: 3.5, overloadPerShot: 13.5 },
  19: { bullets: 20, damage: 20, hz: 3.6, overloadPerShot: 14.0 },
  20: { bullets: 21, damage: 22, hz: 3.8, overloadPerShot: 15.0 },
};

const HELIX_TABLE: Record<number, WeaponStats> = {
  1:  { bullets: 2, damage: 8,  hz: 4.0, overloadPerShot: 4.0 },
  2:  { bullets: 2, damage: 9,  hz: 4.4, overloadPerShot: 4.2 },
  3:  { bullets: 2, damage: 10, hz: 4.8, overloadPerShot: 4.4 },
  4:  { bullets: 3, damage: 11, hz: 5.2, overloadPerShot: 4.7 },
  5:  { bullets: 3, damage: 12, hz: 6.0, overloadPerShot: 5.0 },

  6:  { bullets: 3, damage: 14, hz: 6.8, overloadPerShot: 5.3 },
  7:  { bullets: 4, damage: 16, hz: 7.5, overloadPerShot: 5.6 },
  8:  { bullets: 4, damage: 18, hz: 8.0, overloadPerShot: 6.0 },
  9:  { bullets: 5, damage: 20, hz: 8.3, overloadPerShot: 6.4 },
  10: { bullets: 6, damage: 19, hz: 8.5, overloadPerShot: 7.0 },

  11: { bullets: 6, damage: 22, hz: 9.5, overloadPerShot: 7.4 },
  12: { bullets: 7, damage: 26, hz: 10.5, overloadPerShot: 7.8 },
  13: { bullets: 7, damage: 30, hz: 11.5, overloadPerShot: 8.2 },
  14: { bullets: 8, damage: 35, hz: 12.5, overloadPerShot: 8.6 },
  15: { bullets: 8, damage: 40, hz: 13.5, overloadPerShot: 9.0 },

  16: { bullets: 9, damage: 45, hz: 14.5, overloadPerShot: 9.2 },
  17: { bullets: 9, damage: 50, hz: 15.5, overloadPerShot: 9.4 },
  18: { bullets: 10, damage: 55, hz: 16.5, overloadPerShot: 9.6 },
  19: { bullets: 10, damage: 60, hz: 17.2, overloadPerShot: 9.8 },
  20: { bullets: 10, damage: 65, hz: 18.0, overloadPerShot: 10.0 },
};

const ROCKET_TABLE: Record<number, WeaponStats> = {
  1:  { bullets: 1, damage: 45,  hz: 1.2, overloadPerShot: 18 },
  2:  { bullets: 1, damage: 55,  hz: 1.3, overloadPerShot: 19 },
  3:  { bullets: 1, damage: 65,  hz: 1.4, overloadPerShot: 20 },
  4:  { bullets: 2, damage: 75,  hz: 1.5, overloadPerShot: 21 },
  5:  { bullets: 3, damage: 85,  hz: 1.6, overloadPerShot: 22 },

  6:  { bullets: 3, damage: 100, hz: 1.7, overloadPerShot: 23 },
  7:  { bullets: 3, damage: 120, hz: 1.8, overloadPerShot: 24 },
  8:  { bullets: 4, damage: 140, hz: 1.9, overloadPerShot: 25 },
  9:  { bullets: 4, damage: 160, hz: 2.0, overloadPerShot: 26 },
  10: { bullets: 4, damage: 160, hz: 2.1, overloadPerShot: 28 },

  11: { bullets: 5, damage: 200, hz: 2.2, overloadPerShot: 29 },
  12: { bullets: 6, damage: 240, hz: 2.4, overloadPerShot: 30 },
  13: { bullets: 7, damage: 290, hz: 2.6, overloadPerShot: 31 },
  14: { bullets: 8, damage: 350, hz: 2.8, overloadPerShot: 32 },
  15: { bullets: 9, damage: 420, hz: 3.0, overloadPerShot: 33 },

  16: { bullets: 10, damage: 480, hz: 3.2, overloadPerShot: 34 },
  17: { bullets: 11, damage: 520, hz: 3.3, overloadPerShot: 35 },
  18: { bullets: 11, damage: 550, hz: 3.4, overloadPerShot: 36 },
  19: { bullets: 12, damage: 550, hz: 3.5, overloadPerShot: 37 },
  20: { bullets: 12, damage: 550, hz: 3.5, overloadPerShot: 38 },
};
const LASER_TABLE: Record<number, WeaponStats> = {
  1:  { bullets: 1, damage: 1.5, hz: 25, overloadPerShot: 1.2 },
  2:  { bullets: 1, damage: 2.0, hz: 28, overloadPerShot: 1.25 },
  3:  { bullets: 1, damage: 2.5, hz: 31, overloadPerShot: 1.3 },
  4:  { bullets: 1, damage: 3.0, hz: 34, overloadPerShot: 1.35 },
  5:  { bullets: 1, damage: 3.5, hz: 37, overloadPerShot: 1.4 },

  6:  { bullets: 1, damage: 4.0, hz: 40, overloadPerShot: 1.45 },
  7:  { bullets: 1, damage: 4.8, hz: 43, overloadPerShot: 1.5 },
  8:  { bullets: 1, damage: 5.6, hz: 46, overloadPerShot: 1.55 },
  9:  { bullets: 1, damage: 6.5, hz: 48, overloadPerShot: 1.6 },
  10: { bullets: 1, damage: 7.5, hz: 50, overloadPerShot: 1.8 },

  11: { bullets: 1, damage: 9,   hz: 53, overloadPerShot: 1.9 },
  12: { bullets: 1, damage: 11,  hz: 56, overloadPerShot: 2.0 },
  13: { bullets: 1, damage: 14,  hz: 58, overloadPerShot: 2.1 },
  14: { bullets: 1, damage: 18,  hz: 60, overloadPerShot: 2.2 },
  15: { bullets: 1, damage: 22,  hz: 62, overloadPerShot: 2.3 },

  16: { bullets: 1, damage: 28,  hz: 64, overloadPerShot: 2.35 },
  17: { bullets: 1, damage: 34,  hz: 66, overloadPerShot: 2.4 },
  18: { bullets: 1, damage: 40,  hz: 68, overloadPerShot: 2.45 },
  19: { bullets: 1, damage: 44,  hz: 69, overloadPerShot: 2.5 },
  20: { bullets: 1, damage: 48,  hz: 70, overloadPerShot: 2.6 },
};


// Hàm tiện ích để lấy stats từ table (hỗ trợ nội suy nếu level không có trong record)
const getStats = (table: Record<number, WeaponStats>, level: number): WeaponStats => {
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    let bestKey = keys[0];
    for (const key of keys) {
        if (level >= key) bestKey = key;
    }
    return table[bestKey];
};

export class WeaponSystem {
  private static getTable(type: WeaponType) {
    switch (type) {
      case WeaponType.SHOTGUN: return SHOTGUN_TABLE;
      case WeaponType.HELIX: return HELIX_TABLE;
      case WeaponType.ROCKET: return ROCKET_TABLE;
      case WeaponType.LASER: return LASER_TABLE;
      default: return BLASTER_TABLE;
    }
  }

  static getFireRate(type: WeaponType, level: number): number {
    const table = this.getTable(type);
    const stats = getStats(table, level);
    return 1 / stats.hz;
  }

  static getOverloadPerShot(type: WeaponType, level: number): number {
    const table = this.getTable(type);
    const stats = getStats(table, level);
    return stats.overloadPerShot;
  }

  static fire(
    px: number,
    py: number,
    type: WeaponType,
    level: number,
    playerId: string,
    playerColor: string
  ): Projectile[] {
    const wConfig = WEAPON_CONFIGS[type];
    const table = this.getTable(type);
    const stats = getStats(table, level);
    
    const projectiles: Projectile[] = [];
    const speed = wConfig.speed;
    const bulletColor = type === WeaponType.BLASTER ? '#38bdf8' : (type === WeaponType.LASER ? '#22c55e' : (type === WeaponType.HELIX ? '#a855f7' : (playerColor === COLORS.p1Primary ? wConfig.color : playerColor)));
    
    const shootY = type === WeaponType.LASER ? py - 75 : py - 15;
    const count = stats.bullets;
    const dmg = stats.damage;

    if (type === WeaponType.BLASTER) {
      this.spawnBlasterPattern(projectiles, px, shootY, count, dmg, speed, playerId);
    } 
    else if (type === WeaponType.SHOTGUN) {
      const arc = (Math.PI / 1.5) * (count / 31);
      for(let i=0; i<count; i++) {
        const angle = -Math.PI/2 - (arc/2) + (arc * (i/(count-1 || 1)));
        projectiles.push(new FeatherShotgunBullet(
          {x: px, y: shootY},
          {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed},
          dmg, bulletColor, playerId
        ));
      }
    }
    else if (type === WeaponType.HELIX) {
      const pairs = Math.max(1, Math.floor(count / 2));
      const spacing = 35;
      for (let i = 0; i < pairs; i++) {
          const xOffset = (i - (pairs - 1) / 2) * spacing;
          projectiles.push(new HelixDNAProjectile({x: px + xOffset, y: shootY}, {x: 0, y: -speed}, dmg, bulletColor, playerId, 0));
          projectiles.push(new HelixDNAProjectile({x: px + xOffset, y: shootY}, {x: 0, y: -speed}, dmg, bulletColor, playerId, Math.PI));
      }
    }
    else if (type === WeaponType.ROCKET) {
      const spreadX = 40;
      for (let i = 0; i < count; i++) {
          const xOffset = (i - (count - 1) / 2) * spreadX;
          projectiles.push(new RoosterRocket({x: px + xOffset, y: shootY + Math.abs(xOffset) * 0.2}, {x: xOffset * 2, y: -speed}, dmg, bulletColor, playerId));
      }
    }
    else if (type === WeaponType.LASER) {
      const width = 6 + (level * 1.5);
      projectiles.push(new PhotonLaser({x: px, y: shootY}, {x: 0, y: -speed}, dmg, bulletColor, playerId, width));
      
      if (level >= 15) {
          projectiles.push(new PhotonLaser({x: px - 35, y: shootY + 30}, {x: -300, y: -speed}, dmg * 0.4, bulletColor, playerId, width * 0.5));
          projectiles.push(new PhotonLaser({x: px + 35, y: shootY + 30}, {x: 300, y: -speed}, dmg * 0.4, bulletColor, playerId, width * 0.5));
      }
    }
    return projectiles;
  }

  private static spawnBlasterPattern(projectiles: Projectile[], px: number, py: number, count: number, dmg: number, speed: number, id: string) {
      const spawn = (x: number, y: number, vx: number, vy: number) => {
          projectiles.push(new EggBlasterBullet({x, y}, {x: vx, y: vy}, dmg, id));
      };

      if (count === 1) spawn(px, py, 0, -speed);
      else if (count === 2) {
          spawn(px - 12, py, 0, -speed);
          spawn(px + 12, py, 0, -speed);
      }
      else if (count === 3) {
          spawn(px, py - 5, 0, -speed);
          spawn(px - 20, py, -80, -speed);
          spawn(px + 20, py, 80, -speed);
      }
      else if (count === 4) {
          spawn(px - 10, py - 5, 0, -speed);
          spawn(px + 10, py - 5, 0, -speed);
          spawn(px - 25, py, -120, -speed);
          spawn(px + 25, py, 120, -speed);
      }
      else {
          spawn(px, py - 10, 0, -speed);
          spawn(px - 15, py - 5, 0, -speed);
          spawn(px + 15, py - 5, 0, -speed);
          spawn(px - 35, py, -180, -speed);
          spawn(px + 35, py, 180, -speed);
      }
  }
}
