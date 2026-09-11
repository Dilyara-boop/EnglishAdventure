const playerName = (sessionStorage.getItem('englishAdventurePlayerName') || 'English Champion').trim();
const grade3State = JSON.parse(localStorage.getItem('foxyGrade3Module1Progress') || '{}');
const grade4State = JSON.parse(localStorage.getItem('foxyGrade4Module1Progress') || '{}');
const grade5State = JSON.parse(localStorage.getItem('foxyProgress') || '{}');
const selectedGrade = new URLSearchParams(window.location.search).get('grade') || '5';
const activeState = selectedGrade === '3' ? grade3State : selectedGrade === '4' ? grade4State : grade5State;

document.getElementById('certificateName').textContent = playerName;
document.getElementById('studentName').textContent = playerName;
document.getElementById('certificateModule').textContent = selectedGrade === '3' ? 'Spotlight 3 · Module 1 — School Days!' : selectedGrade === '4' ? 'Spotlight 4 · Module 1 — Family & Friends!' : 'Spotlight 5 · Module 1 — School Days';

const labels = selectedGrade === '3' ? ['School Subjects Master', 'Numbers Hero', 'Schoolbag Detective'] : selectedGrade === '4' ? ['Family Words Master', 'Possessives Hero', 'Family Detective'] : ['Vocabulary Master', 'Grammar Hero', 'Quiz Champion'];
document.querySelectorAll('.achievements strong').forEach((label, index) => { label.textContent = labels[index]; });

if (!activeState.rewardUnlocked) document.querySelector('.message').textContent = 'Complete all three games to unlock this certificate.';
document.getElementById('printCertificateBtn').addEventListener('click', () => window.print());
