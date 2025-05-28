import { createRouter, createWebHistory } from "vue-router";
import InfoStudents from "../views/InfoStudents.vue";
import TheLogin from "../views/auth/login.vue";
import TheRegister from "../views/auth/register.vue";
import { useStore } from "../store/index";
import { useCookie } from "@/composables.js";

const { getCookie, deleteCookie } = useCookie();

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/auth",
      name: "auth-layout",
      children: [
        {
          path: "",
          name: "auth-login",
          component: TheLogin,
        },
        {
          path: "register",
          name: "auth-register",
          meta: { requiresAuthTelegram: true },
          component: TheRegister,
        },
      ],
    },
    {
      path: "/",
      name: "main",
      meta: { requiresAuth: true },
      component: () => import("../views/TheMain.vue"),
    },
    {
      path: "/info",
      meta: { requiresAuth: true },
      name: "InfoStudents",
      component: InfoStudents,
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const token = getCookie("token");
  const store = useStore();

  if (token && !store.user) {
    try {
      await store.getUser();
    } catch (error) {
      console.error("Failed to get user:", error);
      deleteCookie("token");
      return next({ path: "/auth" });
    }
  }

  const user = store.user;
  const isAuthenticated = !!(user && user.isRegistered);

  //  Redirect from /auth to /auth/register if user exists but not registered
  if (to.path === "/auth" && user && !user.isRegistered) {
    return next({ path: "/auth/register" });
  }

  //  Check for requiresAuthTelegram meta
  if (to.meta.requiresAuthTelegram && (!user || user.isRegistered)) {
    return next({ path: "/auth" });
  }

  //  Check for general requiresAuth
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      if (user && !user.isRegistered) {
        return next({ path: "/auth/register" });
      } else {
        return next({ path: "/auth" });
      }
    }
  }

  //  Prevent access to /auth* if already authenticated
  if (isAuthenticated && to.path.startsWith("/auth")) {
    return next({ path: "/" });
  }

  next();
});

export default router;
