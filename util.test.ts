import { assertEquals } from "jsr:@std/assert";
import { softHyphen, toLines } from "./util.ts";

const lineWidth = 900;
const measureText = (text: string) => ({ width: 30 * text.length });

Deno.test("toLines", () => {
  assertEquals(
    toLines("Hello World", lineWidth, measureText),
    ["Hello World"],
  );
  assertEquals(
    toLines("The simplest web framework and site generator yet.", lineWidth, measureText),
    ["The simplest web framework", "and site generator yet."],
  );
  assertEquals(
    toLines("Hello\n\nWorld", lineWidth, measureText),
    ["Hello", "", "", "World"],
  );
});

Deno.test("toLines soft-hyphen handling", () => {
  assertEquals(
    toLines(
      `How are long words hyphen${softHyphen}ated? Where they should?`,
      lineWidth,
      measureText,
    ),
    [
      "How are long words hyphen-",
      "ated? Where they should?",
    ],
  );

  assertEquals(
    toLines(
      `How are longer words hy${softHyphen}phen${softHyphen}ated? Where they should?`,
      lineWidth,
      measureText,
    ),
    [
      "How are longer words hyphen-",
      "ated? Where they should?",
    ],
  );

  assertEquals(
    toLines(
      `How are very long words hy${softHyphen}phen${softHyphen}ated? Where they should?`,
      lineWidth,
      measureText,
    ),
    [
      "How are very long words hy-",
      "phenated? Where they should?",
    ],
  );

  assertEquals(
    toLines(
      `How are very long words hy${softHyphen}phenatedThat${softHyphen}NeedEvenMore${softHyphen}Space${softHyphen}Still`,
      lineWidth,
      measureText,
    ),
    [
      "How are very long words hy-",
      "phenatedThatNeedEvenMoreSpace-",
      "Still",
    ],
  );
});
