const currentEmotionElement = document.getElementById('currentEmotion');
const recentDetectionsElement = document.getElementById('recentDetections');
const alertBanner = document.getElementById('alertBanner');
const errorContainer = document.getElementById('error-container');
const moodCard = document.querySelector('.mood');

const MAX_RECENT = 5;
let history = [];
let alertTimeout;

const DISTRESS = ['anger', 'fear'];

const ui = new WebUI();
ui.on_connect(onUIConnected);
ui.on_disconnect(onUIDisconnected);
ui.on_message('emotion', handleEmotion);
ui.on_message('alert', handleAlert);

initializeConfidenceSlider();
renderHistory();

function onUIConnected() {
  errorContainer.style.display = 'none';
  errorContainer.textContent = '';
}

function onUIDisconnected() {
  errorContainer.textContent = 'Connection to Kite lost. Please check the board.';
  errorContainer.style.display = 'block';
}

function colorFor(emotion) {
  if (DISTRESS.includes(emotion)) return '#e5484d';
  if (emotion === 'joy') return '#35b27c';
  return '#4c86e8';
}

function friendlyText(emotion) {
  if (DISTRESS.includes(emotion)) return 'needs attention';
  if (emotion === 'joy') return 'looking happy';
  return 'calm and settled';
}

function handleEmotion(message) {
  const conf = Math.floor(message.confidence * 1000) / 10;
  const color = colorFor(message.emotion);

  currentEmotionElement.innerHTML = `
    <p class="mood-name" style="color:${color}">${message.emotion}</p>
    <p class="feedback-text">${friendlyText(message.emotion)} · ${conf}%</p>
  `;

  if (moodCard) moodCard.style.borderLeftColor = color;

  history.unshift(message);
  if (history.length > MAX_RECENT) history.pop();
  renderHistory();
}

function handleAlert(message) {
  alertBanner.style.display = 'block';
  playBeep();
  if (alertTimeout) clearTimeout(alertTimeout);
  alertTimeout = setTimeout(() => {
    alertBanner.style.display = 'none';
  }, 8000);
}

function renderHistory() {
  recentDetectionsElement.innerHTML = '';
  if (history.length === 0) {
    recentDetectionsElement.innerHTML = `
      <div class="no-recent-scans">
        <img src="./img/no-face.svg">
        Nothing yet
      </div>`;
    return;
  }
  history.forEach(item => {
    const conf = Math.floor(item.confidence * 1000) / 10;
    const row = document.createElement('div');
    row.className = 'scan-container';
    const cell = document.createElement('span');
    cell.className = 'scan-cell-container cell-border';
    const label = document.createElement('span');
    label.className = 'scan-content';
    label.textContent = `${item.emotion} - ${conf}%`;
    const time = document.createElement('span');
    time.className = 'scan-content-time';
    time.textContent = new Date(item.timestamp).toLocaleTimeString();
    cell.appendChild(label);
    cell.appendChild(time);
    row.appendChild(cell);
    recentDetectionsElement.appendChild(row);
  });
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 400);
  } catch (e) {}
}

function initializeConfidenceSlider() {
  const slider = document.getElementById('confidenceSlider');
  const input = document.getElementById('confidenceInput');
  const resetBtn = document.getElementById('confidenceResetButton');

  slider.addEventListener('input', updateConfidenceDisplay);
  input.addEventListener('input', () => {
    let v = parseFloat(input.value);
    if (isNaN(v)) v = 0.5;
    if (v < 0) v = 0;
    if (v > 1) v = 1;
    slider.value = v;
    updateConfidenceDisplay();
  });
  resetBtn.addEventListener('click', () => {
    slider.value = '0.5';
    input.value = '0.50';
    updateConfidenceDisplay();
  });
  updateConfidenceDisplay();
}

function updateConfidenceDisplay() {
  const slider = document.getElementById('confidenceSlider');
  const input = document.getElementById('confidenceInput');
  const valueDisplay = document.getElementById('confidenceValueDisplay');
  const progress = document.getElementById('sliderProgress');

  const value = parseFloat(slider.value);
  ui.send_message('override_th', value);
  const pct = ((value - slider.min) / (slider.max - slider.min)) * 100;
  const display = value.toFixed(2);
  valueDisplay.textContent = display;
  if (document.activeElement !== input) input.value = display;
  progress.style.width = pct + '%';
  valueDisplay.style.left = pct + '%';
}