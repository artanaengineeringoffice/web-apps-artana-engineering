<template>
  <v-app>
    <v-main class="bgApp">
      <router-view />
      <!--Bottom Navigation-->
      <BottomNavigation />
    </v-main>

    
      
  </v-app>
</template>

<script setup>
import BottomNavigation from "./components/BottomNavigation.vue"

</script>