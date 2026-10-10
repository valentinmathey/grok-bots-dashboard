export const SHEET_DISMISS_RATIO = 0.3;
export const SHEET_FLICK_VELOCITY = 0.7;
export const SHEET_TAP_SLOP = 8;

export function shouldDismissSheet({
  offsetY,
  height,
  velocityY,
  dismissRatio = SHEET_DISMISS_RATIO,
  velocityThreshold = SHEET_FLICK_VELOCITY,
}: {
  offsetY: number;
  height: number;
  velocityY: number;
  dismissRatio?: number;
  velocityThreshold?: number;
}): boolean {
  if (offsetY <= 0 || height <= 0) return false;
  return offsetY > height * dismissRatio || velocityY > velocityThreshold;
}

export function lockBodyScroll() {
  const { body, documentElement } = document;
  const scrollY = window.scrollY;
  const prev = {
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyOverflow: body.style.overflow,
    bodyWidth: body.style.width,
    htmlOverflow: documentElement.style.overflow,
    htmlOverscroll: documentElement.style.overscrollBehavior,
  };
  documentElement.style.overflow = "hidden";
  documentElement.style.overscrollBehavior = "none";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  return () => {
    body.style.position = prev.bodyPosition;
    body.style.top = prev.bodyTop;
    body.style.left = prev.bodyLeft;
    body.style.right = prev.bodyRight;
    body.style.overflow = prev.bodyOverflow;
    body.style.width = prev.bodyWidth;
    documentElement.style.overflow = prev.htmlOverflow;
    documentElement.style.overscrollBehavior = prev.htmlOverscroll;
    window.scrollTo(0, scrollY);
  };
}
