
import { BossRenderer } from '../BossRenderer';
import { Boss } from '../Boss';
import { drawOutline } from '../../BaseEntity';

export class MotherRenderer implements BossRenderer {
  draw(ctx: CanvasRenderingContext2D, boss: Boss) {
    ctx.save();
    ctx.translate(boss.position.x, boss.position.y);
    
    // 1. Void Aura
    const pulse = 0.4 + Math.sin(boss.stateTimer * 2) * 0.2;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
    grad.addColorStop(0.6, 'rgba(88, 28, 135, 0.1)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(0, 0, 500, 0, Math.PI * 2); ctx.fill();

    // 2. Floating Cores (Lõi duy trì sự sống)
    this.drawOrbitingCores(ctx, boss);

    ctx.scale(8, 8);

    // 3. Main Body (Dark Matter)
    const flash = boss.flashFrame > 0;
    ctx.fillStyle = flash ? '#ffffff' : (boss.isVulnerable ? '#a855f7' : '#1e1b4b');
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.bezierCurveTo(-50, -20, -40, 40, 0, 50);
    ctx.bezierCurveTo(40, 40, 50, -20, 0, -40);
    ctx.fill();
    drawOutline(ctx, 3, '#020617');

    // 4. The Eye of Omega
    this.drawEye(ctx, boss);

    ctx.restore();
  }

  private drawOrbitingCores(ctx: CanvasRenderingContext2D, boss: Boss) {
    const coreCount = 4;
    for (let i = 0; i < coreCount; i++) {
      const angle = (boss.stateTimer * 1.5) + (i * Math.PI * 2 / coreCount);
      const radius = 220 + Math.sin(boss.stateTimer * 3) * 20;
      const cx = Math.cos(angle) * radius;
      const cy = Math.sin(angle) * radius;

      ctx.save();
      ctx.translate(cx, cy);
      
      // Vẽ tia nối với boss
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-cx, -cy); ctx.stroke();

      // Vẽ lõi
      const corePulse = 1 + Math.sin(boss.stateTimer * 10 + i) * 0.2;
      ctx.fillStyle = '#a855f7';
      ctx.shadowBlur = 20; ctx.shadowColor = '#a855f7';
      ctx.beginPath(); ctx.arc(0, 0, 25 * corePulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(0, 0, 10 * corePulse, 0, Math.PI * 2); ctx.fill();
      
      ctx.restore();
    }
  }

  private drawEye(ctx: CanvasRenderingContext2D, boss: Boss) {
    const eyePulse = 1 + Math.sin(boss.stateTimer * 5) * 0.1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, -5, 15 * eyePulse, 20 * eyePulse, 0, 0, Math.PI * 2); ctx.fill();
    drawOutline(ctx, 2, '#020617');
    
    ctx.fillStyle = '#ef4444';
    const lookX = Math.sin(boss.stateTimer) * 5;
    const lookY = Math.cos(boss.stateTimer) * 5;
    ctx.beginPath(); ctx.arc(lookX, -5 + lookY, 6, 0, Math.PI * 2); ctx.fill();
  }
}
