<template>
  <v-row>
    <v-col cols="12">
      <v-sheet id="cardBoard" class="rounded-xl pa-5 pa-sm-6">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <h2 class="text-h5 font-weight-bold d-flex align-center">
            <v-icon icon="mdi-chart-bar" color="primary" class="mr-2" />
            Minggu Ini
          </h2>

          <v-chip
            variant="tonal"
            color="grey-darken-2"
            size="small"
            class="font-weight-medium"
          >
            {{ history.length }} hari tercatat
          </v-chip>
        </div>

        <!-- Description -->
        <p class="text-body-2 text-medium-emphasis mb-4">
          Status kehadiran 7 hari terakhir (termasuk hari ini).
        </p>

        <!-- Data -->
        <div
          v-if="!historyLoading && history.length"
          class="d-flex ga-2 flex-wrap justify-space-between"
        >
          <div
            v-for="(day, idx) in weeklyDays"
            :key="idx"
            class="weekly-day text-center"
            :class="{ 'text-primary': day.isToday }"
          >
            <div class="text-caption font-weight-medium">
              {{ day.label }}
            </div>

            <v-icon
              :icon="day.icon"
              :color="day.color"
              size="24"
              class="my-1"
            />

            <div class="text-caption">
              {{ day.date }}
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-else-if="historyLoading" class="text-center py-4">
          <v-progress-circular
            indeterminate
            size="24"
            color="primary"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-4 text-medium-emphasis">
          Belum ada data minggu ini.
        </div>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  history: {
    type: Array,
    default: () => []
  },
  historyLoading: {
    type: Boolean,
    default: false
  },
  weeklyDays: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
.weekly-day {
  flex: 1;
  min-width: 40px;
  max-width: 70px;
}
</style>