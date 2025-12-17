
import { InputState, ControlSettings } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export class InputHandler {
  state: InputState = {
    p1: { left: false, right: false, up: false, down: false, shooting: false, usePointer: false, pointer: {x: 0, y: 0} },
    p2: { left: false, right: false, up: false, down: false, shooting: false, usePointer: false }
  };

  constructor(private controls: ControlSettings, private canvas: HTMLCanvasElement) {
    this.init();
  }

  private init() {
    window.addEventListener('keydown', (e) => this.handleKey(e.code, true));
    window.addEventListener('keyup', (e) => this.handleKey(e.code, false));
    
    this.canvas.addEventListener('mousemove', (e) => this.handleMouse(e));
    this.canvas.addEventListener('mousedown', () => this.state.p1.shooting = true);
    this.canvas.addEventListener('mouseup', () => this.state.p1.shooting = false);
    
    this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e), { passive: false });
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
    this.canvas.addEventListener('touchend', () => {
        this.state.p1.shooting = false;
        this.state.p1.usePointer = false;
    });
  }

  private handleKey(code: string, isDown: boolean) {
    // P1
    if (code === this.controls.p1.left) this.state.p1.left = isDown;
    if (code === this.controls.p1.right) this.state.p1.right = isDown;
    if (code === this.controls.p1.up) this.state.p1.up = isDown;
    if (code === this.controls.p1.down) this.state.p1.down = isDown;
    if (code === this.controls.p1.shoot) this.state.p1.shooting = isDown;

    // P2
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
