<template>
  <v-container fluid class="dashboard-container pa-4 pa-md-6">

    <!-- ===================================================== -->
    <!-- HEADER -->
    <!-- ===================================================== -->
    <v-row
      align="center"
      justify="space-between"
      class="mb-6"
    >

      <v-col cols="auto">

        <div class="d-flex align-center">

          <v-avatar
            color="primary"
            size="48"
            class="mr-4 elevation-2"
          >
            <v-icon
              icon="mdi-account-group"
              size="28"
              color="white"
            />

          </v-avatar>

          <div>

            <h1 class="text-h4 font-weight-bold text-gradient">
              Dashboard Kehadiran
            </h1>

            <p class="text-subtitle-1 text-medium-emphasis mt-1">
              Monitoring realtime kehadiran karyawan
            </p>

          </div>

        </div>

      </v-col>

      <v-col cols="auto">

        <div class="d-flex ga-3 align-center">

          <v-btn
            icon="mdi-refresh"
            variant="text"
            :loading="loading"
            @click="fetchData"
          />

          <v-btn
            @click="logout"
            color="white"
            icon="mdi-logout"
            size="small"
            variant="flat"
          />

        </div>

      </v-col>

    </v-row>

    <!-- ===================================================== -->
    <!-- SUMMARY CARD -->
    <!-- ===================================================== -->
    <v-row class="mb-6">

      <v-col
        cols="12"
        sm="6"
        md="4"
      >

        <v-card
          class="stat-card"
          color="primary"
          elevation="2"
          rounded="xl"
        >

          <v-card-text>

            <div class="d-flex justify-space-between align-center">

              <div>

                <p class="text-subtitle-2 mb-1">
                  Total Kehadiran
                </p>

                <h2 class="text-h3 font-weight-bold">
                  {{ totalAttendance }}
                </h2>

              </div>

              <v-icon
                size="38"
                icon="mdi-account-group"
              />

            </div>

          </v-card-text>

        </v-card>

      </v-col>

      <v-col
        cols="12"
        sm="6"
        md="4"
      >

        <v-card
          class="stat-card"
          color="success"
          elevation="2"
          rounded="xl"
        >

          <v-card-text>

            <div class="d-flex justify-space-between align-center">

              <div>

                <p class="text-subtitle-2 mb-1">
                  Tepat Waktu
                </p>

                <h2 class="text-h3 font-weight-bold">
                  {{ onTimeCount }}
                </h2>

              </div>

              <v-icon
                size="38"
                icon="mdi-clock-check"
              />

            </div>

          </v-card-text>

        </v-card>

      </v-col>

      <v-col
        cols="12"
        sm="6"
        md="4"
      >

        <v-card
          class="stat-card"
          color="error"
          elevation="2"
          rounded="xl"
        >

          <v-card-text>

            <div class="d-flex justify-space-between align-center">

              <div>

                <p class="text-subtitle-2 mb-1">
                  Terlambat
                </p>

                <h2 class="text-h3 font-weight-bold">
                  {{ lateCount }}
                </h2>

              </div>

              <v-icon
                size="38"
                icon="mdi-clock-alert"
              />

            </div>

          </v-card-text>

        </v-card>

      </v-col>

    </v-row>

    <!-- ===================================================== -->
    <!-- FILTER -->
    <!-- ===================================================== -->
    <v-card
      class="mb-6 pa-4"
      rounded="xl"
      elevation="2"
    >

      <v-row>

        <v-col
          cols="12"
          md="4"
        >

          <v-text-field
            v-model="search"
            label="Cari Nama Karyawan"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
          />

        </v-col>

        <v-col
          cols="12"
          md="3"
        >

          <v-select
            v-model="filterStatus"
            :items="statusOptions"
            label="Status"
            density="comfortable"
            variant="outlined"
            hide-details
          />

        </v-col>

      </v-row>

    </v-card>

    <!-- ===================================================== -->
    <!-- TABEL KEHADIRAN HARI INI -->
    <!-- ===================================================== -->
    <v-row>

      <v-col cols="12">

        <v-card
          rounded="xl"
          elevation="2"
          class="overflow-hidden"
        >

          <v-card-title
            class="d-flex align-center justify-space-between pa-4"
          >

            <div>

              <h2 class="text-h6 font-weight-bold">
                Kehadiran Hari Ini
              </h2>

              <p class="text-body-2 text-medium-emphasis">
                Daftar kehadiran karyawan hari ini
              </p>

            </div>

            <v-chip
              color="primary"
              variant="flat"
            >
              {{ todayAttendance.length }} Karyawan
            </v-chip>

          </v-card-title>

          <v-divider />

          <v-data-table
            :headers="headers"
            :items="todayAttendance"
            :loading="loading"
            :items-per-page="5"
            hover
          >

            <!-- NAMA -->
            <template #item["profiles.full_name"]="{ item }">

              <div class="d-flex align-center">

                <v-avatar
                  size="34"
                  class="mr-3"
                  :color="getAvatarColor(item.profiles?.full_name)"
                >

                  <span class="text-white text-caption">
                    {{ getInitials(item.profiles?.full_name) }}
                  </span>

                </v-avatar>

                <span class="font-weight-medium">
                  {{ item.profiles?.full_name }}
                </span>

              </div>

            </template>

            <!-- CHECKIN -->
            <template #item.checkin_time="{ item }">

              <span
                :class="isLate(item.checkin_time)
                  ? 'text-error'
                  : 'text-success'"
              >
                {{ formatTime(item.checkin_time) }}
              </span>

            </template>

            <!-- CHECKOUT -->
            <template #item.checkout_time="{ item }">

              {{ formatTime(item.checkout_time) }}

            </template>

            <!-- STATUS -->
            <template #item.status="{ item }">

              <v-chip
                :color="isLate(item.checkin_time)
                  ? 'error'
                  : 'success'"
                size="small"
                variant="flat"
              >
                {{ isLate(item.checkin_time)
                  ? 'Terlambat'
                  : 'Tepat Waktu'
                }}
              </v-chip>

            </template>

            <!-- TANGGAL -->
            <template #item.created_at="{ item }">

              {{ formatDate(item.created_at) }}

            </template>

          </v-data-table>

        </v-card>

      </v-col>

    </v-row>

    <!-- ===================================================== -->
    <!-- TABEL KEHADIRAN MINGGU INI -->
    <!-- ===================================================== -->
    <v-row class="mt-6">

      <v-col cols="12">

        <v-card
          rounded="xl"
          elevation="2"
          class="overflow-hidden"
        >

          <v-card-title
            class="d-flex align-center justify-space-between pa-4"
          >

            <div>

              <h2 class="text-h6 font-weight-bold">
                Kehadiran Minggu Ini
              </h2>

              <p class="text-body-2 text-medium-emphasis">
                Rekap absensi selama minggu berjalan
              </p>

            </div>

            <v-chip
              color="success"
              variant="flat"
            >
              {{ weeklyAttendance.length }} Kehadiran
            </v-chip>

          </v-card-title>

          <v-divider />

          <v-data-table
            :headers="headers"
            :items="weeklyAttendance"
            :loading="loading"
            :items-per-page="10"
            hover
          >

            <!-- NAMA -->
            <template #item["profiles.full_name"]="{ item }">

              <div class="d-flex align-center">

                <v-avatar
                  size="34"
                  class="mr-3"
                  :color="getAvatarColor(item.profiles?.full_name)"
                >

                  <span class="text-white text-caption">
                    {{ getInitials(item.profiles?.full_name) }}
                  </span>

                </v-avatar>

                <span class="font-weight-medium">
                  {{ item.profiles?.full_name }}
                </span>

              </div>

            </template>

            <!-- CHECKIN -->
            <template #item.checkin_time="{ item }">

              <span
                :class="isLate(item.checkin_time)
                  ? 'text-error'
                  : 'text-success'"
              >
                {{ formatTime(item.checkin_time) }}
              </span>

            </template>

            <!-- CHECKOUT -->
            <template #item.checkout_time="{ item }">

              {{ formatTime(item.checkout_time) }}

            </template>

            <!-- STATUS -->
            <template #item.status="{ item }">

              <v-chip
                :color="isLate(item.checkin_time)
                  ? 'error'
                  : 'success'"
                size="small"
                variant="flat"
              >
                {{ isLate(item.checkin_time)
                  ? 'Terlambat'
                  : 'Tepat Waktu'
                }}
              </v-chip>

            </template>

            <!-- TANGGAL -->
            <template #item.created_at="{ item }">

              {{ formatDate(item.created_at) }}

            </template>

          </v-data-table>

        </v-card>

      </v-col>

    </v-row>

    <!-- ===================================================== -->
<!-- TABEL REKAP 2 MINGGU -->
<!-- ===================================================== -->
<v-row class="mt-6">

  <v-col cols="12">

    <v-card
      rounded="xl"
      elevation="2"
      class="overflow-hidden"
    >

      <!-- HEADER -->
      <v-card-title
        class="d-flex align-center justify-space-between pa-4"
      >

        <div>

          <h2 class="text-h6 font-weight-bold">
            Rekap Kehadiran 2 Minggu
          </h2>

          <p class="text-body-2 text-medium-emphasis">
            Total kehadiran karyawan selama 14 hari terakhir
          </p>

        </div>

        <v-chip
          color="info"
          variant="flat"
        >
          {{ twoWeeksAttendance.length }} Karyawan
        </v-chip>

      </v-card-title>

      <v-divider />

      <!-- TABLE -->
      <v-data-table
        :headers="twoWeeksHeaders"
        :items="twoWeeksAttendance"
        :items-per-page="10"
        hover
      >

        <!-- NAMA -->
        <template #item.name="{ item }">

          <div class="d-flex align-center">

            <v-avatar
              size="36"
              class="mr-3"
              :color="getAvatarColor(item.name)"
            >

              <span class="text-white text-caption">
                {{ getInitials(item.name) }}
              </span>

            </v-avatar>

            <span class="font-weight-medium">
              {{ item.name }}
            </span>

          </div>

        </template>

        <!-- TOTAL HADIR -->
        <template #item.total_hadir="{ item }">

          <v-chip
            color="primary"
            variant="flat"
            size="small"
          >
            {{ item.total_hadir }} Hari
          </v-chip>

        </template>

        <!-- TEPAT WAKTU -->
        <template #item.tepat_waktu="{ item }">

          <v-chip
            color="success"
            variant="flat"
            size="small"
          >
            {{ item.tepat_waktu }}
          </v-chip>

        </template>

        <!-- TERLAMBAT -->
        <template #item.terlambat="{ item }">

          <v-chip
            color="error"
            variant="flat"
            size="small"
          >
            {{ item.terlambat }}
          </v-chip>

        </template>

      </v-data-table>

    </v-card>

  </v-col>

</v-row>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { supabase } from "@/lib/supabase"
import router from "@/router"

/* =======================================================
   STATE
======================================================= */
const attendance = ref([])
const loading = ref(false)

const search = ref("")
const filterStatus = ref("all")

/* =======================================================
   CONSTANT
======================================================= */
const BATAS = "08:00:00"

const statusOptions = [
  {
    title: "Semua",
    value: "all"
  },
  {
    title: "Tepat Waktu",
    value: "ontime"
  },
  {
    title: "Terlambat",
    value: "late"
  }
]

const headers = [
  {
    title: "Karyawan",
    key: "profiles.full_name"
  },
  {
    title: "Check In",
    key: "checkin_time"
  },
  {
    title: "Check Out",
    key: "checkout_time"
  },
  {
    title: "Status",
    key: "status"
  },
  {
    title: "Tanggal",
    key: "created_at"
  }
]

/* =======================================================
   HELPER
======================================================= */
const formatTime = (time) => {
  return time
    ? time.slice(0, 5)
    : "-"
}

const formatDate = (date) => {
  if (!date) return "-"

  return new Date(date)
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
}

const isLate = (time) => {
  return time > BATAS
}

const getInitials = (name) => {
  if (!name) return "?"

  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getAvatarColor = (name) => {
  const colors = [
    "primary",
    "success",
    "warning",
    "error",
    "info"
  ]

  if (!name) return "grey"

  let hash = 0

  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i)
  }

  return colors[hash % colors.length]
}

/* =======================================================
   FILTERED DATA
======================================================= */
const filteredData = computed(() => {
  let data = [...attendance.value]

  if (search.value) {
    data = data.filter(item =>
      item.profiles?.full_name
        ?.toLowerCase()
        .includes(search.value.toLowerCase())
    )
  }

  if (filterStatus.value === "late") {
    data = data.filter(item =>
      isLate(item.checkin_time)
    )
  }

  if (filterStatus.value === "ontime") {
    data = data.filter(item =>
      !isLate(item.checkin_time)
    )
  }

  return data
})

/* =======================================================
   TODAY ATTENDANCE
======================================================= */
const todayAttendance = computed(() => {
  const today = new Date().toDateString()

  return filteredData.value.filter(item => {
    return new Date(item.created_at)
      .toDateString() === today
  })
})

/* =======================================================
   WEEKLY ATTENDANCE
======================================================= */
const weeklyAttendance = computed(() => {
  const now = new Date()

  const firstDay = new Date(now)

  firstDay.setDate(
    now.getDate() - now.getDay()
  )

  firstDay.setHours(0, 0, 0, 0)

  const lastDay = new Date(firstDay)

  lastDay.setDate(
    firstDay.getDate() + 6
  )

  lastDay.setHours(
    23, 59, 59, 999
  )

  return filteredData.value.filter(item => {
    const itemDate = new Date(item.created_at)

    return itemDate >= firstDay &&
      itemDate <= lastDay
  })
})

/* =======================================================
   SUMMARY
======================================================= */
const totalAttendance = computed(() => {
  return attendance.value.length
})

const lateCount = computed(() => {
  return attendance.value.filter(item =>
    isLate(item.checkin_time)
  ).length
})

const onTimeCount = computed(() => {
  return totalAttendance.value - lateCount.value
})

/* =======================================================
   FETCH DATA
======================================================= */
const fetchData = async () => {
  loading.value = true

  const {
    data,
    error
  } = await supabase
    .from("attendance")
    .select(`
      *,
      profiles!attendance_user_id_fkey(
        full_name
      )
    `)
    .order("created_at", {
      ascending: false
    })

  if (!error) {
    attendance.value = data || []
  }

  loading.value = false
}

/* =======================================================
   REALTIME
======================================================= */
const setupRealtime = () => {
  supabase
    .channel("attendance-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "attendance"
      },
      () => {
        fetchData()
      }
    )
    .subscribe()
}

/* =======================================================
   REKAP KEHADIRAN 2 MINGGU
======================================================= */
const twoWeeksAttendance = computed(() => {
  const now = new Date()

  const twoWeeksAgo = new Date()

  twoWeeksAgo.setDate(
    now.getDate() - 14
  )

  twoWeeksAgo.setHours(0, 0, 0, 0)

  const grouped = {}

  attendance.value.forEach(item => {

    const itemDate = new Date(item.created_at)

    if (itemDate >= twoWeeksAgo) {

      const name =
        item.profiles?.full_name || "Unknown"

      if (!grouped[name]) {

        grouped[name] = {
          name,
          total_hadir: 0,
          tepat_waktu: 0,
          terlambat: 0
        }

      }

      grouped[name].total_hadir++

      if (isLate(item.checkin_time)) {
        grouped[name].terlambat++
      } else {
        grouped[name].tepat_waktu++
      }

    }

  })

  return Object.values(grouped)
    .sort((a, b) =>
      b.total_hadir - a.total_hadir
    )
})

const twoWeeksHeaders = [
  {
    title: "Karyawan",
    key: "name"
  },
  {
    title: "Total Hadir",
    key: "total_hadir"
  },
  {
    title: "Tepat Waktu",
    key: "tepat_waktu"
  },
  {
    title: "Terlambat",
    key: "terlambat"
  }
]

/* =======================================================
   LOGOUT
======================================================= */
const logout = async () => {
  await supabase.auth.signOut()

  router.replace("/login")
}

/* =======================================================
   INIT
======================================================= */
onMounted(() => {
  fetchData()
  setupRealtime()
})
</script>

<style scoped>
.dashboard-container {
  background-color: rgb(var(--v-theme-surface));
}

.text-gradient {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)),
    rgb(var(--v-theme-secondary))
  );

  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.stat-card {
  transition: all .25s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}
</style>