<template>
  <v-container class="fill-height">
    <v-row justify="center" class="fill-height">
      <v-col cols="10" class="d-flex justify-center align-center">
        <v-sheet id="cardBoard" rounded="xl" class="text-center pa-4">
          <v-icon icon="mdi-shield-check-outline" size="42" color="primary" class="mb-4" />
          <h2 class="text-h6 font-weight-bold">Mengautentikasi...</h2>
          <p class="text-body-2 mt-4">Kami sedang memproses login Anda. Mohon tunggu sebentar.</p>
          <v-progress-circular
            indeterminate
            size="30"
            width="2"
            color="primary"
            class="mt-6"
          />
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();

onMounted(async () => {
  // 1) cek session
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session) {
    router.replace("/login");
    return;
  }

  const user = session.user;

  // 2) ambil avatar google
  const avatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";

  // 3) ambil profile lama (buat role biar aman)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // 4) upsert profile
const { error: upsertError } = await supabase.from("profiles").upsert({
  id: user.id,
  email: user.email,
  full_name: fullName,
  avatar_url: avatar,
  role: existingProfile?.role || "karyawan",
});

if (upsertError) {
  console.log("UPSERT ERROR:", upsertError.message);
  router.replace("/login");
  return;
}


  // 5) redirect sesuai role final
  const finalRole = existingProfile?.role || "karyawan";

  if (finalRole === "admin") router.replace("/admin");
  else router.replace("/karyawan");
});
</script>

<style scoped>
.callback-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.callback-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}
</style>