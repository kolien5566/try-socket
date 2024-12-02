const net = require('net');
const PORT = 8080;

// 创建客户端连接池
const clients = new Set();

// 创建服务器
const server = net.createServer((socket) => {
    // 客户端连接信息
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`新的客户端连接: ${clientAddress}`);
    
    // 将新客户端添加到连接池
    clients.add(socket);
    
    // 设置编码格式
    socket.setEncoding('utf8');

    // 接收数据
    socket.on('data', (data) => {
        console.log(`收到来自 ${clientAddress} 的数据: ${data}`);
        
        // 广播消息给所有客户端
        clients.forEach((client) => {
            if (client !== socket) {
                client.write(`${clientAddress} 说: ${data}`);
            }
        });
    });

    // 连接关闭
    socket.on('close', () => {
        console.log(`客户端断开连接: ${clientAddress}`);
        clients.delete(socket);
    });

    // 错误处理
    socket.on('error', (err) => {
        console.error(`客户端 ${clientAddress} 错误: ${err.message}`);
        clients.delete(socket);
    });

    // 发送欢迎消息
    socket.write('欢迎连接到服务器！\n');
});

// 服务器错误处理
server.on('error', (err) => {
    console.error(`服务器错误: ${err.message}`);
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器启动在端口 ${PORT}`);
});
