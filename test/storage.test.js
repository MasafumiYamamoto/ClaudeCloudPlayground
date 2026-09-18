import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadTodos,
  parseTodos,
  saveTodos,
  serializeTodos,
} from '../src/storage.js';

const KEY = 'todo-app.todos';

/** テスト用の固定データ（各テストで変更しないこと） */
const sample = Object.freeze([
  Object.freeze({ id: '1', text: '牛乳を買う', done: false }),
  Object.freeze({ id: '2', text: '部屋を掃除する', done: true }),
]);

/**
 * localStorage の代わりに使うメモリ上の保存先。
 *
 * @param {Object<string, string>} [initial] 初期データ
 */
function createMemoryStorage(initial = {}) {
  const data = { ...initial };

  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    read: (key) => (key in data ? data[key] : null),
  };
}

/** 常に例外を投げる保存先（プライベートモードや容量超過を模す） */
const brokenStorage = {
  getItem: () => {
    throw new Error('storage is not available');
  },
  setItem: () => {
    throw new Error('quota exceeded');
  },
};

describe('parseTodos', () => {
  test('保存された JSON を Todo の配列に戻す', () => {
    assert.deepEqual(parseTodos(JSON.stringify(sample)), [...sample]);
  });

  test('空配列の JSON は空配列になる', () => {
    assert.deepEqual(parseTodos('[]'), []);
  });

  test('JSON として壊れていても空配列を返す', () => {
    assert.deepEqual(parseTodos('{壊れている'), []);
    assert.deepEqual(parseTodos(''), []);
  });

  test('配列でない JSON は空配列を返す', () => {
    assert.deepEqual(parseTodos('{"id":"1"}'), []);
    assert.deepEqual(parseTodos('42'), []);
    assert.deepEqual(parseTodos('null'), []);
  });

  test('null や文字列以外を渡しても空配列を返す', () => {
    assert.deepEqual(parseTodos(null), []);
    assert.deepEqual(parseTodos(undefined), []);
    assert.deepEqual(parseTodos(123), []);
  });

  test('Todo の形をしていない要素は取り除く', () => {
    const json = JSON.stringify([
      { id: '1', text: '牛乳を買う', done: false },
      { id: 2, text: '数値の id', done: false },
      { id: '3', text: 'done が無い' },
      { id: '4', text: 'done が文字列', done: 'true' },
      null,
      'ただの文字列',
      { id: '5', text: '部屋を掃除する', done: true },
    ]);

    assert.deepEqual(parseTodos(json), [
      { id: '1', text: '牛乳を買う', done: false },
      { id: '5', text: '部屋を掃除する', done: true },
    ]);
  });

  test('余分なキーは保存の形に合わせて取り除く', () => {
    const json = JSON.stringify([
      { id: '1', text: '牛乳を買う', done: false, priority: 'high' },
    ]);

    assert.deepEqual(parseTodos(json), [
      { id: '1', text: '牛乳を買う', done: false },
    ]);
  });
});

describe('serializeTodos', () => {
  test('parseTodos で元に戻せる文字列を返す', () => {
    assert.deepEqual(parseTodos(serializeTodos(sample)), [...sample]);
  });

  test('空配列も保存できる', () => {
    assert.equal(serializeTodos([]), '[]');
  });

  test('元の配列を変更しない', () => {
    const original = [...sample];
    serializeTodos(original);
    assert.deepEqual(original, [...sample]);
  });

  test('配列以外は TypeError', () => {
    assert.throws(() => serializeTodos(null), TypeError);
    assert.throws(() => serializeTodos({ id: '1' }), TypeError);
  });
});

describe('loadTodos', () => {
  test('保存済みの Todo を読み込む', () => {
    const storage = createMemoryStorage({ [KEY]: JSON.stringify(sample) });
    assert.deepEqual(loadTodos(storage, KEY), [...sample]);
  });

  test('保存が無ければ空配列を返す', () => {
    assert.deepEqual(loadTodos(createMemoryStorage(), KEY), []);
  });

  test('保存データが壊れていても空配列を返す', () => {
    const storage = createMemoryStorage({ [KEY]: 'not json' });
    assert.deepEqual(loadTodos(storage, KEY), []);
  });

  test('保存先が例外を投げても空配列を返す', () => {
    assert.deepEqual(loadTodos(brokenStorage, KEY), []);
  });
});

describe('saveTodos', () => {
  test('保存した内容を loadTodos で読み戻せる', () => {
    const storage = createMemoryStorage();

    assert.equal(saveTodos(storage, KEY, sample), true);
    assert.deepEqual(loadTodos(storage, KEY), [...sample]);
  });

  test('空配列で上書きできる', () => {
    const storage = createMemoryStorage({ [KEY]: JSON.stringify(sample) });

    saveTodos(storage, KEY, []);
    assert.deepEqual(loadTodos(storage, KEY), []);
  });

  test('元の配列を変更しない', () => {
    const original = [...sample];
    saveTodos(createMemoryStorage(), KEY, original);
    assert.deepEqual(original, [...sample]);
  });

  test('保存先が例外を投げても落ちずに false を返す', () => {
    assert.equal(saveTodos(brokenStorage, KEY, sample), false);
  });
});
