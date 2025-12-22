
import { InputState } from '../../types';

export interface GameSystem {
    /**
     * @param engine Tham chiếu đến GameEngine (để ở dạng any để tránh lỗi vòng lặp import)
     * @param dt Delta time (giây)
     * @param input Trạng thái input từ người chơi
     */
    update(engine: any, dt: number, input?: InputState): void;
}
