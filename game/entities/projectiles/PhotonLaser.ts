
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';
import * as PIXI from 'pixi.js';

export class PhotonLaser extends Projectile {
    baseBeamWidth: number;
    currentBeamWidth: number;
    private ringOffset: number = 0;
    private photons: { offset: number, speed: number, alpha: number, side: number }[] = [];

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string, width: number) {
        super(pos, vel, 12, color || '#22c55e', damage, ownerId, WeaponType.LASER);
        this.baseBeamWidth = width;
        this.currentBeamWidth = width;
        
        // Khởi tạo các hạt photon trang trí
        for(let i=0; i<12; i++) {
            this.photons.push({
                offset: Math.random() * 400,
                speed: 800 + Math.random() * 1200,
                alpha: 0.3 + Math.random() * 0.7,
                side: (Math.random() - 0.5) * 2
            });
        }
    }

    update(dt: number) {
        this.age += dt;
        this.ringOffset = (this.ringOffset + dt * 1500) % 400;

        // Rung động chiều rộng tia laser theo tần số cao để tạo cảm giác năng lượng thô
        this.currentBeamWidth = this.baseBeamWidth + Math.sin(this.age * 100) * 3;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        this.photons.forEach(p => {
            p.offset += p.speed * dt;
            if (p.offset > 400) p.offset = 0;
        });
    }

    /**
     * Phương thức vẽ cho Canvas (Logic xử lý gốc của người dùng)
     */
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.rotate(angle + Math.PI / 2);

        const len = 400; 
        const w = this.currentBeamWidth;

        // 1. Muzzle Bloom (Flare rực rỡ tại điểm phát)
        this.drawSuperMuzzle(ctx, w);

        // 2. Heat Haze / Glow Path
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = this.color;
        ctx.fillRect(-w * 3, 0, w * 6, len);

        // 3. Core Beam Layered
        // Layer 1: Màu chủ đạo
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.color;
        ctx.fillRect(-w, 0, w * 2, len);

        // Layer 2: Lõi trắng cường độ cao
        const beamGrad = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
        beamGrad.addColorStop(0, this.color);
        beamGrad.addColorStop(0.5, '#ffffff');
        beamGrad.addColorStop(1, this.color);
        
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = beamGrad;
        ctx.fillRect(-w * 0.4, 0, w * 0.8, len);

        // 4. Energy Resonance Rings (Vòng năng lượng chạy dọc tia)
        this.drawResonanceRings(ctx, w, len);

        // 5. High-Speed Photons
        this.drawPhotonStream(ctx, w);

        ctx.restore();
    }

    private drawSuperMuzzle(ctx: CanvasRenderingContext2D, w: number) {
        ctx.save();
        const pulse = Math.sin(this.age * 40) * 0.2 + 1.0;
        const size = w * 4 * pulse;
        
        // Radial Bloom
        const mGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        mGrad.addColorStop(0, '#ffffff');
        mGrad.addColorStop(0.2, this.color);
        mGrad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = mGrad;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Cross Star Flare
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 2; i++) {
            ctx.rotate(Math.PI / 4 + i * Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(-size * 1.5, 0);
            ctx.lineTo(size * 1.5, 0);
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawResonanceRings(ctx: CanvasRenderingContext2D, w: number, len: number) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const y = (this.ringOffset + i * 100) % len;
            const distRatio = y / len;
            ctx.globalAlpha = (1 - distRatio) * 0.4;
            
            // Vẽ vòng elip nén
            ctx.beginPath();
            ctx.ellipse(0, y, w * 2.5 * (1 - distRatio * 0.5), w * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawPhotonStream(ctx: CanvasRenderingContext2D, w: number) {
        ctx.save();
        this.photons.forEach(p => {
            const distRatio = p.offset / 400;
            ctx.globalAlpha = p.alpha * (1 - distRatio);
            ctx.fillStyle = '#ffffff';
            
            // Hạt photon dạng vệt sáng ngắn
            const pLen = 10 * (1 + p.speed / 1000);
            ctx.fillRect(p.side * w * 0.6, p.offset, 2, pLen);
        });
        ctx.restore();
    }

    /**
     * Tích hợp render với PixiJS dựa trên các giá trị logic mới
     */
    renderPixi(view: any, time: number) {
        const w = this.currentBeamWidth;
        const color = PIXI.Color.shared.setValue(this.color).toNumber();
        const len = 400; // Sử dụng len 400 theo logic vẽ của người dùng

        // 1. Super Muzzle Bloom
        const pulse = Math.sin(this.age * 40) * 0.2 + 1.0;
        const bloomSize = w * 9 * pulse;
        view.glow.circle(0, 0, bloomSize).fill({ color, alpha: 0.15 });
        view.glow.circle(0, 0, bloomSize * 0.4).fill({ color: 0xffffff, alpha: 0.4 });
        
        // 2. Star Flare
        const starSize = bloomSize * 1.5;
        view.extra.moveTo(-starSize, 0).lineTo(starSize, 0).stroke({ width: 3, color: 0xffffff, alpha: 0.5 });
        view.extra.moveTo(0, -starSize).lineTo(0, starSize).stroke({ width: 3, color: 0xffffff, alpha: 0.5 });
        
        // 3. Multi-Layer Beam (Vẽ theo chiều dương của Y như logic Canvas)
        view.main.rect(-w * 3, 0, w * 6, len).fill({ color, alpha: 0.1 }); // Glow path
        view.main.rect(-w, 0, w * 2, len).fill({ color, alpha: 0.4 }); // Main beam
        view.core.rect(-w * 0.4, 0, w * 0.8, len).fill(0xffffff); // Core
        
        // 4. Energy Resonance Rings
        for (let i = 0; i < 4; i++) {
            const y = (this.ringOffset + i * 100) % len;
            const distRatio = y / len;
            view.extra.ellipse(0, y, w * 2.5 * (1 - distRatio * 0.5), w * 1.0).stroke({ 
                width: 2.0, 
                color: 0xffffff, 
                alpha: (1 - distRatio) * 0.4 
            });
        }

        // 5. Photon Streams
        this.photons.forEach(p => {
            const distRatio = p.offset / 400;
            const pX = p.side * w * 0.6;
            const pY = p.offset;
            const pLen = 15 * (1 + p.speed / 1000);
            view.extra.rect(pX, pY, 2, pLen).fill({ color: 0xffffff, alpha: p.alpha * (1 - distRatio) });
        });
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        // Laser gây ra các vụ nổ hạt liên tục
        engine.spawnParticles(impactPos, '#ffffff', 2, 250);
        engine.spawnParticles(impactPos, this.color, 3, 180);
        
        // Thi thoảng tạo vòng sóng xung kích nhỏ
        if (Math.random() < 0.2) {
            engine.spawnPiercingRing(impactPos, this.color);
        }
    }
}
