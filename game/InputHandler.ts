import { InputState, ControlSettings } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export class InputHandler {
  state: InputState = {
    p1: { left: false, right: false, up: false, down: false, shooting: false, usePointer: false, pointer: {x: 0, y: 0} },
    p2: { left: false, right: false, up: false, down: false, shooting: false, usePointer: false }
  };

  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onKeyUp: (e: KeyboardEvent) => void;
  private _onMouseMove: (e: MouseEvent) => void;
  private _onMouseDown: () => void;
  private _onMouseUp: () => void;
  private _onTouchMove: (e: TouchEvent) => void;
  private _onTouchStart: (e: TouchEvent) => void;
  private _onTouchEnd: () => void;

  constructor(private controls: ControlSettings, private canvas: HTMLCanvasElement) {
    this._onKeyDown = (e) => this.handleKey(e.code, true);
    this._onKeyUp = (e) => this.handleKey(e.code, false);
    this._onMouseMove = (e) => this.handleMouse(e);
    this._onMouseDown = () => this.state.p1.shooting = true;
    this._onMouseUp = () => this.state.p1.shooting = false;
    this._onTouchMove = (e) => this.handleTouch(e);
    this._onTouchStart = (e) => this.handleTouch(e);
    this._onTouchEnd = () => {
        this.state.p1.shooting = false;
        this.state.p1.usePointer = false;
    };
    this.init();
  }

  private init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('mouseup', this._onMouseUp);
    
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.canvas.addEventListener('touchend', this._onTouchEnd);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
  }

  private handleKey(code: string, isDown: boolean) {
    if (code === this.controls.p1.left) this.state.p1.left = isDown;
    if (code === this.controls.p1.right) this.state.p1.right = isDown;
    if (code === this.controls.p1.up) this.state.p1.up = isDown;
    if (code === this.controls.p1.down) this.state.p1.down = isDown;
    if (code === this.controls.p1.shoot) this.state.p1.shooting = isDown;

    if (code === this.controls.p2.left) this.state.p2.left = isDown;
    if (code === this.controls.p2.right) this.state.p2.right = isDown;
    if (code === this.controls.p2.up) this.state.p2.up = isDown;
    if (code === this.controls.p2.down) this.state.p2.down = isDown;
    if (code === this.controls.p2.shoot) this.state.p2.shooting = isDown;
  }

  private handleMouse(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    this.state.p1.pointer = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
    this.state.p1.usePointer = true;
  }

  private handleTouch(e: TouchEvent) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    this.state.p1.pointer = {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
    };
    this.state.p1.usePointer = true;
    this.state.p1.shooting = true;
  }
}
