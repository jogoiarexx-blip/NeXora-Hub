// =============================================================
// Zeco e a Ilha das Gemas — Menu Principal
// Botões: Jogar, Como Jogar, Voltar, Jogar Novamente, Menu
// Depende de: jogo.js e audio.js (carregar ANTES deste arquivo)
// =============================================================
playBtn.addEventListener('click', () => {
  initAudio();
  goFullscreenLandscape();
  overlay.classList.add('hidden');
  resetGame();
  state.running = true;
});
howToBtn.addEventListener('click', () => {
  screenMenu.classList.add('hidden');
  screenHowTo.classList.remove('hidden');
});

howToBackBtn.addEventListener('click', () => {
  screenHowTo.classList.add('hidden');
  screenMenu.classList.remove('hidden');
});

startBtn.addEventListener('click', () => {
  initAudio();
  goFullscreenLandscape();
  overlay.classList.add('hidden');
  resetGame();
  state.running = true;
});

menuBtn.addEventListener('click', () => {
  screenEnd.classList.add('hidden');
  screenMenu.classList.remove('hidden');
});

