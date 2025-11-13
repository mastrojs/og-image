import CanvasKitInit, {
  type CanvasKit,
  type EmulatedCanvas2DContext,
} from "canvaskit-wasm";
import { decodeBase64 } from "@std/encoding/base64";

/** Emulated Canvas, see https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial */
export type Canvas = CanvasKitInit.EmulatedCanvas2D;

/** Emulated CanvasContext, see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D */
export type CanvasContext = EmulatedCanvas2DContext;

// deno-lint-ignore no-explicit-any
const CanvasKit: CanvasKit = await (CanvasKitInit as any)();

/** Options */
export interface Opts {
  /**
   * Either a string containing a CSS color value (defaults to "white"),
   * or a function that draws on the Canvas.
   */
  background?: string | ((ctx: CanvasContext, canvas: Canvas) => void);
  /** A CSS color value like `#ff0099`. Defaults to "black". */
  fontColor?: string;
  /** canvaskit-wasm doesn't seem to be able to use system fonts.
      Use e.g. `await Deno.readFile("./Roboto-Bold.ttf")` */
  fontFile: Uint8Array<ArrayBufferLike>;
  /** in px. defaults to 67 */
  fontSize?: number;
  /** in px. defaults to 600, which is recommended for og:image */
  height?: number;
  /** defaults to 1.25 */
  lineHeight?: number;
  /** in px, defaults to 100. Don't reduce too much or text will be cut off on some social apps. */
  paddingLeft?: number;
  /** in px, defaults to 100. Don't reduce too much or text will be cut off on some social apps. */
  paddingRight?: number;
  /** in px, defaults to 90. Don't reduce too much or text will be cut off on some social apps. */
  paddingTop?: number;
  /** in px. defaults to 1200, which is recommended for og:image */
  width?: number;
}

/**
 * Provided with a text string and a fontFile, returns a `Response` with a rasterized PNG image.
 */
export const renderImage = (text: string, opts: Opts): Response => {
  // if we wanted to generalize this for an array of texts, we could make the interface:
  // `renderImage(text: string | Opts[], defaultOpts: Opts)`
  const {
    background,
    fontColor = "black",
    fontFile,
    fontSize = 67,
    height = 600,
    lineHeight = 1.25,
    paddingLeft = 100,
    paddingRight = 100,
    paddingTop = 90,
    width = 1200,
  } = opts;
  const canvas = CanvasKit.MakeCanvas(width, height);
  const family = "DefaultFont";
  canvas.loadFont(fontFile, { family });
  const font = `${fontSize}px ${family}`;
  const ctx = canvas.getContext("2d") as CanvasContext;

  if (typeof background === "function") {
    ctx.fillStyle = fontColor;
    ctx.font = font;
    background(ctx, canvas);
  } else {
    ctx.fillStyle = background || "white";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = fontColor;
  ctx.font = font;

  const words = toWords(text);
  // 2*paddingRight to compensate for ctx.measureText that's sometimes off:
  const lineWidth = width - (paddingLeft + 2 * paddingRight);
  const lines: string[][] = [[]];
  let remainingWidth = lineWidth;
  words.forEach((word) => {
    const line = lines[lines.length - 1];
    const wordWidth = ctx.measureText(" " + word).width;
    if (word === "") {
      // there was a newline in input
      lines.push([]);
      remainingWidth = lineWidth;
    } else if (wordWidth < remainingWidth) {
      // word still fits on current line
      line.push(word);
      remainingWidth -= wordWidth;
    } else {
      // no more space: start new line
      lines.push([word]);
      remainingWidth = lineWidth;
    }
  });
  let y = fontSize + paddingTop;
  lines.forEach((line) => {
    if (line.length > 0) {
      ctx.fillText(line.join(" "), paddingLeft, y);
      y += fontSize * lineHeight;
    } else {
      // a whole empty line takes too much space
      y += fontSize * lineHeight * 0.5;
    }
  });

  return toResponse(canvas);
};

const toResponse = (canvas: Canvas) => {
  const base64 = canvas.toDataURL().split(",")[1];
  const binary = decodeBase64(base64);
  const res = new Response(binary as BodyInit);
  if (typeof Deno === "object" && Deno.env.get("DENO_DEPLOYMENT_ID")) {
    // this is a simplified version of Mastro's `staticCacheControlVal`
    res.headers.set("Cache-Control", "s-maxage=604800");
  }
  return res;
};

const toWords = (str: string) =>
  str.split(" ").flatMap((word) =>
    // split by newline and then intersperse empty string
    word.split("\n").flatMap((w, i) => i === 0 ? w : ["", w])
  );
