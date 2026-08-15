import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";

interface NumberInputModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialValue?: string;
  min?: number;
  max?: number;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (value: number) => void;
}

export function NumberInputModal({
  visible,
  title,
  subtitle,
  initialValue = "",
  min = 1,
  max = 10000,
  confirmLabel = "Salvar",
  onClose,
  onConfirm,
}: NumberInputModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError("");
    }
  }, [visible, initialValue]);

  const submit = () => {
    const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      setError(`Digite um valor entre ${min} e ${max} ml.`);
      return;
    }
    onConfirm(parsed);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-5 bg-black/60"
      >
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Fechar" />
        <View className="bg-background border border-border rounded-3xl p-5 shadow-xl">
          <Text className="text-xl font-bold text-foreground">{title}</Text>
          {!!subtitle && <Text className="text-sm text-muted mt-1 mb-4">{subtitle}</Text>}
          <TextInput
            value={value}
            onChangeText={(text) => {
              setValue(text.replace(/[^0-9]/g, ""));
              setError("");
            }}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
            placeholder="Quantidade em ml"
            placeholderTextColor="#8A94A6"
            className="border border-border bg-background rounded-2xl px-4 py-4 text-xl font-bold text-foreground"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          {!!error && <Text className="text-red-600 text-xs mt-2">{error}</Text>}
          <View className="flex-row gap-3 mt-5">
            <Pressable onPress={onClose} className="flex-1 border border-border rounded-2xl p-4 items-center">
              <Text className="font-bold text-muted">Cancelar</Text>
            </Pressable>
            <Pressable onPress={submit} className="flex-1 bg-primary rounded-2xl p-4 items-center">
              <Text className="font-bold text-white">{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
