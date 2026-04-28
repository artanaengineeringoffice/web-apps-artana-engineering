<template>
    <NavigationDrawer />

    <v-container class="py-8">
        <!-- Header -->
        <v-row class="mb-6" align="center">
        <v-col cols="12" md="8">
            <div class="d-flex align-center ga-4">
            <v-avatar size="56" color="grey-darken-3">
                <v-img v-if="me?.avatar_url" :src="me.avatar_url" cover />
                <v-icon v-else icon="mdi-shield-account" size="30" />
            </v-avatar>

            <div>
                <div class="text-h5 font-weight-bold">Admin Dashboard</div>
                <div class="text-body-2 text-grey">
                Monitoring semua user
                </div>
            </div>
            </div>
        </v-col>

        <v-col cols="12" md="4" class="d-flex justify-end ga-2">
            <v-btn
            variant="tonal"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="loadProfiles"
            >
            Refresh
            </v-btn>

            <v-btn color="red" variant="flat" prepend-icon="mdi-logout" @click="logout">
            Logout
            </v-btn>
        </v-col>
        </v-row>

        <!-- Stats -->
        <v-row class="mb-6">
        <v-col cols="12" md="4">
            <v-card rounded="xl" class="pa-5">
            <div class="d-flex align-center justify-space-between">
                <div>
                <div class="text-caption text-grey">Total User</div>
                <div class="text-h4 font-weight-bold">{{ totalUsers }}</div>
                </div>
                <v-icon icon="mdi-account-group" size="36" />
            </div>
            </v-card>
        </v-col>

        <v-col cols="12" md="4">
            <v-card rounded="xl" class="pa-5">
            <div class="d-flex align-center justify-space-between">
                <div>
                <div class="text-caption text-grey">Karyawan</div>
                <div class="text-h4 font-weight-bold">{{ totalKaryawan }}</div>
                </div>
                <v-icon icon="mdi-account" size="36" />
            </div>
            </v-card>
        </v-col>

        <v-col cols="12" md="4">
            <v-card rounded="xl" class="pa-5">
            <div class="d-flex align-center justify-space-between">
                <div>
                <div class="text-caption text-grey">Admin</div>
                <div class="text-h4 font-weight-bold">{{ totalAdmin }}</div>
                </div>
                <v-icon icon="mdi-shield-account" size="36" />
            </div>
            </v-card>
        </v-col>
        </v-row>

        <!-- Toolbar -->
        <v-row class="mb-4">
        <v-col cols="12" md="8">
            <v-text-field
            v-model="search"
            label="Cari nama / email"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            rounded="xl"
            hide-details
            />
        </v-col>

        <v-col cols="12" md="4">
            <v-select
            v-model="roleFilter"
            :items="roleItems"
            label="Filter Role"
            prepend-inner-icon="mdi-filter"
            variant="outlined"
            rounded="xl"
            hide-details
            />
        </v-col>
        </v-row>

        <!-- Table -->
        <v-card rounded="xl">
        <v-card-text>
            <div v-if="loading" class="py-8 text-center">
            <v-progress-circular indeterminate />
            <div class="text-body-2 text-grey mt-3">Loading data...</div>
            </div>

            <div v-else-if="errorMsg" class="text-red py-4">
            {{ errorMsg }}
            </div>

            <div v-else>
            <v-table>
                <thead>
                <tr>
                    <th style="width: 80px">Avatar</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th style="width: 140px">Role</th>
                </tr>
                </thead>

                <tbody>
                <tr v-for="p in filteredProfiles" :key="p.id">
                    <td>
                    <v-avatar size="42" color="grey-darken-3">
                        <v-img v-if="p.avatar_url" :src="p.avatar_url" cover />
                        <v-icon v-else icon="mdi-account" />
                    </v-avatar>
                    </td>

                    <td>
                    <div class="font-weight-medium">
                        {{ p.full_name || "-" }}
                    </div>
                    <div class="text-caption text-grey">
                        ID: {{ p.id.slice(0, 8) }}...
                    </div>
                    </td>

                    <td>
                    {{ p.email || "-" }}
                    </td>

                    <td>
                    <v-chip
                        size="small"
                        :color="p.role === 'admin' ? 'deep-purple' : 'blue'"
                        variant="flat"
                    >
                        {{ p.role }}
                    </v-chip>
                    </td>
                </tr>

                <tr v-if="filteredProfiles.length === 0">
                    <td colspan="4" class="text-center text-grey py-8">
                    Data tidak ditemukan.
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

import NavigationDrawer from "../components/NavigationDrawer.vue";

const router = useRouter();

const loading = ref(true);
const errorMsg = ref("");

const profiles = ref([]);
const search = ref("");
const roleFilter = ref("Semua");

const roleItems = ["Semua", "karyawan", "admin"];

// Profile admin yg sedang login (buat header)
const me = ref(null);

const loadProfiles = async () => {
  loading.value = true;
  errorMsg.value = "";

  // cek login
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    router.replace("/login");
    return;
  }

  // ambil profile sendiri buat header
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  me.value = myProfile;

  // ambil semua profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .order("full_name", { ascending: true });

  if (error) {
    errorMsg.value = error.message;
    profiles.value = [];
  } else {
    profiles.value = data || [];
  }

  loading.value = false;
};

const filteredProfiles = computed(() => {
  const q = search.value.toLowerCase().trim();

  return profiles.value.filter((p) => {
    const matchSearch =
      !q ||
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q);

    const matchRole = roleFilter.value === "Semua" || p.role === roleFilter.value;

    return matchSearch && matchRole;
  });
});

const totalUsers = computed(() => profiles.value.length);
const totalKaryawan = computed(() => profiles.value.filter((p) => p.role === "karyawan").length);
const totalAdmin = computed(() => profiles.value.filter((p) => p.role === "admin").length);

const logout = async () => {
  await supabase.auth.signOut();
  router.replace("/login");
};

onMounted(loadProfiles);
</script>
