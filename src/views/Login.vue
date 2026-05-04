<template>
    <v-container class="h-100">
        <v-row class="h-100 align-center">
            <v-col cols="12" class="d-flex justify-center">
                <v-btn @click="loginWithGoogle" :disabled="loading" text="Login with Google" color="black" rounded prepend-icon="mdi-google" />
                <p v-if="errorMsg" class="err">{{ errorMsg }}</p>
            </v-col>           
        </v-row>
    </v-container>
</template>


<script setup>
import { supabase } from "../lib/supabase";
import { ref } from "vue";

const loading = ref(false);
const errorMsg = ref("");

// GOOGLE LOGIN
const loginWithGoogle = async () => {
  errorMsg.value = "";
  loading.value = true;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://web-apps-artana-engineering.vercel.app/auth/callback",
    },
  });

  if (error) {
    errorMsg.value = error.message;
    loading.value = false;
  }
};

</script>