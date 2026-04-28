<template>   
    
  <v-navigation-drawer
    v-model="drawer"
    theme="dark"
    :permanent="!mobile"
  >
    <v-list>
      <v-list-item to="/admin" prepend-icon="mdi-view-dashboard" title="Dashboard" />
      <v-list-item to="/absensi" prepend-icon="mdi-book" title="Absensi" />
      <v-list-item prepend-icon="mdi-account-box" title="Account" />
      <v-list-item prepend-icon="mdi-gavel" title="Admin" />
      <v-list-item to="/order" prepend-icon="mdi-receipt-text" title="Order" />
    </v-list>

    <template v-slot:append>
      <div class="pa-2">
        <v-btn block>Logout</v-btn>
      </div>
    </template>
  </v-navigation-drawer>

  
</template>

<script setup>
import { ref, watch } from "vue"
import { useDisplay } from "vuetify"

const drawer = ref(true)

const { mobile } = useDisplay()

// Optional: kalau masuk mode mobile, otomatis tutup drawer
watch(mobile, (val) => {
  if (val) drawer.value = false
  else drawer.value = true
})
</script>
