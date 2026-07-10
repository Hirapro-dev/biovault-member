(() => {
  const modal = document.querySelector('#research-modal');
  const triggers = document.querySelectorAll('.research-trigger');

  if (!modal || triggers.length === 0) {
    return;
  }

  const closeButton = modal.querySelector('.research-modal__close');
  const image = modal.querySelector('.research-modal__image');
  const title = modal.querySelector('#research-modal-title');
  const details = modal.querySelector('.research-modal__details');
  let activeTrigger = null;

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove('is-modal-open');
    activeTrigger?.focus();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const index = trigger.dataset.researchIndex;
      const sprite = trigger.dataset.sprite || 'current';
      const spriteIndex = trigger.dataset.spriteIndex || index;
      const modalTitle = trigger.dataset.title;
      const detailItems = trigger.dataset.details.split('|');

      modal.classList.toggle('research-modal--future', sprite.startsWith('future'));
      image.className = `research-modal__image research-modal__image--${sprite} research-modal__image--${sprite}-${spriteIndex}`;
      image.setAttribute('aria-label', `${modalTitle}のイラスト`);
      title.textContent = modalTitle;
      details.replaceChildren(
        ...detailItems.map((item) => {
          const listItem = document.createElement('li');
          listItem.textContent = item;
          return listItem;
        })
      );

      activeTrigger = trigger;
      modal.hidden = false;
      document.body.classList.add('is-modal-open');
      closeButton.focus();
    });
  });

  closeButton.addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  });
})();
