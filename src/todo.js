/**
 * Todo のロジックを担う純粋関数群。
 *
 * - DOM / ブラウザ API / グローバル状態には一切触れない
 * - 引数の配列やオブジェクトは変更せず、常に新しい値を返す
 * - ここで export したものだけを app.js とテストから利用する
 *
 * @typedef {Object} Todo
 * @property {string} id       一意な識別子
 * @property {string} text     表示するテキスト
 * @property {boolean} done    完了フラグ
 */

/**
 * Todo を 1 件生成する。
 *
 * @param {string} text Todo のテキスト（前後の空白は取り除く）
 * @param {string} id   一意な識別子（呼び出し側が採番する）
 * @returns {Todo}
 * @throws {TypeError} text または id が文字列でない場合
 * @throws {Error} text が空文字（空白のみ）の場合
 */
export function createTodo(text, id) {
  if (typeof text !== 'string') {
    throw new TypeError('text must be a string');
  }
  if (typeof id !== 'string') {
    throw new TypeError('id must be a string');
  }

  const trimmed = text.trim();
  if (trimmed === '') {
    throw new Error('text must not be empty');
  }

  return { id, text: trimmed, done: false };
}

/**
 * Todo を末尾に追加した新しい配列を返す。
 *
 * @param {ReadonlyArray<Todo>} todos 現在の Todo 一覧
 * @param {string} text 追加するテキスト
 * @param {string} id   追加する Todo の識別子
 * @returns {Todo[]} 追加後の新しい配列
 * @throws {Error} id が既存の Todo と重複する場合
 */
export function addTodo(todos, text, id) {
  const todo = createTodo(text, id);
  if (todos.some((item) => item.id === todo.id)) {
    throw new Error(`duplicated id: ${todo.id}`);
  }

  return [...todos, todo];
}

/**
 * 指定した id の Todo を取り除いた新しい配列を返す。
 * 該当する Todo が無い場合は内容の等しい新しい配列を返す。
 *
 * @param {ReadonlyArray<Todo>} todos 現在の Todo 一覧
 * @param {string} id 削除する Todo の識別子
 * @returns {Todo[]} 削除後の新しい配列
 */
export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

/**
 * 指定した id の Todo の完了状態を反転した新しい配列を返す。
 * 該当する Todo が無い場合は内容の等しい新しい配列を返す。
 *
 * @param {ReadonlyArray<Todo>} todos 現在の Todo 一覧
 * @param {string} id 切り替える Todo の識別子
 * @returns {Todo[]} 切り替え後の新しい配列
 */
export function toggleTodo(todos, id) {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, done: !todo.done } : todo,
  );
}

/**
 * 完了済みの Todo をすべて取り除いた新しい配列を返す。
 *
 * @param {ReadonlyArray<Todo>} todos 現在の Todo 一覧
 * @returns {Todo[]} 未完了の Todo だけを含む新しい配列
 */
export function clearCompleted(todos) {
  // CI が赤になることの検証用に条件を反転させた意図的なバグ（検証後に戻す）
  return todos.filter((todo) => todo.done);
}

/**
 * 表示フィルタを適用した新しい配列を返す。
 *
 * @param {ReadonlyArray<Todo>} todos 現在の Todo 一覧
 * @param {'all'|'active'|'completed'} filter 適用するフィルタ
 * @returns {Todo[]} フィルタ後の新しい配列
 * @throws {Error} 未知のフィルタを渡した場合
 */
export function filterTodos(todos, filter) {
  switch (filter) {
    case 'all':
      return [...todos];
    case 'active':
      return todos.filter((todo) => !todo.done);
    case 'completed':
      return todos.filter((todo) => todo.done);
    default:
      throw new Error(`unknown filter: ${filter}`);
  }
}

/**
 * 未完了の Todo の件数を返す。
 *
 * @param {ReadonlyArray<Todo>} todos 現在の Todo 一覧
 * @returns {number} 未完了件数
 */
export function countActive(todos) {
  return todos.reduce((count, todo) => (todo.done ? count : count + 1), 0);
}
