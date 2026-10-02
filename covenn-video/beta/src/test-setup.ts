// Réglages communs des tests : jsdom n'implémente pas le défilement.
if (typeof window !== 'undefined') {
  window.scrollTo = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
}
