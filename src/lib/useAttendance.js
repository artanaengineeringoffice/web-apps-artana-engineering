// useAttendance.js

import { ref } from "vue";
import { supabase } from "@/lib/supabase";
import { todayISO, nowTime } from "@/lib/useUtils";

export function useAttendance(profile) {
  const attendanceToday = ref(null);
  const history = ref([]);
  const loading = ref(false);
  const yyy = ref(null);

  // ========================================================
  // LOAD TODAY
  // ========================================================

  const xxx = async () => {
    if (!profile.value?.id) return;

    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    yyy.value = data;
  };

  const loadToday = async () => {
    if (!profile.value?.id) return;

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", profile.value.id)
      .eq("checkin_date", todayISO())
      .maybeSingle();

    attendanceToday.value = data;
  };

  // ========================================================
  // CHECKIN
  // ========================================================

  const checkin = async () => {
    await supabase
      .from("attendance")
      .insert([
        {
          user_id: profile.value.id,
          checkin_date: todayISO(),
          checkin_time: nowTime()
        }
      ]);
  };

  // ========================================================
  // CHECKOUT
  // ========================================================

  const checkout = async (id) => {
    await supabase
      .from("attendance")
      .update({
        checkout_time: nowTime()
      })
      .eq("id", id);
  };

  // ========================================================
  // HISTORY
  // ========================================================

  const loadHistory = async (
    startDate = null,
    endDate = null
  ) => {
    if (!profile.value?.id) return;

    loading.value = true;

    let query = supabase
      .from("attendance")
      .select("*")
      .eq("user_id", profile.value.id)
      .order("checkin_date", {
        ascending: false
      });

    if (startDate && endDate) {
      query = query
        .gte("checkin_date", startDate)
        .lte("checkin_date", endDate);
    }

    const { data } = await query;

    history.value = data || [];
    loading.value = false;
  };

  return {
    attendanceToday,
    history,
    loading,

    loadToday,
    loadHistory,
    checkin,
    checkout,
    xxx
  };
}