import vscode from "vscode";

const reRGB = /rgb\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gs;

const reRGBA =
  /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3}|1|0|0\.\d+)\s*\)/gs;

const reTupleRGB =
  /(?<!rgb)(?<!rgba)\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gs;

const reTupleRGBA =
  /(?<!rgb)(?<!rgba)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3}|1|0|0\.\d+)\s*\)/gs;

const reHex = /#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/gs;

interface ColorMap {
  range: vscode.Range;
  text: string;
  color: vscode.Color;
}

export class ColorPicker implements vscode.DocumentColorProvider {
  constructor() {}

  provideDocumentColors(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ColorInformation[] {
    const colors: vscode.ColorInformation[] = [];

    for (const map of getColorMaps(document)) {
      colors.push(new vscode.ColorInformation(map.range, map.color));
    }
    return colors;
  }

  provideColorPresentations(
    color: vscode.Color,
    context: { document: vscode.TextDocument; range: vscode.Range },
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.ColorPresentation[]> {
    return formatColor(color, context);
  }
}

function formatColor(
  color: vscode.Color,
  context: { document: vscode.TextDocument; range: vscode.Range }
): vscode.ColorPresentation[] {
  // 数组的顺序影响 vscode的取色器标签文本的初次显示的文本值

  const { document, range } = context;
  const string = document.getText(range);

  const r = color.red * 255;
  const g = color.green * 255;
  const b = color.blue * 255;

  const hexR = r.toString(16).padStart(2, "0");
  const hexG = g.toString(16).padStart(2, "0");
  const hexB = b.toString(16).padStart(2, "0");

  let a;
  let hexA;
  let prefix;

  if (color.alpha === 1) {
    a = "";
    hexA = "";
    prefix = "rgb";
  } else if (color.alpha === 0) {
    a = ", 0";
    hexA = "00";
    prefix = "rgba";
  } else {
    a = `, ${color.alpha.toFixed(2)}`;
    hexA = Math.round(color.alpha * 255).toString(16);
    prefix = "rgba";
  }

  const labels = {
    tuple: `(${r}, ${g}, ${b}${a})`,
    rgb: `${prefix}(${r}, ${g}, ${b}${a})`,
    hex: `#${hexR}${hexG}${hexB}${hexA}`,
  };

  if (string.startsWith("(")) {
    return [new vscode.ColorPresentation(labels.tuple)];
  } else if (string.startsWith("rgb")) {
    return [new vscode.ColorPresentation(labels.rgb)];
  } else {
    return [new vscode.ColorPresentation(labels.hex)];
  }
}

export function getColorMaps(document: vscode.TextDocument): ColorMap[] {
  return [
    ...getRGBMaps(document),
    ...getRGBAMaps(document),
    ...getTupleRGBMaps(document),
    ...getTupleRGBAMaps(document),
    ...getHexMaps(document),
  ];
}

function getRGBMaps(document: vscode.TextDocument): ColorMap[] {
  const maps: ColorMap[] = [];
  const matches = [...document.getText().matchAll(reRGB)];

  for (const match of matches) {
    const s = match.index;
    const e = match.index + match[0].length;
    const start = document.positionAt(s);
    const end = document.positionAt(e);
    const R = parseInt(match[1]);
    const G = parseInt(match[2]);
    const B = parseInt(match[3]);
    const text = `rgba(${R}, ${G}, ${B}, 1)`;

    if (R >= 0 && R <= 255 && G >= 0 && G <= 255 && B >= 0 && B <= 255) {
      maps.push({
        range: new vscode.Range(start, end),
        text: text,
        color: new vscode.Color(R / 255, G / 255, B / 255, 1),
      });
    }
  }
  return maps;
}

function getRGBAMaps(document: vscode.TextDocument): ColorMap[] {
  const maps: ColorMap[] = [];
  const matches = [...document.getText().matchAll(reRGBA)];
  for (const match of matches) {
    const s = match.index;
    const e = match.index + match[0].length;
    const start = document.positionAt(s);
    const end = document.positionAt(e);
    const R = parseInt(match[1]);
    const G = parseInt(match[2]);
    const B = parseInt(match[3]);
    let A = parseFloat(match[4]);
    const text = `rgba(${R}, ${G}, ${B}, ${A})`;

    if (
      R >= 0 &&
      R <= 255 &&
      G >= 0 &&
      G <= 255 &&
      B >= 0 &&
      B <= 255 &&
      A >= 0 &&
      A <= 255
    ) {
      A = A > 1 ? A / 255 : A;
      maps.push({
        range: new vscode.Range(start, end),
        text: text,
        color: new vscode.Color(R / 255, G / 255, B / 255, A),
      });
    }
  }
  return maps;
}

function getTupleRGBMaps(document: vscode.TextDocument): ColorMap[] {
  const maps: ColorMap[] = [];
  const matches = [...document.getText().matchAll(reTupleRGB)];
  for (const match of matches) {
    const s = match.index;
    const e = match.index + match[0].length;
    const start = document.positionAt(s);
    const end = document.positionAt(e);
    const R = parseInt(match[1]);
    const G = parseInt(match[2]);
    const B = parseInt(match[3]);
    const text = `rgba(${R}, ${G}, ${B}, 1)`;

    if (R >= 0 && R <= 255 && G >= 0 && G <= 255 && B >= 0 && B <= 255) {
      maps.push({
        range: new vscode.Range(start, end),
        text: text,
        color: new vscode.Color(R / 255, G / 255, B / 255, 1),
      });
    }
  }
  return maps;
}

function getTupleRGBAMaps(document: vscode.TextDocument): ColorMap[] {
  const maps: ColorMap[] = [];
  const matches = [...document.getText().matchAll(reTupleRGBA)];
  for (const match of matches) {
    const s = match.index;
    const e = match.index + match[0].length;
    const start = document.positionAt(s);
    const end = document.positionAt(e);
    const R = parseInt(match[1]);
    const G = parseInt(match[2]);
    const B = parseInt(match[3]);
    let A = parseFloat(match[4]);
    const text = `rgba(${R}, ${G}, ${B}, ${A})`;

    if (
      R >= 0 &&
      R <= 255 &&
      G >= 0 &&
      G <= 255 &&
      B >= 0 &&
      B <= 255 &&
      A >= 0 &&
      A <= 255
    ) {
      A = A > 1 ? A / 255 : A;
      maps.push({
        range: new vscode.Range(start, end),
        text: text,
        color: new vscode.Color(R / 255, G / 255, B / 255, A),
      });
    }
  }
  return maps;
}

function getHexMaps(document: vscode.TextDocument): ColorMap[] {
  function mapsPush(
    start: vscode.Position,
    end: vscode.Position,
    text: string,
    R: number,
    G: number,
    B: number,
    A: number
  ): void {
    maps.push({
      range: new vscode.Range(start, end),
      text: text,
      color: new vscode.Color(R / 255, G / 255, B / 255, A),
    });
  }

  const maps: ColorMap[] = [];
  const matches = [...document.getText().matchAll(reHex)];
  for (const match of matches) {
    const s = match.index;
    const e = match.index + match[0].length;
    const start = document.positionAt(s);
    const end = document.positionAt(e);
    const hex = match[1];
    const hexLength = hex.length;
    const text = match[0].toLowerCase();

    let R;
    let G;
    let B;
    let A;

    switch (hexLength) {
      case 3:
        R = parseInt(hex[0] + hex[0], 16);
        G = parseInt(hex[1] + hex[1], 16);
        B = parseInt(hex[2] + hex[2], 16);
        A = 1;
        mapsPush(start, end, text, R, G, B, A);
        break;
      case 6:
        R = parseInt(hex.substring(0, 2), 16);
        G = parseInt(hex.substring(2, 4), 16);
        B = parseInt(hex.substring(4, 6), 16);
        A = 1;
        mapsPush(start, end, text, R, G, B, A);
        break;
      case 8:
        R = parseInt(hex.substring(0, 2), 16);
        G = parseInt(hex.substring(2, 4), 16);
        B = parseInt(hex.substring(4, 6), 16);
        A = parseInt(hex.substring(6, 8), 16) / 255;
        mapsPush(start, end, text, R, G, B, A);
        break;
    }
  }
  return maps;
}
