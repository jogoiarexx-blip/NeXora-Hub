# HidroApp - Design de Interface Móvel

## Visão Geral

HidroApp é um aplicativo de rastreamento de hidratação que calcula a meta diária de água com base no peso e nível de atividade física do usuário, monitora o consumo diário, exibe o ritmo de hidratação em tempo real e mantém um histórico com conquistas.

## Telas Principais

### 1. **Tela Inicial (Hoje)**
**Conteúdo e Funcionalidade:**
- Header com título "HidroApp" e ícone de gota (💧)
- Botão de alternância de tema (claro/escuro) no canto superior direito
- Exibição de streak (🔥 dias seguidos) quando ativo
- Banner de ritmo de hidratação (status em tempo real: no ritmo, quase, ou atrasado)
- Badges de conquistas (primeira meta, 7 dias, 30 dias, 10 vitórias)
- Meta temporária do dia com opção de ajuste (✏️)
- **Anel de progresso circular** mostrando percentual da meta (0-100%)
- Dois cards de estatísticas: consumido hoje (ml) e faltam ainda (ml)
- **Grid de botões de doses** (3 colunas): Copinho (150ml), Copo (200ml), Copo G (300ml), Caneca (350ml), Garrafa (500ml), Outro (customizado)
- **Chips de registros** mostrando cada dose adicionada com opção de remover (×)
- Dois botões de ação: Lembretes (🔔) e Reiniciar dia (🔄)

**Fluxo Principal:**
- Usuário toca em um botão de dose → dose é adicionada
- Anel e stats atualizam em tempo real
- Chip aparece na lista de registros
- Ao atingir a meta, banner de sucesso aparece (🎉)

### 2. **Tela de Histórico**
**Conteúdo e Funcionalidade:**
- Grid de 3 cards de resumo: Total de dias registrados, Metas batidas, Taxa de sucesso (%)
- **Gráfico de barras dos últimos 7 dias** com cores (azul/cyan = meta atingida, cinza = parcial/não atingida, azul claro = hoje)
- **Calendário mensal** com navegação (‹ ›) entre meses
  - Dias com meta atingida: fundo gradiente azul/cyan, texto branco
  - Dias parciais: fundo cyan claro, texto escuro
  - Dias sem registro: fundo cinza claro
  - Dia de hoje: outline azul
  - Dias futuros: opacidade reduzida
  - Tooltip ao tocar: mostra data e consumo/meta em ml
- **Lista de dias recentes** (últimos 14 dias) com:
  - Ícone (✅ ou 🟡)
  - Data formatada (DD/MM/YYYY)
  - Consumo / Meta em ml e percentual
  - Badge com status (Meta ✓ ou percentual)
- Botão de exportação CSV (📥)

**Fluxo Principal:**
- Usuário navega entre meses no calendário
- Toca em um dia para ver tooltip com detalhes
- Exporta dados em CSV para análise

### 3. **Tela de Configuração**
**Conteúdo e Funcionalidade:**

**Seção 1: Dados Pessoais**
- Campo de nome (texto)
- Campo de peso em kg (número, 20-300 kg)
- Dropdown de nível de atividade física:
  - Sedentário (1.0x)
  - Levemente ativo (1.1x)
  - Moderadamente ativo (1.2x) - padrão
  - Muito ativo (1.35x)
  - Atleta / treino intenso (1.5x)
- Botão "Salvar e calcular meta"
- Display da meta calculada (ml e L)

**Seção 2: Personalizar Copos**
- Grid de 3 colunas com inputs numéricos para cada copo (50-2000 ml)
- Botão "Salvar copos"

**Seção 3: Lembretes**
- Input de hora de início (padrão 07:00)
- Input de hora de fim (padrão 22:00)
- Dropdown de intervalo:
  - A cada 30 min
  - A cada 1 hora (padrão)
  - A cada 1h30
  - A cada 2 horas
  - A cada 3 horas
- Botão "Salvar configuração de lembretes"

**Fluxo Principal:**
- Usuário preenche dados pessoais e calcula meta
- Personaliza tamanhos de copos
- Configura horários e frequência de lembretes

## Cores e Tema

### Paleta de Cores
- **Primária (Azul):** #1463F3 (light), #4D8EFF (dark)
- **Secundária (Cyan):** #06C4D0 (light), #00D8E8 (dark)
- **Fundo:** #F0F6FF (light), #0A1628 (dark)
- **Card/Superfície:** #FFFFFF (light), #111E32 (dark)
- **Texto:** #0F1F35 (light), #E2EEFF (dark)
- **Sucesso:** #0BA760 (light), #22C97A (dark)
- **Aviso:** #E07B00 (light), #F59E0B (dark)
- **Erro:** #D93025 (light), #F87171 (dark)

### Tema
- Suporte a tema claro e escuro
- Alternância via botão no header
- Persistência em localStorage

## Navegação

**Tabs na base da tela:**
- Hoje (home)
- Histórico (chart/calendar)
- Configurar (settings)

## Interações Principais

1. **Adicionar dose:** Toque em botão de dose → adiciona ml → atualiza anel e stats → mostra toast de confirmação
2. **Remover dose:** Toque no × do chip → remove ml → atualiza UI
3. **Ajustar meta:** Toque em "✏️ Ajustar hoje" → prompt com valor → salva meta temporária
4. **Alternar lembretes:** Toque em 🔔 → solicita permissão → ativa/desativa
5. **Reiniciar dia:** Toque em 🔄 → confirmação → limpa registros
6. **Navegar calendário:** Toque em ‹ › → muda mês
7. **Exportar CSV:** Toque em 📥 → baixa arquivo

## Animações e Feedback

- **Anel de progresso:** Transição suave ao atualizar (0.7s)
- **Chips:** Pop-in animation ao aparecer
- **Badges:** Escala 1.04 quando conquistadas
- **Botões:** Feedback visual ao pressionar (opacidade, escala)
- **Toast:** Slide-up animation, desaparece após 2.8s
- **Ícone de gota:** Bob animation contínua no header

## Responsividade

- Aplicativo otimizado para **orientação portrait (9:16)**
- Uso de **one-handed design** (elementos principais na parte inferior)
- Seguro para notch e home indicator do iOS
- Suporte para diferentes tamanhos de tela (mobile)

## Padrões de Design

- **Seguir Apple Human Interface Guidelines (HIG)**
- Design limpo e minimalista
- Uso de gradientes (azul → cyan) em elementos importantes
- Ícones emoji para ações rápidas e reconhecimento visual
- Cards com sombras suaves
- Bordas arredondadas (18px para cards, 12px para elementos menores)
