
import { Enemy } from './Chicken';
import { drawOutline } from './BaseEntity';
import { Vector2, ZoneType, EnemyType, EnemyState, WeaponType } from '../../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

const GOLD_LIGHT = '#fde047';
const GOLD_MAIN = '#fbbf24';
const GOLD_DARK = '#b45309';
const GOLD_STROKE = '#78350f';

export class Boss extends Enemy {
  isVulnerable: boolean = false;
  bossName: string;
  bossWeapon: WeaponType = WeaponType.BLASTER;
  themeColor: string = '#22d3ee'; // Mặc định là Cyan

  constructor(pos: Vector2, hp: number, name: string, zone: ZoneType, themeColor: string = '#22d3ee') {
    super(pos, hp, 130, zone, EnemyType.ELITE);
    this.bossName = name;
    this.state = EnemyState.FORMATION;
    this.themeColor = themeColor;
  }

  update(dt: number) {
    super.update(dt);
    // Boss "thở - rung - uy lực": Nhịp thở nhẹ nhàng nhưng đầy sức nặng
    this.position.x = CANVAS_WIDTH / 2 + Math.sin(this.stateTimer * 0.5) * (CANVAS_WIDTH * 0.25);
    this.position.y = 220 + Math.cos(this.stateTimer * 0.25) * 50;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    
    // 1. Aura uy lực (Đổi màu theo theme)
    this.drawBossAura(ctx);

    ctx.scale(6.5, 6.5); 

    // 2. Thân Boss
    this.drawBossBody(ctx);

    // 3. Mỏ vàng kim ống ánh ✨
    this.drawBossBeak(ctx);

    // 4. Mắt Oval phát sáng 👁️
    this.drawBossEyes(ctx);

    // 5. Vương miện năng lượng 👑
    this.drawBossCrown(ctx);

    // 6. Cánh Boss
    const flap = Math.sin(this.wingFlap);
    const wingColor = this.flashFrame > 0 ? '#ffffff' : '#fef3c7';
    [-1, 1].forEach(dir => {
      // @ts-ignore - access protected method from parent
      this.drawThreeLayerWing(ctx, dir, flap, wingColor, false);
    });

    ctx.restore();
    
    // 7. Thanh máu Boss
    this.drawBossHpBar(ctx);
  }

  private drawBossAura(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const pulse = 0.2 + Math.sin(this.stateTimer * 4) * 0.1;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = this.isVulnerable ? '#ffffff' : this.themeColor;
    ctx.lineWidth = 12;
    
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, Math.PI * 2);
    ctx.stroke();
    
    // Vòng cơ khí dash line
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 80]);
    ctx.rotate(-this.stateTimer * 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, 410, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawBossBody(ctx: CanvasRenderingContext2D) {
    const flash = this.flashFrame > 0;
    const bodyColor = flash ? '#ffffff' : '#f8fafc';
    
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -30, 21, 17, 0, 0, Math.PI * 2);
    ctx.moveTo(-20, -15);
    ctx.quadraticCurveTo(-38, 15, -32, 40);
    ctx.quadraticCurveTo(-25, 55, 0, 58);
    ctx.quadraticCurveTo(25, 55, 32, 40);
    ctx.quadraticCurveTo(38, 15, 20, -15);
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx, 4, '#020617');

    // Lõi năng lượng (CORE)
    if (!flash) {
        const corePulse = 1 + Math.sin(this.stateTimer * 10) * 0.2;
        ctx.save();
        ctx.shadowBlur = 25 * corePulse;
        ctx.shadowColor = this.themeColor;
        ctx.fillStyle = this.isVulnerable ? '#ffffff' : this.themeColor;
        ctx.beginPath();
        ctx.arc(0, 20, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
  }

  private drawBossBeak(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = GOLD_MAIN;
    const grad = ctx.createLinearGradient(0, -6, 0, 14);
    grad.addColorStop(0, GOLD_LIGHT);
    grad.addColorStop(0.6, GOLD_MAIN);
    grad.addColorStop(1, GOLD_DARK);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-17, 2, 34, 17, 9);
    ctx.fill();
    drawOutline(ctx, 3.5, GOLD_STROKE);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-11, 7); ctx.lineTo(11, 7); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = GOLD_DARK;
    ctx.beginPath();
    ctx.roundRect(-13, 15, 26, 11, 6);
    ctx.fill();
    drawOutline(ctx, 2.5, GOLD_STROKE);
    ctx.restore();
  }

  private drawBossEyes(ctx: CanvasRenderingContext2D) {
    const glow = 1 + Math.sin(this.stateTimer * 7) * 0.2;
    const color = this.isVulnerable ? '#ffffff' : '#ef4444';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-16, -11, 13, 16, 0.1, 0, Math.PI * 2);
    ctx.ellipse(16, -11, 13, 16, -0.1, 0, Math.PI * 2);
    ctx.fill();
    drawOutline(ctx, 3.5, '#020617');
    ctx.save();
    ctx.shadowBlur = 18 * glow;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-14, -9, 7 * glow, 0, Math.PI * 2);
    ctx.arc(14, -9, 7 * glow, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBossCrown(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const pulse = 1 + Math.sin(this.stateTimer * 2) * 0.05;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = GOLD_MAIN;
    ctx.shadowBlur = 30;
    ctx.shadowColor = GOLD_MAIN;
    ctx.beginPath();
    ctx.moveTo(-20, -42);
    ctx.lineTo(-28, -68); ctx.lineTo(-14, -54);
    ctx.lineTo(-7, -78); ctx.lineTo(0, -58);
    ctx.lineTo(7, -78); ctx.lineTo(14, -54);
    ctx.lineTo(28, -68); ctx.lineTo(20, -42);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -78, 0, -42);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, GOLD_MAIN);
    grad.addColorStop(1, GOLD_DARK);
    ctx.fillStyle = grad;
    ctx.fill();
    drawOutline(ctx, 3, GOLD_STROKE);
    ctx.restore();
  }

  private drawBossHpBar(ctx: CanvasRenderingContext2D) {
      const barWidth = 1500;
      const x = (CANVAS_WIDTH - barWidth) / 2;
      const y = 80;
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.beginPath(); ctx.roundRect(x - 15, y - 15, barWidth + 30, 62, 12); ctx.fill();
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      const grad = ctx.createLinearGradient(x, 0, x + barWidth, 0);
      grad.addColorStop(0, '#f43f5e'); grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = this.isVulnerable ? '#ffffff' : grad;
      ctx.fillRect(x, y, barWidth * hpRatio, 32);
      ctx.strokeStyle = this.themeColor;
      ctx.lineWidth = 5; ctx.strokeRect(x, y, barWidth, 32);
      ctx.fillStyle = 'white'; ctx.font = 'black 52px sans-serif'; ctx.textAlign = 'center';
      ctx.shadowBlur = 20; ctx.shadowColor = this.themeColor;
      ctx.fillText(this.bossName.toUpperCase(), CANVAS_WIDTH / 2, y - 30);
      ctx.shadowBlur = 0;
  }
}
