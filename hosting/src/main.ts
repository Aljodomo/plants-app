import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { VCalendar } from 'vuetify/labs/components'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark'
  },
  components: {
    VCalendar
  },
  icons: {
    defaultSet: 'mdi'
  }
})

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.mount('#app')
