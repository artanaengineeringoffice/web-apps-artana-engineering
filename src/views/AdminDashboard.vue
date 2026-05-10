<template>
  <NavigationDrawer />

  <v-container>
    <!--PENGUMUMAN PERUSAHAAN-->
    <v-row>
      <v-col cols="12">
        <v-card
          rounded="xl"
          elevation="2"
          class="mb-4"
        >
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">
              mdi-bullhorn
            </v-icon>

            <span class="font-weight-bold">
              Pengumuman Perusahaan
            </span>
          </v-card-title>

          <v-divider />

          <!-- kalau kosong -->
          <v-card-text
            v-if="announcements.length === 0"
            class="text-medium-emphasis"
          >
            Belum ada pengumuman.
          </v-card-text>

          <!-- list announcement -->
          <v-list v-else lines="two">
            <v-list-item
              v-for="item in announcements"
              :key="item.id"
              class="py-2"
            >
              <!-- icon -->
              <template #prepend>
                <v-avatar
                  size="40"
                  :color="
                    item.type === 'emergency'
                      ? 'red-lighten-4'
                      : item.type === 'warning'
                      ? 'orange-lighten-4'
                      : 'blue-lighten-4'
                  "
                >
                  <v-icon
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
                        ? 'mdi-alert'
                        : item.type === 'warning'
                        ? 'mdi-alert-circle'
                        : 'mdi-information'
                    }}
                  </v-icon>
                </v-avatar>
              </template>

              <!-- title -->
              <v-list-item-title class="font-weight-bold">
                {{ item.title }}
              </v-list-item-title>

              <!-- content -->
              <v-list-item-subtitle class="text-wrap">
                {{ item.content }}
              </v-list-item-subtitle>

              <!-- date -->
              <template #append>
                <div class="text-caption text-medium-emphasis">
                  {{
                    new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short"
                    })
                  }}
                </div>
              </template>
            </v-list-item>

            <v-divider />
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- FORM -->
      <v-col cols="12" md="5">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="font-weight-bold">
            Buat Pengumuman
          </v-card-title>

          <v-card-text>
            <v-text-field
              v-model="announcementForm.title"
              label="Judul"
              variant="outlined"
              rounded="xl"
              class="mb-3"
            />

            <v-textarea
              v-model="announcementForm.content"
              label="Isi Pengumuman"
              variant="outlined"
              rounded="xl"
              rows="4"
              class="mb-3"
            />

            <v-select
              v-model="announcementForm.type"
              :items="[
                { title: 'Info', value: 'info' },
                { title: 'Warning', value: 'warning' },
                { title: 'Emergency', value: 'emergency' }
              ]"
              label="Tipe"
              variant="outlined"
              rounded="xl"
              class="mb-4"
            />

            <v-btn
              block
              color="primary"
              rounded="xl"
              :loading="loadingAnnouncement"
              @click="createAnnouncement"
            >
              Publish Pengumuman
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- LIST -->
      <v-col cols="12" md="7">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="font-weight-bold">
            Daftar Pengumuman
          </v-card-title>

          <v-divider />

          <v-list lines="three">
            <v-list-item
              v-for="item in announcements"
              :key="item.id"
            >
              <template #prepend>
                <v-avatar
                  :color="
                    item.type === 'emergency'
                      ? 'red-lighten-4'
                      : item.type === 'warning'
                      ? 'orange-lighten-4'
                      : 'blue-lighten-4'
                  "
                >
                  <v-icon
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
                        ? 'mdi-alert'
                        : item.type === 'warning'
                        ? 'mdi-alert-circle'
                        : 'mdi-information'
                    }}
                  </v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">
                {{ item.title }}
              </v-list-item-title>

              <v-list-item-subtitle class="text-wrap">
                {{ item.content }}
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center ga-2">
                  <v-switch
                    hide-details
                    inset
                    color="success"
                    :model-value="item.is_active"
                    @click="toggleAnnouncement(item)"
                  />

                  <v-btn
                    icon
                    variant="text"
                    color="red"
                    @click="deleteAnnouncement(item.id)"
                  >
                    <v-icon>
                      mdi-delete
                    </v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>

            <v-divider />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuth } from "@/lib/useAuth";
import NavigationDrawer from "../components/NavigationDrawer.vue"
import { useAnnouncement } from "@/lib/useAnnouncement";

// PROFILE
const {
  profile,
  loadProfile
} = useAuth();

const {
  announcements,
  announcementForm,
  loadingAnnouncement,
  loadAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement
} = useAnnouncement(profile);

onMounted(async () => {
  await loadProfile();
  await loadAnnouncements();
});
</script>