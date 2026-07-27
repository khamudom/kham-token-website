/** Thumbnail first, player on demand: no iframe cost (or error state) until the visitor asks. */
export function initVideoFacades(): void {
  document
    .querySelectorAll<HTMLButtonElement>(".video-facade")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const frame = document.createElement("iframe");
        frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.video}?autoplay=1`;
        frame.title = btn.getAttribute("aria-label") ?? "Video";
        frame.allow =
          "accelerometer; autoplay; encrypted-media; picture-in-picture";
        frame.allowFullscreen = true;
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        btn.replaceWith(frame);
      });
    });
}
