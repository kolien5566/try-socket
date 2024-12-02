const Protocol = require('./src/server/protocol');

// 将十六进制字符串转换为Buffer
function hexStringToBuffer(hexString) {
    // 移除所有空格
    hexString = hexString.replace(/\s/g, '');
    // 每两个字符转换为一个字节
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16));
    }
    return Buffer.from(bytes);
}

// 将Buffer转换为十六进制字符串（用于显示）
function bufferToHexString(buffer) {
    return buffer.toString('hex').match(/.{2}/g).join(' ').toUpperCase();
}

// 测试接收数据解析
let hexString = '01 01 03 00 00 00 19 7b 22 53 4e 22 3a 22 32 30 30 31 30 54 50 32 43 33 57 30 30 30 32 35 22 7d 8b 95';
let buffer = hexStringToBuffer(hexString);
const messageGet = Protocol.parseMessage(buffer);
console.log('解析结果:', messageGet);
console.log('解析的JSON数据:', messageGet.data);

// 测试发送数据构建
let messageSendHeader = hexStringToBuffer('01 01 03');
let messageSendJson = { SN: '20010TP2C3W00025' };
const bufferSend = Protocol.constructMessage(messageSendHeader, messageSendJson);
console.log('构建的数据包(HEX):', bufferToHexString(bufferSend));
