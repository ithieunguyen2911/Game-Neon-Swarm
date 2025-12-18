import { Entity, drawOutline } from './BaseEntity';
import { ZoneType, WeaponType, PlayerInput } from '../../types';
import {
  PLAYER_SIZE,
  ZONE_CONFIGS,
  PLAYER_LIVES,
  PLAYER_SPEED,
  PLAYER_DRAG,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../../constants';

export class Player extends Entity {
  weaponType: WeaponType = WeaponType.BLASTER;
  weaponLevel = 1;
  invulnerableTime = 0;
  lives = PLAYER_LIVES;

  tilt = 0;
  idleTimer = 0;

  id: string;
  primaryColor: string;
  glowColor: string;

  constructor(
    x: number,
    y: number,
    id: string,
    primaryColor: string,
    glowColor: string
  ) {
    super({ x, y }, { x: 0, y: 0 }, PLAYER_SIZE, primaryColor);
    this.id = id;
    this.primaryColor = primaryColor;
    this.glowColor = glowColor;
  }

  // ===============================
  // TIER SYSTEM (1-5)
  // ===============================
  get tier(): number {
    if (this.weaponLevel >= 20) return 5;
    if (this.weaponLevel >= 15) return 4;
    if (this.weaponLevel >= 10) return 3;
    if (this.weaponLevel >= 5) return 2;
    return 1;
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
      this.velocity.x = this.velocity.x * 0.6 + dx * responseSpeed * 0.4;
      this.velocity.y = this.velocity.y * 0.6 + dy * responseSpeed * 0.4;
    } else if (acc.x !== 0 || acc.y !== 0) {
      const len = Math.hypot(acc.x, acc.y);
      this.velocity.x += (acc.x / len) * PLAYER_SPEED * dt * 10;
      this.velocity.y += (acc.y / len) * PLAYER_SPEED * dt * 10;
    }

    const zonePhys = (ZONE_CONFIGS as any)[zone]?.physics || { drag: PLAYER_DRAG };
    this.velocity.x *= zonePhys.drag || PLAYER_DRAG;
    this.velocity.y *= zonePhys.drag || PLAYER_DRAG;
  }

  update(dt: number) {
    super.update(dt);
    this.idleTimer += dt;
    if (this.invulnerableTime > 0) this.invulnerableTime -= dt;

    const targetTilt = this.velocity.x * 0.0012;
    this.tilt = this.tilt * 0.85 + targetTilt * 0.15;

    this.position.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.position.x));
    this.position.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.position.y));
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    if (this.invulnerableTime > 0 && Math.floor(Date.now() / 60) % 2 === 0) return;

    ctx.save();
    const bobbing = Math.sin(this.idleTimer * 4) * 2;
    const baseScale = 1.1 + this.tier * 0.1;

    ctx.translate(this.position.x, this.position.y + bobbing);
    ctx.rotate(this.tilt);
    ctx.scale(baseScale, baseScale);

    this.drawAfterburners(ctx);
    this.drawShipBody(ctx);
    this.drawTierDecorations(ctx);
    this.drawCore(ctx);
    this.drawWeaponBarrels(ctx);

    ctx.restore();
  }

  private drawAfterburners(ctx: CanvasRenderingContext2D) {
    const flicker = Math.random() * 4;
    const tier = this.tier;

    ctx.save();
    ctx.shadowBlur = 15 + tier * 5;
    ctx.shadowColor = '#f97316';
    ctx.fillStyle = '#f97316';

    // Động cơ chính
    ctx.beginPath(); ctx.arc(-12, 32, 6 + flicker * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 32, 6 + flicker * 0.5, 0, Math.PI * 2); ctx.fill();

    // Động cơ phụ (Tier 5)
    if (tier >= 5) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(-45, 20, 8 + flicker, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(45, 20, 8 + flicker, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  private drawShipBody(ctx: CanvasRenderingContext2D) {
    const tier = this.tier;
    ctx.fillStyle = this.flashFrame > 0 ? '#ffffff' : this.primaryColor;

    // 1. EXTRA WING STRUCTURES (Tier 4+)
    if (tier >= 4) {
        ctx.beginPath();
        ctx.roundRect(-60, 5, 120, 15, 10);
        ctx.fill();
        drawOutline(ctx, 3);
    }

    // 2. MAIN WINGS
    ctx.beginPath();
    ctx.roundRect(-40, 0, 80, 26, 8);
    ctx.fill();
    drawOutline(ctx, 3);

    // 3. MAIN BODY
    ctx.beginPath();
    ctx.ellipse(0, -6, 26, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    drawOutline(ctx, 4);

    // 4. COCKPIT
    const grad = ctx.createLinearGradient(0, -32, 0, 0);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#64748b');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(0, -20, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
    drawOutline(ctx, 2);
  }

  private drawTierDecorations(ctx: CanvasRenderingContext2D) {
    const tier = this.tier;
    ctx.fillStyle = '#1e293b';

    // Tier 3+: Front fins
    if (tier >= 3) {
        ctx.beginPath();
        ctx.moveTo(-10, -38); ctx.lineTo(-18, -25); ctx.lineTo(-10, -15); ctx.closePath();
        ctx.moveTo(10, -38); ctx.lineTo(18, -25); ctx.lineTo(10, -15); ctx.closePath();
        ctx.fill();
        drawOutline(ctx, 2);
    }

    // Tier 5: Heavy Booster Pods
    if (tier >= 5) {
        ctx.fillStyle = this.primaryColor;
        ctx.beginPath();
        ctx.roundRect(-55, -5, 20, 40, 10);
        ctx.roundRect(35, -5, 20, 40, 10);
        ctx.fill();
        drawOutline(ctx, 3);
        
        ctx.fillStyle = '#334155';
        ctx.fillRect(-50, 5, 10, 20);
        ctx.fillRect(40, 5, 10, 20);
    }
  }

  private drawCore(ctx: CanvasRenderingContext2D) {
    const tier = this.tier;
    const pulse = 1 + Math.sin(this.idleTimer * 10) * 0.15;
    const size = 6 + this.weaponLevel * 0.5;

    ctx.save();
    ctx.shadowBlur = 15 + tier * 10;
    ctx.shadowColor = this.glowColor;
    ctx.fillStyle = this.glowColor;

    ctx.beginPath(); ctx.arc(0, 5, size * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(0, 5, size * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  private drawWeaponBarrels(ctx: CanvasRenderingContext2D) {
    const tier = this.tier;
    ctx.fillStyle = '#0f172a';

    // Tier 2+: Wing Barrels
    if (tier >= 2) {
      ctx.fillRect(-45, 10, 10, 15);
      ctx.fillRect(35, 10, 10, 15);
      drawOutline(ctx, 1.5);
    }

    // Tier 3+: Nose Barrels
    if (tier >= 3) {
      ctx.fillRect(-6, -42, 4, 10);
      ctx.fillRect(2, -42, 4, 10);
    }

    // Tier 5: Quad Wing Cannons
    if (tier >= 5) {
      ctx.fillRect(-62, 15, 12, 18);
      ctx.fillRect(50, 15, 12, 18);
      drawOutline(ctx, 2);
    }
  }
}
