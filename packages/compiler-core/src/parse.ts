import { extend, isArray } from '../../shared/src';
import {
  AttributeNode,
  ConstantTypes,
  createRoot,
  DirectiveNode,
  ElementNode,
  ElementTypes,
  ExpressionNode,
  InterpolationNode,
  NodeTypes,
  Position,
  RootNode,
  SourceLocation,
  TemplateChildNode,
  TextNode
} from './ast';
import { advancePositionWithClone, advancePositionWithMutation } from './utils';

export const enum TextModes {
  DATA,
  ATTRIBUTE_VALUE
}

export function baseParse(content, options?): RootNode {
  const context = createParserContext(content, options);
  const start = getCursor(context);
  return createRoot(parseChildren(context, []), getSelection(context, start));
}

export interface ParserContext {
  options;
  readonly originalSource: string;
  source: string;
  offset: number;
  line: number;
  column: number;
}

export const defaultParserOptions = {
  // 插值语法
  delimiters: ['{{', '}}']
  // @IGNORE 许多配置选项
};
function createParserContext(content, rawOptions): ParserContext {
  // 合并默认配置与传入配置
  const options = extend({}, defaultParserOptions);
  for (const key in rawOptions) {
    options[key] =
      rawOptions[key] === undefined
        ? defaultParserOptions[key]
        : rawOptions[key];
  }
  return {
    options,
    // 指针起始位置
    column: 1,
    line: 1,
    offset: 0,
    // source 会在解析过程中更改
    source: content,
    originalSource: content
  };
}
// 获取解析上下文当前指针位置
function getCursor(context: ParserContext): Position {
  const { column, line, offset } = context;
  return { column, line, offset };
}
// 获取 start 到当前/指定指针位置的内容
function getSelection(context: ParserContext, start: Position, end?: Position) {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  };
}

function parseChildren(context: ParserContext, ancestors: ElementNode[]) {
  const nodes: TemplateChildNode[] = [];

  while (!isEnd(context, ancestors)) {
    const s = context.source;
    let node: TemplateChildNode | TemplateChildNode[] | undefined = undefined;
    // {{
    if (startsWith(s, context.options.delimiters[0])) {
      node = parseInterpolation(context);
    } else if (s[0] === '<') {
      // <
      if (s.length === 1) {
        emitError(context, 'EOF_BEFORE_TAG_NAME', 1);
      } else if (s[1] === '!') {
        // @IGNORE: <!-- || <!DOCTYPE || <![CDATA
        emitError(context, '@IGNORE_NOT_SUPPORT', 1);
      } else if (s[1] === '/') {
        // </
        if (s.length === 2) {
          emitError(context, 'EOF_BEFORE_TAG_NAME', 2);
        }
        // </>
        else if (s[2] === '>') {
          emitError(context, 'MISSING_END_TAG_NAME', 2);
          // @IGNORE Vue3 中会跳过这一段继续解析
        } else if (/[a-z]/i.test(s[2])) {
          // 正常的 end tag 在解析元素的时候就越过了
          // 所以这里应该是无 open tag 的单 end tag，也属于错误
          emitError(context, 'X_INVALID_END_TAG');
          // @IGNORE 不过 Vue3 也会进掉这一部分继续解析
        } else {
          // @IGNORE BogusComment
          emitError(context, '@IGNORE_NOT_SUPPORT', 2);
        }
      } else if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      } else if (s[1] === '?') {
        // @IGNORE BogusComment
        emitError(context, '@IGNORE_NOT_SUPPORT', 1);
      }
    }

    if (!node) {
      node = parseText(context);
    }

    if (isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i]);
      }
    } else {
      pushNode(nodes, node);
    }
  }

  // 统一处理 空格、换行 等空白字符
  // 如果不处理，我们甚至不能写 <App>\n<div></div>\n</App>
  // 因为 \n 会被解析为一个文本节点
  let removedWhitespace = false;
  // 检查所有节点
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    // 空白字符节点一定是文本节点
    if (node.type === NodeTypes.TEXT) {
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        const prev = nodes[i - 1];
        const next = nodes[i + 1];
        // 需要被删除的情况：
        // 1、如果节点是 children 中第一个或最后一个节点
        // 2、如果节点在两个元素之间，且换行了
        if (
          !prev ||
          !next ||
          (prev.type === NodeTypes.ELEMENT &&
            next.type === NodeTypes.ELEMENT &&
            /[\r\n]/.test(node.content))
        ) {
          removedWhitespace = true;
          nodes[i] = null as any;
        } else {
          // 否则，这个节点的文本就应该是空格
          node.content = ' ';
        }
      }
    }
  }
  // filter(Boolean) 可以删去上一步被设为 null 的节点
  return removedWhitespace ? nodes.filter(Boolean) : nodes;
}

function isEnd(context: ParserContext, ancestors) {
  const s = context.source;
  // 第一层 parseChildren 只会因为 !s 而结束
  // 递归 parseChildren 中会因为即将解析 parent 的 close tag 而结束
  if (startsWith(s, '</')) {
    // Vue3 原句: probably bad performance
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }
  return !s;
}

function parseInterpolation(
  context: ParserContext
): InterpolationNode | undefined {
  const [open, close] = context.options.delimiters;
  // 从 {{ 之后的位置搜索第一个 }}
  const closeIndex = context.source.indexOf(close, open.length);
  // 未搜索到
  if (closeIndex === -1) {
    emitError(context, 'X_MISSING_INTERPOLATION_END');
    return undefined;
  }

  const start = getCursor(context);
  // 进掉 {{
  advanceBy(context, open.length);
  // {{}} 内部内容的 start&end
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  // {{}} 内部内容长度
  const rawContentLength = closeIndex - open.length;
  // @IGNORE 保证插值中间没有空格，无需 trim 等处理
  // parseTextData 后 context cursor 已经在 content 之后了
  const content = parseTextData(context, rawContentLength);
  // 将 innerEnd 前进 content 长度
  advancePositionWithMutation(innerEnd, content, rawContentLength);

  // 将 context cursor 进到 }} 之后
  advanceBy(context, close.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      isStatic: false,
      constType: ConstantTypes.NOT_CONSTANT,
      loc: getSelection(context, innerStart, innerEnd)
    },
    // start 到当前 cursor 就是 {{xxx}} 的范围
    loc: getSelection(context, start)
  };
}

function parseTag(
  context: ParserContext,
  type: TagType
): ElementNode | undefined {
  const start = getCursor(context);
  // @IGNORE 我们只允许 tag name 出现小写字母
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)!;
  // 标签名（如 <div></div> 在此为 div）
  const tag = match[1];
  // @IGNORE 根据 tag 名判断其属于哪个 NameSpace
  // 这里只支持 HTML，因此不做判断

  // match[0] 为 <div 或 </div
  advanceBy(context, match[0].length);
  // 越过标签名和属性名之间的空格 <div id="app"
  advanceSpaces(context);

  // @IGNORE 不支持 <pre>，以下 inVPre=true 的全部跳过

  let props = parseAttributes(context, type);

  // @IGNORE 不支持 不闭合 和 自闭合
  // 缺少 >
  if (context.source.length === 0) {
    emitError(context, 'EOF_IN_TAG');
  } else {
    // 进掉 >
    advanceBy(context, 1);
  }

  // 对于 </div> 只需要 advance 掉，无需返回 Node
  if (type === TagType.End) {
    return;
  }

  let tagType = ElementTypes.ELEMENT;
  // @IGNORE 暂不支持 <slot>
  // @IGNORE 暂不支持 <template>
  if (isComponent(tag, props, context)) {
    tagType = ElementTypes.COMPONENT;
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    props,
    children: [],
    loc: getSelection(context, start)
  };
}

function parseAttributes(context: ParserContext, type: TagType) {
  const props: (AttributeNode | DirectiveNode)[] = [];
  const attributeNames = new Set<string>();
  // 没有遇到 tag 结束标志时
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    // 正常来说，对于 </div>，进入 parseAttribute 时
    // cursor 正好在 > 位置，因此不会进入循环
    if (type === TagType.End) {
      emitError(context, 'END_TAG_WITH_ATTRIBUTES');
    }

    const attr = parseAttribute(context, attributeNames);

    // @IGNORE 保证 class 为 "a b c" 形式，不做额外处理

    if (type === TagType.Start) {
      props.push(attr);
    }

    // @TODO
    // if (/^[^\t\r\n\f />]/.test(context.source)) {
    //   emitError(context, ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES)
    // }

    // 进掉属性之间的空格
    advanceSpaces(context);
  }
  return props;
}

function parseAttribute(
  context: ParserContext,
  nameSet: Set<string>
): AttributeNode | DirectiveNode {
  // 属性名
  const start = getCursor(context);
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!;
  const name = match[0];

  if (nameSet.has(name)) {
    emitError(context, 'DUPLICATE_ATTRIBUTE');
  }
  nameSet.add(name);

  // @IGNORE 一些语法检查
  // 进掉属性名
  advanceBy(context, name.length);

  // 属性值
  let value: AttributeValue = undefined;

  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context);
    // 进掉 =
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
    if (!value) {
      emitError(context, 'MISSING_ATTRIBUTE_VALUE');
    }
  }
  // 整个 name="value" 的 loc
  const loc = getSelection(context, start);

  // 处理缩写
  // @IGNORE 我们仅考虑 :name
  if (startsWith(name, ':')) {
    // @IGNORE 简单模拟一下匹配结果
    const match = [name, undefined, name.slice(1)];
    let dirName = 'bind';
    let arg: ExpressionNode | undefined;

    // 属性名 => 指令节点的 arg 字段
    if (match[2]) {
      // 即 1
      const startOffset = name.lastIndexOf(match[2]);
      const loc = getSelection(
        context,
        getNewPosition(context, start, startOffset),
        getNewPosition(context, start, startOffset + match[2].length)
      );
      let content = match[2];
      let isStatic = true;

      // @IGNORE 不支持动态属性名
      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
        constType: ConstantTypes.CAN_STRINGIFY,
        loc
      };
    }

    // value 是 "cls"，而表达式是 cls
    // 因此要去掉前后引号
    if (value && value.isQuoted) {
      const valueLoc = value.loc;
      valueLoc.start.offset++;
      valueLoc.start.column++;
      valueLoc.end = advancePositionWithClone(valueLoc.start, value.content);
      valueLoc.source = valueLoc.source.slice(1, -1);
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      // :name="value" 的属性值是一个简单表达式
      // 在我们这里也就只是一个变量名称
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        constType: ConstantTypes.NOT_CONSTANT,
        loc: value.loc
      },
      arg,
      loc
    };
  }

  // 返回属性节点
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc
    },
    loc
  };
}

function parseAttributeValue(context): AttributeValue {
  const start = getCursor(context);
  let content = '';
  const quote = context.source[0];
  // @IGNORE 仅支持双引号包裹属性值
  const isQuoted = quote === `"`;
  if (isQuoted) {
    // 进掉前引号
    advanceBy(context, 1);
    // 获取文本值
    const endIndex = context.source.indexOf(quote);
    content = parseTextData(context, endIndex);
    // 进掉后引号
    advanceBy(context, 1);
  }

  return {
    content,
    isQuoted,
    loc: getSelection(context, start)
  };
}

type AttributeValue =
  | {
      content: string;
      isQuoted: boolean;
      loc: SourceLocation;
    }
  | undefined;

function isComponent(tag, props, context: ParserContext) {
  // @IGNORE 简单地认为大写字母开头的就是组件
  return /^[A-Z]/.test(tag);
}

function parseElement(
  context: ParserContext,
  ancestors: ElementNode[]
): ElementNode | undefined {
  // open tag <=> 元素
  const element = parseTag(context, TagType.Start);

  // @IGNORE 无闭合 和 自闭合 标签自成元素，直接返回

  // @TODO Vue3 中通过类型定义使得 parseTag 返回值无 undefined
  // 但根据真正的 parseTag 实现，是可能返回 undefined 的
  // 为什么在这里不做处理？
  if (!element) {
    emitError(context, '@TODO_parseTag_undefined');
    return;
  }
  // 栈递归解析元素
  ancestors.push(element);
  const children = parseChildren(context, ancestors);
  ancestors.pop();

  element.children = children;

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    emitError(context, 'X_MISSING_END_TAG', 0, element.loc.start);
  }

  element.loc = getSelection(context, element.loc.start);

  return element;
}

// 检查当前 source 是否是 tag 的 close tag
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, '</') &&
    // tag 名要相同
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  );
}

function parseText(context: ParserContext): TextNode {
  // 以 < 或 {{ 作为文本的结束标志
  const endTokens = ['<', context.options.delimiters[0]];
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const start = getCursor(context);
  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start)
  };
}

function parseTextData(context: ParserContext, length: number): string {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  // @IGNORE 不做转义
  return rawText;
}

function pushNode(nodes: TemplateChildNode[], node: TemplateChildNode) {
  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes);
    // 如果当前最后节点存在，且为文本，且紧密相连
    // 就把当前文本节点合入最后节点
    if (
      prev &&
      prev.type === NodeTypes.TEXT &&
      prev.loc.end.offset === node.loc.start.offset
    ) {
      prev.content += node.content;
      prev.loc.end = node.loc.end;
      prev.loc.source += node.loc.source;
      return;
    }
  }

  nodes.push(node);
}

// 将 context cursor 向前推进若干字符
function advanceBy(context: ParserContext, numberOfCharacters) {
  const { source } = context;
  advancePositionWithMutation(context, source, numberOfCharacters);
  context.source = source.slice(numberOfCharacters);
}

// 若干相连的 空格、换行、制表符等 被视作 spaces
function advanceSpaces(context: ParserContext): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}

// 获得偏移后的新位置，但不进 context cursor
function getNewPosition(
  context: ParserContext,
  start: Position,
  numberOfCharacters: number
): Position {
  return advancePositionWithClone(
    start,
    context.originalSource.slice(start.offset, numberOfCharacters),
    numberOfCharacters
  );
}

// @IGNORE 简单的异常提示
// 需要给定一个偏移量 offset，因为在 cursor 位置
// 我们可能判断到 cursor + 3 位置的字符是否合法
// 这样错误提示的时候就要提示到 cursor + 3，更加精确
function emitError(
  context: ParserContext,
  msg: string,
  offset?,
  loc: Position = getCursor(context)
): void {
  if (offset) {
    loc.offset += offset;
    loc.column += offset;
  }
  throw new Error(
    `[compiler error]
    msg: ${msg}
    loc: ${JSON.stringify(loc)}
    `
  );
}

/**
 * 工具函数
 */
function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1];
}
function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString);
}
/**
 * 类型枚举
 */
const enum TagType {
  Start,
  End
}
