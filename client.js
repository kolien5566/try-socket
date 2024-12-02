const net = require('net');
const HOST = '192.168.110.174';
const PORT = 54321;

// 创建客户端
const client = new net.Socket();

// 连接配置
const config = {
    host: HOST,
    port: PORT
};

// 连接到服务器
client.connect(config, () => {
    console.log('已连接到服务器');
    
    // 发送测试消息
    client.write('Hello, Server!');
});

// 设置编码格式
client.setEncoding('utf8');

// 接收数据
client.on('data', (data) => {
    console.log(`收到服务器数据: ${data}`);
});

// 连接关闭
client.on('close', () => {
    console.log('连接已关闭');
});

// 错误处理
client.on('error', (err) => {
    console.error(`连接错误: ${err.message}`);
});

// 处理用户输入
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    // 发送用户输入到服务器
    client.write(data.trim());
});
