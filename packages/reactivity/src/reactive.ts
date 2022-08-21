import { hasChanged, isObject } from '../../shared';
import { track, trigger } from './effect';

const reactiveMap = new WeakMap();

export function reactive<T extends object>(target: T): T {
  // 一个对象只有一个代理对象
  // 如果已经创建，可以直接返回缓存中的代理对象
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  // 创建代理对象
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      // 如果不使用 Reflect.get，在取原型链属性
      // 即 target !== receiver 时可能出现 BUG
      const res = Reflect.get(target, key, receiver);
      // 使用对象属性，收集依赖
      track(target, key);
      // 如果对象属性还是对象，也要赋予其响应式
      if (isObject(res)) return reactive(res);
      return res;
    },
    set(target, key, value, receiver) {
      // 存储旧值
      let oldValue = target[key];
      // 和使用 Reflect.get 原因相同
      const result = Reflect.set(target, key, value, receiver);
      // 只有当值真正发生了变化才会触发依赖其的函数
      if (hasChanged(value, oldValue)) {
        trigger(target, key);
      }
      return result;
    }
  });
  // 缓存代理对象
  reactiveMap.set(target, proxy);
  return proxy;
}
