import { ShapeFlags } from '../../shared/src/shapeFlags';
import { ComponentInternalInstance } from './component';

export function renderComponentRoot(instance: ComponentInternalInstance) {
  const { vnode, render, proxy, attrs } = instance;
  let result;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // render 中使用的 this 即 proxy
    result = render.call(proxy);
    // @IGNORE 复杂的 props 处理过程
    // 目的是将 instance.attr 传递到 subtree.props
    // 这里简单合并一下
    result.props = {
      ...result.props,
      ...attrs
    };
  }
  return result;
}

export function shouldUpdateComponent(prevVNode, nextVNode) {
  const { props: prevProps, children: prevChildren, component } = prevVNode;
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;

  // 如果 children 发生变更，需要更新
  if (prevChildren || nextChildren) {
    if (!nextChildren) {
      return true;
    }
  }
  // 如果 props 未发生变更，无需更新
  if (prevProps === nextProps) {
    return false;
  }
  if (!prevProps) {
    return !!nextProps;
  }
  if (!nextProps) return true;
  return hasPropsChanged(prevProps, nextProps);
}

function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}

export function updateHOCHostEl(
  { vnode, parent }: ComponentInternalInstance,
  el
) {
  // 可能出现 <Comp1><Comp2><Comp3><div> 这样的组件嵌套情况
  // 那么 Comp1/2/3.el 都要与 div.el，即 subTree.el 一致
  while (parent && parent.subTree === vnode) {
    (vnode = parent.vnode).el = el;
    parent = parent.parent;
  }
}
