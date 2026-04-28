<template>
  <div style="padding: 40px; text-align: center">
    <h2>Logging you in...</h2>
    <p>Tunggu sebentar...</p>
  </div>
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

