// tcpServer.js
const net = require('net');
const Protocol = require('./protocol');

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

    // 这里是被动响应
    async handleMessage(socket, message) {
        // 消息头
        const messageHeader = message.header.toString('hex');
        try {
            switch (messageHeader) {
                case '010100': // 心跳
                    console.log('心跳');
                    break;
                case '010102': // 登录
                    const deviceSN = message.data.UserName;
                    await this.deviceManager.addDevice(deviceSN, socket);
                    // 发送登录响应
                    const successResponse = Protocol.constructMessage(
                        Buffer.from([0x01, 0x02, 0x02]),
                        { "Status": "Success" }
                    );
                    socket.write(successResponse);
                    break;
                case '01010f': // 故障解析
                    console.log('故障解析');
                    break;
                case '010103': // getConfig
                    console.log('03配置');
                    if (message.data && message.data.SN) {
                        let configJson = { "Status": "Success", "SN": "ALD0A0124070002", "License": null, "Country": null, "Address": null, "ZipCode": "1111111", "PhoneNumber": null, "Popv": "5.00", "Minv": "BW-INV-SPH5K", "Poinv": "5.00", "Cobat": "10.08", "Mbat": "SMILE-G3-BAT-10.1P", "Uscapacity": "95.00", "ACDC": "2", "GridCharge": false, "BatHighCap": "100.00", "BatUseCap": "10.00", "CtrDis": false, "GridChargeWE": false, "BatHighCapWE": "0", "BatUseCapWE": "0", "CtrDisWE": false, "SetMode": "0", "SetFeed": "100", "SetPhase": "0", "CTRate": "0", "GeneratorMode": "0", "Generator": false, "BackUpBox": false, "Fan": false, "GCSOCStart": "0", "GCSOCEnd": "0", "GCTimeStart": "0", "GCTimeEnd": "0", "GCOutputMode": "0", "GCChargePower": "0", "GCRatedPower": "0", "L1Priority": "1", "L2Priority": "2", "L3Priority": "3", "L1SocLimit": "0.00", "L2SocLimit": "0.00", "L3SocLimit": "0.00", "BatReady": "0", "Safe": "28", "PowerFact": "0", "Volt5MinAvg": "0", "Volt10MinAvg": "0", "TempThreshold": "0", "OutCurProtect": "0", "DCI": "0", "RCD": "0", "PvISO": "0", "ChargeBoostCur": "0", "Channel1": "0", "ControlMode1": null, "StartTime1A": null, "EndTime1A": null, "StartTime1B": null, "EndTime1B": null, "ChargeSOC1": null, "UPS1": "0", "SwitchOn1": "0", "SwitchOff1": "0", "Delay1": "0", "Duration1": "0", "Pause1": "0", "Channel2": "0", "ControlMode2": null, "StartTime2A": null, "EndTime2A": null, "StartTime2B": null, "EndTime2B": null, "ChargeSOC2": null, "UPS2": "0", "SwitchOn2": "0", "SwitchOff2": "0", "Delay2": "0", "Duration2": "0", "Pause2": "0", "ChargeMode1": "1", "ChargeMode2": "1", "MaxGridCharge": "10.00", "InstallMeterOption": "0", "InstallModule": "0", "StringAE": "0", "StringBE": "0", "StringCE": "0", "PmeterOffset": "0", "PmeterMax": "0", "DG_Cap": "0", "GridMeterCTE": "0", "Mmeter": "CT", "MeterACNegate": "0", "PVMeterCTE": "0", "PVMeterCTRate": "0", "MeterDCNegate": "0", "NetType": "W5500", "WifiSN": "0", "WifiSW": "0", "WifiHW": "0", "SlaveVersion": "", "InvHWVersion": "V1.0", "SelfUseOrEconomic": "0", "ReliefMode": "0", "VPPMode": "0", "CheckTime": "2024-09-09 03:38:08", "TimeChaF1": "0", "TimeChaE1": "0", "TimeChaF2": "0", "TimeChaE2": "0", "TimeDisF1": "0", "TimeDisE1": "0", "TimeDisF2": "0", "TimeDisE2": "0", "TimeChaFM1": "0", "TimeChaEM1": "0", "TimeChaFM2": "0", "TimeChaEM2": "0", "TimeDisFM1": "0", "TimeDisEM1": "0", "TimeDisFM2": "0", "TimeDisEM2": "0", "TimeChaFWE1": "0", "TimeChaEWE1": "0", "TimeChaFWE2": "0", "TimeChaEWE2": "0", "TimeDisFWE1": "0", "TimeDisEWE1": "0", "TimeDisFWE2": "0", "TimeDisEWE2": "0", "OnGridCap": "0.00", "StorageCap": "5000.00", "EmsLanguage": 0, "Date1": "0", "Date2": "0", "ChargeWorkDays": "0", "ChargeWeekend": "0", "SafeSub": "0", "POCMeterEnable": "0", "FAAEnable": "0", "RRCREnable": "0", "FeedinK1": "100", "FeedinK2": "60", "FeedinK3": "30", "FeedinK4": "0", "MPPTScanEnable": "0", "ThreeUnbalanceEN": "0", "GCATS": "0", "Parallel_EN": "0", "Parallel_Selection": "0", "Parallel_Mode": "0", "FactoryFlag": "1", "GridFormingEN": "0", "BackupBoxReady": "2", "BackupBoxModel": "0", "UPSReserveEN": "0", "StorageBreakerSpecs": "32" };
                        const dataResponse = Protocol.constructMessage(
                            Buffer.from([0x01, 0x02, 0x03]),
                            configJson
                        );
                        socket.write(dataResponse);
                    }
                    break;
                case '010114': // getConfigExtend
                    console.log('14配置');
                    if (message.data && message.data.SN) {
                        let configJson = { "Status": "Success", "SN": "ALD0A0124070002", "License": null, "Country": null, "Address": null, "ZipCode": "1111111", "PhoneNumber": null, "Popv": "5.00", "Minv": "BW-INV-SPH5K", "Poinv": "5.00", "Cobat": "10.08", "Mbat": "SMILE-G3-BAT-10.1P", "Uscapacity": "95.00", "ACDC": "2", "GridCharge": false, "BatHighCap": "100.00", "BatUseCap": "10.00", "CtrDis": false, "GridChargeWE": false, "BatHighCapWE": "0", "BatUseCapWE": "0", "CtrDisWE": false, "SetMode": "0", "SetFeed": "100", "SetPhase": "0", "CTRate": "0", "GeneratorMode": "0", "Generator": false, "BackUpBox": false, "Fan": false, "GCSOCStart": "0", "GCSOCEnd": "0", "GCTimeStart": "0", "GCTimeEnd": "0", "GCOutputMode": "0", "GCChargePower": "0", "GCRatedPower": "0", "L1Priority": "1", "L2Priority": "2", "L3Priority": "3", "L1SocLimit": "0.00", "L2SocLimit": "0.00", "L3SocLimit": "0.00", "BatReady": "0", "Safe": "28", "PowerFact": "0", "Volt5MinAvg": "0", "Volt10MinAvg": "0", "TempThreshold": "0", "OutCurProtect": "0", "DCI": "0", "RCD": "0", "PvISO": "0", "ChargeBoostCur": "0", "Channel1": "0", "ControlMode1": null, "StartTime1A": null, "EndTime1A": null, "StartTime1B": null, "EndTime1B": null, "ChargeSOC1": null, "UPS1": "0", "SwitchOn1": "0", "SwitchOff1": "0", "Delay1": "0", "Duration1": "0", "Pause1": "0", "Channel2": "0", "ControlMode2": null, "StartTime2A": null, "EndTime2A": null, "StartTime2B": null, "EndTime2B": null, "ChargeSOC2": null, "UPS2": "0", "SwitchOn2": "0", "SwitchOff2": "0", "Delay2": "0", "Duration2": "0", "Pause2": "0", "ChargeMode1": "1", "ChargeMode2": "1", "MaxGridCharge": "10.00", "InstallMeterOption": "0", "InstallModule": "0", "StringAE": "0", "StringBE": "0", "StringCE": "0", "PmeterOffset": "0", "PmeterMax": "0", "DG_Cap": "0", "GridMeterCTE": "0", "Mmeter": "CT", "MeterACNegate": "0", "PVMeterCTE": "0", "PVMeterCTRate": "0", "MeterDCNegate": "0", "NetType": "W5500", "WifiSN": "0", "WifiSW": "0", "WifiHW": "0", "SlaveVersion": "", "InvHWVersion": "V1.0", "SelfUseOrEconomic": "0", "ReliefMode": "0", "VPPMode": "0", "CheckTime": "2024-09-09 03:38:08", "TimeChaF1": "0", "TimeChaE1": "0", "TimeChaF2": "0", "TimeChaE2": "0", "TimeDisF1": "0", "TimeDisE1": "0", "TimeDisF2": "0", "TimeDisE2": "0", "TimeChaFM1": "0", "TimeChaEM1": "0", "TimeChaFM2": "0", "TimeChaEM2": "0", "TimeDisFM1": "0", "TimeDisEM1": "0", "TimeDisFM2": "0", "TimeDisEM2": "0", "TimeChaFWE1": "0", "TimeChaEWE1": "0", "TimeChaFWE2": "0", "TimeChaEWE2": "0", "TimeDisFWE1": "0", "TimeDisEWE1": "0", "TimeDisFWE2": "0", "TimeDisEWE2": "0", "OnGridCap": "0.00", "StorageCap": "5000.00", "EmsLanguage": 0, "Date1": "0", "Date2": "0", "ChargeWorkDays": "0", "ChargeWeekend": "0", "SafeSub": "0", "POCMeterEnable": "0", "FAAEnable": "0", "RRCREnable": "0", "FeedinK1": "100", "FeedinK2": "60", "FeedinK3": "30", "FeedinK4": "0", "MPPTScanEnable": "0", "ThreeUnbalanceEN": "0", "GCATS": "0", "Parallel_EN": "0", "Parallel_Selection": "0", "Parallel_Mode": "0", "FactoryFlag": "1", "GridFormingEN": "0", "BackupBoxReady": "2", "BackupBoxModel": "0", "UPSReserveEN": "0", "StorageBreakerSpecs": "32" };
                        const dataResponse = Protocol.constructMessage(
                            Buffer.from([0x01, 0x02, 0x14]),
                            configJson
                        );
                        socket.write(dataResponse);
                    }
                    break;
                case '010110': // 秒级数据
                    console.log('10秒级数据');
                    console.log(message.data);
                    break;
                case '010104': // setConfig
                    console.log('04配置');
                    console.log(message.data);
                    break;
                case '010115': // setConfigExtend
                    console.log('15配置');
                    console.log(message.data);
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
