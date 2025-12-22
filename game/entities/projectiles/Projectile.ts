
import { Entity } from '../BaseEntity';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';

export abstract class Projectile extends Entity {
    damage: number;
    ownerId: string;
    isEnemy: boolean;
    age: number = 0;
    type: WeaponType;

    constructor(pos: Vector2, vel: Vector2, radius: number, color: string, damage: number, ownerId: string, type: WeaponType, isEnemy: boolean = false) {
        super(pos, vel, radius, color);
        this.damage = damage;
        this.ownerId = ownerId;
        this.type = type;
        this.isEnemy = isEnemy;
    }

    abstract onImpact(engine: GameEngine, impactPos: Vector2): void;

    /**
     * Phương thức để đối tượng tự vẽ chính mình bằng PixiJS.
     * @param view Tham chiếu đến BulletView chứa các layer Graphics.
     * @param time Thời gian hiện tại để tạo hiệu ứng chuyển động.
     */
    abstract renderPixi(view: any, time: number): void;
}
