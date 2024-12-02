export const DeviceConfig = {
    props: ['device'],
    
    template: `
        <el-card class="config-panel">
            <template #header>
                <div class="card-header">
                    <span>设备配置 - {{ device.sn }}</span>
                </div>
            </template>
            <el-form :model="configForm" label-width="120px">
                <el-form-item label="邮政编码">
                    <el-input v-model="configForm.ZipCode" />
                </el-form-item>
                <el-form-item label="安全类型">
                    <el-select v-model="configForm.SafetyType">
                        <el-option label="类型1" value="01" />
                        <el-option label="类型2" value="02" />
                    </el-select>
                </el-form-item>
                <el-form-item label="设置模式">
                    <el-select v-model="configForm.SetMode">
                        <el-option label="模式1" value="01" />
                        <el-option label="模式2" value="02" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="submitConfig">
                        保存配置
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    `,

    data() {
        return {
            configForm: {
                ZipCode: '',
                SafetyType: '',
                SetMode: ''
            }
        }
    },

    watch: {
        device: {
            handler(newDevice) {
                this.configForm = { ...newDevice.config }
            },
            immediate: true
        }
    },

    methods: {
        submitConfig() {
            this.$emit('update-config', this.device.sn, this.configForm)
        }
    }
}
