(() => {
  document.querySelectorAll('dialog .close').forEach(button => {
    button.type = 'button';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const dialog = button.closest('dialog');
      if (dialog?.open) dialog.close();
    });
  });
})();
