
import { Vector2, ZoneType, WeaponType, PowerUpType, PlayerInput } from '../types';
import { COLORS, PLAYER_SIZE, ZONE_CONFIGS, PLAYER_LIVES, PLAYER_SPEED, PLAYER_DRAG, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPON_CONFIGS } from '../constants';

const drawOutline = (ctx: CanvasRenderingContext2D, width: number = 3) => {
    ctx.lineWidth = width;
    ctx.strokeStyle = 'black';
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
    if (this.invulnerableTime > 0) this.invulnerableTime -= dt;
    const targetTilt = this.velocity.x * 0.001;
    this.tilt = this.tilt * 0.9 + targetTilt * 0.1;

    this.position.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.position.x));
    this.position.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.position.y));
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    if (this.invulnerableTime > 0 && Math.floor(Date.now() / 50) % 2 === 0) return;
    
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.tilt);
    
    // Engine flame
    ctx.beginPath();
    const flicker = Math.random() * 5;
    ctx.moveTo(-5, 15); ctx.lineTo(0, 25 + flicker); ctx.lineTo(5, 15);
    ctx.fillStyle = '#f59e0b'; ctx.fill();

    // Body
    ctx.beginPath();
    ctx.fillStyle = (this.color === COLORS.player2 ? '#16a34a' : '#ef4444'); 
    ctx.moveTo(0, -10); ctx.lineTo(-24, 24); ctx.lineTo(24, 24); ctx.closePath();
    ctx.fill(); drawOutline(ctx);

    // Cockpit
    ctx.beginPath();
    ctx.fillStyle = '#e2e8f0'; 
    if (this.flashFrame > 0) ctx.fillStyle = 'white';
    ctx.ellipse(0, 5, 14, 22, 0, 0, Math.PI * 2);
    ctx.fill(); drawOutline(ctx);

    // Core
    ctx.beginPath();
    ctx.fillStyle = this.color; 
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill(); drawOutline(ctx);
    ctx.restore();
  }
}

export class Bullet extends Entity {
  damage: number = 1;
  type: WeaponType;
  age: number = 0;
  baseVelocity: Vector2;
  ownerId: string;
  isEnemy: boolean; 

  constructor(pos: Vector2, vel: Vector2, type: WeaponType, color: string, damage: number, ownerId: string, isEnemy: boolean = false) {
    let size = 6;
    if (type === WeaponType.ROCKET) size = 12;
    else if (type === WeaponType.SHOTGUN) size = 5;
    else if (type === WeaponType.HELIX) size = 7;
    
    super(pos, vel, size, color);
    this.type = type;
    this.damage = damage;
    this.baseVelocity = { ...vel };
    this.ownerId = ownerId;
    this.isEnemy = isEnemy;
  }

  update(dt: number) {
    this.age += dt;
    if (this.type === WeaponType.HELIX) {
      const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
      const wave = Math.cos(this.age * 12) * 180; // Faster wave
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      this.velocity.x = this.baseVelocity.x + perpX * wave;
      this.velocity.y = this.baseVelocity.y + perpY * wave;
    } else if (this.type === WeaponType.ROCKET) {
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

    if (this.isEnemy) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI*2); ctx.fill();
        drawOutline(ctx, 2);
    } else {
        // JUICY BULLET VISUALS
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        if (this.type === WeaponType.BLASTER) {
            // Teardrop shape (Spec)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, -this.radius, this.radius, Math.PI, 0); 
            ctx.lineTo(0, this.radius * 2);
            ctx.closePath();
            ctx.fill();
            // Core shine
            ctx.fillStyle = 'white'; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.ellipse(0, -this.radius * 0.4, this.radius * 0.4, this.radius * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        } 
        else if (this.type === WeaponType.SHOTGUN) {
            // Glowing round pellets
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI*2); ctx.fill();
        }
        else if (this.type === WeaponType.HELIX) {
            // Plasma balls
            const pulse = 1 + Math.sin(this.age * 20) * 0.2;
            ctx.scale(pulse, pulse);
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.ellipse(0, 0, this.radius * 0.4, this.radius * 0.7, 0, 0, Math.PI*2); ctx.fill();
        }
        else if (this.type === WeaponType.ROCKET) {
            // Rocket body
            ctx.fillStyle = '#475569';
            ctx.fillRect(-this.radius/2, -this.radius, this.radius, this.radius * 2);
            ctx.fillStyle = this.color; // Nose cone
            ctx.beginPath(); ctx.moveTo(-this.radius/2, -this.radius); ctx.lineTo(0, -this.radius * 1.8); ctx.lineTo(this.radius/2, -this.radius); ctx.fill();
            // Engine fire
            const flicker = Math.random() * 8;
            ctx.fillStyle = '#f97316';
            ctx.beginPath(); ctx.moveTo(-this.radius/3, this.radius); ctx.lineTo(0, this.radius + 15 + flicker); ctx.lineTo(this.radius/3, this.radius); ctx.fill();
        }
    }
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
    const baseColor = this.flashFrame > 0 ? '#ffffff' : (this.zone === ZoneType.VOLCANO ? '#f97316' : '#ffffff');
    this.drawChibiChicken(ctx, baseColor);
    ctx.restore();
  }

  protected drawChibiChicken(ctx: CanvasRenderingContext2D, color: string) {
      const flap = Math.sin(this.wingFlap) * 7;
      
      // Feet - tiny orange ellipses
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(-10, 18, 5, 3, 0, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.beginPath(); ctx.ellipse(10, 18, 5, 3, 0, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);

      // Wings - flapping
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(-18, 4 + flap, 12, 8, -0.5, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.beginPath(); ctx.ellipse(18, 4 + flap, 12, 8, 0.5, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);

      // Body - Very round chibi style
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 24, 0, 0, Math.PI * 2); ctx.fill(); drawOutline(ctx, 3);

      // Comb - three red spheres on top
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(-6, -22, 6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -25, 7, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -22, 6, 0, Math.PI*2); ctx.fill();

      // Big Chibi Eyes
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-8, -6, 8, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      ctx.beginPath(); ctx.arc(8, -6, 8, 0, Math.PI*2); ctx.fill(); drawOutline(ctx, 2);
      
      // Pupils with reflection
      ctx.fillStyle = 'black';
      ctx.beginPath(); ctx.arc(-8, -6, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -6, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-10, -8, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -8, 2, 0, Math.PI*2); ctx.fill();

      // Beak - cute small triangle
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
    ctx.scale(5, 5); 
    const baseColor = this.flashFrame > 0 ? '#ffffff' : (this.isVulnerable ? '#ef4444' : '#475569');
    
    if (!this.isVulnerable) {
        ctx.beginPath();
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
        ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.15; ctx.fillStyle = '#22d3ee'; ctx.fill(); ctx.globalAlpha = 1.0;
    }

    this.drawChibiChicken(ctx, baseColor);
    
    // Boss Crown - Gold
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
    const types = [WeaponType.BLASTER, WeaponType.SHOTGUN, WeaponType.HELIX, WeaponType.ROCKET];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const color = kind === PowerUpType.HEART ? '#ff4d4d' : WEAPON_CONFIGS[chosenType].color;
    
    super(pos, { x: 0, y: 80 }, 24, color);
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
    ctx.scale(pulse, pulse);

    // Glow Outer Layer
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    glow.addColorStop(0, this.color + '88');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI*2); ctx.fill();

    // Small floating sparkles
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
        
        // Shiny cross reflection
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
      
      // Top shine
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
