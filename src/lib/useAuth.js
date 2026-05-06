// composables/useAuth.js
import { ref } from "vue";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const profile = ref(null);

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    profile.value = data;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { profile, loadProfile, logout };
}