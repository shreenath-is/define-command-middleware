const fs = require("fs");
const path = require("path");

const dictionaryPath = path.join(__dirname, "wordnet", "dict");
const partsOfSpeech = ["adj", "noun", "verb", "adv"];
const definitions = new Map();
const exceptions = new Map();

for (const partOfSpeech of partsOfSpeech) {
  const lemmasByOffset = new Map();
  const indexLines = fs.readFileSync(
    path.join(dictionaryPath, `index.${partOfSpeech}`),
    "utf8"
  ).split(/\r?\n/);

  for (const line of indexLines) {
    if (!line || line.startsWith(" ")) {
      continue;
    }

    const fields = line.split(/\s+/);
    const lemma = fields[0];
    const pointerCount = Number(fields[3]);
    const synsetCount = Number(fields[2]);
    const offsets = fields.slice(6 + pointerCount, 6 + pointerCount + synsetCount);

    for (const offset of offsets) {
      const lemmas = lemmasByOffset.get(offset) || [];
      lemmas.push(lemma);
      lemmasByOffset.set(offset, lemmas);
    }
  }

  const dataLines = fs.readFileSync(
    path.join(dictionaryPath, `data.${partOfSpeech}`),
    "utf8"
  ).split(/\r?\n/);

  for (const line of dataLines) {
    const separator = line.indexOf("|");
    if (separator < 0) {
      continue;
    }

    const lemmas = lemmasByOffset.get(line.slice(0, 8));
    if (!lemmas) {
      continue;
    }

    const definition = line.slice(separator + 1).trim();
    for (const lemma of lemmas) {
      const lemmaDefinitions = definitions.get(lemma) || [];
      if (!lemmaDefinitions.includes(definition)) {
        lemmaDefinitions.push(definition);
        definitions.set(lemma, lemmaDefinitions);
      }
    }
  }

  const exceptionLines = fs.readFileSync(
    path.join(dictionaryPath, `${partOfSpeech}.exc`),
    "utf8"
  ).split(/\r?\n/);

  for (const line of exceptionLines) {
    if (!line) {
      continue;
    }

    const [inflectedForm, ...baseForms] = line.split(/\s+/);
    const bases = exceptions.get(inflectedForm) || [];
    bases.push(...baseForms);
    exceptions.set(inflectedForm, bases);
  }
}

const morphologyRules = [
  [
    ["s", ""],
    ["ses", "s"],
    ["xes", "x"],
    ["zes", "z"],
    ["ches", "ch"],
    ["shes", "sh"],
    ["men", "man"],
    ["ies", "y"],
  ],
  [
    ["s", ""],
    ["ies", "y"],
    ["es", "e"],
    ["es", ""],
    ["ed", "e"],
    ["ed", ""],
    ["ing", "e"],
    ["ing", ""],
  ],
  [
    ["er", ""],
    ["est", ""],
    ["er", "e"],
    ["est", "e"],
  ],
];

function getDefinitions(word) {
  const lemma = word.trim().toLowerCase().replace(/\s+/g, "_");
  const directDefinitions = definitions.get(lemma);
  if (directDefinitions) {
    return directDefinitions.slice(0, 2);
  }

  for (const baseForm of exceptions.get(lemma) || []) {
    const baseDefinitions = definitions.get(baseForm);
    if (baseDefinitions) {
      return baseDefinitions.slice(0, 2);
    }
  }

  const baseForms = new Set();
  for (const rules of morphologyRules) {
    for (const [suffix, replacement] of rules) {
      if (lemma.endsWith(suffix) && lemma.length > suffix.length) {
        baseForms.add(`${lemma.slice(0, -suffix.length)}${replacement}`);
      }
    }
  }

  for (const baseForm of baseForms) {
    const baseDefinitions = definitions.get(baseForm);
    if (baseDefinitions) {
      return baseDefinitions.slice(0, 2);
    }
  }

  return [];
}

module.exports = getDefinitions;
