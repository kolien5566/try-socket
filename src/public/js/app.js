import { createApp } from 'vue'
import App from './components/App.js'
import { socket } from './utils/socket.js'

const app = createApp(App)
app.config.globalProperties.$socket = socket
app.mount('#app')
