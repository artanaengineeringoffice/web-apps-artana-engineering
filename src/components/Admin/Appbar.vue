<template>
    <v-app-bar>
        <v-container>
            <div class="d-flex align-center ga-4">
            <v-avatar size="56" color="grey-darken-3">
                <v-img v-if="me?.avatar_url" :src="me.avatar_url" cover />
                <v-icon v-else icon="mdi-shield-account" size="30" />
            </v-avatar>

            <div>
                <div class="text-h6 font-weight-bold">Admin Dashboard</div>
            </div>
        </div>
        </v-container>
    </v-app-bar>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabase";

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