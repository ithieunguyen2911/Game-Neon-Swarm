
import * as PIXI from 'pixi.js';
import { Entity } from '../../Entities';

export abstract class BaseView extends PIXI.Container {
    abstract update(entity: Entity): void;
}
