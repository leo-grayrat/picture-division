const SHOW_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

function getShowImagePaths(index) {
  return SHOW_IMAGE_EXTENSIONS.map((extension) => `show/${index}.${extension}`);
}

async function loadFirstShowImage(index, loadImage) {
  for (const src of getShowImagePaths(index)) {
    try {
      const image = await loadImage(src);
      return { src, image };
    } catch {
      // Try the next supported extension.
    }
  }

  return null;
}

const showModeApi = { getShowImagePaths, loadFirstShowImage };

if (typeof window !== "undefined") {
  window.PictureDivisionShowMode = showModeApi;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = showModeApi;
}
