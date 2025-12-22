
import * as PIXI from 'pixi.js';
import { PixiAppManager } from './PixiRenderer/PixiAppManager';
import { LayerManager } from './PixiRenderer/LayerManager';
import { EntityViewRegistry } from './PixiRenderer/EntityViewRegistry';
import { RenderSynchronizer } from './PixiRenderer/RenderSynchronizer';
import { GameEngine } from './GameEngine';

export class PixiRenderer {
    private static _instance: PixiRenderer | null = null;
    
    private appManager = PixiAppManager.getInstance();
    private layers = new LayerManager();
    private registry = new EntityViewRegistry();
    private synchronizer: RenderSynchronizer;

    private constructor() {
        this.synchronizer = new RenderSynchronizer(this.registry, this.layers);
    }

    public static getInstance(): PixiRenderer {
        if (!PixiRenderer._instance) PixiRenderer._instance = new PixiRenderer();
        return PixiRenderer._instance;
    }

    public get app(): PIXI.Application | null {
        return this.appManager.app;
    }

    async init() {
        await this.appManager.init();
        if (this.appManager.app) {
            this.layers.init(this.appManager.app.stage);
        }
    }

    reset() {
        this.registry.clear();
        this.layers.clear();
        this.appManager.destroy();
    }

    sync(engine: GameEngine) {
        if (!this.appManager.app) return;
        // 1. Đồng bộ hóa logic Game sang PIXI Stage
        this.synchronizer.sync(engine, this.appManager.app.stage);
        
        // 2. Cực kỳ quan trọng: Buộc PIXI render stage hiện tại vào canvas ngay lập tức
        // Điều này đảm bảo PIXI hiển thị chính xác các thay đổi vừa đồng bộ
        this.appManager.app.renderer.render({
            container: this.appManager.app.stage
        });
    }
}
