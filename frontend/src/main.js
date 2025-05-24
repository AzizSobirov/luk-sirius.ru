import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";

import VueMask from "@devindex/vue-mask";
// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,
});

import "vuetify/dist/vuetify.min.css";

import "./assets/app.scss";

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(VueMask);
app.use(vuetify);
app.use(pinia);

app.mount("#app");
