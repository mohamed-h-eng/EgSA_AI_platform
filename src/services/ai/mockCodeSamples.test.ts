import { describe, expect, it } from 'vitest';
import { CODE_SAMPLES, REVIEW_SAMPLES, detectLanguage, mockCodeAnswer } from './mockCodeSamples';
import { checkCode } from '../code/codeCheck';
import type { CodeLanguage } from '../code/languages';

describe('demo code samples', () => {
  it('every language sample passes the code checks with no warnings', () => {
    for (const [lang, sample] of Object.entries(CODE_SAMPLES)) {
      const warnings = checkCode(sample.code.trim(), lang as CodeLanguage).filter((i) => i.severity === 'warning');
      expect(warnings, `${lang} sample`).toEqual([]);
    }
  });

  it('review samples contain the problems their notes describe', () => {
    const c = checkCode(REVIEW_SAMPLES.c!.code.trim(), 'c').map((i) => i.message);
    expect(c).toContain("Assignment '=' inside a condition; did you mean '=='?");
    expect(c.some((m) => m.includes('never closed'))).toBe(true);
    expect(c).toContain('TODO left in the code');

    const py = checkCode(REVIEW_SAMPLES.python!.code.trim(), 'python').map((i) => i.message);
    expect(py).toContain("Compare with None using 'is' / 'is not'");
    expect(py.some((m) => m.startsWith('Indentation of 2 spaces'))).toBe(true);
  });
});

describe('mockCodeAnswer', () => {
  it('detects the requested language', () => {
    expect(detectLanguage('Write a C++ quaternion class')).toBe('cpp');
    expect(detectLanguage('write this in Python please')).toBe('python');
    expect(detectLanguage('an SQL query for battery minimum')).toBe('sql');
    expect(detectLanguage('Explain ADCS reaction wheel desaturation')).toBeUndefined();
  });

  it('answers coding prompts with a fenced sample in that language', () => {
    expect(mockCodeAnswer('Write a MATLAB script to plot attitude error')).toContain('```matlab');
    expect(mockCodeAnswer('Show me some code')).toContain('```typescript');
    expect(mockCodeAnswer('Please review this code')).toContain('```c');
    expect(mockCodeAnswer('review my python function')).toContain('```python');
  });

  it('leaves non-coding prompts to the other demo answers', () => {
    expect(mockCodeAnswer('Show telemetry status for our low Earth orbit satellite')).toBeUndefined();
    expect(mockCodeAnswer('ما هي أحدث مهام وكالة الفضاء المصرية')).toBeUndefined();
  });
});
