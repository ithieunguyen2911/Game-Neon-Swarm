import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';

export class PhotonLaser extends Projectile {
    baseBeamWidth: number;
    currentBeamWidth: number;
    private electricSeed: number = 0;

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string, width: number) {
        super(pos, vel, 12, color || '#22c55e', damage, ownerId, WeaponType.LASER);
        this.baseBeamWidth = width;
        this.currentBeamWidth = width;
    }

    update(dt: number) {
        this.age += dt;
        this.electricSeed = Math.random();

        // 1. Cơ chế Overcharge: Càng bay lâu beam càng dày (tối đa gấp đôi)
        this.currentBeamWidth = this.baseBeamWidth * (1 + Math.min(this.age * 0.8, 1.0));

        // Cập nhật vị trí dựa trên vận tốc thẳng ban đầu
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.rotate(angle + Math.PI / 2);

        const len = 180;
        const w = this.currentBeamWidth;

        // Lớp 1: Outer Glow (Mờ ảo)
        ctx.globalAlpha = 0.25;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-w / 2 - 6, 0, w + 12, len, 12);
        ctx.fill();

        // Lớp 2: Electric Core (Tia điện chạy dọc)
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        let currentY = 0;
        ctx.moveTo(0, 0);
        while (currentY < len) {
            currentY += 15;
            const offX = (Math.random() - 0.5) * w;
            ctx.lineTo(offX, currentY);
        }
        ctx.stroke();

        // Lớp 3: Main Beam Core (Sáng nhất)
        ctx.globalAlpha = 1.0;
        const grad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
        grad.addColorStop(0, this.color);
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1, this.color);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-w / 2, 0, w, len, 6);
        ctx.fill();

        ctx.restore();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        // Laser không biến mất ngay khi va chạm (Continuous feel)
        // Thay vào đó sinh ra các hạt photon nhỏ
        engine.spawnParticles(impactPos, '#ffffff', 2, 12.0);
        if (Math.random() < 0.2) {
            engine.spawnParticles(impactPos, this.color, 3, 6.0);
        }
    }
}