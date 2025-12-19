
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';

export class HelixDNAProjectile extends Projectile {
    phase: number = 0;
    baseVelocity: Vector2;
    pierceCount: number = 3;
    initialPos: Vector2;
    
    // Thuộc tính mới cho hiệu ứng
    private trail: Vector2[] = [];
    private maxTrail = 9;
    private zigzagOffset: number = 0;
    private amplitude: number = 70;
    private frequency: number = 12;

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string, phase: number) {
        // Màu mặc định cho Helix là tím neon rực rỡ
        super(pos, vel, 10, color || '#a855f7', damage, ownerId, WeaponType.HELIX);
        this.baseVelocity = { ...vel };
        this.phase = phase;
        this.initialPos = { ...pos };
    }

    update(dt: number) {
        this.age += dt;
        this.zigzagOffset = Math.sin(this.age * 40) * 8;

        // Lưu vị trí cũ để vẽ trail
        this.trail.unshift({ ...this.position });
        if (this.trail.length > this.maxTrail) this.trail.pop();

        const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
        const freq = this.frequency; 
        const amp = this.amplitude;  
        
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        
        // Tính toán quỹ đạo xoắn
        const wave = Math.cos(this.age * freq + this.phase);
        
        // Cập nhật vị trí dựa trên vận tốc cơ bản + thành phần sóng vuông góc
        this.position.x += this.baseVelocity.x * dt + (perpX * wave * amp * freq * dt);
        this.position.y += this.baseVelocity.y * dt + (perpY * wave * amp * freq * dt);

        // Sinh hạt năng lượng xoáy
        if (Math.random() < 0.3) {
            this.spawnInternalSpark();
        }
    }

    private spawnInternalSpark() {
        // Hạt này sẽ được engine vẽ ra (nếu engine gọi spawnParticles)
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        
        // 1. Vẽ Energy Ribbon (Dải lụa quỹ đạo)
        this.drawEnergyRibbon(ctx);

        // 2. Vẽ DNA Base-Pairs (Các thanh liên kết hướng về trục giữa)
        this.drawBasePairs(ctx);

        // 3. Hiệu ứng Electric Aura
        this.drawElectricAura(ctx);

        ctx.translate(this.position.x, this.position.y);
        const pulse = 1 + Math.sin(this.age * 30) * 0.25;
        ctx.scale(pulse, pulse);

        // 4. Lõi đạn Multi-tone Neon
        this.drawCore(ctx);

        ctx.restore();
    }

    private drawEnergyRibbon(ctx: CanvasRenderingContext2D) {
        if (this.trail.length < 2) return;
        ctx.save();
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const p1 = this.trail[i];
            const p2 = this.trail[i+1];
            const alpha = (1 - i / this.trail.length) * 0.5;
            
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = this.radius * (1 - i / this.trail.length) * 1.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Lõi trắng của dải lụa
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineWidth = ctx.lineWidth * 0.3;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawBasePairs(ctx: CanvasRenderingContext2D) {
        // Vẽ các thanh ngang mô phỏng liên kết hydro trong DNA
        // Chúng ta vẽ hướng về trục trung tâm của quỹ đạo
        ctx.save();
        const angle = Math.atan2(this.baseVelocity.y, this.baseVelocity.x);
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        
        // Trục trung tâm là đường thẳng đi qua initialPos theo hướng velocity
        // Một cách đơn giản: vẽ thanh nối từ vị trí hiện tại ngược lại phía trục đối xứng
        const wave = Math.cos(this.age * this.frequency + this.phase);
        const barLen = wave * this.amplitude;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.position.x - perpX * barLen * 2, this.position.y - perpY * barLen * 2);
        ctx.stroke();

        // Điểm sáng ở đầu thanh liên kết
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.position.x - perpX * barLen * 2, this.position.y - perpY * barLen * 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    private drawCore(ctx: CanvasRenderingContext2D) {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff'); // Tâm trắng chói
        grad.addColorStop(0.3, '#c084fc'); // Tím nhạt
        grad.addColorStop(1, this.color);  // Tím đậm
        
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Viền năng lượng sắc nét
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    private drawElectricAura(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.strokeStyle = '#60a5fa'; // Xanh điện lượng
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5 * (0.5 + Math.random() * 0.5);
        
        const segments = 3;
        for(let i=0; i < segments; i++) {
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            const tx = this.position.x + (Math.random() - 0.5) * 50;
            const ty = this.position.y + (Math.random() - 0.5) * 50;
            const midX = (this.position.x + tx) / 2 + (Math.random() - 0.5) * 15;
            const midY = (this.position.y + ty) / 2 + (Math.random() - 0.5) * 15;
            ctx.quadraticCurveTo(midX, midY, tx, ty);
            ctx.stroke();
        }
        ctx.restore();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.pierceCount--;
        
        // 1. Hiệu ứng Piercing Ring (Vòng sóng xung kích)
        engine.spawnPiercingRing(impactPos, this.color);
        
        // 2. Logic Chain Resonance (Lan tỏa điện khi chạm)
        if (this.pierceCount < 3) {
            engine.triggerChainResonance(impactPos, this.damage * 0.5, this.color);
        }

        if (this.pierceCount <= 0) {
            this.isDead = true;
            // DNA Collapse Shockwave (Nổ lớn khi hết lượt xuyên)
            engine.createExplosion(impactPos, this.damage * 0.6, 100);
            engine.spawnParticles(impactPos, '#ffffff', 10, 5.0);
        }
        
        // Hạt xoáy đặc trưng của Helix
        engine.spawnVortexParticles(impactPos, this.color, 6);
    }
}
