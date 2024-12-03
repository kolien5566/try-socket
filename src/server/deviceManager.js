// deviceManager.js
class DeviceManager {
    constructor(io) {
        this.devices = new Map(); // 保存设备列表
        this.io = io;

        // 处理WebSocket连接
        this.io.on('connection', (socket) => {
            console.log('Web client connected');
            
            // 发送当前设备列表给新连接的客户端
            const deviceList = Array.from(this.devices.keys());
            socket.emit('deviceList', deviceList);

            // 客户端请求订阅某个设备的秒级数据
            socket.on('subscribeDevice', (sn) => {
                socket.join(sn); // 加入设备房间
            });

            // 客户端取消订阅某个设备的秒级数据
            socket.on('unsubscribeDevice', (sn) => {
                socket.leave(sn);
            });

            socket.on('disconnect', () => {
                console.log('Web client disconnected');
            });
        });
    }

    // 添加设备
    addDevice(sn, socket) {
        this.devices.set(sn, {
            socket,
            lastHeartbeat: Date.now()
        });
        
        // 通知所有Web客户端有新设备上线
        this.io.emit('deviceOnline', sn);
    }

    // 移除设备
    removeDevice(sn) {
        this.devices.delete(sn);
        // 通知所有Web客户端设备离线
        this.io.emit('deviceOffline', sn);
    }

    // 处理秒级数据
    handleSecondData(sn, data) {
        // 向订阅了该设备的客户端推送数据
        this.io.to(sn).emit('secondData', {
            sn,
            data,
            timestamp: Date.now()
        });
    }

    // 获取所有在线设备
    getOnlineDevices() {
        return Array.from(this.devices.keys());
    }
}

module.exports = DeviceManager;
