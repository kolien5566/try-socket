const express = require('express');
const { createServer } = require('http');
const path = require('path');

class WebServer {
    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        // 中间件
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use(express.json());
    }

    setupRoutes(deviceManager) {
        // 设备相关路由
        this.app.get('/api/devices', (req, res) => {
            const devices = Array.from(deviceManager.devices.values());
            res.json(devices);
        });
    }

    getHttpServer() {
        return this.httpServer;
    }

    start(port) {
        this.httpServer.listen(port, () => {
            console.log(`Web Server listening on port ${port}`);
        });
    }
}

module.exports = WebServer;
