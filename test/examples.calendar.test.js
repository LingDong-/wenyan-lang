var fs = require("fs-extra");
var path = require("path");
var utils = require("../tools/utils");
var execSync = require("child_process").execSync;
var { expect } = require("chai");
var { compile, evalCompiled } = require("../src/parser");

var lib = utils.loadlib();
const exampleDir = path.resolve(__dirname, "../examples/calendar");
const outputDir = path.resolve(__dirname, "../test/temp/examples/calendar");
const python = getPythonExecutable();

const ignoreExamples = [
  "divination", // contains randomness
  "import", // prints current time
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
  console.log("Entering function readOtherExample: x = " + x);
  return fs
    .readFileSync(
      path.resolve(__dirname, "../examples/.calendar" + x + ".wy"),
      "utf-8"
    )
    .toString();
}

function runExample(lang, name, options = {}) {
  //console.log("Entering function runExample: name = " + name);
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

  console.log("Output from " + name + ".wy script: \n" + output);
  expect(output).to.matchSnapshot();
  /*
  expect(output).to.equal(
    "施「言彼之日時」於四千七百一十四? (「時」)  西元一九六九年己酉年十一月二十四日辛巳日丑初一刻三分三十四秒\n" +
    "施「彼年何年」於四千七百一十六?  一千九百六十九\n施「彼刻何刻」於四千七百一十?  一\n" +
    "施「彼日何干支」於四千七百一十四?  一十八\n" 
    
  );
  */
}

function runCal(lang, options) {
  var files = fs.readdirSync(exampleDir).filter(x => x.endsWith(".wy"));
  //console.log("Files to be tested: " + files);

  //var files = fs.readdirSync(exampleDir).filter("import.wy");
  for (const file of files) {
    //console.log("File being processed: " + file);

    const filename = file.split(".")[0];
    it(filename, () => runExample(lang, filename, options));
  }
}

describe("===== wen-yan calendar unit test suite =====", () => {
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
