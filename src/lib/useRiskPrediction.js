import { computed } from "vue";

export function useRiskPrediction(history) {
  return computed(() => {
    const total = history.value.length;
    const late = history.value.filter(h => h.checkin_time > "08:00:00").length;

    const score = total ? Math.round((late / total) * 100) : 0;

    if (score > 50) return { score, color: "error", label: "Tinggi" };
    if (score > 20) return { score, color: "warning", label: "Sedang" };

    return { score, color: "success", label: "Rendah" };
  });
}