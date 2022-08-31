export function patchEvent(el, rawName: string, prevValue, nextValue) {
  // 每个元素都会维护一个 Map，保存其所有的 invoker（就是 listener）
  const invokers = el._vei || (el._vei = {});
  // 获取当前事件对应的 invoker
  const existingInvoker = invokers[rawName];
  // 如果已有，直接替换
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    // onClick => click
    // @IGNORE: 不考虑 .once 这些修饰
    const name = rawName.slice(2).toLowerCase();
    if (nextValue) {
      // 添加
      const invoker = (invokers[rawName] = nextValue);
      el.addEventListener(name, invoker);
    } else if (existingInvoker) {
      // 删除
      el.removeEventListener(name, existingInvoker);
      invokers[rawName] = undefined;
    }
  }
}
