import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "../lib/supabase";

import Login from "../views/Login.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import Absensi from "../views/Admin/Absensi.vue";
import Order from "../views/Admin/Order.vue";

import KaryawanDashboard from "../views/KaryawanDashboard.vue";
import AuthCallback from "../views/AuthCallback.vue";

import HistoryAbsen from "../views/Karyawan/HistoryAbsen.vue"

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/:pathMatch(.*)*", redirect: "/login" },

  { path: "/login", component: Login },
  
  { path: "/auth/callback", name: "auth-callback", component: AuthCallback },

  {
    path: "/admin",
    component: AdminDashboard,
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/absensi",
    component: Absensi,
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/order",
    component: Order,
    meta: { requiresAuth: true, role: "admin" },
  },


  // page karyawan
  {
    path: "/karyawan",
    component: KaryawanDashboard,
    meta: { requiresAuth: true, role: "karyawan" },
  },

  {
    path: "/karyawan/historyabsen",
    component: HistoryAbsen,
    meta: { requiresAuth: true, role: "karyawan" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // ambil session
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  // =========================
  // 1) Kalau belum login
  // =========================
  if (!session) {
    // kalau mau ke route protected → lempar login
    if (to.meta.requiresAuth) return next("/login");

    // kalau mau ke login / callback → boleh
    return next();
  }

  // =========================
  // 2) Kalau sudah login
  // =========================

  // ambil role dari profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = profile?.role || "karyawan";

  // kalau user sudah login tapi buka /login → redirect sesuai role
  if (to.path === "/login") {
    if (role === "admin") return next("/admin");
    return next("/karyawan");
  }

  // kalau user akses /admin tapi bukan admin
  if (to.meta.role === "admin" && role !== "admin") {
    return next("/karyawan");
  }

  // kalau admin akses /karyawan → lempar ke admin
  if (to.meta.role === "karyawan" && role === "admin") {
    return next("/admin");
  }

  next();
});

export default router;
