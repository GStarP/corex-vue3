export interface Node {
  // 节点类型
  type: NodeTypes;
  // 节点位置&内容
  loc: SourceLocation;
}

export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  ATTRIBUTE,
  DIRECTIVE
}

export interface SourceLocation {
  // 在源文件中的起止位置
  start: Position;
  end: Position;
  // 节点源码
  source: string;
}

export interface Position {
  // 距文件开头的偏移量
  offset: number;
  // 行列
  line: number;
  column: number;
}

// 模板根节点
export interface RootNode extends Node {
  type: NodeTypes.ROOT;
  children: TemplateChildNode[];
}

// 子节点可以为 元素 | 插值 | 文本
export type TemplateChildNode = ElementNode | InterpolationNode | TextNode;

// 元素可以为 DOM 元素 | 组件元素
export type ElementNode = PlainElementNode | ComponentNode;

export interface PlainElementNode extends BaseElementNode {
  tagType: ElementTypes.ELEMENT;
}
export interface ComponentNode extends BaseElementNode {
  tagType: ElementTypes.COMPONENT;
}
export interface BaseElementNode extends Node {
  type: NodeTypes.ELEMENT;
  tag: string;
  tagType: ElementTypes;
  props: (AttributeNode | DirectiveNode)[];
  children: TemplateChildNode[];
}
export const enum ElementTypes {
  ELEMENT,
  COMPONENT
}
// 属性节点
export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE;
  name: string;
  value: TextNode | undefined;
}
// 文本节点
export interface TextNode extends Node {
  type: NodeTypes.TEXT;
  content: string;
}
// 插值节点
export interface InterpolationNode extends Node {
  type: NodeTypes.INTERPOLATION;
  content: ExpressionNode;
}

// @IGNORE 仅支持简单表达式
export type ExpressionNode = SimpleExpressionNode;
export interface SimpleExpressionNode extends Node {
  type: NodeTypes.SIMPLE_EXPRESSION;
  content: string;
  isStatic: boolean;
  constType: ConstantTypes;
}
export const enum ConstantTypes {
  NOT_CONSTANT = 0,
  // @IGNORE 无需使用
  // CAN_SKIP_PATCH,
  // CAN_HOIST,
  CAN_STRINGIFY
}
// 指令节点
export interface DirectiveNode extends Node {
  type: NodeTypes.DIRECTIVE;
  name: string;
  arg: ExpressionNode | undefined;
  exp: ExpressionNode | undefined;
}

// 创建根节点
export function createRoot(children: TemplateChildNode[], loc): RootNode {
  return {
    type: NodeTypes.ROOT,
    children,
    loc
  };
}
