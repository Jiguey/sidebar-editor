/** Fixed 3px custom thumb — native scrollbars grow on hover in WebKitGTK (Tauri/Linux). */
export function tabStripScroll(node: HTMLElement) {
  const wrap = node.closest(".tab-strip-scroll-wrap");
  if (!(wrap instanceof HTMLElement)) {
    return { destroy() {} };
  }

  node.classList.add("tab-strip-scroll-native-hidden");

  const track = document.createElement("div");
  track.className = "tab-strip-scroll-track";
  track.hidden = true;
  track.setAttribute("aria-hidden", "true");

  const thumb = document.createElement("div");
  thumb.className = "tab-strip-scroll-thumb";
  track.appendChild(thumb);
  wrap.appendChild(track);

  let hovering = false;

  const sync = () => {
    const overflow = node.scrollWidth > node.clientWidth + 1;
    node.classList.toggle("can-scroll", overflow);

    if (!overflow || !hovering) {
      track.hidden = true;
      return;
    }

    track.hidden = false;
    const view = node.clientWidth;
    const total = node.scrollWidth;
    const maxScroll = total - view;
    const thumbPct = Math.max((view / total) * 100, 6);
    const travel = 100 - thumbPct;
    const leftPct = maxScroll > 0 ? (node.scrollLeft / maxScroll) * travel : 0;

    thumb.style.width = `${thumbPct}%`;
    thumb.style.left = `${leftPct}%`;
  };

  const onEnter = () => {
    hovering = true;
    sync();
  };

  const onLeave = () => {
    hovering = false;
    track.hidden = true;
  };

  wrap.addEventListener("mouseenter", onEnter);
  wrap.addEventListener("mouseleave", onLeave);
  node.addEventListener("scroll", sync, { passive: true });

  const onWheel = (e: WheelEvent) => {
    if (node.scrollWidth <= node.clientWidth + 1) return;
    let delta =
      Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta === 0) return;
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
    else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      delta *= node.clientWidth;
    }
    e.preventDefault();
    e.stopPropagation();
    node.scrollLeft += delta;
  };

  /** Capture on wrap so wheel works over tab buttons, not only the scroll gutter. */
  wrap.addEventListener("wheel", onWheel, { passive: false, capture: true });
  node.addEventListener("wheel", onWheel, { passive: false });

  const ro = new ResizeObserver(sync);
  ro.observe(node);

  const mo = new MutationObserver(sync);
  mo.observe(node, { childList: true, subtree: true, characterData: true });

  window.addEventListener("resize", sync);
  sync();

  return {
    destroy() {
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      node.removeEventListener("scroll", sync);
      wrap.removeEventListener("wheel", onWheel, { capture: true });
      node.removeEventListener("wheel", onWheel);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", sync);
      track.remove();
      node.classList.remove("can-scroll", "tab-strip-scroll-native-hidden");
    },
  };
}
