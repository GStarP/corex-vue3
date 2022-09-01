import { ReactiveEffect } from '../../reactivity/src/effect';
import { invokeArrayFns } from '../../shared/src';
import { ShapeFlags } from '../../shared/src/shapeFlags';
import { createAppAPI } from './apiCreateApp';
import {
  ComponentInternalInstance,
  createComponentInstance,
  setupComponent
} from './component';
import {
  renderComponentRoot,
  shouldUpdateComponent,
  updateHOCHostEl
} from './componentRenderUtils';
import { Text, VNode } from './vnode';

export function createRenderer(options) {
  // hostCreateElement 等只是接口，具体实现视传入的 options 而定
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    createText: hostCreateText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling
  } = options;

  // 同时负责 首次挂载 和 后续更新
  // patch(null, vnode) 就相当于首次渲染
  function patch(
    n1,
    n2,
    container = null,
    anchor = null,
    parentComponent: any = null
  ) {
    // 避免无意义的 patch
    if (n1 === n2) {
      return;
    }

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
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent);
        }
    }
  }

  // @IGNORE 其实根本没用到
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
  function processElement(n1, n2, container, anchor, parentComponent) {
    if (n1 === null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      patchElement(n1, n2, parentComponent);
    }
  }
  // 当 n2 是组件
  function processComponent(n1, n2, container, anchor, parentComponent) {
    if (n1 === null) {
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      // update
    }
  }

  // 挂载子节点
  function mountChildren(children, container, anchor, parentComponent) {
    children.forEach((vNodeChild) => {
      patch(null, vNodeChild, container, anchor, parentComponent);
    });
  }

  // 更新子节点
  const patchChildren = (
    n1: VNode,
    n2: VNode,
    container,
    anchor,
    parentComponent
  ) => {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { shapeFlag } = n2;

    // @IGNORE 暂时只考虑相同类型的变更
    // 现在是 text
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // text 不同，重新设置
      if (c2 !== c1) {
        hostSetElementText(container, c2 as string);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyedChildren(c1, c2, container, anchor, parentComponent);
        }
      }
    }
    // @IGNORE 其它情况
  };

  // 所谓的 diff 算法
  const patchKeyedChildren = (c1, c2, container, anchor, parentComponent) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1; // prev ending index
    let e2 = l2 - 1; // next ending index
    // @IGNORE 最简单的实现
    // 认为 c1 与 c2 长度相等，且每个节点类型都相同
    // 因此可以直接对每对子节点做 patch
    while (i <= e1 && i <= e2) {
      patch(c1[i], c2[i], container, null, parentComponent);
      i++;
    }
  };

  // 挂载 DOM 元素
  function mountElement(vnode, container, anchor, parentComponent) {
    const { shapeFlag, props } = vnode;

    // 创建对应的 DOM 节点
    const el = (vnode.el = hostCreateElement(vnode.type));
    // 处理子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果子节点是文本，直接设置文本
      hostSetElementText(el, vnode.children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果子节点是数组，在此元素上挂载子节点
      mountChildren(vnode.children, el, anchor, parentComponent);
    }

    // 处理 props
    if (props) {
      for (const key in props) {
        // @IGNORE 忽略框架保留的 key，比如 ref
        const nextVal = props[key];
        hostPatchProp(el, key, null, nextVal);
      }
    }

    // 插入 DOM
    hostInsert(el, container, anchor);
  }

  // 更新 DOM 元素
  const patchElement = (n1: VNode, n2: VNode, parentComponent) => {
    const el = (n2.el = n1.el);
    // 对比子节点
    patchChildren(n1, n2, el, null, parentComponent);
  };

  // 挂载组件
  function mountComponent(initialVNode, container, anchor, parentComponent) {
    // 创建组件实例
    const instance =
      initialVNode.component ||
      (initialVNode.component = createComponentInstance(
        initialVNode,
        parentComponent
      ));

    // 初始化组件实例
    setupComponent(instance);

    // 初始化组件渲染
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  const setupRenderEffect = (
    instance: ComponentInternalInstance,
    initialVNode: VNode,
    container,
    anchor
  ) => {
    // 真正的渲染&更新函数
    const componentUpdateFn = () => {
      // 未挂载 => 挂载
      if (!instance.isMounted) {
        const { bm, m } = instance;
        // [Hook] beforeMount
        console.log('[beforeMount]\n', instance);
        if (bm) {
          invokeArrayFns(bm);
        }
        // 生成组件对应的 VDOM
        const subTree = (instance.subTree = renderComponentRoot(instance));
        // 挂载 subTree
        patch(null, subTree, container, anchor, instance);
        // 真正被渲染的是 subTree，但 vnode 也要记住 subTree 的 el
        initialVNode.el = subTree.el;
        // [Hook] mounted
        console.log('[mounted]\n', instance);
        if (m) {
          // @IGNORE 暂时同步渲染
          invokeArrayFns(m);
        }
        // 组件已挂载
        instance.isMounted = true;

        // #2458: deference mount-only object parameters to prevent memleaks
        // 将只在挂载阶段用到的对象设 null 防止内存泄漏
        initialVNode = container = anchor = null as any;
      } else {
        // 当组件自身状态变化导致更新时，next: null
        // 当 parent 调用 processComponent 导致更新时，next: VNode
        let { next, bu, u, parent, vnode } = instance;

        if (next) {
          // @IGNORE 暂不考虑
        } else {
          next = vnode;
        }
        // [Hook] beforeUpdate
        console.log('[beforeUpdate]\n', instance);
        if (bu) {
          invokeArrayFns(bu);
        }
        // 重新创建 subTree
        const nextTree = renderComponentRoot(instance);
        // 之前的 subTree 留作对比
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        // 更新
        patch(
          prevTree,
          nextTree,
          hostParentNode(prevTree.el),
          getNextHostNode(prevTree),
          instance
        );

        // 更新 instance.vnode.el
        next.el = nextTree.el;
        // @IGNORE 同步 parent.el

        // [Hook] updated
        console.log('[updated]\n', instance);
        if (u) {
          // @IGNORE 暂时同步渲染
          invokeArrayFns(u);
        }
      }
    };

    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      // @IGNORE 暂时同步渲染
      () => update()
    ));

    const update = (instance.update = () => effect.run());
    update();
  };

  const unmountChildren = (
    children,
    parentComponent,
    doRemove = false,
    start = 0
  ) => {
    for (let i = start; i < children.length; i++) {}
  };

  // 传入 vnode 获取 anchor
  const getNextHostNode = (vnode) => {
    if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
      return getNextHostNode(vnode.component!.subTree);
    }
    return hostNextSibling((vnode.anchor || vnode.el)!);
  };

  const render = (vnode, container) => {
    console.log('[render]\n' + 'vnode:\n', vnode, '\ncontainer:\n', container);
    patch(null, vnode, container);
  };

  return {
    render,
    createApp: createAppAPI(render)
  };
}
