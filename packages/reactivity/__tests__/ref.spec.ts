import { effect } from '../src/effect';
import { ref } from '../src/ref';

// 测试：ref 模块
describe('ref', () => {
  // 测试一：赋予原始类型响应式
  test('primitive', () => {
    let a = ref(1);
    let b = 0;
    function setB() {
      b = a.value - 1;
    }
    effect(setB);
    a.value = 2;
    expect(b).toBe(1);
  });
});
