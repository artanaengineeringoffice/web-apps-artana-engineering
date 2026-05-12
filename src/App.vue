<template>
  <v-app>
    <v-main class="bgApp">
      <router-view />
      <!--Bottom Navigation-->
      <BottomNavigation v-if="showBottomNav" />
    </v-main>

    
      
  </v-app>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import BottomNavigation from "./components/BottomNavigation.vue"

const route = useRoute();

const hideRoutes = ["/login", "/auth/callback", "/admin", "/karyawan/InfoAdmin", "/chat"];

const showBottomNav = computed(() => {
  return !hideRoutes.includes(route.path);
});
</script>