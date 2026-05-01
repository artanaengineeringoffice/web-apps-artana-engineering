<template>
  <v-container>
    <!--HEADER-->
    <v-row>
      <v-col cols="12">
        <v-card class="pa-4 d-flex justify-space-between align-center" color="deep-purple" elevation="10" rounded="xl">
          <div class="d-flex">
            <v-avatar size="60" class="pa-1">
              <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover rounded="xl" />
              <v-icon v-else icon="mdi-account-circle" size="60" color="deep-purple-lighten-3" />
            </v-avatar>
            <div class="ml-4">
              <p>{{ greeting }},</p>
              <p class="text-h5 text-capitalize font-weight-bold">{{ profile?.full_name || "Karyawan" }}</p>
            </div>
          </div>
          <v-btn icon="mdi-logout" size="small" variant="tonal" />
          <v-btn icon="mdi-sync" size="small" :loading="syncing" @click="refreshAll" variant="tonal" />
        </v-card>
      </v-col>
      <v-col>
        <v-card class="pa-4 d-flex justify-space-between align-center" elevation="10" rounded="xl">
          <div class="d-flex">
            <v-icon class="my-auto" start icon="mdi-calendar-blank" size="small" />
            <p>{{ todayLabel }},</p>
            <p>{{ todayDate }}</p>
          </div>
          <p class="text-h5">{{ liveClock }}</p>
        </v-card>
      </v-col>
    </v-row>

    <!--STATUS HARI INI-->
    <v-row>
      <v-col>
        <v-card class="pa-4" elevation="10" rounded="xl">
          <div  @click="show = !show" class="d-flex justify-space-between">
            <div class="d-flex">
              <v-icon start class="my-auto" :icon="show ? 'mdi-chevron-up' : 'mdi-chevron-down'"/>
              <p class="my-auto">Status Hari Ini</p>
            </div>
            <v-chip color="orange" variant="flat" class="text-white" :text="statusChip.text" /> 
          </div>  

          <v-expand-transition>
            <div v-show="show">
              <v-divider class="mt-4" />              

              <v-card-text class="text-center">
                <v-row no-gutters>
                  <v-col cols="6" class="d-flex align-center">
                    <p class="text-left">Rekaman kehadiran Anda untuk {{ todayLabel }}</p>
                  </v-col>
                  <v-col cols="6" class="d-flex justify-end">
                    <v-progress-circular :model-value="attendanceProgress" :size="100" :width="10"
                      :color="attendanceToday?.checkout_time ? 'success' : attendanceToday?.checkin_time ? 'primary' : 'grey-lighten-1'" rounded>
                      <span class="text-h6 font-weight-bold">{{ attendanceProgress }}%</span>
                    </v-progress-circular>
                  </v-col>
                </v-row>

                <v-divider class="my-4" />

                <div class="d-flex flex-column">
                  <div class="d-flex justify-space-between">
                    <div class="d-flex">
                      <v-icon start icon="mdi-login" :color="attendanceToday?.checkin_time ? 'success' : 'grey'" />
                      <div class="text-start">
                        <p>Check-in</p>
                        <p class="text-caption text-medium-emphasis">{{ attendanceToday?.checkin_time ? "Tercatat" : "Belum check-in" }}</p>
                      </div>
                    </div>
                    <span class="font-weight-bold">{{ attendanceToday?.checkin_time || "—" }}</span>
                  </div>
                  
                  <v-divider class="my-4" />

                  <div class="d-flex justify-space-between">
                    <div class="d-flex">
                      <v-icon start icon="mdi-logout" :color="attendanceToday?.checkout_time ? 'primary' : 'grey'" />
                      <div class="text-start">
                        <p>Check-out</p>
                        <p class="text-caption text-medium-emphasis">{{ attendanceToday?.checkout_time ? "Tercatat" : "Belum check-out" }}</p>
                      </div>
                    </div>
                    <span class="font-weight-bold">{{ attendanceToday?.checkout_time || "—" }}</span>
                  </div>
                </div>
              </v-card-text>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>


  <v-app class="app-bg">
    <v-main>
      <v-container fluid class="pa-0">
        <v-container class="py-8 px-4 px-md-8 px-lg-12" style="max-width: 1300px; position: relative; z-index: 1;">
          <!-- STATUS & AKSI -->
          <v-row class="mt-6">

            <!-- Kartu Aksi Cepat (DITAMBAH FITUR LOKASI) -->
            <v-col cols="12" md="5" lg="4">
              <v-card class="glass-card rounded-xl pa-5 pa-sm-6 h-100 d-flex flex-column" elevation="8">
                <h2 class="text-h5 font-weight-bold d-flex align-center mb-3">
                  <v-icon icon="mdi-flash" color="amber" class="mr-2" />
                  Aksi Cepat
                </h2>
                <p class="text-body-2 text-medium-emphasis mb-4">Tombol otomatis aktif berdasarkan status Anda.</p>

                <!-- STATUS LOKASI (baru) -->
                <v-alert v-if="locationError" type="error" variant="tonal" density="compact" class="mb-3">
                  {{ locationError }}
                </v-alert>
                <v-chip v-else-if="locationLoading" variant="light" color="info" class="mb-3">
                  <v-icon start icon="mdi-map-marker-radius" /> Mengambil lokasi...
                </v-chip>
                <v-chip v-else-if="isWithinRadius === true" variant="flat" color="success" class="mb-3">
                  <v-icon start icon="mdi-check-decagram" /> Dalam Radius Kantor
                </v-chip>
                <v-chip v-else-if="isWithinRadius === false" variant="flat" color="error" class="mb-3">
                  <v-icon start icon="mdi-close-circle" /> Luar Radius Kantor
                </v-chip>
                <v-chip v-else variant="tonal" color="grey" class="mb-3">
                  <v-icon start icon="mdi-map-marker-question" /> Lokasi belum diperiksa
                </v-chip>

                <div class="d-flex flex-column ga-3 mt-auto">
                  <v-btn
                    size="x-large" block rounded="lg" color="success" variant="flat"
                    :loading="actionLoading" :disabled="!canCheckin || !isWithinRadius || locationLoading"
                    @click="doCheckin" class="action-btn" elevation="4"
                  >
                    <v-icon start icon="mdi-login-variant" size="28" /> Check-in
                  </v-btn>
                  <v-btn
                    size="x-large" block rounded="lg" color="primary" variant="flat"
                    :loading="actionLoading" :disabled="!canCheckout || !isWithinRadius || locationLoading"
                    @click="doCheckout" class="action-btn" elevation="4"
                  >
                    <v-icon start icon="mdi-logout-variant" size="28" /> Check-out
                  </v-btn>
                  <!-- Tombol periksa lokasi manual -->
                  <v-btn
                    size="large" block rounded="lg" variant="text" color="info"
                    :loading="locationLoading" @click="checkLocationManual"
                  >
                    <v-icon start icon="mdi-crosshairs-gps" /> Periksa Lokasi Saya
                  </v-btn>
                </div>

                <v-divider class="my-4" />
                <div class="d-flex align-start ga-2 text-caption text-medium-emphasis">
                  <v-icon icon="mdi-information-outline" size="16" color="grey-darken-1" />
                  <span>Absensi hanya bisa dilakukan dalam radius {{ RADIUS_METERS }} meter dari kantor.</span>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- RINGKASAN MINGGU INI (tidak berubah) -->
          <v-row class="mt-6">
            <v-col cols="12">
              <v-card class="glass-card rounded-xl pa-5 pa-sm-6" elevation="8">
                <!-- ... konten mingguan sama persis ... -->
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
                  <h2 class="text-h5 font-weight-bold d-flex align-center">
                    <v-icon icon="mdi-chart-bar" color="primary" class="mr-2" /> Minggu Ini
                  </h2>
                  <v-chip variant="tonal" color="grey-darken-2" size="small" class="font-weight-medium">{{ history.length }} hari tercatat</v-chip>
                </div>
                <p class="text-body-2 text-medium-emphasis mb-4">Status kehadiran 7 hari terakhir (termasuk hari ini).</p>
                <div v-if="!historyLoading && history.length" class="d-flex ga-2 flex-wrap justify-space-between weekly-bar">
                  <div v-for="(day, idx) in weeklyDays" :key="idx" class="weekly-day text-center" :class="{ 'text-primary': day.isToday }">
                    <div class="text-caption font-weight-medium">{{ day.label }}</div>
                    <v-icon :icon="day.icon" :color="day.color" size="24" class="my-1" />
                    <div class="text-caption">{{ day.date }}</div>
                  </div>
                </div>
                <div v-else-if="historyLoading" class="text-center py-4"><v-progress-circular indeterminate size="24" color="primary" /></div>
                <div v-else class="text-center py-4 text-medium-emphasis">Belum ada data minggu ini.</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Prediksi Risiko (sama) -->
          <v-row>
            <v-col>
              <v-card class="glass-card rounded-xl pa-4 mb-4" elevation="6">
                <div class="d-flex align-center justify-space-between">
                  <div><div class="text-subtitle-2 font-weight-medium">Prediksi Besok</div><div class="text-h6 font-weight-bold">Risiko Keterlambatan</div></div>
                  <div class="text-h4 font-weight-bold" :class="'text-' + riskPrediction.color">{{ riskPrediction.score }}%</div>
                </div>
                <v-progress-linear :model-value="riskPrediction.score" :color="riskPrediction.color" height="10" rounded class="mt-3" />
                <div class="d-flex justify-space-between mt-3">
                  <span class="text-caption">Level: <b>{{ riskPrediction.label }}</b></span>
                  <span class="text-caption">{{ riskPrediction.insight }}</span>
                </div>
                <v-alert v-if="riskPrediction.notification" type="warning" variant="tonal" class="mt-3" density="comfortable" border="start">
                  {{ riskPrediction.notification }}
                </v-alert>
              </v-card>
            </v-col>
          </v-row>

          <!-- Riwayat Lengkap (sama) -->
          <v-row class="mt-5">
            <v-col cols="12">
              <v-card class="glass-card rounded-xl pa-5 pa-sm-6" elevation="8">
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
                  <h2 class="text-h5 font-weight-bold d-flex align-center"><v-icon icon="mdi-history" color="primary" class="mr-2" /> Riwayat Absensi</h2>
                  <v-btn variant="text" size="small" color="primary" @click="loadHistory7Days" :loading="historyLoading"><v-icon start icon="mdi-refresh" /> Muat Ulang</v-btn>
                </div>
                <v-divider class="mb-4" />
                <div v-if="historyLoading" class="text-center py-6"><v-progress-circular indeterminate size="32" color="primary" /></div>
                <div v-else-if="!history.length" class="text-center py-6"><v-icon icon="mdi-inbox-outline" size="48" color="grey-lighten-1" class="mb-2" /><p class="text-medium-emphasis">Belum ada riwayat absensi.</p></div>
                <div v-else class="table-responsive">
                  <v-table density="comfortable" class="history-table">
                    <thead><tr><th>Tanggal</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr v-for="row in history" :key="row.id">
                        <td class="font-weight-medium">{{ formatDate(row.checkin_date) }}</td>
                        <td>{{ row.checkin_time || "—" }}</td>
                        <td>{{ row.checkout_time || "—" }}</td>
                        <td><v-chip size="x-small" variant="flat" :color="row.checkout_time ? 'success' : row.checkin_time ? 'primary' : 'grey'" class="text-white font-weight-bold text-uppercase">{{ row.checkout_time ? "Lengkap" : row.checkin_time ? "Check-in" : "Tidak Hadir" }}</v-chip></td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-row v-if="errorMsg" class="mt-4">
            <v-col cols="12">
              <v-alert type="error" variant="tonal" density="compact" rounded="lg" dismissible @click:close="errorMsg = ''">{{ errorMsg }}</v-alert>
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

const show = ref(false)

// === KONFIGURASI LOKASI KANTOR ===
const OFFICE_LAT = -6.589203;   // Ganti dengan latitude kantor anda , , 
const OFFICE_LNG = 107.474524;  // Ganti dengan longitude kantor anda
const RADIUS_METERS = 200;      // radius dalam meter


// Helper: Haversine formula (menghitung jarak dalam meter)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => deg * (Math.PI / 180);
  const R = 6371e3; // meter
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const router = useRouter();

// --- State umum ---
const profile = ref(null);
const loadingProfile = ref(true);
const attendanceToday = ref(null);
const history = ref([]);
const actionLoading = ref(false);
const historyLoading = ref(false);
const syncing = ref(false);
const errorMsg = ref("");
const snackbar = ref({ show: false, text: "" });

// --- State lokasi (baru) ---
const locationLoading = ref(false);
const locationError = ref(null);
const currentLocation = ref(null);
const isWithinRadius = ref(null); // null = belum tahu, true/false

// --- Helper lama ---
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

// --- Computed tanggal & jam (sama) ---
const todayDate = computed(() => new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
const todayLabel = computed(() => new Date().toLocaleDateString("id-ID", { weekday: "long" }));
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
});
const liveClock = ref("—");
let clockTimer = null;
const startClock = () => {
  const tick = () => { liveClock.value = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); };
  tick();
  clockTimer = setInterval(tick, 1000);
};
onBeforeUnmount(() => clearInterval(clockTimer));

// --- Status absensi (sama) ---
const canCheckin = computed(() => !attendanceToday.value);
const canCheckout = computed(() => attendanceToday.value && !attendanceToday.value.checkout_time);
const attendanceProgress = computed(() => {
  if (!attendanceToday.value) return 0;
  return attendanceToday.value.checkout_time ? 100 : 50;
});
const statusChip = computed(() => {
  if (!attendanceToday.value) return { text: "Belum Check-in", color: "warning" };
  if (attendanceToday.value.checkout_time) return { text: "Selesai", color: "success" };
  return { text: "Menunggu Check-out", color: "primary" };
});

// --- Data mingguan (sama) ---
const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const weeklyDays = computed(() => {
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const dayName = daysOfWeek[d.getDay()];
    const isToday = i === 0;
    const found = history.value.find(h => h.checkin_date === iso);
    let icon = "mdi-circle-medium";
    let color = "grey-lighten-1";
    if (found) {
      if (found.checkout_time) { icon = "mdi-check-circle"; color = "success"; }
      else if (found.checkin_time) { icon = "mdi-check-circle-outline"; color = "primary"; }
      else { icon = "mdi-alert-circle-outline"; color = "warning"; }
    }
    result.push({ label: dayName, date: d.getDate(), icon, color, isToday });
  }
  return result;
});

// --- Risk prediction (import dari file terpisah, asumsikan sudah ada) ---
// Ganti dengan implementasi sederhana jika file prediksi belum ada
const useRiskPrediction = (historyRef) => {
  return computed(() => {
    const total = historyRef.value.length;
    const lateCount = historyRef.value.filter(h => h.checkin_time && h.checkin_time > "08:00:00").length;
    const score = total ? Math.round((lateCount / total) * 100) : 0;
    let color = "success", label = "Rendah", insight = "Terus pertahankan", notification = "";
    if (score > 50) { color = "error"; label = "Tinggi"; insight = "Perlu perbaikan"; notification = "⚠️ Risiko telat tinggi besok! Coba persiapkan dari malam."; }
    else if (score > 20) { color = "warning"; label = "Sedang"; insight = "Waspada"; notification = "Sedikit risiko terlambat, pastikan alarm menyala."; }
    return { score, color, label, insight, notification };
  });
};
const riskPrediction = useRiskPrediction(history);

// --- Fungsi lokasi (baru) ---
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung geolocation."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });
};

const checkLocationManual = async () => {
  locationLoading.value = true;
  locationError.value = null;
  try {
    const pos = await getCurrentLocation();
    currentLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const distance = getDistance(OFFICE_LAT, OFFICE_LNG, currentLocation.value.lat, currentLocation.value.lng);
    isWithinRadius.value = distance <= RADIUS_METERS;
    if (!isWithinRadius.value) {
      toast(`Anda berada di luar radius kantor (${Math.round(distance)} meter dari kantor). Absensi tidak dapat dilakukan.`);
    } else {
      toast(`Lokasi valid. Jarak ke kantor: ${Math.round(distance)} meter.`);
    }
  } catch (err) {
    locationError.value = err.message || "Gagal mendapatkan lokasi.";
    isWithinRadius.value = false;
  } finally {
    locationLoading.value = false;
  }
};

// Fungsi yang dipanggil sebelum check-in/out untuk memastikan lokasi
const ensureLocationValid = async () => {
  // Jika belum pernah cek lokasi atau status masih null, cek manual
  if (isWithinRadius.value === null || currentLocation.value === null) {
    await checkLocationManual();
  }
  if (!isWithinRadius.value) {
    throw new Error(`Anda berada di luar radius kantor (${RADIUS_METERS} meter). Absensi tidak diizinkan.`);
  }
  return true;
};

// --- Data dari Supabase (fungsi loadProfile, loadTodayAttendance, loadHistory7Days, refreshAll sama seperti kode awal) ---
const loadProfile = async () => {
  loadingProfile.value = true;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    loadingProfile.value = false;
    router.replace("/login");    
    return;
  }
  const { data, error } = await supabase.from("profiles").select("id, full_name, email, role, avatar_url").eq("id", userData.user.id).single();
  if (error) errorMsg.value = error.message;
  profile.value = data;
  loadingProfile.value = false;
};

const loadTodayAttendance = async () => {
  if (!profile.value?.id) return;
  const today = todayISO();
  const { data, error } = await supabase.from("attendance").select("id, user_id, checkin_date, checkin_time, checkout_time").eq("user_id", profile.value.id).eq("checkin_date", today).maybeSingle();
  if (error) errorMsg.value = error.message;
  attendanceToday.value = data || null;
};

const loadHistory7Days = async () => {
  if (!profile.value?.id) return;
  historyLoading.value = true;
  const { data, error } = await supabase.from("attendance").select("id, checkin_date, checkin_time, checkout_time").eq("user_id", profile.value.id).order("checkin_date", { ascending: false }).limit(7);
  historyLoading.value = false;
  if (error) errorMsg.value = error.message;
  history.value = data || [];
};

const refreshAll = async () => {
  syncing.value = true;
  await loadProfile();
  await loadTodayAttendance();
  await loadHistory7Days();
  // Jangan otomatis cek lokasi, biar user klik tombol "Periksa Lokasi" atau action
  syncing.value = false;
  toast("Data diperbarui.");
};

// --- Aksi absensi dengan pengecekan lokasi ---
const doCheckin = async () => {
  actionLoading.value = true;
  try {
    await ensureLocationValid(); // <- cek lokasi dulu
    await loadTodayAttendance();
    if (attendanceToday.value) {
      toast("Anda sudah check-in.");
      return;
    }
    const { error } = await supabase.from("attendance").insert([
      { user_id: profile.value.id, checkin_date: todayISO(), checkin_time: nowTime(), checkout_time: null }
    ]);
    if (error) throw error;
    await refreshAll();
    toast("Check-in berhasil!");
  } catch (err) {
    errorMsg.value = err.message;
    toast(err.message);
  } finally {
    actionLoading.value = false;
  }
};

const doCheckout = async () => {
  actionLoading.value = true;
  try {
    await ensureLocationValid(); // <- cek lokasi dulu
    await loadTodayAttendance();
    if (!attendanceToday.value) {
      toast("Belum check-in.");
      return;
    }
    if (attendanceToday.value.checkout_time) {
      toast("Sudah check-out.");
      return;
    }
    const { error } = await supabase.from("attendance").update({ checkout_time: nowTime() }).eq("id", attendanceToday.value.id);
    if (error) throw error;
    await refreshAll();
    toast("Check-out berhasil!");
  } catch (err) {
    errorMsg.value = err.message;
    toast(err.message);
  } finally {
    actionLoading.value = false;
  }
};

const logout = async () => {
  await supabase.auth.signOut();
  router.replace("/login");
};

const toast = (t) => {
  snackbar.value.text = t;
  snackbar.value.show = true;
};

// --- Inisialisasi ---
onMounted(async () => {
  startClock();
  await refreshAll();
  // Tidak otomatis minta lokasi saat mount, biar user mengklik tombol periksa lokasi
});
</script>

<style scoped>
.banner-card {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border: none;
  color: white;
}
.avatar-glow {
  border: 3px solid rgba(255,255,255,0.6);
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
}
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
.action-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: none;
}
.weekly-bar {
  justify-content: center;
}
.weekly-day {
  flex: 1;
  min-width: 40px;
  max-width: 70px;
}
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.history-table {
  min-width: 500px;
}
@media (max-width: 600px) {
  .banner-card {
    padding: 16px !important;
  }
}
</style>