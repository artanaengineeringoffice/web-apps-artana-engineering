<template>
  <v-layout class="h-screen">
    <!-- TOP APP BAR -->
    <v-app-bar
      density="compact"
      flat
      style="border-bottom: 1px solid #E5E7EB;"
    >
    <template v-slot:prepend>
      <v-btn @click="router.back()" icon="mdi-keyboard-backspace" />
    </template>
      <v-app-bar-title class="text-center">
        <p class="text-h6">Tanya Admin</p>
      </v-app-bar-title>
      <template v-slot:append>
        <v-btn icon="" />
      </template>
    </v-app-bar>

    <!-- INPUT BAR -->
    <v-app-bar
      location="bottom"
      flat
      height="80"
      style="border-top: 1px solid #E5E7EB;"
    >
      <v-container>
        <v-row>
          <v-col cols="12">
            <div class="d-flex">
              <v-text-field
                v-model="message"
                variant="solo-filled"
                flat
                hide-details
                rounded="xl"
                bg-color="grey-lighten-4"
                placeholder="Tulis pesan..."
                @keyup.enter="sendMessage"
              >
                <template #prepend-inner>
                  <v-icon color="grey-darken-1">
                    mdi-message-outline
                  </v-icon>
                </template>
              </v-text-field>

              <v-btn
                class="ml-4"
                variant="flat"
                icon="mdi-send"
                color="primary"
                :loading="loading"
                @click="sendMessage"
              />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-app-bar>

    <!-- MAIN CONTENT -->
    <v-main class="bgApp">

      <!-- LOADING -->
      <div
        v-if="loadingCard"
        class="loading-wrapper"
      >
        <LoadingCard
          title="Loading"
          subtitle="Mohon tunggu sebentar"
        />
      </div>

      <!-- CHAT CONTENT -->
      <v-container
        v-else
        fluid
        class="pa-0 h-100"
      >

        <!-- EMPTY STATE -->
        <v-row
          v-if="messages.length === 0"
          class="h-100 ma-0"
        >
          <v-col
            cols="12"
            class="d-flex flex-column justify-center align-center"
          >
            <div class="text-center">
              <v-icon
                size="80"
                color="primary"
              >
                mdi-robot-outline
              </v-icon>

              <h2 class="mt-4 text-h5 font-weight-bold">
                Selamat Datang 👋
              </h2>

              <p class="text-medium-emphasis mt-2">
                Tanyakan sesuatu kepada Admin
              </p>
            </div>
          </v-col>
        </v-row>

        <!-- CHAT LIST -->
        <v-row
          v-else
          class="h-100 ma-0"
        >
          <v-col cols="12" class="pa-0">
            <div
              ref="chatContainer"
              class="chat-body pa-4"
            >

              <div
                v-for="(item, index) in messages"
                :key="index"
                class="mb-4"
              >

                <!-- USER -->
                <v-sheet
                  v-if="item.role === 'user'"
                  color="transparent"
                  class="d-flex justify-end"
                >
                  <div>
                    <div class="d-flex justify-end align-center mb-2">
                      <p class="ml-2 my-auto text-caption font-weight-bold">
                        User
                      </p>
                    </div>

                    <v-sheet
                      color="blue-lighten-4"
                      class="px-4 py-2"
                      rounded="xl"
                    >
                      <p class="text-body-2">
                        {{ item.text }}
                      </p>
                    </v-sheet>
                  </div>
                </v-sheet>

                <!-- AI -->
                <div v-else>
                  <div class="d-flex align-center mb-2">
                    <v-icon class="my-auto" size="small">
                      mdi-robot-outline
                    </v-icon>

                    <p class="ml-2 my-auto text-caption font-weight-bold">
                      AI Assistant
                    </p>
                  </div>

                  <v-sheet
                    class="px-4 py-4"
                    rounded="xl"
                  >
                    {{ item.text }}
                  </v-sheet>
                </div>
              </div>

              <!-- TYPING -->
              <div
                v-if="loading"
                class="d-flex justify-start"
              >
                <v-sheet
                  class="px-4 py-3"
                  rounded="xl"
                >
                  <div class="d-flex align-center">
                    <v-progress-circular
                      indeterminate
                      size="18"
                      width="2"
                      color="primary"
                    />

                    <span class="ml-3">
                      Admin sedang mengetik...
                    </span>
                  </div>
                </v-sheet>
              </div>

            </div>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import {
  ref,
  nextTick,
  onMounted,
} from "vue";

import { useRouter } from "vue-router";

import { supabase } from "../lib/supabase";

import LoadingCard from "@/components/LoadingCard.vue";

// ======================
// ROUTER
// ======================
const router = useRouter();

// ======================
// STATE
// ======================
const loadingCard = ref(true);

const message = ref("");

const messages = ref([]);

const loading = ref(false);

const chatContainer = ref(null);

const user = ref(null);

// ======================
// SCROLL BOTTOM
// ======================
const scrollToBottom = async () => {

  await nextTick();

  if (chatContainer.value) {

    chatContainer.value.scrollTop =
      chatContainer.value.scrollHeight;

  }

};

// ======================
// SEND MESSAGE
// ======================
const sendMessage = async () => {

  if (!message.value.trim()) return;

  if (loading.value) return;

  const userMessage =
    message.value.trim();

  // tambah chat user
  messages.value.push({
    role: "user",
    text: userMessage,
  });

  // reset input
  message.value = "";

  await scrollToBottom();

  loading.value = true;

  try {

    // invoke edge function
    const { data, error } =
      await supabase.functions.invoke(
        "quick-processor",
        {
          body: {
            message: userMessage,
            user_id: user.value?.id,
          },
        }
      );

    if (error) {
      throw error;
    }

    // push ai response
    messages.value.push({
      role: "ai",
      text:
        data?.answer ||
        "Maaf, AI tidak memberikan jawaban.",
    });

  } catch (err) {

    console.error(err);

    messages.value.push({
      role: "ai",
      text:
        "Maaf, terjadi kesalahan server.",
    });

  } finally {

    loading.value = false;

    await scrollToBottom();

  }

};

// ======================
// INIT
// ======================
onMounted(async () => {

  loadingCard.value = true;

  try {

    // ambil user login
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    user.value = authUser;

  } catch (err) {

    console.error(err);

  } finally {

    loadingCard.value = false;

    await scrollToBottom();

  }

});
</script>

<style scoped>
.chat-body {
  height: calc(100vh - 145px);
  overflow-y: auto;
  padding-bottom: 100px;
}

.loading-wrapper {
  height: calc(100vh - 145px);

  display: flex;
  align-items: center;
  justify-content: center;
}
</style>