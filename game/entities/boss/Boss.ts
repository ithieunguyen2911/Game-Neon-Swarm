
import { Enemy } from '../Chicken';
import { Vector2, EnemyState, EnemyType, ZoneType } from '../../../types';
import { CANVAS_WIDTH } from '../../../constants';
import { BossRenderer } from './BossRenderer';
import { BossWeaponController } from './BossWeaponController';
import { GameEngine } from '../../GameEngine';

export abstract class Boss extends Enemy {
  readonly bossName: string;
  readonly themeColor: string;
  phase: number = 1;
  isVulnerable: boolean = false;

  protected renderer: BossRenderer;
  protected weaponController: BossWeaponController;

  constructor(
    pos: Vector2,
    hp: number,
    name: string,
    zone: ZoneType,
    renderer: BossRenderer,
    weaponController: BossWeaponController,
    themeColor: string
  ) {
    // Boss luôn là Elite type và có kích thước lớn (130)
    super(pos, hp, 130, zone, EnemyType.ELITE);
    this.bossName = name;
    this.themeColor = themeColor;
    this.renderer = renderer;
    this.weaponController = weaponController;
    this.state = EnemyState.FORMATION;
  }

  updateWithEngine(dt: number, engine: GameEngine) {
    super.update(dt);
    this.updateMovement(dt);
    this.weaponController.update(dt, this, engine);
    this.updatePhase();
  }

  // Override update của Enemy để tránh logic mặc định của gà thường
  update(dt: number) {}

  draw(ctx: CanvasRenderingContext2D) {
    this.renderer.draw(ctx, this);
    this.drawBossHpBar(ctx);
  }

  protected abstract updateMovement(dt: number): void;
  protected abstract updatePhase(): void;

  protected drawBossHpBar(ctx: CanvasRenderingContext2D) {
      const barWidth = 1500;
      const x = (CANVAS_WIDTH - barWidth) / 2;
      const y = 80;
      
      // Khung nền
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.beginPath(); 
      ctx.roundRect(x - 15, y - 15, barWidth + 30, 62, 12); 
      ctx.fill();
      
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      const grad = ctx.createLinearGradient(x, 0, x + barWidth, 0);
      grad.addColorStop(0, '#f43f5e'); 
      grad.addColorStop(1, '#ef4444');
      
      // Thanh máu chính
      ctx.fillStyle = this.isVulnerable ? '#ffffff' : grad;
      ctx.fillRect(x, y, barWidth * hpRatio, 32);
      
      // Viền thanh máu
      ctx.strokeStyle = this.themeColor;
      ctx.lineWidth = 5; 
      ctx.strokeRect(x, y, barWidth, 32);
      
      // Tên Boss
      ctx.fillStyle = 'white'; 
      ctx.font = '900 42px sans-serif'; 
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20; 
      ctx.shadowColor = this.themeColor;
      ctx.fillText(this.bossName.toUpperCase(), CANVAS_WIDTH / 2, y - 30);
      ctx.shadowBlur = 0;
  }
}
