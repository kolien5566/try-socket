export const App = {
    template: `
            <el-main>
                <!-- 设备列表 -->
                <el-card>
                    <template #header>
                        <div>
                            Device List
                        </div>
                    </template>
                    <el-table
                        :data="devices"
                        style="width: 100%"
                        border
                        >
                        <el-table-column prop="sn" label="SN" />
                        <el-table-column label="Status">
                            <template #default="scope">
                                <el-tag
                                    :type="scope.row.online ? 'success' : 'info'"
                                    size="small">
                                    {{ scope.row.online ? 'Online' : 'Offline' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="Operations">
                            <template #default="scope">
                                <el-button
                                    type="text"
                                    :disabled="!scope.row.online"
                                    @click="handleDeviceClick(scope.row)">
                                    Running Data
                                </el-button>
                                <el-button
                                    type="text"
                                    :disabled="!scope.row.online"
                                    @click="handleResumeClick(scope.row)">
                                    Resume Data
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>

                <!-- 运行数据列表 -->
                <el-card v-if="selectedDevice" style="margin-top: 10px">
                    <template #header>
                        <div>
                            Running Data - {{ selectedDevice }}
                        </div>
                    </template>
                    <el-table
                        :data="runningData"
                        style="width: 100%"
                        height="380"
                        border
                        :header-cell-style="{ whiteSpace: 'nowrap' }"
                        :cell-style="{ whiteSpace: 'nowrap' }">
                        <el-table-column
                            v-for="(_, key) in dataKeys"
                            :key="key"
                            :prop="'data.' + key"
                            :label="key"
                            width="180">
                        </el-table-column>
                    </el-table>
                </el-card>
                <el-empty v-else description="Select a device to view data" />
            </el-main>
    `,

    data() {
        return {
            socket: null,
            devices: [],
            selectedDevice: null,
            runningData: [], // 存储所有接收到的运行数据
            dataKeys: {} // 动态存储数据字段
        }
    },

    created() {
        this.socket = io();
        this.socket.on('deviceList', this.handleDeviceList);
        this.socket.on('deviceOnline', this.handleDeviceOnline);
        this.socket.on('deviceOffline', this.handleDeviceOffline);
        this.socket.on('secondData', this.handleSecondData);
    },

    methods: {
        handleDeviceList(devices) {
            this.devices = devices.map(device => ({
                sn: device.sn,
                online: device.online
            }));
        },

        handleDeviceOnline(sn) {
            const existingDevice = this.devices.find(d => d.sn === sn);
            if (existingDevice) {
                existingDevice.online = true;
            } else {
                this.devices.push({ sn, online: true });
            }
        },

        handleDeviceOffline(sn) {
            const device = this.devices.find(d => d.sn === sn);
            if (device) {
                device.online = false;
            }
            if (this.selectedDevice === sn) {
                this.selectedDevice = null;
                this.runningData = [];
                this.dataKeys = {};
            }
        },

        handleDeviceClick(row) {
            if (!row.online) return; // 如果设备离线，不处理点击事件

            if (this.selectedDevice) {
                this.socket.emit('unsubscribeDevice', this.selectedDevice);
            }
            this.selectedDevice = row.sn;
            this.runningData = []; // 清空之前的数据
            this.dataKeys = {};    // 清空之前的字段
            this.socket.emit('subscribeDevice', row.sn);
        },

        handleSecondData({ sn, data, timestamp }) {
            if (sn === this.selectedDevice) {
                // 更新数据字段
                this.dataKeys = { ...this.dataKeys, ...data };

                // 添加新数据到列表
                this.runningData.unshift({
                    timestamp,
                    data
                });

                // 可以限制最大记录数，比如保留最近100条
                if (this.runningData.length > 100) {
                    this.runningData.pop();
                }
            }
        },

        async handleResumeClick(device) {
            if (!device.online) return;

            try {
                // 获取当前时间前100小时的时间点
                const startTime = new Date();
                startTime.setHours(startTime.getHours() - 100);
                const formattedTime = startTime.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).replace(/\./g, '/'); 
                console.log(formattedTime);
                await this.socket.emit('requestResumeData', {
                    sn: device.sn,
                    startTime: formattedTime,
                    packCount: 12
                });

                this.$message({
                    message: 'Resume data request sent',
                    type: 'success'
                });
            } catch (error) {
                this.$message.error('Failed to request resume data');
            }
        },

        handleResumeDataSaved({ sn, fileName, timestamp }) {
            this.$notify({
                title: 'Resume Data Saved',
                message: `Data for device ${sn} has been saved to ${fileName}`,
                type: 'success'
            });
        },
    }
};
