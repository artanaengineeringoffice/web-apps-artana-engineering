<template>
  <v-bottom-navigation elevation="0" style="border-top: 1px solid #E5E7EB;"
    v-model="value"
    color="primary"
    grow
  >
    <v-btn to="/karyawan">
      <v-icon>mdi-account-clock-outline</v-icon>
      Dashboard
    </v-btn>

    <v-btn to="/karyawan/historyabsen">
      <v-icon>mdi-clipboard-text-clock-outline</v-icon>
      history
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
  import { ref } from 'vue'

  const value = ref(1)
</script>