# HidroApp 1.1 — melhorias aplicadas

- Corrigido registro personalizado de água no Android: removido uso de `Alert.prompt` e criado modal próprio.
- Corrigido ajuste de meta diária no Android com o mesmo modal multiplataforma.
- Corrigido círculo de progresso: agora usa `react-native-svg`, compatível com React Native nativo.
- Corrigida a exibição da comemoração ao cruzar a meta diária.
- Lembretes agora são notificações locais reais com permissão, canal Android e agendamento diário por faixa de horário.
- Adicionada validação de horário/intervalo dos lembretes e mensagens quando a permissão estiver bloqueada.
- O botão “Lembretes” da tela Hoje agora abre Configurar.
- Virada do dia reforçada: arquiva o dia anterior e reinicia consumo/chips ao abrir ou voltar ao app após meia-noite.
- Meta temporária passa a expirar corretamente na mudança de dia.
- IDs dos registros de água não se repetem após apagar/reabrir o app.
- Sequência (streak) recalculada sem depender de estado antigo; dia atual incompleto não apaga a sequência anterior.
- Medalhas recalculadas de forma consistente com o histórico.
- Histórico recente passa a ser ordenado do mais novo para o mais antigo.
- Personalização dos copos agora trata volumes inválidos sem lançar erro não capturado.
- Removidos plugins de áudio/vídeo e permissão de microfone que não eram usados pelo HidroApp.
- Adicionado plugin `expo-notifications` ao `app.config.ts`.

## Observação de teste

A sintaxe dos arquivos TypeScript/TSX modificados foi validada localmente. O ambiente de revisão não possui as dependências Expo instaladas e não consegue acessar o npm, por isso o `pnpm check` completo não pôde ser executado aqui.
