import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createPersistedState } from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(createPersistedState());

const vuetify = createVuetify({
    components,
    directives,
});

const app = createApp(App);
app.use(pinia);
app.use(vuetify);
app.mount('#app');
