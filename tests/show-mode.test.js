const test = require("node:test");
const assert = require("node:assert/strict");

const { getShowImagePaths, loadFirstShowImage } = require("../show-mode.js");

test("展示模式按固定顺序尝试常见图片扩展名", () => {
  assert.deepEqual(getShowImagePaths(3), [
    "show/3.png",
    "show/3.jpg",
    "show/3.jpeg",
    "show/3.webp",
  ]);
});

test("展示模式返回第一个成功读取的图片", async () => {
  const attempts = [];
  const result = await loadFirstShowImage(2, async (src) => {
    attempts.push(src);
    if (src.endsWith(".jpeg")) return { src };
    throw new Error("missing");
  });

  assert.deepEqual(attempts, ["show/2.png", "show/2.jpg", "show/2.jpeg"]);
  assert.equal(result.src, "show/2.jpeg");
  assert.equal(result.image.src, "show/2.jpeg");
});

test("所有支持格式都不存在时返回 null", async () => {
  const result = await loadFirstShowImage(4, async () => {
    throw new Error("missing");
  });

  assert.equal(result, null);
});
