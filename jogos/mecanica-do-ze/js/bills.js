// ============================================================
// 💸 SISTEMA DE CONTAS — Mecânica do Zé
// Aluguel + Salários dos funcionários pagos a cada 6 dias
// ============================================================

const BillsSystem = (() => {

  // ── Configurações ─────────────────────────────────────────
  const RENT_COST        = 800;   // aluguel fixo
  const HELPER_SALARY    = 400;   // salário por ajudante
  const BILL_CYCLE_DAYS  = 6;     // a cada 6 dias

  let lastBillDay  = 0;  // último dia em que as contas foram geradas
  let billsPaid    = false; // contas do ciclo atual já foram pagas?
  let billsDue     = false; // contas estão vencidas/pendentes?
  let panelOpen    = false;

  // ── Calcula dia atual ──────────────────────────────────────
  function currentDay() {
    if (typeof tick === 'undefined') return 1;
    return Math.floor(tick / (24 * 60 * 4)) + 1;
  }

  // ── Retorna lista de contas do ciclo atual ─────────────────
  function getBills() {
    const helperCount = (typeof helpers !== 'undefined') ? helpers.length : 0;
    const bills = [
      { label: '🏠 Aluguel', value: RENT_COST, type: 'rent' }
    ];
    if (helperCount >= 1) bills.push({ label: '👷 Assistente 1', value: HELPER_SALARY, type: 'helper1' });
    if (helperCount >= 2) bills.push({ label: '👷 Assistente 2', value: HELPER_SALARY, type: 'helper2' });
    return bills;
  }

  function getTotal() {
    return getBills().reduce((s, b) => s + b.value, 0);
  }

  let lastWarnDay = -1; // controla para não repetir o aviso

  // ── Verifica se é dia de cobrança ──────────────────────────
  function tick_update() {
    const day = currentDay();

    // Aviso 2 dias antes da cobrança
    const nextBillDay = Math.ceil(day / BILL_CYCLE_DAYS) * BILL_CYCLE_DAYS;
    const daysLeft = nextBillDay - day;
    if (daysLeft === 2 && day !== lastWarnDay && !billsDue) {
      lastWarnDay = day;
      const total = getTotal();
      if (typeof showToast !== 'undefined') {
        setTimeout(() => showToast(`⏰ Contas vencem em 2 dias! Prepare $${total} 💸`), 1000);
      }
      updateToggleAlert(true); // pisca amarelo como alerta prévio
    }

    // Gera cobrança a cada BILL_CYCLE_DAYS
    if (day >= BILL_CYCLE_DAYS && day % BILL_CYCLE_DAYS === 0 && day !== lastBillDay) {
      lastBillDay = day;
      billsPaid   = false;
      billsDue    = true;
      updateToggleAlert(true);
      renderBillsPanel();
      if (typeof showToast !== 'undefined') {
        setTimeout(() => showToast('💸 Contas chegaram! Pague pelo botão CONTAS.'), 800);
      }
    }

    // Se pago, remove alerta
    if (billsPaid) updateToggleAlert(false);
  }

  // ── Paga todas as contas ───────────────────────────────────
  function payAll() {
    if (billsPaid) { showToast('✅ Contas já pagas!'); return; }
    if (!billsDue) { showToast('Sem contas pendentes no momento.'); return; }

    const total = getTotal();
    if (typeof money === 'undefined') return;

    if (money < total) {
      const diff = total - money;
      // Cobra o que tem e vai a negativo (multa)
      if (typeof showToast !== 'undefined')
        showToast(`⚠️ Sem grana! Faltam $${diff}. Reputação penalizada!`);
      // Penalidade: perde reputação proporcional ao que não pode pagar
      if (typeof reputation !== 'undefined') reputation = Math.max(0, reputation - 30);
      if (typeof money !== 'undefined') money = Math.max(0, money - money); // zera o caixa
      if (typeof updateHUD !== 'undefined') updateHUD();
      return;
    }

    // Pagamento bem-sucedido
    money -= total;
    billsPaid = true;
    billsDue  = false;
    updateToggleAlert(false);
    renderBillsPanel();
    if (typeof updateHUD !== 'undefined') updateHUD();
    if (typeof SFX !== 'undefined') SFX.cashRegister();
    if (typeof showToast !== 'undefined') showToast(`✅ Contas pagas! -$${total}`);
    if (typeof spawnParticles !== 'undefined')
      spawnParticles(200, 300, '#34d399', 12);
  }

  // ── Renderiza o conteúdo do painel ────────────────────────
  function renderBillsPanel() {
    const container = document.getElementById('bills-content');
    const payBtn    = document.getElementById('bills-pay-btn');
    if (!container) return;

    const day     = currentDay();
    const nextBill = Math.ceil(day / BILL_CYCLE_DAYS) * BILL_CYCLE_DAYS;
    const daysLeft = nextBill - day;
    const bills   = getBills();
    const total   = getTotal();

    let html = '';

    // Próxima cobrança
    if (!billsDue) {
      const urgency = daysLeft <= 1 ? 'urgent' : '';
      html += `<div class="bill-due-row ${urgency}">
        ⏰ Próx. cobrança: Dia ${nextBill}<br>(em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''})
      </div>`;
    } else {
      html += `<div class="bill-due-row urgent">⚠️ CONTAS PENDENTES!</div>`;
    }

    // Lista de contas
    bills.forEach(b => {
      const paidClass = billsPaid ? 'paid' : '';
      const valLabel  = billsPaid ? `✔ $${b.value}` : `-$${b.value}`;
      html += `<div class="bill-item ${paidClass}">
        <span>${b.label}</span>
        <span class="bill-val">${valLabel}</span>
      </div>`;
    });

    // Total
    html += `<div class="bill-total-row">TOTAL: $${total}</div>`;

    // Histórico ciclo
    html += `<div class="bill-due-row" style="margin-top:8px;">Ciclo: a cada ${BILL_CYCLE_DAYS} dias</div>`;

    container.innerHTML = html;

    if (payBtn) {
      if (billsPaid || !billsDue) {
        payBtn.disabled = true;
        payBtn.textContent = billsPaid ? '✅ PAGO' : '⏳ SEM PENDÊNCIAS';
      } else {
        payBtn.disabled = false;
        payBtn.textContent = `💰 PAGAR $${total}`;
      }
    }
  }

  // ── Alerta visual no botão ─────────────────────────────────
  function updateToggleAlert(isAlert) {
    const btn = document.getElementById('bills-toggle');
    if (!btn) return;
    if (isAlert) btn.classList.add('alert');
    else         btn.classList.remove('alert');
  }

  // ── Toggle painel ─────────────────────────────────────────
  function togglePanel() {
    const panel = document.getElementById('bills-panel');
    if (!panel) return;
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    if (panelOpen) renderBillsPanel();
    if (typeof SFX !== 'undefined') SFX.uiClick();
  }

  // ── Save / Load ───────────────────────────────────────────
  function getSaveData() {
    return { lastBillDay, billsPaid, billsDue };
  }

  function applySaveData(d) {
    if (!d) return;
    lastBillDay = d.lastBillDay ?? 0;
    billsPaid   = d.billsPaid ?? false;
    billsDue    = d.billsDue ?? false;
    panelOpen   = false;
    const panel = document.getElementById('bills-panel');
    if (panel) panel.classList.remove('open');
    updateToggleAlert(billsDue && !billsPaid);
  }

  function reset() {
    lastBillDay = 0; billsPaid = false; billsDue = false; panelOpen = false; lastWarnDay = -1;
    const panel = document.getElementById('bills-panel');
    if (panel) panel.classList.remove('open');
    updateToggleAlert(false);
    renderBillsPanel();
  }

  return { tick_update, payAll, togglePanel, renderBillsPanel, getSaveData, applySaveData, reset };

})();

// ── Globais chamados pelo HTML ─────────────────────────────────────────────────
function toggleBillsPanel() { BillsSystem.togglePanel(); }
function payAllBills()       { BillsSystem.payAll();      }
window.toggleBillsPanel = toggleBillsPanel;
window.payAllBills      = payAllBills;
