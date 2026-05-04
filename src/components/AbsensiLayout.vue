<template>
    <v-row>
        <v-col>
            <v-card class="pa-4" rounded="xl" elevation="10">
                <div class="d-flex">
                    <v-icon start color="amber" size="35">mdi-flash</v-icon>
                    <p class="text-h5 font-weight-bold">Aksi Cepat</p>
                </div>
                <p class="text-body-2 mt-2 text-grey">Tombol otomatis aktif berdasarkan status Anda.</p>

                <v-row class="pt-4">
                    <v-col cols="12">
                        <v-alert v-if="locationError" rounded="xl" type="error" variant="tonal" density="compact" class="mb-3">
                            {{ locationError }}
                        </v-alert>
                        <v-chip v-else-if="locationLoading" class="mb-2" prepend-icon="mdi-map-marker-radius" variant="text" color="deep-purple" text="Mengambil lokasi.." />
                        <v-chip v-else-if="isWithinRadius === true" class="mb-2" prepend-icon="mdi-check-decagram" variant="text" color="green" text="Dalam radius kantor" />
                        <v-chip v-else-if="isWithinRadius === false" class="mb-2" prepend-icon="mdi-close-circle" variant="text" color="red" text="Luar radius kantor" />
                        <v-chip v-else class="mb-2" prepend-icon="mdi-map-marker-question" variant="text" color="grey" text="Lokasi belum diperiksa" />
                        <v-btn :loading="locationLoading" @click="checkLocationManual" block prepend-icon="mdi-crosshairs-gps" rounded="xl" flat variant="tonal" color="deep-purple" text="Periksa Lokasi Saya" size="large" />
                    </v-col>
                    <v-col cols="12">
                        <v-btn :loading="actionLoading" :disabled="!canCheckin || !isWithinRadius || locationLoading" @click="doCheckin" block prepend-icon="mdi-login" color="green" rounded="xl" elevation="10" size="x-large" text="Check-in" />
                    </v-col>
                    <v-col cols="12">
                        <v-btn :loading="actionLoading" :disabled="!canCheckout || !isWithinRadius || locationLoading" @click="doCheckout" block prepend-icon="mdi-logout" color="deep-purple" rounded="xl" elevation="10" size="x-large" text="Check-out" />
                    </v-col>
                    <v-col cols="12">
                        <v-divider />
                    </v-col>
                    <v-col cols="12" class="d-flex">
                        <v-icon class="mr-2" size="x-small" color="grey">mdi-information-outline</v-icon>
                        <p class="text-caption text-grey">Absensi hanya bisa dilakukan dalam radisu 100 meter dari kantor.</p>
                    </v-col>
                </v-row>
            </v-card>
        </v-col>
    </v-row>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

// === KONFIGURASI LOKASI KANTOR ===
const OFFICE_LAT = -6.589203;
const OFFICE_LNG = 107.474524;
const RADIUS_METERS = 200;

// --- Helper: Haversine ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => deg * (Math.PI / 180);
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const router = useRouter();

// --- State utama ---
const profile = ref(null);
const attendanceToday = ref(null);
const actionLoading = ref(false);
const errorMsg = ref("");

// --- State lokasi ---
const locationLoading = ref(false);
const locationError = ref(null);
const currentLocation = ref(null);
const isWithinRadius = ref(null);

// --- Helper waktu ---
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};

// --- Computed ---
const canCheckin = computed(() => !attendanceToday.value);
const canCheckout = computed(() =>
  attendanceToday.value && !attendanceToday.value.checkout_time
);

// --- Geolocation ---
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung geolocation."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000
    });
  });
};

const checkLocationManual = async () => {
  locationLoading.value = true;
  locationError.value = null;

  try {
    const pos = await getCurrentLocation();

    currentLocation.value = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };

    const distance = getDistance(
      OFFICE_LAT,
      OFFICE_LNG,
      currentLocation.value.lat,
      currentLocation.value.lng
    );

    isWithinRadius.value = distance <= RADIUS_METERS;

  } catch (err) {
    locationError.value = err.message || "Gagal mendapatkan lokasi.";
    isWithinRadius.value = false;
  } finally {
    locationLoading.value = false;
  }
};

const ensureLocationValid = async () => {
  if (isWithinRadius.value === null) {
    await checkLocationManual();
  }

  if (!isWithinRadius.value) {
    throw new Error("Anda di luar radius kantor.");
  }
};

// --- Supabase ---
const loadProfile = async () => {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    router.replace("/login");
    return;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", userData.user.id)
    .single();

  profile.value = data;
};

const loadTodayAttendance = async () => {
  if (!profile.value?.id) return;

  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", profile.value.id)
    .eq("checkin_date", todayISO())
    .maybeSingle();

  attendanceToday.value = data || null;
};

// --- Actions ---
const doCheckin = async () => {
  actionLoading.value = true;

  try {
    await ensureLocationValid();

    if (attendanceToday.value) {
      throw new Error("Sudah check-in");
    }

    await supabase.from("attendance").insert([
      {
        user_id: profile.value.id,
        checkin_date: todayISO(),
        checkin_time: nowTime()
      }
    ]);

    await loadTodayAttendance();

  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    actionLoading.value = false;
  }
};

const doCheckout = async () => {
  actionLoading.value = true;

  try {
    await ensureLocationValid();

    if (!attendanceToday.value) {
      throw new Error("Belum check-in");
    }

    if (attendanceToday.value.checkout_time) {
      throw new Error("Sudah check-out");
    }

    await supabase
      .from("attendance")
      .update({ checkout_time: nowTime() })
      .eq("id", attendanceToday.value.id);

    await loadTodayAttendance();

  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    actionLoading.value = false;
  }
};

// --- Init ---
onMounted(async () => {
  await loadProfile();
  await loadTodayAttendance();
});
</script>