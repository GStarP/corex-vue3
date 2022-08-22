import { hasChanged } from '../../shared';
import {
  activeEffect,
  ReactiveEffect,
  shouldTrack,
  trackEffects,
  triggerEffects
} from './effect';

export interface Ref<T = any> {
  value: T;
}

// Ref 实现类
class RefImpl<T> {
  // 用 _value 保存原始类型值
  private _value: T;
  // 无需 targetMap 两层定位，自己持有 Dep
  public dep?: Set<ReactiveEffect> = undefined;

  constructor(value: T) {
    this._value = value;
  }
  // 没有 target&key，所以不复用 track，而是自己实现
  get value() {
    trackRefValue(this);
    return this._value;
  }
  // 没有 target&key，所以不复用 trigger
  set value(newVal) {
    // 只有当值真正改变才会触发
    if (hasChanged(newVal, this._value)) {
      this._value = newVal;
      triggerRefValue(this);
    }
  }
}

// 如果符合收集条件，使用自己的 Dep 进行收集
export function trackRefValue(ref: RefImpl<any>) {
  if (shouldTrack && activeEffect) {
    // 第一次收集的时候才会创建 Dep
    // 如果初始化时就创建可能导致过多的内存使用
    trackEffects(ref.dep || (ref.dep = new Set()));
  }
}
// 如果有 Dep，则将其触发
export function triggerRefValue(ref: RefImpl<any>) {
  if (ref.dep) {
    triggerEffects(ref.dep);
  }
}

// ref 接口就是简单地返回一个 Ref 对象
export function ref<T>(value: T): Ref<T> {
  return new RefImpl(value);
}
