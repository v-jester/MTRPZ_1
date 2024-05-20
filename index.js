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