<template>
  <v-container fluid class="dashboard-container pa-4 pa-md-6">
    <!-- ========== HEADER ========== -->
    <v-row align="center" justify="space-between" class="mb-6">
      <v-col cols="auto">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="48" class="mr-4 elevation-2">
            <v-icon icon="mdi-account-group" size="28" color="white" />
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold text-gradient">Dashboard Kehadiran</h1>
            <p class="text-subtitle-1 text-medium-emphasis mt-1">
              Pantau rekap absensi karyawan secara realtime
            </p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
        <div class="d-flex ga-3 align-center">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-chip v-bind="props" color="primary" variant="flat" prepend-icon="mdi-account-circle" class="py-5">
                Role: {{ role }}
              </v-chip>
            </template>
            <span>Hak akses Anda saat ini</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-refresh" variant="text" :loading="loading" @click="fetchData" />
            </template>
            <span>Refresh data</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'" variant="text" @click="toggleDarkMode" />
            </template>
            <span>{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
          </v-tooltip>
        </div>
      </v-col>
    </v-row>

    <!-- ========== STATISTICS CARDS with PROGRESS ========== -->
    <v-row class="mb-6">
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2" :color="stat.color" dark :ripple="false">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-subtitle-1 font-weight-medium">{{ stat.title }}</span>
              <v-icon :icon="stat.icon" size="28" opacity="0.8" />
            </div>
            <div class="text-h3 font-weight-bold mb-2">{{ stat.value }}</div>
            <v-progress-linear
              v-if="stat.progress !== undefined"
              :model-value="stat.progress"
              color="white"
              height="6"
              rounded
              opacity="0.5"
              bg-opacity="0.2"
            />
            <div v-if="stat.subtext" class="text-caption mt-2 opacity-75">
              {{ stat.subtext }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ========== FILTER PANEL ========== -->
    <v-card class="mb-6 pa-4 rounded-xl" elevation="2">
      <v-row align="center" no-gutters>
        <v-col cols="12" md="4" class="pr-md-3">
          <v-text-field
            v-model="search"
            label="Cari nama karyawan"
            prepend-inner-icon="mdi-magnify"
            clearable
            density="comfortable"
            variant="outlined"
            hide-details
            class="rounded-lg"
          />
        </v-col>
        <v-col cols="12" md="2" class="pr-md-3 mt-3 mt-md-0">
          <v-select
            v-model="filterStatus"
            :items="statusOptions"
            label="Status Kehadiran"
            prepend-inner-icon="mdi-filter"
            density="comfortable"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="4" class="pr-md-3 mt-3 mt-md-0">
          <div class="d-flex ga-2">
            <v-menu
              v-model="dateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-model="dateRangeText"
                  label="Rentang Tanggal"
                  prepend-inner-icon="mdi-calendar-range"
                  readonly
                  v-bind="props"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="flex-grow-1"
                />
              </template>
              <v-date-picker v-model="dateRange" range :multiple="false" @update:model-value="dateMenu = false" />
            </v-menu>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-close-circle" variant="text" color="error" @click="clearDateRange" />
              </template>
              <span>Clear filter tanggal</span>
            </v-tooltip>
          </div>
        </v-col>
        <v-col cols="12" md="2" class="mt-3 mt-md-0 text-end">
          <div class="d-flex ga-2 justify-end">
            <v-btn-toggle v-model="viewMode" density="comfortable" divided mandatory>
              <v-btn value="list" prepend-icon="mdi-format-list-bulleted">List</v-btn>
              <v-btn value="daily" prepend-icon="mdi-calendar-today">Per Hari</v-btn>
            </v-btn-toggle>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" color="primary" variant="tonal" prepend-icon="mdi-export" @click="exportToCSV">
                  Export
                </v-btn>
              </template>
              <span>Export sebagai CSV</span>
            </v-tooltip>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- ========== QUICK DATE BUTTONS ========== -->
    <v-row class="mb-4">
      <v-col cols="auto">
        <v-btn-group density="compact" divided>
          <v-btn variant="tonal" @click="setQuickDate('today')">Hari Ini</v-btn>
          <v-btn variant="tonal" @click="setQuickDate('week')">Minggu Ini</v-btn>
          <v-btn variant="tonal" @click="setQuickDate('month')">Bulan Ini</v-btn>
          <v-btn variant="tonal" @click="setQuickDate('all')">Semua</v-btn>
        </v-btn-group>
      </v-col>
    </v-row>

    <!-- ========== LOADING SKELETON ========== -->
    <v-skeleton-loader v-if="loading" type="table" class="rounded-xl" />

    <!-- ========== LIST VIEW ========== -->
    <v-card v-else-if="viewMode === 'list'" elevation="2" rounded="xl" class="overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="filteredData"
        :items-per-page="10"
        :hover="true"
        class="elevation-0 custom-table"
        item-value="id"
        :loading="loading"
        loading-text="Memuat data..."
      >
        <template #item.profiles.full_name="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-3" :color="getAvatarColor(item.profiles?.full_name)">
              <span class="text-body-2 font-weight-bold text-white">{{ getInitials(item.profiles?.full_name) }}</span>
            </v-avatar>
            <span class="font-weight-medium">{{ item.profiles?.full_name || '-' }}</span>
          </div>
        </template>
        <template #item.checkin_time="{ item }">
          <div class="d-flex align-center">
            <v-chip :color="isLate(item.checkin_time) ? 'error' : 'success'" size="small" variant="light" class="mr-2">
              {{ isLate(item.checkin_time) ? 'Telat' : 'Tepat' }}
            </v-chip>
            <span :class="isLate(item.checkin_time) ? 'text-error' : 'text-success'">
              {{ formatTime(item.checkin_time) }}
            </span>
          </div>
        </template>
        <template #item.checkout_time="{ item }">
          <span>{{ formatTime(item.checkout_time) }}</span>
        </template>
        <template #item.work_progress="{ item }">
          <div class="d-flex align-center">
            <v-progress-linear
              :model-value="computeWorkProgress(item)"
              :color="computeWorkProgress(item) >= 100 ? 'success' : 'warning'"
              height="6"
              rounded
              class="mr-3 flex-grow-1"
            />
            <span class="text-caption font-weight-medium">{{ computeWorkProgress(item) }}%</span>
          </div>
        </template>
        <template #item.created_at="{ item }">
          <div class="text-body-2">{{ formatDate(item.created_at) }}</div>
        </template>
        <template #item.actions="{ item }">
          <v-tooltip location="left">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-eye" variant="text" size="small" color="primary" @click="showDetail(item)" />
            </template>
            <span>Lihat detail</span>
          </v-tooltip>
        </template>
        <template #no-data>
          <v-alert type="info" variant="tonal" class="ma-4" icon="mdi-alert-circle-outline">
            Tidak ada data kehadiran yang ditemukan. Coba ubah filter atau sinkronkan data.
          </v-alert>
        </template>
      </v-data-table>
      <v-divider />
      <v-card-actions class="bg-surface-variant pa-3">
        <v-spacer />
        <span class="text-caption text-medium-emphasis">Last sync: {{ lastSync }}</span>
      </v-card-actions>
    </v-card>

    <!-- ========== DAILY SUMMARY VIEW ========== -->
    <v-card v-else-if="viewMode === 'daily'" elevation="2" rounded="xl" class="overflow-hidden">
      <v-data-table
        :headers="dailyHeaders"
        :items="dailySummary"
        :items-per-page="10"
        :hover="true"
        class="elevation-0 custom-table"
      >
        <template #item.date="{ item }">
          <span class="font-weight-medium">{{ item.date }}</span>
        </template>
        <template #item.total="{ item }">
          <v-chip color="primary" size="small" variant="light">{{ item.total }} orang</v-chip>
        </template>
        <template #item.late="{ item }">
          <v-chip :color="item.late > 0 ? 'warning' : 'success'" size="small" variant="light">
            {{ item.late }}
          </v-chip>
        </template>
        <template #item.attendance_rate="{ item }">
          <div class="d-flex align-center ga-2">
            <v-progress-circular
              :model-value="item.attendance_rate"
              :color="item.attendance_rate >= 80 ? 'success' : 'warning'"
              size="36"
              width="4"
            >
              {{ item.attendance_rate }}%
            </v-progress-circular>
            <span class="text-caption">tepat waktu</span>
          </div>
        </template>
        <template #item.actions="{ item }">
          <v-tooltip location="left">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-account-details" variant="text" size="small" color="info" @click="showDailyDetail(item.dateObj)" />
            </template>
            <span>Daftar karyawan hadir</span>
          </v-tooltip>
        </template>
        <template #no-data>
          <v-alert type="info" variant="tonal" class="ma-4" icon="mdi-alert-circle-outline">
            Tidak ada ringkasan harian untuk periode ini.
          </v-alert>
        </template>
      </v-data-table>
      <v-divider />
      <v-card-actions class="bg-surface-variant pa-3">
        <v-spacer />
        <span class="text-caption text-medium-emphasis">Last sync: {{ lastSync }}</span>
      </v-card-actions>
    </v-card>

    <!-- ========== DIALOG DETAIL INDIVIDUAL ========== -->
    <v-dialog v-model="detailDialog" max-width="550" transition="dialog-bottom-transition">
      <v-card v-if="selectedItem" rounded="xl">
        <v-card-title class="text-h6 bg-primary text-white pa-4">
          <v-icon icon="mdi-account-details" class="mr-2" />
          Detail Kehadiran
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" color="white" @click="detailDialog = false" />
        </v-card-title>
        <v-card-text class="pa-4">
          <v-list lines="two" class="bg-transparent">
            <v-list-item>
              <template #prepend>
                <v-avatar :color="getAvatarColor(selectedItem.profiles?.full_name)" size="40">
                  <span class="text-white">{{ getInitials(selectedItem.profiles?.full_name) }}</span>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold">Nama</v-list-item-title>
              <v-list-item-subtitle>{{ selectedItem.profiles?.full_name || '-' }}</v-list-item-subtitle>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <v-list-item-title class="font-weight-bold">Check-in</v-list-item-title>
              <v-list-item-subtitle :class="isLate(selectedItem.checkin_time) ? 'text-error' : 'text-success'">
                {{ formatTime(selectedItem.checkin_time) }}
                <v-chip v-if="isLate(selectedItem.checkin_time)" size="x-small" color="error" class="ml-2" variant="light">Telat</v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="font-weight-bold">Check-out</v-list-item-title>
              <v-list-item-subtitle>{{ formatTime(selectedItem.checkout_time) || 'Belum checkout' }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="font-weight-bold">Durasi Kerja</v-list-item-title>
              <v-list-item-subtitle>{{ computeDuration(selectedItem) }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="font-weight-bold">Tanggal</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedItem.created_at, true) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn color="primary" variant="tonal" rounded="pill" @click="detailDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ========== DIALOG DAILY DETAIL ========== -->
    <v-dialog v-model="dailyDetailDialog" max-width="800" transition="dialog-bottom-transition">
      <v-card v-if="selectedDailyDate" rounded="xl">
        <v-card-title class="text-h6 bg-primary text-white pa-4">
          <v-icon icon="mdi-calendar-today" class="mr-2" />
          Kehadiran: {{ formatDate(selectedDailyDate, true) }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" color="white" @click="dailyDetailDialog = false" />
        </v-card-title>
        <v-card-text class="pa-4">
          <v-data-table
            :headers="dailyDetailHeaders"
            :items="attendanceOnSelectedDate"
            :items-per-page="5"
            density="comfortable"
            class="rounded-lg"
            hover
          >
            <template #item.profiles.full_name="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="28" class="mr-2" :color="getAvatarColor(item.profiles?.full_name)">
                  <span class="text-white text-caption">{{ getInitials(item.profiles?.full_name) }}</span>
                </v-avatar>
                {{ item.profiles?.full_name || '-' }}
              </div>
            </template>
            <template #item.checkin_time="{ item }">
              <span :class="isLate(item.checkin_time) ? 'text-error' : 'text-success'">
                {{ formatTime(item.checkin_time) }}
              </span>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="isLate(item.checkin_time) ? 'error' : 'success'" size="x-small" variant="light">
                {{ isLate(item.checkin_time) ? 'Telat' : 'Tepat' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn color="primary" variant="tonal" rounded="pill" @click="dailyDetailDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { supabase } from '../lib/supabase'
import { ref, onMounted, computed, watch } from 'vue'

// ========== STATE ==========
const user = ref(null)
const role = ref(null)
const attendance = ref([])
const loading = ref(false)
const search = ref('')
const filterStatus = ref('all')
const dateRange = ref([])
const dateMenu = ref(false)
const detailDialog = ref(false)
const selectedItem = ref(null)
const viewMode = ref('list')
const dailyDetailDialog = ref(false)
const selectedDailyDate = ref(null)
const lastSync = ref(new Date().toLocaleString())

// ========== DARK MODE ==========
const isDark = ref(localStorage.getItem('theme') === 'dark')
const toggleDarkMode = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
}

// ========== CONSTANTS ==========
const BATAS = "08:00:00"
const cardColors = {
  total: 'primary',
  late: 'warning',
  ontime: 'success',
  avg: 'info'
}
const statusOptions = [
  { title: 'Semua', value: 'all' },
  { title: 'Tepat Waktu', value: 'ontime' },
  { title: 'Telat', value: 'late' }
]

// ========== STATS DATA ==========
const stats = computed(() => [
  { title: 'Total Kehadiran', value: total.value, icon: 'mdi-calendar-check', color: cardColors.total, progress: 100 },
  { title: 'Karyawan Telat', value: lateCount.value, icon: 'mdi-alarm', color: cardColors.late, progress: total.value ? (lateCount.value / total.value) * 100 : 0 },
  { title: 'Tepat Waktu', value: onTimeCount.value, icon: 'mdi-clock-check', color: cardColors.ontime, progress: total.value ? (onTimeCount.value / total.value) * 100 : 0 },
  { title: 'Rata-rata Check-in', value: avgCheckinTime.value || '-', icon: 'mdi-timer-sand', color: cardColors.avg, subtext: 'Waktu masuk rata-rata' }
])

// ========== TABLE HEADERS ==========
const headers = [
  { title: 'Karyawan', key: 'profiles.full_name', sortable: true },
  { title: 'Check-in', key: 'checkin_time', sortable: true },
  { title: 'Check-out', key: 'checkout_time', sortable: true },
  { title: 'Progress Kerja', key: 'work_progress', sortable: false },
  { title: 'Tanggal', key: 'created_at', sortable: true },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center' }
]
const dailyHeaders = [
  { title: 'Tanggal', key: 'date', sortable: true },
  { title: 'Total Hadir', key: 'total', sortable: true, align: 'center' },
  { title: 'Jumlah Telat', key: 'late', sortable: true, align: 'center' },
  { title: 'Persentase Kehadiran', key: 'attendance_rate', sortable: true, align: 'center' },
  { title: 'Detail', key: 'actions', sortable: false, align: 'center' }
]
const dailyDetailHeaders = [
  { title: 'Nama', key: 'profiles.full_name' },
  { title: 'Check-in', key: 'checkin_time' },
  { title: 'Check-out', key: 'checkout_time' },
  { title: 'Status', key: 'status' }
]

// ========== HELPER FUNCTIONS ==========
const formatTime = (time) => time ? time.slice(0, 5) : '-'
const formatDate = (date, long = false) => {
  if (!date) return '-'
  const opts = long 
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(date).toLocaleDateString('id-ID', opts)
}
const isLate = (time) => time && time > BATAS
const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
const getAvatarColor = (name) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  if (!name) return 'grey'
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return colors[hash % colors.length]
}
const computeWorkProgress = (item) => {
  if (!item.checkin_time || !item.checkout_time) return 0
  const checkin = new Date(`1970-01-01T${item.checkin_time}`)
  const checkout = new Date(`1970-01-01T${item.checkout_time}`)
  let diff = (checkout - checkin) / (1000 * 60)
  if (diff < 0) diff += 24 * 60
  const target = 8 * 60
  return Math.min(100, Math.round((diff / target) * 100))
}
const computeDuration = (item) => {
  if (!item.checkin_time || !item.checkout_time) return '-'
  const checkin = new Date(`1970-01-01T${item.checkin_time}`)
  const checkout = new Date(`1970-01-01T${item.checkout_time}`)
  let diff = (checkout - checkin) / (1000 * 60)
  if (diff < 0) diff += 24 * 60
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return `${hours} jam ${mins} menit`
}

// ========== FILTERED DATA ==========
const filteredData = computed(() => {
  let data = [...attendance.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    data = data.filter(item => item.profiles?.full_name?.toLowerCase().includes(q))
  }
  if (filterStatus.value === 'late') data = data.filter(item => isLate(item.checkin_time))
  else if (filterStatus.value === 'ontime') data = data.filter(item => !isLate(item.checkin_time))
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    const startDate = new Date(start)
    const endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)
    data = data.filter(item => {
      const itemDate = new Date(item.created_at)
      return itemDate >= startDate && itemDate <= endDate
    })
  }
  return data
})

// ========== DAILY SUMMARY ==========
const dailySummary = computed(() => {
  const groups = new Map()
  for (const item of filteredData.value) {
    const dateKey = item.created_at.split('T')[0]
    const dateObj = new Date(dateKey)
    if (!groups.has(dateKey)) {
      groups.set(dateKey, { date: formatDate(dateObj), dateObj, total: 0, late: 0, attendance_rate: 0 })
    }
    const group = groups.get(dateKey)
    group.total++
    if (isLate(item.checkin_time)) group.late++
  }
  for (const group of groups.values()) {
    const onTime = group.total - group.late
    group.attendance_rate = group.total > 0 ? Math.round((onTime / group.total) * 100) : 0
  }
  return Array.from(groups.values()).sort((a, b) => b.dateObj - a.dateObj)
})
const attendanceOnSelectedDate = computed(() => {
  if (!selectedDailyDate.value) return []
  const targetDate = selectedDailyDate.value.toDateString()
  return filteredData.value.filter(item => new Date(item.created_at).toDateString() === targetDate)
})

// ========== STATISTICS ==========
const total = computed(() => filteredData.value.length)
const lateCount = computed(() => filteredData.value.filter(i => isLate(i.checkin_time)).length)
const onTimeCount = computed(() => total.value - lateCount.value)
const avgCheckinTime = computed(() => {
  const times = filteredData.value.map(i => i.checkin_time).filter(t => t)
  if (!times.length) return '--:--'
  let totalMins = 0
  times.forEach(t => {
    const [h, m] = t.split(':')
    totalMins += parseInt(h) * 60 + parseInt(m)
  })
  const avgMins = totalMins / times.length
  const hh = Math.floor(avgMins / 60)
  const mm = Math.floor(avgMins % 60)
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
})
const dateRangeText = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return 'Pilih rentang tanggal'
  return `${formatDate(dateRange.value[0])} - ${formatDate(dateRange.value[1])}`
})

// ========== QUICK DATE ==========
const setQuickDate = (type) => {
  const now = new Date()
  let start = new Date()
  if (type === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    dateRange.value = [start, now]
  } else if (type === 'week') {
    const firstDay = now.getDate() - now.getDay()
    start = new Date(now.getFullYear(), now.getMonth(), firstDay)
    const lastDay = firstDay + 6
    const end = new Date(now.getFullYear(), now.getMonth(), lastDay)
    dateRange.value = [start, end]
  } else if (type === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    dateRange.value = [start, end]
  } else {
    dateRange.value = []
  }
}
const clearDateRange = () => { dateRange.value = [] }

// ========== ACTIONS ==========
const showDetail = (item) => {
  selectedItem.value = item
  detailDialog.value = true
}
const showDailyDetail = (dateObj) => {
  selectedDailyDate.value = dateObj
  dailyDetailDialog.value = true
}
const exportToCSV = () => {
  let items = []
  let filename = ''
  if (viewMode.value === 'list') {
    items = filteredData.value.map(item => ({
      Nama: item.profiles?.full_name || '-',
      CheckIn: formatTime(item.checkin_time),
      CheckOut: formatTime(item.checkout_time),
      Status: isLate(item.checkin_time) ? 'Telat' : 'Tepat',
      Tanggal: formatDate(item.created_at, true)
    }))
    filename = `kehadiran_${new Date().toISOString().slice(0,19)}.csv`
  } else {
    items = dailySummary.value.map(day => ({
      Tanggal: day.date,
      TotalHadir: day.total,
      JumlahTelat: day.late,
      PersentaseKehadiran: `${day.attendance_rate}%`
    }))
    filename = `rekap_harian_${new Date().toISOString().slice(0,19)}.csv`
  }
  if (!items.length) return
  const headersCSV = Object.keys(items[0])
  const csvRows = [headersCSV.join(',')]
  for (const row of items) {
    const values = headersCSV.map(header => JSON.stringify(row[header] || ''))
    csvRows.push(values.join(','))
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// ========== FETCH DATA ==========
const fetchData = async () => {
  loading.value = true
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { loading.value = false; return }
  user.value = currentUser
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.value.id).maybeSingle()
  role.value = profile?.role || 'user'
  let query = supabase
    .from('attendance')
    .select(`id, user_id, checkin_time, checkout_time, created_at, profiles!attendance_user_id_fkey ( full_name )`)
    .order('created_at', { ascending: false })
  if (role.value !== 'admin') query = query.eq('user_id', user.value.id)
  const { data, error } = await query
  if (error) console.error(error)
  else attendance.value = data || []
  loading.value = false
  lastSync.value = new Date().toLocaleString()
}
const setupRealtime = () => {
  supabase
    .channel('attendance-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchData())
    .subscribe()
}
const initTheme = () => {
  if (isDark.value) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}
onMounted(() => {
  initTheme()
  fetchData()
  setupRealtime()
})
watch(isDark, (val) => document.documentElement.classList.toggle('dark', val))
</script>

<style scoped>
.dashboard-container {
  background-color: rgb(var(--v-theme-surface));
  transition: background-color 0.2s ease;
}
.text-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.stat-card {
  border-radius: 24px;
  transition: all 0.25s ease;
  backdrop-filter: blur(4px);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}
.custom-table :deep(.v-data-table__tr) {
  transition: background 0.15s;
}
.custom-table :deep(.v-data-table__tr:hover) {
  background: rgba(var(--v-theme-primary), 0.05);
}
.dark .dashboard-container {
  background-color: #121212;
}
.dark .stat-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(4px);
}
</style>