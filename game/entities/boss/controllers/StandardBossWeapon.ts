
import { BossWeaponController } from '../BossWeaponController';
import { Boss } from '../Boss';
import { GameEngine } from '../../../GameEngine';
import { WeaponSystem } from '../../../WeaponSystem';
import { WeaponType } from '../../../../types';
import { audio } from '../../../../services/AudioSynthesizer';

export class StandardBossWeapon implements BossWeaponController {
  private fireCooldown: number = 0;
  private weaponType: WeaponType;

  constructor(type: WeaponType = WeaponType.BLASTER) {
      this.weaponType = type;
  }

  update(dt: number, boss: Boss, engine: GameEngine) {
    this.fireCooldown -= dt;

    if (this.fireCooldown <= 0) {
      this.fire(boss, engine);
      // Tốc độ bắn nhanh dần theo phase
      this.fireCooldown = boss.phase === 1 ? 4.5 : 2.5;
    }
  }

  private fire(boss: Boss, engine: GameEngine) {
    const px = boss.position.x;
    const py = boss.position.y + 120;
    const bossLevel = 4 + engine.currentMapIndex * 2;
    
    const projectiles = WeaponSystem.fire(px, py, this.weaponType, bossLevel, 'enemy', boss.themeColor);
    
    projectiles.forEach(proj => {
        proj.isEnemy = true;
        proj.velocity.y *= -1.3; 
        proj.velocity.x *= 1.3;
        proj.radius *= engine.worldScale * 1.6; 
        engine.bullets.push(proj);
    });

    audio.playShoot();
  }
}
