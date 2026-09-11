const STORAGE_KEY = 'foxyGrade3Module1Progress';
const SOUND_STORAGE_KEY = 'grammarSoundEnabled';
const TOTAL_QUESTIONS = 10;

const QUESTION_BANK = [
  { question: '11 is ...', options: ['eleven', 'twelve', 'twenty'], correct: 'eleven' },
  { question: '12 is ...', options: ['thirteen', 'twelve', 'two'], correct: 'twelve' },
  { question: '13 is ...', options: ['thirty', 'fourteen', 'thirteen'], correct: 'thirteen' },
  { question: '14 is ...', options: ['forty', 'fourteen', 'fifteen'], correct: 'fourteen' },
  { question: '15 is ...', options: ['fifty', 'fifteen', 'sixteen'], correct: 'fifteen' },
  { question: '16 is ...', options: ['sixteen', 'seventeen', 'sixty'], correct: 'sixteen' },
  { question: '17 is ...', options: ['seventy', 'seven', 'seventeen'], correct: 'seventeen' },
  { question: '18 is ...', options: ['eighteen', 'eight', 'nineteen'], correct: 'eighteen' },
  { question: '19 is ...', options: ['ninety', 'nineteen', 'nine'], correct: 'nineteen' },
  { question: '20 is ...', options: ['twelve', 'two', 'twenty'], correct: 'twenty' }
];

const SOUND_CONFIG = {
  correct: { src: '../../assets/sounds/correct.mp3', volume: 0.35, fallback: { frequency: 880, duration: 0.18, volume: 0.08 } },
  wrong: { src: '../../assets/sounds/wrong.mp3', volume: 0.25, fallback: { frequency: 200, duration: 0.2, volume: 0.07 } },
  victory: { src: '../../assets/sounds/victory.mp3', volume: 0.45, fallback: { frequency: 1046, duration: 0.3, volume: 0.09 } },
  click: { src: '../../assets/sounds/click.mp3', volume: 0.2, fallback: { frequency: 660, duration: 0.08, volume: 0.05 } }
};

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
  currentIndex: 0,
  score: 0,
  correctAnswers: 0,
  answered: false,
  finished: false,
  selectedAnswer: null
};

const ui = {
  questionNumber: document.getElementById('questionNumber'),
  scoreValue: document.getElementById('scoreValue'),
  progressFill: document.getElementById('progressFill'),
  questionText: document.getElementById('questionText'),
  answerList: document.getElementById('answerList'),
  nextBtn: document.getElementById('nextBtn'),
  foxySpeech: document.getElementById('foxySpeech'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  restartBtn: document.getElementById('restartBtn'),
  resultModal: document.getElementById('resultModal'),
  resultTitle: document.getElementById('resultTitle'),
  resultBadge: document.getElementById('resultBadge'),
  resultCorrect: document.getElementById('resultCorrect'),
  resultScore: document.getElementById('resultScore'),
  resultStars: document.getElementById('resultStars'),
  resultCoins: document.getElementById('resultCoins'),
  modalActionBtn: document.getElementById('modalActionBtn')
};

const soundState = {
  enabled: (() => {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      return saved === null ? true : saved !== 'off';
    } catch (error) {
      return true;
    }
  })(),
  audioContext: null
};

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

function getStarsFromScore(score) {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= 60) return 1;
  return 0;
}

function getCoinsFromScore(score) {
  if (score >= 90) return 100;
  if (score >= 75) return 80;
  if (score >= 60) return 60;
  return 0;
}

function getCoinsForCorrectAnswers(correct) {
  if (correct >= 9) return 100;
  if (correct >= 7) return 80;
  if (correct >= 6) return 60;
  return 0;
}

function getStarsForCorrectAnswers(correct) {
  if (correct >= 9) return 3;
  if (correct >= 7) return 2;
  if (correct >= 6) return 1;
  return 0;
}

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

function playTone(config) {
  const context = getAudioContext();
  if (!context || !soundState.enabled) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = config.frequency;
  gain.gain.value = 0.0001;

  oscillator.connect(gain);
  gain.connect(context.destination);

  const start = context.currentTime;
  gain.gain.exponentialRampToValueAtTime(config.volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + config.duration);

  oscillator.start(start);
  oscillator.stop(start + config.duration);
}

function playSound(key) {
  if (!soundState.enabled) return;

  const config = SOUND_CONFIG[key];
  if (!config) return;

  const audio = new Audio(config.src);
  audio.volume = config.volume;
  const playPromise = audio.play();

  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      if (config.fallback) {
        playTone(config.fallback);
      }
    });
  }
}

function saveSoundPreference() {
  localStorage.setItem(SOUND_STORAGE_KEY, soundState.enabled ? 'on' : 'off');
}

function setSoundButtonState() {
  if (!ui.soundToggleBtn) return;

  if (soundState.enabled) {
    ui.soundToggleBtn.textContent = '🔊 Sound On';
    ui.soundToggleBtn.setAttribute('aria-label', 'Sound on');
    ui.soundToggleBtn.classList.remove('is-muted');
  } else {
    ui.soundToggleBtn.textContent = '🔇 Sound Off';
    ui.soundToggleBtn.setAttribute('aria-label', 'Sound off');
    ui.soundToggleBtn.classList.add('is-muted');
  }
}

function toggleSound() {
  soundState.enabled = !soundState.enabled;
  saveSoundPreference();
  setSoundButtonState();
  playSound('click');
}

function updateProgressBar() {
  const progress = ((state.currentIndex + 1) / TOTAL_QUESTIONS) * 100;
  ui.progressFill.style.width = `${progress}%`;
}

function setFoxyMessage(message) {
  ui.foxySpeech.textContent = message;
}

function randomSuccessMessage() {
  const messages = ['Great job!', 'Excellent!', 'Well done!', 'Awesome!'];
  return messages[Math.floor(Math.random() * messages.length)];
}

function randomMistakeMessage() {
  const messages = ['Try again!', 'Almost!', 'Keep going!'];
  return messages[Math.floor(Math.random() * messages.length)];
}

function updateHeader() {
  ui.questionNumber.textContent = String(state.currentIndex + 1);
  ui.scoreValue.textContent = String(state.score);
  updateProgressBar();
}

function renderQuestion() {
  const currentQuestion = QUESTION_BANK[state.currentIndex];

  ui.questionText.textContent = currentQuestion.question;
  ui.answerList.innerHTML = '';
  ui.nextBtn.classList.add('hidden');
  ui.nextBtn.textContent = state.currentIndex === QUESTION_BANK.length - 1 ? 'SEE RESULTS' : 'NEXT';
  state.answered = false;
  state.selectedAnswer = null;

  currentQuestion.options.forEach((option) => {
    const optionButton = document.createElement('button');
    optionButton.type = 'button';
    optionButton.className = 'answer-option';
    optionButton.textContent = option;
    optionButton.addEventListener('click', () => {
      handleAnswer(option, optionButton);
    });
    ui.answerList.appendChild(optionButton);
  });

  updateHeader();
}

function handleAnswer(selectedOption, buttonElement) {
  if (state.answered) return;

  const currentQuestion = QUESTION_BANK[state.currentIndex];
  const optionButtons = [...ui.answerList.querySelectorAll('.answer-option')];
  state.answered = true;
  state.selectedAnswer = selectedOption;

  optionButtons.forEach((optionButton) => {
    optionButton.disabled = true;
    optionButton.classList.remove('is-correct', 'is-wrong');

    if (optionButton.textContent === currentQuestion.correct) {
      optionButton.classList.add('is-correct');
    }

    if (optionButton.textContent === selectedOption && selectedOption !== currentQuestion.correct) {
      optionButton.classList.add('is-wrong');
    }
  });

  if (selectedOption === currentQuestion.correct) {
    state.score += 10;
    state.correctAnswers += 1;
    playSound('correct');
    setFoxyMessage(randomSuccessMessage());
  } else {
    playSound('wrong');
    setFoxyMessage(randomMistakeMessage());
  }

  ui.scoreValue.textContent = String(state.score);
  ui.nextBtn.classList.remove('hidden');
}

function restartGame() {
  state.currentIndex = 0;
  state.score = 0;
  state.correctAnswers = 0;
  state.finished = false;
  state.answered = false;
  state.selectedAnswer = null;
  ui.resultModal.classList.add('hidden');
  setFoxyMessage('Ready for the Numbers Challenge?');
  renderQuestion();
}

function finishQuiz() {
  state.finished = true;
  const total = QUESTION_BANK.length;
  const correct = state.correctAnswers;
  const passed = correct >= 6;
  const reward = passed ? {
    stars: getStarsForCorrectAnswers(correct),
    coins: getCoinsForCorrectAnswers(correct)
  } : { stars: 0, coins: 0 };

  ui.resultCorrect.textContent = `${correct} / ${total}`;
  ui.resultScore.textContent = `${state.score} / 100`;
  ui.resultStars.textContent = passed ? '⭐'.repeat(reward.stars) || '⭐⭐⭐' : '☆☆☆';
  ui.resultCoins.textContent = String(reward.coins);

  if (passed) {
    ui.resultBadge.textContent = '🎉 Well done!';
    ui.resultTitle.textContent = 'Amazing! You passed the Numbers Challenge! 🎉';
    ui.modalActionBtn.textContent = 'PLAY AGAIN';
    setFoxyMessage('Amazing! You know the numbers! 🎉');
    playSound('victory');
    recordGrammarProgress(reward.coins, reward.stars, state.score);
  } else {
    ui.resultBadge.textContent = '📘 Keep going!';
    ui.resultTitle.textContent = 'Good try! Let\'s practise again!';
    ui.modalActionBtn.textContent = 'TRY AGAIN';
    setFoxyMessage("Good try! Let's practise again!");
  }

  ui.resultModal.classList.remove('hidden');
}

function recordGrammarProgress(coinsEarned, starsEarned, score) {
  const progressState = loadProgressState();
  const grammarProgress = progressState.games.grammar || { best: 0, completed: false, stars: 0 };
  const previousBest = Number(grammarProgress.best || 0);
  const previousCoins = getCoinsFromScore(previousBest);
  const previousStars = getStarsFromScore(previousBest);

  grammarProgress.completed = true;
  grammarProgress.best = Math.max(previousBest, score);
  grammarProgress.stars = Math.max(Number(grammarProgress.stars || 0), starsEarned);

  const coinDelta = Math.max(0, coinsEarned - previousCoins);
  const starDelta = Math.max(0, starsEarned - previousStars);

  progressState.games.grammar = grammarProgress;
  progressState.coins = Number(progressState.coins || 0) + coinDelta;
  progressState.stars = Number(progressState.stars || 0) + starDelta;

  if (progressState.games.memory && progressState.games.memory.completed && progressState.games.grammar.completed && progressState.games.classroom.completed) {
    progressState.rewardUnlocked = true;
  }

  saveProgressState(progressState);
}

function handleNextQuestion() {
  if (!state.answered) return;

  if (state.currentIndex === QUESTION_BANK.length - 1) {
    finishQuiz();
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
}

function bindEvents() {
  ui.nextBtn.addEventListener('click', () => {
    playSound('click');
    handleNextQuestion();
  });

  ui.restartBtn.addEventListener('click', () => {
    playSound('click');
    restartGame();
  });

  ui.soundToggleBtn.addEventListener('click', () => {
    toggleSound();
  });

  ui.modalActionBtn.addEventListener('click', () => {
    playSound('click');
    ui.resultModal.classList.add('hidden');
    restartGame();
  });
}

function initializeGame() {
  setSoundButtonState();
  bindEvents();
  renderQuestion();
  setFoxyMessage('Ready for the Numbers Challenge?');
}

initializeGame();
