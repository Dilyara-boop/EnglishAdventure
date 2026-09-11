const STORAGE_KEY = 'foxyGrade3Module1Progress';
const SOUND_STORAGE_KEY = 'memorySoundEnabled';
const GAME_KEY = 'memory';
const TOTAL_PAIRS = 8;

const SOUND_CONFIG = {
  flip: { frequency: 660, volume: 0.05, duration: 0.08 },
  correct: { frequency: 880, volume: 0.08, duration: 0.12 },
  wrong: { frequency: 210, volume: 0.07, duration: 0.18 },
  victory: { frequency: 1046, volume: 0.1, duration: 0.2 }
};

const vocabularyPairs = [
  { word: 'English', emoji: '🔤' },
  { word: 'Maths', emoji: '➗' },
  { word: 'Music', emoji: '🎵' },
  { word: 'Art', emoji: '🎨' },
  { word: 'PE', emoji: '⚽' },
  { word: 'Science', emoji: '🔬' },
  { word: 'Reading', emoji: '📖' },
  { word: 'Geography', emoji: '🌍' }
];

const DEFAULT_PROGRESS = {
  coins: 0,
  stars: 0,
  games: {
    memory: { best: 0, completed: false, stars: 0 },
    grammar: { best: 0, completed: false, stars: 0 },
    classroom: { best: 0, completed: false, stars: 0 }
  },
  rewardUnlocked: false
};

const state = {
  deck: [],
  firstCard: null,
  secondCard: null,
  matchedPairs: 0,
  moves: 0,
  score: 0,
  lockBoard: false,
  finished: false,
  isBusy: false
};

const ui = {
  board: document.getElementById('gameBoard'),
  pairsCount: document.getElementById('pairsCount'),
  movesCount: document.getElementById('movesCount'),
  scoreCount: document.getElementById('scoreCount'),
  foxyMessage: document.getElementById('foxyMessage'),
  resultModal: document.getElementById('resultModal'),
  resultMoves: document.getElementById('resultMoves'),
  resultScore: document.getElementById('resultScore'),
  resultStars: document.getElementById('resultStars'),
  resultCoins: document.getElementById('resultCoins'),
  restartBtn: document.getElementById('restartBtn'),
  playAgainBtn: document.getElementById('playAgainBtn'),
  soundToggleBtn: document.getElementById('soundToggleBtn')
};

const soundState = {
  enabled: (() => {
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    if (saved === null) return true;
    return saved === 'true';
  })(),
  audioContext: null
};

function getAudioContext() {
  if (!soundState.audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    soundState.audioContext = new AudioCtor();
  }

  if (soundState.audioContext.state === 'suspended') {
    soundState.audioContext.resume().catch(() => {});
  }

  return soundState.audioContext;
}

function setSoundButtonState() {
  if (!ui.soundToggleBtn) return;

  if (soundState.enabled) {
    ui.soundToggleBtn.textContent = '🔊 Sound On';
    ui.soundToggleBtn.classList.remove('is-muted');
    ui.soundToggleBtn.setAttribute('aria-label', 'Sound on');
  } else {
    ui.soundToggleBtn.textContent = '🔇 Sound Off';
    ui.soundToggleBtn.classList.add('is-muted');
    ui.soundToggleBtn.setAttribute('aria-label', 'Sound off');
  }
}

function saveSoundPreference() {
  localStorage.setItem(SOUND_STORAGE_KEY, String(soundState.enabled));
}

function playTone(config) {
  const context = getAudioContext();
  if (!context || !soundState.enabled) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = config.frequency;
  gainNode.gain.value = 0.0001;

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  const startTime = context.currentTime;
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(config.volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + config.duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + config.duration);
}

function playSound(key) {
  if (!soundState.enabled) return;

  const config = SOUND_CONFIG[key];
  if (!config) return;

  playTone(config);
}

function toggleSound() {
  soundState.enabled = !soundState.enabled;
  saveSoundPreference();
  setSoundButtonState();
}

function enableSoundFromUserInteraction() {
  getAudioContext();
}

function shuffleCards(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadProgressState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      return structuredClone(DEFAULT_PROGRESS);
    }

    return {
      ...structuredClone(DEFAULT_PROGRESS),
      ...saved,
      games: {
        ...structuredClone(DEFAULT_PROGRESS.games),
        ...(saved.games || {})
      }
    };
  } catch (error) {
    return structuredClone(DEFAULT_PROGRESS);
  }
}

function saveProgressState(progressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progressState));
}

function getStarsForPercent(percent) {
  if (percent >= 90) return 3;
  if (percent >= 75) return 2;
  if (percent >= 60) return 1;
  return 0;
}

function getCoinsForPercent(percent) {
  if (percent >= 90) return 100;
  if (percent >= 75) return 80;
  if (percent >= 60) return 60;
  return 0;
}

function getRewardForMoves(moves) {
  if (moves <= 10) {
    return { starValue: 3, coins: 100, percent: 100 };
  }

  if (moves <= 14) {
    return { starValue: 2, coins: 80, percent: 80 };
  }

  return { starValue: 1, coins: 60, percent: 60 };
}

function buildDeck() {
  const cards = [];

  vocabularyPairs.forEach((pair, pairIndex) => {
    cards.push({
      id: `${pair.word}-word`,
      pairIndex,
      name: pair.word,
      type: 'word',
      value: pair.word,
      emoji: pair.emoji
    });

    cards.push({
      id: `${pair.word}-emoji`,
      pairIndex,
      name: pair.word,
      type: 'emoji',
      value: pair.emoji,
      emoji: pair.emoji
    });
  });

  return shuffleCards(cards);
}

function setFoxyMessage(message) {
  if (!ui.foxyMessage) return;
  ui.foxyMessage.textContent = message;
}

function randomSuccessMessage() {
  const messages = ['Great job!', 'Excellent!', 'Well done!', 'Awesome!'];
  return messages[Math.floor(Math.random() * messages.length)];
}

function randomMistakeMessage() {
  const messages = ['Try again!', 'Almost!', 'Keep going!'];
  return messages[Math.floor(Math.random() * messages.length)];
}

function updateScoreboard() {
  ui.pairsCount.textContent = `${state.matchedPairs} / ${TOTAL_PAIRS}`;
  ui.movesCount.textContent = String(state.moves);
  ui.scoreCount.textContent = String(state.score);
}

function revealCard(cardElement) {
  if (!cardElement) return;
  cardElement.classList.add('is-flipped');
}

function hideCard(cardElement) {
  if (!cardElement) return;
  cardElement.classList.remove('is-flipped');
}

function markMatched(cardElement) {
  if (!cardElement) return;
  cardElement.classList.add('is-matched');
  cardElement.classList.remove('is-flipped');
}

function createCardElement(card) {
  const cardButton = document.createElement('button');
  cardButton.type = 'button';
  cardButton.className = 'memory-card';
  cardButton.dataset.cardId = card.id;
  cardButton.dataset.pairIndex = String(card.pairIndex);

  cardButton.innerHTML = `
    <span class="memory-card__inner">
      <span class="memory-card__face memory-card__front">⭐</span>
      <span class="memory-card__face memory-card__back">
        ${card.type === 'word'
          ? `<span class="memory-card__word">${card.name}</span>`
          : `<span class="memory-card__emoji">${card.emoji}</span>`}
      </span>
    </span>
  `;

  cardButton.addEventListener('click', () => handleCardClick(cardButton, card));
  return cardButton;
}

function renderBoard() {
  ui.board.innerHTML = '';
  state.deck = buildDeck();

  state.deck.forEach((card) => {
    const cardElement = createCardElement(card);
    ui.board.appendChild(cardElement);
  });
}

function finishGame() {
  state.finished = true;
  const reward = getRewardForMoves(state.moves);
  const progressState = loadProgressState();
  const previousBest = Number(progressState.games.memory.best || 0);
  const previousCoins = getCoinsForPercent(previousBest);
  const previousStars = getStarsForPercent(previousBest);

  progressState.games.memory.completed = true;
  progressState.games.memory.best = Math.max(previousBest, reward.percent);
  progressState.games.memory.stars = Math.max(progressState.games.memory.stars || 0, reward.starValue);

  const newCoins = reward.coins;
  const newStars = reward.starValue;
  const coinDelta = Math.max(0, newCoins - previousCoins);
  const starDelta = Math.max(0, newStars - previousStars);

  progressState.coins += coinDelta;
  progressState.stars += starDelta;
  saveProgressState(progressState);

  ui.resultMoves.textContent = String(state.moves);
  ui.resultScore.textContent = String(state.score);
  ui.resultStars.textContent = String(newStars);
  ui.resultCoins.textContent = String(newCoins);
  ui.resultModal.classList.remove('hidden');
  setFoxyMessage('You did it! 🎉');

  const foxNode = document.querySelector('.foxy-card');
  if (foxNode) {
    foxNode.classList.remove('is-celebrating');
    void foxNode.offsetWidth;
    foxNode.classList.add('is-celebrating');
  }
}

function resetGame() {
  state.firstCard = null;
  state.secondCard = null;
  state.matchedPairs = 0;
  state.moves = 0;
  state.score = 0;
  state.lockBoard = false;
  state.finished = false;
  state.isBusy = false;
  ui.resultModal.classList.add('hidden');
  setFoxyMessage("Let's match the words!");
  renderBoard();
  updateScoreboard();
}

function handleMatchedPair(firstElement, secondElement) {
  state.matchedPairs += 1;
  state.score += 25;
  markMatched(firstElement);
  markMatched(secondElement);
  state.firstCard = null;
  state.secondCard = null;
  state.lockBoard = false;

  if (state.matchedPairs === TOTAL_PAIRS) {
    playSound('victory');
    setFoxyMessage('You did it! 🎉');
    finishGame();
  } else {
    playSound('correct');
    setFoxyMessage(randomSuccessMessage());
  }

  const foxNode = document.querySelector('.foxy-card');
  if (foxNode) {
    foxNode.classList.remove('is-celebrating');
    void foxNode.offsetWidth;
    foxNode.classList.add('is-celebrating');
  }

  updateScoreboard();
}

function handleMismatch(firstElement, secondElement) {
  state.lockBoard = true;
  playSound('wrong');
  setFoxyMessage(randomMistakeMessage());

  setTimeout(() => {
    hideCard(firstElement);
    hideCard(secondElement);
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
  }, 700);
}

function handleCardClick(cardElement, card) {
  if (state.lockBoard || state.finished || state.isBusy) return;

  if (cardElement.classList.contains('is-flipped') || cardElement.classList.contains('is-matched')) {
    return;
  }

  playSound('flip');
  revealCard(cardElement);

  if (!state.firstCard) {
    state.firstCard = { element: cardElement, card };
    return;
  }

  state.secondCard = { element: cardElement, card };
  state.moves += 1;
  updateScoreboard();

  const isMatch = state.firstCard.card.pairIndex === state.secondCard.card.pairIndex;

  if (isMatch) {
    handleMatchedPair(state.firstCard.element, state.secondCard.element);
    return;
  }

  handleMismatch(state.firstCard.element, state.secondCard.element);
}

function bindEvents() {
  ui.restartBtn.addEventListener('click', resetGame);
  ui.playAgainBtn.addEventListener('click', resetGame);
  ui.soundToggleBtn.addEventListener('click', () => {
    toggleSound();
  });
  document.addEventListener('pointerdown', enableSoundFromUserInteraction, { once: true });
  document.addEventListener('keydown', enableSoundFromUserInteraction, { once: true });
}

function initializeGame() {
  setSoundButtonState();
  bindEvents();
  renderBoard();
  updateScoreboard();
  setFoxyMessage("Let's match the words!");
}

window.FoxyProgress = {
  STORAGE_KEY,
  loadProgressState,
  saveProgressState,
  getStarsForPercent,
  getCoinsForPercent
};

initializeGame();
