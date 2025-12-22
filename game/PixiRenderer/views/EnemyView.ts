
import * as PIXI from 'pixi.js';
import { BaseView } from './BaseView';
import { Enemy, ENEMY_VISUAL_CONFIG } from '../../entities/Chicken';
import { EnemyState } from '../../../types';

export class EnemyView extends BaseView {
    private bodyGfx: PIXI.Graphics;
    private leftWing: PIXI.Graphics;
    private rightWing: PIXI.Graphics;
    private comb: PIXI.Graphics;
    private face: PIXI.Graphics;
    private hpBar: PIXI.Container;
    private hpFill: PIXI.Graphics;

    constructor(entity: Enemy) {
        super();
        
        // Khởi tạo các lớp vẽ
        this.leftWing = new PIXI.Graphics();
        this.rightWing = new PIXI.Graphics();
        this.bodyGfx = new PIXI.Graphics();
        this.comb = new PIXI.Graphics();
        this.face = new PIXI.Graphics();
        
        this.hpBar = new PIXI.Container();
        this.hpBar.y = -75;
        const bg = new PIXI.Graphics().roundRect(-35, 0, 70, 8, 4).fill(0x020617);
        this.hpFill = new PIXI.Graphics().roundRect(-35, 0, 70, 8, 4).fill(0x22c55e);
        this.hpBar.addChild(bg, this.hpFill);

        // Thứ tự layer: Cánh dưới cùng -> Thân -> Mào -> Mặt -> HP Bar
        this.addChild(this.leftWing, this.rightWing, this.bodyGfx, this.comb, this.face, this.hpBar);
        
        // Vẽ các bộ phận tĩnh một lần (nếu cần) hoặc vẽ lại trong update để đổi màu flash
        this.initialDraw(entity);
    }

    private initialDraw(entity: Enemy) {
        const cfg = ENEMY_VISUAL_CONFIG[entity.type];
        const bodyColor = PIXI.Color.shared.setValue(cfg.bodyColor).toNumber();
        
        // Vẽ mặt (Mắt + Mỏ)
        this.face.clear();
        // Mắt trắng
        this.face.ellipse(-14, -6, 12, 12).fill(0xffffff).stroke({width: 3, color: 0x020617});
        this.face.ellipse(14, -6, 12, 12).fill(0xffffff).stroke({width: 3, color: 0x020617});
        // Con ngươi
        const eyeColor = cfg.eyeGlow ? 0xef4444 : 0x020617;
        this.face.circle(-12, -4, 5).fill(eyeColor);
        this.face.circle(12, -4, 5).fill(eyeColor);
        // Mỏ vàng
        this.face.moveTo(-10, 8).quadraticCurveTo(0, 22, 10, 8).quadraticCurveTo(0, 4, -10, 8).fill(0xfacc15).stroke({width: 2.5, color: 0x020617});
        
        // Vẽ mào đỏ
        this.comb.clear();
        this.comb.moveTo(-12, -32)
            .quadraticCurveTo(-10, -54, -4, -46)
            .quadraticCurveTo(0, -62, 6, -50)
            .quadraticCurveTo(14, -60, 18, -42)
            .quadraticCurveTo(12, -32, 0, -30)
            .fill(0xef4444).stroke({width: 3, color: 0x020617});
    }

    private drawWings(dir: number, flap: number, color: number, gfx: PIXI.Graphics) {
        gfx.clear();
        gfx.x = dir * 10;
        gfx.rotation = dir * flap * 0.7;

        // Vẽ 3 lớp lông vũ
        // Lớp 1
        gfx.ellipse(dir * 8, 6, 14, 10).fill(color).stroke({width: 2.5, color: 0x020617});
        // Lớp 2
        gfx.moveTo(dir * 6, 4).quadraticCurveTo(dir * 30, 16, dir * 38, 30).quadraticCurveTo(dir * 24, 26, dir * 12, 18).fill(color).stroke({width: 3, color: 0x020617});
        // Lớp 3
        gfx.moveTo(dir * 4, 0).quadraticCurveTo(dir * 40, 10, dir * 55, 26).quadraticCurveTo(dir * 35, 30, dir * 14, 20).fill(color).stroke({width: 3, color: 0x020617});
    }

    update(entity: Enemy) {
        const isHint = entity.state === EnemyState.ENTRY;
        const cfg = ENEMY_VISUAL_CONFIG[entity.type];
        const isFlashing = entity.flashFrame > 0;
        
        const bodyColor = isFlashing ? 0xffffff : PIXI.Color.shared.setValue(cfg.bodyColor).toNumber();
        const wingColor = isFlashing ? 0xffffff : PIXI.Color.shared.setValue(cfg.wingColor).toNumber();

        this.x = entity.position.x;
        this.y = entity.position.y + Math.sin(entity.stateTimer * 4) * 3;
        this.alpha = entity.opacity;

        // Cập nhật cánh (Vỗ cánh)
        const flap = Math.sin(entity.wingFlap);
        this.drawWings(-1, flap, wingColor, this.leftWing);
        this.drawWings(1, flap, wingColor, this.rightWing);

        // Cập nhật thân
        this.bodyGfx.clear();
        this.bodyGfx.ellipse(0, -28, 15, 13).fill(0xffffff); // Đầu trắng
        this.bodyGfx.moveTo(-13, -18)
            .quadraticCurveTo(-28, -2, -26, 18)
            .quadraticCurveTo(-22, 38, 0, 40)
            .quadraticCurveTo(22, 38, 26, 18)
            .quadraticCurveTo(28, -2, 13, -18)
            .closePath()
            .fill(bodyColor)
            .stroke({ width: 4, color: 0x020617 });

        // Hiệu ứng Squash/Stretch
        const scaleBase = 1.15;
        this.scale.set(
            scaleBase * (1 - Math.sin(entity.stateTimer * 8) * 0.01),
            scaleBase * (1 + Math.sin(entity.stateTimer * 8) * 0.02)
        );

        // Ẩn mặt khi là Hint (đang bay vào)
        this.face.visible = !isHint;
        this.comb.visible = !isHint;

        // HP Bar
        this.hpBar.visible = !isHint && entity.hp < entity.maxHp;
        if (this.hpBar.visible) {
            this.hpFill.scale.x = Math.max(0, entity.hp / entity.maxHp);
        }

        // Nếu đang bị bắn trúng, vẽ lại các bộ phận để đổi màu trắng (Flash)
        if (isFlashing) {
            this.initialDraw(entity); 
        } else if (entity.flashFrame === 0) {
            // Trở lại màu bình thường sau khi flash kết thúc
            this.initialDraw(entity);
            entity.flashFrame = -1; // Đánh dấu đã reset
        }
    }
}
