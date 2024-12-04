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
// 这里耦合了，但是我懒得改
deviceManager.tcpServer = tcpServer;

// 启动服务
webServer.start(3000);
tcpServer.start(7777);
