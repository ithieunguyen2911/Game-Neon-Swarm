import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';

export class HelixDNAProjectile extends Projectile {
    phase: number = 0;
    baseVelocity: Vector2;
    pierceCount: number = 3;
    initialPos: Vector2;
    
    // Thuộc tính để vẽ tia điện zigzag
    private zigzagOffset: number = 0;

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string, phase: number) {
        // Màu mặc định cho Helix là tím neon
        super(pos, vel, 10, color || '#a855f7', damage, ownerId, WeaponType.HELIX);
        this.baseVelocity = { ...vel };
        this.phase = phase;
        this.initialPos = { ...pos };
    }

    update(dt: number) {
        this.age += dt;
        this.zigzagOffset = Math.sin(this.age * 30) * 5;

        const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
        const freq = 12; // Tốc độ xoắn
        const amp = 70;  // Biên độ xoắn
        
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        
        // Di chuyển theo quỹ đạo Helix
        const wave = Math.cos(this.age * freq + this.phase);
        this.position.x += this.baseVelocity.x * dt + (perpX * wave * amp * freq * dt);
        this.position.y += this.baseVelocity.y * dt + (perpY * wave * amp * freq * dt);

        // Hiệu ứng Electric Sparks bay quanh đạn
        if (Math.random() < 0.4) {
            this.spawnInternalSpark();
        }
    }

    private spawnInternalSpark() {
        // Logic này sẽ được engine xử lý thông qua particles
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        
        // Vẽ Energy Link nối với "partner" (nếu có)
        // Lưu ý: Logic tìm partner hiệu quả nhất là xử lý ở Engine, 
        // nhưng ở đây chúng ta vẽ hiệu ứng điện xung quanh bản thân để tạo cảm giác "linked"
        this.drawElectricAura(ctx);

        ctx.translate(this.position.x, this.position.y);
        const pulse = 1 + Math.sin(this.age * 25) * 0.2;
        ctx.scale(pulse, pulse);

        // Vẽ lõi năng lượng neon
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#60a5fa'); // Xanh dương
        grad.addColorStop(1, this.color);  // Tím
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Viền năng lượng
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    private drawElectricAura(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        
        let lx = this.position.x;
        let ly = this.position.y;
        
        // Vẽ các tia sét nhỏ xung quanh
        for(let i=0; i<3; i++) {
            ctx.moveTo(lx, ly);
            const tx = lx + (Math.random() - 0.5) * 40;
            const ty = ly + (Math.random() - 0.5) * 40;
            ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.pierceCount--;
        
        // 1. Hiệu ứng Piercing Ring
        engine.spawnPiercingRing(impactPos, this.color);
        
        // 2. Logic Chain Resonance
        if (this.pierceCount < 3) {
            engine.triggerChainResonance(impactPos, this.damage * 0.4, this.color);
        }

        if (this.pierceCount <= 0) {
            this.isDead = true;
            // DNA Collapse Shockwave
            engine.createExplosion(impactPos, this.damage * 0.5, 80);
        }
        
        engine.spawnVortexParticles(impactPos, this.color, 4);
    }
}