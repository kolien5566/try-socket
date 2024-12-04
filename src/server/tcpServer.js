const net = require('net');
const Protocol = require('./protocol');
const { baseConfig } = require('./config');

class TcpServer {
    constructor(deviceManager) {
        this.server = net.createServer();
        this.deviceManager = deviceManager;
        this.deviceHeartbeats = new Map(); // 存储设备最后心跳时间
    }

    start(port) {
        this.server.on('connection', (socket) => {
            console.log('New device connected');
            let deviceSN = null;
            let heartbeatTimer = null;

            socket.on('data', async (data) => {
                try {
                    console.log(data);
                    // data记录到文件
                    const fs = require('fs');
                    // 当data（buffer）是01 01 0c开头的时候，写入到文件
                    if (data[0] === 0x01 && data[1] === 0x01 && data[2] === 0x0c) {
                        fs.appendFile('data.txt', data, (err) => {
                            if (err) throw err;
                            console.log('The data was appended to file!');
                        });
                    }

                    const message = Protocol.parseMessage(data);
                    if (message != null) {
                        await this.handleMessage(socket, message, deviceSN, heartbeatTimer, (sn) => {
                            deviceSN = sn;
                        }, (timer) => {
                            heartbeatTimer = timer;
                        });
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
                    this.deviceManager.setDeviceOffline(deviceSN);
                    this.deviceHeartbeats.delete(deviceSN);
                    if (heartbeatTimer) {
                        clearInterval(heartbeatTimer);
                    }
                }
            });

            socket.on('error', (err) => {
                console.error('Socket error:', err);
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

        // 发送请求
        device.socket.write(message);
        return cmdIndex; // 返回cmdIndex以便跟踪请求
    }

    async handleMessage(socket, message, deviceSN, heartbeatTimer, setDeviceSN, setHeartbeatTimer) {
        const messageHeader = message.header.toString('hex');
        try {
            switch (messageHeader) {
                case '010100': // 心跳
                    console.log('心跳');
                    if (deviceSN) {
                        this.deviceHeartbeats.set(deviceSN, Date.now());
                    }
                    break;

                case '010102': // 登录
                    console.log('登录');
                    const newDeviceSN = message.data.UserName;
                    setDeviceSN(newDeviceSN);

                    // 更新心跳时间和定时器
                    this.deviceHeartbeats.set(newDeviceSN, Date.now());
                    if (heartbeatTimer) clearInterval(heartbeatTimer);
                    setHeartbeatTimer(setInterval(() => {
                        const lastHeartbeat = this.deviceHeartbeats.get(newDeviceSN);
                        if (lastHeartbeat && (Date.now() - lastHeartbeat > 60000)) {
                            console.log(`Device ${newDeviceSN} heartbeat timeout`);
                            this.deviceManager.setDeviceOffline(newDeviceSN);
                            socket.destroy();
                        }
                    }, 10000));

                    // 处理设备登录
                    const device = await this.deviceManager.getDevice(newDeviceSN);
                    if (device) {
                        await this.deviceManager.setDeviceOnline(newDeviceSN, socket);
                    } else {
                        await this.deviceManager.addDevice(newDeviceSN, socket);
                    }
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
                case '010208':
                    console.log('EMS回复特殊指令');
                    break;
                case '01010c': // Resume Data
                    console.log('获取resume data');
                    console.log(message.data)
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
