<template>
  <v-app-bar density="compact" flat style="border-bottom: 1px solid #E5E7EB;">
    <v-app-bar-title class="text-center">
      <p class="text-h6">Riwayat Absensi</p>
    </v-app-bar-title>
  </v-app-bar>

  <!-- LOADING CARD -->
   <v-container v-if="loadingCard" class="fill-height">
    <v-row>
      <v-col>
        <LoadingCard      
          title="Loading"
          subtitle="Mohon tunggu sebentar"
        />
      </v-col>
    </v-row>    
   </v-container>  

  <!-- CONTENT -->
  <v-container v-else class="py-4">

    <!-- FILTER -->
    <v-sheet color="blue-darken-3" elevation="5" class="pa-4 rounded-xl mb-4">

      <p class="text-body-2 mb-4 opacity-50">
        Filter Tanggal
      </p>

      <v-row>

        <!-- START DATE -->
        <v-col cols="12" md="4">
          <v-menu
            v-model="menuStart"
            :close-on-content-click="false"
          >
            <template #activator="{ props }">
              <v-text-field
                density="compact"
                v-bind="props"
                :model-value="formattedStartDate"
                label="Dari Tgl"
                prepend-inner-icon="mdi-calendar-month"
                readonly
                rounded="xl"
                variant="solo"
                flat
                hide-details
                bg-color="blue-lighten-4"
                class="modern-date-field"
              />
            </template>

            <v-date-picker
              v-model="startDate"
              @update:model-value="menuStart = false"
              rounded="xl"
            />
          </v-menu>
        </v-col>

        <!-- END DATE -->
        <v-col cols="12" md="4">
          <v-menu
            v-model="menuEnd"
            :close-on-content-click="false"
          >
            <template #activator="{ props }">
              <v-text-field
                density="compact"
                v-bind="props"
                :model-value="formattedEndDate"
                label="Sampai Tgl"
                prepend-inner-icon="mdi-calendar-month"
                readonly
                rounded="xl"
                variant="solo"
                flat
                hide-details
                bg-color="blue-lighten-4"
                class="modern-date-field"
              />
            </template>

            <v-date-picker
              v-model="endDate"
              @update:model-value="menuEnd = false"
              rounded="xl"
            />
          </v-menu>
        </v-col>

        <!-- ACTION -->
        <v-col cols="12" md="4" class="d-flex align-center ga-2">

          <v-btn
            color="yellow"
            rounded="xl"
            @click="applyFilter"
          >
            Filter
          </v-btn>

          <v-btn
            variant="text"
            @click="resetFilter"
          >
            Reset
          </v-btn>

          <v-spacer />

          <v-btn
            variant="tonal"
            color="white"
            prepend-icon="mdi-microsoft-excel"
            rounded="xl"
            @click="exportExcel"
          >
            Export
          </v-btn>

        </v-col>

      </v-row>
    </v-sheet>

    <!-- TABLE -->
    <v-sheet id="cardBoard" class="rounded-xl pa-3">

      <v-row class="mb-2">

        <v-col cols="12" md="6">
          <v-text-field
            v-model="search"
            rounded="pill"
            variant="solo-filled"
            flat
            density="compact"
            prepend-inner-icon="mdi-magnify"
            label="Cari tanggal..."
            hide-details
          />
        </v-col>

      </v-row>

      <div class="table-wrapper">

        <v-data-table
          :items="filteredHistory"
          class="custom-table"
        >

          <template #headers>
            <tr>
              <th>Tanggal</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
            </tr>
          </template>

          <template #item="{ item }">
            <tr>
              <td>{{ formatDate(item.checkin_date) }}</td>
              <td>{{ item.checkin_time || "-" }}</td>
              <td>{{ item.checkout_time || "-" }}</td>

              <td>
                <v-chip
                  size="small"
                  class="text-white"
                  :color="
                    item.checkout_time
                      ? 'success'
                      : item.checkin_time
                      ? 'primary'
                      : 'grey'
                  "
                >
                  {{
                    item.checkout_time
                      ? "Lengkap"
                      : item.checkin_time
                      ? "Check-in"
                      : "Tidak Hadir"
                  }}
                </v-chip>
              </td>

            </tr>
          </template>

        </v-data-table>

      </div>

    </v-sheet>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import * as XLSX from "xlsx";

import { useAuth } from "@/lib/useAuth";
import { useAttendance } from "@/lib/useAttendance";
import { formatDate } from "@/lib/useUtils";

import LoadingCard from "@/components/LoadingCard.vue";

const loadingCard = ref(true);

const { profile, loadProfile } = useAuth();

const {
  history,
  loadHistory
} = useAttendance(profile);

// menu
const menuStart = ref(false);
const menuEnd = ref(false);

// state
const startDate = ref(null);
const endDate = ref(null);
const search = ref("");

// format tanggal indonesia
const formatIndonesiaDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formattedStartDate = computed(() =>
  formatIndonesiaDate(startDate.value)
);

const formattedEndDate = computed(() =>
  formatIndonesiaDate(endDate.value)
);

// init
onMounted(async () => {
  loadingCard.value = true;

  try {
    await loadProfile();
    await loadHistory();
  } finally {
    loadingCard.value = false;
  }
});

// filter
const applyFilter = async () => {
  loadingCard.value = true;

  try {
    await loadHistory(
      startDate.value,
      endDate.value
    );
  } finally {
    loadingCard.value = false;
  }
};

const resetFilter = async () => {
  startDate.value = null;
  endDate.value = null;

  loadingCard.value = true;

  try {
    await loadHistory();
  } finally {
    loadingCard.value = false;
  }
};

// search
const filteredHistory = computed(() => {
  return history.value.filter((row) =>
    formatDate(row.checkin_date)
      .toLowerCase()
      .includes(search.value.toLowerCase())
  );
});

// export
const exportExcel = () => {
  if (!history.value.length) return;

  const data = history.value.map((row) => ({
    Tanggal: formatDate(row.checkin_date),
    "Check-in": row.checkin_time || "-",
    "Check-out": row.checkout_time || "-",
    Status: row.checkout_time
      ? "Lengkap"
      : row.checkin_time
      ? "Check-in"
      : "Tidak Hadir",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    "Absensi"
  );

  const today = new Date()
    .toISOString()
    .split("T")[0];

  XLSX.writeFile(
    wb,
    `Absensi_${profile.value?.full_name}_${today}.xlsx`
  );
};
</script>

<style scoped>
.table-wrapper :deep(.v-table__wrapper) {
  overflow-x: auto;
}

.custom-table :deep(table) {
  min-width: 800px;
}

.modern-date-field :deep(.v-field) {
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);

  transition: all 0.25s ease;
}

.modern-date-field :deep(.v-field--focused) {
  border-color: #1976d2;

  box-shadow:
    0 0 0 4px rgba(25, 118, 210, 0.12),
    0 6px 18px rgba(25, 118, 210, 0.15);
}

.modern-date-field :deep(.v-field__prepend-inner) {
  color: #1976d2;
  margin-right: 5px;
}
</style>