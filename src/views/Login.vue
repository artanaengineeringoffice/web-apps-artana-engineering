
<template>
  <v-container class="fill-height">
    <v-row class="fill-height">
      <v-col cols="12" class="d-flex justify-center align-end">
        <div class="text-center">
          <v-img src="logo.png" class="mb-2" height="100" aspect-ratio="1" />
          <p class="text-h6 font-weight-bold">Artana Engineering</p>
          <p class="text-body-2 mb-4">Contractor & Trading</p>
          
          <v-btn
            @click="loginWithGoogle"
            :disabled="loading"
            :loading="loading"
            class="google-glow-btn"
            prepend-icon="mdi-google"
            rounded="pill"
            color="black"
          >
            Login with Google
          </v-btn>

          <p class="text-caption mt-4">
            Secure Access • Engineering System
          </p>
          <v-alert class="mt-4" rounded="xl"
            v-if="errorMsg"
            type="error"
            variant="tonal"
            density="compact"
          >
            {{ errorMsg }}
          </v-alert>
        </div>
      </v-col>

      <v-col cols="12" class="d-flex justify-center align-end">
        <p class="text-caption text-grey">© {{ year }} Ridwan Ridiawan</p>
      </v-col>
    </v-row>
  </v-container>  
</template>

<script setup>
import { supabase } from "../lib/supabase";
import { ref } from "vue";

const errorMsg = ref("");
const year = new Date().getFullYear();
const loading = ref(false);

const loginWithGoogle = async () => {
  if (loading.value) return;

  errorMsg.value = "";
  loading.value = true;  

  // kasih waktu Vue update UI dulu
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://web-apps-artana-engineering.vercel.app/auth/callback",
      },
    });

    if (error) {
      errorMsg.value = error.message;
    }
  } catch (err) {
    errorMsg.value = err.message || "Terjadi kesalahan saat login";
  } finally {
    loading.value = true;
  }
};
</script>