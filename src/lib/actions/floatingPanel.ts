/** Append the node to a target (default `document.body`) so it escapes overflow clipping. */
export function portal(node: HTMLElement, target: string | HTMLElement = "body") {
  const parent =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!parent) return;
  parent.appendChild(node);
  return {
    destroy() {
      if (node.parentNode === parent) {
        parent.removeChild(node);
      }
    },
  };
}

export type FloatingPanelOptions = {
  getAnchor: () => HTMLElement | null | undefined;
  gap?: number;
  placement?: "above" | "below";
  align?: "start" | "end";
  zIndex?: number;
};

/** Position a portaled panel with `position: fixed` relative to an anchor. */
export function floatingPanel(node: HTMLElement, options: FloatingPanelOptions) {
  let opts = options;
  const gap = () => opts.gap ?? 6;
  const zIndex = () => opts.zIndex ?? 250;
  const margin = 8;

  function position() {
    const anchor = opts.getAnchor();
    if (!anchor) return;

    const ar = anchor.getBoundingClientRect();
    const panelW = node.offsetWidth;
    const panelH = node.offsetHeight;

    let left = ar.left;
    if (opts.align === "end") {
      left = ar.right - panelW;
    }
    if (left + panelW > window.innerWidth - margin) {
      left = window.innerWidth - margin - panelW;
    }
    if (left < margin) left = margin;

    let top: number;
    if (opts.placement === "below") {
      top = ar.bottom + gap();
      if (top + panelH > window.innerHeight - margin) {
        top = ar.top - gap() - panelH;
      }
    } else {
      top = ar.top - gap() - panelH;
      if (top < margin) {
        top = ar.bottom + gap();
      }
    }

    node.style.position = "fixed";
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
    node.style.right = "auto";
    node.style.bottom = "auto";
    node.style.zIndex = String(zIndex());
  }

  const schedulePosition = () => {
    requestAnimationFrame(() => {
      position();
      requestAnimationFrame(position);
    });
  };

  schedulePosition();

  const onScroll = () => position();
  const onResize = () => position();
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onResize);

  return {
    update(newOpts: FloatingPanelOptions) {
      opts = newOpts;
      schedulePosition();
    },
    destroy() {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    },
  };
}
