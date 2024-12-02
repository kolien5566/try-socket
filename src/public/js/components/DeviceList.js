export const DeviceList = {

    props: ['devices'],
    
    template: `
        <div class="device-list">
            <el-card class="device-card">
                <template #header>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>设备列表</span>
                        <el-button type="primary" size="small" @click="refreshDevices">
                            刷新
                        </el-button>
                    </div>
                </template>
                <el-table :data="deviceArray">
                    <el-table-column prop="sn" label="设备SN" />
                    <el-table-column prop="status" label="状态">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
                                {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作">
                        <template #default="{ row }">
                            <el-button 
                                type="primary" 
                                size="small" 
                                @click="$emit('select-device', row)"
                            >
                                配置
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>
        </div>
    `,

    computed: {
        deviceArray() {
            return Array.from(this.devices.values())
        }
    },

    methods: {
        refreshDevices() {
            this.$emit('refresh')
        }
    }
}
