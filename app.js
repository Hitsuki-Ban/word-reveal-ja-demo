(() => {
  const core = window.TypewriterCore;

  const elements = {
    speakerInput: document.getElementById("speaker-input"),
    speakerName: document.getElementById("speaker-name"),
    text: document.getElementById("text"),
    charCount: document.getElementById("char-count"),
    locale: document.getElementById("locale"),
    mode: document.getElementById("mode"),
    speed: document.getElementById("speed"),
    speedOut: document.getElementById("speed-out"),
    punctuationPause: document.getElementById("punctuation-pause"),
    softFade: document.getElementById("soft-fade"),
    windowStyle: document.getElementById("window-style"),
    sampleSelect: document.getElementById("sample-select"),
    dialogueBox: document.getElementById("dialogue-box"),
    render: document.getElementById("render"),
    cursor: document.getElementById("cursor"),
    meta: document.getElementById("meta"),
    play: document.getElementById("play"),
    complete: document.getElementById("complete"),
    topMode: document.getElementById("top-mode"),
    topSpeed: document.getElementById("top-speed"),
    previewPanel: document.querySelector(".preview-panel"),
    previewModeButtons: document.querySelectorAll(".preview-modes .icon-button")
  };

  const samples = {
    shrine: {
      speaker: "アカリ",
      locale: "ja-JP",
      text: "月明かりが導くこの道は、\n古の願いとともに在る。\n我らの歩みが、未来を照らす光となりますように。"
    },
    battle: {
      speaker: "レン",
      locale: "ja-JP",
      text: "来るぞ。\n合図を待て、アカリ。\n……今だ。道を切り開く。"
    },
    narration: {
      speaker: "語り",
      locale: "ja-JP",
      text: "夜風が鈴を鳴らした。\n誰もいないはずの社で、灯だけが静かに揺れている。"
    }
  };

  let timer = null;
  let tokens = [];
  let visibleCount = 0;
  let isPlaying = false;

  function currentOptions() {
    return {
      value: elements.text.value,
      locale: elements.locale.value,
      mode: elements.mode.value,
      punctuationPause: elements.punctuationPause.checked
    };
  }

  function rebuildTokens() {
    tokens = core.makeTokens(currentOptions());
    visibleCount = elements.mode.value === "instant" ? tokens.length : 0;
  }

  function updateChrome() {
    const speaker = elements.speakerInput.value.trim() || "話者";
    const count = elements.text.value.length;
    const cps = Number(elements.speed.value);
    const duration = core.estimateDuration(tokens, cps, 180);

    elements.speakerName.textContent = speaker;
    elements.charCount.textContent = `${count} / 500`;
    elements.speedOut.textContent = `${cps} CPS`;
    elements.topMode.textContent = core.modeLabel(elements.mode.value);
    elements.topSpeed.textContent = `${cps} CPS`;
    elements.dialogueBox.className = `dialogue-box ${elements.windowStyle.value}`;

    elements.meta.innerHTML = `
      <div><dt>状態</dt><dd>${isPlaying ? "再生中" : visibleCount >= tokens.length && tokens.length ? "完了" : "待機"}</dd></div>
      <div><dt>表示</dt><dd>${visibleCount} / ${tokens.length}</dd></div>
      <div><dt>目安</dt><dd>${(duration / 1000).toFixed(2)} 秒</dd></div>
    `;
  }

  function renderTokens() {
    const fadeClass = elements.softFade.checked ? "" : " no-fade";
    elements.render.innerHTML = tokens
      .map((token, index) => {
        const classes = index < visibleCount ? `token visible${fadeClass}` : `token${fadeClass}`;
        return `<span class="${classes}" data-kind="${token.kind}">${core.escapeHtml(token.text)}</span>`;
      })
      .join("");

    elements.cursor.style.visibility = visibleCount >= tokens.length ? "hidden" : "visible";
    updateChrome();
  }

  function stop() {
    isPlaying = false;
    clearTimeout(timer);
    timer = null;
  }

  function resetPreview() {
    stop();
    rebuildTokens();
    renderTokens();
  }

  function complete() {
    stop();
    visibleCount = tokens.length;
    renderTokens();
  }

  function tick() {
    if (!isPlaying) {
      return;
    }

    if (visibleCount >= tokens.length) {
      stop();
      renderTokens();
      return;
    }

    visibleCount += 1;
    renderTokens();

    const baseDelay = 1000 / Math.max(Number(elements.speed.value), 1);
    const extraDelay = tokens[Math.max(0, visibleCount - 1)]?.pause ?? 0;
    timer = setTimeout(tick, baseDelay + extraDelay);
  }

  function play() {
    stop();
    rebuildTokens();
    renderTokens();

    if (elements.mode.value === "instant" || tokens.length === 0) {
      return;
    }

    isPlaying = true;
    updateChrome();
    tick();
  }

  function loadSample(name) {
    const sample = samples[name];
    if (!sample) return;

    elements.speakerInput.value = sample.speaker;
    elements.locale.value = sample.locale;
    elements.text.value = sample.text;
    resetPreview();
  }

  elements.play.addEventListener("click", play);
  elements.complete.addEventListener("click", complete);

  elements.speakerInput.addEventListener("input", updateChrome);
  elements.text.addEventListener("input", resetPreview);
  elements.speed.addEventListener("input", () => {
    updateChrome();
    renderTokens();
  });

  [
    elements.locale,
    elements.mode,
    elements.punctuationPause,
    elements.softFade,
    elements.windowStyle
  ].forEach((element) => element.addEventListener("change", resetPreview));

  elements.sampleSelect.addEventListener("change", () => {
    loadSample(elements.sampleSelect.value);
  });

  elements.previewModeButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      elements.previewModeButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      elements.previewPanel.classList.toggle("mobile-preview", index === 1);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space") {
      return;
    }

    const activeTag = document.activeElement?.tagName;
    if (activeTag === "TEXTAREA" || activeTag === "SELECT" || activeTag === "INPUT") {
      return;
    }

    event.preventDefault();
    if (isPlaying) {
      complete();
    } else {
      play();
    }
  });

  play();
})();
