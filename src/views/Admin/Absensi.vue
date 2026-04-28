<template>
  <v-container class="py-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-4 mb-5">
      <div>
        <div class="text-h5 font-weight-bold">Admin Dashboard</div>
        <div class="text-subtitle-2 text-grey">
          Monitoring absensi karyawan (Check-in / Check-out)
        </div>
      </div>

      <v-btn color="red" variant="flat" rounded @click="logout">
        Logout
      </v-btn>
    </div>

    <!-- Controls -->
    <v-card class="pa-5 mb-4" rounded="xl" elevation="0" color="grey-lighten-4">
      <v-row class="ga-2" align="center">
        <v-col cols="12" md="3">
          <div class="text-subtitle-2 mb-2">Tanggal</div>
          <v-text-field
            v-model="selectedDate"
            type="date"
            variant="solo"
            density="comfortable"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="5">
          <div class="text-subtitle-2 mb-2">Cari</div>
          <v-text-field
            v-model="search"
            placeholder="Cari nama / email..."
            variant="solo"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-magnify"
          />
        </v-col>

        <v-col cols="12" md="3">
          <div class="text-subtitle-2 mb-2">Filter Status</div>
          <v-select
            v-model="statusFilter"
            :items="statusItems"
            item-title="label"
            item-value="value"
            variant="solo"
            density="comfortable"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="1" class="d-flex justify-end">
          <v-btn
            color="black"
            variant="flat"
            rounded
            :loading="loading"
            @click="loadAttendance"
          >
            Refresh
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Table -->
    <v-card rounded="xl" elevation="0" color="grey-lighten-3">
      <v-card-title class="font-weight-bold d-flex align-center justify-space-between">
        <div>Absensi: {{ selectedDate }}</div>

        <v-chip variant="flat" color="black" size="small">
          Total: {{ filteredRows.length }}
        </v-chip>
      </v-card-title>

      <v-card-text>
        <div v-if="loading">Loading...</div>

        <div v-else-if="errorMsg" class="text-red">
          {{ errorMsg }}
        </div>

        <div v-else>
          <v-table>
            <thead>
              <tr>
                <th style="width: 320px">Karyawan</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in filteredRows" :key="row.id">
                <td>
                  <div class="d-flex align-center ga-3">
                    <v-avatar size="42" color="grey-darken-2">
                      <v-img
                        v-if="row.profiles?.avatar_url"
                        :src="row.profiles.avatar_url"
                        cover
                      />
                      <v-icon v-else icon="mdi-account" color="white" />
                    </v-avatar>

                    <div>
                      <div class="font-weight-bold">
                        {{ row.profiles?.full_name || "-" }}
                      </div>
                      <div class="text-caption text-grey">
                        {{ row.profiles?.email || "-" }}
                      </div>
                    </div>
                  </div>
                </td>

                <td>
                  <v-chip size="small" variant="tonal" color="green">
                    {{ row.checkin_time || "-" }}
                  </v-chip>
                </td>

                <td>
                  <v-chip
                    size="small"
                    variant="tonal"
                    :color="row.checkout_time ? 'blue' : 'grey'"
                  >
                    {{ row.checkout_time || "-" }}
                  </v-chip>
                </td>

                <td>
                  <v-chip
                    size="small"
                    variant="flat"
                    :color="row.checkout_time ? 'green' : 'orange'"
                  >
                    {{ row.checkout_time ? "Selesai" : "Belum Checkout" }}
                  </v-chip>
                </td>
              </tr>

              <tr v-if="filteredRows.length === 0">
                <td colspan="4" class="text-center py-8 text-grey">
                  Tidak ada data absensi pada tanggal ini.
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabase";

const router = useRouter();

const loading = ref(false);
const errorMsg = ref("");
const attendanceList = ref([]);

const selectedDate = ref(new Date().toISOString().slice(0, 10));
const search = ref("");

const statusItems = [
  { label: "Semua", value: "all" },
  { label: "Belum Checkout", value: "open" },
  { label: "Selesai", value: "done" },
];

const statusFilter = ref("all");

const checkAdmin = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    router.replace("/login");
    return;
  }

  const { data: me, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userData.user.id)
    .single();

  if (error || !me) {
    router.replace("/login");
    return;
  }

  if (me.role !== "admin") {
    router.replace("/karyawan");
    return;
  }
};

const loadAttendance = async () => {
  loading.value = true;
  errorMsg.value = "";

  const { data, error } = await supabase
    .from("attendance")
    .select(
      `
      id,
      user_id,
      checkin_date,
      checkin_time,
      checkout_time,
      profiles (
        full_name,
        email,
        role,
        avatar_url
      )
    `
    )
    .eq("checkin_date", selectedDate.value)
    .order("checkin_time", { ascending: true });

  if (error) {
    errorMsg.value = error.message;
    attendanceList.value = [];
  } else {
    attendanceList.value = data || [];
  }

  loading.value = false;
};

const filteredRows = computed(() => {
  let rows = [...attendanceList.value];

  // filter status
  if (statusFilter.value === "open") {
    rows = rows.filter((r) => !r.checkout_time);
  }
  if (statusFilter.value === "done") {
    rows = rows.filter((r) => !!r.checkout_time);
  }

  // search
  const q = search.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) => {
      const name = (r.profiles?.full_name || "").toLowerCase();
      const email = (r.profiles?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }

  return rows;
});

const logout = async () => {
  await supabase.auth.signOut();
  router.replace("/login");
};

watch(selectedDate, async () => {
  await loadAttendance();
});

onMounted(async () => {
  await checkAdmin();
  await loadAttendance();
});
</script>
