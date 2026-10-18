/**
 * Desktop scrollbars show only while their container scrolls, like macOS overlay scrollbars — but keep their
 * reserved gutter, so they never sit on content. One capture-phase listener marks whichever element is
 * scrolling with `data-scrolling` (<html> for the page) and clears it shortly after the last scroll event;
 * globals.css hides every thumb under `html[data-scrollbar-reveal]` except those. Touch screens draw their
 * own overlay scrollbars and are unaffected.
 *
 * Runs inline from PageLayout, before hydration. Without it (a page outside PageLayout) the attribute is
 * never set and scrollbars simply stay visible.
 */
export const SCROLLBAR_REVEAL_SCRIPT = `(function(){var d=document,h=d.documentElement;if(h.hasAttribute('data-scrollbar-reveal'))return;h.setAttribute('data-scrollbar-reveal','');d.addEventListener('scroll',function(e){var el=e.target===d?h:e.target;if(!el||!el.setAttribute)return;el.setAttribute('data-scrolling','');clearTimeout(el.__scrollbarTimer);el.__scrollbarTimer=setTimeout(function(){el.removeAttribute('data-scrolling')},800)},{capture:true,passive:true})})()`;
