import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';

export class FeatherShotgunBullet extends Projectile {
    private trailPositions: Vector2[] = [];
    private maxTrails = 3;

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string) {
        // Randomize neon colors slightly for variety
        const neonColors = ['#ff00ff', '#bf00ff', '#00ffff'];
        const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        super(pos, vel, 8, randomColor, damage, ownerId, WeaponType.SHOTGUN);
    }

    update(dt: number) {
        // Save trail for visual juice
        this.trailPositions.unshift({ ...this.position });
        if (this.trailPositions.length > this.maxTrails) this.trailPositions.pop();
        
        super.update(dt);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2);

        // Draw elongated rhombus (feather shape)
        const w = this.radius * 0.6;
        const h = this.radius * 2.2;

        // Draw trail in Canvas (Simple version)
        this.trailPositions.forEach((pos, i) => {
            const alpha = (1 - i / this.maxTrails) * 0.3;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            // Draw a ghost feather
        });

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.fillStyle = '#ffffff'; // White core
        ctx.beginPath();
        ctx.moveTo(0, -h); 
        ctx.lineTo(w, 0); 
        ctx.lineTo(0, h); 
        ctx.lineTo(-w, 0);
        ctx.closePath();
        ctx.fill();

        // Neon outline
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        // Spawn "Light Strands" instead of circles
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            // We use standard particles but they will be rendered as strands in specialized engine methods if needed
            engine.spawnParticles(impactPos, this.color, 1, 4.0);
        }
    }
}