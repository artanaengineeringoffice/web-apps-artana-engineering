<template>   
<!--APPBAR-->
<v-app-bar flat scroll-behavior="hide inverted" style="border-bottom: 1px solid #E5E7EB;">
  <template v-slot:prepend>
    <div class="d-flex ml-2">
      <v-avatar color="grey">
        <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" />
      </v-avatar>
      <div class="ml-3">
        <p class="my-auto font-weight-bold">{{ profile?.full_name || "Karyawan" }}</p>
        <p class="my-auto text-caption">{{ profile?.email || "Email" }}</p>
      </div>
    </div>
  </template>

  <template v-slot:append>
    <v-btn
      @click="handleInfoClick"
      to="/karyawan/InfoAdmin"
      :class="{ 'bell-animation': !bellRead }"
      icon="mdi-bell-ring"
      :color="bellRead ? 'grey' : 'red-accent-4'"
    />
    <v-btn icon="mdi-dots-vertical" />
  </template>
</v-app-bar>

<!--SNACKBAR-->
  <v-snackbar v-model="snackbar.show" timeout="2500" location="top right" color="black" variant="flat">
        <span class="text-body-2">{{ snackbar.text }}</span>
  </v-snackbar> 

  <!-- LOADING -->
  <v-container
    v-if="loadingCard"
    class="fill-height d-flex align-center justify-center"
  >
    <LoadingCard
      title="Loading"
      subtitle="Mohon tunggu sebentar"
    />
  </v-container>
  
  <v-container v-else>
    <!--HEADER-->
    <v-row>
      <v-col cols="12">
        <v-sheet class="pa-4" color="blue-darken-3" elevation="5" rounded="xl">
          <div class="d-flex justify-space-between align-center">
            <div class="d-flex">
              <v-avatar size="50" class="pa-1">
                <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover rounded="xl" />
                <v-icon v-else icon="mdi-account-circle" size="60" color="deep-purple-lighten-3" />
              </v-avatar>
              <div class="ml-4 my-auto">
                <p class="text-body-2">{{ greeting }},</p>
                <p class="text-h6 text-capitalize font-weight-bold">{{ profile?.full_name || "Karyawan" }}</p>
              </div>
            </div>
            <div class="d-flex">
              <!--<v-btn icon="mdi-sync" size="small" :loading="syncing" @click="refreshAll" variant="tonal" />-->
              <v-btn @click="logout" class="ml-4" elevation="10" color="white" icon="mdi-logout" size="small" variant="flat" />            
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="d-flex justify-space-between align-center">
            <div class="d-flex">
              <v-icon class="my-auto" start icon="mdi-calendar-blank" size="x-small" />
              <p class="text-body-2">{{ todayLabel }},</p>
              <p class="text-body-2">{{ todayDate }}</p>
            </div>
            <v-chip size="small" color="orange" variant="flat" class="text-white" :text="statusChip.text" /> 
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- UCAPAN CHECKIN / CHECKOUT -->
    <v-row v-if="motivationCard.show">
      <v-col cols="12">
        <v-card
          class="rounded-xl pa-4 motivation-card"
          :color="motivationCard.color"
          elevation="6"
          variant="flat"
        >
          <div class="d-flex align-center">
            
            <!-- ICON -->
            <v-avatar
              size="52"
              color="white"
              class="motivation-avatar"
            >
              <v-icon
                :icon="motivationCard.icon"
                :color="motivationCard.color"
                size="28"
              />
            </v-avatar>

            <!-- TEXT -->
            <div class="ml-4">
              <div class="text-subtitle-1 font-weight-bold text-white">
                {{
                  motivationCard.type === "checkout"
                    ? "Selamat Istirahat 🌙"
                    : "Selamat Bekerja 🚀"
                }}
              </div>

              <div class="text-body-2 text-white mt-1">
                {{ motivationCard.text }}
              </div>
            </div>

          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- PENGUMUMAN PERUSAHAAN -->
    <v-row v-if="announcements.length > 0">
      <v-col cols="12" v-if="!bellRead">
        <v-card
          to="/karyawan/InfoAdmin"
          class="pa-4 google-glow-btn"
          :color="bellRead ? 'grey' : 'red-accent-4'"
          rounded="xl"
          elevation="6"
          @click="handleInfoClick"
        >
          <div class="d-flex justify-space-between">
            <div class="d-flex align-center">

              <!-- bell -->
              <v-avatar
                size="small"
                :class="{ 'bell-animation': !bellRead }"
              >
                <v-icon :color="bellRead ? 'grey' : 'red-accent-4'">
                  mdi-bell-ring
                </v-icon>
              </v-avatar>

              <p class="my-auto ml-4 font-weight-bold text-white">
                Info Admin
              </p>
            </div>

            <v-chip
              size="x-small"
              color="white"
              variant="flat"
              class="my-auto font-weight-bold"
            >
              {{ announcements.length }}
            </v-chip>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- STATUS & AKSI -->
    <v-row>
      <!-- Kartu Aksi Cepat (DITAMBAH FITUR LOKASI) -->
      <v-col cols="12" md="5" lg="4">
        <v-sheet id="cardBoard" class="rounded-xl pa-5 pa-sm-6 h-100 d-flex flex-column">
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
          <v-chip v-else-if="isWithinRadius === true" variant="tonal" color="success" class="mb-3">
            <v-icon start icon="mdi-check-decagram" /> Dalam Radius Kantor
          </v-chip>
          <v-chip v-else-if="isWithinRadius === false" variant="tonal" color="error" class="mb-3">
            <v-icon start icon="mdi-close-circle" /> Luar Radius Kantor
          </v-chip>
          <v-chip v-else variant="text" color="grey" class="mb-3">
            <v-icon start icon="mdi-map-marker-question" />Lokasi belum diperiksa
          </v-chip>

          <div class="d-flex flex-column ga-3 mt-auto">
            <v-btn class="font-weight-bold"
              size="x-large"
              block
              rounded="xl"
              :color="canCheckin && isWithinRadius && !locationLoading ? 'success' : 'grey'"
              :variant="canCheckin && isWithinRadius && !locationLoading ? 'flat' : 'tonal'"
              :class="[
                'action-btn',
                canCheckin && isWithinRadius && !locationLoading ? 'btn-active' : 'btn-disabled'
              ]"
              :loading="actionLoading"
              :disabled="!canCheckin || !isWithinRadius || locationLoading"
              @click="doCheckin"
            >
              <v-icon start icon="mdi-login-variant" size="28" />
              Check-in
            </v-btn>

            <v-btn class="font-weight-bold"
              size="x-large"
              block
              rounded="xl"
              :color="canCheckout && isWithinRadius && !locationLoading ? 'primary' : 'grey'"
              :variant="canCheckout && isWithinRadius && !locationLoading ? 'flat' : 'tonal'"
              :class="[
                'action-btn',
                canCheckout && isWithinRadius && !locationLoading ? 'btn-active' : 'btn-disabled'
              ]"
              :loading="actionLoading"
              :disabled="!canCheckout || !isWithinRadius || locationLoading"
              @click="doCheckout"
            >
              <v-icon start icon="mdi-logout-variant" size="28" />
              Check-out
            </v-btn>

            <!-- Tombol periksa lokasi manual -->
            <v-btn
              size="large" block rounded="xl" variant="tonal" color="info"
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
        </v-sheet>
      </v-col>
    </v-row>

    <!-- RINGKASAN MINGGU INI (tidak berubah) -->
    <v-row>
      <v-col cols="12">
        <v-sheet id="cardBoard" class="rounded-xl pa-5 pa-sm-6">
          <!-- ... konten mingguan sama persis ... -->
          <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
            <h2 class="text-h5 font-weight-bold d-flex align-center">
              <v-icon icon="mdi-chart-bar" color="primary" class="mr-2" /> Minggu Ini
            </h2>
            <v-chip variant="tonal" color="grey-darken-2" size="small" class="font-weight-medium">
              {{ history.length }} hari tercatat
            </v-chip>
          </div>

          <p class="text-body-2 text-medium-emphasis mb-4">
            Status kehadiran 7 hari terakhir (termasuk hari ini).
          </p>

          <div v-if="!historyLoading && history.length" class="d-flex ga-2 flex-wrap justify-space-between">
            <div
              v-for="(day, idx) in weeklyDays"
              :key="idx"
              class="weekly-day text-center"
              :class="{ 'text-primary': day.isToday }"
            >
              <div class="text-caption font-weight-medium">{{ day.label }}</div>
              <v-icon :icon="day.icon" :color="day.color" size="24" class="my-1" />
              <div class="text-caption">{{ day.date }}</div>
            </div>
          </div>

          <div v-else-if="historyLoading" class="text-center py-4">
            <v-progress-circular indeterminate size="24" color="primary" />
          </div>

          <div v-else class="text-center py-4 text-medium-emphasis">
            Belum ada data minggu ini.
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Prediksi Risiko (sama) -->
    <v-row>
      <v-col>
        <v-sheet id="cardBoard" class="rounded-xl pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-2 font-weight-medium">Prediksi Besok</div>
              <div class="text-h6 font-weight-bold">Risiko Keterlambatan</div>
            </div>
            <div class="text-h4 font-weight-bold" :class="'text-' + riskPrediction.color">
              {{ riskPrediction.score }}%
            </div>
          </div>

          <v-progress-linear
            :model-value="riskPrediction.score"
            :color="riskPrediction.color"
            height="10"
            rounded
            class="mt-3"
          />

          <div class="d-flex justify-space-between mt-3">
            <span class="text-caption">
              Level: <b>{{ riskPrediction.label }}</b>
            </span>
            <span class="text-caption">
              {{ riskPrediction.insight }}
            </span>
          </div>

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
        </v-sheet>
      </v-col>
    </v-row>

    <v-row v-if="errorMsg" class="mt-4">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" density="compact" rounded="lg" dismissible @click:close="errorMsg = ''">{{ errorMsg }}</v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";

import { useAuth } from "@/lib/useAuth";
import { useAttendance } from "@/lib/useAttendance";
import { useLocation } from "@/lib/useLocation";
import { useRiskPrediction } from "@/lib/useRiskPrediction";
import { useAnnouncement } from "@/lib/useAnnouncement";

import LoadingCard from "@/components/LoadingCard.vue";

const loadingCard = ref(true);

const bellRead = ref(false);
const lastAnnouncementCount = ref(0);

const showEmergency = ref(false);

const router = useRouter();

/* =========================================================
   AUTH
========================================================= */
const { profile, loadProfile, logout: authLogout } = useAuth();

/* =========================================================
   ATTENDANCE
========================================================= */
const {
  attendanceToday,
  history,
  loading: historyLoading,
  loadToday,
  loadHistory,
  checkin,
  checkout
} = useAttendance(profile);

const {
  announcements,
  loadAnnouncements
} = useAnnouncement(profile);

const emergencyAnnouncement = computed(() =>
  announcements.value.find(
    item =>
      item.type === "emergency" &&
      item.is_active !== false
  )
);

/* =========================================================
   LOCATION
========================================================= */
const {
  locationLoading,
  locationError,
  currentLocation,
  isWithinRadius,
  checkLocation,
  RADIUS_METERS,
} = useLocation();

/* =========================================================
   RISK PREDICTION
========================================================= */
const riskPrediction = useRiskPrediction(history);

/* =========================================================
   STATE
========================================================= */
const motivationCard = ref({
  show: false,
  text: "",
  type: "checkin",
  color: "success",
  icon: "mdi-briefcase-check",
});

const loadingProfile = ref(true);
const actionLoading = ref(false);
const syncing = ref(false);
const errorMsg = ref("");

const snackbar = ref({
  show: false,
  text: "",
});

const show = ref(false);

/* =========================================================
   HELPERS
========================================================= */
const toast = (text) => {
  snackbar.value.text = text;
  snackbar.value.show = true;
};

const showMotivation = (text, type = "checkin") => {
  motivationCard.value = {
    show: true,
    text,
    type,
    color:
      type === "checkout"
        ? "indigo"
        : type === "morning"
        ? "orange-darken-2"
        : "success",

    icon:
      type === "checkout"
        ? "mdi-weather-night"
        : type === "morning"
        ? "mdi-white-balance-sunny"
        : "mdi-briefcase-check",
  };
};

/* =========================================================
   GREETINGS
========================================================= */
const checkinGreetings = [
  "Check-in berhasil! Semangat bekerja hari ini 💪",
  "Selamat bekerja, semoga harimu produktif 🚀",
  "Absensi masuk berhasil. Jangan lupa sarapan ☕",
  "Semangat menjalani aktivitas hari ini ✨",
  "Selamat datang kembali, semoga pekerjaan lancar 🙌",
  "Hari baru dimulai, semangat kerjanya 🔥",
  "Check-in sukses! Semoga target hari ini tercapai 🎯",
];

const checkoutGreetings = [
  "Check-out berhasil! Selamat beristirahat 🌙",
  "Terima kasih atas kerja keras hari ini 🙏",
  "Jam kerja selesai. Hati-hati di jalan 🚗",
  "Selamat menikmati waktu istirahat 😄",
  "Kerja bagus hari ini! Sampai jumpa besok 👋",
  "Semoga malammu menyenangkan ✨",
  "Waktunya recharge energi untuk besok 🔋",
];

const morningGreetings = [
  "Selamat pagi ☀️ Semangat menjalani aktivitas hari ini!",
  "Hari baru dimulai 🚀 Yuk capai target terbaik hari ini!",
  "Semoga harimu produktif dan menyenangkan ✨",
  "Ayo semangat kerja hari ini 💪",
  "Jangan lupa sarapan dan jaga kesehatan 🍳",
  "Semoga pekerjaan hari ini berjalan lancar 🙌",
  "Waktunya memulai hari dengan energi positif 🔥",
];

const randomMessage = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const checkMorningGreeting = () => {
  const now = new Date();

  const hour = now.getHours();

  const todayKey = now.toISOString().split("T")[0];

  const lastShown = localStorage.getItem("morningGreetingDate");

  // tampil sekali per hari mulai jam 7 pagi
  if (hour >= 7 && lastShown !== todayKey) {

    const msg = randomMessage(morningGreetings);

    showMotivation(msg, "morning");

    localStorage.setItem(
      "morningGreetingDate",
      todayKey
    );
  }
};

/* =========================================================
   DATE & TIME
========================================================= */
const todayDate = computed(() =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
);

const todayLabel = computed(() =>
  new Date().toLocaleDateString("id-ID", {
    weekday: "long",
  })
);

const greeting = computed(() => {
  const hour = new Date().getHours();

  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";

  return "Selamat malam";
});

/* =========================================================
   LIVE CLOCK
========================================================= */
const liveClock = ref("—");

let clockTimer = null;

const startClock = () => {
  const tick = () => {
    liveClock.value = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  tick();

  clockTimer = setInterval(tick, 1000);
};

onBeforeUnmount(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
  }
});

/* =========================================================
   ATTENDANCE STATUS
========================================================= */
const canCheckin = computed(() => !attendanceToday.value);

const canCheckout = computed(
  () =>
    attendanceToday.value &&
    !attendanceToday.value.checkout_time
);

const statusChip = computed(() => {
  if (!attendanceToday.value) {
    return {
      text: "Belum Check-in",
      color: "warning",
    };
  }

  if (attendanceToday.value.checkout_time) {
    return {
      text: "Selesai",
      color: "success",
    };
  }

  return {
    text: "Menunggu Check-out",
    color: "primary",
  };
});

/* =========================================================
   WEEKLY SUMMARY
========================================================= */
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

    const found = history.value.find(
      (item) => item.checkin_date === iso
    );

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

/* =========================================================
   LOAD DATA
========================================================= */
const loadHistory7Days = async () => {

  const today = new Date();

  const start = new Date(today);

  start.setDate(today.getDate() - 6);

  const startDate = start.toISOString().split("T")[0];

  const endDate = today.toISOString().split("T")[0];

  await loadHistory(startDate, endDate);
};

const refreshAll = async () => {

  syncing.value = true;

  errorMsg.value = "";

  try {

    loadingProfile.value = true;

    const userProfile = await loadProfile();

    if (!userProfile) {
      router.replace("/login");
      return;
    }

    await loadToday();

    await loadHistory7Days();

  } catch (err) {

    errorMsg.value =
      err.message || "Terjadi kesalahan.";

  } finally {

    loadingProfile.value = false;

    syncing.value = false;
  }
};

/* =========================================================
   LOCATION
========================================================= */
const checkLocationManual = async () => {

  try {

    const result = await checkLocation();

    if (result.valid) {

      toast(
        `Lokasi valid. Jarak ke kantor: ${Math.round(
          result.distance
        )} meter.`
      );

    } else {

      toast(
        `Anda berada di luar radius kantor (${Math.round(
          result.distance
        )} meter dari kantor).`
      );
    }

  } catch (err) {

    errorMsg.value =
      err.message || "Gagal mendapatkan lokasi.";

    toast(errorMsg.value);
  }
};

const ensureLocationValid = async () => {

  if (
    isWithinRadius.value === null ||
    !currentLocation.value
  ) {
    await checkLocationManual();
  }

  if (!isWithinRadius.value) {

    throw new Error(
      `Anda berada di luar radius kantor (${RADIUS_METERS} meter). Absensi tidak diizinkan.`
    );
  }

  return true;
};

/* =========================================================
   ACTIONS
========================================================= */
const doCheckin = async () => {

  actionLoading.value = true;

  errorMsg.value = "";

  try {

    await ensureLocationValid();

    await loadToday();

    if (attendanceToday.value) {

      toast("Anda sudah check-in.");

      return;
    }

    await checkin();

    await refreshAll();

    const msg = randomMessage(checkinGreetings);

    toast(msg);

    showMotivation(msg, "checkin");

  } catch (err) {

    errorMsg.value =
      err.message || "Check-in gagal.";

    toast(errorMsg.value);

  } finally {

    actionLoading.value = false;
  }
};

const doCheckout = async () => {

  actionLoading.value = true;

  errorMsg.value = "";

  try {

    await ensureLocationValid();

    await loadToday();

    if (!attendanceToday.value) {

      toast("Belum check-in.");

      return;
    }

    if (attendanceToday.value.checkout_time) {

      toast("Sudah check-out.");

      return;
    }

    await checkout(attendanceToday.value.id);

    await refreshAll();

    const msg = randomMessage(checkoutGreetings);

    toast(msg);

    showMotivation(msg, "checkout");

  } catch (err) {

    errorMsg.value =
      err.message || "Check-out gagal.";

    toast(errorMsg.value);

  } finally {

    actionLoading.value = false;
  }
};

/* =========================================================
   ANNOUNCEMENT
========================================================= */
const handleInfoClick = () => {

  bellRead.value = true;

  localStorage.setItem(
    "announcementCount",
    announcements.value.length
  );
};

/* =========================================================
   MOUNTED
========================================================= */
onMounted(async () => {

  loadingCard.value = true;

  try {

    startClock();

    checkMorningGreeting();

    await refreshAll();

    await loadAnnouncements();

    const savedCount = Number(
      localStorage.getItem("announcementCount") || 0
    );

    lastAnnouncementCount.value = savedCount;

    if (announcements.value.length > savedCount) {

      bellRead.value = false;

    } else {

      bellRead.value = true;
    }

    if (emergencyAnnouncement.value) {
      showEmergency.value = true;
    }

  } finally {

    loadingCard.value = false;
  }
});

/* =========================================================
   WATCH ANNOUNCEMENT
========================================================= */
watch(
  () => announcements.value.length,
  (newCount) => {

    const savedCount = Number(
      localStorage.getItem("announcementCount") || 0
    );

    if (newCount > savedCount) {
      bellRead.value = false;
    }
  }
);

/* =========================================================
   LOGOUT
========================================================= */
const logout = async () => {

  await authLogout();

  router.replace("/login");
};
</script>

<style scoped>
.motivation-card {
  overflow: hidden;
  position: relative;
  animation: slideFade 0.5s ease;
}

.motivation-card::before {
  content: "";
  position: absolute;
  top: -30px;
  right: -30px;
  width: 120px;
  height: 120px;
  background: rgba(255,255,255,0.12);
  border-radius: 999px;
}

.motivation-avatar {
  box-shadow: 0 6px 14px rgba(0,0,0,0.18);
}

@keyframes slideFade {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-active {
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.btn-disabled {
  box-shadow: none !important;
  opacity: 0.7;
}

.btn-active:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.25);
}

.banner-card {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border: none;
  color: white;
}
.avatar-glow {
  border: 3px solid rgba(255,255,255,0.6);
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
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

.bell-animation {
  animation: bellShake 1.5s infinite;
  transform-origin: top center;
}

@keyframes bellShake {
  0% { transform: rotate(0); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-12deg); }
  30% { transform: rotate(10deg); }
  40% { transform: rotate(-8deg); }
  50% { transform: rotate(6deg); }
  60% { transform: rotate(-4deg); }
  70% { transform: rotate(2deg); }
  80% { transform: rotate(-1deg); }
  100% { transform: rotate(0); }
}
</style>