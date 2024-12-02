// deviceManager.js
const db = require('./database');

class DeviceManager {
    constructor(io) {
        this.devices = new Map();
        this.io = io;

        // 处理WebSocket连接
        this.io.on('connection', (socket) => {
            console.log('Web client connected');
            
            // 发送当前所有设备状态
            const deviceStatus = Array.from(this.devices.entries()).map(([sn, device]) => ({
                sn,
                status: device.status,
                lastHeartbeat: device.lastHeartbeat
            }));
            socket.emit('deviceList', deviceStatus);

            // 处理前端发来的配置更新请求
            socket.on('updateConfig', async (data) => {
                const { sn, config } = data;
                await this.updateDeviceConfig(sn, config);
            });

            // 处理前端请求设备历史数据
            socket.on('getHistory', async (data) => {
                const { sn, startTime, endTime } = data;
                try {
                    const history = await db.getRunningHistory(sn, startTime, endTime);
                    socket.emit('historyData', { sn, history });
                } catch (err) {
                    console.error('Error fetching history:', err);
                }
            });

            socket.on('disconnect', () => {
                console.log('Web client disconnected');
            });
        });
    }

    // 添加设备
    async addDevice(sn, socket) {
        const deviceInfo = {
            sn,
            socket,
            status: 'online',
            lastHeartbeat: Date.now()
        };

        // 获取最新配置
        const config = await db.getLatestConfig(sn);
        if (config) {
            deviceInfo.config = config;
        }

        this.devices.set(sn, deviceInfo);
        this.notifyDeviceUpdate(sn, 'online');
        
        return deviceInfo;
    }

    // 移除设备
    removeDevice(sn) {
        const device = this.devices.get(sn);
        if (device) {
            device.socket.destroy();
            this.devices.delete(sn);
            this.notifyDeviceUpdate(sn, 'offline');
        }
    }

    // 更新设备状态
    updateDeviceStatus(sn, status) {
        const device = this.devices.get(sn);
        if (device) {
            device.status = status;
            device.lastHeartbeat = Date.now();
            this.notifyDeviceUpdate(sn, status);
        }
    }

    // 保存运行数据
    async saveRunningData(sn, data) {
        try {
            await db.saveRunningData(sn, data);
            this.notifyDeviceUpdate(sn, 'data_update');
        } catch (err) {
            console.error('Error saving running data:', err);
        }
    }

    // 更新设备配置
    async updateDeviceConfig(sn, config) {
        try {
            await db.saveDeviceConfig(sn, config);
            const device = this.devices.get(sn);
            if (device) {
                // 发送配置到设备
                // 这里需要根据你的协议格式构造消息
                const configMessage = this.constructConfigMessage(config);
                device.socket.write(configMessage);
            }
            this.notifyDeviceUpdate(sn, 'config_update');
            return true;
        } catch (err) {
            console.error('Error updating config:', err);
            return false;
        }
    }

    // 通过WebSocket通知前端
    notifyDeviceUpdate(sn, status) {
        const device = this.devices.get(sn);
        this.io.emit('deviceUpdate', {
            sn,
            status,
            lastHeartbeat: device ? device.lastHeartbeat : Date.now(),
            timestamp: Date.now()
        });
    }

    // 获取设备
    getDevice(sn) {
        return this.devices.get(sn);
    }
}

module.exports = DeviceManager;
