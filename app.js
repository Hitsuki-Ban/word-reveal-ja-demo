(() => {
  const elements = {
    text: document.getElementById("text"),
    locale: document.getElementById("locale"),
    mode: document.getElementById("mode"),
    speed: document.getElementById("speed"),
    speedOut: document.getElementById("speed-out"),
    punctuationPause: document.getElementById("punctuation-pause"),
    softFade: document.getElementById("soft-fade"),
    render: document.getElementById("render"),
    cursor: document.getElementById("cursor"),
    meta: document.getElementById("meta"),
    play: document.getElementById("play"),
    complete: document.getElementById("complete"),
    sampleJa: document.getElementById("sample-ja"),
    sampleEn: document.getElementById("sample-en"),
    sampleZh: document.getElementById("sample-zh")
  };

  const samples = {
    ja: {
      locale: "ja-JP",
      text: "死んだと思ってた。\n\nいや、待って。答えなくていい。\n\n扉には鍵が三つある。……そのうち一つが、今、勝手に開いた。"
    },
    en: {
      locale: "en-US",
      text: "I thought you were dead.\n\nNo, wait. Don't answer that.\n\nThere are three locks on the door... and one of them just opened by itself."
    },
    zh: {
      locale: "zh-CN",
      text: "我以为你已经死了。\n\n不，等一下。你先别回答。\n\n门上有三把锁……其中一把，刚才自己打开了。"
    }
  };

  let timer = null;
  let tokens = [];
  let visibleCount = 0;
  let isPlaying = false;

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function segmentText(value, granularity) {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter(elements.locale.value, { granularity });
      return Array.from(segmenter.segment(value));
    }

    if (granularity === "word") {
      return value
        .split(/(\s+)/)
        .filter(Boolean)
        .map((segment) => ({ segment, isWordLike: /\S/.test(segment) }));
    }

    if (granularity === "sentence") {
      const matches = value.match(/[^.!?。！？…]+[.!?。！？…]*\s*/g);
      return (matches ?? [value])
        .filter(Boolean)
        .map((segment) => ({ segment, isWordLike: true }));
    }

    return Array.from(value).map((segment) => ({ segment, isWordLike: /\S/.test(segment) }));
  }

  function pauseFor(value) {
    if (!elements.punctuationPause.checked) {
      return 0;
    }

    const trimmed = value.trim();
    if (/(\.\.\.|…)$/.test(trimmed)) return 360;
    if (/[。.!?！？]$/.test(trimmed)) return 240;
    if (/[，,、;；:]$/.test(trimmed)) return 120;
    if (/[—–-]$/.test(trimmed)) return 180;
    if (/\n\s*\n$/.test(value)) return 260;
    return 0;
  }

  function makeTokens(value) {
    if (elements.mode.value === "instant") {
      return [{ text: value, pause: 0 }];
    }

    if (elements.mode.value === "grapheme") {
      return segmentText(value, "grapheme").map((item) => ({
        text: item.segment,
        pause: pauseFor(item.segment)
      }));
    }

    if (elements.mode.value === "sentence") {
      return segmentText(value, "sentence").map((item) => ({
        text: item.segment,
        pause: pauseFor(item.segment) + 180
      }));
    }

    const parts = segmentText(value, "word");
    const grouped = [];
    let current = "";
    let hasWord = false;

    parts.forEach((part) => {
      if (part.isWordLike) {
        if (hasWord && current) {
          grouped.push({ text: current, pause: pauseFor(current) });
        }
        current = part.segment;
        hasWord = true;
      } else {
        current += part.segment;
      }
    });

    if (current) {
      grouped.push({ text: current, pause: pauseFor(current) });
    }

    return grouped.length ? grouped : [{ text: value, pause: 0 }];
  }

  function renderTokens() {
    const fadeClass = elements.softFade.checked ? "" : " no-fade";
    elements.render.innerHTML = tokens
      .map((token, index) => {
        const classes = index < visibleCount ? `token visible${fadeClass}` : `token${fadeClass}`;
        return `<span class="${classes}">${escapeHtml(token.text)}</span>`;
      })
      .join("");

    elements.cursor.style.visibility = visibleCount >= tokens.length ? "hidden" : "visible";
    elements.meta.innerHTML = `
      <div><dt>単位</dt><dd>${tokens.length}</dd></div>
      <div><dt>表示済み</dt><dd>${visibleCount}</dd></div>
      <div><dt>モード</dt><dd>${modeLabel(elements.mode.value)}</dd></div>
    `;
  }

  function modeLabel(value) {
    const labels = {
      word: "単語",
      grapheme: "文字",
      sentence: "文",
      instant: "即時"
    };
    return labels[value] ?? value;
  }

  function stop() {
    isPlaying = false;
    clearTimeout(timer);
    timer = null;
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

    const baseDelay = 1000 / Number(elements.speed.value);
    const extraDelay = tokens[Math.max(0, visibleCount - 1)]?.pause ?? 0;
    timer = setTimeout(tick, baseDelay + extraDelay);
  }

  function play() {
    stop();
    tokens = makeTokens(elements.text.value);
    visibleCount = elements.mode.value === "instant" ? tokens.length : 0;
    renderTokens();

    if (elements.mode.value !== "instant") {
      isPlaying = true;
      timer = setTimeout(tick, 180);
    }
  }

  function updateSpeed() {
    elements.speedOut.textContent = `${Number(elements.speed.value).toFixed(1)}/秒`;
  }

  function loadSample(sample) {
    elements.text.value = sample.text;
    elements.locale.value = sample.locale;
    play();
  }

  elements.play.addEventListener("click", play);
  elements.complete.addEventListener("click", complete);
  elements.sampleJa.addEventListener("click", () => loadSample(samples.ja));
  elements.sampleEn.addEventListener("click", () => loadSample(samples.en));
  elements.sampleZh.addEventListener("click", () => loadSample(samples.zh));
  elements.speed.addEventListener("input", updateSpeed);

  [
    elements.locale,
    elements.mode,
    elements.punctuationPause,
    elements.softFade
  ].forEach((element) => element.addEventListener("change", play));

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

  updateSpeed();
  play();
})();
