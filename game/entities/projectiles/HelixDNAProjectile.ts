
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';
import * as PIXI from 'pixi.js';

export class HelixDNAProjectile extends Projectile {
    phase: number = 0;
    baseVelocity: Vector2;
    pierceCount: number = 3;
    initialPos: Vector2;
    
    private trail: Vector2[] = [];
    private maxTrail = 15;
    private amplitude: number = 70;
    private frequency: number = 12;

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string, phase: number) {
        super(pos, vel, 11, color || '#a855f7', damage, ownerId, WeaponType.HELIX);
        this.baseVelocity = { ...vel };
        this.phase = phase;
        this.initialPos = { ...pos };
    }

    update(dt: number) {
        this.age += dt;
        this.trail.unshift({ ...this.position });
        if (this.trail.length > this.maxTrail) this.trail.pop();

        const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        
        const wave = Math.cos(this.age * this.frequency + this.phase);
        
        this.position.x += this.baseVelocity.x * dt + (perpX * wave * this.amplitude * this.frequency * dt);
        this.position.y += this.baseVelocity.y * dt + (perpY * wave * this.amplitude * this.frequency * dt);
    }

    draw(ctx: CanvasRenderingContext2D) {
        // 1. Plasma Ribbon Trail
        this.drawPlasmaTrail(ctx);

        // 2. DNA Connection Sparks (Tia điện nối giữa 2 sợi helix)
        this.drawResonanceSparks(ctx);

        // 3. Energy Core
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Rotating Shell
        const rot = this.age * 15;
        ctx.rotate(rot);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        
        // Central Pulse
        const pulse = 1 + Math.sin(this.age * 25) * 0.2;
        ctx.scale(pulse, pulse);
        
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 1.5);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, this.color);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Sharp Inner Core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    private drawPlasmaTrail(ctx: CanvasRenderingContext2D) {
        if (this.trail.length < 2) return;
        ctx.save();
        
        // Vẽ dải lụa năng lượng mờ
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius * 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.15;
        ctx.stroke();

        // Sợi tơ điện trung tâm
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            const jitterX = (Math.random() - 0.5) * 4;
            const jitterY = (Math.random() - 0.5) * 4;
            ctx.lineTo(this.trail[i].x + jitterX, this.trail[i].y + jitterY);
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        
        ctx.restore();
    }

    private drawResonanceSparks(ctx: CanvasRenderingContext2D) {
        // Chỉ vẽ spark ở các điểm "nút" của sóng hình sin để tiết kiệm performance
        if (Math.abs(Math.cos(this.age * this.frequency + this.phase)) < 0.2) {
            ctx.save();
            ctx.globalAlpha = 0.4 * Math.random();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            // Hướng về trục giữa
            const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const wave = Math.cos(this.age * this.frequency + this.phase);
            ctx.lineTo(this.position.x - perpX * wave * this.amplitude * 2, this.position.y - perpY * wave * this.amplitude * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    /**
     * Đồng bộ hóa hình ảnh sang PixiJS dựa trên các giá trị và phương thức vẽ mới
     */
    renderPixi(view: any, time: number) {
        const r = this.radius;
        const color = PIXI.Color.shared.setValue(this.color).toNumber();

        // 1. Plasma Ribbon Trail
        if (this.trail.length > 1) {
            const rot = view.rotation;
            const cos = Math.cos(-rot);
            const sin = Math.sin(-rot);
            const getLocal = (p: any) => ({
                x: (p.x - this.position.x) * cos - (p.y - this.position.y) * sin,
                y: (p.x - this.position.x) * sin + (p.y - this.position.y) * cos
            });
            
            // Ribbon mờ
            view.trail.moveTo(0, 0);
            for (let i = 1; i < this.trail.length; i++) {
                const p = getLocal(this.trail[i]);
                view.trail.lineTo(p.x, p.y);
            }
            view.trail.stroke({ width: r * 1.8, color, alpha: 0.15, cap: 'round', join: 'round' });

            // Sợi tơ điện trung tâm (vẽ đơn giản không jitter quá nhiều để tránh lag)
            view.trail.moveTo(0, 0);
            for (let i = 1; i < this.trail.length; i++) {
                const p = getLocal(this.trail[i]);
                view.trail.lineTo(p.x, p.y);
            }
            view.trail.stroke({ width: 2, color: 0xffffff, alpha: 0.4, cap: 'round' });
        }

        // 2. DNA Connection Sparks
        const wave = Math.cos(this.age * this.frequency + this.phase);
        if (Math.abs(wave) < 0.2) {
            const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
            const rot = view.rotation;
            const cos = Math.cos(-rot);
            const sin = Math.sin(-rot);
            
            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const tx = -perpX * wave * this.amplitude * 2;
            const ty = -perpY * wave * this.amplitude * 2;
            
            const localT = {
                x: tx * cos - ty * sin,
                y: tx * sin + ty * cos
            };

            view.extra.moveTo(0, 0).lineTo(localT.x, localT.y).stroke({ 
                width: 1, 
                color: 0xffffff, 
                alpha: 0.4 * Math.random() 
            });
        }

        // 3. Energy Core
        const pulse = 1 + Math.sin(this.age * 25) * 0.2;
        view.glow.circle(0, 0, r * 1.5 * pulse).fill({ color, alpha: 0.3 });
        
        // Rotating Shell
        const shellRot = this.age * 15;
        // Vì view đã có rotation tổng, ta cần chỉnh lại rotation cục bộ của Graphic nếu muốn xoay riêng
        // Trong BulletView, main clear mỗi frame nên ta vẽ rect xoay bằng sin/cos hoặc dùng rotation của view.main
        view.main.rotation = shellRot;
        view.main.rect(-r, -r, r * 2, r * 2).stroke({ width: 2, color, alpha: 0.3 });
        
        // Sharp Core
        view.core.circle(0, 0, r * 0.4 * pulse).fill(0xffffff);
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.pierceCount--;
        engine.spawnVortexParticles(impactPos, this.color, 4);
        engine.spawnPiercingRing(impactPos, '#ffffff');
        
        if (this.pierceCount <= 0) {
            this.isDead = true;
            engine.createExplosion(impactPos, this.damage * 0.8, 100);
        }
    }
}
