// ================= SISTEMA DE VALIDAÇÃO E SAVE =================

// Versão atual do save
const SAVE_VERSION = 3;

// Schema de validação para o save
const SAVE_SCHEMA = {
  version: { type: 'number', required: true, min: 1, max: 100 },
  level: { type: 'number', required: true, min: 1, max: 10000, default: 1 },
  xp: { type: 'number', required: true, min: 0, max: 1000000, default: 0 },
  xpToNext: { type: 'number', required: true, min: 1, max: 1000000, default: 100 },
  upgradePoints: { type: 'number', required: true, min: 0, max: 10000, default: 0 },
  coins: { type: 'number', required: false, min: 0, max: 1000000, default: 0 },
  gems: { type: 'number', required: false, min: 0, max: 100000, default: 0 },
  upgrades: { 
    type: 'object', 
    required: true,
    schema: {
      maxHunger: { type: 'number', min: 0, max: 100, default: 0 },
      hungerDrain: { type: 'number', min: 0, max: 100, default: 0 },
      xpBonus: { type: 'number', min: 0, max: 100, default: 0 },
      speed: { type: 'number', min: 0, max: 100, default: 0 },
      heal: { type: 'number', min: 0, max: 100, default: 0 }
    }
  },
  shopItems: {
    type: 'array',
    required: false,
    itemSchema: {
      id: { type: 'string', required: true },
      owned: { type: 'boolean', default: false },
      level: { type: 'number', min: 0, max: 100, default: 0 },
      cost: { type: 'number', min: 0, max: 1000000, default: 100 }
    }
  },
  timestamp: { type: 'number', required: false },
  checksum: { type: 'string', required: false }
};

// Validar tipo de dado
function validateType(value, expectedType) {
  if (expectedType === 'number') return typeof value === 'number' && !isNaN(value) && isFinite(value);
  if (expectedType === 'string') return typeof value === 'string';
  if (expectedType === 'boolean') return typeof value === 'boolean';
  if (expectedType === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
  if (expectedType === 'array') return Array.isArray(value);
  return false;
}

// Validar campo individual
function validateField(value, fieldSchema) {
  // Tipo
  if (!validateType(value, fieldSchema.type)) {
    return { valid: false, error: `Tipo inválido, esperado ${fieldSchema.type}` };
  }
  
  // Range numérico
  if (fieldSchema.type === 'number') {
    if (fieldSchema.min !== undefined && value < fieldSchema.min) {
      return { valid: false, error: `Valor ${value} menor que mínimo ${fieldSchema.min}` };
    }
    if (fieldSchema.max !== undefined && value > fieldSchema.max) {
      return { valid: false, error: `Valor ${value} maior que máximo ${fieldSchema.max}` };
    }
  }
  
  // Objeto aninhado
  if (fieldSchema.type === 'object' && fieldSchema.schema) {
    for (const [key, subSchema] of Object.entries(fieldSchema.schema)) {
      if (value[key] === undefined) {
        value[key] = subSchema.default;
      } else {
        const result = validateField(value[key], subSchema);
        if (!result.valid) {
          return { valid: false, error: `${key}: ${result.error}` };
        }
      }
    }
  }
  
  // Array
  if (fieldSchema.type === 'array' && fieldSchema.itemSchema) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      for (const [key, subSchema] of Object.entries(fieldSchema.itemSchema)) {
        if (subSchema.required && item[key] === undefined) {
          return { valid: false, error: `Item[${i}].${key} é obrigatório` };
        }
        if (item[key] !== undefined) {
          const result = validateField(item[key], subSchema);
          if (!result.valid) {
            return { valid: false, error: `Item[${i}].${key}: ${result.error}` };
          }
        }
      }
    }
  }
  
  return { valid: true };
}

// Validar save completo
function validateSaveData(data) {
  const errors = [];
  
  // Validar cada campo
  for (const [field, fieldSchema] of Object.entries(SAVE_SCHEMA)) {
    if (fieldSchema.required && data[field] === undefined) {
      // Usar valor padrão se disponível
      if (fieldSchema.default !== undefined) {
        data[field] = fieldSchema.default;
      } else {
        errors.push(`Campo obrigatório ausente: ${field}`);
        continue;
      }
    }
    
    if (data[field] !== undefined) {
      const result = validateField(data[field], fieldSchema);
      if (!result.valid) {
        errors.push(`${field}: ${result.error}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data
  };
}

// Calcular checksum simples (para detectar corrupção)
function calculateChecksum(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Migrar save de versões antigas
function migrateSave(data, fromVersion) {
  console.log(`Migrando save da versão ${fromVersion} para ${SAVE_VERSION}`);
  
  // Migração v1 -> v2: adicionar sistema de moedas
  if (fromVersion < 2) {
    data.coins = data.coins || 0;
    data.gems = data.gems || 0;
  }
  
  // Migração v2 -> v3: adicionar shopItems se não existir
  if (fromVersion < 3) {
    data.shopItems = data.shopItems || [];
  }
  
  data.version = SAVE_VERSION;
  return data;
}

// Salvar jogo com validação
function saveGame() {
  try {
    const saveData = {
      version: SAVE_VERSION,
      level,
      xp,
      xpToNext,
      upgradePoints,
      upgrades: { ...upgrades }, // Clone para evitar referência
      coins,
      gems,
      shopItems: shopItems.map(item => ({
        id: item.id,
        owned: item.owned || false,
        level: item.level || 0,
        cost: item.cost || 100
      })),
      timestamp: Date.now()
    };
    
    // ✅ Adicionar conquistas ao save
    if (typeof ACHIEVEMENTS !== 'undefined' && typeof achievementStats !== 'undefined') {
      saveData.achievements = {
        unlocked: {},
        stats: achievementStats
      };
      
      for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        saveData.achievements.unlocked[id] = {
          unlocked: achievement.unlocked,
          current: achievement.current
        };
      }
    }
    
    // Validar dados antes de salvar
    const validation = validateSaveData(saveData);
    if (!validation.valid) {
      console.error('Erro ao validar save:', validation.errors);
      // Tentar salvar mesmo com erros, mas avisar
      showSaveWarning('Save pode estar corrompido: ' + validation.errors[0]);
    }
    
    // Adicionar checksum
    const dataForChecksum = { ...saveData };
    delete dataForChecksum.checksum;
    saveData.checksum = calculateChecksum(dataForChecksum);
    
    // Salvar
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(saveData));
    
    // Backup periódico (manter último backup)
    const backupKey = CONFIG.SAVE_KEY + '_backup';
    const existingBackup = localStorage.getItem(backupKey);
    if (!existingBackup || Date.now() - JSON.parse(existingBackup).timestamp > 3600000) {
      // Fazer backup a cada 1 hora
      localStorage.setItem(backupKey, JSON.stringify(saveData));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro crítico ao salvar:', error);
    return { success: false, error: error.message };
  }
}

// Carregar jogo com validação
function loadGame() {
  try {
    const savedData = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!savedData) {
      console.log('Nenhum save encontrado');
      return { success: false, reason: 'no_save' };
    }
    
    // Parse JSON
    let data;
    try {
      data = JSON.parse(savedData);
    } catch (parseError) {
      console.error('Erro ao fazer parse do save:', parseError);
      return attemptBackupRestore();
    }
    
    // Verificar versão e migrar se necessário
    const saveVersion = data.version || 1;
    if (saveVersion < SAVE_VERSION) {
      data = migrateSave(data, saveVersion);
    }
    
    // Verificar checksum se existir
    if (data.checksum) {
      const dataForChecksum = { ...data };
      const originalChecksum = data.checksum;
      delete dataForChecksum.checksum;
      const calculatedChecksum = calculateChecksum(dataForChecksum);
      
      if (originalChecksum !== calculatedChecksum) {
        console.warn('Checksum não corresponde! Save pode estar corrompido.');
        const useAnyway = confirm('Save pode estar corrompido. Tentar carregar mesmo assim?');
        if (!useAnyway) {
          return attemptBackupRestore();
        }
      }
    }
    
    // Validar dados
    const validation = validateSaveData(data);
    if (!validation.valid) {
      console.error('Save inválido:', validation.errors);
      return attemptBackupRestore();
    }
    
    // Aplicar dados validados
    data = validation.data;
    
    level = data.level;
    xp = data.xp;
    xpToNext = data.xpToNext;
    upgradePoints = data.upgradePoints;
    upgrades = data.upgrades;
    coins = data.coins || 0;
    gems = data.gems || 0;
    
    // Restaurar itens da loja
    if (data.shopItems && Array.isArray(data.shopItems)) {
      data.shopItems.forEach(savedItem => {
        const item = shopItems.find(i => i.id === savedItem.id);
        if (item) {
          item.owned = savedItem.owned || false;
          item.level = savedItem.level || 0;
          item.cost = savedItem.cost || item.cost;
        }
      });
      
      // Recalcular multiplicador de moedas
      const coinMult = shopItems.find(i => i.id === 'coin_multiplier');
      if (coinMult && coinMult.level) {
        coinMultiplier = 1 + (coinMult.level * 0.5);
      }
    }
    
    // ✅ Restaurar conquistas
    if (data.achievements && typeof ACHIEVEMENTS !== 'undefined') {
      if (data.achievements.unlocked) {
        for (const [id, savedData] of Object.entries(data.achievements.unlocked)) {
          if (ACHIEVEMENTS[id]) {
            ACHIEVEMENTS[id].unlocked = savedData.unlocked;
            ACHIEVEMENTS[id].current = savedData.current || 0;
          }
        }
      }
      
      if (data.achievements.stats && typeof achievementStats !== 'undefined') {
        achievementStats = { ...achievementStats, ...data.achievements.stats };
      }
    }
    
    console.log('Save carregado com sucesso!');
    return { success: true, data };
    
  } catch (error) {
    console.error('Erro crítico ao carregar save:', error);
    return attemptBackupRestore();
  }
}

// Tentar restaurar do backup
function attemptBackupRestore() {
  try {
    console.log('Tentando restaurar do backup...');
    const backupKey = CONFIG.SAVE_KEY + '_backup';
    const backupData = localStorage.getItem(backupKey);
    
    if (!backupData) {
      console.error('Nenhum backup disponível');
      return { success: false, reason: 'no_backup' };
    }
    
    const data = JSON.parse(backupData);
    const validation = validateSaveData(data);
    
    if (!validation.valid) {
      console.error('Backup também está corrompido');
      return { success: false, reason: 'backup_corrupted' };
    }
    
    // Restaurar do backup
    localStorage.setItem(CONFIG.SAVE_KEY, backupData);
    console.log('Backup restaurado com sucesso!');
    
    // Recarregar
    return loadGame();
    
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    return { success: false, reason: 'backup_failed', error: error.message };
  }
}

// Resetar save
function resetSave() {
  try {
    localStorage.removeItem(CONFIG.SAVE_KEY);
    localStorage.removeItem(CONFIG.SAVE_KEY + '_backup');
    console.log('Save resetado');
    location.reload();
  } catch (error) {
    console.error('Erro ao resetar save:', error);
  }
}

// Exportar save (para o usuário fazer backup manual)
function exportSave() {
  try {
    const savedData = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!savedData) {
      alert('Nenhum save para exportar');
      return;
    }
    
    const blob = new Blob([savedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hungry_shark_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Save exportado com sucesso');
  } catch (error) {
    console.error('Erro ao exportar save:', error);
    alert('Erro ao exportar save: ' + error.message);
  }
}

// Importar save
function importSave(fileContent) {
  try {
    const data = JSON.parse(fileContent);
    const validation = validateSaveData(data);
    
    if (!validation.valid) {
      alert('Save inválido: ' + validation.errors.join(', '));
      return false;
    }
    
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(validation.data));
    alert('Save importado com sucesso! Recarregando...');
    location.reload();
    return true;
    
  } catch (error) {
    console.error('Erro ao importar save:', error);
    alert('Erro ao importar save: ' + error.message);
    return false;
  }
}

// Mostrar aviso de save (integrar com UI se necessário)
function showSaveWarning(message) {
  console.warn('AVISO DE SAVE:', message);
  // Pode ser integrado com o sistema de notificações do jogo
}

// Auto-save periódico (chamar no game loop)
let lastAutoSave = 0;
const AUTO_SAVE_INTERVAL = 60000; // 1 minuto

function autoSave(currentTime) {
  if (currentTime - lastAutoSave > AUTO_SAVE_INTERVAL) {
    if (gameState === 'playing') {
      const result = saveGame();
      if (result.success) {
        console.log('Auto-save realizado');
      }
      lastAutoSave = currentTime;
    }
  }
}

// Verificar integridade do localStorage
function checkLocalStorageHealth() {
  try {
    const testKey = '__test_storage__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.name === 'QuotaExceededError' ? 'storage_full' : 'storage_error',
      message: error.message
    };
  }
}
