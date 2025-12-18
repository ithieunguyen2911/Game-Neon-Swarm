import { Entity, drawOutline } from './BaseEntity';
import { Vector2, WeaponType } from '../../types';
import { Enemy } from './Chicken';

export class Bullet extends Entity {
  damage: number = 1;
  type: WeaponType;
  age: number = 0;
  baseVelocity: Vector2;
  ownerId: string;
  isEnemy: boolean; 
  width: number = 0;
  phase: number = 0;
  pierceCount: number = 0;
  target: Enemy | null = null;

  constructor(pos: Vector2, vel: Vector2, type: WeaponType, color: string, damage: number, ownerId: string, isEnemy: boolean = false) {
    let size = 6.6; 
    if (type === WeaponType.ROCKET) size = 13.2; 
    else if (type === WeaponType.SHOTGUN) size = 5.5; 
    else if (type === WeaponType.HELIX) size = 8.8; 
    else if (type === WeaponType.LASER) size = 16.5; 
    
    super(pos, vel, size, color);
    this.type = type;
    this.damage = damage;
    this.baseVelocity = { ...vel };
    this.ownerId = ownerId;
    this.isEnemy = isEnemy;
    this.width = size;

    if (type === WeaponType.HELIX) {
      this.pierceCount = 3;
    }
  }

  update(dt: number) {
    this.age += dt;
    if (this.type === WeaponType.HELIX) {
      const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
      const freq = 15;
      const amp = 80;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      
      this.position.x += this.baseVelocity.x * dt + (perpX * Math.cos(this.age * freq + this.phase) * amp * freq * dt);
      this.position.y += this.baseVelocity.y * dt + (perpY * Math.cos(this.age * freq + this.phase) * amp * freq * dt);
      return;
    } 
    else if (this.type === WeaponType.LASER) {
      if (this.target && !this.target.isDead) {
          const dx = this.target.position.x - this.position.x;
          const dy = this.target.position.y - this.position.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 5) {
              const targetVelX = (dx / dist) * 4000;
              const targetVelY = (dy / dist) * 4000;
              this.velocity.x = this.velocity.x * 0.7 + targetVelX * 0.3;
              this.velocity.y = this.velocity.y * 0.7 + targetVelY * 0.3;
          }
      } else {
          this.velocity.y = -4000;
      }
    }
    else if (this.type === WeaponType.ROCKET) {
        this.velocity.x *= 1.03;
        this.velocity.y *= 1.03;
    }
    super.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    ctx.rotate(angle + Math.PI/2); 
    ctx.scale(1.1, 1.1); 

    if (this.isEnemy) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI*2); ctx.fill();
        drawOutline(ctx, 2);
    } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        if (this.type === WeaponType.BLASTER) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, -this.radius, this.radius, Math.PI, 0); 
            ctx.lineTo(0, this.radius * 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'white'; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.ellipse(0, -this.radius * 0.4, this.radius * 0.4, this.radius * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        } 
        else if (this.type === WeaponType.SHOTGUN) {
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI*2); ctx.fill();
        }
        else if (this.type === WeaponType.HELIX) {
            const pulse = 1 + Math.sin(this.age * 25) * 0.3;
            ctx.scale(pulse, pulse);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 4, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1.0;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
            grad.addColorStop(0, 'white');
            grad.addColorStop(0.4, '#22d3ee');
            grad.addColorStop(1, '#a855f7');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
        }
        else if (this.type === WeaponType.ROCKET) {
            ctx.fillStyle = '#475569';
            ctx.fillRect(-this.radius/2, -this.radius, this.radius, this.radius * 2);
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.moveTo(-this.radius/2, -this.radius); ctx.lineTo(0, -this.radius * 1.8); ctx.lineTo(this.radius/2, -this.radius); ctx.fill();
            const flicker = Math.random() * 8;
            ctx.fillStyle = '#f97316';
            ctx.beginPath(); ctx.moveTo(-this.radius/3, this.radius); ctx.lineTo(0, this.radius + 15 + flicker); ctx.lineTo(this.radius/3, this.radius); ctx.fill();
        }
        else if (this.type === WeaponType.LASER) {
            const beamLength = 120;
            const w = this.width;
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = this.color;
            ctx.fillRect(-w/2 - 6, 0, w + 12, beamLength);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'white';
            ctx.fillRect(-w/2 + 3, 0, w - 6, beamLength);
            ctx.beginPath();
            ctx.arc(0, 0, w * 0.8, 0, Math.PI*2);
            ctx.fillStyle = 'white'; ctx.fill();
        }
    }
    ctx.restore();
  }
}

export class Explosion extends Entity {
    maxRadius: number;
    life: number = 0.3;
    maxLife: number = 0.3;
    damage: number;
    damagedEnemies: Set<Enemy> = new Set();

    constructor(pos: Vector2, radius: number, damage: number, color: string = '#f97316') {
        super(pos, {x:0, y:0}, 0, color);
        this.maxRadius = radius;
        this.damage = damage;
    }

    update(dt: number) {
        this.life -= dt;
        if (this.life <= 0) this.isDead = true;
        this.radius = (1 - (this.life / this.maxLife)) * this.maxRadius;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, this.radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.3, `rgba(251, 191, 36, ${alpha})`);
        grad.addColorStop(0.7, `rgba(249, 115, 22, ${alpha * 0.5})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }
}
