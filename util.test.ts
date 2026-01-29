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

Deno.test("toLines single soft-hyphen", () => {
  assertEquals(
    toLines(
      `How are long words hyphen${softHyphen}ated? Hopefully where they should?`,
      lineWidth,
      measureText,
    ),
    [
      "How are long words hyphen-",
      "ated? Hopefully where they",
      "should?",
    ],
  );
});

Deno.test("toLines double soft-hyphen 1", () => {
  assertEquals(
    toLines(
      `How are longer words hy${softHyphen}phen${softHyphen}ated? Where they should?`,
      lineWidth,
      measureText,
    ),
    [
      "How are longer words hy-",
      "phenated? Where they should?",
    ],
  );
});

Deno.test("toLines double soft-hyphen 2", () => {
  assertEquals(
    toLines(
      `How are long words hy${softHyphen}phen${softHyphen}ated? Where they should?`,
      lineWidth,
      measureText,
    ),
    [
      "How are long words hyphen-",
      "ated? Where they should?",
    ],
  );
});

Deno.test("toLines soft-hyphens with very long word", () => {
  assertEquals(
    toLines(
      `How are words hy${softHyphen}phenatedThat${softHyphen}NeedEvenMore${softHyphen}Space${softHyphen}Still`,
      lineWidth,
      measureText,
    ),
    [
      "How are words hy-",
      "phenatedThatNeedEvenMore-",
      "SpaceStill",
    ],
  );
});
