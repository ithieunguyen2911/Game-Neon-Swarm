
import * as PIXI from 'pixi.js';
import { BaseView } from './BaseView';
import { Projectile } from '../../entities/Combat';
import { WeaponType } from '../../../types';

export class BulletView extends BaseView {
    // Để public các layer để các thực thể đạn (Entities) có thể truy cập và vẽ vào
    public main: PIXI.Graphics;
    public glow: PIXI.Graphics;
    public core: PIXI.Graphics;
    public extra: PIXI.Graphics;
    public trail: PIXI.Graphics;

    constructor(entity: Projectile) {
        super();
        this.trail = new PIXI.Graphics();
        this.glow = new PIXI.Graphics();
        this.main = new PIXI.Graphics();
        this.core = new PIXI.Graphics();
        this.extra = new PIXI.Graphics();
        
        // Thứ tự layer: Trail dưới cùng -> Glow -> Main -> Core -> Extra trên cùng
        this.addChild(this.trail, this.glow, this.main, this.core, this.extra);
    }

    update(entity: Projectile) {
        this.x = entity.position.x;
        this.y = entity.position.y;
        
        const time = Date.now() / 1000;

        // Reset các layer trước mỗi frame vẽ
        this.trail.clear();
        this.glow.clear();
        this.main.clear();
        this.core.clear();
        this.extra.clear();

        // Xử lý xoay cho các loại đạn không phải Laser
        if (entity.type !== WeaponType.LASER) {
            this.rotation = Math.atan2(entity.velocity.y, entity.velocity.x) + Math.PI / 2;
        } else {
            this.rotation = 0;
        }

        /**
         * Đoạn code cũ sử dụng instanceof đã được comment lại theo yêu cầu.
         * Thay vào đó, chúng ta sử dụng tính đa hình bằng cách gọi trực tiếp renderPixi.
         */
        /*
        // Nhận diện class cụ thể để lấy dữ liệu logic chuyên biệt (trails, phases, v.v.)
        if (entity instanceof HelixDNAProjectile) {
            this.drawHelix(entity, r, color, time);
        } else if (entity instanceof RoosterRocket) {
            this.drawRocket(entity, r, color, time);
        } else if (entity instanceof FeatherShotgunBullet) {
            this.drawShotgun(entity, r, color, time);
        } else if (entity instanceof PhotonLaser) {
            this.drawLaser(entity, r, color, time);
        } else {
            this.drawBlaster(entity, r, color, time);
        }
        */

        // Gọi trực tiếp phương thức vẽ từ thực thể đạn
        entity.renderPixi(this, time);
    }
}
