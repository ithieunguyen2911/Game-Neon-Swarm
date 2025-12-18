
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';

export class PhotonLaser extends Projectile {
    baseBeamWidth: number;
    currentBeamWidth: number;
    private electricSeed: number = 0;
    private photons: { offset: number, speed: number, alpha: number }[] = [];

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string, width: number) {
        super(pos, vel, 12, color || '#22c55e', damage, ownerId, WeaponType.LASER);
        this.baseBeamWidth = width;
        this.currentBeamWidth = width;
        
        // Khởi tạo các hạt photon chạy dọc tia laser
        for(let i=0; i<5; i++) {
            this.photons.push({
                offset: Math.random() * 240,
                speed: 400 + Math.random() * 600,
                alpha: 0.3 + Math.random() * 0.7
            });
        }
    }

    update(dt: number) {
        this.age += dt;
        this.electricSeed = Math.random();

        // Tia laser rung động tần số cao
        const pulse = Math.sin(this.age * 60) * 1.5;
        this.currentBeamWidth = this.baseBeamWidth + pulse;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        // Cập nhật vị trí hạt photon
        this.photons.forEach(p => {
            p.offset += p.speed * dt;
            if (p.offset > 240) p.offset = 0;
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.rotate(angle + Math.PI / 2);

        const len = 260; // Chiều dài tia
        const w = this.currentBeamWidth;

        // 1. Muzzle Focus Ring (Vòng năng lượng tại điểm bắn)
        this.drawFocusRing(ctx, w);

        // 2. Muzzle Flare (Vùng sáng chói tại điểm bắn)
        this.drawMuzzleFlare(ctx, w);

        // 3. Chromatic Aberration (Tia đỏ/lam mỏng ở rìa)
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#06b6d4'; // Cyan
        ctx.fillRect(-w/2 - 3, 0, 1.5, len);
        ctx.fillStyle = '#f43f5e'; // Red/Magenta
        ctx.fillRect(w/2 + 1.5, 0, 1.5, len);

        // 4. Outer Glow (Vầng sáng tỏa rộng)
        ctx.globalAlpha = 0.25 * (0.8 + Math.random() * 0.2);
        ctx.shadowBlur = 40;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-w * 1.8, 0, w * 3.6, len, 25);
        ctx.fill();

        // 5. High-Intensity Core (Lõi trắng siêu sáng)
        ctx.globalAlpha = 1.0;
        const innerW = w * 0.65;
        const grad = ctx.createLinearGradient(-innerW, 0, innerW, 0);
        grad.addColorStop(0, this.color);
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1, this.color);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-innerW / 2, 0, innerW, len, 10);
        ctx.fill();

        // 6. Photon Stream (Các hạt năng lượng chạy dọc tia)
        this.drawPhotonStream(ctx, innerW);

        // 7. Electric Discharge (Tia điện nhỏ)
        if (Math.random() < 0.4) {
            this.drawElectricArcs(ctx, w, len);
        }

        ctx.restore();
    }

    private drawFocusRing(ctx: CanvasRenderingContext2D, w: number) {
        ctx.save();
        const pulse = 1 + Math.sin(this.age * 30) * 0.3;
        const ringSize = w * 2.5 * pulse;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(0, 5, ringSize, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 5, ringSize * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    private drawMuzzleFlare(ctx: CanvasRenderingContext2D, w: number) {
        ctx.save();
        const flareSize = w * (4 + Math.random() * 2);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, flareSize);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, this.color);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        // Vẽ hình sao 4 cánh nhỏ
        for(let i=0; i<4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.ellipse(0, 0, flareSize, flareSize * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    private drawPhotonStream(ctx: CanvasRenderingContext2D, innerW: number) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        this.photons.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc((Math.random()-0.5) * innerW, p.offset, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    private drawElectricArcs(ctx: CanvasRenderingContext2D, w: number, len: number) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        let currY = 0;
        ctx.moveTo(0, 0);
        while (currY < len) {
            currY += 25;
            const offX = (Math.random() - 0.5) * w * 1.5;
            ctx.lineTo(offX, currY);
        }
        ctx.stroke();
        ctx.restore();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        // Nổ Photon chùm rực rỡ
        engine.spawnParticles(impactPos, '#ffffff', 4, 12.0);
        engine.spawnParticles(impactPos, this.color, 4, 8.0);
        
        // Tạo thêm vòng sóng xung kích nhỏ tại điểm chạm
        if (Math.random() < 0.2) {
            engine.spawnPiercingRing(impactPos, this.color);
        }
        
        // Hiệu ứng hạt xoáy đặc trưng của Photon
        engine.spawnVortexParticles(impactPos, '#ffffff', 5);
    }
}
