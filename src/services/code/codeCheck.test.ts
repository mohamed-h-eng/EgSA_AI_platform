import { describe, expect, it } from 'vitest';
import { checkCode, stripCommentsAndStrings } from './codeCheck';
import { highlightCode } from './highlight';
import { resolveLanguage } from './languages';

const messages = (code: string, lang: Parameters<typeof checkCode>[1]) => checkCode(code, lang).map((i) => `${i.line}:${i.message}`);

describe('checkCode', () => {
  it('passes clean code', () => {
    expect(checkCode('int add(int a, int b) {\n    return a + b;\n}', 'c')).toEqual([]);
    expect(checkCode('def add(a, b):\n    return a + b', 'python')).toEqual([]);
  });

  it('finds unbalanced brackets but ignores brackets in strings and comments', () => {
    expect(messages('int main() {\n  printf("(");\n  // )\n', 'c')).toEqual(["1:'{' is never closed"]);
    expect(messages('x = [1, 2)\n', 'python')[0]).toBe("1:')' closes '[' opened on line 1");
    expect(checkCode('s = "not a (bracket"\n', 'python')).toEqual([]);
  });

  it('flags assignment inside a condition in C-like languages only', () => {
    expect(messages('if (x = 5) {\n}', 'c')).toContain("1:Assignment '=' inside a condition; did you mean '=='?");
    expect(checkCode('if (x == 5) {\n}', 'c')).toEqual([]);
    expect(checkCode('if (x <= 5 && y != 2) {\n}', 'typescript')).toEqual([]);
  });

  it('reports invalid JSON with a line', () => {
    const [issue] = checkCode('{\n  "a": 1,\n}', 'json');
    expect(issue.severity).toBe('warning');
    expect(issue.message).toMatch(/^Invalid JSON/);
  });

  it('notes Python style issues', () => {
    const out = messages('if x == None:\n  y = 1\n', 'python');
    expect(out).toContain("1:Compare with None using 'is' / 'is not'");
    expect(out).toContain('2:Indentation of 2 spaces (PEP 8 uses multiples of 4)');
  });

  it('notes mixed indentation, trailing whitespace, long lines and TODOs', () => {
    const out = messages('a = 1  \n\tb = 2\n    c = 3\n# TODO tidy\n' + 'x'.repeat(130), 'bash');
    expect(out).toContain('1:Trailing whitespace');
    expect(out).toContain('3:Indentation mixes tabs and spaces');
    expect(out).toContain('4:TODO left in the code');
    expect(out).toContain('5:Line is 130 characters (over 120)');
  });

  it('keeps line structure when stripping comments and strings', () => {
    const src = 'a = "x\ny" # c\n/* no */ b';
    expect(stripCommentsAndStrings('a = 1 // (\nb = ")"', 'javascript').split('\n')).toHaveLength(2);
    expect(stripCommentsAndStrings(src, 'python').split('\n')).toHaveLength(src.split('\n').length);
  });

  it("doesn't treat MATLAB transpose as a string", () => {
    expect(checkCode("B = A';\nC = (A' * B);", 'matlab')).toEqual([]);
  });
});

describe('highlightCode', () => {
  it('resolves aliases and escapes unknown languages', () => {
    expect(resolveLanguage('py')).toBe('python');
    expect(resolveLanguage('C++')).toBe('cpp');
    expect(resolveLanguage('cobol')).toBeUndefined();
    expect(highlightCode('<b>', 'cobol').html).toBe('&lt;b&gt;');
  });

  it('marks up keywords for a known language', () => {
    const { html, language } = highlightCode('def f():\n    return 1', 'python');
    expect(language).toBe('python');
    expect(html).toContain('hljs-keyword');
  });
});
