
import * as PIXI from 'pixi.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

export class PixiAppManager {
    private static _instance: PixiAppManager;
    private _app: PIXI.Application | null = null;
    private _initPromise: Promise<void> | null = null;

    private constructor() {}

    static getInstance(): PixiAppManager {
        if (!PixiAppManager._instance) PixiAppManager._instance = new PixiAppManager();
        return PixiAppManager._instance;
    }

    get app(): PIXI.Application | null { return this._app; }

    async init() {
        if (this._app) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            const app = new PIXI.Application();
            await app.init({
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundAlpha: 0, // Cực kỳ quan trọng để nhìn xuyên qua lớp Background
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });
            this._app = app;
        })();
        return this._initPromise;
    }

    destroy() {
        if (this._app) {
            this._app.stage.destroy({ children: true, texture: true });
            this._app.destroy({ removeView: true });
            this._app = null;
            this._initPromise = null;
        }
    }
}
