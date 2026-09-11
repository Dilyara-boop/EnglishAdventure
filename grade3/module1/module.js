const grade3Progress = (() => {
  try {
    return JSON.parse(localStorage.getItem('foxyGrade3Module1Progress')) || {};
  } catch (error) {
    return {};
  }
})();

const grade3Games = grade3Progress.games || {};
const completedGames = ['memory', 'grammar', 'classroom'].filter(key => grade3Games[key] && grade3Games[key].completed);
const treasureMessage = document.getElementById('grade3TreasureMessage');
const treasureProgress = document.getElementById('grade3TreasureProgress');
const treasureButton = document.getElementById('grade3TreasureButton');
const treasureChest = document.getElementById('grade3TreasureChest');

treasureProgress.textContent = `${completedGames.length} / 3 games completed`;

if (completedGames.length === 3) {
  treasureMessage.textContent = 'Amazing! You unlocked Foxy’s secret treasure!';
  treasureButton.textContent = '✨ OPEN TREASURE';
  treasureButton.classList.remove('is-locked');
  treasureButton.removeAttribute('aria-disabled');
  treasureChest.classList.add('is-unlocked');
}
