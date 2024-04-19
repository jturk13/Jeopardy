// app.js

let categories = [];
const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;

async function getCategoryIds() {
  try {
    const response = await axios.get(`https://jservice.io/api/categories?count=${NUM_CATEGORIES}`);
    return response.data.map(category => category.id);
  } catch (error) {
    console.error('Error fetching category IDs:', error);
    throw error;
  }
}

async function getCategory(catId) {
  try {
    const response = await axios.get(`https://jservice.io/api/category?id=${catId}`);
    return {
      title: response.data.title, 
      clues: response.data.clues.slice(0, NUM_QUESTIONS_PER_CAT).map(clue => ({ question: clue.question, answer: clue.answer, showing: null })),
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
}

async function fillTable() {
  showLoading();
  try {
    const categoryIds = await getCategoryIds();
    categories = await Promise.all(categoryIds.map(catId => getCategory(catId)));
    hideLoading();
    renderBoard();
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    showError('Failed to fetch data. Please try again.');
    // Retry the request after a certain interval
    retryFillTableAfterDelay();
  }
}

function handleClick(row, col) {
  const currentClue = categories[col].clues[row];
  if (currentClue.showing === null) {
    updateBoard(row, col, currentClue.question, 'question');
    currentClue.showing = 'question';
  } else if (currentClue.showing === 'question') {
    updateBoard(row, col, currentClue.answer, 'answer');
    currentClue.showing = 'answer';
  }
}

function showLoading() {
  document.getElementById('spin-container').style.display = 'block';
}

function hideLoading() {
  document.getElementById('spin-container').style.display = 'none';
}

function renderBoard() {
  const jeopardyTable = document.getElementById('jeopardy');
  const jeopardyHeader = jeopardyTable.querySelector('thead');
  const jeopardyBody = jeopardyTable.querySelector('tbody');

  jeopardyHeader.innerHTML = '';
  jeopardyBody.innerHTML = '';

  const headerRow = document.createElement('tr');
  categories.forEach(category => {
    const th = document.createElement('th');
    th.textContent = category.title;
    headerRow.appendChild(th);
  });
  jeopardyHeader.appendChild(headerRow);

  for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < NUM_CATEGORIES; j++) {
      const td = document.createElement('td');
      td.textContent = '?';
      td.dataset.row = i;
      td.dataset.col = j;
      td.classList.add('unrevealed');
      row.appendChild(td);
    }
    jeopardyBody.appendChild(row);
  }
}

function updateBoard(row, col, content, className) {
  const cell = document.querySelector(`#jeopardy [data-row="${row}"][data-col="${col}"]`);
  cell.textContent = content;
  cell.classList.remove('unrevealed', 'question', 'answer');
  cell.classList.add(className);
  cell.removeEventListener('click', handleClick);
}

async function setupAndStart() {
  clearError();
  await fillTable();
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('start').addEventListener('click', setupAndStart);
});

document.getElementById('jeopardy').addEventListener('click', function (evt) {
  if (evt.target.tagName === 'TD') {
    const row = parseInt(evt.target.dataset.row);
    const col = parseInt(evt.target.dataset.col);
    if (!isNaN(row) && !isNaN(col)) {
      handleClick(row, col);
    }
  }
});

function retryFillTableAfterDelay() {
  // Retry the request after a certain interval
  const retryInterval = 5000; // 5 seconds
  setTimeout(() => {
    console.log('Retrying fillTable...');
    fillTable();
  }, retryInterval);
}

function showError(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

function clearError() {
  document.getElementById('error-message').style.display = 'none';
}
