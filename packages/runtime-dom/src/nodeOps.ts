/**
 * 基于 DOM 提供对节点的操作
 */
export const nodeOps = {
  // 插入节点
  // anchor：新节点将被插入到某个兄弟节点 anchor 之前
  // 如果 anchor = null 则插入末尾
  insert: (child: Node, parent: Element, anchor: Element | null) => {
    parent.insertBefore(child, anchor || null);
  },
  // 创建元素
  createElement: (tag: string) => {
    const el = document.createElement(tag);
    return el;
  },
  // 创建文本节点
  createText: (text: string) => document.createTextNode(text),
  // 设置元素文本内容
  setElementText: (el: Element, text: string) => {
    el.textContent = text;
  }
};
