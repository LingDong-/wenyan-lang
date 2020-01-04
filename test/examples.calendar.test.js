var fs = require("fs-extra");
var path = require("path");
var utils = require("../tools/utils");
var execSync = require("child_process").execSync;
var { expect } = require("chai");
var { compile, evalCompiled } = require("../src/parser");

var lib = utils.loadlib();
const exampleDir = path.resolve(__dirname, "../examples/");
const outputDir = path.resolve(__dirname, "../test/temp/examples/");
const python = getPythonExecutable();

const ignoreExamples = [
  "divination", // contains randomness
  //"import", // prints current time
  "tree2", // DOM manipulate
  "tree" // DOM manipulate
];

function getPythonExecutable() {
  try {
    const output = execSync(`python3 -V`).toString();
    if (output && +output[7] === 3) return "python3";
  } catch (e) {}
  try {
    const output = execSync(`python -V`).toString();
    if (output && +output[7] === 3) return "python";
  } catch (e) {}
  return undefined;
}

function readOtherExample(x) {
  console.log(x);
  return fs
    .readFileSync(path.resolve(__dirname, "../examples/" + x + ".wy"), "utf-8")
    .toString();
}

function runExample(lang, name, options = {}) {
  var code = fs
    .readFileSync(path.join(exampleDir, name + ".wy"), "utf-8")
    .toString();

  var compiled = compile(lang, code, {
    logCallback: () => {},
    reader: readOtherExample,
    lib: lib,
    ...options
  });

  if (ignoreExamples.includes(name)) return;

  let output = "";

  evalCompiled(compiled, {
    scoped: true,
    lang,
    output: (...args) => (output += args.join(" ") + "\n"),
    ...options
  });

  console.log("Output from .wy script: " + output);
  expect(output).to.equal(
    "施「彼年何年」於四千七百一十六?  一千九百六十九\n施「彼刻何刻」於四千七百一十?  一\n施「彼日何干支」於四千七百一十四?  一十八\n"
  );
}

function runCal(lang, options) {
  var files = fs.readdirSync(exampleDir).filter(x => x.endsWith("calendar.wy"));
  console.log("Files to be tested: " + files);

  //var files = fs.readdirSync(exampleDir).filter("import.wy");
  for (const file of files) {
    const filename = file.split(".")[0];
    it(filename, () => runExample(lang, filename, options));
  }
}

describe("examples", () => {
  before(() => {
    fs.removeSync(outputDir);
    fs.ensureDirSync(outputDir);
  });

  describe("javascript", () => {
    runCal("js");
  });

  describe("romanizeIdentifiers", () => {
    runCal("js", { romanizeIdentifiers: true });
  });

  /* FIXME: there are errors for python compiler
  if (python) {
    describe("python", () => {
      runAll("py");
    })
  }
  else {
    describe("python", () => {
      it("skipped", ()=>{})
    })
  }
  */
});
