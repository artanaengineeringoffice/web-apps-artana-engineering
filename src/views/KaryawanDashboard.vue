<template>
  <v-app class="app-bg">
    <v-main>
      <v-container fluid class="pa-0">
        <!-- ===== KONTAINER UTAMA ===== -->
        <v-container class="py-8 px-4 px-md-8 px-lg-12" style="max-width: 1300px; position: relative; z-index: 1;">

          <!-- ========== HEADER BANNER ========== -->
          <v-row>
            <v-col cols="12">
              <v-card
                class="banner-card rounded-xl pa-5 pa-sm-6"
                elevation="6"
              >
                <v-row align="center" no-gutters>
                  <!-- Avatar & sapaan -->
                  <v-col cols="12" sm="8">
                    <div class="d-flex align-center ga-4">
                      <v-avatar size="72" class="avatar-glow">
                        <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />
                        <v-icon v-else icon="mdi-account-circle" size="48" color="white" />
                      </v-avatar>
                      <div>
                        <h1 class="text-h4 text-sm-h3 font-weight-bold text-white mb-1">
                          {{ greeting }}, {{ profile?.full_name || "Karyawan" }}
                        </h1>
                        <p class="text-body-1 text-white opacity-80 mb-0">
                          {{ profile?.email }}
                        </p>
                      </div>
                    </div>
                  </v-col>

                  <!-- Tanggal & jam -->
                  <v-col cols="12" sm="4" class="text-sm-right mt-3 mt-sm-0">
                    <div class="d-flex flex-column align-sm-end">
                      <span class="text-h5 font-weight-bold text-white">{{ todayDate }}</span>
                      <span class="text-h6 text-white opacity-70">{{ liveClock }}</span>
                      <v-chip
                        class="mt-2"
                        variant="text"
                        text-color="primary"
                        size="small"
                        label
                      >
                        <v-icon start icon="mdi-calendar-blank" size="x-small" />
                        {{ todayLabel }}
                      </v-chip>
                    </div>
                    <v-btn @click="logout" size="small" text="logout" />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>

          <!-- ========== BAGIAN UTAMA: STATUS & AKSI ========== -->
          <v-row class="mt-6">
            <!-- Kartu Status Hari Ini (hirarki tinggi) -->
            <v-col cols="12" md="7" lg="8">
              <v-card class="glass-card rounded-xl pa-5 pa-sm-6" elevation="8">
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
                  <div>
                    <h2 class="text-h5 font-weight-bold d-flex align-center">
                      <v-icon icon="mdi-calendar-check" color="primary" class="mr-2" />
                      Status Hari Ini
                    </h2>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Rekaman kehadiran Anda untuk {{ todayLabel }}
                    </p>
                  </div>
                  <v-chip
                    size="default"
                    variant="flat"
                    :color="statusChip.color"
                    class="text-white font-weight-bold text-uppercase px-3"
                  >
                    {{ statusChip.text }}
                  </v-chip>
                </div>

                <!-- Indikator visual progress -->
                <div class="d-flex justify-center my-4">
                  <v-progress-circular
                    :model-value="attendanceProgress"
                    :size="120"
                    :width="10"
                    :color="attendanceToday?.checkout_time ? 'success' : attendanceToday?.checkin_time ? 'primary' : 'grey-lighten-1'"
                    rounded
                  >
                    <span class="text-h6 font-weight-bold">
                      {{ attendanceProgress }}%
                    </span>
                  </v-progress-circular>
                </div>

                <!-- Timeline check-in/out -->
                <v-divider class="mb-4" />
                <div class="d-flex flex-column ga-3">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center ga-3">
                      <v-icon :color="attendanceToday?.checkin_time ? 'success' : 'grey'" icon="mdi-login" />
                      <div>
                        <div class="font-weight-medium">Check-in</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ attendanceToday?.checkin_time ? "Tercatat" : "Belum check-in" }}
                        </div>
                      </div>
                    </div>
                    <span class="font-weight-bold">{{ attendanceToday?.checkin_time || "—" }}</span>
                  </div>
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center ga-3">
                      <v-icon :color="attendanceToday?.checkout_time ? 'primary' : 'grey'" icon="mdi-logout" />
                      <div>
                        <div class="font-weight-medium">Check-out</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ attendanceToday?.checkout_time ? "Tercatat" : "Belum check-out" }}
                        </div>
                      </div>
                    </div>
                    <span class="font-weight-bold">{{ attendanceToday?.checkout_time || "—" }}</span>
                  </div>
                </div>
              </v-card>
            </v-col>

            <!-- Kartu Aksi Cepat (hirarki tinggi) -->
            <v-col cols="12" md="5" lg="4">
              <v-card class="glass-card rounded-xl pa-5 pa-sm-6 h-100 d-flex flex-column" elevation="8">
                <h2 class="text-h5 font-weight-bold d-flex align-center mb-3">
                  <v-icon icon="mdi-flash" color="amber" class="mr-2" />
                  Aksi Cepat
                </h2>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Tombol otomatis aktif berdasarkan status Anda.
                </p>

                <div class="d-flex flex-column ga-3 mt-auto">
                  <v-btn
                    size="x-large"
                    block
                    rounded="lg"
                    color="success"
                    variant="flat"
                    :loading="actionLoading"
                    :disabled="!canCheckin"
                    @click="doCheckin"
                    class="action-btn"
                    elevation="4"
                  >
                    <v-icon start icon="mdi-login-variant" size="28" />
                    Check-in
                  </v-btn>
                  <v-btn
                    size="x-large"
                    block
                    rounded="lg"
                    color="primary"
                    variant="flat"
                    :loading="actionLoading"
                    :disabled="!canCheckout"
                    @click="doCheckout"
                    class="action-btn"
                    elevation="4"
                  >
                    <v-icon start icon="mdi-logout-variant" size="28" />
                    Check-out
                  </v-btn>
                  <v-btn
                    size="large"
                    block
                    rounded="lg"
                    variant="outlined"
                    color="grey-darken-2"
                    :loading="syncing"
                    @click="refreshAll"
                  >
                    <v-icon start icon="mdi-sync" />
                    Perbarui Status
                  </v-btn>
                </div>
                <v-spacer />
                <v-divider class="my-4" />
                <div class="d-flex align-start ga-2 text-caption text-medium-emphasis">
                  <v-icon icon="mdi-information-outline" size="16" color="grey-darken-1" />
                  <span>Gunakan tombol refresh jika tombol tidak otomatis berubah.</span>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- ========== RINGKASAN MINGGU INI (HIRARKI MENENGAH) ========== -->
          <v-row class="mt-6">
            <v-col cols="12">
              <v-card class="glass-card rounded-xl pa-5 pa-sm-6" elevation="8">
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
                  <h2 class="text-h5 font-weight-bold d-flex align-center">
                    <v-icon icon="mdi-chart-bar" color="primary" class="mr-2" />
                    Minggu Ini
                  </h2>
                  <v-chip variant="tonal" color="grey-darken-2" size="small" class="font-weight-medium">
                    {{ history.length }} hari tercatat
                  </v-chip>
                </div>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Status kehadiran 7 hari terakhir (termasuk hari ini).
                </p>

                <!-- Bar indikator mingguan (visual) -->
                <div v-if="!historyLoading && history.length" class="d-flex ga-2 flex-wrap justify-space-between weekly-bar">
                  <div
                    v-for="(day, idx) in weeklyDays"
                    :key="idx"
                    class="weekly-day text-center"
                    :class="{ 'text-primary': day.isToday }"
                  >
                    <div class="text-caption font-weight-medium">{{ day.label }}</div>
                    <v-icon
                      :icon="day.icon"
                      :color="day.color"
                      size="24"
                      class="my-1"
                    />
                    <div class="text-caption">{{ day.date }}</div>
                  </div>
                </div>
                <div v-else-if="historyLoading" class="text-center py-4">
                  <v-progress-circular indeterminate size="24" color="primary" />
                </div>
                <div v-else class="text-center py-4 text-medium-emphasis">
                  Belum ada data minggu ini.
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-card class="glass-card rounded-xl pa-4 mb-4" elevation="6">

                <!-- HEADER -->
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-2 font-weight-medium">
                      Prediksi Besok
                    </div>
                    <div class="text-h6 font-weight-bold">
                      Risiko Keterlambatan
                    </div>
                  </div>

                  <!-- SCORE BESAR -->
                  <div class="text-h4 font-weight-bold" :class="'text-' + riskPrediction.color">
                    {{ riskPrediction.score }}%
                  </div>
                </div>

                <!-- PROGRESS BAR -->
                <v-progress-linear
                  :model-value="riskPrediction.score"
                  :color="riskPrediction.color"
                  height="10"
                  rounded
                  class="mt-3"
                />

                <!-- LABEL + INSIGHT -->
                <div class="d-flex justify-space-between mt-3">
                  <span class="text-caption">
                    Level: <b>{{ riskPrediction.label }}</b>
                  </span>
                  <span class="text-caption">
                    {{ riskPrediction.insight }}
                  </span>
                </div>

                <!-- 🎯 NOTIFIKASI (BIKIN MENONJOL) -->
                <v-alert
                  v-if="riskPrediction.notification"
                  type="warning"
                  variant="tonal"
                  class="mt-3"
                  density="comfortable"
                  border="start"
                >
                  {{ riskPrediction.notification }}
                </v-alert>

              </v-card>
            </v-col>
          </v-row>

          <!-- ========== RIWAYAT LENGKAP (HIRARKI RENDAH) ========== -->
          <v-row class="mt-5">
            <v-col cols="12">
              <v-card class="glass-card rounded-xl pa-5 pa-sm-6" elevation="8">
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
                  <h2 class="text-h5 font-weight-bold d-flex align-center">
                    <v-icon icon="mdi-history" color="primary" class="mr-2" />
                    Riwayat Absensi
                  </h2>
                  <v-btn
                    variant="text"
                    size="small"
                    color="primary"
                    @click="loadHistory7Days"
                    :loading="historyLoading"
                  >
                    <v-icon start icon="mdi-refresh" />
                    Muat Ulang
                  </v-btn>
                </div>
                <v-divider class="mb-4" />

                <!-- Tabel responsif -->
                <div v-if="historyLoading" class="text-center py-6">
                  <v-progress-circular indeterminate size="32" color="primary" />
                </div>
                <div v-else-if="!history.length" class="text-center py-6">
                  <v-icon icon="mdi-inbox-outline" size="48" color="grey-lighten-1" class="mb-2" />
                  <p class="text-medium-emphasis">Belum ada riwayat absensi.</p>
                </div>
                <div v-else class="table-responsive">
                  <v-table density="comfortable" class="history-table">
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
              </v-card>
            </v-col>
          </v-row>

          <!-- ========== NOTIFIKASI ERROR ========== -->
          <v-row v-if="errorMsg" class="mt-4">
            <v-col cols="12">
              <v-alert type="error" variant="tonal" density="compact" rounded="lg" dismissible @click:close="errorMsg = ''">
                {{ errorMsg }}
              </v-alert>
            </v-col>
          </v-row>

        </v-container>
      </v-container>
    </v-main>

    <v-snackbar v-model="snackbar.show" :timeout="2500" location="top right" color="surface-variant" variant="flat">
      <span class="text-body-2">{{ snackbar.text }}</span>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { useRiskPrediction } from "../lib/prediksi";

const router = useRouter();

// --- State ---
const profile = ref(null);
const loadingProfile = ref(true);
const attendanceToday = ref(null);
const history = ref([]);
const { riskPrediction } = useRiskPrediction(history);
const actionLoading = ref(false);
const historyLoading = ref(false);
const syncing = ref(false);
const errorMsg = ref("");
const snackbar = ref({ show: false, text: "" });

// --- Helper ---
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
};

// --- Computed: waktu & tanggal ---
const todayDate = computed(() => {
  const d = new Date();
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});
const todayLabel = computed(() => {
  const d = new Date();
  return d.toLocaleDateString("id-ID", { weekday: "long" });
});
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
});

// Jam real-time
const liveClock = ref("—");
let clockTimer = null;
const startClock = () => {
  const tick = () => {
    const d = new Date();
    liveClock.value = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  tick();
  clockTimer = setInterval(tick, 1000);
};
onBeforeUnmount(() => clearInterval(clockTimer));

// --- Status absensi ---
const canCheckin = computed(() => !attendanceToday.value);
const canCheckout = computed(() => attendanceToday.value && !attendanceToday.value.checkout_time);
const attendanceProgress = computed(() => {
  if (!attendanceToday.value) return 0;
  if (attendanceToday.value.checkout_time) return 100;
  return 50;
});
const statusChip = computed(() => {
  if (!attendanceToday.value) return { text: "Belum Check-in", color: "warning" };
  if (attendanceToday.value.checkout_time) return { text: "Selesai", color: "success" };
  return { text: "Menunggu Check-out", color: "primary" };
});

// --- Data mingguan untuk indikator ---
const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const weeklyDays = computed(() => {
  const today = new Date();
  const result = [];
  // 7 hari mundur dari hari ini
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const dayName = daysOfWeek[d.getDay()];
    const isToday = i === 0;
    // Cari di history
    const found = history.value.find(h => h.checkin_date === iso);
    let icon = "mdi-circle-medium";
    let color = "grey-lighten-1";
    if (found) {
      if (found.checkout_time) {
        icon = "mdi-check-circle";
        color = "success";
      } else if (found.checkin_time) {
        icon = "mdi-check-circle-outline";
        color = "primary";
      } else {
        icon = "mdi-alert-circle-outline";
        color = "warning";
      }
    }
    result.push({
      label: dayName,
      date: d.getDate(),
      icon,
      color,
      isToday,
    });
  }
  return result;
});

// --- Toast ---
const toast = (t) => {
  snackbar.value.text = t;
  snackbar.value.show = true;
};

// --- Load data ---
const loadProfile = async () => {
  loadingProfile.value = true;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    loadingProfile.value = false;
    router.replace("/login");
    return;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", userData.user.id)
    .single();
  if (error) errorMsg.value = error.message;
  profile.value = data;
  loadingProfile.value = false;
};

const loadTodayAttendance = async () => {
  if (!profile.value?.id) return;
  const today = todayISO();
  const { data, error } = await supabase
    .from("attendance")
    .select("id, user_id, checkin_date, checkin_time, checkout_time")
    .eq("user_id", profile.value.id)
    .eq("checkin_date", today)
    .maybeSingle();
  if (error) errorMsg.value = error.message;
  attendanceToday.value = data || null;
};

const loadHistory7Days = async () => {
  if (!profile.value?.id) return;
  historyLoading.value = true;
  const { data, error } = await supabase
    .from("attendance")
    .select("id, checkin_date, checkin_time, checkout_time")
    .eq("user_id", profile.value.id)
    .order("checkin_date", { ascending: false })
    .limit(7);
  historyLoading.value = false;
  if (error) errorMsg.value = error.message;
  history.value = data || [];
};

const refreshAll = async () => {
  syncing.value = true;
  await loadProfile();
  await loadTodayAttendance();
  await loadHistory7Days();
  syncing.value = false;
  toast("Data diperbarui.");
};

// --- Aksi absen ---
const doCheckin = async () => {
  actionLoading.value = true;
  await loadTodayAttendance();
  if (attendanceToday.value) {
    toast("Anda sudah check-in.");
    actionLoading.value = false;
    return;
  }
  const { error } = await supabase.from("attendance").insert([
    { user_id: profile.value.id, checkin_date: todayISO(), checkin_time: nowTime(), checkout_time: null }
  ]);
  if (error) {
    errorMsg.value = error.message;
  } else {
    await refreshAll();
    toast("Check-in berhasil!");
  }
  actionLoading.value = false;
};

const doCheckout = async () => {
  actionLoading.value = true;
  await loadTodayAttendance();
  if (!attendanceToday.value) {
    toast("Belum check-in.");
    actionLoading.value = false;
    return;
  }
  if (attendanceToday.value.checkout_time) {
    toast("Sudah check-out.");
    actionLoading.value = false;
    return;
  }
  const { error } = await supabase
    .from("attendance")
    .update({ checkout_time: nowTime() })
    .eq("id", attendanceToday.value.id);
  if (error) {
    errorMsg.value = error.message;
  } else {
    await refreshAll();
    toast("Check-out berhasil!");
  }
  actionLoading.value = false;
};

const logout = async () => {
  await supabase.auth.signOut();
  router.replace("/login");
};

// --- Init ---
onMounted(async () => {
  startClock();
  await refreshAll();
});
</script>

<style scoped>
/* Background global */
.app-bg {
  background: linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%);
  min-height: 100vh;
}

/* Banner header */
.banner-card {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border: none;
  color: white;
}

.avatar-glow {
  border: 3px solid rgba(255,255,255,0.6);
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
}

/* Kartu glassmorphism */
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}
.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.12);
}

/* Tombol aksi */
.action-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: none;
}

/* Indikator mingguan */
.weekly-bar {
  justify-content: center;
}
.weekly-day {
  flex: 1;
  min-width: 40px;
  max-width: 70px;
}

/* Tabel responsif */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.history-table {
  min-width: 500px;
}

/* Padding tambahan untuk mobile */
@media (max-width: 600px) {
  .banner-card {
    padding: 16px !important;
  }
}
</style>