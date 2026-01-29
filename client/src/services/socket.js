import io from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.endsWith('.local')
);

const envApiUrl = import.meta.env.VITE_API_URL;
const isEnvLocalhost = envApiUrl && envApiUrl.includes('localhost');

const SOCKET_URL = isLocal
    ? `http://${window.location.hostname}:5005`
    : (isEnvLocalhost ? 'https://trio-app-server.onrender.com' : (envApiUrl ? envApiUrl.replace('/api', '') : 'https://trio-app-server.onrender.com'));

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                console.log('✅ Real-time connection established');

                // If user is logged in, join their private consultant room
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user.id) {
                    this.joinRoom(`consultant_${user.id}`);
                }
                if (user.role === 'admin') {
                    this.joinRoom('admin_room');
                }
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Real-time connection lost');
            });
        }
        return this.socket;
    }

    joinRoom(roomName) {
        if (this.socket) {
            this.socket.emit('joinRoom', roomName);
        }
    }

    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const socketService = new SocketService();
export default socketService;
