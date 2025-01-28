function formatConsole(key, value, format = {}, stringFormat = {}) {
  const defaultFormat = {
    separator: ":",
    padChr: " ",
    padCount: 30,
    consoleFunc: console.info,
    padFunc: "padEnd",
    prefix: "→ ",
    suffix: "",
  };

  const defaultStringFormat = {
    key: {
      textColor: "white",
      bgColor: "black",
      fontStyle: "normal",
      bgIntensity: "low",
      textIntensity: "low",
    },
    value: {
      textColor: "blue",
      bgColor: "black",
      fontStyle: "normal",
      bgIntensity: "low",
      textIntensity: "high",
    },
  };

  const modifiedFormat = { ...defaultFormat, ...format };
  const modifiedStringFormat = {
    key: { ...defaultStringFormat.key, ...stringFormat.key },
    value: { ...defaultStringFormat.value, ...stringFormat.value },
  };

  const { separator, padChr, padCount, consoleFunc, padFunc, prefix, suffix } =
    modifiedFormat;
  const {
    textColor: k_textColor,
    bgColor: k_bgColor,
    fontStyle: k_fontStyle,
    bgIntensity: k_bgIntensity,
    textIntensity: k_textIntensity,
  } = modifiedStringFormat.key;
  const {
    textColor: v_textColor,
    bgColor: v_bgColor,
    fontStyle: v_fontStyle,
    bgIntensity: v_bgIntensity,
    textIntensity: v_textIntensity,
  } = modifiedStringFormat.value;

  let padStr;

  if (typeof key == "string") {
    if (padFunc === "padEnd") padStr = key.padEnd(padCount, padChr);
    else padStr = key.padStart(padCount, padChr);
  }

  const formattedInfo =
    prefix +
    formatString(padStr, {
      textColor: k_textColor,
      bgColor: k_bgColor,
      fontStyle: k_fontStyle,
      bgIntensity: k_bgIntensity,
      textIntensity: k_textIntensity,
    }) +
    separator +
    " " +
    formatString(value, {
      textColor: v_textColor,
      bgColor: v_bgColor,
      fontStyle: v_fontStyle,
      bgIntensity: v_bgIntensity,
      textIntensity: v_textIntensity,
    }) +
    suffix;

  return consoleFunc(formattedInfo);
}

function formatString(string, format = {}) {
  const defaultFormat = {
    textColor: "white",
    bgColor: "black",
    fontStyle: "normal",
    bgIntensity: "low",
    textIntensity: "low",
  };

  const modifiedFormat = { ...defaultFormat, ...format };
  const { textColor, bgColor, fontStyle, bgIntensity, textIntensity } =
    modifiedFormat;

  const colors = {
    black: "0",
    red: "1",
    green: "2",
    yellow: "3",
    blue: "4",
    magenta: "5",
    cyan: "6",
    white: "7",
  };

  const fontStyles = {
    normal: "0",
    bold: "1",
    italic: "3",
    underline: "4",
  };

  const bgIntensities = {
    low: "4",
    high: "10",
  };

  const textIntensities = {
    low: "3",
    high: "9",
  };

  // stringFormat
  const startFormat = `\x1b[
      ${fontStyles[fontStyle]};
      ${bgIntensities[bgIntensity] + colors[bgColor]};
      ${textIntensities[textIntensity] + colors[textColor]}
    m`.replace(/\s+/g, "");

  // resetFormat
  const endFormat = "\x1b[0m";

  return startFormat + string + endFormat;
}

function divider(char = "-", repeatCount = 45) {
  const modifiedFormat = {
    padChr: char,
    padCount: repeatCount,
    separator: "",
    prefix: "",
    suffix: "",
  };
  formatConsole("", "", modifiedFormat);
}

function breakLine(count = 0) {
  console.log("\n".repeat(count));
}

function clearConsole() {
  console.clear();
}

module.exports = {
  formatConsole,
  divider,
  breakLine,
  formatString,
  clearConsole,
};
