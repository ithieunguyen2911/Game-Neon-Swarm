import { Projectile } from './Projectile';
import { drawOutline } from '../BaseEntity';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';

export class EggBlasterBullet extends Projectile {
    isPoweredUp: boolean = false;

    constructor(pos: Vector2, vel: Vector2, damage: number, ownerId: string, isEnemy: boolean = false) {
        super(pos, vel, 6.6, isEnemy ? '#ffffff' : '#22d3ee', damage, ownerId, WeaponType.BLASTER, isEnemy);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2);

        const scale = this.isPoweredUp ? 1.25 : 1.0;
        const r = this.radius * scale;
        const pulse = (this.damage > 30) ? (1 + Math.sin(this.age * 25) * 0.1) : 1;
        ctx.scale(pulse, pulse);

        if (this.isEnemy) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(0, 0, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
            drawOutline(ctx, 2, '#000');
            ctx.fillStyle = '#facc15';
            ctx.beginPath(); ctx.arc(0, 2, 4, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.shadowBlur = this.isPoweredUp ? 25 : 15;
            ctx.shadowColor = this.color;
            ctx.fillStyle = '#fefce8';
            ctx.beginPath();
            ctx.moveTo(0, -r * 1.8);
            ctx.bezierCurveTo(-r * 1.2, -r * 0.5, -r * 1.2, r * 1.2, 0, r * 1.2);
            ctx.bezierCurveTo(r * 1.2, r * 1.2, r * 1.2, -r * 0.5, 0, -r * 1.8);
            ctx.fill();
            drawOutline(ctx, 2.5, '#020617');
            ctx.fillStyle = this.isPoweredUp ? '#fde047' : '#22d3ee';
            ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        engine.spawnParticles(impactPos, '#fefce8', 6, 4.0);
        engine.spawnParticles(impactPos, '#ffffff', 4, 6.0);
    }
}