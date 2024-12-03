const net = require('net');
const Protocol = require('./protocol');
const { baseConfig } = require('./config');

class TcpServer {
    constructor(deviceManager) {
        this.server = net.createServer();
        this.deviceManager = deviceManager;
    }

    start(port) {
        this.server.on('connection', (socket) => {
            console.log('New device connected');
            let deviceSN = null;

            socket.on('data', async (data) => {
                try {
                    const message = Protocol.parseMessage(data);
                    if (message != null) {
                        await this.handleMessage(socket, message);
                    } else {
                        console.error('Not Parsed!');
                    }
                } catch (err) {
                    console.error('Error handling message:', err);
                }
            });

            socket.on('close', () => {
                if (deviceSN) {
                    console.log(`Device ${deviceSN} disconnected`);
                    this.deviceManager.removeDevice(deviceSN);
                }
            });

            socket.on('error', (err) => {
                console.error('Socket error:', err);
                if (deviceSN) {
                    this.deviceManager.removeDevice(deviceSN);
                }
            });
        });

        this.server.listen(port, () => {
            console.log(`TCP Server listening on port ${port}`);
        });
    }

    // 响应
    async handleMessage(socket, message) {
        // 消息头
        const messageHeader = message.header.toString('hex');
        try {
            switch (messageHeader) {
                case '010100': // 心跳
                    console.log('心跳');
                    break;
                case '010102': // 登录
                    console.log('登录');
                    const deviceSN = message.data.UserName;
                    await this.deviceManager.addDevice(deviceSN, socket);
                    const successResponse = Protocol.constructMessage(
                        Buffer.from([0x01, 0x02, 0x02]),
                        { Status: "Success" }
                    );
                    socket.write(successResponse);
                    break;
                case '010103': // getConfig
                    console.log('03配置');
                    if (message.data && message.data.SN) {
                        const dataResponse = Protocol.constructMessage(
                            Buffer.from([0x01, 0x02, 0x03]),
                            baseConfig,
                        );
                        socket.write(dataResponse);
                    }
                    break;
                case '010114': // getConfigExtend
                    console.log('14配置');
                    if (message.data && message.data.SN) {
                        const dataResponse = Protocol.constructMessage(
                            Buffer.from([0x01, 0x02, 0x14]),
                            baseConfig,
                        );
                        socket.write(dataResponse);
                    }
                    break;
                case '010110': // 秒级数据
                    console.log('10秒级数据');
                    if (message.data && message.data.SN) {
                        this.deviceManager.handleSecondData(message.data.SN, message.data);
                    }
                    break;
                case '010104': // setConfig
                    console.log('04配置');
                    break;
                case '010115': // setConfigExtend
                    console.log('15配置');
                    break;
                case '01010f': // 故障解析
                    console.log('故障解析');
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
