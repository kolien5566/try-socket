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
                                <el-tag type="success" size="small">Online</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="Operations">
                            <template #default="scope">
                                <el-button
                                    type="text"
                                    @click="handleDeviceClick(scope.row)">
                                    Running Data
                                </el-button>
                                <el-button
                                    type="text"
                                    @click="handleDeviceClick(scope.row)">
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
            this.devices = devices.map(sn => ({ sn }));
        },

        handleDeviceOnline(sn) {
            if (!this.devices.find(d => d.sn === sn)) {
                this.devices.push({ sn });
            }
        },

        handleDeviceOffline(sn) {
            this.devices = this.devices.filter(d => d.sn !== sn);
            if (this.selectedDevice === sn) {
                this.selectedDevice = null;
                this.runningData = [];
                this.dataKeys = {};
            }
        },

        handleDeviceClick(row) {
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
        }
    }
};
