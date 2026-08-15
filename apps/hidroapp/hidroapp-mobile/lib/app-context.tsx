import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

export interface DayData { consumido: number; meta: number; }
export interface ChipRecord { ml: number; id: number; at?: number; }

type PersistedState = {
  version: 2;
  nome: string; peso: number; atividade: number;
  dia: string; consumido: number; chipsHoje: ChipRecord[];
  diasSalvos: Record<string, DayData>; copos: [number, string, string][];
  notifInicio: string; notifFim: string; notifInterval: number;
  metaTemp: { dia: string; meta: number } | null;
};

export interface AppContextType {
  nome: string; peso: number; atividade: number;
  setUserConfig: (nome: string, peso: number, atividade: number) => Promise<void>;
  meta: number; metaBase: number; setMetaTemp: (value: number) => Promise<void>;
  consumido: number; chipsHoje: ChipRecord[];
  addAgua: (ml: number) => Promise<void>; removeChip: (id: number) => Promise<void>; resetDay: () => Promise<void>;
  diasSalvos: Record<string, DayData>;
  copos: [number, string, string][]; setCopos: (copos: [number, string, string][]) => Promise<void>;
  notifInicio: string; notifFim: string; notifInterval: number;
  setNotifConfig: (inicio: string, fim: string, interval: number) => Promise<void>;
  streak: number; badges: { primeira: boolean; dias7: boolean; dias30: boolean; vitoria10: boolean };
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STATE_KEY = "hidro_state_v2";
const STATE_BACKUP_KEY = "hidro_state_v2_backup";
const COPOS_DEFAULT: [number, string, string][] = [
  [150, "🥤", "Copinho"], [200, "🥤", "Copo"], [300, "🧃", "Copo G"],
  [350, "🍶", "Caneca"], [500, "🍾", "Garrafa"], [0, "✏️", "Outro"],
];
const LEGACY_KEYS = {
  nome: "hidro_nome", peso: "hidro_peso", atividade: "hidro_atividade", consumo: "hidro_consumido",
  chips: "hidro_chips", dias: "hidro_dias", copos: "hidro_copos", inicio: "hidro_notif_inicio",
  fim: "hidro_notif_fim", interval: "hidro_notif_interval", metaTemp: "hidro_meta_temp", dia: "hidro_dia",
} as const;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function safeJson<T>(value: string | null, fallback: T): T { try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function validDayData(v: unknown): v is DayData { const x = v as DayData; return !!x && Number.isFinite(x.consumido) && x.consumido >= 0 && Number.isFinite(x.meta) && x.meta > 0; }
function sanitizeDays(input: unknown): Record<string, DayData> {
  if (!input || typeof input !== "object") return {};
  return Object.fromEntries(Object.entries(input as Record<string, unknown>).filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && validDayData(v)));
}
function calcStreak(days: Record<string, DayData>, todayConsumption: number, todayGoal: number) {
  let count = 0; const cursor = new Date();
  for (let i = 0; i < 3650; i++) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const isToday = iso === todayISO();
    const record = isToday ? { consumido: todayConsumption, meta: todayGoal } : days[iso];
    if (record?.meta > 0 && record.consumido >= record.meta) count++;
    else if (!isToday) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [nome, setNome] = useState(""); const [peso, setPeso] = useState(0); const [atividade, setAtividade] = useState(1.2);
  const [meta, setMeta] = useState(0); const [metaBase, setMetaBase] = useState(0); const [consumido, setConsumo] = useState(0);
  const [chipsHoje, setChipsHoje] = useState<ChipRecord[]>([]); const [diasSalvos, setDiasSalvos] = useState<Record<string, DayData>>({});
  const [copos, setCoposState] = useState<[number, string, string][]>(COPOS_DEFAULT); const [notifInicio, setNotifInicio] = useState("07:00");
  const [notifFim, setNotifFim] = useState("22:00"); const [notifInterval, setNotifInterval] = useState(60); const [isLoading, setIsLoading] = useState(true);
  const [metaTemp, setMetaTempState] = useState<{ dia: string; meta: number } | null>(null); const [currentDay, setCurrentDay] = useState(todayISO());
  const chipIdRef = useRef(1);

  const rolloverDay = useCallback(async () => {
    const today = todayISO(); if (currentDay === today) return;
    setDiasSalvos(days => {
      const next = { ...days };
      if (consumido > 0 && meta > 0) next[currentDay] = { consumido, meta };
      return next;
    });
    setCurrentDay(today); setConsumo(0); setChipsHoje([]); chipIdRef.current = 1; setMetaTempState(null); setMeta(metaBase);
  }, [currentDay, consumido, meta, metaBase]);

  useEffect(() => {
    (async () => {
      try {
        let parsed = safeJson<PersistedState | null>(await AsyncStorage.getItem(STATE_KEY), null);
        if (!parsed || parsed.version !== 2) parsed = safeJson<PersistedState | null>(await AsyncStorage.getItem(STATE_BACKUP_KEY), null);
        if (!parsed || parsed.version !== 2) {
          const pairs = await AsyncStorage.multiGet(Object.values(LEGACY_KEYS)); const v = Object.fromEntries(pairs);
          const lpeso = Number(v[LEGACY_KEYS.peso]) || 0; const latv = Number(v[LEGACY_KEYS.atividade]) || 1.2;
          parsed = {
            version: 2, nome: v[LEGACY_KEYS.nome] || "", peso: lpeso, atividade: latv,
            dia: v[LEGACY_KEYS.dia] || todayISO(), consumido: Math.max(0, Number(v[LEGACY_KEYS.consumo]) || 0),
            chipsHoje: safeJson<ChipRecord[]>(v[LEGACY_KEYS.chips], []), diasSalvos: sanitizeDays(safeJson(v[LEGACY_KEYS.dias], {})),
            copos: safeJson<[number, string, string][]>(v[LEGACY_KEYS.copos], COPOS_DEFAULT), notifInicio: v[LEGACY_KEYS.inicio] || "07:00",
            notifFim: v[LEGACY_KEYS.fim] || "22:00", notifInterval: Number(v[LEGACY_KEYS.interval]) || 60,
            metaTemp: safeJson(v[LEGACY_KEYS.metaTemp], null),
          };
        }
        const base = parsed.peso > 0 ? Math.round(parsed.peso * 35 * parsed.atividade) : 0; const today = todayISO();
        const cleanDays = sanitizeDays(parsed.diasSalvos); let day = parsed.dia || today; let consumption = Math.max(0, parsed.consumido || 0); let chips = Array.isArray(parsed.chipsHoje) ? parsed.chipsHoje.filter(c => Number.isFinite(c.ml) && c.ml > 0) : [];
        let temp = parsed.metaTemp?.dia === today && Number.isFinite(parsed.metaTemp.meta) ? parsed.metaTemp : null; let goal = temp?.meta || base;
        if (day !== today) { if (consumption > 0 && goal > 0) cleanDays[day] = { consumido: consumption, meta: goal }; day = today; consumption = 0; chips = []; temp = null; goal = base; }
        setNome(parsed.nome || ""); setPeso(parsed.peso || 0); setAtividade(parsed.atividade || 1.2); setMetaBase(base); setMeta(goal);
        setCurrentDay(day); setConsumo(consumption); setChipsHoje(chips); setDiasSalvos(cleanDays); setCoposState(parsed.copos?.length ? parsed.copos : COPOS_DEFAULT);
        setNotifInicio(parsed.notifInicio || "07:00"); setNotifFim(parsed.notifFim || "22:00"); setNotifInterval(Number(parsed.notifInterval) || 60); setMetaTempState(temp);
        chipIdRef.current = chips.reduce((m, c) => Math.max(m, (c.id || 0) + 1), 1);
      } catch (error) { console.error("Erro ao carregar HidroApp:", error); }
      finally { setIsLoading(false); }
    })();
  }, []);

  useEffect(() => { const sub = AppState.addEventListener("change", s => { if (s === "active" && !isLoading) void rolloverDay(); }); return () => sub.remove(); }, [isLoading, rolloverDay]);

  useEffect(() => {
    if (isLoading) return;
    const state: PersistedState = { version: 2, nome, peso, atividade, dia: currentDay, consumido, chipsHoje, diasSalvos, copos, notifInicio, notifFim, notifInterval, metaTemp };
    const json = JSON.stringify(state);
    AsyncStorage.multiSet([[STATE_KEY, json], [STATE_BACKUP_KEY, json]]).catch(e => console.error("Erro ao salvar HidroApp:", e));
  }, [isLoading, nome, peso, atividade, currentDay, consumido, chipsHoje, diasSalvos, copos, notifInicio, notifFim, notifInterval, metaTemp]);

  const streak = useMemo(() => calcStreak(diasSalvos, consumido, meta), [diasSalvos, consumido, meta]);
  const badges = useMemo(() => { const wins = Object.values(diasSalvos).filter(d => d.consumido >= d.meta).length; const todayWin = meta > 0 && consumido >= meta; return { primeira: todayWin || wins > 0, dias7: streak >= 7, dias30: streak >= 30, vitoria10: wins + (todayWin ? 1 : 0) >= 10 }; }, [diasSalvos, consumido, meta, streak]);

  const setUserConfig = async (newNome: string, newPeso: number, newAtividade: number) => { const base = Math.round(newPeso * 35 * newAtividade); setNome(newNome.trim()); setPeso(newPeso); setAtividade(newAtividade); setMetaBase(base); setMeta(base); setMetaTempState(null); };
  const setMetaTemp = async (value: number) => { if (!Number.isFinite(value) || value < 100 || value > 10000) return; setMeta(value); setMetaTempState({ dia: todayISO(), meta: value }); };
  const addAgua = async (ml: number) => { if (!Number.isInteger(ml) || ml <= 0 || ml > 5000) return; await rolloverDay(); const id = chipIdRef.current++; setConsumo(c => c + ml); setChipsHoje(chips => [...chips, { ml, id, at: Date.now() }]); };
  const removeChip = async (id: number) => { const chip = chipsHoje.find(c => c.id === id); if (!chip) return; setConsumo(c => Math.max(0, c - chip.ml)); setChipsHoje(chips => chips.filter(c => c.id !== id)); };
  const resetDay = async () => { setConsumo(0); setChipsHoje([]); chipIdRef.current = 1; setMeta(metaBase); setMetaTempState(null); };
  const setCopos = async (newCopos: [number, string, string][]) => setCoposState(newCopos);
  const setNotifConfig = async (inicio: string, fim: string, interval: number) => { setNotifInicio(inicio); setNotifFim(fim); setNotifInterval(interval); };

  return <AppContext.Provider value={{ nome, peso, atividade, setUserConfig, meta, metaBase, setMetaTemp, consumido, chipsHoje, addAgua, removeChip, resetDay, diasSalvos, copos, setCopos, notifInicio, notifFim, notifInterval, setNotifConfig, streak, badges, isLoading }}>{children}</AppContext.Provider>;
}
export function useApp() { const ctx = useContext(AppContext); if (!ctx) throw new Error("useApp must be used within AppProvider"); return ctx; }
