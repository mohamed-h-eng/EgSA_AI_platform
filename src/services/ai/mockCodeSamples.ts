import type { CodeLanguage } from '../code/languages';

// Demo-mode code answers (plan: agent/CODE_BLOCKS_PLAN.md §3): one realistic, space-flavoured sample
// per supported language, plus "review" samples with deliberate problems that the code checks catch.
// Used only by the mock provider, so highlighting and checks can be shown with no model connected.

interface CodeSample {
  title: string;
  intro: string;
  code: string;
  note?: string;
}

const fence = (lang: string, code: string) => `\`\`\`${lang}\n${code.trim()}\n\`\`\``;

export const CODE_SAMPLES: Record<CodeLanguage, CodeSample> = {
  python: {
    title: 'Orbital period from altitude',
    intro: 'Kepler’s third law for a circular orbit around Earth:',
    code: `
import math

MU_EARTH = 398_600.4418  # km^3/s^2
R_EARTH = 6_378.137      # km


def orbital_period_minutes(altitude_km: float) -> float:
    """Period of a circular orbit at the given altitude, in minutes."""
    if altitude_km < 0:
        raise ValueError("altitude must be non-negative")
    a = R_EARTH + altitude_km
    return 2 * math.pi * math.sqrt(a**3 / MU_EARTH) / 60


if __name__ == "__main__":
    for alt in (400, 512, 800):
        print(f"{alt:>4} km -> {orbital_period_minutes(alt):6.2f} min")
`,
    note: 'At 512 km (a typical SSO altitude) this gives about 94.8 minutes.',
  },
  c: {
    title: 'CRC-16/CCITT for telemetry frames',
    intro: 'A table-free CRC suitable for small on-board computers:',
    code: `
#include <stdint.h>
#include <stddef.h>

/* CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection. */
uint16_t crc16_ccitt(const uint8_t *data, size_t len)
{
    uint16_t crc = 0xFFFF;

    for (size_t i = 0; i < len; i++) {
        crc ^= (uint16_t)data[i] << 8;
        for (int bit = 0; bit < 8; bit++) {
            crc = (crc & 0x8000) ? (uint16_t)((crc << 1) ^ 0x1021) : (uint16_t)(crc << 1);
        }
    }
    return crc;
}
`,
    note: 'Check value for the ASCII string "123456789" is 0x29B1.',
  },
  cpp: {
    title: 'Quaternion normalisation (ADCS)',
    intro: 'Keeps attitude quaternions unit-length after integration:',
    code: `
#include <cmath>
#include <stdexcept>

struct Quaternion {
    double w, x, y, z;

    double norm() const { return std::sqrt(w * w + x * x + y * y + z * z); }

    Quaternion normalized() const {
        const double n = norm();
        if (n < 1e-12) {
            throw std::domain_error("cannot normalise a zero quaternion");
        }
        return {w / n, x / n, y / n, z / n};
    }
};
`,
  },
  typescript: {
    title: 'Typed telemetry frame parser',
    intro: 'Parses a fixed-layout housekeeping frame from a ground-station buffer:',
    code: `
export interface HousekeepingFrame {
  timestamp: number; // seconds since epoch
  batteryVoltage: number; // volts
  obcTemperature: number; // °C
  mode: 'SAFE' | 'NOMINAL' | 'PAYLOAD';
}

const MODES = ['SAFE', 'NOMINAL', 'PAYLOAD'] as const;

export function parseFrame(buffer: ArrayBuffer): HousekeepingFrame {
  const view = new DataView(buffer);
  if (view.byteLength < 11) throw new Error(\`Frame too short: \${view.byteLength} bytes\`);

  const modeIndex = view.getUint8(10);
  return {
    timestamp: view.getUint32(0),
    batteryVoltage: view.getUint16(4) / 1000,
    obcTemperature: view.getInt16(6) / 100,
    mode: MODES[modeIndex] ?? 'SAFE',
  };
}
`,
  },
  javascript: {
    title: 'Next ground-station pass countdown',
    intro: 'A small helper for an operations dashboard:',
    code: `
export function formatCountdown(passStartIso, now = new Date()) {
  const ms = new Date(passStartIso).getTime() - now.getTime();
  if (Number.isNaN(ms)) return 'Unknown pass time';
  if (ms <= 0) return 'Pass in progress';

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return \`AOS in \${minutes} min \${String(seconds).padStart(2, '0')} s\`;
}
`,
  },
  java: {
    title: 'Ground-pass scheduler',
    intro: 'Picks the next pass above a minimum elevation:',
    code: `
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public final class PassScheduler {
    public record Pass(String station, Instant aos, Instant los, double maxElevationDeg) {}

    private final double minElevationDeg;

    public PassScheduler(double minElevationDeg) {
        this.minElevationDeg = minElevationDeg;
    }

    public Optional<Pass> next(List<Pass> passes, Instant now) {
        return passes.stream()
                .filter(p -> p.aos().isAfter(now))
                .filter(p -> p.maxElevationDeg() >= minElevationDeg)
                .min(Comparator.comparing(Pass::aos));
    }
}
`,
  },
  matlab: {
    title: 'Plot attitude error over a pass',
    intro: 'Converts quaternion error to degrees and plots it:',
    code: `
% q_err: N-by-4 quaternion error [w x y z], t: N-by-1 time in seconds
angle_deg = 2 * acosd(min(abs(q_err(:, 1)), 1));

figure;
plot(t / 60, angle_deg, 'LineWidth', 1.2);
grid on;
xlabel('Time (min)');
ylabel('Pointing error (deg)');
title('ADCS pointing error during pass');
yline(0.1, '--', 'Requirement ADCS-SRS-021');
`,
  },
  sql: {
    title: 'Battery minimum per orbit',
    intro: 'Finds the lowest battery voltage in each orbit over the last day:',
    code: `
SELECT
    orbit_number,
    MIN(battery_voltage) AS min_voltage,
    MIN(sampled_at)      AS orbit_start
FROM telemetry_housekeeping
WHERE sampled_at >= NOW() - INTERVAL '1 day'
GROUP BY orbit_number
HAVING MIN(battery_voltage) < 7.2
ORDER BY orbit_number;
`,
  },
  bash: {
    title: 'Rotate ground-station logs',
    intro: 'Compresses logs older than a day and deletes those older than 30 days:',
    code: `
#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="\${1:-/var/log/groundstation}"

find "$LOG_DIR" -name '*.log' -mtime +1 -exec gzip -9 {} \\;
find "$LOG_DIR" -name '*.log.gz' -mtime +30 -delete

echo "Rotated logs in $LOG_DIR"
`,
  },
  json: {
    title: 'Model profile configuration',
    intro: 'An example of how the gateway could describe model profiles:',
    code: `
{
  "profiles": [
    { "id": "general", "role": "general", "model": "llama3.1:8b", "default": true },
    { "id": "coding", "role": "coding", "model": "qwen2.5-coder:7b", "default": true }
  ],
  "endpoint": "http://gpu-server.egsa.local:11434/v1"
}
`,
  },
};

// Deliberately flawed code, for "review this code": each problem is one the checks report.
export const REVIEW_SAMPLES: Partial<Record<CodeLanguage, CodeSample>> = {
  c: {
    title: 'Code review: sensor threshold check',
    intro: 'Here is the function under review. The code checks in the header flag the problems (open the list):',
    code: `
int check_threshold(int reading, int limit)
{
    int alarm = 0;
    if (reading = limit) {   /* bug: assignment, not comparison */
        alarm = 1;
    }
    // TODO: add hysteresis
    return alarm;
`,
    note: "Findings: `=` inside the `if` assigns instead of comparing; the function's `{` is never closed; and a TODO is left in. Use `if (reading >= limit)` and close the brace.",
  },
  python: {
    title: 'Code review: telemetry filter',
    intro: 'Function under review. Open the check results in the code header:',
    code: `
def latest_valid(samples):
  result = None
  for s in samples:
      if s.value == None:
          continue
      result = s
  return result
`,
    note: 'Findings: two-space indentation (PEP 8 uses four) and `== None` (use `is None`).',
  },
};

const KEYWORDS: Array<[CodeLanguage, RegExp]> = [
  ['cpp', /\bc\+\+|\bcpp\b/i],
  ['typescript', /\btypescript\b|\bts\b/i],
  ['javascript', /\bjavascript\b|\bjs\b|\bnode\b/i],
  ['python', /\bpython\b|\bpy\b/i],
  ['java', /\bjava\b/i],
  ['matlab', /\bmatlab\b|\boctave\b/i],
  ['sql', /\bsql\b|\bquery\b|\bdatabase\b/i],
  ['bash', /\bbash\b|\bshell\b|\bscript\b.*\blinux\b/i],
  ['json', /\bjson\b|\bconfig(uration)?\b/i],
  ['c', /\bc\b(?!\+)|\bembedded\b|\bfirmware\b/i],
];

const CODE_INTENT = /\b(code|coding|script|function|program|implement|snippet|example|sample|write|class|lint|review|refactor|debug|bug)\b/i;
const REVIEW_INTENT = /\b(review|lint|bug|check|debug)\b/i;

/** Language named in the prompt, if any (first match in priority order). */
export function detectLanguage(prompt: string): CodeLanguage | undefined {
  return KEYWORDS.find(([, re]) => re.test(prompt))?.[0];
}

/** A demo code answer for coding prompts, or undefined when the prompt isn't about code. */
export function mockCodeAnswer(prompt: string): string | undefined {
  const lang = detectLanguage(prompt);
  if (!lang && !CODE_INTENT.test(prompt)) return undefined;

  if (REVIEW_INTENT.test(prompt)) {
    const sample = (lang && REVIEW_SAMPLES[lang]) || REVIEW_SAMPLES.c!;
    const reviewLang = lang && REVIEW_SAMPLES[lang] ? lang : 'c';
    return `### ${sample.title}\n\n${sample.intro}\n\n${fence(reviewLang, sample.code)}\n\n${sample.note ?? ''}`.trim();
  }

  if (!lang) {
    const list = Object.keys(CODE_SAMPLES).join(', ');
    const s = CODE_SAMPLES.typescript;
    return (
      `### ${s.title}\n\n${s.intro}\n\n${fence('typescript', s.code)}\n\n` +
      `Demo mode has samples in: ${list}. Ask for one by name, e.g. *"Write it in Python"*, or ask for a *code review* to see the code checks.`
    );
  }

  const s = CODE_SAMPLES[lang];
  return `### ${s.title}\n\n${s.intro}\n\n${fence(lang, s.code)}${s.note ? `\n\n${s.note}` : ''}`;
}
