# HidroApp - TODO

## Funcionalidades Principais

### Tela Inicial (Hoje)
- [x] Header com título "HidroApp" e ícone de gota animado
- [x] Botão de alternância de tema (claro/escuro) - via ThemeProvider
- [x] Exibição de streak (🔥 dias seguidos) - via AppContext
- [x] Banner de ritmo de hidratação (no ritmo, quase, atrasado)
- [x] Badges de conquistas (primeira meta, 7 dias, 30 dias, 10 vitórias)
- [x] Meta temporária do dia com opção de ajuste
- [x] Anel de progresso circular (0-100%)
- [x] Cards de estatísticas (consumido, faltam)
- [x] Grid de botões de doses (6 opções)
- [x] Chips de registros com opção de remover
- [x] Botão de lembretes (🔔) - UI pronta
- [x] Botão de reiniciar dia (🔄)

### Tela de Histórico
- [x] Grid de resumo (dias registrados, metas batidas, taxa)
- [x] Gráfico de barras dos últimos 7 dias
- [x] Calendário mensal com navegação
- [x] Cores para dias (meta ok, parcial, sem registro)
- [x] Lista de dias recentes (últimos 14 dias)
- [x] Botão de exportação CSV

### Tela de Configuração
- [x] Campo de nome
- [x] Campo de peso (kg)
- [x] Dropdown de nível de atividade física
- [x] Botão "Salvar e calcular meta"
- [x] Display da meta calculada
- [x] Editor de tamanhos de copos (5 inputs)
- [x] Botão "Salvar copos"
- [x] Inputs de horário de lembretes (início/fim)
- [x] Dropdown de intervalo de lembretes
- [x] Botão "Salvar configuração de lembretes"

### Lógica de Negócio
- [x] Cálculo de meta: peso × 35 × nível_atividade
- [x] Persistência de dados em AsyncStorage
- [x] Virada de dia automática (reset de consumo)
- [x] Cálculo de streak (dias consecutivos com meta atingida)
- [x] Sistema de conquistas (badges)
- [x] Cálculo de ritmo esperado (7h-22h)
- [ ] Notificações locais com horários personalizados - UI pronta, falta integração
- [x] Exportação de dados em CSV

### Temas e Estilos
- [x] Tema claro
- [x] Tema escuro
- [x] Cores gradiente (azul → cyan)
- [x] Responsividade mobile
- [ ] Animações suaves - básicas implementadas

### Navegação
- [x] Tab bar com 3 abas (Hoje, Histórico, Configurar)
- [x] Transição entre abas
- [x] SafeArea handling

## Funcionalidades Pendentes
- [ ] Integração de notificações locais (expo-notifications)
- [ ] Animações mais suaves (reanimated)
- [ ] Integração com backend para sincronização entre dispositivos
- [ ] Autenticação de usuário
- [ ] Gráficos mais avançados
- [ ] Compartilhamento de dados
- [ ] Testes unitários
