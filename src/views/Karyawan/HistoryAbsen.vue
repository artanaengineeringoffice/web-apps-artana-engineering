<script setup>
import { ref, onMounted, computed } from "vue";
import * as XLSX from "xlsx";

import { useAuth } from "@/lib/useAuth";
import { useAttendance } from "@/lib/useAttendance";
import { formatDate } from "@/lib/useUtils";

const { profile, loadProfile } = useAuth();
const { history, loading, loadHistory } = useAttendance(profile);

// state
const startDate = ref(null);
const endDate = ref(null);
const search = ref("");
const dense = ref(false);

// init
onMounted(async () => {
  await loadProfile();
  await loadHistory();
});

// filter
const applyFilter = () => loadHistory(startDate.value, endDate.value);
const resetFilter = () => {
  startDate.value = null;
  endDate.value = null;
  loadHistory();
};

// computed filter + search
const filteredHistory = computed(() => {
  return history.value.filter(row =>
    formatDate(row.checkin_date)
      .toLowerCase()
      .includes(search.value.toLowerCase())
  );
});

// summary
const total = computed(() => history.value.length);
const complete = computed(() => history.value.filter(h => h.checkout_time).length);
const progress = computed(() => total.value ? Math.round((complete.value / total.value) * 100) : 0);

// export
const exportExcel = () => {
  if (!history.value.length) return;

  const data = history.value.map(row => ({
    Tanggal: formatDate(row.checkin_date),
    "Check-in": row.checkin_time || "-",
    "Check-out": row.checkout_time || "-",
    Status: row.checkout_time ? "Lengkap" : row.checkin_time ? "Check-in" : "Tidak Hadir"
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Absensi");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `Absensi_${profile.value?.full_name}_${today}.xlsx`);
};
</script>

<template>
    <v-app-bar density="compact" flat style="border-bottom: 1px solid #E5E7EB;">
        <v-app-bar-title class="text-center">
            <p class="text-h6">Riwayat Absensi</p>
        </v-app-bar-title>
    </v-app-bar>

    <div class="table-wrapper">
        <v-table>
            <thead>
            <tr>
                <th>Tanggal</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Lokasi</th>
                <th>Keterangan</th>
            </tr>
            </thead>

            <tbody>
            <tr v-for="row in history" :key="row.id">
                <td>{{ formatDate(row.checkin_date) }}</td>
                <td>{{ row.checkin_time }}</td>
                <td>{{ row.checkout_time }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.location || "-" }}</td>
                <td>{{ row.note || "-" }}</td>
            </tr>
            </tbody>
        </v-table>
        </div>

    <v-container>
        <v-row>
            <v-col>
                <v-sheet id="cardBoard" class="pa-4" rounded="xl">
                    <div>
                        <v-table density="comfortable">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Check-in</th>
                                    <th>Check-out</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in history" :key="row.id">
                                <td class="font-weight-medium">{{ formatDate(row.checkin_date) }}</td>
                                <td>{{ row.checkin_time || "—" }}</td>
                                <td>{{ row.checkout_time || "—" }}</td>
                                <td>
                                    <v-chip
                                    size="x-small"
                                    variant="flat"
                                    :color="row.checkout_time ? 'success' : row.checkin_time ? 'primary' : 'grey'"
                                    class="text-white font-weight-bold text-uppercase"
                                    >
                                    {{ row.checkout_time ? "Lengkap" : row.checkin_time ? "Check-in" : "Tidak Hadir" }}
                                    </v-chip>
                                </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </div>
                </v-sheet>
            </v-col>
        </v-row>
    </v-container>

  <v-container class="py-6">

    <!-- 🔝 TOP BAR -->
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
      <div>
        <h1 class="text-h5 font-weight-bold">Absensi</h1>
        <p class="text-caption text-medium-emphasis">
          Riwayat kehadiran karyawan
        </p>
      </div>

      <div class="d-flex ga-2">
        <v-btn color="primary" variant="tonal" @click="loadHistory" :loading="loading">
          <v-icon start icon="mdi-refresh" />
          Sync
        </v-btn>

        <v-btn color="success" variant="flat" @click="exportExcel">
          <v-icon start icon="mdi-file-excel" />
          Export
        </v-btn>
      </div>
    </div>

    <!-- 📊 STAT CARDS -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl">
          <div class="text-caption">Total Hari</div>
          <div class="text-h5 font-weight-bold">{{ total }}</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl">
          <div class="text-caption">Kehadiran Lengkap</div>
          <div class="text-h5 font-weight-bold text-success">{{ complete }}</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl">
          <div class="text-caption">Progress</div>
          <v-progress-linear :model-value="progress" height="8" rounded />
          <div class="text-caption mt-1">{{ progress }}%</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 🧰 TOOLBAR -->
    <v-card class="pa-4 mb-4 rounded-xl">
      <v-row dense align="center">

        <v-col cols="12" md="3">
          <v-text-field
            v-model="search"
            label="Cari tanggal..."
            density="compact"
            prepend-inner-icon="mdi-magnify"
          />
        </v-col>

        <v-col cols="6" md="2">
          <v-text-field v-model="startDate" type="date" label="Dari" density="compact" />
        </v-col>

        <v-col cols="6" md="2">
          <v-text-field v-model="endDate" type="date" label="Sampai" density="compact" />
        </v-col>

        <v-col cols="12" md="5" class="d-flex ga-2">
          <v-btn color="primary" @click="applyFilter" :loading="loading">
            Filter
          </v-btn>

          <v-btn variant="text" @click="resetFilter">
            Reset
          </v-btn>

          <v-spacer />

          <v-switch
            v-model="dense"
            label="Compact"
            hide-details
            density="compact"
          />
        </v-col>

      </v-row>
    </v-card>

    <!-- 📋 DATA TABLE -->
    <v-card class="rounded-xl">
      <v-data-table
        :items="filteredHistory"
        :loading="loading"
        :density="dense ? 'compact' : 'comfortable'"
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
                :color="
                  item.checkout_time
                    ? 'success'
                    : item.checkin_time
                    ? 'primary'
                    : 'grey'
                "
                class="text-white"
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

        <template #no-data>
          <div class="text-center py-6">
            <v-icon icon="mdi-database-off" size="40" />
            <p>Tidak ada data</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

  </v-container>
</template>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* smooth scroll iOS */
}

.table-wrapper table {
  min-width: 700px; /* paksa table lebih lebar */
}
</style>