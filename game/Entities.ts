import { Vector2, ZoneType, WeaponType, PowerUpType } from '../types';
import { COLORS, PLAYER_SIZE, ZONE_CONFIGS, PLAYER_LIVES } from '../constants';

const drawOutline = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 3;
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
  isRemote: boolean = false;
  id: string;
  remoteFireTimer: number = 0;

  constructor(x: number, y: number, id: string = 'local', color: string = COLORS.player, isRemote: boolean = false) {
    super({ x, y }, { x: 0, y: 0 }, PLAYER_SIZE, color);
    this.id = id;
    this.isRemote = isRemote;
  }

  update(dt: number) {
    super.update(dt);
    if (this.invulnerableTime > 0) {
      this.invulnerableTime -= dt;
    }
    const targetTilt = this.velocity.x * 0.001;
    this.tilt = this.tilt * 0.9 + targetTilt * 0.1;
    
    if (this.remoteFireTimer > 0) this.remoteFireTimer -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    // Blink if invulnerable
    if (this.invulnerableTime > 0 && Math.floor(Date.now() / 50) % 2 === 0) return;
    
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.tilt);
    
    // -- TOY ROCKET DESIGN --
    // 1. Engine Flame
    ctx.beginPath();
    const flicker = Math.random() * 5;
    ctx.moveTo(-5, 15);
    ctx.lineTo(0, 25 + flicker);
    ctx.lineTo(5, 15);
    ctx.fillStyle = '#f59e0b'; 
    ctx.fill();
    ctx.closePath();

    // 2. Wings
    ctx.beginPath();
    ctx.fillStyle = this.isRemote ? '#64748b' : (this.color === COLORS.player2 ? '#16a34a' : '#ef4444'); 
    ctx.moveTo(0, -10);
    ctx.lineTo(-24, 24); // Scaled up
    ctx.lineTo(24, 24);  // Scaled up
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx);

    // 3. Main Fuselage
    ctx.beginPath();
    ctx.fillStyle = '#e2e8f0'; 
    if (this.flashFrame > 0) ctx.fillStyle = 'white';
    ctx.ellipse(0, 5, 14, 22, 0, 0, Math.PI * 2); // Scaled up
    ctx.fill();
    drawOutline(ctx);

    // 4. Cockpit
    ctx.beginPath();
    ctx.fillStyle = this.color; 
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    drawOutline(ctx);

    // 5. Reflection
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.6;
    ctx.arc(-3, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    if (this.isRemote) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("P2", 0, -30);
    }

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
    // Increased bullet sizes by ~10%
    const size = type === WeaponType.ROCKET ? 11 : (type === WeaponType.SHOTGUN ? 5 : 6);
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
      const speed = Math.sqrt(this.baseVelocity.x**2 + this.baseVelocity.y**2);
      const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
      const waveAmplitude = 150;
      const waveFreq = 10;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      const wave = Math.cos(this.age * waveFreq) * waveAmplitude;
      this.velocity.x = this.baseVelocity.x + perpX * wave;
      this.velocity.y = this.baseVelocity.y + perpY * wave;
    } else if (this.type === WeaponType.ROCKET) {
        // Rocket accelerates
        this.velocity.x *= 1.02;
        this.velocity.y *= 1.02;
    }

    super.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    // Align rotation with velocity
    ctx.rotate(angle + Math.PI/2); 

    if (this.isEnemy) {
        // Draw EGG
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI*2); // Scaled
        ctx.fill();
        drawOutline(ctx);
        // Highlight
        ctx.fillStyle = '#fbbf24'; 
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(2, -2, 3, 0, Math.PI*2);
        ctx.fill();
    } else if (this.type === WeaponType.ROCKET) {
        // Draw ROCKET
        ctx.fillStyle = this.color; 
        
        // Body
        ctx.beginPath();
        ctx.moveTo(0, -17);
        ctx.lineTo(9, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-9, 6);
        ctx.closePath();
        ctx.fill();
        drawOutline(ctx);

        // Thruster flame
        if (Math.random() > 0.3) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(-4, 7);
            ctx.lineTo(0, 17);
            ctx.lineTo(4, 7);
            ctx.fill();
        }
    } else {
        // Standard Lasers
        ctx.rotate(-Math.PI/2); 
        ctx.rotate(angle); 
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        if (this.type === WeaponType.BLASTER) {
            if (ctx.roundRect) ctx.roundRect(-11, -5, 22, 9, 4); // Scaled
            else ctx.rect(-11, -5, 22, 9);
        } else if (this.type === WeaponType.SHOTGUN) {
            ctx.arc(0, 0, 6, 0, Math.PI*2); // Scaled
        } else {
            this.drawStar(ctx, 0, 0, 5, 7, 4); // Scaled
        }
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(0, 0, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
  }

  drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
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
  
  // Shooting Logic
  shootTimer: number;

  constructor(pos: Vector2, vel: Vector2, hp: number, size: number, zone: ZoneType) {
    const color = ZONE_CONFIGS[zone].colors.enemy;
    super(pos, vel, size, color);
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
    this.wingFlap += dt * 10; 
    
    // Shoot Logic
    this.shootTimer -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    const wobble = Math.sin(this.rotation) * 0.2;
    ctx.rotate(wobble);

    const baseColor = this.flashFrame > 0 ? '#ffffff' : (this.zone === ZoneType.SKY ? '#ffffff' : '#b45309');
    
    // Scale drawing context lightly for simple scaling of existing draw paths
    ctx.scale(1.1, 1.1);

    if (this.zone === ZoneType.SKY) {
        this.drawSpaceChicken(ctx, baseColor);
    } else {
        this.drawRoastedChicken(ctx, baseColor);
    }

    if (this.maxHp > 3 && this.hp < this.maxHp) {
        ctx.rotate(-wobble);
        ctx.fillStyle = 'black';
        ctx.fillRect(-16, -30, 32, 6);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-15, -29, 30 * (this.hp / this.maxHp), 4);
    }

    ctx.restore();
  }

  drawSpaceChicken(ctx: CanvasRenderingContext2D, color: string) {
      const flap = Math.sin(this.wingFlap) * 5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(-15, 5 + flap, 10, 6, -0.5, 0, Math.PI*2);
      ctx.fill();
      drawOutline(ctx);
      
      ctx.beginPath();
      ctx.ellipse(15, 5 + flap, 10, 6, 0.5, 0, Math.PI*2);
      ctx.fill();
      drawOutline(ctx);

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      drawOutline(ctx);

      this.drawEyes(ctx);

      ctx.beginPath();
      ctx.fillStyle = '#facc15'; 
      ctx.moveTo(-5, 5);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 15);
      ctx.closePath();
      ctx.fill();
      drawOutline(ctx);

      ctx.beginPath();
      ctx.fillStyle = '#ef4444';
      ctx.arc(0, -18, 5, 0, Math.PI*2);
      ctx.arc(-6, -16, 4, 0, Math.PI*2);
      ctx.arc(6, -16, 4, 0, Math.PI*2);
      ctx.fill();
      drawOutline(ctx);
  }

  drawRoastedChicken(ctx: CanvasRenderingContext2D, color: string) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI*2); 
      ctx.fill();
      drawOutline(ctx);

      ctx.beginPath();
      ctx.ellipse(-10, -10, 6, 12, -0.5, 0, Math.PI*2);
      ctx.fill();
      drawOutline(ctx);
      
      ctx.beginPath();
      ctx.ellipse(10, -10, 6, 12, 0.5, 0, Math.PI*2);
      ctx.fill();
      drawOutline(ctx);

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-6, 5, 5, 0, Math.PI*2);
      ctx.arc(6, 5, 5, 0, Math.PI*2);
      ctx.fill();
      drawOutline(ctx);

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-2, 4);
      ctx.moveTo(10, 0); ctx.lineTo(2, 4);
      ctx.stroke();

      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(-6, 5, 2, 0, Math.PI*2);
      ctx.arc(6, 5, 2, 0, Math.PI*2);
      ctx.fill();
  }

  drawEyes(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-6, -5, 6, 0, Math.PI*2);
      ctx.fill();
      drawOutline(ctx);

      ctx.beginPath();
      ctx.arc(6, -5, 6, 0, Math.PI*2);
      ctx.fill();
      drawOutline(ctx);

      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(-6, -5, 2, 0, Math.PI*2);
      ctx.arc(6, -5, 2, 0, Math.PI*2);
      ctx.fill();
  }
}

export class Particle extends Entity {
  life: number = 1.0;
  decay: number;

  constructor(pos: Vector2, vel: Vector2, color: string, size: number, decaySpeed: number) {
    super(pos, vel, size, color);
    this.decay = decaySpeed;
  }

  update(dt: number) {
    super.update(dt);
    this.life -= this.decay * dt;
    if (this.life <= 0) this.isDead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.position.x, this.position.y, this.radius, this.radius * 0.6, Math.random(), 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

export class BackgroundEntity extends Entity {
    type: 'CLOUD' | 'EMBER';
    
    constructor(pos: Vector2, vel: Vector2, size: number, color: string, type: 'CLOUD' | 'EMBER') {
        super(pos, vel, size, color);
        this.type = type;
    }

    update(dt: number) {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.type === 'CLOUD') {
            const gradient = ctx.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, this.radius);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.globalAlpha = 0.6 + Math.sin(Date.now()/100) * 0.4;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y - this.radius);
            ctx.lineTo(this.position.x + this.radius, this.position.y);
            ctx.lineTo(this.position.x, this.position.y + this.radius);
            ctx.lineTo(this.position.x - this.radius, this.position.y);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

export class PowerUp extends Entity {
  rotation: number = 0;
  kind: PowerUpType; // WEAPON or HEART
  weaponType: WeaponType; 

  constructor(pos: Vector2, kind: PowerUpType = PowerUpType.WEAPON) {
    super(pos, { x: 0, y: 50 }, 18, COLORS.powerup); // Radius Increased
    this.kind = kind;
    
    // Randomize weapon type drop
    const types = [WeaponType.BLASTER, WeaponType.SHOTGUN, WeaponType.HELIX, WeaponType.ROCKET];
    this.weaponType = types[Math.floor(Math.random() * types.length)];
  }

  update(dt: number) {
      super.update(dt);
      this.rotation += dt * 2;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    const scale = 1 + Math.sin(Date.now() / 150) * 0.1;
    ctx.scale(scale, scale);
    ctx.rotate(Math.sin(this.rotation) * 0.5);

    if (this.kind === PowerUpType.HEART) {
        // Draw HEART
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        
        const size = 15;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.5);
        ctx.bezierCurveTo(size, -size * 0.5, size * 2, size * 0.5, 0, size * 1.5);
        ctx.bezierCurveTo(-size * 2, size * 0.5, -size, -size * 0.5, 0, size * 0.5);
        ctx.fill();
        ctx.stroke();

    } else {
        // Draw Weapon Box
        // Color based on weapon type
        let color = '#facc15';
        if (this.weaponType === WeaponType.SHOTGUN) color = '#22d3ee';
        if (this.weaponType === WeaponType.HELIX) color = '#a855f7';
        if (this.weaponType === WeaponType.ROCKET) color = '#f97316';

        ctx.fillStyle = color; 
        ctx.beginPath();
        
        if (ctx.roundRect) {
            ctx.roundRect(-12, -12, 24, 24, 6);
        } else {
            ctx.rect(-12, -12, 24, 24);
        }
        
        ctx.fill();
        drawOutline(ctx);
        
        // Icon inside
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
  }
}