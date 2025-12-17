
import { Vector2, WeaponType } from '../types';
import { WEAPON_CONFIGS, COLORS } from '../constants';
import { Bullet } from './Entities';

export class WeaponSystem {
  static fire(
    px: number,
    py: number,
    type: WeaponType,
    level: number,
    playerId: string,
    playerColor: string
  ): Bullet[] {
    const wConfig = WEAPON_CONFIGS[type];
    const bullets: Bullet[] = [];
    const speed = wConfig.speed;
    const bulletColor = playerColor === COLORS.player ? wConfig.color : playerColor;
    const dmg = wConfig.damage + ((level - 1) * 0.5);
    const shootY = py - 15;

    if (type === WeaponType.BLASTER) {
      const count = level === 1 ? 1 : (level === 2 ? 3 : (level === 3 ? 3 : (level === 4 ? 5 : 7)));
      const spread = level === 2 ? 5 : 10;
      
      bullets.push(new Bullet({x: px, y: shootY}, {x: 0, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, playerId));
      
      if (count >= 3) {
        bullets.push(new Bullet({x: px - spread, y: shootY + 5}, {x: -20, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, playerId));
        bullets.push(new Bullet({x: px + spread, y: shootY + 5}, {x: 20, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, playerId));
      }
      if (count >= 5) {
        bullets.push(new Bullet({x: px - spread*2, y: shootY + 10}, {x: -40, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, playerId));
        bullets.push(new Bullet({x: px + spread*2, y: shootY + 10}, {x: 40, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, playerId));
      }
      if (count >= 7) {
        bullets.push(new Bullet({x: px - spread*3, y: shootY + 15}, {x: -80, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, playerId));
        bullets.push(new Bullet({x: px + spread*3, y: shootY + 15}, {x: 80, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, playerId));
      }
    } 
    else if (type === WeaponType.SHOTGUN) {
      const count = 3 + (level * 2);
      const arc = Math.PI / (3.5 - (level * 0.2));
      for(let i=0; i<count; i++) {
        const angle = -Math.PI/2 - (arc/2) + (arc * (i/(count-1)));
        bullets.push(new Bullet(
          {x: px, y: shootY},
          {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed},
          WeaponType.SHOTGUN, bulletColor, dmg, playerId
        ));
      }
    }
    else if (type === WeaponType.HELIX) {
      bullets.push(new Bullet({x: px - 15, y: shootY}, {x: 0, y: -speed}, WeaponType.HELIX, bulletColor, dmg, playerId));
      bullets.push(new Bullet({x: px + 15, y: shootY}, {x: 0, y: -speed}, WeaponType.HELIX, bulletColor, dmg, playerId)); 
      if ([2, 4, 5].includes(level)) {
        bullets.push(new Bullet({x: px, y: shootY}, {x: 0, y: -speed*1.2}, WeaponType.BLASTER, '#ffffff', dmg, playerId));
      }
      if (level >= 3) {
        bullets.push(new Bullet({x: px - 30, y: shootY+10}, {x: 0, y: -speed*0.9}, WeaponType.HELIX, bulletColor, dmg, playerId));
        bullets.push(new Bullet({x: px + 30, y: shootY+10}, {x: 0, y: -speed*0.9}, WeaponType.HELIX, bulletColor, dmg, playerId)); 
      }
      if (level >= 5) {
        bullets.push(new Bullet({x: px - 45, y: shootY+20}, {x: 0, y: -speed*0.8}, WeaponType.HELIX, bulletColor, dmg, playerId));
        bullets.push(new Bullet({x: px + 45, y: shootY+20}, {x: 0, y: -speed*0.8}, WeaponType.HELIX, bulletColor, dmg, playerId)); 
      }
    }
    else if (type === WeaponType.ROCKET) {
      bullets.push(new Bullet({x: px, y: shootY}, {x: 0, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, playerId));
      if (level >= 2) {
        bullets.push(new Bullet({x: px - 20, y: shootY + 10}, {x: -100, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, playerId));
        bullets.push(new Bullet({x: px + 20, y: shootY + 10}, {x: 100, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, playerId));
      }
      if (level >= 4) {
        bullets.push(new Bullet({x: px - 40, y: shootY + 20}, {x: -200, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, playerId));
        bullets.push(new Bullet({x: px + 40, y: shootY + 20}, {x: 200, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, playerId));
      }
      if (level >= 5) {
        bullets.push(new Bullet({x: px - 40, y: shootY + 20}, {x: -400, y: -speed * 0.3}, WeaponType.ROCKET, bulletColor, dmg * 2, playerId));
        bullets.push(new Bullet({x: px + 40, y: shootY + 20}, {x: 400, y: -speed * 0.3}, WeaponType.ROCKET, bulletColor, dmg * 2, playerId));
      }
    }
    return bullets;
  }
}
