import { ShapeFlags } from '../../shared/src/shapeFlags';
import { Text } from './vnode';

export function createRenderer(options) {
  // hostCreateElement 等只是接口，具体实现视传入的 options 而定
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    createText: hostCreateText
  } = options;

  // 同时负责 首次挂载 和 后续更新
  // patch(null, vnode) 就相当于首次渲染
  function patch(n1, n2, container = null, anchor = null) {
    console.log('[patch]\n' + 'n1:\n', n1, '\nn2:\n', n2);
    const { type, shapeFlag } = n2;
    // 根据新节点的类型进行处理
    switch (type) {
      // 文本节点
      case Text:
        processText(n1, n2, container, anchor);
        break;
      // 其它节点均基于 ShapeFlag 处理
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        }
    }
  }

  // 当 n2 是文本节点
  function processText(n1, n2, container, anchor) {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children as string);
      hostInsert(n2.el, container, anchor);
    } else {
      // update
    }
  }
  // 当 n2 是 DOM 元素
  function processElement(n1, n2, container, anchor) {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      // update
    }
  }
  // 挂载子节点
  function mountChildren(children, container) {
    children.forEach((vNodeChild) => {
      patch(null, vNodeChild, container);
    });
  }
  // 挂载 DOM 元素
  function mountElement(vnode, container, anchor) {
    const { shapeFlag, props } = vnode;

    // 创建对应的 DOM 节点
    const el = (vnode.el = hostCreateElement(vnode.type));
    // 处理子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果子节点是文本，直接设置文本
      hostSetElementText(el, vnode.children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果子节点是数组，在此元素上挂载子节点
      mountChildren(vnode.children, el);
    }

    // 处理 props
    if (props) {
      for (const key in props) {
        // IGNORE 忽略框架保留的 key，比如 ref
        const nextVal = props[key];
        hostPatchProp(el, key, null, nextVal);
      }
    }

    // 插入 DOM
    hostInsert(el, container, anchor);
  }

  const render = (vnode, container) => {
    console.log('[render]\n' + 'vnode:\n', vnode, '\ncontainer:\n', container);
    patch(null, vnode, container);
  };

  return {
    render
  };
}
