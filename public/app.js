const state = {
  cards: [],
  study: {
    index: 0,
    got: 0,
    missed: 0,
    revealed: false
  }
};

const els = {
  cardForm: document.querySelector('#cardForm'),
  title: document.querySelector('#title'),
  subject: document.querySelector('#subject'),
  content: document.querySelector('#content'),
  cardsGrid: document.querySelector('#cardsGrid'),
  cardCount: document.querySelector('#cardCount'),
  statusMessage: document.querySelector('#statusMessage'),
  studyButton: document.querySelector('#studyButton'),
  editDialog: document.querySelector('#editDialog'),
  editForm: document.querySelector('#editForm'),
  closeEdit: document.querySelector('#closeEdit'),
  cancelEdit: document.querySelector('#cancelEdit'),
  editId: document.querySelector('#editId'),
  editTitle: document.querySelector('#editTitle'),
  editSubject: document.querySelector('#editSubject'),
  editContent: document.querySelector('#editContent'),
  studyDialog: document.querySelector('#studyDialog'),
  closeStudy: document.querySelector('#closeStudy'),
  studyProgress: document.querySelector('#studyProgress'),
  studyCard: document.querySelector('#studyCard'),
  studySubject: document.querySelector('#studySubject'),
  studyTitle: document.querySelector('#studyTitle'),
  studyAnswer: document.querySelector('#studyAnswer'),
  missedButton: document.querySelector('#missedButton'),
  gotItButton: document.querySelector('#gotItButton'),
  studyResult: document.querySelector('#studyResult')
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function setStatus(message) {
  els.statusMessage.textContent = message;
}

function clearErrors(scope = document) {
  scope.querySelectorAll('.field-error').forEach((field) => {
    field.textContent = '';
  });
}

function showErrors(errors, prefix = '') {
  Object.entries(errors || {}).forEach(([field, message]) => {
    const target = document.querySelector(`[data-error-for="${prefix}${field[0].toUpperCase()}${field.slice(1)}"]`)
      || document.querySelector(`[data-error-for="${field}"]`);

    if (target) target.textContent = message;
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed.');
    error.data = data;
    throw error;
  }

  return data;
}

async function loadCards() {
  setStatus('Loading...');

  try {
    state.cards = await requestJson('/api/flashcards');
    renderCards();
    setStatus(state.cards.length ? '' : 'No cards yet.');
  } catch (error) {
    setStatus(error.message);
  }
}

function renderCards() {
  els.cardCount.textContent = state.cards.length;
  els.studyButton.disabled = state.cards.length === 0;

  if (state.cards.length === 0) {
    els.cardsGrid.innerHTML = `
      <div class="empty-state">
        <p>Add the first card from the left panel.</p>
      </div>
    `;
    return;
  }

  els.cardsGrid.innerHTML = state.cards.map((card) => `
    <article class="flashcard" data-id="${card.id}">
      <div class="flashcard-head">
        <span class="tag">${escapeHtml(card.subject)}</span>
        <p class="meta">${formatDate(card.createdAt)}</p>
      </div>
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.content)}</p>
      <div class="card-actions">
        <button class="secondary-action" type="button" data-action="edit" data-id="${card.id}">Edit</button>
        <button class="secondary-action danger-action" type="button" data-action="delete" data-id="${card.id}">Delete</button>
      </div>
    </article>
  `).join('');
}

function getFormData(form) {
  const data = new FormData(form);

  return {
    title: data.get('title'),
    subject: data.get('subject'),
    content: data.get('content')
  };
}

async function createCard(event) {
  event.preventDefault();
  clearErrors(els.cardForm);

  try {
    const card = await requestJson('/api/flashcards', {
      method: 'POST',
      body: JSON.stringify(getFormData(els.cardForm))
    });

    state.cards.unshift(card);
    els.cardForm.reset();
    renderCards();
    setStatus('Card saved.');
  } catch (error) {
    showErrors(error.data?.errors || {});
    setStatus(error.message);
  }
}

function openEditDialog(id) {
  const card = state.cards.find((item) => item.id === id);
  if (!card) return;

  clearErrors(els.editForm);
  els.editId.value = card.id;
  els.editTitle.value = card.title;
  els.editSubject.value = card.subject;
  els.editContent.value = card.content;
  els.editDialog.showModal();
}

async function updateCard(event) {
  event.preventDefault();
  clearErrors(els.editForm);

  const id = Number(els.editId.value);

  try {
    const updated = await requestJson(`/api/flashcards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(getFormData(els.editForm))
    });

    state.cards = state.cards.map((card) => card.id === id ? updated : card);
    renderCards();
    els.editDialog.close();
    setStatus('Card updated.');
  } catch (error) {
    showErrors(error.data?.errors || {}, 'edit');
    setStatus(error.message);
  }
}

async function deleteCard(id) {
  const card = state.cards.find((item) => item.id === id);
  if (!card) return;

  const confirmed = window.confirm(`Delete "${card.title}"?`);
  if (!confirmed) return;

  try {
    await requestJson(`/api/flashcards/${id}`, { method: 'DELETE' });
    state.cards = state.cards.filter((item) => item.id !== id);
    renderCards();
    setStatus('Card deleted.');
  } catch (error) {
    setStatus(error.message);
  }
}

function startStudy() {
  if (state.cards.length === 0) return;

  state.study = {
    index: 0,
    got: 0,
    missed: 0,
    revealed: false
  };

  els.studyResult.hidden = true;
  els.studyResult.textContent = '';
  els.missedButton.hidden = false;
  els.gotItButton.hidden = false;
  els.studyCard.hidden = false;
  els.studyDialog.showModal();
  renderStudyCard();
}

function renderStudyCard() {
  const card = state.cards[state.study.index];

  els.studyCard.classList.remove('is-flipped');
  state.study.revealed = false;
  els.missedButton.disabled = true;
  els.gotItButton.disabled = true;
  els.studyProgress.textContent = `Card ${state.study.index + 1} of ${state.cards.length}`;
  els.studySubject.textContent = card.subject;
  els.studyTitle.textContent = card.title;
  els.studyAnswer.textContent = card.content;
}

function flipStudyCard() {
  if (els.studyResult.hidden === false) return;

  state.study.revealed = !state.study.revealed;
  els.studyCard.classList.toggle('is-flipped', state.study.revealed);
  els.missedButton.disabled = !state.study.revealed;
  els.gotItButton.disabled = !state.study.revealed;
}

function markStudyCard(gotIt) {
  if (gotIt) {
    state.study.got += 1;
  } else {
    state.study.missed += 1;
  }

  state.study.index += 1;

  if (state.study.index >= state.cards.length) {
    finishStudy();
    return;
  }

  renderStudyCard();
}

function finishStudy() {
  const total = state.cards.length;
  const percent = Math.round((state.study.got / total) * 100);

  els.studyCard.hidden = true;
  els.missedButton.hidden = true;
  els.gotItButton.hidden = true;
  els.studyProgress.textContent = 'Session Complete';
  els.studyResult.hidden = false;
  els.studyResult.textContent = `${state.study.got} of ${total} correct (${percent}%).`;
}

els.cardForm.addEventListener('submit', createCard);
els.editForm.addEventListener('submit', updateCard);
els.closeEdit.addEventListener('click', () => els.editDialog.close());
els.cancelEdit.addEventListener('click', () => els.editDialog.close());
els.studyButton.addEventListener('click', startStudy);
els.closeStudy.addEventListener('click', () => els.studyDialog.close());
els.studyCard.addEventListener('click', flipStudyCard);
els.studyCard.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    flipStudyCard();
  }
});
els.gotItButton.addEventListener('click', () => markStudyCard(true));
els.missedButton.addEventListener('click', () => markStudyCard(false));

els.cardsGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = Number(button.dataset.id);

  if (button.dataset.action === 'edit') {
    openEditDialog(id);
  }

  if (button.dataset.action === 'delete') {
    deleteCard(id);
  }
});

loadCards();
