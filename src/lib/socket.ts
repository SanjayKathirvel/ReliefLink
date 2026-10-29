import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[ReliefLink Real-Time] Connected to server. Socket ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[ReliefLink Real-Time] Disconnected from server:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[ReliefLink Real-Time] Reconnected after', attemptNumber, 'attempts.');
    });
  }

  return socket;
}
