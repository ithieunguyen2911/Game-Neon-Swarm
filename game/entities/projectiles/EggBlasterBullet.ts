
import { Projectile } from './Projectile';
import { drawOutline } from '../BaseEntity';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';

export class EggBlasterBullet extends Projectile {
    isPoweredUp: boolean = false;

    constructor(
        pos: Vector2,
        vel: Vector2,
        damage: number,
        ownerId: string,
        isEnemy: boolean = false
    ) {
        // Tăng rõ kích thước trứng kẻ địch lên 15% (từ 9.2 lên 10.6)
        const baseRadius = isEnemy ? 10.6 : 8.2;
        super(
            pos,
            vel,
            baseRadius,
            isEnemy ? '#ffffff' : '#22d3ee',
            damage,
            ownerId,
            WeaponType.BLASTER,
            isEnemy
        );
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2);

        const scale = this.isPoweredUp ? 1.3 : 1.1;
        const r = this.radius * scale;

        const pulse =
            this.damage > 30
                ? 1 + Math.sin(this.age * 25) * 0.1
                : 1;

        ctx.scale(pulse, pulse);

        // =========================
        // 🐔 ENEMY EGG
        // =========================
        if (this.isEnemy) {
            const er = r * 1.95;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(
                0,
                0,
                er * 0.9,
                er * 1.25,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            drawOutline(ctx, 2.5, '#000000');

            // Lòng đỏ (Yolk)
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(0, er * 0.25, er * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        // =========================
        // 🚀 PLAYER EGG (BLASTER)
        // =========================
        else {
            ctx.shadowBlur = this.isPoweredUp ? 30 : 20;
            ctx.shadowColor = this.color;
            ctx.fillStyle = '#fefce8';

            ctx.beginPath();
            ctx.moveTo(0, -r * 2.0);

            ctx.bezierCurveTo(
                -r * 1.4, -r * 0.6,
                -r * 1.2,  r * 1.4,
                 0,          r * 1.5
            );

            ctx.bezierCurveTo(
                 r * 1.2,  r * 1.4,
                 r * 1.4, -r * 0.6,
                 0,       -r * 2.0
            );

            ctx.fill();

            drawOutline(
                ctx,
                this.isPoweredUp ? 3.5 : 3,
                '#020617'
            );

            ctx.fillStyle = this.isPoweredUp ? '#fde047' : '#22d3ee';
            ctx.beginPath();
            ctx.ellipse(
                0,
                0,
                r * 0.5,
                r * 0.75,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        engine.spawnParticles(impactPos, '#fefce8', 8, 4.5);
        engine.spawnParticles(impactPos, '#ffffff', 6, 6.5);
    }
}