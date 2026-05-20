const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_SETTINGS,
  escapeHtml,
  estimateDuration,
  getScenarioSample,
  makeTokens,
  modeLabel,
  pauseFor
} = require("../app-core");

test("escapeHtml keeps user script text inert", () => {
  assert.equal(
    escapeHtml("<script>&</script>"),
    "&lt;script&gt;&amp;&lt;/script&gt;"
  );
});

test("Japanese default mode reveals by visible characters", () => {
  const tokens = makeTokens({
    value: "月明かり。",
    locale: "ja-JP",
    mode: "grapheme",
    punctuationPause: true
  });

  assert.deepEqual(tokens.map((token) => token.text), ["月", "明", "か", "り", "。"]);
  assert.equal(tokens.at(-1).pause, 240);
});

test("word mode groups following Japanese punctuation with the word-like unit", () => {
  const tokens = makeTokens({
    value: "アカリ、待って。",
    locale: "ja-JP",
    mode: "word",
    punctuationPause: true
  });

  assert.equal(tokens.map((token) => token.text).join(""), "アカリ、待って。");
  assert.ok(tokens.some((token) => token.pause > 0));
});

test("empty text returns no tokens and zero duration", () => {
  const tokens = makeTokens({ value: "", mode: "grapheme" });

  assert.equal(tokens.length, 0);
  assert.equal(estimateDuration(tokens, 18, 180), 0);
});

test("duration includes cps, initial delay, and punctuation pauses", () => {
  const tokens = makeTokens({
    value: "はい。",
    locale: "ja-JP",
    mode: "grapheme",
    punctuationPause: true
  });

  assert.equal(estimateDuration(tokens, 10, 100), 640);
});

test("modeLabel returns localized labels", () => {
  assert.equal(modeLabel("grapheme"), "文字");
  assert.equal(modeLabel("instant"), "即時");
});

test("default cps is tuned for readable VN preview pacing", () => {
  assert.equal(DEFAULT_SETTINGS.cps, 12);
});

test("scenario samples return localized speaker and script", () => {
  const english = getScenarioSample("shrine", "en-US");
  const chinese = getScenarioSample("battle", "zh-CN");

  assert.equal(english.speaker, "Akari");
  assert.match(english.text, /moonlight/i);
  assert.equal(chinese.speaker, "莲");
  assert.match(chinese.text, /等我的信号/);
});
