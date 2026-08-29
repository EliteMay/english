(() => {
  const sheet = document.getElementById('paperSheet');
  const toggle = document.getElementById('inkModeBtn');
  const hint = document.getElementById('inkModeHint');
  const badge = document.getElementById('paperModeBadge');
  if (!sheet || !toggle) return;

  const setInkMode = (enabled) => {
    sheet.classList.toggle('ink-mode', enabled);
    toggle.classList.toggle('active', enabled);
    toggle.querySelector('strong').textContent = enabled ? '✎ ペンで直接書く' : 'S/Vをクリックで付ける';
    toggle.querySelector('span').textContent = enabled
      ? '英文の上に丸・下線・矢印・メモ'
      : '単語をクリックして構造ラベルを付ける';
    if (hint) hint.textContent = enabled ? 'ペン書き込みモード' : '構造ラベルモード';
    if (badge) badge.textContent = enabled ? 'PEN' : 'LABEL';
  };

  toggle.addEventListener('click', () => setInkMode(!sheet.classList.contains('ink-mode')));

  document.querySelectorAll('.inline-role-tools .role-btn').forEach((button) => {
    button.addEventListener('click', () => setInkMode(false));
  });

  document.querySelectorAll('.inline-pen-tools .pen-tool, #eraserBtn').forEach((button) => {
    button.addEventListener('click', () => setInkMode(true));
  });

  document.addEventListener('keydown', (event) => {
    if ((event.target?.tagName || '').match(/INPUT|TEXTAREA|SELECT/)) return;
    if (event.key.toLowerCase() === 'p') setInkMode(!sheet.classList.contains('ink-mode'));
  });

  setInkMode(true);
})();
