import { joinRoom } from 'trystero';
import { NetworkPlayerState } from '../types';

// Use a fixed room ID for everyone to find each other easily in this demo
const APP_ID = 'neon-swarm-overdrive-v1'; 
const ROOM_ID = 'lobby_global';

class MultiplayerService {
  private room: any;
  private sendPlayerAction: any;
  private sendGameEventAction: any;
  
  public onPlayerUpdate: ((id: string, state: NetworkPlayerState) => void) | null = null;
  public onPlayerLeave: ((id: string) => void) | null = null;
  public onGameEvent: ((event: any) => void) | null = null;

  public selfId: string = Math.random().toString(36).substring(7);

  init() {
    if (this.room) return;

    const config = { appId: APP_ID };
    this.room = joinRoom(config, ROOM_ID);

    // Create Actions
    const [sendPlayer, getPlayer] = this.room.makeAction('playerUpdate');
    const [sendEvent, getEvent] = this.room.makeAction('gameEvent');

    this.sendPlayerAction = sendPlayer;
    this.sendGameEventAction = sendEvent;

    // Listeners
    getPlayer((data: NetworkPlayerState, peerId: string) => {
        if (this.onPlayerUpdate) {
            this.onPlayerUpdate(peerId, data);
        }
    });

    getEvent((data: any) => {
        if (this.onGameEvent) {
            this.onGameEvent(data);
        }
    });

    this.room.onPeerLeave((peerId: string) => {
        if (this.onPlayerLeave) {
            this.onPlayerLeave(peerId);
        }
    });

    console.log('Multiplayer initialized. ID:', this.selfId);
  }

  broadcastPlayerState(state: NetworkPlayerState) {
    if (this.sendPlayerAction) {
        this.sendPlayerAction(state);
    }
  }

  broadcastEvent(event: any) {
    if (this.sendGameEventAction) {
        this.sendGameEventAction(event);
    }
  }
}

export const multiplayer = new MultiplayerService();