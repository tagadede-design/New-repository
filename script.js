'use strict';

// defer 属性の有無や file:// での実行にかかわらず、DOM 構築完了後に初期化する。
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('title-form');
  const genreInput = document.getElementById('genre');
  const targetInput = document.getElementById('target');
  const themeInput = document.getElementById('theme');
  const themeCount = document.getElementById('theme-count');
  const formErrorSummary = document.getElementById('form-error-summary');
  const resultsEmpty = document.getElementById('results-empty');
  const resultsContent = document.getElementById('results-content');
  const resultsSection = document.getElementById('results-section');
  const titleList = document.getElementById('title-list');
  const copyAllButton = document.getElementById('copy-all-button');
  const regenerateButton = document.getElementById('regenerate-button');
  const sampleButton = document.getElementById('sample-button');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const resultCount = document.getElementById('result-count');
  const currentYear = document.getElementById('current-year');

  let currentTitles = [];
  let toastTimer;
  let patternOffset = 0;

  currentYear.textContent = new Date().getFullYear();

  const titlePatterns = {
    'やさしい': [
      ({ theme }) => `はじめての「${theme}」｜今日からできるやさしい入門ガイド`,
      ({ target, theme }) => `${target}へ。無理なく始める${theme}のコツ`,
      ({ genre, theme }) => `知識ゼロでも大丈夫！${genre}初心者のための${theme}`,
      ({ theme }) => `${theme}で迷ったら読む記事｜基本から丁寧に解説`,
      ({ target, genre }) => `${target}が知っておきたい、${genre}の小さな一歩`,
      ({ theme }) => `焦らなくてOK。${theme}を自分のペースで続ける方法`,
      ({ genre, target }) => `${genre}をもっと身近に｜${target}向けシンプルガイド`,
      ({ theme }) => `やってみたら意外と簡単！${theme}の始め方`,
      ({ target, theme }) => `${target}の悩みを解決する「${theme}」のヒント7選`,
      ({ theme }) => `今日から少しずつ変わる。${theme}のやさしい習慣`
    ],
    '専門的': [
      ({ theme }) => `${theme}を徹底解説｜成果につなげる実践フレームワーク`,
      ({ genre, target }) => `${genre}の最新戦略：${target}が押さえるべき5つの要点`,
      ({ theme }) => `データと事例で読み解く「${theme}」の成功法則`,
      ({ target, theme }) => `${target}のための${theme}完全ガイド【保存版】`,
      ({ genre, theme }) => `${genre}の専門家が解説する、${theme}の本質`,
      ({ theme }) => `${theme}で成果を出すための設計・実践・改善プロセス`,
      ({ target, theme }) => `${target}が陥りやすい${theme}の落とし穴と対策`,
      ({ genre }) => `${genre}入門から応用まで｜体系的に学ぶロードマップ`,
      ({ theme }) => `実務で使える${theme}｜再現性を高める7つのポイント`,
      ({ genre, theme }) => `${genre}の常識を更新する「${theme}」実践論`
    ],
    '煽り気味': [
      ({ theme }) => `まだ知らないの？${theme}で差がつく決定的な理由`,
      ({ target, theme }) => `${target}必見！今すぐ${theme}を始めるべき5つの理由`,
      ({ genre }) => `知らないと損する${genre}の新常識【保存版】`,
      ({ theme }) => `9割が間違えている「${theme}」の本当のやり方`,
      ({ target, theme }) => `${target}の悩みが激変！${theme}の最強メソッド`,
      ({ theme }) => `もう遠回りしない。${theme}で結果を出す最短ルート`,
      ({ genre, theme }) => `${genre}初心者が${theme}で失敗するNG行動7選`,
      ({ theme }) => `たった10分で変わる！${theme}の意外なコツ`,
      ({ target }) => `${target}なら絶対に押さえたい、成功者だけが知る習慣`,
      ({ theme }) => `保存必須！${theme}の答えをこの記事に全部まとめました`
    ],
    '上品': [
      ({ theme }) => `暮らしを豊かにする、${theme}という選択`,
      ({ genre, theme }) => `${genre}を愉しむための「${theme}」入門`,
      ({ target, theme }) => `${target}に贈る、${theme}の美しい始め方`,
      ({ theme }) => `丁寧に向き合う。${theme}で大切にしたいこと`,
      ({ genre }) => `知性と品を感じる${genre}のたしなみ`,
      ({ theme }) => `${theme}がもたらす、心地よい変化について`,
      ({ target, genre }) => `${target}の毎日に寄り添う${genre}のヒント`,
      ({ theme }) => `本質から考える「${theme}」｜洗練された実践法`,
      ({ genre, theme }) => `${genre}のある暮らし。${theme}を無理なく続ける`,
      ({ theme }) => `静かに差がつく、${theme}の上質な習慣`
    ]
  };

  function cleanText(value) {
    return value.trim().replace(/[。！？!?]+$/g, '');
  }

  function clearFieldError(input) {
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
    document.getElementById(`${input.id}-error`).textContent = '';
  }

  function validateForm() {
    const fields = [
      { input: genreInput, name: 'ジャンル' },
      { input: targetInput, name: '読者ターゲット' },
      { input: themeInput, name: '記事テーマ' }
    ];
    const missingFields = [];

    fields.forEach(({ input, name }) => {
      const error = document.getElementById(`${input.id}-error`);
      if (!cleanText(input.value)) {
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        error.textContent = `${name}を入力してください。`;
        missingFields.push(name);
      } else {
        clearFieldError(input);
      }
    });

    if (missingFields.length > 0) {
      formErrorSummary.textContent = `入力が不足しています：${missingFields.join('、')}を入力してください。`;
      formErrorSummary.hidden = false;
      fields.find(({ input }) => input.classList.contains('invalid'))?.input.focus();
      return false;
    }

    formErrorSummary.textContent = '';
    formErrorSummary.hidden = true;
    return true;
  }

  function getSelectedTone() {
    return form.querySelector('input[name="tone"]:checked')?.value || 'やさしい';
  }

  function renderTitles() {
    titleList.replaceChildren();

    currentTitles.forEach((title, index) => {
      const item = document.createElement('li');
      item.className = 'title-item';
      item.style.animationDelay = `${index * 35}ms`;

      const text = document.createElement('span');
      text.className = 'title-text';
      text.textContent = title;

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'item-copy';
      copyButton.setAttribute('aria-label', `タイトル案${index + 1}をコピー`);
      copyButton.title = 'コピー';
      copyButton.textContent = 'コピー';
      copyButton.addEventListener('click', () => {
        copyText(title, `タイトル案${index + 1}をコピーしました`);
      });

      item.append(text, copyButton);
      titleList.appendChild(item);
    });
  }

  function generateTitles() {
    if (!validateForm()) return;

    const data = {
      genre: cleanText(genreInput.value),
      target: cleanText(targetInput.value),
      theme: cleanText(themeInput.value)
    };
    const tone = getSelectedTone();
    const patterns = titlePatterns[tone] || titlePatterns['やさしい'];

    patternOffset = currentTitles.length ? (patternOffset + 1) % patterns.length : 0;
    currentTitles = Array.from({ length: 10 }, (_, index) => {
      const pattern = patterns[(index + patternOffset) % patterns.length];
      return pattern(data);
    });

    renderTitles();
    resultCount.textContent = String(currentTitles.length);
    resultsEmpty.hidden = true;
    resultsContent.hidden = false;

    if (window.innerWidth <= 850) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    const copied = document.execCommand('copy');
    textArea.remove();
    if (!copied) throw new Error('Copy command failed');
  }

  async function copyText(text, message) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      showToast(message);
    } catch (error) {
      showToast('コピーできませんでした。タイトルを選択してコピーしてください。');
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    generateTitles();
  });

  [genreInput, targetInput, themeInput].forEach((input) => {
    input.addEventListener('input', () => {
      clearFieldError(input);
      if (!form.querySelector('.invalid')) {
        formErrorSummary.textContent = '';
        formErrorSummary.hidden = true;
      }
    });
  });

  themeInput.addEventListener('input', () => {
    themeCount.textContent = String(themeInput.value.length);
  });

  sampleButton.addEventListener('click', () => {
    genreInput.value = '副業、料理、子育て';
    targetInput.value = '副業を始めたい会社員';
    themeInput.value = '未経験からWebライターで月5万円を稼ぐ方法';
    themeCount.textContent = String(themeInput.value.length);
    form.querySelector('input[name="tone"][value="やさしい"]').checked = true;
    [genreInput, targetInput, themeInput].forEach(clearFieldError);
    formErrorSummary.textContent = '';
    formErrorSummary.hidden = true;
    showToast('入力例をセットしました');
  });

  copyAllButton.addEventListener('click', () => {
    if (currentTitles.length !== 10) {
      showToast('先にタイトル案を作成してください。');
      return;
    }
    const allTitles = currentTitles.map((title, index) => `${index + 1}. ${title}`).join('\n');
    copyText(allTitles, 'タイトル案10個をコピーしました');
  });

  regenerateButton.addEventListener('click', generateTitles);
});
