
import { Vector2, ZoneType, WeaponType, PowerUpType, PlayerInput } from '../types';
import { COLORS, PLAYER_SIZE, ZONE_CONFIGS, PLAYER_LIVES, PLAYER_SPEED, PLAYER_DRAG, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPON_CONFIGS } from '../constants';

const drawOutline = (ctx: CanvasRenderingContext2D, width: number = 2.5) => {
    ctx.lineWidth = width;
    ctx.strokeStyle = '#020617'; // Viền xanh đen đậm cực sắc nét
    ctx.stroke();
}

export abstract class Entity {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  isDead: boolean = false;
  color: string;
  flashFrame: number = 0;

  constructor(pos: Vector2, vel: Vector2, radius: number, color: string) {
    this.position = pos;
    this.velocity = vel;
    this.radius = radius;
    this.color = color;
  }

  update(dt: number) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    if (this.flashFrame > 0) this.flashFrame--;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;

  hit() {
    this.flashFrame = 3;
  }
}

export class Player extends Entity {
  weaponType: WeaponType = WeaponType.BLASTER;
  weaponLevel: number = 1;
  invulnerableTime: number = 0;
  lives: number = PLAYER_LIVES; 
  tilt: number = 0; 
  id: string;
  idleTimer: number = 0; // Dùng cho hiệu ứng nhấp nhô

  constructor(x: number, y: number, id: string = 'local', color: string = COLORS.player) {
    super({ x, y }, { x: 0, y: 0 }, PLAYER_SIZE, color);
    this.id = id;
  }

  handleInput(dt: number, input: PlayerInput, zone: ZoneType) {
    const acc = { x: 0, y: 0 };
    if (input.left) acc.x -= 1;
    if (input.right) acc.x += 1;
    if (input.up) acc.y -= 1;
    if (input.down) acc.y += 1;

    if (input.usePointer && input.pointer) {
      const dx = input.pointer.x - this.position.x;
      const dy = input.pointer.y - this.position.y;
      const responseSpeed = 15;
      this.velocity.x = this.velocity.x * 0.6 + (dx * responseSpeed) * 0.4;
      this.velocity.y = this.velocity.y * 0.6 + (dy * responseSpeed) * 0.4;
    } else {
      if (acc.x !== 0 || acc.y !== 0) {
        const len = Math.sqrt(acc.x * acc.x + acc.y * acc.y);
        this.velocity.x += (acc.x / len) * PLAYER_SPEED * dt * 10;
        this.velocity.y += (acc.y / len) * PLAYER_SPEED * dt * 10;
      }
      const zonePhys = (ZONE_CONFIGS as any)[zone]?.physics || { drag: PLAYER_DRAG };
      this.velocity.x *= zonePhys.drag || PLAYER_DRAG;
      this.velocity.y *= zonePhys.drag || PLAYER_DRAG;
    }
  }

  update(dt: number) {
    super.update(dt);
    this.idleTimer += dt;
    if (this.invulnerableTime > 0) this.invulnerableTime -= dt;
    
    // Smooth Tilt
    const targetTilt = (this.velocity.x * 0.001);
    this.tilt = this.tilt * 0.85 + targetTilt * 0.15;

    this.position.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.position.x));
    this.position.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.position.y));
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    if (this.invulnerableTime > 0 && Math.floor(Date.now() / 50) % 2 === 0) return;
    
    ctx.save();
    
    // Idle bobbing effect
    const bobbing = Math.sin(this.idleTimer * 4) * 2;
    ctx.translate(this.position.x, this.position.y + bobbing);
    ctx.rotate(this.tilt);
    ctx.scale(1.2, 1.2); // Maintain the size scale

    this.drawEngine(ctx);
    this.drawShipBody(ctx);
    this.drawCore(ctx);
    this.drawWeaponBarrels(ctx);

    ctx.restore();
  }

  private drawEngine(ctx: CanvasRenderingContext2D) {
      const flicker = Math.random() * 6;
      const isHighLevel = this.weaponLevel >= 15;
      const engineColor = isHighLevel ? '#38bdf8' : '#f59e0b';
      
      ctx.fillStyle = engineColor;
      
      if (this.weaponLevel < 10) {
          // Single Engine
          ctx.beginPath();
          ctx.moveTo(-6, 18); ctx.lineTo(0, 32 + flicker); ctx.lineTo(6, 18); ctx.fill();
      } else {
          // Dual Engines
          ctx.beginPath();
          ctx.moveTo(-16, 15); ctx.lineTo(-12, 28 + flicker); ctx.lineTo(-8, 15); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(16, 15); ctx.lineTo(12, 28 + flicker); ctx.lineTo(8, 15); ctx.fill();
          
          if (isHighLevel) {
              // Center high-energy trail
              ctx.globalAlpha = 0.6;
              ctx.beginPath();
              ctx.moveTo(-4, 18); ctx.lineTo(0, 45 + flicker * 2); ctx.lineTo(4, 18); ctx.fill();
              ctx.globalAlpha = 1.0;
          }
      }
  }

  private drawShipBody(ctx: CanvasRenderingContext2D) {
      const lv = this.weaponLevel;
      
      // Main Body (Diamond/Triangle Silhouette)
      ctx.beginPath();
      ctx.fillStyle = this.flashFrame > 0 ? '#ffffff' : '#1e40af'; // Dark Blue
      ctx.moveTo(0, -28); // Sharp Nose
      
      // Side Wings based on Level
      const wingWidth = 24 + (lv > 10 ? 8 : 0) + (lv > 18 ? 4 : 0);
      const wingBack = 18 + (lv > 15 ? 4 : 0);
      
      ctx.lineTo(-wingWidth, wingBack); 
      ctx.lineTo(-8, wingBack - 4);
      ctx.lineTo(-6, wingBack + 4);
      ctx.lineTo(6, wingBack + 4);
      ctx.lineTo(8, wingBack - 4);
      ctx.lineTo(wingWidth, wingBack);
      ctx.closePath();
      ctx.fill();
      drawOutline(ctx);

      // Nose / Cockpit Detail
      ctx.beginPath();
      ctx.fillStyle = '#94a3b8'; // Silver/Gray
      ctx.moveTo(0, -26);
      ctx.lineTo(-10, 4);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();
      drawOutline(ctx, 1.5);

      // Fin Details for High Level
      if (lv >= 11) {
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath(); ctx.moveTo(-wingWidth, wingBack); ctx.lineTo(-wingWidth - 8, wingBack + 10); ctx.lineTo(-wingWidth + 4, wingBack + 4); ctx.fill(); drawOutline(ctx, 1);
          ctx.beginPath(); ctx.moveTo(wingWidth, wingBack); ctx.lineTo(wingWidth + 8, wingBack + 10); ctx.lineTo(wingWidth - 4, wingBack + 4); ctx.fill(); drawOutline(ctx, 1);
      }
  }

  private drawCore(ctx: CanvasRenderingContext2D) {
      const pulse = 1 + Math.sin(this.idleTimer * 10) * 0.15;
      const coreSize = 7 + (this.weaponLevel / 5);
      
      ctx.save();
      ctx.shadowBlur = 15 * pulse;
      ctx.shadowColor = '#22d3ee';
      ctx.fillStyle = '#22d3ee'; // Cyan Core
      ctx.beginPath();
      ctx.arc(0, 2, coreSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner core glow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 2, coreSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  }

  private drawWeaponBarrels(ctx: CanvasRenderingContext2D) {
      const lv = this.weaponLevel;
      ctx.fillStyle = '#475569'; // Gunmetal
      
      if (lv >= 6) {
          // Double barrels near nose
          ctx.fillRect(-12, -4, 4, 12); drawOutline(ctx, 1);
          ctx.fillRect(8, -4, 4, 12); drawOutline(ctx, 1);
      }
      
      if (lv >= 16) {
          // Hardpoints on wings
          ctx.fillRect(-22, 10, 5, 8); drawOutline(ctx, 1);
          ctx.fillRect(17, 10, 5, 8); drawOutline(ctx, 1);
      }
  }
}

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
      const wave = Math.sin(this.age * freq + this.phase) * amp;
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

export class Enemy extends Entity {
  hp: number;
  maxHp: number;
  scoreValue: number;
  rotation: number = 0;
  rotationSpeed: number;
  zone: ZoneType;
  wingFlap: number = 0;
  shootTimer: number;

  constructor(pos: Vector2, vel: Vector2, hp: number, size: number, zone: ZoneType) {
    super(pos, vel, size, '#ffffff');
    this.hp = hp;
    this.maxHp = hp;
    this.scoreValue = hp * 10;
    this.rotationSpeed = (Math.random() - 0.5) * 2;
    this.zone = zone;
    this.shootTimer = 2 + Math.random() * 6;
  }

  update(dt: number) {
    super.update(dt);
    this.rotation += this.rotationSpeed * dt;
    this.wingFlap += dt * 12; 
    this.shootTimer -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    const wobble = Math.sin(this.rotation) * 0.15;
    ctx.rotate(wobble);
    ctx.scale(1.2, 1.2); 
    const baseColor = this.flashFrame > 0 ? '#ffffff' : (this.zone === ZoneType.VOLCANO ? '#f97316' : '#ffffff');
    this.drawChibiChicken(ctx, baseColor);
    ctx.restore();
  }

  protected drawChibiChicken(ctx: CanvasRenderingContext2D, color: string) {
      const flap = Math.sin(this.wingFlap) * 7;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(-10, 18, 5, 3, 0, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.beginPath(); ctx.ellipse(10, 18, 5, 3, 0, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(-18, 4 + flap, 12, 8, -0.5, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.beginPath(); ctx.ellipse(18, 4 + flap, 12, 8, 0.5, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 24, 0, 0, Math.PI * 2); ctx.fill(); drawOutline(ctx, 3);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(-6, -22, 6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -25, 7, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -22, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-8, -6, 8, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.beginPath(); ctx.arc(8, -6, 8, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.fillStyle = 'black';
      ctx.beginPath(); ctx.arc(-8, -6, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -6, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-10, -8, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -8, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(0, 16, 6, 6); ctx.quadraticCurveTo(0, 8, -6, 6);
      ctx.fill(); drawOutline(ctx, 2);
  }
}

export class Boss extends Enemy {
  isVulnerable: boolean = false;
  bossName: string;
  stateTimer: number = 0;
  maxHp: number;

  constructor(pos: Vector2, hp: number, name: string, zone: ZoneType) {
    super(pos, { x: 0, y: 0 }, hp, 130, zone);
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
    const baseColor = this.flashFrame > 0 ? '#ffffff' : (this.isVulnerable ? '#ef4444' : '#475569');
    if (!this.isVulnerable) {
        ctx.beginPath();
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
        ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.15; ctx.fillStyle = '#22d3ee'; ctx.fill(); ctx.globalAlpha = 1.0;
    }
    this.drawChibiChicken(ctx, baseColor);
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.moveTo(-12, -28); ctx.lineTo(-18, -38); ctx.lineTo(-6, -32); ctx.lineTo(0, -45); ctx.lineTo(6, -32); ctx.lineTo(18, -38); ctx.lineTo(12, -28); ctx.fill();
    drawOutline(ctx, 1);
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

export class PowerUp extends Entity {
  rotation: number = 0;
  kind: PowerUpType;
  weaponType: WeaponType; 
  sparkles: {x: number, y: number, life: number}[] = [];

  constructor(pos: Vector2, kind: PowerUpType = PowerUpType.WEAPON) {
    const types = [WeaponType.BLASTER, WeaponType.SHOTGUN, WeaponType.HELIX, WeaponType.ROCKET, WeaponType.LASER];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const color = kind === PowerUpType.HEART ? '#ff4d4d' : WEAPON_CONFIGS[chosenType].color;
    
    super(pos, { x: 0, y: 80 }, 26.4, color); 
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
            p.x = (Math.random() - 0.5) * 50;
            p.y = (Math.random() - 0.5) * 50;
        }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); 
    ctx.translate(this.position.x, this.position.y);
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
    ctx.scale(pulse * 1.1, pulse * 1.1); 
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    glow.addColorStop(0, this.color + '88');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI*2); ctx.fill();
    this.sparkles.forEach(s => {
        ctx.fillStyle = 'white'; ctx.globalAlpha = s.life * 0.7;
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.5 * s.life, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    if (this.kind === PowerUpType.HEART) {
        this.drawGlowingHeart(ctx);
    } else {
        ctx.rotate(this.rotation * 0.1);
        ctx.fillStyle = this.color; 
        ctx.fillRect(-16, -16, 32, 32);
        drawOutline(ctx, 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        ctx.strokeRect(-12, -12, 24, 24);
        ctx.rotate(-this.rotation * 0.1);
        ctx.fillStyle = 'black'; ctx.font = 'bold 20px sans-serif'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.weaponType[0], 0, 2);
    }
    ctx.restore();
  }

  private drawGlowingHeart(ctx: CanvasRenderingContext2D) {
      const grad = ctx.createRadialGradient(0, -5, 2, 0, 0, 20);
      grad.addColorStop(0, '#ff9999'); grad.addColorStop(1, '#ff3333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.bezierCurveTo(-20, -2, -20, -20, 0, -20);
      ctx.bezierCurveTo(20, -20, 20, -2, 0, 14);
      ctx.fill();
      drawOutline(ctx, 3);
      ctx.fillStyle = 'white'; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(-6, -10, 5, 8, 0.4, 0, Math.PI*2); ctx.fill();
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
