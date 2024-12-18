const net = require('net');
const Protocol = require('./protocol');

function formatDate(date) {
    return date.getFullYear() + '-' +
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0') + ' ' +
           String(date.getHours()).padStart(2, '0') + ':' +
           String(date.getMinutes()).padStart(2, '0') + ':' +
           String(date.getSeconds()).padStart(2, '0') + '.' +
           String(date.getMilliseconds()).padStart(3, '0');
}

class TcpServer {
    constructor(deviceManager) {
        this.server = net.createServer();
        this.deviceManager = deviceManager;
        // 存储设备最后心跳时间
        this.deviceHeartbeats = new Map();
        // 添加活动连接计数器
        this.activeConnections = 0;
        // 添加连接池（可选，用于更详细的连接管理）
        this.connections = new Map();
    }

    start(port) {
        this.server.on('connection', (socket) => {

            const clientIP = socket.remoteAddress;
            const clientPort = socket.remotePort;
            // 增加连接计数
            this.activeConnections++;
            console.log(`New device connected from [${clientIP}:${clientPort}]`);
            console.log(`Current active connections: ${this.activeConnections}`);

            
            // 可选：记录连接详情
            const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
            this.connections.set(connectionId, {
                socket: socket,
                connectedAt: new Date(),
                deviceSN: null
            });

            let deviceSN = null;
            let heartbeatTimer = null;

            socket.on('data', async (data) => {
                const message = Protocol.parseMessage(data);
                if (message != null) {
                    await this.handleMessage(socket, message, deviceSN, heartbeatTimer, (sn) => {
                        deviceSN = sn;
                        // 更新连接信息
                        if (this.connections.has(connectionId)) {
                            this.connections.get(connectionId).deviceSN = sn;
                        }
                    }, (timer) => {
                        heartbeatTimer = timer;
                    }, clientIP, clientPort);
                } else {
                    console.error(`[${formatDate(new Date())}] Not Parsed!`);
                    console.log(data);
                }
            });

            socket.on('close', (hadError) => {
                // 减少连接计数
                this.activeConnections--;
                console.log(`Connection closed. Current active connections: ${this.activeConnections}`);
                console.log('Close reason:', hadError ? 'Due to error' : 'Normal closure');
                
                // 如果存在最后的错误，输出错误信息
                if (socket._lastError) {
                    console.error('Last error before close:', {
                        message: socket._lastError.message,
                        code: socket._lastError.code,
                        address: socket.remoteAddress,
                        port: socket.remotePort
                    });
                }
            
                // 清理连接信息
                this.connections.delete(connectionId);
            
                if (deviceSN) {
                    console.log(`Device ${deviceSN} disconnected`);
                    this.deviceManager.setDeviceOffline(deviceSN);
                    this.deviceHeartbeats.delete(deviceSN);
                    if (heartbeatTimer) {
                        clearInterval(heartbeatTimer);
                    }
                }
            });
            

            socket.on('error', (err) => {
                console.error('Socket error:', err);
                // 错误处理时不需要减少计数，因为 close 事件会紧随其后
                if (deviceSN) {
                    this.deviceManager.setDeviceOffline(deviceSN);
                    this.deviceHeartbeats.delete(deviceSN);
                    if (heartbeatTimer) {
                        clearInterval(heartbeatTimer);
                    }
                }
            });
        });

        this.server.listen(port, () => {
            console.log(`TCP Server listening on port ${port}`);
        });
    }


    // 获取历史数据
    async requestResumeData(deviceSN, startTime, packCount) {
        const device = await this.deviceManager.getDevice(deviceSN);
        if (!device || !device.socket) {
            throw new Error('Device not found or offline');
        }

        const cmdIndex = '19830718';
        const message = Protocol.constructMessage(
            Buffer.from([0x01, 0x01, 0x08]),
            {
                CmdIndex: cmdIndex,
                Command: "Resume",
                Parameter1: startTime,
                Parameter2: packCount.toString()
            }
        );
        device.socket.write(message);
        return cmdIndex;
    }

    async handleMessage(socket, message, deviceSN, heartbeatTimer, setDeviceSN, setHeartbeatTimer, clientIP, clientPort) {
        const messageHeader = message.header.toString('hex');
        if(message.data) {
            console.log(message.data.length);
        }
        try {
            switch (messageHeader) {
                case '010100': // 心跳
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 00 heartbeat`);
                    break;

                case '010102': // 登录
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 02 login`);
                    const loginData = JSON.parse(message.data.toString());
                    const newDeviceSN = loginData.UserName;
                    setDeviceSN(newDeviceSN);

                    // 更新心跳时间和定时器
                    this.deviceHeartbeats.set(newDeviceSN, Date.now());
                    if (heartbeatTimer) clearInterval(heartbeatTimer);
                    // setHeartbeatTimer(setInterval(() => {
                    //     const lastHeartbeat = this.deviceHeartbeats.get(newDeviceSN);
                    //     if (lastHeartbeat && (Date.now() - lastHeartbeat > 30000)) {
                    //         console.log(`Device ${newDeviceSN} heartbeat timeout`);
                    //         this.deviceManager.setDeviceOffline(newDeviceSN);
                    //         socket.destroy();
                    //     }
                    // }, 10000));

                    // 处理设备登录
                    const device = await this.deviceManager.getDevice(newDeviceSN);
                    if (device) {
                        await this.deviceManager.setDeviceOnline(newDeviceSN, socket);
                    } else {
                        await this.deviceManager.addDevice(newDeviceSN, socket);
                    }
                    const loginResponse = Protocol.constructMessage(
                        Buffer.from([0x01, 0x02, 0x02]),
                        { Status: "Success" }
                    );
                    socket.write(loginResponse);
                    break;

                case '010103': // getConfig
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 03 getConfig`);
                    if (message.data) {
                        const dataResponse = Protocol.constructMessage(
                            Buffer.from([0x01, 0x02, 0x03]),
                            { Status: "Success" }
                        );
                        socket.write(dataResponse);
                    }
                    break;

                case '010114': // getConfigExtend
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 14 getConfigExtend`);
                    if (message.data) {
                        const dataResponse = Protocol.constructMessage(
                            Buffer.from([0x01, 0x02, 0x14]),
                            { Status: "Success" }
                        );
                        socket.write(dataResponse);
                    }
                    break;

                case '010110': // 秒级数据
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 10 second data`);
                    try {
                        if (deviceSN) {
                            this.deviceHeartbeats.set(deviceSN, Date.now());
                        }
                        const secondData = JSON.parse(message.data.toString());
                        if (secondData && secondData.SN) {
                            this.deviceManager.handleSecondData(secondData.SN, secondData);
                        }
                    } catch (err) {
                        console.error('Error in 10 second data:', err);
                    }
                    break;

                case '010104': // setConfig
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 04 setConfig`);
                    console.log(message.data.toString());
                    const setConfigResponse = Protocol.constructMessage(
                        Buffer.from([0x01, 0x02, 0x04]),
                        { Status: "Success" }
                    );
                    socket.write(setConfigResponse);
                    break;

                case '010115': // setConfigExtend
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 15 setConfigExtend`);
                    const setConfigExtendResponse = Protocol.constructMessage(
                        Buffer.from([0x01, 0x02, 0x15]),
                        { Status: "Success" }
                    );
                    socket.write(setConfigExtendResponse);
                    break;

                case '01010f': // 故障解析
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 0f fault`);
                    const faultResponse = Protocol.constructMessage(
                        Buffer.from([0x01, 0x02, 0x0f]),
                        { Status: "Success" }
                    );
                    socket.write(faultResponse);
                    break;
                case '010208':
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 08 reply ems command`);
                    break;
                case '010109':
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 09 info`);
                    const infoResponse = Protocol.constructMessage(
                        Buffer.from([0x01, 0x02, 0x09]),
                        { Status: "Success" }
                    );
                    socket.write(infoResponse);
                    break;
                case '01010c': // Resume Data
                    console.log(`[${formatDate(new Date())}] [${clientIP}:${clientPort}] 0c resume data`);
                    const csvData = message.data.toString();
                    const resumeResponse = Protocol.constructMessage(
                        Buffer.from([0x01, 0x02, 0x0c]),
                        { Status: "Success" }
                    );
                    socket.write(resumeResponse);
                    // 通知 WebSocket
                    this.deviceManager.notifyResumeData(deviceSN, csvData);
                    break;
                default: // 其他
                    console.log('Unknown message:', messageHeader);
            }
        } catch (err) {
            console.error('Error in handleMessage:', err);
        }
    }
}

module.exports = TcpServer;
