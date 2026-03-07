/**
 * Scrolls an element into view within its nearest scrollable ancestor,
 * WITHOUT scrolling the body/html viewport (which would break fixed TV layouts).
 */
export function scrollIntoViewSafe(el: HTMLElement | null): void {
  if (!el) return;

  let parent = el.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      const parentRect = parent.getBoundingClientRect();
      const childRect = el.getBoundingClientRect();
      if (childRect.bottom > parentRect.bottom) {
        parent.scrollTop += childRect.bottom - parentRect.bottom + 20;
      } else if (childRect.top < parentRect.top) {
        parent.scrollTop -= parentRect.top - childRect.top + 20;
      }
      return;
    }
    parent = parent.parentElement;
  }
}
