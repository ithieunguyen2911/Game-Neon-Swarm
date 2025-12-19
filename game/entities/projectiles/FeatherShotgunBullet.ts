
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';
import { drawOutline } from '../BaseEntity';

export class FeatherShotgunBullet extends Projectile {
    private trailPositions: Vector2[] = [];
    private maxTrails = 12; // Tăng từ 1 lên 12 để thấy rõ hiệu ứng đuôi

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string) {
        const neonColors = ['#ff00ff', '#bf00ff', '#00ffff'];
        const randomColor = color || neonColors[Math.floor(Math.random() * neonColors.length)];
        super(pos, vel, 8, randomColor, damage, ownerId, WeaponType.SHOTGUN);
    }

    update(dt: number) {
        // Lưu vị trí cũ để tạo hiệu ứng đuôi (Juice)
        this.trailPositions.unshift({ ...this.position });
        if (this.trailPositions.length > this.maxTrails) this.trailPositions.pop();
        
        super.update(dt);
    }

    draw(ctx: CanvasRenderingContext2D) {
        const w = this.radius * 0.8;
        const h = this.radius * 2.2;
        const angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;

        // Vẽ đuôi (Trail)
        ctx.save();
        this.trailPositions.forEach((pos, i) => {
            const alpha = (1 - i / this.maxTrails) * 0.25;
            if (alpha <= 0) return;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(angle);
            const scale = 1 - (i / this.maxTrails);
            ctx.scale(scale, scale);
            // Hình thoi cho đuôi
            ctx.moveTo(0, -h); ctx.lineTo(w, 0); ctx.lineTo(0, h); ctx.lineTo(-w, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        ctx.restore();

        // Vẽ đạn chính
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.fillStyle = '#ffffff'; 
        ctx.beginPath();
        ctx.moveTo(0, -h); ctx.lineTo(w, 0); ctx.lineTo(0, h); ctx.lineTo(-w, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        engine.spawnParticles(impactPos, this.color, 8, 4.0);
    }
}
