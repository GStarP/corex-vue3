import { isArray } from '../../shared/src';
import { ComputedRefImpl } from './computed';

const targetMap = new WeakMap();

export type EffectScheduler = (...args: any[]) => any;

export interface ReactiveEffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}

// 应被响应式的 fn 会被包装成 ReactiveEffect 对象
export class ReactiveEffect<T = any> {
  deps: Set<ReactiveEffect>[] = [];
  // RE 如果是计算属性，则存储对其的引用
  computed?: ComputedRefImpl<T>;
  // scheduler 允许用户更灵活地定义 RE 被触发时的执行逻辑
  // 在 computed 中，我们将初次使用到它
  constructor(public fn, public scheduler: EffectScheduler | null = null) {}
  // 执行 fn 并收集 RE
  run() {
    try {
      // 声明自己应被收集
      activeEffect = this;
      shouldTrack = true;
      return this.fn();
    } finally {
      // 记得还原
      activeEffect = undefined;
      shouldTrack = false;
    }
  }
}

// 记录当前正在运行的 RE
export let activeEffect: ReactiveEffect | undefined;
// 根据多种情况确定当前 RE 是否该被收集
export let shouldTrack = true;

export function track(target, key) {
  // 如果有 RE 正在运行，才会收集
  // 否则说明使用响应式变量的函数无需响应式
  if (shouldTrack && activeEffect) {
    // 根据 target 和 key 定位 Dep
    // 如果不存在则新建
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set()));
    }
    // 向 Dep中收集当前 RE
    trackEffects(dep);
  }
}

export function trackEffects(dep) {
  // v! 会向 TS 保证 v 不为 undefined/null
  // 如果已经收集过当前 RE，无需重复收集
  shouldTrack = !dep.has(activeEffect!);
  if (shouldTrack) {
    dep.add(activeEffect!);
    activeEffect!.deps.push(dep);
  }
}

// 根据 target 和 key 定位 Dep并触发
export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  triggerEffects(dep);
}

export function triggerEffects(dep) {
  // Vue3 原句：spread into array for stabilization
  const effects: ReactiveEffect[] = isArray(dep) ? dep : [...dep];
  // 必须先触发所有 computed 的 RE
  // 否则会造成访问 computed 而其 _dirty 还未置位
  // 因此取到错误的缓存值而非重新计算最新值
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect);
    }
  }
  // 触发其它 RE
  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect);
    }
  }
}

function triggerEffect(effect) {
  if (effect !== activeEffect) {
    // 若有调度器，执行调度器逻辑
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options?): any {
  // 将 fn 包装成 RE
  const _effect = new ReactiveEffect(fn);
  // 如果设置 options.lazy = true 则不立即执行 RE
  if (!options || !options.lazy) {
    _effect.run();
  }
  // 返回一个能够执行 RE 的函数，同时保留 RE 的引用
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner;
  runner.effect = _effect;
  return runner;
}
