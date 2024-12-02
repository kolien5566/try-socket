export const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});
