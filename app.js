const canvas = document.querySelector("#imageCanvas");
const ctx = canvas.getContext("2d");
const fileInput = document.querySelector("#fileInput");
const rowsInput = document.querySelector("#rowsInput");
const colsInput = document.querySelector("#colsInput");
const applyGridButton = document.querySelector("#applyGridButton");
const randomRevealButton = document.querySelector("#randomRevealButton");
const revealAllButton = document.querySelector("#revealAllButton");
const resetButton = document.querySelector("#resetButton");
const exportButton = document.querySelector("#exportButton");
const emptyState = document.querySelector("#emptyState");
const dropZone = document.querySelector("#dropZone");
const gridStatus = document.querySelector("#gridStatus");
const revealedStatus = document.querySelector("#revealedStatus");
const messageStatus = document.querySelector("#messageStatus");

const state = {
  image: null,
  imageName: "anime-guess",
  rows: 5,
  cols: 9,
  revealed: [],
  step: 0,
  hoverIndex: -1,
};

canvas.classList.add("is-empty");
updateStatus("等待导入图片");
syncGridStatus();

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) loadImageFile(file);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  const [file] = event.dataTransfer.files;
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    updateStatus("请导入图片文件");
    return;
  }
  loadImageFile(file);
});

applyGridButton.addEventListener("click", () => {
  applyGridFromInputs();
  if (state.image) {
    resetRevealed();
    draw();
    updateStatus("已应用新网格，并全部遮蔽");
  }
});

canvas.addEventListener("click", (event) => {
  if (!state.image) {
    updateStatus("请先导入图片");
    return;
  }

  const index = getCellIndexFromEvent(event);
  if (index === -1) return;

  state.revealed[index] = !state.revealed[index];
  state.step += 1;
  draw();
  updateStatus(state.revealed[index] ? `已翻开第 ${index + 1} 格` : `已遮蔽第 ${index + 1} 格`);
});

canvas.addEventListener("mousemove", (event) => {
  if (!state.image) return;
  const index = getCellIndexFromEvent(event);
  if (index !== state.hoverIndex) {
    state.hoverIndex = index;
    draw();
  }
});

canvas.addEventListener("mouseleave", () => {
  if (state.hoverIndex !== -1) {
    state.hoverIndex = -1;
    draw();
  }
});

randomRevealButton.addEventListener("click", () => {
  if (!state.image) {
    updateStatus("请先导入图片");
    return;
  }

  const hiddenCells = state.revealed
    .map((isRevealed, index) => (isRevealed ? -1 : index))
    .filter((index) => index !== -1);

  if (hiddenCells.length === 0) {
    updateStatus("已经全部翻开");
    return;
  }

  const index = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
  state.revealed[index] = true;
  state.step += 1;
  draw();
  updateStatus(`随机翻开第 ${index + 1} 格`);
});

revealAllButton.addEventListener("click", () => {
  if (!state.image) {
    updateStatus("请先导入图片");
    return;
  }

  state.revealed.fill(true);
  state.step += 1;
  draw();
  updateStatus("已全部翻开");
});

resetButton.addEventListener("click", () => {
  if (!state.image) {
    updateStatus("请先导入图片");
    return;
  }

  resetRevealed();
  draw();
  updateStatus("已全部遮蔽");
});

exportButton.addEventListener("click", () => {
  if (!state.image) {
    updateStatus("请先导入图片");
    return;
  }

  draw({ includeHover: false });
  const link = document.createElement("a");
  const safeName = state.imageName.replace(/[^\w-]+/g, "-").replace(/-+$/g, "") || "anime-guess";
  const step = String(state.step).padStart(3, "0");
  link.download = `${safeName}-${state.rows}x${state.cols}-step-${step}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  draw();
  updateStatus("已导出当前图片");
});

function loadImageFile(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    const image = new Image();
    image.addEventListener("load", () => {
      state.image = image;
      state.imageName = file.name.replace(/\.[^.]+$/, "");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.classList.remove("is-empty");
      emptyState.classList.add("is-hidden");
      applyGridFromInputs();
      resetRevealed();
      setControlsEnabled(true);
      draw();
      updateStatus("图片已导入，当前为全遮蔽");
    });
    image.addEventListener("error", () => updateStatus("图片读取失败"));
    image.src = reader.result;
  });

  reader.addEventListener("error", () => updateStatus("文件读取失败"));
  reader.readAsDataURL(file);
}

function applyGridFromInputs() {
  state.rows = clampInteger(rowsInput.value, 1, 20, 4);
  state.cols = clampInteger(colsInput.value, 1, 20, 5);
  rowsInput.value = state.rows;
  colsInput.value = state.cols;
  syncGridStatus();
}

function resetRevealed() {
  state.revealed = Array.from({ length: state.rows * state.cols }, () => false);
  state.step += 1;
  syncGridStatus();
}

function draw(options = {}) {
  const includeHover = options.includeHover !== false;
  if (!state.image) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.image, 0, 0, canvas.width, canvas.height);

  const cellWidth = canvas.width / state.cols;
  const cellHeight = canvas.height / state.rows;

  ctx.save();
  ctx.fillStyle = "#000000";
  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const index = row * state.cols + col;
      if (!state.revealed[index]) {
        ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
      }
    }
  }
  ctx.restore();

  drawGrid(cellWidth, cellHeight);

  if (includeHover && state.hoverIndex !== -1) {
    drawHover(cellWidth, cellHeight);
  }

  syncGridStatus();
}

function drawGrid(cellWidth, cellHeight) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
  ctx.lineWidth = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) / 400));

  for (let col = 1; col < state.cols; col += 1) {
    const x = Math.round(col * cellWidth) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let row = 1; row < state.rows; row += 1) {
    const y = Math.round(row * cellHeight) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHover(cellWidth, cellHeight) {
  const row = Math.floor(state.hoverIndex / state.cols);
  const col = state.hoverIndex % state.cols;

  ctx.save();
  ctx.strokeStyle = "#18a883";
  ctx.lineWidth = Math.max(4, Math.round(Math.min(canvas.width, canvas.height) / 220));
  ctx.strokeRect(col * cellWidth + 2, row * cellHeight + 2, cellWidth - 4, cellHeight - 4);
  ctx.restore();
}

function getCellIndexFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);

  if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return -1;

  const col = Math.min(state.cols - 1, Math.floor(x / (canvas.width / state.cols)));
  const row = Math.min(state.rows - 1, Math.floor(y / (canvas.height / state.rows)));
  return row * state.cols + col;
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function setControlsEnabled(enabled) {
  randomRevealButton.disabled = !enabled;
  revealAllButton.disabled = !enabled;
  resetButton.disabled = !enabled;
  exportButton.disabled = !enabled;
}

function syncGridStatus() {
  const total = state.rows * state.cols;
  const revealedCount = state.revealed.filter(Boolean).length;
  gridStatus.textContent = `${state.rows} x ${state.cols}`;
  revealedStatus.textContent = `${revealedCount} / ${total}`;
}

function updateStatus(message) {
  messageStatus.textContent = message;
}
