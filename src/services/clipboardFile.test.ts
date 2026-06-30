import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeAppleScriptString } from "./clipboardFile";

test("leaves a normal path untouched", () => {
  assert.equal(escapeAppleScriptString("/Users/me/app.apk"), "/Users/me/app.apk");
});

test("escapes a double quote", () => {
  assert.equal(escapeAppleScriptString('a"b'), 'a\\"b');
});

test("escapes a backslash", () => {
  assert.equal(escapeAppleScriptString("a\\b"), "a\\\\b");
});

test("escapes backslash before quote (order matters)", () => {
  // input: a \ " b   ->   a \\ \" b
  assert.equal(escapeAppleScriptString('a\\"b'), 'a\\\\\\"b');
});
