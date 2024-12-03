export const App = {
    template: `
        <el-container class="main-container">
            <el-header>
                <h2>PCS EMS Monitor</h2>
            </el-header>
            <el-container>
                <el-aside width="300px">
                    <el-card class="device-list">
                        <template #header>
                            <div class="card-header">
                                <span>Device List</span>
                                <el-tag>{{ devices.length }} Online</el-tag>
                            </div>
                        </template>
                        <el-table
                            :data="devices"
                            style="width: 100%"
                            @row-click="handleDeviceClick"
                            highlight-current-row>
                            <el-table-column prop="sn" label="SN" />
                            <el-table-column width="80">
                                <template #default="scope">
                                    <el-tag type="success" size="small">Online</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-card>
                </el-aside>
                <el-main>
                    <el-card v-if="selectedDevice" class="data-detail">
                        <template #header>
                            <div class="card-header">
                                <span>Real-time Data - {{ selectedDevice }}</span>
                                <el-tag type="info">Updated: {{ lastUpdateTime }}</el-tag>
                            </div>
                        </template>
                        <el-descriptions :column="3" border>
                            <el-descriptions-item 
                                v-for="(value, key) in currentData" 
                                :key="key" 
                                :label="key">
                                {{ value }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </el-card>
                    <el-empty v-else description="Select a device to view data" />
                </el-main>
            </el-container>
        </el-container>
    `,
    
    data() {
        return {
            devices: [],
            selectedDevice: null,
            currentData: {},
            lastUpdateTime: '-'
        }
    },

    created() {
        this.$socket.on('deviceList', this.handleDeviceList);
        this.$socket.on('deviceOnline', this.handleDeviceOnline);
        this.$socket.on('deviceOffline', this.handleDeviceOffline);
        this.$socket.on('secondData', this.handleSecondData);
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
                this.currentData = {};
            }
        },

        handleDeviceClick(row) {
            if (this.selectedDevice) {
                this.$socket.emit('unsubscribeDevice', this.selectedDevice);
            }
            this.selectedDevice = row.sn;
            this.$socket.emit('subscribeDevice', row.sn);
        },

        handleSecondData({ sn, data, timestamp }) {
            if (sn === this.selectedDevice) {
                this.currentData = data;
                this.lastUpdateTime = new Date(timestamp).toLocaleTimeString();
            }
        }
    }
};
