import fs from 'fs/promises';
import path from 'path';

const file = process.argv[2];
const outIdx = process.argv.indexOf('--out');

if (!file) {
    throw new Error('No file path provided');
  }

const bReg = /(?<=[ ,.:;\n\t]|^)\*\*(?=\S)(.+?)(?<=\S)\*\*(?=[ ,.:;\n\t]|$)/g;
const iReg = /(?<=[ ,.:;\n\t]|^)_(?=\S)(.+?)(?<=\S)_(?=[ ,.:;\n\t]|$)/g;
const mReg = /(?<=[ ,.:;\n\t]|^)`(?=\S)(.+?)(?=\S)`(?=[ ,.:;\n\t]|$)/g;
const regs = [bReg, iReg, mReg];

const lbReg = /(?<=[ ,.:;\n\t]|^)\*\*(?=\S)/g;
const rbReg = /(?<=\S)\*\*(?=[ ,.:;\n\t]|$)/g;
const liReg = /(?<=[ ,.:;\n\t]|^)_(?=\S)/g;
const riReg = /(?<=\S)_(?=[ ,.:;\n\t]|$)/g;
const lmReg = /(?<=[ ,.:;\n\t]|^)`(?=\S)/g;
const rmReg = /(?=\S)`(?=[ ,.:;\n\t]|$)/g;

const markers = ['**', '_', '`'];

const mdText = await fs.readFile(file, 'utf-8');

const setParas = (text) => {
    const paras = text.split('\n,\n').filter((par) => par.trim() !== '');
    const htmlParas = paras.map((par) => `<p>${par.trim()}</p>\n`);
    return htmlParas.join('');
  };

  const setPre = (text) => {
    if (!text.startsWith('\n')) {
      throw new Error('Should be line break after preformatted marker');
    }
    if (!text.endsWith('\n')) {
      throw new Error('Should be line break before last preformatted marker');
    }
    return `<pre>${text}</pre>\n`;
  };

  const setTags = (text) => {
    return text
      .replace(bReg, '<b>$1</b>')
      .replace(iReg, '<i>$1</i>')
      .replace(mReg, '<tt>$1</tt>');
  };

  const chkClosed = (text, lReg, rReg, reg) => {
    const matches = text.match(reg);
    const lMatches = text.match(lReg);
    const rMatches = text.match(rReg);
  
    const totalMatches = matches ? matches.length * 2 : 0;
    const lCount = lMatches ? lMatches.length : 0;
    const rCount = rMatches ? rMatches.length : 0;
  
    if (lCount + rCount !== totalMatches) {
      throw new Error('There is no closing marker');
    }
  };

  const chkNested = (text, reg, mark) => {
    const parts = text.match(reg);
    if (parts) {
      for (const part of parts) {
        const slice = part.slice(mark.length, -mark.length);
        if (
          slice.length > 2 &&
          (markers.includes(slice[0] + slice[1]) ||
            markers.includes(
              slice[slice.length - 1] + slice[slice.length - 2]
            ))
        ) {
          throw new Error('Nested markers are not allowed');
        }
        if (
          slice.length > 1 &&
          (markers.includes(slice[0]) ||
            markers.includes(slice[slice.length - 1]))
        ) {
          throw new Error('Nested markers are not allowed');
        }
        if (
          slice.match(/\*\*/g)?.length > 1 ||
          slice.match(/_/g)?.length > 1 ||
          slice.match(/`/g)?.length > 1
        ) {
          throw new Error('Nested markers are not allowed');
        }
      }
    }
  };

  const mdToHtml = () => {
    const parts = mdText.split('```');
    if (parts.length % 2 === 0) {
      throw new Error('No closing preformatted marker provided');
    }
  
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        chkClosed(parts[i], lbReg, rbReg, bReg);
        chkClosed(parts[i], liReg, riReg, iReg);
        chkClosed(parts[i], lmReg, rmReg, mReg);
        regs.forEach((reg, idx) => chkNested(parts[i], reg, markers[idx]));
        parts[i] = setTags(parts[i]);
        parts[i] = setParas(parts[i]);
      } else {
        parts[i] = setPre(parts[i]);
      }
    }
  
    return parts.join('');
  };

  if (outIdx !== -1 && process.argv[outIdx + 1]) {
    const outFile = path.resolve(process.argv[outIdx + 1]);
    fs.writeFile(outFile, mdToHtml());
  } else {
    console.log(mdToHtml());
  }