import { isObject, isString } from '../../shared/src';
import { ShapeFlags } from '../../shared/src/shapeFlags';

export interface VNode {
  // 类型
  type: string;
  // 属性
  props;
  // 子节点
  children: string | VNode[] | null;
  // 挂载到的真实 DOM 节点
  el: Node | null;
  // 记录节点自身以及子节点的类型
  shapeFlag: number;
  // 保存组件实例
  component: any;
}

export function createVNode(type, props = null, children = null): VNode {
  // @IGNORE 对 class 和 style 进行处理

  // @IGNORE 只考虑有状态组件
  // 这种连续三元表达式的写法可以借鉴
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  const vnode = {
    type,
    props: props,
    children: children,
    el: null,
    shapeFlag: shapeFlag,
    component: null
  };

  // 将 children 的类型也记录在 shapeFlag 上
  if (children) {
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN;
  }

  return vnode;
}

// @IGNORE Vue3 为了效率，在生产环境下都使用 Symbol(undefined)
export const Text = Symbol('Text');
