
import { Entity, drawOutline } from './BaseEntity';
import { Vector2, ZoneType, EnemyType, EnemyState } from '../../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

export const ENEMY_VISUAL_CONFIG = {
  [EnemyType.NORMAL]: { bodyColor: '#f8fafc', wingColor: '#f1f5f9', eyeGlow: false, armor: false },
  [EnemyType.ARMORED]: { bodyColor: '#cbd5e1', wingColor: '#94a3b8', eyeGlow: true, armor: true },
  [EnemyType.ELITE]: { bodyColor: '#fef3c7', wingColor: '#fbbf24', eyeGlow: true, armor: false },
};

export class Enemy extends Entity {
  hp: number;
  maxHp: number;
  scoreValue: number;
  zone: ZoneType;
  type: EnemyType;
  opacity: number = 1.0;
  
  state: EnemyState = EnemyState.ENTRY;
  formationPos: Vector2 = { x: 0, y: 0 };
  startPos: Vector2 = { x: 0, y: 0 };
  
  rotation: number = 0;
  wingFlap: number = 0;
  shootTimer: number;
  stateTimer: number = 0;
  
  private entryProgress: number = 0;
  private entryDuration: number = 2.0;
  private entryCurveAmp: number = 100;
  private diveTimer: number = 0;

  constructor(pos: Vector2, hp: number, size: number, zone: ZoneType, type: EnemyType = EnemyType.NORMAL) {
    super(pos, { x: 0, y: 0 }, size, '#ffffff');
    this.hp = hp;
    this.maxHp = hp;
    this.zone = zone;
    this.type = type;
    this.scoreValue = Math.floor(hp * 10);
    this.shootTimer = 4 + Math.random() * 8; 
    this.stateTimer = Math.random() * Math.PI * 2;
  }

  setFormationSlot(pos: Vector2, duration: number) {
    this.formationPos = pos;
    this.startPos = { ...this.position };
    this.entryDuration = duration;
    this.entryProgress = 0;
    this.state = EnemyState.ENTRY;
    this.opacity = 0.35;
    this.entryCurveAmp = (Math.random() - 0.5) * 300; 
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  update(dt: number) {
    this.stateTimer += dt;
    this.wingFlap += dt * 8; 
    
    if (this.state !== EnemyState.ENTRY) {
        this.shootTimer -= dt;
        this.opacity = 1.0;
    }

    switch (this.state) {
      case EnemyState.ENTRY:
        this.entryProgress += dt / this.entryDuration;
        const t = Math.min(1, this.entryProgress);
        const easeT = this.easeOutCubic(t);
        this.opacity = 0.35 + (t * 0.65);
        const targetX = this.startPos.x + (this.formationPos.x - this.startPos.x) * easeT;
        const targetY = this.startPos.y + (this.formationPos.y - this.startPos.y) * easeT;
        const curve = Math.sin(t * Math.PI) * this.entryCurveAmp;
        this.position.x = targetX + curve;
        this.position.y = targetY;
        if (t >= 1) {
          this.state = EnemyState.FORMATION;
          this.opacity = 1.0;
        }
        break;

      case EnemyState.FORMATION:
        const wobbleX = Math.sin(this.stateTimer * 1.2) * 12;
        const wobbleY = Math.cos(this.stateTimer * 1.5) * 6;
        this.position.x = this.formationPos.x + wobbleX;
        this.position.y = this.formationPos.y + wobbleY;
        if (Math.random() < 0.0003) {
          this.state = EnemyState.DIVE;
          this.diveTimer = 0;
        }
        break;

      case EnemyState.DIVE:
        this.velocity.y = 550;
        this.velocity.x = Math.sin(this.diveTimer * 4) * 180;
        this.diveTimer += dt;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        if (this.position.y > CANVAS_HEIGHT + 150) {
          this.position.y = -150;
          this.state = EnemyState.RETURN;
        }
        break;

      case EnemyState.RETURN:
        const rdx = this.formationPos.x - this.position.x;
        const rdy = this.formationPos.y - this.position.y;
        const dist = Math.hypot(rdx, rdy);
        if (dist < 15) {
          this.state = EnemyState.FORMATION;
        } else {
          this.position.x += (rdx / dist) * 450 * dt;
          this.position.y += (rdy / dist) * 450 * dt;
        }
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.state === EnemyState.ENTRY) {
        this.drawEntryStreak(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    const bobY = Math.sin(this.stateTimer * 4) * 3;
    const squash = 1 + Math.sin(this.stateTimer * 8) * 0.02;
    const stretch = 1 - Math.sin(this.stateTimer * 8) * 0.01;
    
    ctx.translate(this.position.x, this.position.y + bobY);
    ctx.scale(stretch * 1.15, squash * 1.15); 
    
    this.drawBiologicalChicken(ctx, this.flashFrame > 0, this.state === EnemyState.ENTRY);
    ctx.restore();

    if (this.hp < this.maxHp && this.state !== EnemyState.ENTRY) this.drawHpBar(ctx);
  }

  private drawEntryStreak(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.1})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.moveTo(this.startPos.x, this.startPos.y);
      ctx.quadraticCurveTo(
          (this.startPos.x + this.formationPos.x) / 2 + this.entryCurveAmp,
          (this.startPos.y + this.formationPos.y) / 2,
          this.position.x, this.position.y
      );
      ctx.stroke();
      ctx.restore();
  }

  private drawHpBar(ctx: CanvasRenderingContext2D) {
    const barWidth = 70; const barHeight = 8;
    const x = this.position.x - barWidth / 2;
    const y = this.position.y - this.radius - 35;
    ctx.fillStyle = '#020617';
    ctx.beginPath(); ctx.roundRect(x - 2, y - 2, barWidth + 4, barHeight + 4, 4); ctx.fill();
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio < 0.3 ? '#ef4444' : (hpRatio < 0.6 ? '#f59e0b' : '#22c55e');
    ctx.beginPath(); ctx.roundRect(x, y, barWidth * hpRatio, barHeight, 2); ctx.fill();
  }

  protected drawBiologicalChicken(ctx: CanvasRenderingContext2D, isFlashing: boolean, isHint: boolean) {
    const cfg = ENEMY_VISUAL_CONFIG[this.type];
    const flap = Math.sin(this.wingFlap);
    const bodyColor = isHint ? '#94a3b8' : (isFlashing ? '#ffffff' : cfg.bodyColor);
    const wingColor = isHint ? '#64748b' : (isFlashing ? '#ffffff' : cfg.wingColor);

    [-1, 1].forEach(dir => {
      this.drawThreeLayerWing(ctx, dir, flap, wingColor, isHint);
    });

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -28, 15, 13, 0, 0, Math.PI * 2);
    ctx.moveTo(-13, -18);
    ctx.quadraticCurveTo(-28, -2, -26, 18);
    ctx.quadraticCurveTo(-22, 38, 0, 40);
    ctx.quadraticCurveTo(22, 38, 26, 18);
    ctx.quadraticCurveTo(28, -2, 13, -18);
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx, isHint ? 2 : 4, isHint ? '#1e293b' : '#020617');

    if (!isHint) {
        this.drawAdvancedComb(ctx);
    }

    if (!isHint) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-14, -6, 12, 0, Math.PI * 2); ctx.arc(14, -6, 12, 0, Math.PI * 2); ctx.fill();
        drawOutline(ctx, 3);
        ctx.fillStyle = (cfg.eyeGlow && Math.sin(Date.now() / 150) > 0.5) ? '#ef4444' : '#020617';
        ctx.beginPath(); ctx.arc(-12, -4, 5, 0, Math.PI * 2); ctx.arc(12, -4, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(-10, 8);
        ctx.quadraticCurveTo(0, 22, 10, 8);
        ctx.quadraticCurveTo(0, 4, -10, 8);
        ctx.fill();
        drawOutline(ctx, 2.5);

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.roundRect(-20, 38, 14, 6, 3); ctx.roundRect(6, 38, 14, 6, 3);
        ctx.fill();
        drawOutline(ctx, 2);
    }
  }

  private drawThreeLayerWing(ctx: CanvasRenderingContext2D, dir: number, flap: number, color: string, isHint: boolean) {
    ctx.save();
    ctx.translate(dir * 10, 0); 
    
    ctx.save();
    ctx.rotate(dir * flap * 0.4);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(dir * 8, 6, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    drawOutline(ctx, isHint ? 1.5 : 2.5, isHint ? '#1e293b' : '#020617');
    ctx.restore();

    ctx.save();
    ctx.rotate(dir * flap * 0.7);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(dir * 6, 4);
    ctx.quadraticCurveTo(dir * 30, 16, dir * 38, 30);
    ctx.quadraticCurveTo(dir * 24, 26, dir * 12, 18);
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx, isHint ? 1.5 : 3, isHint ? '#1e293b' : '#020617');
    ctx.restore();

    ctx.save();
    ctx.rotate(dir * flap * 1.1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(dir * 4, 0);
    ctx.quadraticCurveTo(dir * 40, 10, dir * 55, 26);
    ctx.quadraticCurveTo(dir * 35, 30, dir * 14, 20);
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx, isHint ? 1.5 : 3, isHint ? '#1e293b' : '#020617');
    ctx.restore();

    ctx.restore();
  }

  private drawAdvancedComb(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const combWobble = Math.sin(this.stateTimer * 6) * 0.15;
    ctx.translate(0, -32);
    ctx.rotate(combWobble);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(-10, -22, -4, -14);
    ctx.quadraticCurveTo(0, -30, 6, -18);
    ctx.quadraticCurveTo(14, -28, 18, -10);
    ctx.quadraticCurveTo(12, 0, 0, 2);
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx, 3);
    ctx.restore();
  }
}
