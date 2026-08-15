import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useEffect, useMemo, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { NumberInputModal } from "@/components/number-input-modal";
import { useRouter } from "expo-router";

const CIRC = 2 * Math.PI * 65;
function parseMinutes(value: string, fallback: number) { const [h, m] = value.split(":").map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : fallback; }
function round50(value: number) { return Math.max(100, Math.min(600, Math.round(value / 50) * 50)); }

export default function TodayScreen() {
  const colors = useColors(); const app = useApp(); const router = useRouter();
  const [showGoalBanner, setShowGoalBanner] = useState(false); const [inputMode, setInputMode] = useState<"goal" | "water" | null>(null); const [clockTick, setClockTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setClockTick(v => v + 1), 60000); return () => clearInterval(t); }, []);

  const pctRaw = app.meta > 0 ? app.consumido / app.meta : 0; const pct = Math.min(pctRaw, 1); const falta = Math.max(app.meta - app.consumido, 0); const strokeDashoffset = CIRC * (1 - pct);
  const smart = useMemo(() => {
    void clockTick;
    if (!app.meta) return { status: "none", icon: "💧", title: "Configure sua meta", text: "Adicione seu peso e rotina para começar.", dose: 0 };
    if (app.consumido >= app.meta) return { status: "done", icon: "🏆", title: "Meta concluída", text: `Você passou ${Math.max(0, app.consumido - app.meta)} ml da meta de hoje.`, dose: 0 };
    const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes(); const start = parseMinutes(app.notifInicio, 420); const end = parseMinutes(app.notifFim, 1320);
    if (nowMin < start) return { status: "early", icon: "🌤️", title: "Dia começando", text: `Sua janela de hidratação começa às ${app.notifInicio}.`, dose: round50(falta / Math.max(1, Math.ceil((end-start)/app.notifInterval))) };
    const remainingMinutes = Math.max(1, end - nowMin); const slots = Math.max(1, Math.ceil(remainingMinutes / Math.max(30, app.notifInterval))); const dose = round50(falta / slots);
    if (nowMin >= end) return { status: "late", icon: "🌙", title: "Janela encerrada", text: `Ainda faltam ${falta} ml. Evite compensar tudo de uma vez.`, dose: round50(Math.min(falta, 300)) };
    const expected = app.meta * Math.min(1, Math.max(0, (nowMin - start) / Math.max(1, end - start))); const diff = app.consumido - expected;
    if (diff >= 0) return { status: "ok", icon: "✅", title: "Você está no ritmo", text: `${Math.round(diff)} ml à frente. Próxima dose sugerida: ${dose} ml.`, dose };
    if (Math.abs(diff) <= app.meta * .12) return { status: "warn", icon: "⚡", title: "Quase no ritmo", text: `Cerca de ${Math.round(-diff)} ml atrás. Uma dose de ${dose} ml ajuda a recuperar.`, dose };
    return { status: "late", icon: "💦", title: "Hora de recuperar", text: `${Math.round(-diff)} ml atrás do ritmo. Distribua o restante em doses de ~${dose} ml.`, dose };
  }, [app.meta, app.consumido, app.notifInicio, app.notifFim, app.notifInterval, clockTick]);

  const last7 = useMemo(() => {
    let total = 0, count = 0; for (let i=1;i<=7;i++) { const d = new Date(); d.setDate(d.getDate()-i); const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; const rec=app.diasSalvos[iso]; if(rec){ total += rec.consumido; count++; } }
    return count ? Math.round(total/count) : 0;
  }, [app.diasSalvos]);

  const handleAddAgua = (ml: number) => { void app.addAgua(ml); if (app.meta > 0 && app.consumido < app.meta && app.consumido + ml >= app.meta) { setShowGoalBanner(true); setTimeout(() => setShowGoalBanner(false), 3200); } };
  const handleResetDay = () => Alert.alert("Reiniciar dia", "Apagar os registros de hoje?", [{ text: "Cancelar", style: "cancel" }, { text: "Reiniciar", style: "destructive", onPress: () => void app.resetDay() }]);

  if (app.isLoading) return <ScreenContainer className="items-center justify-center"><Text className="text-foreground">Carregando seus dados…</Text></ScreenContainer>;
  if (!app.nome || app.peso <= 0) return <ScreenContainer className="items-center justify-center p-6"><View className="items-center max-w-sm"><Text className="text-5xl">💧</Text><Text className="text-2xl font-black text-foreground text-center mt-4">Seu dia começa aqui</Text><Text className="text-sm text-muted text-center mt-2 mb-5">Configure nome, peso e atividade para o HidroApp calcular sua meta.</Text><Pressable onPress={() => router.push("/(tabs)/config")} className="bg-primary px-6 py-4 rounded-2xl"><Text className="text-white font-bold">Configurar agora</Text></Pressable></View></ScreenContainer>;

  return <ScreenContainer className="px-4">
    <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between pt-2 pb-4"><View><Text className="text-xs text-muted uppercase font-bold">Hoje</Text><Text className="text-2xl font-black text-foreground">Olá, {app.nome.split(" ")[0]} 👋</Text></View><View className="bg-surface border border-border rounded-2xl px-3 py-2"><Text className="text-xs text-muted">Sequência</Text><Text className="font-black text-foreground">🔥 {app.streak} dias</Text></View></View>

      <View className="bg-surface border border-border rounded-3xl p-5 mb-4">
        <View className="flex-row items-center justify-between mb-3"><View><Text className="text-xs text-muted font-bold uppercase">Meta de hoje</Text><Text className="text-xl font-black text-foreground">{(app.meta/1000).toFixed(2)} L</Text></View><Pressable onPress={() => setInputMode("goal")} className="border border-border rounded-xl px-3 py-2"><Text className="text-xs font-bold text-primary">Ajustar</Text></Pressable></View>
        <View className="items-center py-2"><View className="w-44 h-44 items-center justify-center"><Svg width={176} height={176} viewBox="0 0 148 148" style={{ transform:[{rotate:"-90deg"}] }}><Circle cx={74} cy={74} r={65} fill="none" stroke={colors.border} strokeWidth={12}/><Circle cx={74} cy={74} r={65} fill="none" stroke={colors.primary} strokeWidth={12} strokeDasharray={CIRC} strokeDashoffset={strokeDashoffset} strokeLinecap="round"/></Svg><View className="absolute items-center"><Text className="text-4xl font-black text-foreground">{Math.round(pctRaw*100)}%</Text><Text className="text-xs text-muted">{app.consumido} / {app.meta} ml</Text></View></View></View>
        <View className="flex-row gap-2 mt-2"><View className="flex-1 bg-background rounded-2xl p-3 border border-border"><Text className="text-xs text-muted">Falta</Text><Text className="text-lg font-black text-foreground">{falta ? `${falta} ml` : "Concluída ✓"}</Text></View><View className="flex-1 bg-background rounded-2xl p-3 border border-border"><Text className="text-xs text-muted">Média 7 dias</Text><Text className="text-lg font-black text-foreground">{last7 ? `${last7} ml` : "—"}</Text></View></View>
      </View>

      {showGoalBanner && <View className="bg-surface border border-success rounded-2xl p-4 mb-4 flex-row items-center gap-3"><Text className="text-2xl">🎉</Text><View><Text className="font-black text-foreground">Meta atingida!</Text><Text className="text-xs text-muted">Excelente consistência hoje.</Text></View></View>}

      <View className="bg-surface border border-border rounded-2xl p-4 mb-4 flex-row gap-3"><Text className="text-2xl">{smart.icon}</Text><View className="flex-1"><Text className="font-black text-foreground">{smart.title}</Text><Text className="text-sm text-muted mt-1 leading-5">{smart.text}</Text>{smart.dose > 0 && falta > 0 && <Pressable onPress={() => handleAddAgua(Math.min(smart.dose, falta))} className="self-start bg-primary rounded-xl px-4 py-2 mt-3"><Text className="text-white text-xs font-bold">+ {Math.min(smart.dose, falta)} ml agora</Text></Pressable>}</View></View>

      <Text className="text-xs font-bold text-muted uppercase mb-2">Adicionar água</Text>
      <View className="flex-row flex-wrap gap-2 mb-5">{app.copos.map((copo, idx) => <Pressable key={`${copo[0]}-${idx}`} onPress={() => copo[0]===0 ? setInputMode("water") : handleAddAgua(copo[0])} className="bg-surface border border-border rounded-2xl p-3 items-center" style={{ width:"31%", minWidth:92 }}><Text className="text-2xl">{copo[1]}</Text><Text className="font-black text-foreground mt-1">{copo[0]===0 ? "Outro" : `${copo[0]} ml`}</Text><Text className="text-[10px] text-muted">{copo[2]}</Text></Pressable>)}</View>

      <View className="flex-row items-center justify-between mb-2"><Text className="text-xs font-bold text-muted uppercase">Registros de hoje</Text>{app.chipsHoje.length>0 && <Text className="text-xs text-muted">toque no × para desfazer</Text>}</View>
      <View className="flex-row flex-wrap gap-2 min-h-10 mb-5">{app.chipsHoje.length===0 ? <Text className="text-sm text-muted">Nenhum copo registrado ainda.</Text> : app.chipsHoje.slice().reverse().map(chip => <View key={chip.id} className="bg-surface border border-border rounded-full px-3 py-2 flex-row items-center gap-2"><Text className="text-xs font-bold text-foreground">+{chip.ml} ml</Text><Pressable hitSlop={8} onPress={() => void app.removeChip(chip.id)}><Text className="text-muted font-black">×</Text></Pressable></View>)}</View>

      <View className="flex-row gap-3"><Pressable onPress={() => router.push("/(tabs)/config")} className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center"><Text className="text-xl">🔔</Text><Text className="text-xs font-bold text-foreground mt-1">Lembretes</Text></Pressable><Pressable onPress={handleResetDay} className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center"><Text className="text-xl">↩️</Text><Text className="text-xs font-bold text-foreground mt-1">Zerar hoje</Text></Pressable></View>
    </ScrollView>
    <NumberInputModal visible={inputMode!==null} title={inputMode==="goal"?"Meta de hoje":"Adicionar água"} subtitle={inputMode==="goal"?`Meta base: ${app.metaBase} ml. A alteração vale só hoje.`:"Digite a quantidade consumida."} initialValue={inputMode==="goal"?String(app.meta):""} min={inputMode==="goal"?100:1} max={inputMode==="goal"?10000:5000} confirmLabel={inputMode==="goal"?"Salvar meta":"Adicionar"} onClose={() => setInputMode(null)} onConfirm={value => inputMode==="goal" ? void app.setMetaTemp(value) : handleAddAgua(value)} />
  </ScreenContainer>;
}
