/**
 * Todo 一覧の永続化を担う層。
 *
 * - 保存先（localStorage 等）は引数で受け取り、グローバルには触れない
 *   （テストを決定的にするため。実際の localStorage は app.js が渡す）
 * - 保存データが壊れていても例外を投げず、安全な既定値を返す
 *
 * @typedef {import('./todo.js').Todo} Todo
 *
 * Storage は Web Storage API のうち、この層が使う部分だけを想定する。
 * @typedef {Object} StorageLike
 * @property {(key: string) => (string|null)} getItem
 * @property {(key: string, value: string) => void} setItem
 */

/**
 * 値が保存可能な Todo の形をしているか判定する。
 *
 * @param {unknown} value 検証する値
 * @returns {boolean} Todo の形なら true
 */
function isTodo(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.done === 'boolean'
  );
}

/**
 * JSON 文字列を Todo 一覧に復元する。
 *
 * 壊れたデータ（不正な JSON・配列でない・要素の形が違う）は捨てて、
 * 復元できた分だけを返す。例外は投げない。
 *
 * @param {unknown} json 保存されていた文字列（null や非文字列も許容する）
 * @returns {Todo[]} 復元できた Todo の配列。復元できなければ空配列
 */
export function parseTodos(json) {
  if (typeof json !== 'string') {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  // 1 件でも壊れていれば全部捨てる、ではなく使える分だけ残す
  return parsed.filter(isTodo).map((todo) => ({
    id: todo.id,
    text: todo.text,
    done: todo.done,
  }));
}

/**
 * Todo 一覧を保存用の JSON 文字列に変換する。
 *
 * @param {ReadonlyArray<Todo>} todos 保存する Todo 一覧
 * @returns {string} JSON 文字列
 * @throws {TypeError} todos が配列でない場合
 */
export function serializeTodos(todos) {
  if (!Array.isArray(todos)) {
    throw new TypeError('todos must be an array');
  }

  return JSON.stringify(
    todos.map((todo) => ({ id: todo.id, text: todo.text, done: todo.done })),
  );
}

/**
 * 保存先から Todo 一覧を読み込む。
 *
 * 保存が無い・壊れている・保存先が使えない（プライベートモード等）の
 * いずれでも例外を投げず、空配列を返す。
 *
 * @param {StorageLike} storage 読み込み先
 * @param {string} key 保存に使うキー
 * @returns {Todo[]} 復元できた Todo の配列
 */
export function loadTodos(storage, key) {
  let stored;
  try {
    stored = storage.getItem(key);
  } catch {
    // getItem 自体が例外を投げる環境でもアプリは起動させる
    return [];
  }

  return parseTodos(stored);
}

/**
 * Todo 一覧を保存先に書き込む。
 *
 * 容量超過などで書き込めなくても例外を投げず、false を返す。
 *
 * @param {StorageLike} storage 書き込み先
 * @param {string} key 保存に使うキー
 * @param {ReadonlyArray<Todo>} todos 保存する Todo 一覧
 * @returns {boolean} 書き込めたら true
 */
export function saveTodos(storage, key, todos) {
  try {
    storage.setItem(key, serializeTodos(todos));
    return true;
  } catch {
    // 保存できなくてもアプリの動作は継続する
    return false;
  }
}
