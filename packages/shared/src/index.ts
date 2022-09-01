const onRE = /^on[^a-z]/;
export const isOn = (key: string) => onRE.test(key);

export const extend = Object.assign;

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key);

export const isArray = Array.isArray;
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function';
export const isString = (val: unknown): val is string =>
  typeof val === 'string';
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);

// 以相同参数调用数组中所有函数
export const invokeArrayFns = (fns: Function[], arg?: any) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
};
