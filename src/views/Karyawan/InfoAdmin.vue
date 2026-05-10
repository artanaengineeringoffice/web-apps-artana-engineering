<template>
  <v-app-bar
    density="compact"
    flat
    style="border-bottom: 1px solid #E5E7EB;"
  >
    <template #prepend>
      <v-btn
        to="/karyawan"
        icon="mdi-keyboard-backspace"
      />
    </template>

    <v-app-bar-title class="text-center">
      <p class="text-h6">
        Info Admin
      </p>
    </v-app-bar-title>

    <template #append>
      <v-btn icon="" />
    </template>
  </v-app-bar>

  <!-- LOADING -->
  <v-container
    v-if="loadingCard"
    class="fill-height d-flex align-center justify-center"
  >
    <LoadingCard
      title="Loading"
      subtitle="Mohon tunggu sebentar"
    />
  </v-container>

  <!-- CONTENT -->
  <v-container v-else>

    <!-- kalau ada announcement -->
    <v-list
      v-if="announcements.length > 0"
      id="cardBoard"
      lines="two"
      class="rounded-xl"
    >
      <template
        v-for="(item, index) in announcements"
        :key="item.id"
      >

        <v-list-item class="py-2">

          <!-- icon -->
          <template #prepend>
            <v-avatar
              size="30"
              :color="
                item.type === 'emergency'
                  ? 'red-lighten-4'
                  : item.type === 'warning'
                  ? 'orange-lighten-4'
                  : 'blue-lighten-4'
              "
            >
              <v-icon
                size="28"
                :color="
                  item.type === 'emergency'
                    ? 'red'
                    : item.type === 'warning'
                    ? 'orange'
                    : 'blue'
                "
              >
                {{
                  item.type === 'emergency'
                    ? 'mdi-alert-circle'
                    : item.type === 'warning'
                    ? 'mdi-alert-circle'
                    : 'mdi-information'
                }}
              </v-icon>
            </v-avatar>
          </template>

          <!-- title -->
          <p class="text-subtitle-1">
            {{ item.title }}
          </p>

          <!-- content -->
          <p class="text-body-2 opacity-70">
            {{ item.content }}
          </p>

          <!-- date -->
          <template #append>
            <div class="text-caption text-medium-emphasis">
              {{
                new Date(item.created_at).toLocaleDateString(
                  "id-ID",
                  {
                    day: "2-digit",
                    month: "short"
                  }
                )
              }}
            </div>
          </template>

        </v-list-item>

        <!-- divider -->
        <v-divider
          v-if="index !== announcements.length - 1"
          inset
        />

      </template>
    </v-list>

    <!-- EMPTY -->
    <v-sheet
      v-else
      id="cardBoard"
      class="rounded-xl pa-10 text-center"
    >
      <v-icon
        icon="mdi-bell-off-outline"
        size="60"
        color="grey"
        class="mb-3"
      />

      <p class="text-h6 font-weight-bold">
        Belum Ada Info
      </p>

      <p class="text-body-2 text-medium-emphasis">
        Pengumuman dari admin akan muncul di sini.
      </p>
    </v-sheet>

  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";

import { useAuth } from "@/lib/useAuth";
import { useAnnouncement } from "@/lib/useAnnouncement";

import LoadingCard from "@/components/LoadingCard.vue";

const loadingCard = ref(true);

const { profile } = useAuth();

const {
  announcements,
  loadAnnouncements
} = useAnnouncement(profile);

onMounted(async () => {
  loadingCard.value = true;

  try {
    await loadAnnouncements();
  } catch (err) {
    console.error(err);
  } finally {
    loadingCard.value = false;
  }
});
</script>