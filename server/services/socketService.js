const socketIo = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
    }

    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true);
                    const allowedOrigins = [
                        'https://trio-app.pages.dev',
                        'https://trio-client.pages.dev',
                        'http://localhost:5173',
                        'http://localhost:3000'
                    ];
                    if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.startsWith('chrome-extension://')) {
                        callback(null, true);
                    } else {
                        console.warn('[CORS] Socket origin not allowed:', origin);
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('joinRoom', (roomName) => {
                socket.join(roomName);
                console.log(`Socket ${socket.id} joined room: ${roomName}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        console.log('Socket.io initialized');
    }

    emit(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        } else {
            console.warn('Socket.io not initialized, cannot emit:', event);
        }
    }

    /**
     * Targeted emission for a specific consultant
     */
    emitToConsultant(consultantId, event, data) {
        if (this.io) {
            this.io.to(`consultant_${consultantId}`).emit(event, data);
        }
    }

    emitToAdmin(event, data) {
        if (this.io) {
            this.io.to('admin_room').emit(event, data);
        }
    }
}

module.exports = new SocketService();
