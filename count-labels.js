(() => {
  const originalRenderDayCards = renderDayCards;
  renderDayCards = function(target, type) {
    originalRenderDayCards(target, type);
    target.querySelectorAll('.count-pill').forEach(pill => {
      pill.textContent = pill.textContent.replace(/suggestions?/i, 'entries');
    });
  };
})();
