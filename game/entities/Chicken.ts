
import { Entity, drawOutline } from './BaseEntity';
import { Vector2, ZoneType, EnemyType } from '../../types';
import { CANVAS_WIDTH } from '../../constants';

export const ENEMY_VISUAL_CONFIG = {
  [EnemyType.NORMAL]: {
    bodyColor: '#f8fafc',
    wingColor: '#94a3b8',
    eyeGlow: false,
    armor: false,
  },
  [EnemyType.ARMORED]: {
    bodyColor: '#e5e7eb',
    wingColor: '#64748b',
    eyeGlow: true,
    armor: true,
  },
  [EnemyType.ELITE]: {
    bodyColor: '#fde68a',
    wingColor: '#f59e0b',
    eyeGlow: true,
    armor: false,
  },
};

export class Enemy extends Entity {
  hp: number;
  maxHp: number;
  scoreValue: number;
  zone: ZoneType;
  type: EnemyType;
  rotation: number = 0;
  rotationSpeed: number;
  wingFlap: number = 0;
  shootTimer: number;

  constructor(pos: Vector2, vel: Vector2, hp: number, size: number, zone: ZoneType, type: EnemyType = EnemyType.NORMAL) {
    super(pos, vel, size, '#ffffff');
    this.hp = hp;
    this.maxHp = hp;
    this.zone = zone;
    this.type = type;
    this.scoreValue = hp * 10;
    this.rotationSpeed = (Math.random() - 0.5) * 1.5;
    this.shootTimer = 1.5 + Math.random() * 4;
  }

  update(dt: number) {
    super.update(dt);
    this.rotation += this.rotationSpeed * dt;
    this.wingFlap += dt * 10; 
    this.shootTimer -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    const wobble = Math.sin(this.rotation) * 0.12;
    ctx.rotate(wobble);
    ctx.scale(1.15, 1.15); 
    
    const isFlashing = this.flashFrame > 0;
    this.drawChickenInvader(ctx, isFlashing);
    
    ctx.restore();
  }

  protected drawChickenInvader(ctx: CanvasRenderingContext2D, isFlashing: boolean) {
    const cfg = ENEMY_VISUAL_CONFIG[this.type];
    const flap = Math.sin(this.wingFlap) * 0.9;

    // 1. Armor Ring (Optional)
    if (cfg.armor) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 6, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Body (Egg Shape)
    const grad = ctx.createRadialGradient(0, -18, 5, 0, 0, 44);
    grad.addColorStop(0, isFlashing ? '#ffffff' : cfg.bodyColor);
    grad.addColorStop(1, isFlashing ? '#ffffff' : '#94a3b8');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 6, 34, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    drawOutline(ctx, 4);

    // 3. Wings (Fat & Big)
    ctx.fillStyle = isFlashing ? '#ffffff' : cfg.wingColor;
    [-1, 1].forEach(dir => {
      ctx.save();
      ctx.translate(36 * dir, 10);
      ctx.rotate(dir * (0.6 + flap));
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      drawOutline(ctx, 3);
      ctx.restore();
    });

    // 4. Comb
    ctx.fillStyle = '#ef4444';
    [-10, 0, 10].forEach((x, i) => {
      ctx.beginPath();
      ctx.arc(x, -34 - i * 2, 7 + i, 0, Math.PI * 2);
      ctx.fill();
      drawOutline(ctx, 2);
    });

    // 5. Eyes (Big & Dumb)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-14, -6, 12, 0, Math.PI * 2);
    ctx.arc(14, -6, 12, 0, Math.PI * 2);
    ctx.fill();
    drawOutline(ctx, 3);

    ctx.fillStyle = (cfg.eyeGlow && Math.sin(Date.now() / 120) > 0.6) ? '#ef4444' : '#020617';
    ctx.beginPath();
    ctx.arc(-12, -4, 5, 0, Math.PI * 2);
    ctx.arc(12, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Beak
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(-10, 6, 20, 14, 6);
    ctx.fill();
    drawOutline(ctx, 3);

    // 7. Feet
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(-16, 40, 10, 5, 3);
    ctx.roundRect(6, 40, 10, 5, 3);
    ctx.fill();
    drawOutline(ctx, 2);
  }
}

export class Boss extends Enemy {
  isVulnerable: boolean = false;
  bossName: string;
  stateTimer: number = 0;
  maxHp: number;

  constructor(pos: Vector2, hp: number, name: string, zone: ZoneType) {
    super(pos, { x: 0, y: 0 }, hp, 130, zone, EnemyType.ELITE);
    this.bossName = name;
    this.maxHp = hp;
  }

  update(dt: number) {
    this.stateTimer += dt;
    this.position.x = CANVAS_WIDTH / 2 + Math.sin(this.stateTimer * 0.8) * (CANVAS_WIDTH * 0.35);
    this.position.y = 220 + Math.cos(this.stateTimer * 0.4) * 100;
    super.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(6.0, 6.0); 
    
    if (!this.isVulnerable) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
        ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.1 + Math.sin(this.stateTimer * 5) * 0.05;
        ctx.fillStyle = '#22d3ee'; ctx.fill();
        ctx.restore();
    }

    this.drawChickenInvader(ctx, this.flashFrame > 0);

    // Boss Crown
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 15; ctx.shadowColor = '#fbbf24';
    ctx.beginPath(); 
    ctx.moveTo(-14, -40); ctx.lineTo(-20, -55); ctx.lineTo(-8, -48); 
    ctx.lineTo(0, -65); ctx.lineTo(8, -48); ctx.lineTo(20, -55); 
    ctx.lineTo(14, -40); ctx.fill();
    drawOutline(ctx, 1);
    ctx.shadowBlur = 0;

    ctx.restore();
    this.drawHpBar(ctx);
  }

  private drawHpBar(ctx: CanvasRenderingContext2D) {
      const barWidth = 1200;
      const x = (CANVAS_WIDTH - barWidth) / 2;
      const y = 80;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(x, y, barWidth, 32);
      const hpRatio = this.hp / this.maxHp;
      const grad = ctx.createLinearGradient(x, 0, x + barWidth, 0);
      grad.addColorStop(0, '#ef4444'); grad.addColorStop(1, '#f87171');
      ctx.fillStyle = this.isVulnerable ? '#ffffff' : grad;
      ctx.fillRect(x + 4, y + 4, (barWidth - 8) * hpRatio, 24);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(x, y, barWidth, 32);
      ctx.fillStyle = 'white'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(this.bossName, CANVAS_WIDTH / 2, y - 18);
  }
}
