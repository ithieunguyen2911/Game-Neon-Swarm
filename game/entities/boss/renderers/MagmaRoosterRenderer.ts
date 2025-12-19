
import { BossRenderer } from '../BossRenderer';
import { Boss } from '../Boss';
import { drawOutline } from '../../BaseEntity';

export class MagmaRoosterRenderer implements BossRenderer {
  draw(ctx: CanvasRenderingContext2D, boss: Boss) {
    ctx.save();
    ctx.translate(boss.position.x, boss.position.y);
    
    // 1. Heat Aura (Vầng sáng nhiệt lượng)
    this.drawHeatAura(ctx, boss);

    ctx.scale(7.5, 7.5); // Kích thước to hơn chút

    // 2. Thân (Màu đỏ dung nham)
    this.drawBody(ctx, boss);

    // 3. Mỏ & Chi tiết
    this.drawBeak(ctx);
    this.drawEyes(ctx, boss);

    // 4. Mào lửa
    this.drawFireComb(ctx, boss);

    // 5. Cánh rồng
    const flap = Math.sin(boss.wingFlap);
    this.drawDragonWings(ctx, flap, boss);

    ctx.restore();
  }

  private drawHeatAura(ctx: CanvasRenderingContext2D, boss: Boss) {
    ctx.save();
    const pulse = 0.3 + Math.sin(boss.stateTimer * 6) * 0.15;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 400);
    grad.addColorStop(0, boss.isVulnerable ? 'rgba(255,255,255,0.4)' : 'rgba(249, 115, 22, 0.4)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(0, 0, 400, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  private drawBody(ctx: CanvasRenderingContext2D, boss: Boss) {
    const flash = boss.flashFrame > 0;
    ctx.fillStyle = flash ? '#ffffff' : (boss.isVulnerable ? '#ef4444' : '#450a0a');
    ctx.beginPath();
    ctx.ellipse(0, -30, 22, 18, 0, 0, Math.PI * 2);
    ctx.moveTo(-22, -15);
    ctx.quadraticCurveTo(-45, 15, -35, 45);
    ctx.quadraticCurveTo(-25, 60, 0, 62);
    ctx.quadraticCurveTo(25, 60, 35, 45);
    ctx.quadraticCurveTo(45, 15, 22, -15);
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx, 4, '#1a0505');
  }

  private drawBeak(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.roundRect(-15, 5, 30, 20, 10);
    ctx.fill();
    drawOutline(ctx, 3, '#1a0505');
  }

  private drawEyes(ctx: CanvasRenderingContext2D, boss: Boss) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-14, -12, 12, 15, 0.2, 0, Math.PI * 2);
    ctx.ellipse(14, -12, 12, 15, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = boss.isVulnerable ? '#facc15' : '#ef4444';
    ctx.beginPath();
    ctx.arc(-12, -10, 6, 0, Math.PI * 2);
    ctx.arc(12, -10, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFireComb(ctx: CanvasRenderingContext2D, boss: Boss) {
    ctx.save();
    const flicker = Math.sin(boss.stateTimer * 20) * 5;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-20, -45);
    ctx.lineTo(-25, -75 + flicker); ctx.lineTo(-10, -55);
    ctx.lineTo(0, -90 + flicker); ctx.lineTo(10, -55);
    ctx.lineTo(25, -75 + flicker); ctx.lineTo(20, -45);
    ctx.closePath();
    ctx.fill();
    drawOutline(ctx, 3, '#1a0505');
    ctx.restore();
  }

  private drawDragonWings(ctx: CanvasRenderingContext2D, flap: number, boss: Boss) {
    [-1, 1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * 20, 0);
      ctx.rotate(dir * flap * 0.6);
      ctx.fillStyle = boss.isVulnerable ? '#ffffff' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dir * 80, -30);
      ctx.lineTo(dir * 70, 40);
      ctx.lineTo(dir * 40, 20);
      ctx.lineTo(dir * 30, 50);
      ctx.closePath();
      ctx.fill();
      drawOutline(ctx, 3.5, '#1a0505');
      ctx.restore();
    });
  }
}
