class DeviceManager {
    constructor(io, tcpServer) {  // 添加tcpServer参数
        this.devices = new Map();
        this.io = io;
        this.tcpServer = tcpServer;  // 保存tcpServer引用

        this.io.on('connection', (socket) => {
            console.log('Web client connected');

            const deviceList = Array.from(this.devices.entries())
                .map(([sn, device]) => ({
                    sn,
                    online: device.online
                }));
            socket.emit('deviceList', deviceList);

            // 客户端请求订阅某个设备的秒级数据
            socket.on('subscribeDevice', (sn) => {
                socket.join(sn);
            });

            // 客户端取消订阅某个设备的秒级数据
            socket.on('unsubscribeDevice', (sn) => {
                socket.leave(sn);
            });

            // 添加处理Resume Data请求的监听器
            socket.on('requestResumeData', async (data) => {
                try {
                    const { sn, startTime, packCount } = data;
                    await this.requestResumeData(sn, startTime, packCount);
                    socket.emit('requestResumeDataResponse', {
                        success: true,
                        message: 'Request sent successfully'
                    });
                } catch (error) {
                    socket.emit('requestResumeDataResponse', {
                        success: false,
                        message: error.message
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log('Web client disconnected');
            });
        });
    }

    async getDevice(sn) {
        return this.devices.get(sn);
    }

    async addDevice(sn, socket) {
        this.devices.set(sn, {
            socket,
            online: true,
            lastData: null
        });
        
        this.io.emit('deviceOnline', sn);
    }

    async setDeviceOnline(sn, socket) {
        const device = this.devices.get(sn);
        if (device) {
            device.socket = socket;
            device.online = true;
            this.io.emit('deviceOnline', sn);
        }
    }

    async setDeviceOffline(sn) {
        const device = this.devices.get(sn);
        if (device) {
            device.online = false;
            this.io.emit('deviceOffline', sn);
        }
    }

    getDeviceList() {
        return Array.from(this.devices.entries())
            .map(([sn, device]) => ({
                sn,
                online: device.online
            }));
    }

    handleSecondData(sn, data) {
        const device = this.devices.get(sn);
        if (device) {
            device.lastData = {
                data,
                timestamp: Date.now()
            };
        }

        this.io.to(sn).emit('secondData', {
            sn,
            data,
            timestamp: Date.now()
        });
    }

    async requestResumeData(sn, startTime, packCount) {
        const device = this.devices.get(sn);
        if (!device || !device.online) {
            throw new Error('Device is offline or not found');
        }

        try {
            return await this.tcpServer.requestResumeData(sn, startTime, packCount);
        } catch (err) {
            console.error('Request resume data failed:', err);
            throw err;
        }
    }

    notifyResumeDataSaved(deviceSN, fileName) {
        this.io.to(deviceSN).emit('resumeDataSaved', {
            sn: deviceSN,
            fileName: fileName,
            timestamp: Date.now()
        });
    }
}

module.exports = DeviceManager;
