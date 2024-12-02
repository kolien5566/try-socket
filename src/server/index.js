// 入口文件
const TcpServer = require('./tcpServer');
const WebServer = require('./webServer');
const DeviceManager = require('./deviceManager');
const { Server } = require('socket.io');

// 创建实例
const webServer = new WebServer();
const io = new Server(webServer.getHttpServer());
const deviceManager = new DeviceManager(io);
const tcpServer = new TcpServer(deviceManager);

// 设置路由
webServer.setupRoutes(deviceManager);

// 启动服务器
webServer.start(3000);
tcpServer.start(8080);
