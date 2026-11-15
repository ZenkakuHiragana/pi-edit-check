#!/usr/bin/env node
// npm の postinstall。既定の検査に使う editorconfig-checker を、インストールの時点で動く状態にして確かめる。
// npm の editorconfig-checker はラッパーで、初めて起動したときに GitHub から本体をダウンロードする（置き場所は
// node_modules/editorconfig-checker/bin/）。ラッパーは Node.js が古いときや本体が欠けているときにも終了コード 0 で
// 終わることがあるので、版の行が出たかどうかで判定する。確かめられなければインストールを失敗させる。
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const checkerRoot = new URL("../node_modules/editorconfig-checker/", import.meta.url);

function fail(message) {
  console.error("pi-edit-check: " + message);
  process.exit(1);
}

// ラッパーは node:http の setGlobalProxyFromEnv を使う。これは Node.js 24.14.0 と 25.4.0 で入ったので、
// 依存の engines.node（>=24.14.0）だけでは 25.0〜25.3 を通してしまう。package.json の engines と README も同じ範囲にする。
const REQUIRED = ">=24.14.0 <25.0.0 || >=25.4.0";
const [major, minor] = process.versions.node.split(".").map(Number);
const supported = major > 25 || (major === 25 && minor >= 4) || (major === 24 && minor >= 14);
if (!supported) fail("Node.js " + process.versions.node + " では editorconfig-checker が動かない。Node.js " + REQUIRED + " が必要。");

let output = "";
try {
  output = execFileSync(process.execPath, [fileURLToPath(new URL("dist/index.js", checkerRoot)), "-version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
} catch (error) {
  fail("editorconfig-checker を起動できなかった: " + (error instanceof Error ? error.message : String(error)));
}
process.stdout.write(output);
if (!output.split(/\r?\n/).some((line) => /^v\d/.test(line))) {
  fail("editorconfig-checker の版を確かめられなかった。本体のダウンロードが途中で止まったかもしれない。入れ直す前に " +
    fileURLToPath(new URL("bin", checkerRoot)) + " が残っていれば消す。");
}
