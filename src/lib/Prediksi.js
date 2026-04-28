import { computed } from "vue";

export function useRiskPrediction(history) {
  const BATAS_JAM = "08:00:00";

  const riskPrediction = computed(() => {
    if (!history.value.length) {
        return {
        score: 0,
        label: "Tidak ada data",
        color: "grey",
        insight: "-",
        notification: null
        };
    }

    const recent = history.value.slice(0, 7);

    const binary = recent.map(h =>
        h.checkin_time && h.checkin_time > BATAS_JAM ? 1 : 0
    );

    const totalDays = binary.length;
    const lateSum = binary.reduce((a, b) => a + b, 0);

    const lateRatio = lateSum / totalDays;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < totalDays; i++) {
        numerator += i * binary[i];
        denominator += i * i;
    }

    const slope = denominator ? numerator / denominator : 0;

    let score = lateRatio * 100;

    score += slope * 40;

    const last3 = binary.slice(0, 3);
    const last3Late = last3.reduce((a, b) => a + b, 0);

    if (last3Late >= 2) score += 15;

    score = Math.round(Math.min(Math.max(score, 0), 100));

    let label = "Rendah";
    let color = "green";

    if (score >= 70) {
        label = "Tinggi";
        color = "red";
    } else if (score >= 40) {
        label = "Sedang";
        color = "orange";
    }

    let insight = "Stabil";

    if (slope > 0.2) insight = "Trend Memburuk 📈";
    else if (slope < 0.05) insight = "Trend Membaik 📉";

    // ===== 🎯 NOTIFIKASI CERDAS =====
    let notification = null;

    if (score >= 70) {
        notification = "⚠️ Besok berangkat lebih awal 10 menit";
    } else if (score >= 40 && slope > 0.15) {
        notification = "⏰ Mulai atur waktu berangkat lebih disiplin";
    } else if (score < 40 && slope < 0.05) {
        notification = "✅ Pertahankan kebiasaan tepat waktu!";
    }

    return { score, label, color, insight, notification };
    });

  return { riskPrediction };
}