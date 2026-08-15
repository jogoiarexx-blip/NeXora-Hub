import { ScrollView, Text, View, Pressable, Share, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const SDOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function HistoryScreen() {
  const app = useApp();
  const [calMes, setCalMes] = useState(new Date().getMonth());
  const [calAno, setCalAno] = useState(new Date().getFullYear());

  const hojeISO = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const isoOffset = (dias: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const fmtBR = (iso: string): string => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  // Calculate summary
  const entries = Object.entries(app.diasSalvos)
    .filter(([iso]) => iso !== hojeISO())
    .sort((a, b) => b[0].localeCompare(a[0]));
  const total = entries.length;
  const batidos = entries.filter(([, v]) => v.consumido >= v.meta).length;
  const taxa = total > 0 ? Math.round((batidos / total) * 100) : 0;

  // Get last 7 days data
  const ultimos7Dias = [];
  for (let i = -6; i <= 0; i++) {
    const iso = isoOffset(i);
    const d = app.diasSalvos[iso];
    const isHoje = iso === hojeISO();
    const consumidoD = isHoje ? app.consumido : d ? d.consumido : 0;
    const metaD = isHoje ? app.meta : d ? d.meta : app.metaBase || 0;
    ultimos7Dias.push({ iso, consumidoD, metaD, isHoje, temDados: isHoje || !!d });
  }

  const maxVal = Math.max(...ultimos7Dias.map((d) => Math.max(d.consumidoD, d.metaD)), 1);

  // Handle export CSV
  const handleExportCSV = async () => {
    const hoje = hojeISO();
    const todosEntries = { ...app.diasSalvos };
    if (app.meta > 0 && app.consumido > 0) {
      todosEntries[hoje] = { consumido: app.consumido, meta: app.meta };
    }

    const sortedEntries = Object.entries(todosEntries).sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedEntries.length === 0) {
      Alert.alert("Sem dados", "Ainda não há registros para exportar.");
      return;
    }

    const linhas = ["\uFEFFData,Consumido (ml),Meta (ml),% Atingido,Meta Batida"];
    sortedEntries.forEach(([iso, v]) => {
      const pct = Math.min(Math.round((v.consumido / v.meta) * 100), 100);
      linhas.push(`${fmtBR(iso)},${v.consumido},${v.meta},${pct}%,${v.consumido >= v.meta ? "Sim" : "Não"}`);
    });

    const csv = linhas.join("\n");
    try {
      await Share.share({
        message: csv,
        title: `hidroapp_${hoje}.csv`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Calendar rendering
  const primDia = new Date(calAno, calMes, 1).getDay();
  const ultDia = new Date(calAno, calMes + 1, 0).getDate();
  const ultAnt = new Date(calAno, calMes, 0).getDate();

  const calendarDays = [];
  // Previous month days
  for (let i = 0; i < primDia; i++) {
    calendarDays.push({ dia: ultAnt - primDia + 1 + i, tipo: "other" });
  }
  // Current month days
  for (let dia = 1; dia <= ultDia; dia++) {
    const iso = `${calAno}-${String(calMes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const d = app.diasSalvos[iso];
    const hoje = iso === hojeISO();
    let tipo = "empty";
    if (iso > hojeISO()) tipo = "futuro";
    else if (d) tipo = d.consumido >= d.meta ? "ok" : "parcial";
    else if (hoje) tipo = "hoje";
    calendarDays.push({ dia, iso, tipo, data: d });
  }
  // Next month days
  const resto = (7 - (primDia + ultDia) % 7) % 7;
  for (let i = 1; i <= resto; i++) {
    calendarDays.push({ dia: i, tipo: "other" });
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View className="grid grid-cols-3 gap-3 mb-6">
          <View className="bg-blue-100 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-primary">{total}</Text>
            <Text className="text-xs text-muted mt-1">Dias registrados</Text>
          </View>
          <View className="bg-blue-100 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-primary">{batidos}</Text>
            <Text className="text-xs text-muted mt-1">Metas batidas</Text>
          </View>
          <View className="bg-blue-100 rounded-lg p-4 items-center">
            <Text className="text-2xl font-bold text-primary">{taxa}%</Text>
            <Text className="text-xs text-muted mt-1">Taxa de sucesso</Text>
          </View>
        </View>

        {/* Chart - Last 7 days */}
        <Text className="text-xs font-bold text-muted uppercase mb-2">Últimos 7 dias</Text>
        <View className="flex-row items-end gap-1 h-20 mb-6">
          {ultimos7Dias.map(({ iso, consumidoD, metaD, isHoje, temDados }, idx) => {
            const pct = metaD > 0 ? Math.min((consumidoD / metaD) * 100, 100) : 0;
            const fillClass = isHoje ? "bg-blue-400" : consumidoD >= metaD ? "bg-gradient-to-t from-blue-500 to-cyan-500" : "bg-gray-300";
            const [, m, d] = iso.split("-");

            return (
              <View key={idx} className="flex-1 items-center gap-1">
                <View className="w-full flex-1 bg-gray-200 rounded-t">
                  {temDados && (
                    <View
                      className={`w-full rounded-t ${fillClass}`}
                      style={{ height: `${pct}%` }}
                    />
                  )}
                </View>
                <Text className="text-xs text-muted font-semibold">{SDOW[new Date(iso + "T12:00:00").getDay()].slice(0, 1)}</Text>
                {temDados && (
                  <Text className="text-xs text-muted font-semibold">
                    {consumidoD >= 1000 ? (consumidoD / 1000).toFixed(1) + "L" : consumidoD + "ml"}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Calendar */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={() => {
                if (calMes === 0) { setCalMes(11); setCalAno(a => a - 1); }
                else setCalMes(m => m - 1);
              }}
              className="bg-background border border-border rounded-lg p-2"
            >
              <Text className="text-lg">‹</Text>
            </Pressable>
            <Text className="text-sm font-bold text-foreground">
              {MESES[calMes]} {calAno}
            </Text>
            <Pressable
              disabled={calAno === new Date().getFullYear() && calMes === new Date().getMonth()}
              onPress={() => {
                if (calMes === 11) { setCalMes(0); setCalAno(a => a + 1); }
                else setCalMes(m => m + 1);
              }}
              className="bg-background border border-border rounded-lg p-2"
              style={{ opacity: calAno === new Date().getFullYear() && calMes === new Date().getMonth() ? 0.35 : 1 }}
            >
              <Text className="text-lg">›</Text>
            </Pressable>
          </View>

          {/* Day of week headers */}
          <View className="grid grid-cols-7 gap-1 mb-1">
            {SDOW.map((dow) => (
              <Text key={dow} className="text-xs font-bold text-muted text-center">
                {dow}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              let bgClass = "bg-background";
              let textClass = "text-muted";

              if (day.tipo === "other") {
                textClass = "text-gray-300";
              } else if (day.tipo === "ok") {
                bgClass = "bg-gradient-to-br from-blue-500 to-cyan-500";
                textClass = "text-white font-bold";
              } else if (day.tipo === "parcial") {
                bgClass = "bg-cyan-200";
                textClass = "text-cyan-800 font-semibold";
              } else if (day.tipo === "futuro") {
                textClass = "text-gray-300";
              } else if (day.tipo === "hoje") {
                bgClass = "bg-background border-2 border-blue-500";
              }

              return (
                <Pressable
                  key={idx}
                  className={`aspect-square items-center justify-center rounded ${bgClass} border border-border`}
                >
                  <Text className={`text-xs font-semibold ${textClass}`}>{day.dia}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Legend */}
          <View className="flex-row gap-3 mt-3 flex-wrap">
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded bg-gradient-to-br from-blue-500 to-cyan-500" />
              <Text className="text-xs text-muted">Meta batida</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded bg-cyan-200 border border-cyan-500" />
              <Text className="text-xs text-muted">Parcial</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
              <Text className="text-xs text-muted">Sem registro</Text>
            </View>
          </View>
        </View>

        {/* Recent days */}
        <Text className="text-xs font-bold text-muted uppercase mb-2">Dias recentes</Text>
        <View className="mb-4">
          {entries.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-2xl mb-2">📅</Text>
              <Text className="text-sm text-muted text-center">Nenhum dia registrado ainda.</Text>
            </View>
          ) : (
            entries.slice(0, 14).map(([iso, v]) => {
              const ok = v.consumido >= v.meta;
              const pct = Math.min(Math.round((v.consumido / v.meta) * 100), 100);

              return (
                <View
                  key={iso}
                  className="flex-row items-center justify-between p-3 mb-2 border border-border rounded-lg bg-background"
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text className="text-lg">{ok ? "✅" : "🟡"}</Text>
                    <View>
                      <Text className="text-xs font-bold text-foreground">{fmtBR(iso)}</Text>
                      <Text className="text-xs text-muted">
                        {v.consumido} / {v.meta} ml · {pct}%
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${ok ? "bg-green-100" : "bg-yellow-100"}`}
                  >
                    <Text className={`text-xs font-bold ${ok ? "text-green-700" : "text-yellow-700"}`}>
                      {ok ? "Meta ✓" : pct + "%"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Export button */}
        <Pressable
          onPress={handleExportCSV}
          className="bg-background border border-border rounded-lg p-4 items-center"
        >
          <Text className="text-sm font-bold text-muted">📥 Exportar CSV (inclui hoje)</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
