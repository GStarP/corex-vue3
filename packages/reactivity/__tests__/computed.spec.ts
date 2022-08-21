import { computed } from '../src/computed';
import { effect } from '../src/effect';
import { ref } from '../src/ref';

// 测试：computed 模块
describe('computed', () => {
  // 测试一：赋予计算属性响应式
  test('computed attribute', () => {
    let a = ref(1);
    const b = computed(() => a.value - 1);
    // a 更新时 b 也会更新
    a.value = 2;
    expect(b.value).toBe(1);
    // b 也具有响应式
    let c = 0;
    function setC() {
      c = b.value - 1;
    }
    effect(setC);
    // a=3 -> b=2 -> c=1
    a.value = 3;
    expect(b.value).toBe(2);
    expect(c).toBe(1);
  });
  // 测试二：计算属性懒更新
  test('computed lazy update', () => {
    let a = ref(1);
    const b = computed(() => a.value - 1);
    let c = 0;
    function setC() {
      c = b.value + 1;
    }
    effect(setC);
    a.value = 2;
    // 未使用 b 时 b 并不更新，因此 c 也不会更新
    expect(c).toBe(1);
    // 使用 b 导致 b 更新，进而导致 c 更新
    expect(b.value).toBe(1);
    expect(c).toBe(2);
  });
});
