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
}