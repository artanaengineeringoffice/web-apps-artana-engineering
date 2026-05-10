// useAnnouncement.js

import { ref } from "vue";
import { supabase } from "@/lib/supabase";

export function useAnnouncement(profile) {
  const announcements = ref([]);
  const loadingAnnouncement = ref(false);

  const announcementForm = ref({
    title: "",
    content: "",
    type: "info"
  });

  // ========================================================
  // LOAD
  // ========================================================

  const loadAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });

    if (!error) {
      announcements.value = data || [];
    }
  };

  // ========================================================
  // CREATE
  // ========================================================

  const createAnnouncement = async () => {
    if (
      !announcementForm.value.title ||
      !announcementForm.value.content
    ) return;

    loadingAnnouncement.value = true;

    const { error } = await supabase
      .from("announcements")
      .insert([
        {
          title: announcementForm.value.title,
          content: announcementForm.value.content,
          type: announcementForm.value.type,
          created_by: profile.value.id,
          is_active: true
        }
      ]);

    loadingAnnouncement.value = false;

    if (!error) {
      announcementForm.value = {
        title: "",
        content: "",
        type: "info"
      };

      await loadAnnouncements();
    }
  };

  // ========================================================
  // DELETE
  // ========================================================

  const deleteAnnouncement = async (id) => {
    await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    await loadAnnouncements();
  };

  // ========================================================
  // TOGGLE ACTIVE
  // ========================================================

  const toggleAnnouncement = async (item) => {
    await supabase
      .from("announcements")
      .update({
        is_active: !item.is_active
      })
      .eq("id", item.id);

    await loadAnnouncements();
  };

  return {
    announcements,
    announcementForm,
    loadingAnnouncement,

    loadAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement
  };
}