
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
}

const BLASTER_TABLE: Record<number, WeaponStats> = {
  1: { bullets: 1, damage: 10, hz: 5.0 }, 2: { bullets: 2, damage: 11, hz: 5.0 },
  3: { bullets: 3, damage: 12, hz: 5.0 }, 4: { bullets: 3, damage: 13, hz: 5.2 },
  5: { bullets: 3, damage: 14, hz: 5.4 }, 6: { bullets: 4, damage: 15, hz: 5.5 },
  7: { bullets: 4, damage: 16, hz: 5.6 }, 8: { bullets: 5, damage: 17, hz: 5.7 },
  9: { bullets: 5, damage: 18, hz: 5.8 }, 10: { bullets: 5, damage: 20, hz: 6.0 },
  11: { bullets: 6, damage: 22, hz: 6.1 }, 12: { bullets: 6, damage: 24, hz: 6.2 },
  13: { bullets: 6, damage: 26, hz: 6.3 }, 14: { bullets: 6, damage: 28, hz: 6.5 },
  15: { bullets: 6, damage: 30, hz: 6.7 }, 16: { bullets: 7, damage: 32, hz: 6.9 },
  17: { bullets: 7, damage: 35, hz: 7.0 }, 18: { bullets: 7, damage: 38, hz: 7.2 },
  19: { bullets: 7, damage: 41, hz: 7.4 }, 20: { bullets: 7, damage: 45, hz: 7.6 },
};

const SHOTGUN_TABLE: Record<number, WeaponStats> = {
  1: { bullets: 3, damage: 6, hz: 1.8 }, 2: { bullets: 5, damage: 6.5, hz: 1.9 },
  3: { bullets: 7, damage: 7, hz: 2.0 }, 4: { bullets: 7, damage: 7.5, hz: 2.1 },
  5: { bullets: 9, damage: 8, hz: 2.2 }, 6: { bullets: 11, damage: 8.5, hz: 2.3 },
  7: { bullets: 11, damage: 9, hz: 2.4 }, 8: { bullets: 13, damage: 9.5, hz: 2.5 },
  9: { bullets: 15, damage: 10, hz: 2.6 }, 10: { bullets: 15, damage: 11, hz: 2.7 },
  11: { bullets: 17, damage: 12, hz: 2.8 }, 12: { bullets: 19, damage: 13, hz: 2.9 },
  13: { bullets: 19, damage: 14, hz: 3.0 }, 14: { bullets: 21, damage: 15, hz: 3.1 },
  15: { bullets: 23, damage: 16, hz: 3.2 }, 16: { bullets: 25, damage: 17, hz: 3.3 },
  17: { bullets: 25, damage: 18, hz: 3.4 }, 18: { bullets: 27, damage: 19, hz: 3.5 },
  19: { bullets: 29, damage: 20, hz: 3.6 }, 20: { bullets: 31, damage: 22, hz: 3.8 },
};

const HELIX_TABLE: Record<number, WeaponStats> = {
  1: { bullets: 2, damage: 8, hz: 4.0 }, 2: { bullets: 2, damage: 9, hz: 4.5 },
  3: { bullets: 2, damage: 10, hz: 5.0 }, 4: { bullets: 4, damage: 11, hz: 5.5 },
  5: { bullets: 4, damage: 12, hz: 6.0 }, 6: { bullets: 4, damage: 13, hz: 6.5 },
  7: { bullets: 4, damage: 14, hz: 7.0 }, 8: { bullets: 4, damage: 15, hz: 7.5 },
  9: { bullets: 6, damage: 17, hz: 8.0 }, 10: { bullets: 6, damage: 19, hz: 8.5 },
  11: { bullets: 6, damage: 21, hz: 9.0 }, 12: { bullets: 6, damage: 24, hz: 9.5 },
  13: { bullets: 6, damage: 27, hz: 10.0 }, 14: { bullets: 6, damage: 30, hz: 11.0 },
  15: { bullets: 8, damage: 34, hz: 12.0 }, 16: { bullets: 8, damage: 38, hz: 13.0 },
  17: { bullets: 8, damage: 42, hz: 14.0 }, 18: { bullets: 8, damage: 48, hz: 15.0 },
  19: { bullets: 8, damage: 55, hz: 16.0 }, 20: { bullets: 10, damage: 65, hz: 18.0 },
};

const ROCKET_TABLE: Record<number, WeaponStats> = {
  1: { bullets: 1, damage: 45, hz: 1.2 }, 2: { bullets: 1, damage: 55, hz: 1.3 },
  3: { bullets: 2, damage: 65, hz: 1.4 }, 4: { bullets: 2, damage: 75, hz: 1.5 },
  5: { bullets: 2, damage: 85, hz: 1.6 }, 6: { bullets: 3, damage: 95, hz: 1.7 },
  7: { bullets: 3, damage: 110, hz: 1.8 }, 8: { bullets: 3, damage: 125, hz: 1.9 },
  9: { bullets: 4, damage: 140, hz: 2.0 }, 10: { bullets: 4, damage: 160, hz: 2.1 },
  11: { bullets: 4, damage: 180, hz: 2.2 }, 12: { bullets: 5, damage: 200, hz: 2.3 },
  13: { bullets: 5, damage: 230, hz: 2.4 }, 14: { bullets: 6, damage: 260, hz: 2.5 },
  15: { bullets: 6, damage: 300, hz: 2.6 }, 16: { bullets: 7, damage: 340, hz: 2.7 },
  17: { bullets: 8, damage: 380, hz: 2.8 }, 18: { bullets: 9, damage: 430, hz: 3.0 },
  19: { bullets: 10, damage: 480, hz: 3.2 }, 20: { bullets: 12, damage: 550, hz: 3.5 },
};

const LASER_TABLE: Record<number, WeaponStats> = {
  1: { bullets: 1, damage: 1.5, hz: 25 }, 2: { bullets: 1, damage: 1.8, hz: 28 },
  3: { bullets: 1, damage: 2.2, hz: 30 }, 4: { bullets: 1, damage: 2.5, hz: 32 },
  5: { bullets: 1, damage: 3.0, hz: 35 }, 6: { bullets: 1, damage: 3.5, hz: 38 },
  7: { bullets: 1, damage: 4.2, hz: 40 }, 8: { bullets: 1, damage: 5.0, hz: 42 },
  9: { bullets: 1, damage: 6.0, hz: 45 }, 10: { bullets: 1, damage: 7.5, hz: 50 },
  11: { bullets: 1, damage: 9.0, hz: 52 }, 12: { bullets: 1, damage: 11, hz: 54 },
  13: { bullets: 1, damage: 13, hz: 56 }, 14: { bullets: 1, damage: 16, hz: 58 },
  15: { bullets: 1, damage: 19, hz: 60 }, 16: { bullets: 1, damage: 23, hz: 62 },
  17: { bullets: 1, damage: 27, hz: 64 }, 18: { bullets: 1, damage: 32, hz: 66 },
  19: { bullets: 1, damage: 38, hz: 68 }, 20: { bullets: 1, damage: 48, hz: 70 },
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
    const stats = table[Math.min(20, Math.max(1, level))];
    return 1 / stats.hz;
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
    const stats = table[Math.min(20, Math.max(1, level))];
    
    const projectiles: Projectile[] = [];
    const speed = wConfig.speed;
    const bulletColor = type === WeaponType.BLASTER ? '#38bdf8' : (type === WeaponType.LASER ? '#22c55e' : (type === WeaponType.HELIX ? '#a855f7' : (playerColor === COLORS.p1Primary ? wConfig.color : playerColor)));
    const shootY = py - 15;
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
      const pairs = count / 2;
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
      // Main Beam
      projectiles.push(new PhotonLaser({x: px, y: shootY}, {x: 0, y: -speed}, dmg, bulletColor, playerId, width));
      
      // Beam Split (Lv 15+)
      if (level >= 15) {
          projectiles.push(new PhotonLaser({x: px - 15, y: shootY}, {x: -300, y: -speed}, dmg * 0.4, bulletColor, playerId, width * 0.5));
          projectiles.push(new PhotonLaser({x: px + 15, y: shootY}, {x: 300, y: -speed}, dmg * 0.4, bulletColor, playerId, width * 0.5));
      }
    }
    return projectiles;
  }

  private static spawnBlasterPattern(projectiles: Projectile[], px: number, py: number, count: number, dmg: number, speed: number, id: string) {
      const spawn = (x: number, y: number, vx: number, vy: number) => {
          projectiles.push(new EggBlasterBullet({x, y}, {x: vx, y: vy}, dmg, id));
      };

      switch (count) {
        case 1: spawn(px, py, 0, -speed); break;
        case 2:
          spawn(px - 12, py, 0, -speed);
          spawn(px + 12, py, 0, -speed);
          break;
        case 3:
          spawn(px, py - 5, 0, -speed);
          spawn(px - 20, py, -80, -speed);
          spawn(px + 20, py, 80, -speed);
          break;
        case 4:
          spawn(px - 10, py - 5, 0, -speed);
          spawn(px + 10, py - 5, 0, -speed);
          spawn(px - 25, py, -120, -speed);
          spawn(px + 25, py, 120, -speed);
          break;
        case 5:
          spawn(px, py - 10, 0, -speed);
          spawn(px - 15, py - 5, 0, -speed);
          spawn(px + 15, py - 5, 0, -speed);
          spawn(px - 35, py, -180, -speed);
          spawn(px + 35, py, 180, -speed);
          break;
        case 6:
          spawn(px - 8, py - 10, 0, -speed);
          spawn(px + 8, py - 10, 0, -speed);
          spawn(px - 24, py - 5, 0, -speed);
          spawn(px + 24, py - 5, 0, -speed);
          spawn(px - 45, py, -240, -speed);
          spawn(px + 45, py, 240, -speed);
          break;
        case 7:
          spawn(px, py - 15, 0, -speed);
          spawn(px - 18, py - 10, 0, -speed);
          spawn(px + 18, py - 10, 0, -speed);
          spawn(px - 32, py - 5, -100, -speed);
          spawn(px + 32, py - 5, 100, -speed);
          spawn(px - 55, py, -300, -speed);
          spawn(px + 55, py, 300, -speed);
          break;
      }
  }
}
