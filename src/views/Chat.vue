<script setup>
import { ref, nextTick } from "vue";
import { supabase } from "../lib/supabase";

const message = ref("");
const messages = ref([]);
const loading = ref(false);
const chatContainer = ref(null);

const scrollToBottom = async () => {
  await nextTick();

  if (chatContainer.value) {
    chatContainer.value.scrollTop =
      chatContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {

  if (!message.value.trim()) return;

  const userMessage = message.value;

  messages.value.push({
    role: "user",
    text: userMessage,
  });

  message.value = "";

  await scrollToBottom();

  loading.value = true;

  try {

    const { data, error } = await supabase.functions.invoke(
      "quick-processor",
      {
        body: {
          message: userMessage,
        },
      }
    );

    if (error) {
      throw error;
    }

    messages.value.push({
      role: "ai",
      text:
        data?.answer ||
        "Maaf, AI tidak memberikan jawaban.",
    });

  } catch (err) {

    console.log(err);

    messages.value.push({
      role: "ai",
      text: "Maaf, terjadi kesalahan.",
    });

  } finally {

    loading.value = false;

    await scrollToBottom();

  }

};
</script>

<template>

  <v-container
    fluid
    class="chat-wrapper pa-0"
  >

    <v-row
      justify="center"
      class="ma-0 fill-height"
    >

      <v-col
        cols="12"
        md="8"
        lg="6"
        class="d-flex align-center justify-center"
      >

        <v-card
          class="chat-card"
          rounded="xl"
          elevation="0"
        >

          <!-- HEADER -->
          <div class="chat-header">

            <div class="d-flex align-center">

              <v-avatar
                size="42"
                color="white"
              >
                <v-icon color="primary">
                  mdi-robot-happy-outline
                </v-icon>
              </v-avatar>

              <div class="ml-3">
                <h2 class="text-h6 font-weight-bold text-white">
                  AI Assistant
                </h2>

                <p class="text-caption text-white opacity-80">
                  Online
                </p>
              </div>

            </div>

          </div>

          <!-- CHAT BODY -->
          <div
            ref="chatContainer"
            class="chat-body"
          >

            <div
              v-if="messages.length === 0"
              class="empty-state"
            >

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
                Tanyakan sesuatu kepada AI Assistant
              </p>

            </div>

            <div
              v-for="(item, index) in messages"
              :key="index"
              class="mb-4"
            >

              <!-- USER -->
              <div
                v-if="item.role === 'user'"
                class="d-flex justify-end"
              >

                <div class="user-message">

                  {{ item.text }}

                </div>

              </div>

              <!-- AI -->
              <div
                v-else
                class="d-flex justify-start"
              >

                <div class="ai-message">

                  <div class="d-flex align-center mb-2">

                    <v-avatar
                      size="28"
                      color="primary"
                    >
                      <v-icon
                        size="16"
                        color="white"
                      >
                        mdi-robot-outline
                      </v-icon>
                    </v-avatar>

                    <span class="ml-2 text-caption font-weight-bold">
                      AI Assistant
                    </span>

                  </div>

                  <div class="message-text">
                    {{ item.text }}
                  </div>

                </div>

              </div>

            </div>

            <!-- LOADING -->
            <div
              v-if="loading"
              class="d-flex justify-start"
            >

              <div class="ai-message">

                <div class="d-flex align-center">

                  <v-progress-circular
                    indeterminate
                    size="18"
                    width="2"
                    color="primary"
                  />

                  <span class="ml-3">
                    AI sedang mengetik...
                  </span>

                </div>

              </div>

            </div>

          </div>

          <!-- INPUT -->
          <div class="chat-input">

            <v-text-field
              v-model="message"
              variant="solo"
              flat
              hide-details
              rounded="xl"
              bg-color="#F3F4F6"
              placeholder="Tulis pesan..."
              @keyup.enter="sendMessage"
            >

              <template #prepend-inner>
                <v-icon color="grey">
                  mdi-message-outline
                </v-icon>
              </template>

            </v-text-field>

            <v-btn
              icon
              size="50"
              color="primary"
              elevation="0"
              @click="sendMessage"
              :loading="loading"
            >
              <v-icon>
                mdi-send
              </v-icon>
            </v-btn>

          </div>

        </v-card>

      </v-col>

    </v-row>

  </v-container>

</template>

<style scoped>

.chat-wrapper {
  min-height: 100vh;
  background:
    linear-gradient(
      135deg,
      #EEF2FF 0%,
      #FFFFFF 50%,
      #F5F3FF 100%
    );
}

.chat-card {
  width: 100%;
  height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #E5E7EB;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
}

.chat-header {
  padding: 20px;
  background:
    linear-gradient(
      135deg,
      #6366F1,
      #8B5CF6
    );
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
}

.user-message {
  max-width: 75%;
  padding: 14px 18px;
  border-radius: 20px 20px 4px 20px;
  background:
    linear-gradient(
      135deg,
      #6366F1,
      #8B5CF6
    );
  color: white;
  font-size: 14px;
  line-height: 1.6;
  box-shadow:
    0 4px 12px rgba(99,102,241,0.2);
}

.ai-message {
  max-width: 80%;
  padding: 16px;
  border-radius: 20px 20px 20px 4px;
  background: white;
  border: 1px solid #E5E7EB;
  box-shadow:
    0 4px 12px rgba(0,0,0,0.04);
}

.message-text {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 14px;
  color: #111827;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chat-body::-webkit-scrollbar {
  width: 6px;
}

.chat-body::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 20px;
}

</style>