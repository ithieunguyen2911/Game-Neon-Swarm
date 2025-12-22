
import * as PIXI from 'pixi.js';
import { EnemyView } from './EnemyView';
import { Boss } from '../../entities/Boss';

export class BossView extends EnemyView {
    constructor(entity: Boss) {
        super(entity);
    }

    update(entity: Boss) {
        super.update(entity);
        // Fix: Đặt giá trị scale tuyệt đối thay vì nhân bản dồn tích
        const s = 6.0; 
        this.scale.set(s, s);
    }
}
