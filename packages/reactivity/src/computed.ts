import { ReactiveEffect } from './effect';
import { trackRefValue, triggerRefValue } from './ref';

export interface ComputedRef<T = any> {
  readonly value: T;
}
export type ComputedGetter<T> = (...args: any[]) => T;

// Computed 实现类
export class ComputedRefImpl<T> {
  // 保存计算属性
  private _value!: T;
  // 自己持有 Dep
  public dep?: Set<ReactiveEffect> = undefined;
  // getter 将被包装为 RE
  public readonly effect: ReactiveEffect;
  // 脏位：标记计算属性是否应该更新
  public _dirty = true;

  constructor(getter: ComputedGetter<T>) {
    this.effect = new ReactiveEffect(getter, () => {
      // 在被触发时（计算属性依赖的响应式变量更新时）
      // 不会立即执行 getter 更新 _value，只是设置脏位
      if (!this._dirty) {
        this._dirty = true;
        // 当然，还是要进行触发，执行依赖计算属性的函数
        triggerRefValue(this);
      }
    });
    // 记录 RE.computed
    this.effect.computed = this;
  }

  get value() {
    // ComputedRef 与 Ref 相同，都持有 value 和 Dep
    // 因此 track/trigger 可以复用
    trackRefValue(this);
    // 只有在读取计算属性时才会执行 getter 更新 value
    if (this._dirty) {
      this._value = this.effect.run();
      // _value 已是最新，还原脏位
      this._dirty = false;
    }
    return this._value;
  }
  /* 目前不支持 set */
}

// computed 接口就是简单返回一个 ComputedRef 对象
export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T> {
  return new ComputedRefImpl(getter);
}
