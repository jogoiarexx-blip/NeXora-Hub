import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const CHANNEL_ID = "hidratacao";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function isValidNotificationConfig(start: string, end: string, intervalMinutes: number) {
  const inicio = parseTime(start);
  const fim = parseTime(end);
  if (!inicio || !fim || !Number.isInteger(intervalMinutes) || intervalMinutes < 30 || intervalMinutes > 360) return false;
  const startMin = inicio.hour * 60 + inicio.minute;
  const endMin = fim.hour * 60 + fim.minute;
  return endMin > startMin;
}

export async function scheduleHydrationReminders(start: string, end: string, intervalMinutes: number) {
  if (Platform.OS === "web") {
    return { scheduled: 0, permission: "web" as const };
  }

  if (!isValidNotificationConfig(start, end, intervalMinutes)) {
    throw new Error("Configuração de lembretes inválida.");
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    return { scheduled: 0, permission: "denied" as const };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Lembretes de hidratação",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      vibrationPattern: [0, 250, 150, 250],
    });
  }

  // O HidroApp controla somente os próprios lembretes locais.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const inicio = parseTime(start)!;
  const fim = parseTime(end)!;
  const startMin = inicio.hour * 60 + inicio.minute;
  const endMin = fim.hour * 60 + fim.minute;
  let scheduled = 0;

  for (let total = startMin; total <= endMin; total += intervalMinutes) {
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💧 Hora de beber água",
        body: "Um pouco de água agora ajuda você a manter o ritmo da meta de hoje.",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
      },
    });
    scheduled++;
  }

  return { scheduled, permission: "granted" as const };
}
