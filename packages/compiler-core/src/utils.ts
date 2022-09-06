import { extend } from '../../shared/src';
import { Position } from './ast';

// 推进过程中直接修改 context 内容
export function advancePositionWithMutation(
  // 可以传入 context，它也是 Position
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length
): Position {
  // 每遇到 \n 都要进一行
  let linesCount = 0;
  let lastNewLinePos = -1;
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++;
      lastNewLinePos = i;
    }
  }

  pos.offset += numberOfCharacters;
  pos.line += linesCount;
  // 如果未换行，直接在原列数上加
  // 否则记住上次换行时候到哪个字符，剩下的就是新的列数
  pos.column =
    lastNewLinePos === -1
      ? pos.column + numberOfCharacters
      : numberOfCharacters - lastNewLinePos;

  return pos;
}

export function advancePositionWithClone(
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length
): Position {
  return advancePositionWithMutation(
    extend({}, pos),
    source,
    numberOfCharacters
  );
}
