import { isFunction, isObject } from '../../shared/src';
import { initProps, normalizePropsOptions } from './componentProps';
import { VNode } from './vnode';

type LifecycleHook<TFn = Function> = TFn[] | null;

export interface ComponentInternalInstance {
  uid: number;
  vnode: VNode;
  type;
  parent;

  // 组件 VDOM
  subTree;
  // 挂载&更新函数
  update;
  // 渲染函数
  render;
  // 公共代理
  proxy;

  // props 定义
  propsOptions;

  // 组件状态相关
  ctx;
  props;
  attrs;

  // 生命周期相关
  isMounted: boolean;
  // (before)Mounted
  bm: LifecycleHook;
  m: LifecycleHook;
}

let uid = 0;

export function createComponentInstance(vnode, parent) {
  const type = vnode.type;

  const instance = {
    uid: uid++,
    vnode,
    type,
    parent,
    subTree: null,
    update: null,
    render: null,
    proxy: null,

    propsOptions: normalizePropsOptions(type),

    ctx: {},
    props: {},
    attrs: {},

    isMounted: false,
    bm: null,
    m: null
  };

  instance.ctx = { _: instance };

  return instance;
}

export function setupComponent(instance) {
  const { props } = instance.vnode;
  // 初始化 props
  initProps(instance, props);
  // @IGNORE 初始化 slot

  // 初始化 setup 组件
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: ComponentInternalInstance) {
  const Component = instance.type;
  // 1. 创建组件实例的 公共代理对象
  // 在组件中使用 this 时访问的就是 instance.proxy
  // @IGNORE 暂不使用 this
  instance.proxy = null;
  // 2. 执行 setup
  const { setup } = Component;
  if (setup) {
    // @IGNORE 只支持 setup(props)
    const setupResult = setup.call(instance, instance.props);
    // 根据 setupResult 类型作不同处理
    handleSetupResult(instance, setupResult);
  }
  // @IGNORE 我们只支持 setup 组件
}

export function handleSetupResult(
  instance: ComponentInternalInstance,
  setupResult
) {
  if (isFunction(setupResult)) {
    // 返回渲染函数
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    // @IGNORE 暂不支持返回 setupState
    console.error('setupState not support');
  }
}
