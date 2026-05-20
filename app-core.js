(function initTypewriterCore(global) {
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
    escapeHtml,
    segmentText,
    pauseFor,
    makeTokens,
    estimateDuration,
    modeLabel
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.TypewriterCore = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
