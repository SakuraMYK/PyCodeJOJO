import * as vscode from "vscode";

const reRGB = /rgb\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gs;

const reRGBA =
  /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3}|\d\.\d+)\s*\)/gs;

const reTupleRGB =
  /(?<!rgb)(?<!rgba)\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gs;

const reTupleRGBA =
  /(?<!rgb)(?<!rgba)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3}|\d\.\d+)\s*\)/gs;

const reHex3 = /#([0-9A-Fa-f]{3})\b/gs;
const reHex6 = /#([0-9A-Fa-f]{6})\b/gs;
const reHex8 = /#([0-9A-Fa-f]{8})\b/gs;

interface ColorMap {
  range: vscode.Range;
  text: string;
  color: vscode.Color;
}

export interface EnableMap {
  Enable: boolean;
  MatchRGB: boolean;
  MatchTupleRGB: boolean;
  MatchHex3: boolean;
  MatchHex6: boolean;
  MatchHex8: boolean;
}

export class ColorPicker implements vscode.DocumentColorProvider {
  public enableMap: EnableMap = {
    Enable: true,
    MatchRGB: true,
    MatchTupleRGB: true,
    MatchHex3: true,
    MatchHex6: true,
    MatchHex8: true,
  };

  provideDocumentColors(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ColorInformation[] {
    if (!this.enableMap.Enable) return [];
    const colors: vscode.ColorInformation[] = [];
    for (const map of getColorMaps(document, this.enableMap)) {
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

  const rgba =
    /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3}|\d\.\d+)\s*\)/;
  const tupleRgba =
    /(?<!rgb)(?<!rgba)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3}|\d\.\d+)\s*\)/;
  const hex8 = /#([0-9A-Fa-f]{8})\b/;

  const matchRGBA = rgba.exec(string);
  const matchTupleRGBA = tupleRgba.exec(string);
  const matchHexAlpha = hex8.exec(string);

  const r = color.red * 255;
  const g = color.green * 255;
  const b = color.blue * 255;

  const hexR = r.toString(16).padStart(2, "0");
  const hexG = g.toString(16).padStart(2, "0");
  const hexB = b.toString(16).padStart(2, "0");

  let a;

  const floatAlpha = color.alpha.toFixed(2); // 保留两位小数
  const intAlpha = Math.round(color.alpha * 255);
  const hexAlpha = Math.round(color.alpha * 255).toString(16);

  // 由于 color.alpha 的值范围只能是 0-1，所以此处需要重新判断具体格式从而保持元数据格式一致
  if (matchTupleRGBA) {
    if (matchTupleRGBA[4].includes(".") || matchTupleRGBA[4] === "1") {
      // 判断为浮点类型 按照 0~1 范围转化alpha值
      a = floatAlpha;
    } else {
      // 按照 1~255 范围转化alpha值
      a = intAlpha;
    }
    return [new vscode.ColorPresentation(`(${r}, ${g}, ${b}, ${a})`)];
  } else if (matchRGBA) {
    if (matchRGBA[4].includes(".") || matchRGBA[4] === "1") {
      // 判断为浮点类型 按照 0~1 范围转化alpha值
      a = floatAlpha;
    } else {
      // 按照 1~255 范围转化alpha值
      a = intAlpha;
    }
    return [new vscode.ColorPresentation(`rgba(${r}, ${g}, ${b}, ${a})`)];
  } else if (matchHexAlpha) {
    return [new vscode.ColorPresentation(`#${hexR}${hexG}${hexB}${hexAlpha}`)];
  } else {
    // 其他格式
    if (color.alpha === 1) {
      // 用户未改动alpha值时
      if (string.startsWith("(")) {
        return [new vscode.ColorPresentation(`(${r}, ${g}, ${b})`)];
      } else if (string.startsWith("rgb")) {
        return [new vscode.ColorPresentation(`rgb(${r}, ${g}, ${b})`)];
      } else {
        return [new vscode.ColorPresentation(`#${hexR}${hexG}${hexB}`)];
      }
    } else {
      // 用户改动alpha值时，返回对应带alpha通道的格式
      if (string.startsWith("(")) {
        return [
          new vscode.ColorPresentation(`(${r}, ${g}, ${b}, ${intAlpha})`),
        ];
      } else if (string.startsWith("rgb")) {
        return [
          new vscode.ColorPresentation(`rgba(${r}, ${g}, ${b}, ${intAlpha})`),
        ];
      } else {
        return [
          new vscode.ColorPresentation(`#${hexR}${hexG}${hexB}${hexAlpha}`),
        ];
      }
    }
  }
}

export function getColorMaps(
  document: vscode.TextDocument,
  enable: EnableMap
): ColorMap[] {
  const maps: ColorMap[] = [];
  if (enable.MatchRGB)
    maps.push(...getRGBMaps(document), ...getRGBAMaps(document));
  if (enable.MatchTupleRGB)
    maps.push(...getTupleRGBMaps(document), ...getTupleRGBAMaps(document));
  if (enable.MatchHex3) maps.push(...getHex3Maps(document));
  if (enable.MatchHex6) maps.push(...getHex6Maps(document));
  if (enable.MatchHex8) maps.push(...getHex8Maps(document));
  return maps;
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

function getHex3Maps(document: vscode.TextDocument): ColorMap[] {
  const maps: ColorMap[] = [];
  const matches = [...document.getText().matchAll(reHex3)];
  for (const match of matches) {
    const s = match.index;
    const e = match.index + match[0].length;
    const start = document.positionAt(s);
    const end = document.positionAt(e);
    const hex = match[1];
    const text = match[0].toLowerCase();

    let R;
    let G;
    let B;
    let A;

    R = parseInt(hex[0] + hex[0], 16);
    G = parseInt(hex[1] + hex[1], 16);
    B = parseInt(hex[2] + hex[2], 16);
    A = 1;
    maps.push({
      range: new vscode.Range(start, end),
      text: text,
      color: new vscode.Color(R / 255, G / 255, B / 255, A),
    });
  }
  return maps;
}
function getHex6Maps(document: vscode.TextDocument): ColorMap[] {
  const maps: ColorMap[] = [];
  const matches = [...document.getText().matchAll(reHex6)];
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

    R = parseInt(hex.substring(0, 2), 16);
    G = parseInt(hex.substring(2, 4), 16);
    B = parseInt(hex.substring(4, 6), 16);
    A = 1;
    maps.push({
      range: new vscode.Range(start, end),
      text: text,
      color: new vscode.Color(R / 255, G / 255, B / 255, A),
    });
  }
  return maps;
}
function getHex8Maps(document: vscode.TextDocument): ColorMap[] {
  const maps: ColorMap[] = [];
  const matches = [...document.getText().matchAll(reHex8)];
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

    R = parseInt(hex.substring(0, 2), 16);
    G = parseInt(hex.substring(2, 4), 16);
    B = parseInt(hex.substring(4, 6), 16);
    A = parseInt(hex.substring(6, 8), 16) / 255;
    maps.push({
      range: new vscode.Range(start, end),
      text: text,
      color: new vscode.Color(R / 255, G / 255, B / 255, A),
    });
  }
  return maps;
}
