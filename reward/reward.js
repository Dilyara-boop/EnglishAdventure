const state = JSON.parse(localStorage.getItem('foxyProgress') || '{"games":{},"coins":0,"stars":0,"rewardUnlocked":false}');

const panel = document.querySelector('.reward-panel');
const bubble = document.querySelector('.fox-bubble');

if (state.rewardUnlocked) {
  panel.classList.remove('locked');
  panel.innerHTML = `
    <div class="fox-bubble">Amazing!<br />You completed all three games!</div>
    <h1>🏆 Congratulations!</h1>
    <p>You completed Module 1 — School Days!</p>
    <div class="reward-results">
      <p><strong>Total Fox Coins:</strong> ${state.coins || 0}</p>
      <p><strong>Stars:</strong> ${state.stars || 0}</p>
      <p>📚 Vocabulary Master</p>
      <p>✏️ Grammar Hero</p>
      <p>🎒 Classroom Champion</p>
    </div>
    <div class="reward-badge">🏆 Module 1 Champion</div>
    <button class="btn btn-primary reward-btn" type="button">🎁 Open Your Secret Prize</button>
    <p class="reward-note">Your secret prize is coming soon!</p>
  `;
} else {
  bubble.textContent = 'Foxy says: Complete all three games first!';
}
