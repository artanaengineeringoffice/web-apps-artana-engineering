<template>
  <v-container>
    <div class="text-center">
        <v-progress-circular
            indeterminate
            size="60"
            width="3"
            color="primary"
            class="mb-4"
            />

            <p class="text-h6 font-weight-bold">
            {{ title }}
            </p>

            <p class="text-body-2 text-medium-emphasis">
            {{ subtitle }}
            </p>
    </div>
  </v-container>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "Memuat Data..."
  },

  subtitle: {
    type: String,
    default: "Mohon tunggu sebentar"
  }
});
</script>