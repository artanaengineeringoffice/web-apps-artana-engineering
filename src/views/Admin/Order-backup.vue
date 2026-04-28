<template>
  <v-container class="py-6">

    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold">Order</div>
        <div class="text-body-2 text-medium-emphasis">
          Kelola data order (nama, no hp, pengerjaan, status)
        </div>
      </div>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
        Tambah Order
      </v-btn>
    </div>

    <!-- TOP BAR -->
    <v-card rounded="xl" class="mb-4" elevation="1">
      <v-card-text class="d-flex flex-wrap ga-3 align-center">
        <v-text-field
          v-model="search"
          label="Cari nama / no hp / pengerjaan"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          style="max-width: 420px"
          @update:model-value="handleSearch"
        />

        <v-spacer />

        <v-btn
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="fetchOrders"
        >
          Refresh
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- DATA TABLE -->
    <v-card rounded="xl" elevation="1">
      <v-data-table-server
        :headers="headers"
        :items="orders"
        :items-length="totalItems"
        :loading="loading"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        @update:options="fetchOrders"
        class="text-no-wrap"
      >
        <template #item.status="{ item }">
          <v-chip size="small" :color="statusColor(item.status)" variant="flat">
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-2">
            <v-btn size="small" variant="tonal" icon="mdi-pencil" @click="openEdit(item)" />
            <v-btn size="small" variant="tonal" color="red" icon="mdi-delete" @click="confirmDelete(item)" />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- DIALOG FORM -->
    <v-dialog v-model="dialog" max-width="720">
      <v-card rounded="xl">
        <v-card-title>
          {{ isEdit ? "Edit Order" : "Tambah Order" }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-5">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.nama" label="Nama" variant="outlined" />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="form.no_hp" label="No HP" variant="outlined" />
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="form.pengerjaan" label="Pengerjaan" variant="outlined" />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                :items="statusItems"
                label="Status"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn variant="tonal" @click="dialog = false">Batal</v-btn>
          <v-btn color="primary" :loading="saving" @click="submit">
            {{ isEdit ? "Simpan Perubahan" : "Simpan Order" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DELETE -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title>Hapus Order?</v-card-title>
        <v-card-text>
          Yakin hapus <b>{{ selected?.nama }}</b>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="tonal" @click="closeDelete">Batal</v-btn>
          <v-btn color="red" :loading="deleting" @click="deleteOrder">
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
    </v-snackbar>

  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { supabase } from "../../lib/supabase"

interface Order {
  id: number
  nama: string
  no_hp: string
  pengerjaan: string
  status: string
  created_at: string
}

const orders = ref<Order[]>([])
const totalItems = ref(0)

const page = ref(1)
const itemsPerPage = ref(10)

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const dialog = ref(false)
const deleteDialog = ref(false)
const isEdit = ref(false)

const search = ref("")
const selected = ref<Order | null>(null)

const headers = [
  { title: "Nama", key: "nama" },
  { title: "No HP", key: "no_hp" },
  { title: "Pengerjaan", key: "pengerjaan" },
  { title: "Status", key: "status" },
  { title: "Dibuat", key: "created_at" },
  { title: "Aksi", key: "actions", sortable: false },
]

const statusItems = ["pending", "proses", "selesai"]

const form = reactive({
  id: 0,
  nama: "",
  no_hp: "",
  pengerjaan: "",
  status: "pending",
})

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
})

/* =========================
   FETCH DATA (SERVER SIDE)
========================= */

async function fetchOrders() {
  loading.value = true

  try {
    const from = (page.value - 1) * itemsPerPage.value
    const to = from + itemsPerPage.value - 1

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (search.value.trim()) {
      const keyword = search.value.trim()
      query = query.or(
        `nama.ilike.%${keyword}%,no_hp.ilike.%${keyword}%,pengerjaan.ilike.%${keyword}%`
      )
    }

    const { data, error, count } = await query
    if (error) throw error

    orders.value = data ?? []
    totalItems.value = count ?? 0
  } catch (err: any) {
    showToast(err?.message || "Gagal load data", "red")
  } finally {
    loading.value = false
  }
}

/* =========================
   CRUD
========================= */

async function submit() {
  saving.value = true

  try {
    const payload = {
      nama: form.nama.trim(),
      no_hp: form.no_hp.trim(),
      pengerjaan: form.pengerjaan.trim(),
      status: form.status,
    }

    if (isEdit.value) {
      const { error } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", form.id)

      if (error) throw error
      showToast("Order berhasil diupdate")
    } else {
      const { error } = await supabase
        .from("orders")
        .insert(payload)

      if (error) throw error
      showToast("Order berhasil ditambahkan")
    }

    dialog.value = false
    fetchOrders()
  } catch (err: any) {
    showToast(err?.message || "Gagal simpan", "red")
  } finally {
    saving.value = false
  }
}

async function deleteOrder() {
  if (!selected.value) return

  deleting.value = true
  try {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", selected.value.id)

    if (error) throw error

    showToast("Order berhasil dihapus")
    closeDelete()
    fetchOrders()
  } catch (err: any) {
    showToast(err?.message || "Gagal hapus", "red")
  } finally {
    deleting.value = false
  }
}

/* =========================
   UI HANDLER
========================= */

function openCreate() {
  isEdit.value = false
  Object.assign(form, {
    id: 0,
    nama: "",
    no_hp: "",
    pengerjaan: "",
    status: "pending",
  })
  dialog.value = true
}

function openEdit(item: Order) {
  isEdit.value = true
  Object.assign(form, item)
  dialog.value = true
}

function confirmDelete(item: Order) {
  selected.value = item
  deleteDialog.value = true
}

function closeDelete() {
  deleteDialog.value = false
  selected.value = null
}

function handleSearch() {
  page.value = 1
  fetchOrders()
}

function showToast(text: string, color = "success") {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function statusColor(status: string) {
  if (status === "pending") return "grey"
  if (status === "proses") return "orange"
  if (status === "selesai") return "green"
  return "blue"
}

function formatDate(iso: string) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("id-ID")
}

onMounted(fetchOrders)
</script>