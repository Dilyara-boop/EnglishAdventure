const questions = [
  {
    icon: "👩",
    word: "MOTHER",
    correct: true
  },

  {
    icon: "👨",
    word: "BROTHER",
    correct: false
  },

  {
    icon: "👦",
    word: "FATHER",
    correct: false
  },

  {
    icon: "👧",
    word: "SISTER",
    correct: true
  },

  {
    icon: "👶",
    word: "MOTHER",
    correct: false
  },

  {
    icon: "👵",
    word: "GRANDMOTHER",
    correct: true
  },

  {
    icon: "👴",
    word: "GRANDFATHER",
    correct: true
  },

  {
    icon: "👩",
    word: "GRANDFATHER",
    correct: false
  },

  {
    icon: "👨‍👩‍👧‍👦",
    word: "FAMILY",
    correct: true
  },

  {
    icon: "👦",
    word: "BROTHER",
    correct: true
  }
];

let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;
let answerLocked = false;

const objectIcon =
  document.getElementById("objectIcon");

const word =
  document.getElementById("word");

const questionNumber =
  document.getElementById("questionNumber");

const scoreElement =
  document.getElementById("score");

const correctCount =
  document.getElementById("correctCount");

const progressBar =
  document.getElementById("progressBar");

const feedback =
  document.getElementById("feedback");

const speechBubble =
  document.getElementById("speechBubble");

const yesButton =
  document.getElementById("yesButton");

const noButton =
  document.getElementById("noButton");

const soundButton =
  document.getElementById("soundButton");

const foxyImage =
  document.getElementById("foxyImage");

const resultModal =
  document.getElementById("resultModal");

const finalCorrect =
  document.getElementById("finalCorrect");

const finalScore =
  document.getElementById("finalScore");

const finalStars =
  document.getElementById("finalStars");

const coinsEarned =
  document.getElementById("coinsEarned");

const playAgainButton =
  document.getElementById("playAgainButton");


const correctSound = new Audio("../../../assets/sounds/correct answer game.mp3");
const wrongSound = new Audio("../../../assets/sounds/soft wrong answer.mp3");
const victorySound = new Audio("../../../assets/sounds/game victory kids.mp3");

correctSound.volume = 0.35;
wrongSound.volume = 0.25;
victorySound.volume = 0.45;


let soundEnabled =
  localStorage.getItem(
    "englishAdventureSound"
  ) !== "off";


function updateSoundButton() {

  soundButton.textContent =
    soundEnabled
      ? "🔊 Sound On"
      : "🔇 Sound Off";
}


function playSound(audio) {

  if (!soundEnabled) return;

  audio.currentTime = 0;

  audio.play()
    .catch(() => {});
}


soundButton.addEventListener(
  "click",
  () => {

    soundEnabled =
      !soundEnabled;

    localStorage.setItem(
      "englishAdventureSound",
      soundEnabled
        ? "on"
        : "off"
    );

    updateSoundButton();
  }
);


const goodMessages = [
  "Great job!",
  "Excellent!",
  "Well done!",
  "Awesome!"
];


const wrongMessages = [
  "Try again!",
  "Look carefully!",
  "Almost!",
  "Keep going!"
];


function randomMessage(list) {

  return list[
    Math.floor(
      Math.random()
      * list.length
    )
  ];
}


function animateFoxy(type) {

  foxyImage.classList.remove(
    "happy",
    "wrong"
  );

  void foxyImage.offsetWidth;

  foxyImage.classList.add(type);
}


function showQuestion() {

  answerLocked = false;

  yesButton.disabled = false;
  noButton.disabled = false;

  feedback.textContent = "";
  feedback.className = "feedback";

  const question =
    questions[currentQuestion];

  objectIcon.textContent =
    question.icon;

  word.textContent =
    question.word;

  questionNumber.textContent =
    currentQuestion + 1;

  progressBar.style.width =
    `${((currentQuestion + 1)
      / questions.length) * 100}%`;

  speechBubble.textContent =
    "Is this correct?";
}


function answer(userAnswer) {

  if (answerLocked) return;

  answerLocked = true;

  yesButton.disabled = true;
  noButton.disabled = true;

  const question =
    questions[currentQuestion];

  const isCorrect =
    userAnswer
      === question.correct;


  if (isCorrect) {

    score += 10;
    correctAnswers++;

    scoreElement.textContent =
      score;

    correctCount.textContent =
      correctAnswers;

    feedback.textContent =
      "Correct! ⭐";

    feedback.className =
      "feedback correct";

    speechBubble.textContent =
      randomMessage(
        goodMessages
      );

    animateFoxy("happy");

    playSound(correctSound);

  } else {

    feedback.textContent =
      "Oops! Try the next one.";

    feedback.className =
      "feedback wrong";

    speechBubble.textContent =
      randomMessage(
        wrongMessages
      );

    animateFoxy("wrong");

    playSound(wrongSound);
  }


  setTimeout(
    nextQuestion,
    1000
  );
}


function nextQuestion() {

  currentQuestion++;

  if (
    currentQuestion
    >= questions.length
  ) {

    finishGame();

    return;
  }

  showQuestion();
}


yesButton.addEventListener(
  "click",
  () => answer(true)
);


noButton.addEventListener(
  "click",
  () => answer(false)
);


function getReward() {

  if (correctAnswers >= 9) {

    return {
      stars: 3,
      coins: 100
    };
  }

  if (correctAnswers >= 7) {

    return {
      stars: 2,
      coins: 80
    };
  }

  if (correctAnswers >= 6) {

    return {
      stars: 1,
      coins: 60
    };
  }

  return {
    stars: 0,
    coins: 0
  };
}


function saveProgress(stars, coins) {

  if (stars === 0) {
    return;
  }

  const STORAGE_KEY = "foxyGrade4Module1Progress";

  // Берём УЖЕ существующий прогресс.
  // Ничего не сбрасываем.
  let state;

  try {
    state = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );
  } catch (error) {
    state = null;
  }

  // Создаём структуру только если прогресса вообще ещё нет.
  if (!state || typeof state !== "object") {
    state = {
      coins: 0,
      stars: 0,
      games: {
        memory: {
          best: 0,
          completed: false,
          stars: 0
        },
        grammar: {
          best: 0,
          completed: false,
          stars: 0
        },
        classroom: {
          best: 0,
          completed: false,
          stars: 0
        }
      },
      rewardUnlocked: false
    };
  }

  // ВАЖНО:
  // существующие memory и grammar не заменяем.

  if (!state.games) {
    state.games = {};
  }

  if (!state.games.memory) {
    state.games.memory = {
      best: 0,
      completed: false,
      stars: 0
    };
  }

  if (!state.games.grammar) {
    state.games.grammar = {
      best: 0,
      completed: false,
      stars: 0
    };
  }

  if (!state.games.classroom) {
    state.games.classroom = {
      best: 0,
      completed: false,
      stars: 0
    };
  }

  if (typeof state.coins !== "number") {
    state.coins = 0;
  }

  if (typeof state.stars !== "number") {
    state.stars = 0;
  }


  // Старый результат третьей игры
  const oldBest =
    Number(state.games.classroom.best) || 0;

  const oldStars =
    Number(state.games.classroom.stars) || 0;


  // Какая награда была за старый результат
  let oldCoins = 0;

  if (oldBest >= 90) {
    oldCoins = 100;
  } else if (oldBest >= 70) {
    oldCoins = 80;
  } else if (oldBest >= 60) {
    oldCoins = 60;
  }


  // Сохраняем лучший результат
  state.games.classroom.best =
    Math.max(oldBest, score);

  state.games.classroom.stars =
    Math.max(oldStars, stars);

  state.games.classroom.completed = true;


  // Добавляем только разницу в монетах
  if (coins > oldCoins) {
    state.coins += coins - oldCoins;
  }


  // Добавляем только новые звёзды
  if (stars > oldStars) {
    state.stars += stars - oldStars;
  }


  // Проверяем все три игры
  const allCompleted =
    state.games.memory.completed === true &&
    state.games.grammar.completed === true &&
    state.games.classroom.completed === true;


  if (allCompleted) {
    state.rewardUnlocked = true;
  }


  // СОХРАНЯЕМ тот же объект,
  // не стирая Vocabulary и Grammar
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );


  console.log(
    "Saved Foxy progress:",
    state
  );
}

function finishGame() {

  const reward =
    getReward();

  finalCorrect.textContent =
    correctAnswers;

  finalScore.textContent =
    score;

  coinsEarned.textContent =
    reward.coins;


  if (reward.stars > 0) {

    finalStars.textContent =
      "⭐".repeat(
        reward.stars
      );

    speechBubble.textContent =
      "You did it! 🎉";

    playSound(victorySound);

    saveProgress(
      reward.stars,
      reward.coins
    );

  } else {

    finalStars.textContent =
      "Keep practising!";

    speechBubble.textContent =
      "Let's try again!";
  }


  resultModal.classList.remove(
    "hidden"
  );
}


function resetGame() {

  currentQuestion = 0;
  score = 0;
  correctAnswers = 0;

  scoreElement.textContent = "0";
  correctCount.textContent = "0";

  resultModal.classList.add(
    "hidden"
  );

  speechBubble.textContent =
    "Are you ready? Let's play!";

  showQuestion();
}


playAgainButton.addEventListener(
  "click",
  resetGame
);


updateSoundButton();

showQuestion();
