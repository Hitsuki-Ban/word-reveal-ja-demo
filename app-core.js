(function initTypewriterCore(global) {
  const DEFAULT_SETTINGS = {
    cps: 8,
    locale: "ja-JP",
    mode: "grapheme",
    scenario: "shrine"
  };

  const SCENARIO_SAMPLES = {
    shrine: {
      "ja-JP": {
        speaker: "アカリ",
        text: "月明かりが導くこの道は、\n古の願いとともに在る。\n我らの歩みが、未来を照らす光となりますように。"
      },
      "en-US": {
        speaker: "Akari",
        text: "This path of moonlight still carries an ancient wish.\nMay our steps become a light for tomorrow."
      },
      "zh-CN": {
        speaker: "明里",
        text: "月光指引的这条路，\n承载着古老的愿望。\n愿我们的脚步，成为照亮未来的光。"
      }
    },
    battle: {
      "ja-JP": {
        speaker: "レン",
        text: "来るぞ。\n合図を待て、アカリ。\n……今だ。道を切り開く。"
      },
      "en-US": {
        speaker: "Ren",
        text: "They're coming.\nWait for my signal, Akari.\n...Now. Cut a path through."
      },
      "zh-CN": {
        speaker: "莲",
        text: "他们来了。\n明里，等我的信号。\n……就是现在。打开突破口。"
      }
    },
    narration: {
      "ja-JP": {
        speaker: "語り",
        text: "夜風が鈴を鳴らした。\n誰もいないはずの社で、灯だけが静かに揺れている。"
      },
      "en-US": {
        speaker: "Narrator",
        text: "The night wind stirred the bells.\nIn the shrine where no one should be, only the lamps moved quietly."
      },
      "zh-CN": {
        speaker: "旁白",
        text: "夜风摇响了铃。\n本该空无一人的神社里，只有灯火静静晃动。"
      }
    }
  };

  function getScenarioSample(scenario, locale) {
    const samples = SCENARIO_SAMPLES[scenario] ?? SCENARIO_SAMPLES[DEFAULT_SETTINGS.scenario];
    return samples[locale] ?? samples[DEFAULT_SETTINGS.locale];
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function segmentText(value, granularity, locale) {
    const text = String(value);

    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter(locale, { granularity });
      return Array.from(segmenter.segment(text));
    }

    if (granularity === "word") {
      return text
        .split(/(\s+)/)
        .filter(Boolean)
        .map((segment) => ({ segment, isWordLike: /\S/.test(segment) }));
    }

    if (granularity === "sentence") {
      const matches = text.match(/[^.!?。！？…]+[.!?。！？…]*\s*/g);
      return (matches ?? [text])
        .filter(Boolean)
        .map((segment) => ({ segment, isWordLike: true }));
    }

    return Array.from(text).map((segment) => ({ segment, isWordLike: /\S/.test(segment) }));
  }

  function pauseFor(value, punctuationPause) {
    if (!punctuationPause) {
      return 0;
    }

    const text = String(value);
    const trimmed = text.trim();
    if (!trimmed) return 0;
    if (/(\.\.\.|…)$/.test(trimmed)) return 360;
    if (/[。.!?！？]$/.test(trimmed)) return 240;
    if (/[，,、;；:]$/.test(trimmed)) return 120;
    if (/[—–-]$/.test(trimmed)) return 180;
    if (/\n\s*\n$/.test(text)) return 260;
    return 0;
  }

  function makeTokens(options) {
    const value = String(options.value ?? "");
    const mode = options.mode ?? "grapheme";
    const locale = options.locale ?? "ja-JP";
    const punctuationPause = options.punctuationPause ?? true;

    if (!value) {
      return [];
    }

    if (mode === "instant") {
      return [{ text: value, pause: 0, kind: "instant" }];
    }

    if (mode === "grapheme") {
      return segmentText(value, "grapheme", locale).map((item) => ({
        text: item.segment,
        pause: pauseFor(item.segment, punctuationPause),
        kind: /\s/.test(item.segment) ? "space" : "text"
      }));
    }

    if (mode === "sentence") {
      return segmentText(value, "sentence", locale).map((item) => ({
        text: item.segment,
        pause: pauseFor(item.segment, punctuationPause) + 180,
        kind: "sentence"
      }));
    }

    const parts = segmentText(value, "word", locale);
    const grouped = [];
    let current = "";
    let hasWord = false;

    parts.forEach((part) => {
      if (part.isWordLike) {
        if (hasWord && current) {
          grouped.push({
            text: current,
            pause: pauseFor(current, punctuationPause),
            kind: "word"
          });
        }
        current = part.segment;
        hasWord = true;
      } else {
        current += part.segment;
      }
    });

    if (current) {
      grouped.push({
        text: current,
        pause: pauseFor(current, punctuationPause),
        kind: hasWord ? "word" : "text"
      });
    }

    return grouped.length ? grouped : [{ text: value, pause: 0, kind: "text" }];
  }

  function estimateDuration(tokens, cps, initialDelay) {
    if (!tokens.length) {
      return 0;
    }

    const speed = Math.max(Number(cps) || 1, 1);
    const base = tokens.length * (1000 / speed);
    const pauseTotal = tokens.reduce((sum, token) => sum + (token.pause || 0), 0);
    return Math.round(base + pauseTotal + (Number(initialDelay) || 0));
  }

  function renderTokenHtml(tokens, visibleCount, softFade) {
    const count = Math.max(Number(visibleCount) || 0, 0);
    const fadeClass = softFade ? "" : " no-fade";

    return tokens
      .slice(0, count)
      .map((token) => `<span class="token visible${fadeClass}" data-kind="${token.kind}">${escapeHtml(token.text)}</span>`)
      .join("");
  }

  function modeLabel(value) {
    const labels = {
      grapheme: "文字",
      word: "単語",
      sentence: "文",
      instant: "即時"
    };
    return labels[value] ?? value;
  }

  const api = {
    DEFAULT_SETTINGS,
    SCENARIO_SAMPLES,
    escapeHtml,
    getScenarioSample,
    segmentText,
    pauseFor,
    makeTokens,
    estimateDuration,
    renderTokenHtml,
    modeLabel
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.TypewriterCore = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
