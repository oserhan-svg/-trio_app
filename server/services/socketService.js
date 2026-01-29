const socketIo = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
    }

    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: (origin, callback) => callback(null, true), // Allow all for socket
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
