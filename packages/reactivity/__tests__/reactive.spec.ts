import { effect } from '../src/effect';
import { reactive } from '../src/reactive';

// 测试：reactive 模块
describe('reactive', () => {
  // 测试一：赋予对象响应式
  test('shallow object', () => {
    let original = { a: 1 };
    let observed = reactive(original);
    // 响应式变量并非直接替换原变量
    expect(observed).not.toBe(original);
    // 响应式
    let b = 0;
    function setB() {
      b = observed.a - 1;
    }
    // 声明 setB 应被响应式
    effect(setB);
    // 更新 a，希望 setB 自动执行更新 b
    observed.a = 2;
    expect(b).toBe(1);
  });
  // 测试二：赋予嵌套对象响应式
  test('nested object', () => {
    let original = {
      obj: {
        a: 1
      }
    };
    let observed = reactive(original);
    // 嵌套变量也会被转为响应式变量
    expect(observed.obj).not.toBe(original.obj);
    // 嵌套变量响应式
    let b = 0;
    function setB() {
      b = observed.obj.a - 1;
    }
    effect(setB);
    observed.obj.a = 2;
    expect(b).toBe(1);
  });
});
