const express = require('express');
const { createServer } = require('http');
const path = require('path');

class WebServer {
    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.app.use(express.static(path.join(__dirname, '../public')));
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
