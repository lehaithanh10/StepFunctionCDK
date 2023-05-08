const esbuild = require("esbuild");

const functions = [
  "step-function/deposit",
  "step-function/withdrawal",
  "step-function/publishNoti",
];

const entryPoints = functions.map(
  (lambdaName) => `./lambdas/${lambdaName}/index.ts`
);

const main = async () => {
  const chunkSize = 10;
  for (let i = 0; i < entryPoints.length; i += chunkSize) {
    const chunks = entryPoints.slice(i, i + chunkSize);
    await esbuild.build({
      entryPoints: chunks,
      bundle: true,
      outbase: "lambdas",
      outdir: "dist/lambdas",
      platform: "node",
      target: "node14",
      minify: true,
      sourcemap: true,
      external: ["aws-sdk", "chrome-aws-lambda"],
    });
  }
};

main();
