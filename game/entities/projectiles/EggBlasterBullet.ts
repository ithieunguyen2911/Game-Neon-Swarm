
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';
import { drawOutline } from '../BaseEntity';
import * as PIXI from 'pixi.js';

export class EggBlasterBullet extends Projectile {
    isPoweredUp: boolean = false;

    constructor(
        pos: Vector2,
        vel: Vector2,
        damage: number,
        ownerId: string,
        isEnemy: boolean = false
    ) {
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

        if (this.isEnemy) {
            const er = r * 1.95;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, er * 0.9, er * 1.25, 0, 0, Math.PI * 2);
            ctx.fill();
            drawOutline(ctx, 2.5, '#000000');
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(0, er * 0.25, er * 0.45, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.shadowBlur = this.isPoweredUp ? 30 : 20;
            ctx.shadowColor = this.color;
            ctx.fillStyle = '#fefce8';
            ctx.beginPath();
            ctx.moveTo(0, -r * 2.0);
            ctx.bezierCurveTo(-r * 1.4, -r * 0.6, -r * 1.2,  r * 1.4, 0, r * 1.5);
            ctx.bezierCurveTo(r * 1.2, r * 1.4, r * 1.4, -r * 0.6, 0, -r * 2.0);
            ctx.fill();
            drawOutline(ctx, this.isPoweredUp ? 3.5 : 3, '#020617');
            ctx.fillStyle = this.isPoweredUp ? '#fde047' : '#22d3ee';
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.5, r * 0.75, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    renderPixi(view: any, time: number) {
        const scale = this.isPoweredUp ? 1.3 : 1.1;
        const r = this.radius * scale;
        const pulse = this.damage > 30 ? 1 + Math.sin(time * 25) * 0.1 : 1;
        const color = PIXI.Color.shared.setValue(this.isPoweredUp ? '#fde047' : this.color).toNumber();

        if (this.isEnemy) {
            const er = r * 1.95;
            // Vẽ hình quả trứng cho kẻ thù
            view.main.ellipse(0, 0, er * 0.9, er * 1.25)
                .fill(0xffffff)
                .stroke({ width: 2.5, color: 0x000000 });
            // Vẽ lòng đỏ (vàng)
            view.core.circle(0, er * 0.25, er * 0.45).fill(0xfacc15);
            // Hiệu ứng hào quang mờ
            view.glow.circle(0, 0, er * 1.5).fill({ color: 0xffffff, alpha: 0.1 });
        } else {
            // Vẽ đạn của người chơi (hình giọt nước / plasma)
            // 1. Hào quang (Glow)
            view.glow.circle(0, 0, r * 4.5 * pulse).fill({ color, alpha: this.isPoweredUp ? 0.2 : 0.12 });
            
            // 2. Thân đạn Plasma
            view.main.moveTo(0, -r * 2.0)
                .bezierCurveTo(-r * 1.4, -r * 0.6, -r * 1.2, r * 1.4, 0, r * 1.5)
                .bezierCurveTo(r * 1.2, r * 1.4, r * 1.4, -r * 0.6, 0, -r * 2.0)
                .fill(0xfefce8)
                .stroke({ width: this.isPoweredUp ? 3.5 : 3, color: 0x020617 });
                
            // 3. Lõi năng lượng (Core)
            view.core.ellipse(0, 0, r * 0.5, r * 0.75).fill(color);

            // 4. Hiệu ứng flare đặc biệt cho đạn cường hóa
            if (this.isPoweredUp) {
                const flareSize = r * 1.8;
                view.extra.moveTo(-flareSize, -r * 0.5).lineTo(flareSize, -r * 0.5).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
            }
        }
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        // Hiệu ứng hạt tung ra rực rỡ khi va chạm
        engine.spawnParticles(impactPos, '#fefce8', 8, 250);
        engine.spawnParticles(impactPos, '#ffffff', 6, 350);
    }
}
