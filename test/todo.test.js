import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  addTodo,
  clearCompleted,
  countActive,
  createTodo,
  filterTodos,
  removeTodo,
  toggleTodo,
} from '../src/todo.js';

/** テスト用の固定データ（各テストで変更しないこと） */
const sample = Object.freeze([
  Object.freeze({ id: '1', text: '牛乳を買う', done: false }),
  Object.freeze({ id: '2', text: '部屋を掃除する', done: true }),
  Object.freeze({ id: '3', text: '本を読む', done: false }),
]);

describe('createTodo', () => {
  test('未完了の Todo を生成する', () => {
    assert.deepEqual(createTodo('牛乳を買う', '1'), {
      id: '1',
      text: '牛乳を買う',
      done: false,
    });
  });

  test('テキストの前後の空白を取り除く', () => {
    assert.equal(createTodo('  牛乳を買う  ', '1').text, '牛乳を買う');
  });

  test('空文字や空白のみのテキストは拒否する', () => {
    assert.throws(() => createTodo('', '1'), /empty/);
    assert.throws(() => createTodo('   ', '1'), /empty/);
  });

  test('文字列以外の引数は TypeError', () => {
    assert.throws(() => createTodo(null, '1'), TypeError);
    assert.throws(() => createTodo('牛乳を買う', 1), TypeError);
  });
});

describe('addTodo', () => {
  test('末尾に追加する', () => {
    const result = addTodo(sample, '散歩する', '4');
    assert.equal(result.length, 4);
    assert.deepEqual(result.at(-1), { id: '4', text: '散歩する', done: false });
  });

  test('元の配列を変更しない', () => {
    const original = [...sample];
    const result = addTodo(original, '散歩する', '4');
    assert.notEqual(result, original);
    assert.deepEqual(original, [...sample]);
  });

  test('空の配列にも追加できる', () => {
    assert.deepEqual(addTodo([], '散歩する', '1'), [
      { id: '1', text: '散歩する', done: false },
    ]);
  });

  test('id が重複する場合はエラー', () => {
    assert.throws(() => addTodo(sample, '散歩する', '1'), /duplicated id: 1/);
  });

  test('空のテキストは追加できない', () => {
    assert.throws(() => addTodo(sample, '   ', '4'), /empty/);
  });
});

describe('removeTodo', () => {
  test('指定した id の Todo を取り除く', () => {
    const result = removeTodo(sample, '2');
    assert.deepEqual(
      result.map((todo) => todo.id),
      ['1', '3'],
    );
  });

  test('存在しない id では内容が変わらない', () => {
    const result = removeTodo(sample, 'unknown');
    assert.deepEqual(result, [...sample]);
  });

  test('元の配列を変更しない', () => {
    const original = [...sample];
    const result = removeTodo(original, '1');
    assert.notEqual(result, original);
    assert.equal(original.length, 3);
  });

  test('空の配列でも例外にならない', () => {
    assert.deepEqual(removeTodo([], '1'), []);
  });
});

describe('toggleTodo', () => {
  test('未完了を完了に切り替える', () => {
    const result = toggleTodo(sample, '1');
    assert.equal(result[0].done, true);
  });

  test('完了を未完了に切り替える', () => {
    const result = toggleTodo(sample, '2');
    assert.equal(result[1].done, false);
  });

  test('他の Todo には影響しない', () => {
    const result = toggleTodo(sample, '1');
    assert.deepEqual(result.slice(1), sample.slice(1));
  });

  test('2 回切り替えると元に戻る', () => {
    assert.deepEqual(toggleTodo(toggleTodo(sample, '1'), '1'), [...sample]);
  });

  test('存在しない id では内容が変わらない', () => {
    assert.deepEqual(toggleTodo(sample, 'unknown'), [...sample]);
  });

  test('元の配列と要素を変更しない', () => {
    const original = [{ id: '1', text: '牛乳を買う', done: false }];
    const result = toggleTodo(original, '1');
    assert.notEqual(result, original);
    assert.notEqual(result[0], original[0]);
    assert.equal(original[0].done, false);
  });
});

describe('clearCompleted', () => {
  test('完了済みをすべて取り除く', () => {
    assert.deepEqual(
      clearCompleted(sample).map((todo) => todo.id),
      ['1', '3'],
    );
  });

  test('完了済みが無ければ内容が変わらない', () => {
    const active = sample.filter((todo) => !todo.done);
    assert.deepEqual(clearCompleted(active), active);
  });
});

describe('filterTodos', () => {
  test('all はすべて返す', () => {
    assert.deepEqual(filterTodos(sample, 'all'), [...sample]);
  });

  test('active は未完了だけ返す', () => {
    assert.deepEqual(
      filterTodos(sample, 'active').map((todo) => todo.id),
      ['1', '3'],
    );
  });

  test('completed は完了済みだけ返す', () => {
    assert.deepEqual(
      filterTodos(sample, 'completed').map((todo) => todo.id),
      ['2'],
    );
  });

  test('all でも新しい配列を返す', () => {
    const original = [...sample];
    assert.notEqual(filterTodos(original, 'all'), original);
  });

  test('未知のフィルタはエラー', () => {
    assert.throws(() => filterTodos(sample, 'done'), /unknown filter: done/);
  });
});

describe('countActive', () => {
  test('未完了の件数を数える', () => {
    assert.equal(countActive(sample), 2);
  });

  test('空の配列は 0', () => {
    assert.equal(countActive([]), 0);
  });

  test('すべて完了なら 0', () => {
    assert.equal(
      countActive(sample.map((todo) => ({ ...todo, done: true }))),
      0,
    );
  });
});
