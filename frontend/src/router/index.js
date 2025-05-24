import { createRouter, createWebHistory } from "vue-router";
import InfoStudents from "../views/InfoStudents.vue";
import TheAuth from "../views/TheAuth.vue";
import { useStore } from "../store/index";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/auth",
            name: "auth",
            component: TheAuth,
        },
        {
            path: "/",
            name: "login",
            component: () => import("../views/TheLogin.vue"),
        },
        {
            path: "/main",
            name: "main",
            component: () => import("../views/TheMain.vue"),
        },
        {
            path: "/info",
            name: "InfoStudents",
            component: InfoStudents,
        }
    ],
});

let past_user = null;

router.beforeEach((to, from) => {
    const store = useStore();
    store.getUser();

    if (store.user) {
        past_user = store.user;

        if (!["/auth"].includes(to.path) && !past_user) {
            return "/auth";
        }
        if (from.path == "/" && to.path == "/") {
            return "/auth";
        }
    } else {
        if (
            !["/", "/auth"].includes(to.path) ||
            (from.name == undefined && from.path == "/" && to.path == "/")
        ) {
            return "/auth";
        }
    }
});

export default router;
