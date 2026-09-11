const STORAGE_KEY = 'foxyProgress';
const MUSIC_STORAGE_KEY = 'foxyMusicSetting';
const MUSIC_PATH = 'assets/music/background.mp3';
const MUSIC_VOLUME = 0.18;

let musicAudio = null;
let musicEnabled = true;
let ambientMusicTimer = null;
let ambientMusicContext = null;
let ambientMusicActive = false;

function getMusicPreference() {
  try {
    return localStorage.getItem(MUSIC_STORAGE_KEY) !== 'off';
  } catch (error) {
    return true;
  }
}

function setMusicPreference(enabled) {
  try {
    localStorage.setItem(MUSIC_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch (error) {
    // ignore storage errors silently
  }
}

function createMusicPlayer() {
  if (musicAudio) return musicAudio;

  musicAudio = new Audio(MUSIC_PATH);
  musicAudio.loop = true;
  musicAudio.volume = 0;
  musicAudio.preload = 'auto';
  musicAudio.onerror = () => {
    if (!musicEnabled) return;
    startAmbientMusic();
  };

  return musicAudio;
}

function startAmbientMusic() {
  if (!musicEnabled || ambientMusicActive) return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  if (!ambientMusicContext) {
    ambientMusicContext = new AudioCtor();
  }

  if (ambientMusicContext.state === 'suspended') {
    ambientMusicContext.resume().catch(() => {});
  }

  const notes = [220, 261.63, 293.66, 329.63, 293.66, 261.63];
  let step = 0;
  ambientMusicActive = true;

  const playStep = () => {
    if (!musicEnabled || !ambientMusicActive) return;

    const oscillator = ambientMusicContext.createOscillator();
    const gainNode = ambientMusicContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = notes[step % notes.length];
    gainNode.gain.value = 0.0001;

    oscillator.connect(gainNode);
    gainNode.connect(ambientMusicContext.destination);

    const start = ambientMusicContext.currentTime;
    gainNode.gain.exponentialRampToValueAtTime(0.025, start + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

    oscillator.start(start);
    oscillator.stop(start + 0.6);

    step += 1;
  };

  playStep();
  ambientMusicTimer = window.setInterval(playStep, 620);
}

function stopAmbientMusic() {
  ambientMusicActive = false;

  if (ambientMusicTimer) {
    window.clearInterval(ambientMusicTimer);
    ambientMusicTimer = null;
  }

  if (ambientMusicContext && ambientMusicContext.state === 'running') {
    ambientMusicContext.suspend().catch(() => {});
  }
}

function fadeMusicToVolume(targetVolume, duration = 1400) {
  const audio = createMusicPlayer();
  const startVolume = audio.volume;
  const delta = targetVolume - startVolume;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - (Math.pow(-2 * progress + 2, 2) / 2);
    audio.volume = Math.min(1, Math.max(0, startVolume + delta * eased));

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function ensureMusicStarted() {
  const audio = createMusicPlayer();
  if (!musicEnabled) {
    audio.pause();
    audio.volume = 0;
    stopAmbientMusic();
    return;
  }

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.catch(() => {
      startAmbientMusic();
      document.addEventListener('pointerdown', startMusicOnce, { once: true });
    });
  }

  if (audio.paused) {
    return;
  }

  audio.volume = 0;
  fadeMusicToVolume(MUSIC_VOLUME, 1600);
}

function startMusicOnce() {
  if (!musicEnabled) return;
  const audio = createMusicPlayer();
  audio.muted = false;
  audio.volume = 0;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.catch(() => {
      startAmbientMusic();
    });
  }
  fadeMusicToVolume(MUSIC_VOLUME, 1600);
}

function updateMusicButton() {
  const button = document.getElementById('musicToggle');
  if (!button) return;

  if (musicEnabled) {
    button.textContent = '🎵 Music On';
    button.classList.remove('is-off');
    button.setAttribute('aria-label', 'Music on');
  } else {
    button.textContent = '🔇 Music Off';
    button.classList.add('is-off');
    button.setAttribute('aria-label', 'Music off');
  }
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  setMusicPreference(musicEnabled);
  updateMusicButton();

  const audio = createMusicPlayer();

  if (!musicEnabled) {
    audio.pause();
    audio.volume = 0;
    stopAmbientMusic();
    return;
  }

  ensureMusicStarted();
}

const defaultState = {
  coins: 0,
  stars: 0,
  games: {
    memory: { best: 0, completed: false, stars: 0 },
    grammar: { best: 0, completed: false, stars: 0 },
    classroom: { best: 0, completed: false, stars: 0 }
  },
  rewardUnlocked: false
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    return {
      ...structuredClone(defaultState),
      ...saved,
      games: {
        ...structuredClone(defaultState.games),
        ...(saved.games || {})
      }
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function updateGameResult(gameKey, scorePercent) {
  const game = state.games[gameKey];
  if (!game) return;

  if (scorePercent < 60) {
    return;
  }

  const nextBest = Math.max(game.best, scorePercent);
  const bestCoins = getCoinsFromScore(nextBest);
  const bestStars = getStarsFromScore(nextBest);

  game.best = nextBest;
  game.completed = true;
  game.stars = Math.max(game.stars, bestStars);

  state.coins += bestCoins;
  state.stars += bestStars;

  if (state.games.memory.completed && state.games.grammar.completed && state.games.classroom.completed) {
    state.rewardUnlocked = true;
  }

  saveState();
  renderProgress();
}

function resetProgress() {
  const confirmed = window.confirm('Reset all progress and Fox Coins?');
  if (!confirmed) return;

  state = structuredClone(defaultState);
  saveState();
  renderProgress();
}

function getCompletedCount() {
  return Object.values(state.games).filter(game => game.completed).length;
}

function renderProgress() {
  const progressText = document.getElementById('progressText');
  const progressPercent = document.getElementById('progressPercent');
  const progressFill = document.getElementById('progressFill');
  const coinCount = document.getElementById('coinCount');
  const starCount = document.getElementById('starCount');
  const treasureMessage = document.getElementById('treasureMessage');
  const treasureChest = document.getElementById('treasureChest');
  const treasureState = document.getElementById('treasureState');
  const openSecretBtn = document.getElementById('openSecretBtn');
  const questItems = document.querySelectorAll('.quest-item');
  const indicators = document.querySelectorAll('.indicator');

  const completedCount = getCompletedCount();
  const progress = (completedCount / 3) * 100;

  if (coinCount) coinCount.textContent = state.coins;
  if (starCount) starCount.textContent = state.stars;

  progressText.textContent = `${completedCount} / 3 games completed`;
  progressPercent.textContent = `${Math.round(progress)}%`;
  if (progressFill) progressFill.style.width = `${progress}%`;

  questItems.forEach(item => {
  const gameKey = item.dataset.game;
  const status = item.querySelector('.quest-status');
  const game = state.games[gameKey];

  if (!status) return;

  if (item.classList.contains('quest-item--treasure')) {
    if (completedCount === 3) {
      status.textContent = '🔓';
      item.classList.add('is-complete');
    } else {
      status.textContent = '🔒';
      item.classList.remove('is-complete');
    }

    return;
  }

  if (game && game.completed) {
    status.textContent = '✅';
    item.classList.add('is-complete');
  } else {
    status.textContent = '○';
    item.classList.remove('is-complete');
  }
});

  indicators.forEach(indicator => {
    const gameKey = indicator.dataset.game;
    const lock = indicator.querySelector('strong');
    const game = state.games[gameKey];

    if (!lock) return;

    if (game && game.completed) {
      indicator.classList.add('is-unlocked');
      lock.textContent = '✅';
    } else {
      indicator.classList.remove('is-unlocked');
      lock.textContent = '🔒';
    }
  });

  if (completedCount === 3) {
    state.rewardUnlocked = true;
    treasureMessage.textContent = 'TREASURE UNLOCKED!';
    if (treasureState) treasureState.textContent = '✅ UNLOCKED';
    if (treasureChest) treasureChest.classList.add('is-unlocked');
    if (openSecretBtn) {
      openSecretBtn.classList.remove('hidden');
      openSecretBtn.textContent = 'OPEN TREASURE';
      openSecretBtn.disabled = false;
    }
  } else {
    treasureMessage.textContent = 'Complete all 3 games to unlock Foxy\'s Secret Treasure!';
    if (treasureState) treasureState.textContent = '🔒 LOCKED';
    if (treasureChest) treasureChest.classList.remove('is-unlocked');
    if (openSecretBtn) {
      openSecretBtn.classList.add('hidden');
      openSecretBtn.disabled = true;
    }
  }

  saveState();
}

const GRADE_MODULES = {
  3: ['School Days!', 'Family Moments!', 'All the Things I Like!', 'Come In and Play!', 'Furry Friends!', 'Home Sweet Home!', 'A Day Off!', 'Day by Day!'],
  4: ['Family & Friends!', 'A Working Day!', 'Tasty Treats!', 'At the Zoo!', 'Where Were You Yesterday?', 'Tell the Tale!', 'Days to Remember!', 'Places to Go!'],
  5: ['School Days', "That's Me!", 'My Home, My Castle', 'Family Ties', 'World Animals', 'Round the Clock', 'In All Weathers', 'Special Days', 'Modern Living', 'Holidays']
};

function renderGrade(grade) {
  const moduleGrid = document.getElementById('moduleGrid');
  const gradeLabel = document.getElementById('selectedGradeLabel');
  const moduleTitle = document.getElementById('moduleTitle');
  const moduleNote = document.getElementById('moduleNote');
  const gradeFiveContent = document.getElementById('gradeFiveContent');
  if (!moduleGrid || !GRADE_MODULES[grade]) return;

  document.querySelectorAll('.grade-tab').forEach(tab => {
    const selected = tab.dataset.grade === String(grade);
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });

  gradeLabel.textContent = `Spotlight ${grade}`;
  moduleTitle.textContent = `Grade ${grade} modules`;
  moduleNote.textContent = 'Module 1 is ready to play';
  gradeFiveContent.classList.toggle('is-hidden', grade !== 5);
  moduleGrid.innerHTML = GRADE_MODULES[grade].map((title, index) => {
    const ready = index === 0;
    const target = grade === 3 ? 'grade3/module1/index.html' : grade === 4 ? 'grade4/module1/index.html' : '#games';
    return `<article class="module-card${ready ? ' is-ready' : ''}">
      <span class="module-card__number">Module ${index + 1}</span>
      <h3>${title}</h3>
      <p>${ready ? 'Vocabulary, grammar and classroom games' : 'New games will be added here'}</p>
      <span class="module-card__status">${ready ? '✓ Ready to play' : '🔒 Coming soon'}</span>
      ${ready ? `<a class="module-card__play" href="${target}">OPEN MODULE</a>` : ''}
    </article>`;
  }).join('');

  try { localStorage.setItem('englishAdventureGrade', String(grade)); } catch (error) {}
}

window.FoxyProgress = {
  state,
  saveState,
  updateGameResult,
  resetProgress,
  getCompletedCount,
  getStarsFromScore,
  getCoinsFromScore
};

document.addEventListener('DOMContentLoaded', () => {
  const resetBtn = document.getElementById('resetProgressBtn');
  const openSecretBtn = document.getElementById('openSecretBtn');
  const musicToggleBtn = document.getElementById('musicToggle');
  const savedGrade = Number(localStorage.getItem('englishAdventureGrade')) || 5;
  const nameWelcome = document.getElementById('nameWelcome');
  const nameForm = document.getElementById('nameForm');
  const nameInput = document.getElementById('playerNameInput');
  const playerNameLabel = document.getElementById('playerNameLabel');
  const changeNameBtn = document.getElementById('changeNameBtn');
  sessionStorage.removeItem('englishAdventurePlayerName');

  function showNameForm() {
    nameWelcome.classList.remove('hidden');
    nameInput.value = sessionStorage.getItem('englishAdventurePlayerName') || '';
    window.setTimeout(() => nameInput.focus(), 50);
  }

  playerNameLabel.textContent = 'Player';
  showNameForm();
  changeNameBtn.addEventListener('click', showNameForm);
  nameForm.addEventListener('submit', event => {
    event.preventDefault();
    const playerName = nameInput.value.trim().replace(/\s+/g, ' ');
    if (!playerName) return;
    sessionStorage.setItem('englishAdventurePlayerName', playerName);
    playerNameLabel.textContent = playerName;
    nameWelcome.classList.add('hidden');
  });

  document.querySelectorAll('.grade-tab').forEach(tab => {
    tab.addEventListener('click', () => renderGrade(Number(tab.dataset.grade)));
  });
  renderGrade(savedGrade);

  if (resetBtn) {
    resetBtn.addEventListener('click', resetProgress);
  }

  if (openSecretBtn) {
    openSecretBtn.addEventListener('click', () => {
      window.location.href = 'reward/index.html?grade=5';
    });
  }

  if (musicToggleBtn) {
    musicEnabled = getMusicPreference();
    updateMusicButton();
    musicToggleBtn.addEventListener('click', toggleMusic);
  }

  renderProgress();

  if (musicEnabled) {
    ensureMusicStarted();
    document.addEventListener('pointerdown', startMusicOnce, { once: true });
  }
});

window.addEventListener('beforeunload', () => {
  if (musicAudio) {
    musicAudio.pause();
    musicAudio.currentTime = 0;
  }

  stopAmbientMusic();
});
