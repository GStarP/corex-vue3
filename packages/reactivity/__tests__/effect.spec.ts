import { reactive } from '../src/reactive';

describe('effect', () => {
  test('only effect(fn) is reactive', () => {
    let original = { a: 1 };
    let observed = reactive(original);
    expect(observed).not.toBe(original);
    let b = 0;
    function setB() {
      b = observed.a - 1;
    }
    // 未使用 effect 声明，setB 未被响应式
    setB();
    observed.a = 2;
    expect(b).toBe(0);
  });
});
