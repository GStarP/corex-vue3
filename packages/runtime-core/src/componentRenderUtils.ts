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
  // 之前有子，现在无子，需要更新
  if (prevChildren || nextChildren) {
    if (!nextChildren) {
      return true;
    }
  }
  if (prevProps === nextProps) {
    return false;
  }
  // 之前无 props，若现在有，需要更新
  if (!prevProps) {
    // !! 作用是强转 boolean
    return !!nextProps;
  }
  // 之前有 props 而现在没有，需要更新
  if (!nextProps) {
    return true;
  }
  // 之前现在都有，看是否发生变化
  return hasPropsChanged(prevProps, nextProps);
}

function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps);
  // props 长度不一，变更
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    // 同键不同值，变更
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}
