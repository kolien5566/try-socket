import { DeviceList } from './DeviceList.js';
import { DeviceConfig } from './DeviceConfig.js';

export const App = {
    components: {
        DeviceList,
        DeviceConfig
    },
    template: `
        <div class="device-container">
        <div>
            <device-list 
                :devices="devices"
                @select-device="selectDevice"
                @refresh="loadDevices"
            />
        </div>
        <div>
            <device-config
                v-if="selectedDevice"
                :device="selectedDevice"
                @update-config="updateDeviceConfig"
            />
        </div>
        </div>
    `,

    data() {
        return {
            devices: new Map(),
            selectedDevice: null
        }
    },

    mounted() {
        this.loadDevices()
        this.$socket.on('deviceUpdate', this.handleDeviceUpdate)
    },

    methods: {
        async loadDevices() {
            try {
                const response = await fetch('/api/devices')
                const devices = await response.json()
                devices.forEach(device => {
                    this.devices.set(device.sn, device)
                })
            } catch (error) {
                console.error('Failed to load devices:', error)
            }
        },

        handleDeviceUpdate(data) {
            const device = this.devices.get(data.sn) || {}
            this.devices.set(data.sn, { ...device, ...data })
        },

        selectDevice(device) {
            this.selectedDevice = device
        },

        async updateDeviceConfig(sn, config) {
            try {
                await fetch(`/api/devices/${sn}/config`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(config)
                })
                this.$message.success('配置更新成功')
            } catch (error) {
                this.$message.error('配置更新失败')
            }
        }
    }
}
