import { Entity, drawOutline } from './BaseEntity';
import { Vector2, PowerUpType, WeaponType } from '../../types';
import { WEAPON_CONFIGS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

export class PowerUp extends Entity {
  rotation: number = 0;
  kind: PowerUpType;
  weaponType: WeaponType; 
  sparkles: {x: number, y: number, life: number}[] = [];

  constructor(pos: Vector2, kind: PowerUpType = PowerUpType.WEAPON) {
    const types = [WeaponType.BLASTER, WeaponType.SHOTGUN, WeaponType.HELIX, WeaponType.ROCKET, WeaponType.LASER];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const color = kind === PowerUpType.HEART ? '#ff4d4d' : WEAPON_CONFIGS[chosenType].color;
    
    super(pos, { x: 0, y: 80 }, 28.5, color); 
    this.kind = kind;
    this.weaponType = chosenType;
    for(let i=0; i<8; i++) this.sparkles.push({x: 0, y: 0, life: Math.random()});
  }

  update(dt: number) { 
    super.update(dt); 
    this.rotation += dt * 5; 
    this.sparkles.forEach(p => {
        p.life -= dt;
        if(p.life <= 0) {
            p.life = 1;
            p.x = (Math.random() - 0.5) * 55;
            p.y = (Math.random() - 0.5) * 55;
        }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); 
    ctx.translate(this.position.x, this.position.y);
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
    ctx.scale(pulse, pulse); 
    
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 45);
    glow.addColorStop(0, this.color + '88');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI*2); ctx.fill();
    
    this.sparkles.forEach(s => {
        ctx.fillStyle = 'white'; ctx.globalAlpha = s.life * 0.7;
        ctx.beginPath(); ctx.arc(s.x, s.y, 3 * s.life, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    if (this.kind === PowerUpType.HEART) {
        this.drawGlowingHeart(ctx);
    } else {
        ctx.rotate(this.rotation * 0.15);
        ctx.fillStyle = this.color; 
        ctx.fillRect(-18, -18, 36, 36);
        drawOutline(ctx, 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
        ctx.strokeRect(-14, -14, 28, 28);
        
        ctx.rotate(-this.rotation * 0.15);
        ctx.fillStyle = 'black'; ctx.font = 'bold 22px sans-serif'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.weaponType[0], 0, -2);
        
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText("LV+", 0, 12);
    }
    ctx.restore();
  }

  private drawGlowingHeart(ctx: CanvasRenderingContext2D) {
      const grad = ctx.createRadialGradient(0, -5, 2, 0, 0, 22);
      grad.addColorStop(0, '#ffbbbb'); grad.addColorStop(1, '#ff3333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.bezierCurveTo(-22, -2, -22, -22, 0, -22);
      ctx.bezierCurveTo(22, -22, 22, -2, 0, 16);
      ctx.fill();
      drawOutline(ctx, 3, '#000');
      ctx.fillStyle = 'white'; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(-7, -12, 6, 9, 0.4, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1.0;
  }
}

export class Particle extends Entity {
  life: number = 1.0;
  decay: number;
  constructor(pos: Vector2, vel: Vector2, color: string, size: number, decaySpeed: number) {
    super(pos, vel, size, color);
    this.decay = decaySpeed;
  }
  update(dt: number) { super.update(dt); this.life -= this.decay * dt; if (this.life <= 0) this.isDead = true; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

export class BackgroundEntity extends Entity {
    constructor(pos: Vector2, vel: Vector2, size: number, color: string) {
        super(pos, vel, size, color);
    }
    update(dt: number) { this.position.x += this.velocity.x * dt; this.position.y += this.velocity.y * dt; }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2); ctx.fill();
    }
}
