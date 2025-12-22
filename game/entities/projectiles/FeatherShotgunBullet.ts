
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';
import { drawOutline } from '../BaseEntity';
import * as PIXI from 'pixi.js';

export class FeatherShotgunBullet extends Projectile {
    private trailPositions: { pos: Vector2, alpha: number, scale: number, rotation: number }[] = [];
    private maxTrails = 8;
    private rotationOffset: number = Math.random() * Math.PI;

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string) {
        const neonColors = ['#22d3ee', '#818cf8', '#2dd4bf'];
        const randomColor = color || neonColors[Math.floor(Math.random() * neonColors.length)];
        super(pos, vel, 9, randomColor, damage, ownerId, WeaponType.SHOTGUN);
    }

    update(dt: number) {
        this.age += dt;
        this.rotationOffset += dt * 12;
        
        // Cập nhật trail với biến thiên nhẹ để tạo cảm giác lông vũ bay trong gió
        this.trailPositions.unshift({ 
            pos: { ...this.position }, 
            alpha: 0.6, 
            scale: 1.0,
            rotation: Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2
        });
        
        if (this.trailPositions.length > this.maxTrails) this.trailPositions.pop();
        
        for (let i = 0; i < this.trailPositions.length; i++) {
            this.trailPositions[i].alpha *= 0.85;
            this.trailPositions[i].scale *= 0.92;
        }

        super.update(dt);
    }

    draw(ctx: CanvasRenderingContext2D) {
        const w = this.radius * 0.95;
        const h = this.radius * 2.8;

        // 1. Ghost Trail - Vẽ các bóng mờ của lông vũ
        ctx.save();
        this.trailPositions.forEach((t, i) => {
            if (t.alpha < 0.05) return;
            ctx.globalAlpha = t.alpha;
            ctx.fillStyle = this.color;
            ctx.save();
            ctx.translate(t.pos.x, t.pos.y);
            ctx.rotate(t.rotation);
            ctx.scale(t.scale, t.scale);
            
            this.drawFeatherShape(ctx, w, h);
            ctx.restore();
        });
        ctx.restore();

        // 2. Main Projectile
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        const angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
        ctx.rotate(angle);

        // Hiệu ứng Shimmer (lấp lánh)
        const shimmer = Math.sin(this.age * 30) * 0.1;
        ctx.scale(1 + shimmer, 1 - shimmer);

        // Bloom Glow Layer
        const grad = ctx.createRadialGradient(0, -h * 0.4, 0, 0, -h * 0.4, h * 1.2);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, this.color);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(0, -h * 0.4, h * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Crystal Core
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffffff';
        this.drawFeatherShape(ctx, w * 0.6, h * 0.8);
        
        // Inner Glow Stroke
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    private drawFeatherShape(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.quadraticCurveTo(w, -h * 0.2, w * 0.5, h * 0.3);
        ctx.lineTo(0, h * 0.5);
        ctx.lineTo(-w * 0.5, h * 0.3);
        ctx.quadraticCurveTo(-w, -h * 0.2, 0, -h * 0.5);
        ctx.fill();
    }

    /**
     * Đồng bộ hóa render PixiJS để phản ánh các thay đổi về hình ảnh và logic trail
     */
    renderPixi(view: any, time: number) {
        const r = this.radius;
        const color = PIXI.Color.shared.setValue(this.color).toNumber();
        const w = r * 0.95;
        const h = r * 2.8;

        // 1. Ghost Trail (Vẽ các bóng ma phía sau)
        if (this.trailPositions.length > 0) {
            const rot = view.rotation;
            const cos = Math.cos(-rot);
            const sin = Math.sin(-rot);

            this.trailPositions.forEach((t) => {
                const alpha = t.alpha * 0.5;
                if (alpha < 0.05) return;
                
                const dx = (t.pos.x - this.position.x) * cos - (t.pos.y - this.position.y) * sin;
                const dy = (t.pos.x - this.position.x) * sin + (t.pos.y - this.position.y) * cos;
                const s = t.scale;
                
                // Vẽ lông vũ tại vị trí trail (đã xoay tương đối)
                // Vì trailPositions lưu rotation tuyệt đối, ta cần điều chỉnh nếu muốn xoay riêng từng trail
                // Ở đây ta sử dụng path hình lông vũ cơ bản
                view.trail.moveTo(dx, dy - h * 0.5 * s)
                    .quadraticCurveTo(dx + w * s, dy - h * 0.2 * s, dx + w * 0.5 * s, dy + h * 0.3 * s)
                    .lineTo(dx, dy + h * 0.5 * s)
                    .lineTo(dx - w * 0.5 * s, dy + h * 0.3 * s)
                    .quadraticCurveTo(dx - w * s, dy - h * 0.2 * s, dx, dy - h * 0.5 * s)
                    .fill({ color, alpha });
            });
        }

        // 2. Shimmer Effect via Scale
        const shimmer = Math.sin(this.age * 30) * 0.1;
        view.main.scale.set(1 + shimmer, 1 - shimmer);

        // 3. Bloom Glow
        view.glow.circle(0, -h * 0.4, h * 0.8).fill({ color, alpha: 0.3 });
        view.glow.circle(0, -h * 0.4, h * 0.4).fill({ color: 0xffffff, alpha: 0.4 });
        
        // 4. Crystal Core Body (Vẽ lại hình dáng lông vũ)
        view.main.moveTo(0, -h * 0.5)
            .quadraticCurveTo(w, -h * 0.2, w * 0.5, h * 0.3)
            .lineTo(0, h * 0.5)
            .lineTo(-w * 0.5, h * 0.3)
            .quadraticCurveTo(-w, -h * 0.2, 0, -h * 0.5)
            .fill(0xffffff)
            .stroke({ width: 2, color });
            
        // 5. Feather Spine
        view.extra.moveTo(0, -h * 0.4).lineTo(0, h * 0.3).stroke({ width: 1.5, color, alpha: 0.5 });
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        // Hiệu ứng "vỡ vụn" pha lê
        engine.spawnParticles(impactPos, '#ffffff', 5, 200);
        engine.spawnParticles(impactPos, this.color, 4, 150);
    }
}
