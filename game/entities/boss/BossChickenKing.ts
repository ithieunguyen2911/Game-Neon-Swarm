
import { Boss } from './Boss';
import { Vector2, ZoneType, WeaponType } from '../../../types';
import { CANVAS_WIDTH } from '../../../constants';
import { GoldenChickenRenderer } from './renderers/GoldenChickenRenderer';
import { StandardBossWeapon } from './controllers/StandardBossWeapon';

export class BossChickenKing extends Boss {
  constructor(pos: Vector2, hp: number, name: string, zone: ZoneType, themeColor: string) {
    super(
      pos,
      hp,
      name,
      zone,
      new GoldenChickenRenderer(),
      new StandardBossWeapon(WeaponType.BLASTER),
      themeColor
    );
  }

  protected updateMovement(dt: number) {
    // Di chuyển hình số 8 mượt mà
    this.position.x = CANVAS_WIDTH / 2 + Math.sin(this.stateTimer * 0.5) * (CANVAS_WIDTH * 0.25);
    this.position.y = 220 + Math.cos(this.stateTimer * 0.25) * 50;
  }

  protected updatePhase() {
    const hpRatio = this.hp / this.maxHp;
    
    // Chuyển phase khi máu dưới 50%
    if (hpRatio < 0.5) {
        this.phase = 2;
    }

    // Vulnerable logic tùy theo map index (giống logic cũ nhưng đóng gói trong boss)
    // Ở bản demo này ta dùng logic đơn giản: bắn xong thì vulnerable
    this.isVulnerable = Math.sin(this.stateTimer * 2) > 0.4;
  }
}
