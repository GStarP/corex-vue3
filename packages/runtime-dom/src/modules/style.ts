export function patchStyle(el: Element, prev: string, next: string) {
  const style = (el as HTMLElement).style;
  // @IGNORE 先简单地使用字符串描述 style
  if (prev !== next) {
    style.cssText = next;
  }
}
