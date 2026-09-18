/**
 * DOM と状態管理をつなぐ層。
 *
 * ロジックは src/todo.js の純粋関数に任せ、このファイルでは
 * 「状態の保持」「DOM の描画」「イベントの受け取り」だけを行う。
 */

import {
  addTodo,
  clearCompleted,
  countActive,
  filterTodos,
  removeTodo,
  toggleTodo,
} from './src/todo.js';
import { loadTodos, saveTodos } from './src/storage.js';

const STORAGE_KEY = 'todo-app.todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyMessage = document.getElementById('empty-message');
const countLabel = document.getElementById('todo-count');
const clearButton = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('[data-filter]');
const itemTemplate = document.getElementById('todo-item-template');

const storage = getStorage();

/** @type {import('./src/todo.js').Todo[]} */
let todos = loadTodos(storage, STORAGE_KEY);

/** @type {'all'|'active'|'completed'} */
let currentFilter = 'all';

/**
 * 保存先として使う localStorage を返す。
 *
 * プライベートモードなどでは参照そのものが例外になるため、
 * その場合は「保存しない」ダミーを返してアプリは動かし続ける。
 *
 * @returns {import('./src/storage.js').StorageLike}
 */
function getStorage() {
  try {
    if (window.localStorage !== null) {
      return window.localStorage;
    }
  } catch {
    // 参照できない環境では下のダミーにフォールバックする
  }

  return { getItem: () => null, setItem: () => {} };
}

/**
 * 一意な id を採番する。
 *
 * @returns {string}
 */
function nextId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 状態を更新して保存・再描画する。
 *
 * @param {import('./src/todo.js').Todo[]} nextTodos 新しい Todo 一覧
 */
function update(nextTodos) {
  todos = nextTodos;
  saveTodos(storage, STORAGE_KEY, todos);
  render();
}

/**
 * Todo 1 件分の要素を組み立てる。
 *
 * @param {import('./src/todo.js').Todo} todo
 * @returns {DocumentFragment}
 */
function createItem(todo) {
  const fragment = itemTemplate.content.cloneNode(true);
  const item = fragment.querySelector('.list__item');
  const checkbox = fragment.querySelector('.list__checkbox');
  const text = fragment.querySelector('.list__text');

  item.dataset.id = todo.id;
  item.classList.toggle('list__item--done', todo.done);
  checkbox.checked = todo.done;
  // textContent を使い、入力をそのまま文字列として扱う（HTML として解釈させない）
  text.textContent = todo.text;

  return fragment;
}

/** 現在の状態を DOM に反映する。 */
function render() {
  const visible = filterTodos(todos, currentFilter);

  list.replaceChildren(...visible.map(createItem));
  emptyMessage.hidden = visible.length > 0;

  const active = countActive(todos);
  countLabel.textContent = `未完了 ${active} 件`;
  clearButton.disabled = active === todos.length;

  for (const button of filterButtons) {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.filter === currentFilter),
    );
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (text === '') {
    return;
  }

  update(addTodo(todos, text, nextId()));
  input.value = '';
  input.focus();
});

list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="remove"]');
  if (button === null) {
    return;
  }

  const { id } = button.closest('.list__item').dataset;
  update(removeTodo(todos, id));
});

list.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (checkbox === null) {
    return;
  }

  const { id } = checkbox.closest('.list__item').dataset;
  update(toggleTodo(todos, id));
});

clearButton.addEventListener('click', () => {
  update(clearCompleted(todos));
});

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    render();
  });
}

render();
