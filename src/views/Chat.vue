<template>
  <v-app>
    <!-- HEADER -->
    <v-app-bar
      flat
      height="70"
      class="border-b"
      color="white"
    >
      <template #prepend>
        <v-avatar
          color="primary"
          size="42"
        >
          <v-icon>mdi-robot-happy-outline</v-icon>
        </v-avatar>
      </template>

      <v-app-bar-title>
        <div class="d-flex flex-column">
          <span class="text-subtitle-1 font-weight-bold">
            Bolo AI Assistant
          </span>

          <span class="text-caption text-grey">
            Artana Engineering
          </span>
        </div>
      </v-app-bar-title>
    </v-app-bar>

    <!-- CONTENT -->
    <v-main class="bg-grey-lighten-4">
      <v-container
        fluid
        class="pa-4"
      >
        <v-row justify="center">
          <v-col
            cols="12"
            md="8"
            lg="7"
          >
            <v-card
              rounded="xl"
              elevation="2"
              class="chat-card"
            >
              <!-- CHAT AREA -->
              <div
                ref="chatContainer"
                class="chat-container pa-4"
              >
                <div
                  v-for="(msg, i) in messages"
                  :key="i"
                  class="mb-4"
                >
                  <!-- USER -->
                  <div
                    v-if="msg.role === 'user'"
                    class="d-flex justify-end"
                  >
                    <div class="user-bubble">
                      {{ msg.text }}
                    </div>
                  </div>

                  <!-- ASSISTANT -->
                  <div
                    v-else
                    class="d-flex justify-start"
                  >
                    <div class="assistant-wrapper">
                      <v-avatar
                        size="34"
                        color="primary"
                        class="mr-2"
                      >
                        <v-icon size="18">
                          mdi-robot-outline
                        </v-icon>
                      </v-avatar>

                      <div class="assistant-bubble">
                        {{ msg.text }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- LOADING -->
                <div
                  v-if="loading"
                  class="d-flex align-center"
                >
                  <v-progress-circular
                    indeterminate
                    size="20"
                    width="2"
                    color="primary"
                    class="mr-2"
                  />

                  <span class="text-caption text-grey">
                    Bolo sedang mengetik...
                  </span>
                </div>
              </div>

              <!-- INPUT -->
              <v-divider />

              <div class="pa-3">
                <div class="d-flex ga-2">
                  <v-text-field
                    v-model="prompt"
                    placeholder="Tanyakan tentang absensi, SOP, perusahaan..."
                    variant="outlined"
                    hide-details
                    density="comfortable"
                    rounded="xl"
                    bg-color="white"
                    @keyup.enter="sendMessage"
                  />

                  <v-btn
                    color="primary"
                    rounded="xl"
                    size="large"
                    :loading="loading"
                    @click="sendMessage"
                  >
                    <v-icon>mdi-send</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { supabase } from "@/lib/supabase";

const prompt = ref("");
const loading = ref(false);
const chatContainer = ref(null);

const messages = ref([
  {
    role: "assistant",
    text: "Halo 👋 Ada yang bisa saya bantu terkait absensi atau perusahaan?"
  }
]);

// AUTO SCROLL
const scrollToBottom = async () => {

  await nextTick();

  if (chatContainer.value) {
    chatContainer.value.scrollTop =
      chatContainer.value.scrollHeight;
  }

};

// SEND MESSAGE
const sendMessage = async () => {

  if (!prompt.value.trim()) return;

  const userMessage = prompt.value;

  // PUSH USER MESSAGE
  messages.value.push({
    role: "user",
    text: userMessage
  });

  // RESET INPUT
  prompt.value = "";

  // SCROLL
  scrollToBottom();

  loading.value = true;

  try {

    // AMBIL KNOWLEDGE BASE
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*");

    if (error) throw error;

    // CARI DATA RELEVAN
    const found = data.find(item => {

      const title =
        item.title?.toLowerCase() || "";

      const content =
        item.content?.toLowerCase() || "";

      const question =
        userMessage.toLowerCase();

      return (
        question.includes(title) ||
        content.includes(question)
      );

    });

    // RESPONSE BOT
    messages.value.push({
      role: "assistant",
      text: found
        ? found.content
        : "Maaf, saya belum menemukan jawaban yang sesuai."
    });

  } catch (err) {

    console.error(err);

    messages.value.push({
      role: "assistant",
      text: "Terjadi kesalahan saat mengambil data."
    });

  }

  loading.value = false;

  scrollToBottom();

};
</script>

<style scoped>
.chat-card {
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  background: #f9fafb;
}

.user-bubble {
  background: linear-gradient(
    135deg,
    #1976d2,
    #42a5f5
  );

  color: white;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  max-width: 75%;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.assistant-wrapper {
  display: flex;
  align-items: flex-start;
  max-width: 80%;
}

.assistant-bubble {
  background: white;
  color: #111827;
  padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  font-size: 14px;
  line-height: 1.7;
  border: 1px solid #E5E7EB;
  box-shadow: 0 4px 10px rgba(0,0,0,0.04);
}

.border-b {
  border-bottom: 1px solid #E5E7EB;
}
</style>