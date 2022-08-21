import { effect } from '../src/effect';
import { reactive } from '../src/reactive';

// 测试：effect 模块
describe('effect', () => {
  // 测试一：未经 effect 声明的函数不被响应式
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
  // 测试二：设置 options.lazy 将会延迟响应式声明
  test('lazy effect', () => {
    let original = { a: 1 };
    let observed = reactive(original);
    expect(observed).not.toBe(original);
    let b = 0;
    function setB() {
      b = observed.a - 1;
    }
    const runner = effect(setB, { lazy: true });
    observed.a = 2;
    // 未执行 runner，setB 未被响应式
    expect(b).toBe(0);
    // 已执行 runner，setB 已被响应式
    runner();
    observed.a = 10;
    expect(b).toBe(9);
  });
});
