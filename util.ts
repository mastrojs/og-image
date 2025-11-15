export const softHyphen = "\u{00AD}";

type MeasureTextFn = (text: string) => { width: number };

export const toLines = (
  text: string,
  lineWidth: number,
  measureText: MeasureTextFn,
): string[] => {
  const lines: string[][] = [[]];
  let remainingWidth = lineWidth;

  const words = toWords(text);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWithoutShys = word.replaceAll(softHyphen, "");
    const line = lines[lines.length - 1];
    const wordWidth = measureText(" " + wordWithoutShys).width;
    if (word === "") {
      // there was a newline in input
      lines.push([]);
      remainingWidth = lineWidth;
    } else if (wordWidth < remainingWidth) {
      // word still fits on current line
      line.push(wordWithoutShys);
      remainingWidth -= wordWidth;
    } else {
      // whole word doesn't fit on current line
      if (word.includes(softHyphen)) {
        const parts = hyphenate(word, remainingWidth, measureText);
        if (parts) {
          line.push(parts.preBreak + "-");
          // start new line and try remainder again in next loop iteration
          lines.push([]);
          words[i] = parts.postBreak;
          i--;
        }
      } else {
        // start new line
        lines.push([wordWithoutShys]);
      }
      remainingWidth = lineWidth;
    }
  }

  return lines.map((l) => l.join(" "));
};

const toWords = (str: string): string[] =>
  str.split(" ").flatMap((word) =>
    // replace newlines with empty strings in array
    word.split("\n").flatMap((w, i) => i === 0 ? w : ["", w])
  );

const hyphenate = (
  word: string,
  remainingWidth: number,
  measureText: MeasureTextFn,
) => {
  const syllables = word.split(softHyphen);
  const prefixSums: number[] = [];
  let sum = 0;
  syllables.forEach((syllable) => {
    sum += measureText(syllable).width;
    prefixSums.push(sum);
  });
  const i = prefixSums.findLastIndex((l) => l < remainingWidth) + 1;
  if (i > 0 && i < syllables.length) {
    const preBreak = syllables.slice(0, i).join("").replaceAll(softHyphen, "");
    const postBreak = syllables.slice(i).join(softHyphen);
    return { preBreak, postBreak };
  }
};
