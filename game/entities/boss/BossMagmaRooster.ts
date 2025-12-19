
import { Boss } from './Boss';
import { Vector2, ZoneType, WeaponType } from '../../../types';
import { CANVAS_WIDTH } from '../../../constants';
import { MagmaRoosterRenderer } from './renderers/MagmaRoosterRenderer';
import { StandardBossWeapon } from './controllers/StandardBossWeapon';

export class BossMagmaRooster extends Boss {
  constructor(pos: Vector2, hp: number, name: string, zone: ZoneType, themeColor: string) {
    super(
      pos,
      hp,
      name,
      zone,
      new MagmaRoosterRenderer(),
      new StandardBossWeapon(WeaponType.SHOTGUN), // Boss này dùng Shotgun (Feather Spreader)
      themeColor
    );
  }

  protected updateMovement(dt: number) {
    // Di chuyển lên xuống và đảo cánh nhanh (Dash)
    this.position.x = CANVAS_WIDTH / 2 + Math.cos(this.stateTimer * 0.8) * (CANVAS_WIDTH * 0.35);
    this.position.y = 250 + Math.sin(this.stateTimer * 2) * 80;
  }

  protected updatePhase() {
    const hpRatio = this.hp / this.maxHp;
    this.phase = hpRatio < 0.4 ? 2 : 1;
    // Điểm yếu lộ ra khi boss đang ở vị trí biên màn hình (nghỉ ngơi)
    this.isVulnerable = Math.abs(this.position.x - CANVAS_WIDTH/2) > (CANVAS_WIDTH * 0.3);
  }
}
