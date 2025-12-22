
import { Boss } from './Boss';
import { Vector2, ZoneType, WeaponType } from '../../../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';
import { MotherRenderer } from './renderers/MotherRenderer';
import { StandardBossWeapon } from './controllers/StandardBossWeapon';

export class BossMother extends Boss {
  private attackPatternTimer: number = 0;

  constructor(pos: Vector2, hp: number, name: string, zone: ZoneType, themeColor: string) {
    super(
      pos,
      hp,
      name,
      zone,
      new MotherRenderer(),
      new StandardBossWeapon(WeaponType.HELIX),
      themeColor
    );
  }

  protected updateMovement(dt: number) {
    // Di chuyển chậm rãi ở giữa màn hình, tạo áp lực
    this.position.x = CANVAS_WIDTH / 2 + Math.sin(this.stateTimer * 0.3) * 100;
    this.position.y = 300 + Math.cos(this.stateTimer * 0.5) * 30;
  }

  protected updatePhase() {
    this.attackPatternTimer += 0.016;
    const hpRatio = this.hp / this.maxHp;
    
    // Tăng tốc độ tấn công khi máu thấp
    if (hpRatio < 0.3) this.phase = 3;
    else if (hpRatio < 0.6) this.phase = 2;

    // Boss cuối chỉ vulnerable trong những khoảng thời gian ngắn chớp nhoáng
    this.isVulnerable = (Math.floor(this.stateTimer) % 5) === 0;
  }
}
