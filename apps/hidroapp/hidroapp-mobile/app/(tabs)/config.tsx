import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Picker } from "@react-native-picker/picker";
import { isValidNotificationConfig, scheduleHydrationReminders } from "@/lib/notifications";
import { useThemeContext } from "@/lib/theme-provider";

export default function ConfigScreen() {
  const app = useApp();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [nome, setNome] = useState(app.nome);
  const [peso, setPeso] = useState(app.peso.toString());
  const [atividade, setAtividade] = useState(app.atividade.toString());
  const [cupValues, setCupValues] = useState(app.copos.filter(c => c[0] !== 0).map(c => c[0].toString()));
  const [notifInicio, setNotifInicio] = useState(app.notifInicio);
  const [notifFim, setNotifFim] = useState(app.notifFim);
  const [notifInterval, setNotifInterval] = useState(app.notifInterval.toString());

  useEffect(() => {
    if (app.isLoading) return;
    setNome(app.nome); setPeso(app.peso ? String(app.peso) : ""); setAtividade(String(app.atividade));
    setCupValues(app.copos.filter(c => c[0] !== 0).map(c => String(c[0])));
    setNotifInicio(app.notifInicio); setNotifFim(app.notifFim); setNotifInterval(String(app.notifInterval));
  }, [app.isLoading]);

  const handleSaveProfile = () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Informe seu nome.");
      return;
    }
    const pesoNum = parseFloat(peso);
    if (isNaN(pesoNum) || pesoNum < 20 || pesoNum > 300) {
      Alert.alert("Erro", "Informe um peso válido (20–300 kg).");
      return;
    }
    const atv = parseFloat(atividade);
    if (!Number.isFinite(atv) || atv < 1 || atv > 1.5) { Alert.alert("Erro", "Escolha um nível de atividade válido."); return; }
    void app.setUserConfig(nome, pesoNum, atv);
    Alert.alert("Sucesso", `Meta definida: ${Math.round(pesoNum * 35 * atv)} ml/dia`);
  };

  const handleSaveCups = () => {
    try {
      const newCopos = app.copos.map((c, idx) => {
      if (c[0] === 0) return c;
      const val = parseInt(cupValues[idx] || "0", 10);
      if (isNaN(val) || val < 50 || val > 2000) {
        throw new Error("Volumes devem ser entre 50 e 2000 ml.");
      }
      return [val, c[1], val + "ml"] as [number, string, string];
    });
      void app.setCopos(newCopos);
      Alert.alert("Sucesso", "Copos salvos!");
    } catch (error) {
      Alert.alert("Valores inválidos", error instanceof Error ? error.message : "Revise os volumes informados.");
    }
  };

  const handleSaveNotifications = async () => {
    const interval = parseInt(notifInterval, 10);
    if (!isValidNotificationConfig(notifInicio, notifFim, interval)) {
      Alert.alert("Horários inválidos", "Use o formato HH:MM, deixe o horário final depois do inicial e escolha um intervalo válido.");
      return;
    }
    try {
      await app.setNotifConfig(notifInicio, notifFim, interval);
      const result = await scheduleHydrationReminders(notifInicio, notifFim, interval);
      if (result.permission === "denied") {
        Alert.alert("Permissão necessária", "A configuração foi salva, mas as notificações estão bloqueadas no celular. Libere a permissão do HidroApp nas configurações do aparelho.");
      } else if (result.permission === "web") {
        Alert.alert("Configuração salva", "Os horários foram salvos. As notificações locais automáticas funcionam no app instalado para Android/iOS.");
      } else {
        Alert.alert("Lembretes ativos", `${result.scheduled} lembretes diários foram programados.`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Não foi possível ativar", "A configuração foi salva, mas houve um erro ao programar as notificações.");
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Seção: Dados Pessoais */}
        <Text className="text-lg font-bold text-foreground mb-4">Dados Pessoais</Text>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Nome</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Como você se chama?"
            className="border border-border rounded-lg p-3 text-foreground bg-background"
            placeholderTextColor="#999"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Peso (kg)</Text>
          <TextInput
            value={peso}
            onChangeText={setPeso}
            placeholder="Ex: 70"
            keyboardType="decimal-pad"
            className="border border-border rounded-lg p-3 text-foreground bg-background"
            placeholderTextColor="#999"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Nível de atividade física</Text>
          <View className="border border-border rounded-lg bg-background">
            <Picker
              selectedValue={atividade}
              onValueChange={setAtividade}
              style={{ color: "#0F1F35" }}
            >
              <Picker.Item label="Sedentário" value="1.0" />
              <Picker.Item label="Levemente ativo" value="1.1" />
              <Picker.Item label="Moderadamente ativo" value="1.2" />
              <Picker.Item label="Muito ativo" value="1.35" />
              <Picker.Item label="Atleta / treino intenso" value="1.5" />
            </Picker>
          </View>
        </View>

        <Pressable
          onPress={handleSaveProfile}
          className="bg-primary rounded-lg p-4 items-center mb-6"
        >
          <Text className="text-white font-bold">Salvar e calcular meta</Text>
        </Pressable>

        {app.metaBase > 0 && (
          <View className="bg-blue-100 rounded-lg p-4 mb-6">
            <Text className="text-xs font-bold text-muted uppercase mb-1">Sua meta diária</Text>
            <Text className="text-2xl font-bold text-primary">
              {app.metaBase} ml · {(app.metaBase / 1000).toFixed(2)} L
            </Text>
          </View>
        )}

        {/* Seção: Personalizar Copos */}
        <Text className="text-lg font-bold text-foreground mb-4 mt-6">🥤 Personalizar copos</Text>

        <View className="grid grid-cols-3 gap-3 mb-4">
          {app.copos
            .filter(c => c[0] !== 0)
            .map((copo, idx) => (
              <View key={idx}>
                <Text className="text-xs font-bold text-muted uppercase mb-2 text-center">
                  Copo {idx + 1}
                </Text>
                <TextInput
                  value={cupValues[idx] || ""}
                  onChangeText={(val) => {
                    const newVals = [...cupValues];
                    newVals[idx] = val;
                    setCupValues(newVals);
                  }}
                  keyboardType="number-pad"
                  placeholder={copo[0].toString()}
                  className="border border-border rounded-lg p-2 text-center text-foreground bg-background"
                  placeholderTextColor="#999"
                />
              </View>
            ))}
        </View>

        <Pressable
          onPress={handleSaveCups}
          className="bg-primary rounded-lg p-4 items-center mb-6"
        >
          <Text className="text-white font-bold">Salvar copos</Text>
        </Pressable>

        <Text className="text-lg font-bold text-foreground mb-4 mt-6">🎨 Aparência</Text>
        <View className="flex-row gap-3 mb-6">
          <Pressable onPress={() => setColorScheme("light")} className={`flex-1 rounded-xl p-4 border items-center ${colorScheme === "light" ? "border-primary bg-surface" : "border-border bg-background"}`}>
            <Text className="text-2xl">☀️</Text><Text className="font-bold text-foreground mt-1">Claro</Text>
          </Pressable>
          <Pressable onPress={() => setColorScheme("dark")} className={`flex-1 rounded-xl p-4 border items-center ${colorScheme === "dark" ? "border-primary bg-surface" : "border-border bg-background"}`}>
            <Text className="text-2xl">🌙</Text><Text className="font-bold text-foreground mt-1">Escuro</Text>
          </Pressable>
        </View>

        {/* Seção: Lembretes */}
        <Text className="text-lg font-bold text-foreground mb-4 mt-6">🔔 Lembretes</Text>

        <View className="grid grid-cols-2 gap-3 mb-4">
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Início</Text>
            <TextInput
              value={notifInicio}
              onChangeText={setNotifInicio}
              placeholder="07:00"
              className="border border-border rounded-lg p-3 text-foreground bg-background"
              placeholderTextColor="#999"
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Fim</Text>
            <TextInput
              value={notifFim}
              onChangeText={setNotifFim}
              placeholder="22:00"
              className="border border-border rounded-lg p-3 text-foreground bg-background"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Intervalo</Text>
          <View className="border border-border rounded-lg bg-background">
            <Picker
              selectedValue={notifInterval}
              onValueChange={setNotifInterval}
              style={{ color: "#0F1F35" }}
            >
              <Picker.Item label="A cada 30 min" value="30" />
              <Picker.Item label="A cada 1 hora" value="60" />
              <Picker.Item label="A cada 1h30" value="90" />
              <Picker.Item label="A cada 2 horas" value="120" />
              <Picker.Item label="A cada 3 horas" value="180" />
            </Picker>
          </View>
        </View>

        <Pressable
          onPress={handleSaveNotifications}
          className="bg-primary rounded-lg p-4 items-center"
        >
          <Text className="text-white font-bold">Salvar configuração de lembretes</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
