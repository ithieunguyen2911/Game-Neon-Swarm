
import { BossRenderer } from '../BossRenderer';
import { Boss } from '../Boss';
import { drawOutline } from '../../BaseEntity';

const GOLD_LIGHT = '#fde047';
const GOLD_MAIN = '#fbbf24';
const GOLD_DARK = '#b45309';
const GOLD_STROKE = '#78350f';

export class GoldenChickenRenderer implements BossRenderer {
  draw(ctx: CanvasRenderingContext2D, boss: Boss) {
    ctx.save();
    ctx.translate(boss.position.x, boss.position.y);
    
    // 1. Aura uy lực
    this.drawAura(ctx, boss);

    ctx.scale(6.5, 6.5); 

    // 2. Thân
    this.drawBody(ctx, boss);

    // 3. Mỏ
    this.drawBeak(ctx);

    // 4. Mắt
    this.drawEyes(ctx, boss);

    // 5. Vương miện
    this.drawCrown(ctx, boss);

    // 6. Cánh
    const flap = Math.sin(boss.wingFlap);
    const wingColor = boss.flashFrame > 0 ? '#ffffff' : '#fef3c7';
    
    // Tận dụng logic vẽ cánh từ lớp cơ sở (vì boss kế thừa enemy)
    // Ở đây ta gọi hàm vẽ cánh 3 lớp
    this.drawWings(ctx, flap, wingColor);

    ctx.restore();
  }

  private drawAura(ctx: CanvasRenderingContext2D, boss: Boss) {
    ctx.save();
    const pulse = 0.2 + Math.sin(boss.stateTimer * 4) * 0.1;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = boss.isVulnerable ? '#ffffff' : boss.themeColor;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawBody(ctx: CanvasRenderingContext2D, boss: Boss) {
    const flash = boss.flashFrame > 0;
    ctx.fillStyle = flash ? '#ffffff' : '#f8fafc';
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
  }

  private drawBeak(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = GOLD_MAIN;
    ctx.beginPath();
    ctx.roundRect(-17, 2, 34, 17, 9);
    ctx.fill();
    drawOutline(ctx, 3.5, GOLD_STROKE);
  }

  private drawEyes(ctx: CanvasRenderingContext2D, boss: Boss) {
    const color = boss.isVulnerable ? '#ffffff' : '#ef4444';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-16, -11, 13, 16, 0.1, 0, Math.PI * 2);
    ctx.ellipse(16, -11, 13, 16, -0.1, 0, Math.PI * 2);
    ctx.fill();
    drawOutline(ctx, 3.5, '#020617');
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-14, -9, 7, 0, Math.PI * 2);
    ctx.arc(14, -9, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCrown(ctx: CanvasRenderingContext2D, boss: Boss) {
    ctx.fillStyle = GOLD_MAIN;
    ctx.beginPath();
    ctx.moveTo(-20, -42);
    ctx.lineTo(-28, -68); ctx.lineTo(-14, -54);
    ctx.lineTo(-7, -78); ctx.lineTo(0, -58);
    ctx.lineTo(7, -78); ctx.lineTo(14, -54);
    ctx.lineTo(28, -68); ctx.lineTo(20, -42);
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx, 3, GOLD_STROKE);
  }

  private drawWings(ctx: CanvasRenderingContext2D, flap: number, color: string) {
      // Logic vẽ cánh tối giản cho Boss
      [-1, 1].forEach(dir => {
          ctx.save();
          ctx.translate(dir * 15, 0);
          ctx.rotate(dir * flap * 0.5);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.ellipse(dir * 25, 10, 35, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          drawOutline(ctx, 3, '#020617');
          ctx.restore();
      });
  }
}
