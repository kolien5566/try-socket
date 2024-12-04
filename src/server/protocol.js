class Protocol {
    static parseMessage(buffer) {
        // 检查数据长度是否至少包含头部和长度字段
        if (buffer.length < 7) {
            return null;
        }

        const header = buffer.slice(0, 3);
        const length = buffer.readUInt32BE(3);

        // 检查是否收到完整的消息
        if (buffer.length < 7 + length) {
            return null;
        }

        const jsonData = buffer.slice(7, 7 + length);
        const checksum = buffer.slice(7 + length);
        let headerHex = header.toString('hex');

        if (headerHex.startsWith("01")) {
            // 心跳,故障解析等我不想做的内容
            if (headerHex == '010100' || headerHex == '01010f') {
                return { header };
            }
            try {
                return {
                    header,
                    length,
                    data: JSON.parse(jsonData.toString()),
                    checksum
                };
            } catch (e) {
                console.log('Incomplete or invalid JSON data:', jsonData.toString());
                return null;
            }
        }
        return null;
    }

    static constructMessage(header, data) {
        const jsonData = Buffer.from(JSON.stringify(data));
        // 创建4字节的长度字段
        const length = Buffer.alloc(4);
        length.writeUInt32BE(jsonData.length);

        // 计算CRC的数据
        const dataForCRC = Buffer.concat([header, length, jsonData]);
        const crc = this.calculateModbusCRC(dataForCRC);

        // 创建2字节的校验和
        const checksum = Buffer.alloc(2);
        checksum.writeUInt16LE(crc);

        return Buffer.concat([header, length, jsonData, checksum]);
    }


    static calculateModbusCRC(buffer) {
        let crc = 0xFFFF;
        for (let i = 0; i < buffer.length; i++) {
            crc ^= buffer[i];
            for (let j = 0; j < 8; j++) {
                if (crc & 0x0001) {
                    crc = (crc >> 1) ^ 0xA001;
                } else {
                    crc = crc >> 1;
                }
            }
        }
        // 高低字节互换
        return ((crc << 8) & 0xFF00) | ((crc >> 8) & 0x00FF);
    }

}

module.exports = Protocol;
