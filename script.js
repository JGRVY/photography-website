/* ═══════════════════════════════════════════════════
   CarSpot UK — Quiz Logic
═══════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────
let allQuestions   = [];
let activeQuestions = [];
let currentIndex   = 0;
let score          = 0;
let selectedDiffs  = ['easy'];
let questionCount  = 10;
let lastSettings   = null; // for "play again"

// ── DOM References ─────────────────────────────────
const setupScreen   = document.getElementById('setup-screen');
const quizScreen    = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');

const startBtn    = document.getElementById('start-btn');
const setupError  = document.getElementById('setup-error');
const countPills  = document.querySelectorAll('.count-pill');
const diffChecks  = document.querySelectorAll('input[name="difficulty"]');

const qCounter  = document.getElementById('q-counter');
const scoreVal  = document.getElementById('score-val');
const progFill  = document.getElementById('prog-fill');
const carImg    = document.getElementById('car-img');
const imgLoader = document.getElementById('img-loader');
const answersEl = document.getElementById('answers');
const feedback  = document.getElementById('feedback');
const nextBtn   = document.getElementById('next-btn');

const rCorrect   = document.getElementById('r-correct');
const rTotal     = document.getElementById('r-total');
const rGrade     = document.getElementById('r-grade');
const rStatCorr  = document.getElementById('r-stat-correct');
const rStatWrong = document.getElementById('r-stat-wrong');
const rAccuracy  = document.getElementById('r-accuracy');
const replayBtn  = document.getElementById('replay-btn');
const resetBtn   = document.getElementById('reset-btn');


// ── Helpers ────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(screen) {
  [setupScreen, quizScreen, resultsScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function gradeText(pct) {
  if (pct === 100) return '🏆 Perfect score!';
  if (pct >= 80)  return '🚗 Petrolhead!';
  if (pct >= 60)  return '👍 Good eye!';
  if (pct >= 40)  return '🔍 Getting there…';
  return '📚 Time to brush up!';
}


// ── Setup Screen ───────────────────────────────────

countPills.forEach(pill => {
  pill.addEventListener('click', () => {
    countPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    questionCount = parseInt(pill.dataset.count);
  });
});

startBtn.addEventListener('click', () => {
  // Read selected difficulties
  selectedDiffs = [...diffChecks]
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  if (selectedDiffs.length === 0) {
    setupError.classList.remove('hidden');
    return;
  }
  setupError.classList.add('hidden');

  // Save settings for "Play Again"
  lastSettings = { diffs: [...selectedDiffs], count: questionCount };

  beginQuiz(selectedDiffs, questionCount);
});


// ── Quiz Logic ─────────────────────────────────────

function beginQuiz(diffs, count) {
  // Filter and shuffle
  const pool = shuffle(allQuestions.filter(q => diffs.includes(q.difficulty)));

  if (pool.length === 0) {
    alert('No questions available for the selected difficulty. Please add more questions to questions.json.');
    return;
  }

  // Cap count to available questions
  const actualCount = Math.min(count, pool.length);
  activeQuestions = pool.slice(0, actualCount);
  currentIndex = 0;
  score = 0;

  scoreVal.textContent = '0';
  showScreen(quizScreen);
  showQuestion(0);
}

function showQuestion(idx) {
  const q = activeQuestions[idx];
  const total = activeQuestions.length;

  // Header
  qCounter.textContent = `${idx + 1} / ${total}`;

  // Progress bar
  progFill.style.width = `${(idx / total) * 100}%`;

  // Image
  imgLoader.classList.remove('hidden');
  carImg.classList.add('loading');
  carImg.src = '';

  const tempImg = new Image();
  tempImg.onload = () => {
    carImg.src = tempImg.src;
    carImg.classList.remove('loading');
    imgLoader.classList.add('hidden');
  };
  tempImg.onerror = () => {
    // If image fails to load, show a grey placeholder
    carImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="100%25" height="100%25" fill="%23EDEDEB"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23888">Image not available</text></svg>';
    carImg.classList.remove('loading');
    imgLoader.classList.add('hidden');
  };
  tempImg.src = q.image;

  // Answers (shuffle correct into wrong options)
  const options = shuffle([q.correct, ...q.wrong]);
  answersEl.innerHTML = '';

  options.forEach(option => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.textContent = option;
    btn.addEventListener('click', () => handleAnswer(option, q.correct));
    answersEl.appendChild(btn);
  });

  // Reset footer
  feedback.textContent = '';
  feedback.className = 'feedback';
  nextBtn.classList.add('hidden');
}

function handleAnswer(selected, correct) {
  // Disable all buttons
  const buttons = answersEl.querySelectorAll('.ans-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    const label = btn.textContent;
    if (label === correct) {
      btn.classList.add('correct');
    } else if (label === selected && selected !== correct) {
      btn.classList.add('wrong');
    } else {
      btn.classList.add('dim');
    }
  });

  const isCorrect = selected === correct;

  if (isCorrect) {
    score++;
    scoreVal.textContent = score;
    feedback.textContent = '✓ Correct!';
    feedback.className = 'feedback correct';
  } else {
    feedback.innerHTML = `✗ It was <strong>${correct}</strong>`;
    feedback.className = 'feedback wrong';
  }

  nextBtn.classList.remove('hidden');
  nextBtn.textContent = '';

  // "Finish" on last question
  if (currentIndex >= activeQuestions.length - 1) {
    nextBtn.innerHTML = 'See Results <span class="btn-arrow">→</span>';
  } else {
    nextBtn.innerHTML = 'Next <span class="btn-arrow">→</span>';
  }

  // Re-bind btn-next arrow hover (it's recreated)
  nextBtn.querySelector('.btn-arrow').style.transition = 'transform 0.18s ease';
}

nextBtn.addEventListener('click', () => {
  currentIndex++;
  if (currentIndex >= activeQuestions.length) {
    showResults();
  } else {
    showQuestion(currentIndex);
  }
});


// ── Results Screen ─────────────────────────────────

function showResults() {
  const total = activeQuestions.length;
  const wrong = total - score;
  const pct   = Math.round((score / total) * 100);

  // Final progress bar
  progFill.style.width = '100%';

  rCorrect.textContent  = score;
  rTotal.textContent    = total;
  rGrade.textContent    = gradeText(pct);
  rStatCorr.textContent = score;
  rStatWrong.textContent = wrong;
  rAccuracy.textContent  = `${pct}%`;

  showScreen(resultsScreen);
}

replayBtn.addEventListener('click', () => {
  if (lastSettings) {
    beginQuiz(lastSettings.diffs, lastSettings.count);
  }
});

resetBtn.addEventListener('click', () => {
  showScreen(setupScreen);
});


// ── Load Questions ─────────────────────────────────

async function loadQuestions() {
  try {
    const res = await fetch('questions.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allQuestions = await res.json();
  } catch (err) {
    console.error('Failed to load questions.json:', err);
    // Inline fallback — remove once real questions.json is in place
    allQuestions = [];
    alert('Could not load questions.json. Make sure the file is in the same directory.');
  }
}

// ── Init ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  showScreen(setupScreen);
});
