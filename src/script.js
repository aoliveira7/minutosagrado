/* ===========================================================
   MINUTO SAGRADO — LÓGICA DO JOGO
   Depende de data.js, que deve ser carregado antes deste arquivo.
=========================================================== */

  /* ===========================================================
     ÍCONES REUTILIZÁVEIS
  =========================================================== */
  const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
  const ICON_LEAF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13c0-5 4-9 9-9 5 0 5 5 5 5s-1 9-9 9c-3 0-5-2-5-5z"/><path d="M5 13c4-1 7-3 9-9"/></svg>';

  /* ===========================================================
     UTILITÁRIOS GERAIS
  =========================================================== */
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function truncateText(str, max){
    str = String(str);
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
  }

  /* ===========================================================
     ÍCONES EXTRAS
  =========================================================== */
  const ICON_WHATSAPP = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.6 0-3.1-.43-4.4-1.18l-.32-.18-3.01.79.8-2.93-.2-.32A7.94 7.94 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.4-5.9c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28z"/></svg>';
  const TIMER_CIRC = 175.93;

  /* ===========================================================
     ESTADO DA APLICAÇÃO
  =========================================================== */
  const ROUND_QUESTION_LIMIT = 10;
  const JOURNEY_STAGE_LIMIT = 5;

  const state = {
    mode: null,
    index: 0,
    score: 0,
    streak: 0,
    jornadaModuleIndex: null,
    helperUsed: false,
    answered: false,
    questionStart: 0,
    timerInterval: null,
    timeLeft: 0,
    timerTotal: 20,
    currentItem: null,
    roundItems: []
  };

  const stats = {
    totalAnswered: 0,
    totalCorrect: 0,
    bestStreak: 0,
    antigoCount: 0,
    novoCount: 0,
    antigoCorrect: 0,
    novoCorrect: 0,
    dayStreak: 0,
    categoriesPlayed: new Set()
  };

  /* ===========================================================
     SEQUÊNCIA DE DIAS JOGADOS (BÔNUS DE ENGAJAMENTO)
  =========================================================== */
  function computeDayStreak(){
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem('ms_lastPlayDate');
    let streak = parseInt(localStorage.getItem('ms_dayStreak') || '0', 10) || 0;

    if(lastDate !== today){
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = (lastDate === yesterday) ? streak + 1 : 1;
      localStorage.setItem('ms_dayStreak', String(streak));
      localStorage.setItem('ms_lastPlayDate', today);
    }
    return streak;
  }

  /* ===========================================================
     NAVEGAÇÃO ENTRE TELAS
  =========================================================== */
  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  function resetRoundState(){
    stopTimer();
    state.index = 0;
    state.score = 0;
    state.streak = 0;
    state.helperUsed = false;
    state.answered = false;
  }

  function openMode(modeId){
    resetRoundState();
    state.mode = modeId;
    prepareRoundItems();
    const gameScreen = document.getElementById('game-screen');
    gameScreen.classList.toggle('kids-screen', modeId === 'kids');
    showScreen('game-screen');
    renderGame();
  }

  function openJourney(){
    resetRoundState();
    state.mode = 'jornadaTimeline';
    document.getElementById('game-screen').classList.remove('kids-screen');
    showScreen('game-screen');
    renderGame();
  }

  function startJourneyModule(idx){
    resetRoundState();
    state.mode = 'jornadaModule';
    state.jornadaModuleIndex = idx;
    prepareRoundItems();
    renderGame();
  }

  function backToJourneyTimeline(){
    state.mode = 'jornadaTimeline';
    renderGame();
  }

  function openAchievements(){
    showScreen('achievements-screen');
    renderAchievements();
  }

  function goBackToMenu(){
    stopTimer();
    showScreen('dashboard');
  }

  /* ===========================================================
     ACESSO AOS DADOS DA RODADA ATUAL
  =========================================================== */
  /* Embaralha um array (Fisher-Yates) sem alterar o original */
  function shuffleArray(arr){
    const copy = arr.slice();
    for(let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /* Retorna apenas as perguntas da categoria informada, usando acesso direto
     a CATEGORY_ARRAYS/GAME_DATA — evita varrer o questionBank inteiro */
  function getQuestionsByCategory(categoria){
    return CATEGORY_ARRAYS[categoria] || (GAME_DATA[categoria] && GAME_DATA[categoria].items) || [];
  }

  /* Sorteia as perguntas da nova rodada, respeitando o corte de cada modo,
     e armazena o resultado em state.roundItems para manter a rodada estável */
  function prepareRoundItems(){
    if(state.mode === 'jornadaModule'){
      const pool = getQuestionsByCategory(JORNADA_MODULES[state.jornadaModuleIndex].titulo);
      state.roundItems = shuffleArray(pool).slice(0, JOURNEY_STAGE_LIMIT);
    } else {
      const pool = getQuestionsByCategory(state.mode);
      state.roundItems = shuffleArray(pool).slice(0, ROUND_QUESTION_LIMIT);
    }
  }

  /* Retorna as perguntas sorteadas para a rodada atual */
  function getRoundItems(){
    return state.roundItems;
  }

  function getCurrentItem(){
    return getRoundItems()[state.index];
  }

  /* Embaralha a ordem das alternativas, recalculando o índice da resposta correta */
  function shuffleOptions(item){
    const order = item.opcoes.map((_, i) => i);
    for(let i = order.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return {
      ...item,
      opcoes: order.map(i => item.opcoes[i]),
      correta: order.indexOf(item.correta)
    };
  }

  function getCurrentTotal(){
    return getRoundItems().length;
  }

  function getCurrentTimer(){
    if(state.mode === 'jornadaModule') return 20;
    return GAME_DATA[state.mode].timer;
  }

  function helperAvailable(){
    if(state.mode === 'jornadaModule') return true;
    const mode = GAME_DATA[state.mode];
    return !!(mode && mode.helper);
  }

  /* ===========================================================
     RENDERIZAÇÃO PRINCIPAL DO JOGO
  =========================================================== */
  function renderGame(){
    if(state.mode === 'jornadaTimeline'){ renderJourneyTimeline(); return; }

    if(state.mode !== 'jornadaModule' && GAME_DATA[state.mode].type === 'hardchoices'){
      renderHardChoice();
      return;
    }

    renderQuestion();
  }

  function renderQuestion(){
    state.answered = false;
    state.helperUsed = false;
    state.questionStart = Date.now();

    const item = shuffleOptions(getCurrentItem());
    state.currentItem = item;
    const total = getCurrentTotal();
    const progressPct = Math.round((state.index / total) * 100);

    let tag, title, subtitle, type;
    if(state.mode === 'jornadaModule'){
      const module = JORNADA_MODULES[state.jornadaModuleIndex];
      tag = 'Modo Clássico · Jornada';
      title = module.titulo;
      subtitle = module.descricao;
      type = 'jornada';
    } else {
      const mode = GAME_DATA[state.mode];
      tag = mode.tag;
      title = mode.title;
      subtitle = mode.subtitle;
      type = mode.type;
    }

    const questionHtml = renderQuestionCard(item, type, total);
    const optionsHtml = renderOptions(item, type);
    const showEliminateHelper = helperAvailable() && type !== 'truefalse';
    const showActionsRow = type !== 'connections' && type !== 'enigma';
    const actionsHtml = showActionsRow ? renderQuestionActions(showEliminateHelper) : '';

    document.getElementById('game-content').innerHTML = `
      <div class="game-tag">${tag}</div>
      <h1 class="game-title">${title}</h1>
      <p class="game-subtitle">${subtitle}</p>
      <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
      <div class="stats-row">
        <div class="stats-pill"><div class="stats-value">${state.score}</div><div class="stats-label">Pontos</div></div>
        <div class="stats-pill"><div class="stats-value">${state.streak} 🔥</div><div class="stats-label">Sequência</div></div>
      </div>
      <div class="timer-wrap">
        <div class="timer-circle">
          <svg viewBox="0 0 64 64">
            <circle class="timer-bg" cx="32" cy="32" r="28"></circle>
            <circle class="timer-fg" id="timer-fg" cx="32" cy="32" r="28"></circle>
          </svg>
          <div class="timer-text" id="timer-text">${getCurrentTimer()}</div>
        </div>
      </div>
      ${questionHtml}
      ${optionsHtml}
      ${actionsHtml}
    `;

    startTimer(getCurrentTimer());
  }

  /* Monta a fileira de ações de apoio (dicas) abaixo das alternativas */
  function renderQuestionActions(showEliminateHelper){
    const eliminateBtn = showEliminateHelper
      ? `<button class="hint-btn" id="helper-btn" onclick="useHelper()">🧩 Eliminar 2 Erradas</button>`
      : '';
    return `
      <div class="question-actions">
        ${eliminateBtn}
        <button class="hint-btn" id="golden-hint-btn" onclick="showGoldenHint()">✨ Dica de Ouro</button>
      </div>
      <div class="golden-hint-box" id="golden-hint-box" hidden></div>
    `;
  }


  function renderQuestionCard(item, type, total){
    if(type === 'connections'){
      const wordsHtml = item.palavras.map(w => `<div class="connection-word">${w}</div>`).join('');
      return `
        <div class="question-card">
          <div class="q-label">Conexão ${state.index + 1} de ${total}</div>
          <h2>${item.enunciado}</h2>
        </div>
        <div class="connections-words">${wordsHtml}</div>
      `;
    }
    if(type === 'enigma'){
      return `
        <div class="question-card">
          <div class="q-label">Enigma ${state.index + 1} de ${total}</div>
          <p class="verse-quote">${item.enunciado}</p>
          <p class="verse-source">${item.referencia}</p>
        </div>
      `;
    }
    if(type === 'truefalse'){
      return `
        <div class="question-card">
          <div class="q-label">Afirmação ${state.index + 1} de ${total}</div>
          <h2>${item.enunciado}</h2>
        </div>
      `;
    }
    return `
      <div class="question-card">
        <div class="q-label">Pergunta ${state.index + 1} de ${total}</div>
        <h2>${item.enunciado}</h2>
      </div>
    `;
  }

  function renderOptions(item, type){
    if(type === 'truefalse'){
      return `
        <div class="tf-row" id="options-area">
          <button class="tf-btn" onclick="selectAnswer(0)">${item.opcoes[0]}</button>
          <button class="tf-btn" onclick="selectAnswer(1)">${item.opcoes[1]}</button>
        </div>
      `;
    }
    if(type === 'enigma'){
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const optionsHtml = item.opcoes.map((opt, idx) =>
        `<button class="option-btn" onclick="selectAnswer(${idx})"><span class="letter">${letters[idx]}</span>${opt}</button>`
      ).join('');
      return `<div class="options" id="options-area">${optionsHtml}</div>`;
    }
    const optionsHtml = item.opcoes.map((opt, idx) =>
      `<button class="option-btn" onclick="selectAnswer(${idx})">${opt}</button>`
    ).join('');
    return `<div class="options" id="options-area">${optionsHtml}</div>`;
  }

  /* ===========================================================
     CRONÔMETRO CIRCULAR
  =========================================================== */
  function startTimer(seconds){
    state.timeLeft = seconds;
    state.timerTotal = seconds;
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      updateTimerDisplay();
      if(state.timeLeft <= 0){
        stopTimer();
        handleAnswer(-1);
      }
    }, 1000);
  }

  function stopTimer(){
    if(state.timerInterval){
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function updateTimerDisplay(){
    const fg = document.getElementById('timer-fg');
    const text = document.getElementById('timer-text');
    if(!fg || !text) return;
    const pct = Math.max(0, state.timeLeft / state.timerTotal);
    fg.style.strokeDashoffset = (TIMER_CIRC * (1 - pct)).toFixed(2);
    text.textContent = Math.max(0, state.timeLeft);
    const warning = state.timeLeft <= 5;
    fg.classList.toggle('warning', warning);
    text.classList.toggle('warning', warning);
  }

  /* ===========================================================
     AJUDA — ELIMINAR 2 ERRADAS (50/50)
  =========================================================== */
  function useHelper(){
    if(state.helperUsed || state.answered) return;
    const item = state.currentItem;
    const buttons = document.querySelectorAll('#options-area .option-btn');
    const wrongIndexes = [];
    buttons.forEach((b, i) => { if(i !== item.correta) wrongIndexes.push(i); });

    for(let i = wrongIndexes.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [wrongIndexes[i], wrongIndexes[j]] = [wrongIndexes[j], wrongIndexes[i]];
    }
    wrongIndexes.slice(0, 2).forEach(i => buttons[i].classList.add('eliminated'));

    state.helperUsed = true;
    const btn = document.getElementById('helper-btn');
    if(btn){
      btn.disabled = true;
      btn.classList.add('used');
    }
  }

  /* ===========================================================
     AJUDA — DICA DE OURO ("VOCÊ SABIA?")
  =========================================================== */
  function showGoldenHint(){
    const item = state.currentItem;
    const box = document.getElementById('golden-hint-box');
    if(!item || !box || !item.voceSabia) return;
    box.textContent = `✨ ${item.voceSabia}`;
    box.hidden = false;

    const btn = document.getElementById('golden-hint-btn');
    if(btn) btn.classList.add('used');
  }

  /* ===========================================================
     RESPOSTAS, PONTUAÇÃO E FEEDBACK
  =========================================================== */
  const feedbackAcerto = [
    'Você está mostrando ser um discípulo fiel, continue assim!',
    'Muito bem, você está iluminando!',
    'Resposta certeira! Continue nessa caminhada.',
    'Parabéns, seu conhecimento bíblico está crescendo!',
    'Isso! A Palavra está viva em você.',
    'Excelente! Sua fé e seu conhecimento caminham juntos.',
    'Acertou em cheio! Continue buscando a sabedoria das Escrituras.',
    'Que bênção! Você está cada vez mais preparado.',
    'Sensacional! Sua dedicação ao estudo está dando frutos.',
    'Mandou bem! Siga firme nessa jornada de fé.',
    'Excelente resposta! Você está no caminho certo.',
    'Maravilha! Seu coração está atento à Palavra.'
  ];

  const feedbackErro = [
    'Continue, não desista. Não tem problema errar, é errando que se aprende.',
    'A palavra é um aprendizado diário, tente novamente na próxima!',
    'Não desanime! A jornada do conhecimento é longa e gratificante.',
    'Tudo bem errar! O importante é continuar buscando.',
    'Não foi essa, mas sua caminhada continua. Vamos para a próxima!',
    'Cada erro é um passo a mais rumo ao aprendizado. Siga em frente!',
    'Calma, ninguém acerta tudo. Continue firme na jornada!',
    'Não se preocupe, a sabedoria vem com a prática. Tente de novo!',
    'Essa não foi, mas sua fé e dedicação valem mais que qualquer ponto.',
    'Erros fazem parte do caminho. Continue confiando e aprendendo!',
    'Sem pressa! A cada pergunta você se aproxima mais da Palavra.',
    'Levante a cabeça e siga! A próxima pergunta é sua chance de brilhar.'
  ];

  function selectAnswer(idx){
    handleAnswer(idx);
  }

  function handleAnswer(idx){
    if(state.answered) return;
    state.answered = true;
    stopTimer();

    const item = state.currentItem;
    const correct = idx === item.correta;
    const elapsed = (Date.now() - state.questionStart) / 1000;

    const isTrueFalse = state.mode !== 'jornadaModule' && GAME_DATA[state.mode].type === 'truefalse';
    const selector = isTrueFalse ? '.tf-btn' : '.option-btn';
    const buttons = document.querySelectorAll('#options-area ' + selector);
    buttons.forEach((b, i) => {
      b.classList.add('disabled');
      if(i === item.correta) b.classList.add('correct');
      else if(i === idx) b.classList.add('wrong');
    });

    let points = 0;
    const breakdown = [];
    if(correct){
      points += 100;
      breakdown.push({ label: '+100 acerto', bonus: false });
      if(elapsed < 5){
        points += 50;
        breakdown.push({ label: '+50 velocidade', bonus: true });
      }
      state.streak++;
      if(state.streak > 0 && state.streak % 3 === 0){
        points += 20;
        breakdown.push({ label: '+20 combo', bonus: true });
      }
      if(stats.dayStreak > 1){
        const dayBonus = Math.min((stats.dayStreak - 1) * 10, 50);
        points += dayBonus;
        breakdown.push({ label: `+${dayBonus} sequência diária (${stats.dayStreak}d)`, bonus: true });
      }
    } else {
      state.streak = 0;
    }
    state.score += points;

    updateStats(item, correct);

    setTimeout(() => renderFeedback(correct, item, breakdown), 900);
  }

  /* ===========================================================
     ESTATÍSTICAS DO JOGADOR
  =========================================================== */
  function updateStats(item, correct){
    stats.totalAnswered++;
    if(correct){
      stats.totalCorrect++;
      stats.bestStreak = Math.max(stats.bestStreak, state.streak);
    }
    if(item.testamento === 'Antigo'){
      stats.antigoCount++;
      if(correct) stats.antigoCorrect++;
    }
    if(item.testamento === 'Novo'){
      stats.novoCount++;
      if(correct) stats.novoCorrect++;
    }
    if(state.mode) stats.categoriesPlayed.add(state.mode);
    checkAchievements();
  }

  function renderFeedback(correct, item, breakdown){
    const title = correct ? 'Parabéns, você acertou!' : 'Não foi desta vez...';
    const titleClass = correct ? 'correct' : 'wrong';
    const icon = correct ? '✨' : '🙏';
    const feedbackPool = correct ? feedbackAcerto : feedbackErro;
    const message = feedbackPool[Math.floor(Math.random() * feedbackPool.length)];
    const chips = breakdown.map(b => `<span class="points-chip${b.bonus ? ' bonus' : ''}">${b.label}</span>`).join('');
    const pointsHtml = breakdown.length ? `<div class="points-row">${chips}</div>` : '';
    const correctAnswerHtml = correct ? '' : `
        <div class="feedback-ref-card answer-card">
          <div class="ref-label answer-label">Resposta Correta</div>
          <p class="ref-value">${item.opcoes[item.correta]}</p>
        </div>
    `;

    document.getElementById('game-content').innerHTML = `
      <div class="feedback-screen">
        <div class="feedback-icon">${icon}</div>
        <h2 class="feedback-title ${titleClass}">${title}</h2>
        <p class="feedback-message">${message}</p>
        ${pointsHtml}
        ${correctAnswerHtml}
        <div class="feedback-ref-card">
          <div class="ref-label">Referência Bíblica</div>
          <p class="ref-value">${item.referencia}</p>
          <p class="ref-book">Livro de ${item.livroBiblico} · ${item.testamento} Testamento</p>
        </div>
        <div class="feedback-curiosity">
          <div class="cur-label">💡 Você Sabia?</div>
          <p>${item.voceSabia}</p>
        </div>
      </div>
      <button class="continue-btn" onclick="nextQuestion()">Continuar</button>
    `;
  }

  function nextQuestion(){
    const total = getCurrentTotal();
    if(state.index < total - 1){
      state.index++;
      renderGame();
    } else if(state.mode === 'jornadaModule'){
      finishJourneyModule();
    } else {
      renderRoundEnd();
    }
  }

  function renderRoundEnd(){
    const mode = GAME_DATA[state.mode];
    const waText = `Acabei de jogar "${mode.title}" no MINUTO SAGRADO e fiz ${state.score} pontos! Topa o desafio? https://minutosagrado.com`;
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(waText);

    document.getElementById('game-content').innerHTML = `
      <div class="game-tag">${mode.tag}</div>
      <h1 class="game-title">${mode.title}</h1>
      <div class="finish-box">
        <div class="emoji">✨</div>
        <h2>Rodada Concluída!</h2>
        <div class="score">${state.score} pts</div>
        <p>Sua melhor sequência foi de ${stats.bestStreak} acertos seguidos.</p>
        <p>Volte amanhã para novos desafios.</p>
      </div>
      <a class="whatsapp-btn" href="${waUrl}" target="_blank" rel="noopener">${ICON_WHATSAPP}Desafiar Irmão/Amigo no WhatsApp</a>
      <button class="continue-btn ghost" onclick="goBackToMenu()">Voltar ao Menu</button>
    `;
  }

  /* ===========================================================
     JORNADA CRONOLÓGICA (TIMELINE)
  =========================================================== */
  function renderJourneyTimeline(){
    const modulesHtml = JORNADA_MODULES.map((m, idx) => {
      if(!m.desbloqueado){
        return `
          <div class="timeline-module locked">
            <div class="timeline-dot">${ICON_LOCK}</div>
            <div class="timeline-card">
              <h3>${m.titulo}</h3>
              <p>${m.descricao}</p>
            </div>
          </div>
        `;
      }
      return `
        <div class="timeline-module">
          <div class="timeline-dot">${ICON_LEAF}</div>
          <div class="timeline-card">
            <h3>${m.titulo}</h3>
            <p>${m.descricao}</p>
            <div class="timeline-progress">${m.respondidas}/${Math.min(m.perguntas.length, JOURNEY_STAGE_LIMIT)} perguntas</div>
            <button class="start-btn" onclick="startJourneyModule(${idx})">Iniciar</button>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('game-content').innerHTML = `
      <div class="game-tag">Modo Clássico</div>
      <h1 class="game-title">Jornada Cronológica</h1>
      <div class="journey-intro">
        <h2>Jornada Sagrada</h2>
        <p>Atravesse a história sagrada em ordem, do Gênesis ao Apocalipse. Responda as perguntas de cada etapa para avançar.</p>
      </div>
      <div class="timeline">${modulesHtml}</div>
    `;
  }

  function finishJourneyModule(){
    const module = JORNADA_MODULES[state.jornadaModuleIndex];
    module.respondidas = getRoundItems().length;
    const nextModule = JORNADA_MODULES[state.jornadaModuleIndex + 1];
    if(nextModule) nextModule.desbloqueado = true;
    const unlockMsg = nextModule
      ? `<p>A etapa <strong>${nextModule.titulo}</strong> foi desbloqueada na jornada.</p>`
      : `<p>Você concluiu todas as etapas disponíveis da jornada!</p>`;

    document.getElementById('game-content').innerHTML = `
      <div class="game-tag">Modo Clássico · Jornada</div>
      <h1 class="game-title">${module.titulo}</h1>
      <div class="finish-box">
        <div class="emoji">✨</div>
        <h2>Etapa Concluída!</h2>
        <div class="score">${state.score} pts</div>
        <p>Sua sequência máxima nesta etapa foi de ${stats.bestStreak} acertos seguidos.</p>
        ${unlockMsg}
      </div>
      <button class="continue-btn" onclick="backToJourneyTimeline()">Voltar à Jornada</button>
      <button class="continue-btn ghost" onclick="goBackToMenu()">Voltar ao Menu</button>
    `;
  }

  /* ===========================================================
     ESCOLHAS DIFÍCEIS
  =========================================================== */
  function renderHardChoice(){
    const item = getCurrentItem();
    const total = getCurrentTotal();
    const progressPct = Math.round((state.index / total) * 100);
    state.answered = false;

    const optionsHtml = item.opcoes.map((opt, idx) =>
      `<button class="option-btn" onclick="selectHardChoice(${idx})">${opt.texto}</button>`
    ).join('');

    document.getElementById('game-content').innerHTML = `
      <div class="game-tag">${GAME_DATA.hardchoices.tag}</div>
      <h1 class="game-title">${GAME_DATA.hardchoices.title}</h1>
      <p class="game-subtitle">${GAME_DATA.hardchoices.subtitle}</p>
      <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
      <div class="question-card">
        <div class="q-label">Dilema ${state.index + 1} de ${total}</div>
        <h2>${item.titulo}</h2>
        <p class="support">${item.enunciado}</p>
      </div>
      <div class="options" id="options-area">${optionsHtml}</div>
      <div id="outcome-area"></div>
    `;
  }

  function selectHardChoice(idx){
    if(state.answered) return;
    state.answered = true;

    const item = getCurrentItem();
    const buttons = document.querySelectorAll('#options-area .option-btn');
    buttons.forEach((b, i) => {
      b.classList.add('disabled');
      if(i === idx) b.classList.add('correct');
    });

    const barsHtml = item.opcoes.map((opt, i) => `
      <div class="outcome-bar-row">
        <div class="bar-label"><span>${opt.texto}</span><span>${opt.percent}%</span></div>
        <div class="percent-bar"><div class="percent-fill ${i === idx ? 'chosen' : 'other'}" id="bar-${i}"></div></div>
      </div>
    `).join('');

    document.getElementById('outcome-area').innerHTML = `
      <div class="outcome-box">
        <h4>Desfecho</h4>
        <p>${item.opcoes[idx].desfecho}</p>
        <div class="outcome-compare">${barsHtml}</div>
      </div>
      <div class="feedback-curiosity" style="margin-top:14px;">
        <div class="cur-label">💡 Você Sabia?</div>
        <p>${item.voceSabia}</p>
      </div>
    `;

    setTimeout(() => {
      item.opcoes.forEach((opt, i) => {
        const bar = document.getElementById('bar-' + i);
        if(bar) bar.style.width = opt.percent + '%';
      });
    }, 60);

    appendHardChoiceContinue();
  }

  function appendHardChoiceContinue(){
    const isLast = state.index >= getCurrentTotal() - 1;
    const btn = document.createElement('button');
    btn.className = 'continue-btn';
    btn.textContent = isLast ? 'Concluir' : 'Continuar';
    btn.onclick = () => {
      if(isLast){
        renderHardChoiceEnd();
      } else {
        state.index++;
        renderGame();
      }
    };
    document.getElementById('game-content').appendChild(btn);
  }

  function renderHardChoiceEnd(){
    const waText = 'Acabei de jogar "Escolhas Difíceis" no MINUTO SAGRADO! Será que você tomaria as mesmas decisões? https://minutosagrado.com';
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(waText);

    document.getElementById('game-content').innerHTML = `
      <div class="game-tag">Modo Especial</div>
      <h1 class="game-title">Escolhas Difíceis</h1>
      <div class="finish-box">
        <div class="emoji">✨</div>
        <h2>Concluído!</h2>
        <p>Suas escolhas moldaram o desfecho de cada história de hoje.</p>
        <p>Volte amanhã para novos dilemas.</p>
      </div>
      <a class="whatsapp-btn" href="${waUrl}" target="_blank" rel="noopener">${ICON_WHATSAPP}Desafiar Irmão/Amigo no WhatsApp</a>
      <button class="continue-btn ghost" onclick="goBackToMenu()">Voltar ao Menu</button>
    `;
  }

  /* ===========================================================
     CONQUISTAS
  =========================================================== */
  function computeAchievementProgress(catIdx, itemIdx){
    const item = ACHIEVEMENTS[catIdx].items[itemIdx];
    const key = catIdx + '-' + itemIdx;
    switch(key){
      case '0-0': return { progress: Math.min(stats.totalAnswered, 10), total: 10 };
      case '0-1': return { progress: Math.min(stats.totalAnswered, 20), total: 20 };
      case '0-2': return { progress: Math.min(stats.bestStreak, 5), total: 5 };
      case '0-3': return { progress: Math.min(stats.novoCount, 10) + Math.min(stats.antigoCount, 15), total: 25 };
      case '1-0': return { progress: Math.min(stats.totalCorrect, 50), total: 50 };
      case '1-1': return { progress: Math.min(stats.bestStreak, 10), total: 10 };
      case '2-0': return { progress: Math.min(stats.totalCorrect, 100), total: 100 };
      case '2-1': return { progress: Math.min(stats.categoriesPlayed.size, 8), total: 8 };
      case '3-0': {
        const teologoUnlocked = ACHIEVEMENTS[2].items[1].unlocked ? 1 : 0;
        const streakDone = stats.bestStreak >= 20 ? 1 : 0;
        return { progress: teologoUnlocked + streakDone, total: 2 };
      }
      default: return { progress: item.progress, total: item.total };
    }
  }

  function renderAchievements(){
    let html = `
      <div class="game-tag">Conquistas</div>
      <h1 class="game-title">Caixa de Conquistas</h1>
      <p class="game-subtitle">Acompanhe seu progresso espiritual e desbloqueie medalhas exclusivas.</p>
    `;

    ACHIEVEMENTS.forEach((category, catIdx) => {
      html += `
        <div class="category-header${catIdx === 0 ? ' first' : ''}">
          <span class="category-dot ${category.dotClass}"></span>
          <span class="category-title">${category.category}</span>
        </div>
      `;
      category.items.forEach((item, itemIdx) => {
        const { progress, total } = computeAchievementProgress(catIdx, itemIdx);
        const pct = Math.min(100, Math.round((progress / total) * 100));
        const unlocked = progress >= total;
        const unlockedClass = unlocked ? ' unlocked' : '';
        const icon = unlocked ? ICON_CHECK : ICON_LOCK;
        const meta = unlocked
          ? `<span class="unlocked-badge">Desbloqueado</span>`
          : `
            <div class="achievement-progress-bar"><div class="achievement-progress-fill" style="width:${pct}%"></div></div>
            <div class="achievement-progress-label">${progress}/${total} concluído</div>
          `;

        html += `
          <div class="achievement-item rarity-${category.rarityClass}${unlockedClass}">
            <div class="achievement-icon">${icon}</div>
            <div class="achievement-body">
              <h4>${item.title}</h4>
              <p>${item.desc}</p>
              ${meta}
            </div>
          </div>
        `;
      });
    });

    html += `<button class="share-achievements-btn" onclick="shareAchievementsNative()">✨ Compartilhar Conquistas</button>`;

    document.getElementById('achievements-content').innerHTML = html;
  }

  /* ===========================================================
     CONQUISTAS — DESBLOQUEIO AUTOMÁTICO E NOTIFICAÇÃO
  =========================================================== */
  let achievementQueue = [];
  let achievementModalShowing = false;

  function checkAchievements(){
    ACHIEVEMENTS.forEach((category, catIdx) => {
      category.items.forEach((item, itemIdx) => {
        if(item.notified) return;
        const { progress, total } = computeAchievementProgress(catIdx, itemIdx);
        if(progress >= total){
          item.unlocked = true;
          item.notified = true;
          achievementQueue.push(item.title);
        }
      });
    });

    if(document.getElementById('achievements-content')){
      renderAchievements();
    }

    if(!achievementModalShowing) showNextAchievement();
  }

  function showNextAchievement(){
    if(achievementQueue.length === 0){
      achievementModalShowing = false;
      return;
    }
    achievementModalShowing = true;
    const title = achievementQueue.shift();
    document.getElementById('achievement-modal-text').textContent =
      `Parabéns! Você desbloqueou a conquista: ${title}!`;
    document.getElementById('achievement-modal-overlay').classList.add('active');
  }

  function closeAchievementModal(){
    document.getElementById('achievement-modal-overlay').classList.remove('active');
    showNextAchievement();
  }

  function getUnlockedAchievements(){
    const unlocked = [];
    ACHIEVEMENTS.forEach(category => {
      category.items.forEach(item => {
        if(item.unlocked) unlocked.push(item.title);
      });
    });
    return unlocked;
  }

  function getFeaturedAchievement(){
    const unlocked = getUnlockedAchievements();
    return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
  }

  /* ===========================================================
     FEED DE INSPIRAÇÃO
  =========================================================== */
  const FEED_PAGE_SIZE = 3;
  let feedInspiracaoAtual = [];
  let feedInspiracaoVisivel = FEED_PAGE_SIZE;

  function renderFeedInspiracao(){
    feedInspiracaoAtual = shuffleArray(inspiracoes);
    feedInspiracaoVisivel = FEED_PAGE_SIZE;
    renderFeedInspiracaoCards();
  }

  function renderFeedInspiracaoCards(){
    const visiveis = feedInspiracaoAtual.slice(0, feedInspiracaoVisivel);
    const cardsHtml = visiveis.map((item, idx) => `
      <div class="feed-card">
        <div class="item-tag">${item.categoria}</div>
        <p class="item-text">"${item.texto}"</p>
        <p class="item-ref">${item.referencia}</p>
        <button class="feed-share-btn" onclick="shareFeedArte(${idx})">✨ Gerar e Compartilhar Arte</button>
      </div>
    `).join('');
    const loadMoreHtml = feedInspiracaoVisivel < feedInspiracaoAtual.length
      ? `<button class="feed-load-more-btn" onclick="loadMoreInspiracoes()">Ver mais inspirações</button>`
      : '';
    document.getElementById('feed-inspiracao').innerHTML = cardsHtml + loadMoreHtml;
  }

  function loadMoreInspiracoes(){
    feedInspiracaoVisivel = Math.min(feedInspiracaoVisivel + FEED_PAGE_SIZE, feedInspiracaoAtual.length);
    renderFeedInspiracaoCards();
  }

  function shareFeedArte(idx){
    const item = feedInspiracaoAtual[idx];
    document.getElementById('arte-tag').textContent = item.categoria;
    document.getElementById('arte-texto').textContent = '"' + item.texto + '"';
    document.getElementById('arte-ref').textContent = '— ' + item.referencia;

    const node = document.getElementById('arte-compartilhavel');
    html2canvas(node, { scale: 2, backgroundColor: null }).then(canvas => {
      const blob = dataURLtoBlob(canvas.toDataURL('image/png'));
      const file = new File([blob], 'minuto-sagrado.png', { type: 'image/png' });
      const text = '"' + item.texto + '"' + ' — ' + item.referencia + '\n\nVeja esta mensagem inspiradora do Minuto Sagrado! Jogue agora: https://www.minutosagrado.com.br';

      if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
        navigator.share({ files: [file], title: 'Minuto Sagrado', text }).catch(() => {});
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'minuto-sagrado.png';
        link.click();
      }
    });
  }

  /* ===========================================================
     INDICAÇÃO (BOTÃO FLUTUANTE DE COMPARTILHAR O JOGO)
  =========================================================== */
  async function shareGameInvite(){
    const shareData = {
      title: 'Minuto Sagrado',
      text: 'Você consegue vencer o Minuto Sagrado? 🏆 Aceite o desafio e teste seus conhecimentos bíblicos aqui: https://www.minutosagrado.com.br'
    };

    if(navigator.share && (!navigator.canShare || navigator.canShare(shareData))){
      try{
        await navigator.share(shareData);
        return;
      }catch(err){
        /* segue para o fallback de cópia abaixo */
      }
    }

    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(shareData.text).then(() => alert('Desafio copiado! Cole no seu WhatsApp.'));
    } else {
      alert(`Compartilhe o desafio: ${shareData.text}`);
    }
  }

  /* ===========================================================
     RESET DE PROGRESSO
  =========================================================== */
  function resetProgress(event, modeName){
    event.stopPropagation();
    if(confirm(`Deseja realmente zerar o progresso de "${modeName}"?`)){
      alert(`Progresso de "${modeName}" reiniciado com sucesso!`);
    }
  }

  function resetAllGame(){
    if(confirm('Tem certeza que deseja zerar TODO o progresso do jogo? Esta ação não pode ser desfeita.')){
      stats.totalAnswered = 0;
      stats.totalCorrect = 0;
      stats.bestStreak = 0;
      stats.antigoCount = 0;
      stats.novoCount = 0;
      stats.antigoCorrect = 0;
      stats.novoCorrect = 0;
      stats.categoriesPlayed.clear();
      state.score = 0;
      state.streak = 0;
      JORNADA_MODULES.forEach((m, i) => { m.desbloqueado = (i === 0); m.respondidas = 0; });
      ACHIEVEMENTS.forEach(cat => cat.items.forEach(it => {
        it.unlocked = false;
        it.notified = false;
      }));
      achievementQueue = [];
      achievementModalShowing = false;
      document.getElementById('achievement-modal-overlay').classList.remove('active');

      if(document.getElementById('achievements-content')) renderAchievements();
      renderStats();

      alert('Todo o progresso do Minuto Sagrado foi reiniciado!');
    }
  }

  /* ===========================================================
     SHEETS: COMPARTILHAR / ANÁLISE / PAINEL DO CURADOR
  =========================================================== */
  let currentShareData = null;

  function openShareSheet(type, payload){
    closeAllSheets();
    const titleEl = document.getElementById('share-sheet-title');
    const tagEl = document.getElementById('preview-tag');
    const textEl = document.getElementById('preview-text');

    document.getElementById('art-preview').innerHTML = '';

    if(type === 'achievements'){
      const unlockedTitles = getUnlockedAchievements();
      const featured = unlockedTitles.length > 0 ? unlockedTitles[unlockedTitles.length - 1] : null;
      titleEl.textContent = 'Compartilhar Conquistas';
      if(featured){
        tagEl.textContent = unlockedTitles.length === 1 ? '🏆 Conquista Desbloqueada' : `🏆 ${unlockedTitles.length} Conquistas Desbloqueadas`;
        textEl.textContent = `Desbloqueei a conquista "${featured}" no MINUTO SAGRADO!`;
      } else {
        tagEl.textContent = 'Minuto Sagrado';
        textEl.textContent = 'Estou jogando o MINUTO SAGRADO e desafiando minha sabedoria bíblica!';
      }
      currentShareData = { type: 'achievements', tag: tagEl.textContent, text: textEl.textContent, ref: '', achievementTitle: featured, achievementTitles: unlockedTitles };
    } else if(type === 'stats'){
      const total = stats.totalAnswered;
      const correct = stats.totalCorrect;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const antigoPct = stats.antigoCount > 0 ? Math.round((stats.antigoCorrect / stats.antigoCount) * 100) : 0;
      const novoPct = stats.novoCount > 0 ? Math.round((stats.novoCorrect / stats.novoCount) * 100) : 0;

      titleEl.textContent = 'Compartilhar Estatísticas';
      tagEl.textContent = 'Minhas Estatísticas';
      textEl.textContent = `Já respondi ${total} perguntas no MINUTO SAGRADO com ${accuracy}% de acerto!`;
      currentShareData = {
        type: 'stats',
        tag: tagEl.textContent,
        text: textEl.textContent,
        ref: '',
        statsData: { total, correct, accuracy, antigoPct, novoPct, bestStreak: stats.bestStreak }
      };
    }

    document.getElementById('overlay').classList.add('active');
    document.getElementById('share-sheet').classList.add('active');
  }

  function shareTo(platform){
    closeAllSheets();
    alert(`Imagem gerada com sucesso! Compartilhando no ${platform}...`);
  }

  /* ===========================================================
     GERADOR DE ARTE (CANVAS)
  =========================================================== */
  function dataURLtoBlob(dataURL){
    const [header, base64] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight){
    const words = text.split(' ');
    let line = '';
    const lines = [];
    words.forEach(word => {
      const testLine = line ? line + ' ' + word : word;
      if(ctx.measureText(testLine).width > maxWidth && line){
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });
    if(line) lines.push(line);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, x, startY + i * lineHeight);
    });
  }

  function generateArt(){
    if(!currentShareData) return;

    if(currentShareData.type === 'achievements'){
      generateAchievementArt();
      return;
    }

    if(currentShareData.type === 'stats'){
      generateStatsArt();
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1340');
    gradient.addColorStop(0.5, '#3b2a6e');
    gradient.addColorStop(1, '#0d0820');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < 120; i++){
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const r = Math.random() * 1.8;
      ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.7 + 0.2).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText(currentShareData.tag.toUpperCase(), canvas.width / 2, 220);

    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Georgia, serif';
    wrapCanvasText(ctx, currentShareData.text, canvas.width / 2, canvas.height / 2, canvas.width - 180, 64);

    if(currentShareData.ref){
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'italic 32px Georgia, serif';
      ctx.fillText('— ' + currentShareData.ref, canvas.width / 2, canvas.height - 220);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '24px Georgia, serif';
    ctx.fillText('MINUTO SAGRADO · www.minutosagrado.com.br', canvas.width / 2, canvas.height - 60);

    const preview = document.getElementById('art-preview');
    preview.innerHTML = '';
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    preview.appendChild(img);

    const blob = dataURLtoBlob(canvas.toDataURL('image/png'));
    const file = new File([blob], 'minuto-sagrado.png', { type: 'image/png' });
    if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
      navigator.share({
        files: [file],
        title: 'Minuto Sagrado',
        text: currentShareData.text + '\n\nJogue agora: https://www.minutosagrado.com.br'
      }).catch(() => {});
    } else {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = 'minuto-sagrado.png';
      link.textContent = '⬇️ Baixar Imagem';
      link.className = 'art-btn';
      preview.appendChild(link);
    }
  }

  function generateAchievementArt(){
    if(!currentShareData) return;

    const unlocked = currentShareData.achievementTitles || [];
    const MAX_LISTED = 8;
    const listed = unlocked.slice(0, MAX_LISTED);
    const extraCount = unlocked.length - listed.length;

    const HEADER_HEIGHT = 500;
    const LINE_HEIGHT = 60;
    const FOOTER_HEIGHT = 300;
    const listHeight = listed.length > 0
      ? listed.length * LINE_HEIGHT + (extraCount > 0 ? LINE_HEIGHT : 0)
      : 90;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = Math.max(1080, HEADER_HEIGHT + listHeight + FOOTER_HEIGHT);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1340');
    gradient.addColorStop(0.5, '#3b2a6e');
    gradient.addColorStop(1, '#0d0820');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const starCount = Math.round(120 * (canvas.height / 1080));
    for(let i = 0; i < starCount; i++){
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const r = Math.random() * 1.8;
      ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.7 + 0.2).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#f4c95d';
    ctx.lineWidth = 14;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    ctx.textAlign = 'center';

    // Cabeçalho: logo + troféu + rótulo
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText('MINUTO SAGRADO', canvas.width / 2, 160);

    ctx.font = '110px Georgia, serif';
    ctx.fillText('🏆', canvas.width / 2, 340);

    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 34px Georgia, serif';
    const label = listed.length === 0
      ? 'JOGANDO MINUTO SAGRADO'
      : (unlocked.length === 1 ? 'CONQUISTA DESBLOQUEADA' : `${unlocked.length} CONQUISTAS DESBLOQUEADAS`);
    ctx.fillText(label, canvas.width / 2, 430);

    // Lista: uma conquista por linha (ou placeholder se nada desbloqueado)
    let cursorY = HEADER_HEIGHT;
    if(listed.length > 0){
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Georgia, serif';
      listed.forEach(title => {
        ctx.fillText(title, canvas.width / 2, cursorY);
        cursorY += LINE_HEIGHT;
      });
      if(extraCount > 0){
        ctx.fillStyle = '#ffd76a';
        ctx.font = 'italic 32px Georgia, serif';
        ctx.fillText(`+ ${extraCount} conquista${extraCount > 1 ? 's' : ''}`, canvas.width / 2, cursorY);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Georgia, serif';
      ctx.fillText('Minuto Sagrado', canvas.width / 2, cursorY + 20);
    }

    // Rodapé: convite + link, sempre ancorados na base da imagem
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '34px Georgia, serif';
    wrapCanvasText(ctx, 'Desafie sua sabedoria bíblica e venha jogar comigo no Minuto Sagrado!', canvas.width / 2, canvas.height - 220, canvas.width - 220, 48);

    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText('www.minutosagrado.com', canvas.width / 2, canvas.height - 70);

    const preview = document.getElementById('art-preview');
    preview.innerHTML = '';
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    preview.appendChild(img);

    const blob = dataURLtoBlob(canvas.toDataURL('image/png'));
    const file = new File([blob], 'minuto-sagrado-conquista.png', { type: 'image/png' });
    if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
      navigator.share({
        files: [file],
        title: 'Minuto Sagrado',
        text: currentShareData.text + '\n\nJogue agora: https://www.minutosagrado.com.br'
      }).catch(() => {});
    } else {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = 'minuto-sagrado-conquista.png';
      link.textContent = '⬇️ Baixar Imagem';
      link.className = 'art-btn';
      preview.appendChild(link);
    }
  }

  function generateStatsArt(){
    if(!currentShareData) return;

    const d = currentShareData.statsData;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1340');
    gradient.addColorStop(0.5, '#3b2a6e');
    gradient.addColorStop(1, '#0d0820');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < 120; i++){
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const r = Math.random() * 1.8;
      ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.7 + 0.2).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#f4c95d';
    ctx.lineWidth = 14;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    ctx.textAlign = 'center';

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText('MINUTO SAGRADO', canvas.width / 2, 140);

    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 46px Georgia, serif';
    wrapCanvasText(ctx, 'Minhas Estatísticas no Minuto Sagrado', canvas.width / 2, 250, canvas.width - 160, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 140px Georgia, serif';
    ctx.fillText(d.accuracy + '%', canvas.width / 2, 480);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '32px Georgia, serif';
    ctx.fillText('Taxa de Acerto Geral', canvas.width / 2, 540);

    const rows = [
      ['Perguntas Respondidas', String(d.total)],
      ['Acerto - Antigo Testamento', d.antigoPct + '%'],
      ['Acerto - Novo Testamento', d.novoPct + '%'],
      ['Maior Sequência de Acertos', String(d.bestStreak)]
    ];
    let rowY = 680;
    rows.forEach(([label, value]) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '36px Georgia, serif';
      ctx.fillText(label, 100, rowY);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillText(value, canvas.width - 100, rowY);

      rowY += 90;
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText('www.minutosagrado.com', canvas.width / 2, canvas.height - 70);

    const preview = document.getElementById('art-preview');
    preview.innerHTML = '';
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    preview.appendChild(img);

    const blob = dataURLtoBlob(canvas.toDataURL('image/png'));
    const file = new File([blob], 'minuto-sagrado-estatisticas.png', { type: 'image/png' });
    if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
      navigator.share({
        files: [file],
        title: 'Minuto Sagrado',
        text: currentShareData.text + '\n\nJogue agora: https://www.minutosagrado.com.br'
      }).catch(() => {});
    } else {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = 'minuto-sagrado-estatisticas.png';
      link.textContent = '⬇️ Baixar Imagem';
      link.className = 'art-btn';
      preview.appendChild(link);
    }
  }

  /* ===========================================================
     PAINEL DE ESTATÍSTICAS
  =========================================================== */
  function renderStats(){
    const total = stats.totalAnswered;
    const correct = stats.totalCorrect;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-correct').textContent = correct;
    document.getElementById('stat-accuracy').textContent = accuracy + '%';
    document.getElementById('stat-streak').textContent = stats.bestStreak;
    document.getElementById('stat-categories').textContent = stats.categoriesPlayed.size + '/8';
    document.getElementById('stat-daystreak').textContent = stats.dayStreak;

    const circ = 326.73;
    document.getElementById('accuracy-circle').style.strokeDashoffset = String(circ * (1 - accuracy / 100));

    const antigoPct = stats.antigoCount > 0 ? Math.round((stats.antigoCorrect / stats.antigoCount) * 100) : 0;
    const novoPct = stats.novoCount > 0 ? Math.round((stats.novoCorrect / stats.novoCount) * 100) : 0;
    document.getElementById('stat-antigo-pct').textContent = antigoPct + '%';
    document.getElementById('stat-antigo-bar').style.width = antigoPct + '%';
    document.getElementById('stat-novo-pct').textContent = novoPct + '%';
    document.getElementById('stat-novo-bar').style.width = novoPct + '%';
  }

  function shareAchievementsNative(){
    openShareSheet('achievements');
    generateArt();
  }

  function shareStatsNative(){
    openShareSheet('stats');
    generateArt();
  }

  function openStats(){
    closeAllSheets();
    renderStats();
    document.getElementById('overlay').classList.add('active');
    document.getElementById('stats-sheet').classList.add('active');
  }

  /* ===========================================================
     PAINEL DO CURADOR (ADMIN)
  =========================================================== */
  const ADMIN_PASSWORD = 'sagrado2026';
  let adminAuthenticated = false;
  let adminEditingId = null;
  const ALT_LETTERS = ['A','B','C','D','E'];
  const DIFICULDADE_LABELS = { Facil: 'Fácil', Medio: 'Médio', Dificil: 'Difícil' };

  function openAdminPanel(){
    if(!adminAuthenticated){
      const pass = prompt('Digite a senha do Painel do Adm:');
      if(pass !== ADMIN_PASSWORD){
        if(pass !== null) alert('Senha incorreta. Acesso negado.');
        return;
      }
      adminAuthenticated = true;
    }

    closeAllSheets();
    document.getElementById('overlay').classList.add('active');
    document.getElementById('admin-sheet').classList.add('active');
    adminCloseForm();
    renderAdminList();
  }

  function renderAdminList(){
    const search = document.getElementById('admin-search').value.trim().toLowerCase();
    const filterCategoria = document.getElementById('admin-filter-categoria').value;
    const filterDificuldade = document.getElementById('admin-filter-dificuldade').value;

    const filtered = questionBank.filter(item => {
      if(filterCategoria && item.categoria !== filterCategoria) return false;
      if(filterDificuldade && item.dificuldade !== filterDificuldade) return false;
      if(search){
        const haystack = (item.enunciado + ' ' + (item.referencia || '')).toLowerCase();
        if(!haystack.includes(search)) return false;
      }
      return true;
    });

    if(filtered.length === 0){
      document.getElementById('admin-list').innerHTML = '<div class="admin-empty">Nenhuma pergunta encontrada.</div>';
      return;
    }

    document.getElementById('admin-list').innerHTML = filtered.map(item => {
      const correta = item.opcoes[item.correta];
      const diffClass = 'diff-' + item.dificuldade.toLowerCase();
      const testClass = item.testamento === 'Antigo' ? 'test-antigo' : 'test-novo';
      return `
        <div class="admin-list-item">
          <div class="admin-badges">
            <span class="admin-badge badge-id">#${item.id}</span>
            <span class="admin-badge badge-categoria">${escapeHtml(CATEGORY_META[item.categoria].label)}</span>
            <span class="admin-badge ${diffClass}">${escapeHtml(DIFICULDADE_LABELS[item.dificuldade] || item.dificuldade)}</span>
            <span class="admin-badge ${testClass}">${escapeHtml(item.testamento)}</span>
          </div>
          <div class="admin-item-question">${escapeHtml(truncateText(item.enunciado, 110))}</div>
          <div class="admin-item-answer">✅ ${escapeHtml(truncateText(correta, 40))} — <em>${escapeHtml(item.referencia || '')}</em></div>
          <button class="admin-edit-btn" onclick="adminOpenForm(${item.id})">Editar</button>
        </div>
      `;
    }).join('');
  }

  function adminAlternativasHtml(opcoes, optionCount, correta){
    let html = '<div class="admin-form-group"><label>Alternativas</label><div class="admin-alternativas-grid">';
    for(let i = 0; i < optionCount; i++){
      html += `<input type="text" id="admin-f-opcao-${i}" placeholder="Alternativa ${ALT_LETTERS[i]}" value="${escapeHtml(opcoes[i] || '')}">`;
    }
    html += '</div></div>';
    html += '<div class="admin-form-group"><label>Resposta Correta</label><select id="admin-f-correta">';
    for(let i = 0; i < optionCount; i++){
      html += `<option value="${i}"${i === correta ? ' selected' : ''}>Alternativa ${ALT_LETTERS[i]}</option>`;
    }
    html += '</select></div>';
    return html;
  }

  function adminFormHtml(item){
    const optionCount = item._optionCount || CATEGORY_META[item.categoria].optionCount;
    const isNew = item.id == null;

    return `
      <div class="admin-form">
        <div class="admin-form-title">${isNew ? 'Nova Pergunta' : 'Editar Pergunta #' + item.id}</div>

        <div class="admin-form-group">
          <label>Pergunta</label>
          <textarea id="admin-f-enunciado" rows="3">${escapeHtml(item.enunciado)}</textarea>
        </div>

        ${adminAlternativasHtml(item.opcoes, optionCount, item.correta)}

        <div class="admin-form-row">
          <div class="admin-form-group">
            <label>Categoria</label>
            <select id="admin-f-categoria" onchange="adminCategoriaChanged()">
              ${Object.keys(CATEGORY_META).map(key => `<option value="${key}"${key === item.categoria ? ' selected' : ''}>${escapeHtml(CATEGORY_META[key].label)}</option>`).join('')}
            </select>
          </div>
          <div class="admin-form-group">
            <label>Dificuldade</label>
            <select id="admin-f-dificuldade">
              <option value="Facil"${item.dificuldade === 'Facil' ? ' selected' : ''}>Fácil</option>
              <option value="Medio"${item.dificuldade === 'Medio' ? ' selected' : ''}>Médio</option>
              <option value="Dificil"${item.dificuldade === 'Dificil' ? ' selected' : ''}>Difícil</option>
            </select>
          </div>
        </div>

        <div class="admin-form-group">
          <label>Formato</label>
          <select id="admin-f-formato" onchange="adminFormatoChanged()">
            <option value="2"${optionCount === 2 ? ' selected' : ''}>Verdadeiro ou Falso (2 opções)</option>
            <option value="4"${optionCount === 4 ? ' selected' : ''}>Múltipla Escolha (4 opções)</option>
            <option value="5"${optionCount === 5 ? ' selected' : ''}>Enigma (5 opções)</option>
          </select>
        </div>

        <div class="admin-form-row">
          <div class="admin-form-group">
            <label>Referência</label>
            <input type="text" id="admin-f-referencia" value="${escapeHtml(item.referencia)}">
          </div>
          <div class="admin-form-group">
            <label>Livro Bíblico</label>
            <input type="text" id="admin-f-livro" value="${escapeHtml(item.livroBiblico)}">
          </div>
        </div>

        <div class="admin-form-group">
          <label>Testamento</label>
          <div class="admin-toggle-group">
            <button type="button" class="admin-toggle-btn${item.testamento === 'Antigo' ? ' active' : ''}" data-value="Antigo" id="admin-toggle-antigo" onclick="adminSetTestamento('Antigo')">Antigo</button>
            <button type="button" class="admin-toggle-btn${item.testamento === 'Novo' ? ' active' : ''}" data-value="Novo" id="admin-toggle-novo" onclick="adminSetTestamento('Novo')">Novo</button>
          </div>
        </div>

        ${item.categoria === 'connections' ? `
        <div class="admin-form-group">
          <label>Palavras-Chave (separadas por vírgula)</label>
          <input type="text" id="admin-f-palavras" value="${escapeHtml((item.palavras || []).join(', '))}">
        </div>` : ''}

        <div class="admin-form-group">
          <label>Você Sabia?</label>
          <textarea id="admin-f-vocesabia" rows="3">${escapeHtml(item.voceSabia)}</textarea>
        </div>

        <div class="admin-form-actions">
          <button class="admin-btn-cancel" onclick="adminCloseForm()">Cancelar</button>
          <button class="admin-btn-submit" onclick="adminSubmitForm()">${isNew ? 'Cadastrar Pergunta' : 'Salvar Alterações'}</button>
        </div>
      </div>
    `;
  }

  function adminOpenForm(id){
    let item;
    if(id == null){
      adminEditingId = null;
      item = {
        id: null,
        categoria: 'quiz',
        enunciado: '',
        opcoes: ['', '', '', ''],
        correta: 0,
        referencia: '',
        livroBiblico: '',
        testamento: 'Antigo',
        dificuldade: 'Facil',
        voceSabia: '',
        palavras: []
      };
    } else {
      adminEditingId = id;
      item = questionBank.find(q => q.id === id);
    }

    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-form-area').innerHTML = adminFormHtml(item);
  }

  function adminCloseForm(){
    adminEditingId = null;
    document.getElementById('admin-form-area').innerHTML = '';
    document.getElementById('admin-dashboard').style.display = '';
  }

  function adminCollectFormValues(){
    const optionCount = parseInt(document.getElementById('admin-f-formato').value, 10);
    const opcoes = [];
    for(let i = 0; i < optionCount; i++){
      const el = document.getElementById('admin-f-opcao-' + i);
      opcoes.push(el ? el.value : '');
    }
    const palavrasEl = document.getElementById('admin-f-palavras');

    return {
      id: adminEditingId,
      _optionCount: optionCount,
      enunciado: document.getElementById('admin-f-enunciado').value,
      opcoes,
      correta: parseInt(document.getElementById('admin-f-correta').value, 10) || 0,
      categoria: document.getElementById('admin-f-categoria').value,
      dificuldade: document.getElementById('admin-f-dificuldade').value,
      referencia: document.getElementById('admin-f-referencia').value,
      livroBiblico: document.getElementById('admin-f-livro').value,
      testamento: document.querySelector('.admin-toggle-btn.active').dataset.value,
      palavras: palavrasEl ? palavrasEl.value.split(',').map(s => s.trim()).filter(Boolean) : [],
      voceSabia: document.getElementById('admin-f-vocesabia').value
    };
  }

  function adminSetTestamento(value){
    document.getElementById('admin-toggle-antigo').classList.toggle('active', value === 'Antigo');
    document.getElementById('admin-toggle-novo').classList.toggle('active', value === 'Novo');
  }

  function adminCategoriaChanged(){
    const values = adminCollectFormValues();
    values.categoria = document.getElementById('admin-f-categoria').value;
    values._optionCount = CATEGORY_META[values.categoria].optionCount;
    const newOpcoes = [];
    for(let i = 0; i < values._optionCount; i++) newOpcoes.push(values.opcoes[i] || '');
    values.opcoes = newOpcoes;
    if(values.correta >= values._optionCount) values.correta = 0;
    document.getElementById('admin-form-area').innerHTML = adminFormHtml(values);
  }

  function adminFormatoChanged(){
    const values = adminCollectFormValues();
    const optionCount = parseInt(document.getElementById('admin-f-formato').value, 10);
    const newOpcoes = [];
    for(let i = 0; i < optionCount; i++) newOpcoes.push(values.opcoes[i] || '');
    values.opcoes = newOpcoes;
    values._optionCount = optionCount;
    if(values.correta >= optionCount) values.correta = 0;
    document.getElementById('admin-form-area').innerHTML = adminFormHtml(values);
  }

  function adminSubmitForm(){
    const values = adminCollectFormValues();

    if(!values.enunciado.trim()){
      alert('Preencha o campo Pergunta.');
      return;
    }
    if(values.opcoes.some(o => !o.trim())){
      alert('Preencha todas as alternativas.');
      return;
    }
    if(!values.referencia.trim()){
      alert('Preencha a referência bíblica.');
      return;
    }

    if(adminEditingId == null){
      const newItem = {
        id: nextQuestionId++,
        categoria: values.categoria,
        enunciado: values.enunciado.trim(),
        opcoes: values.opcoes.map(o => o.trim()),
        correta: values.correta,
        referencia: values.referencia.trim(),
        livroBiblico: values.livroBiblico.trim(),
        testamento: values.testamento,
        dificuldade: values.dificuldade,
        voceSabia: values.voceSabia.trim()
      };
      if(values.categoria === 'connections'){
        newItem.palavras = values.palavras;
      }
      CATEGORY_ARRAYS[values.categoria].push(newItem);
      questionBank.push(newItem);
      alert('Pergunta cadastrada com sucesso!');
    } else {
      const item = questionBank.find(q => q.id === adminEditingId);
      if(values.categoria !== item.categoria){
        const oldArr = CATEGORY_ARRAYS[item.categoria];
        const oldIdx = oldArr.indexOf(item);
        if(oldIdx !== -1) oldArr.splice(oldIdx, 1);
        CATEGORY_ARRAYS[values.categoria].push(item);
      }
      item.categoria = values.categoria;
      item.enunciado = values.enunciado.trim();
      item.opcoes = values.opcoes.map(o => o.trim());
      item.correta = values.correta;
      item.referencia = values.referencia.trim();
      item.livroBiblico = values.livroBiblico.trim();
      item.testamento = values.testamento;
      item.dificuldade = values.dificuldade;
      item.voceSabia = values.voceSabia.trim();
      if(values.categoria === 'connections'){
        item.palavras = values.palavras;
      } else {
        delete item.palavras;
      }
      alert('Pergunta atualizada com sucesso!');
    }

    adminCloseForm();
    renderAdminList();
  }

  function closeAllSheets(){
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('share-sheet').classList.remove('active');
    document.getElementById('stats-sheet').classList.remove('active');
    document.getElementById('admin-sheet').classList.remove('active');
    adminCloseForm();
  }

  /* Exibe nos cards do dashboard as perguntas/rodada, o tempo por pergunta e o total cadastrado em cada modo */
  function renderModeBadges(){
    const info = {
      jornada: { round: JOURNEY_STAGE_LIMIT, timer: 20, total: JORNADA_MODULES.reduce((sum, m) => sum + m.perguntas.length, 0) },
      quiz: { round: Math.min(QUIZ_ITEMS.length, ROUND_QUESTION_LIMIT), timer: GAME_DATA.quiz.timer, total: QUIZ_ITEMS.length },
      characters: { round: Math.min(CHARACTERS_ITEMS.length, ROUND_QUESTION_LIMIT), timer: GAME_DATA.characters.timer, total: CHARACTERS_ITEMS.length },
      truefalse: { round: Math.min(TRUEFALSE_ITEMS.length, ROUND_QUESTION_LIMIT), timer: GAME_DATA.truefalse.timer, total: TRUEFALSE_ITEMS.length },
      theological: { round: Math.min(GAME_DATA.theological.items.length, ROUND_QUESTION_LIMIT), timer: GAME_DATA.theological.timer, total: GAME_DATA.theological.items.length },
      kids: { round: Math.min(KIDS_ITEMS.length, ROUND_QUESTION_LIMIT), timer: GAME_DATA.kids.timer, total: KIDS_ITEMS.length },
      hardchoices: { round: Math.min(HARDCHOICES_ITEMS.length, ROUND_QUESTION_LIMIT), timer: GAME_DATA.hardchoices.timer, total: HARDCHOICES_ITEMS.length },
      connections: { round: Math.min(CONNECTIONS_ITEMS.length, ROUND_QUESTION_LIMIT), timer: GAME_DATA.connections.timer, total: CONNECTIONS_ITEMS.length },
      enigma: { round: Math.min(ENIGMA_ITEMS.length, ROUND_QUESTION_LIMIT), timer: GAME_DATA.enigma.timer, total: ENIGMA_ITEMS.length }
    };
    Object.keys(info).forEach(modeId => {
      const { round, timer, total } = info[modeId];
      const roundBadge = document.getElementById(`badge-round-${modeId}`);
      if(roundBadge) roundBadge.textContent = `${round} perguntas`;
      const timerBadge = document.getElementById(`badge-timer-${modeId}`);
      if(timerBadge) timerBadge.textContent = `${timer}s`;
      const totalBadge = document.getElementById(`badge-total-${modeId}`);
      if(totalBadge) totalBadge.textContent = `${total} total`;
    });
  }

  /* ===========================================================
     INICIALIZAÇÃO
  =========================================================== */
  stats.dayStreak = computeDayStreak();
  renderFeedInspiracao();
  renderModeBadges();
