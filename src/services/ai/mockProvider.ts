import type { LLMProvider } from './base';
import type { LLMRequestParams, StreamChunk, TokenStats } from '../../types';

export class MockLLMProvider implements LLMProvider {
  id = 'mock';
  name = 'Simulated EgSA AI Engine';

  async generateStream(
    params: LLMRequestParams,
    onChunk: (chunk: StreamChunk) => void,
    _onError: (error: Error) => void
  ): Promise<() => void> {
    let isAborted = false;
    const startTime = Date.now();

    const lastMessage = params.messages[params.messages.length - 1]?.content || '';
    const responseText = this.generateContextualResponse(lastMessage, params);

    // Break down text into realistic streaming tokens/chunks
    const words = responseText.split(/(\s+|[.,!?:;\n])/).filter(Boolean);
    let index = 0;
    let accumulated = '';

    const abortFn = () => {
      isAborted = true;
    };

    const streamNext = () => {
      if (isAborted) return;

      if (index >= words.length) {
        const endTime = Date.now();
        const latencyMs = endTime - startTime;
        const totalTokens = Math.ceil(accumulated.length / 4);
        const charsPerSec = Math.round((accumulated.length / (latencyMs / 1000)) || 0);

        const stats: TokenStats = {
          promptTokens: Math.ceil(lastMessage.length / 4),
          completionTokens: totalTokens,
          totalTokens: Math.ceil(lastMessage.length / 4) + totalTokens,
          latencyMs,
          charsPerSec,
        };

        onChunk({
          content: '',
          done: true,
          stats,
        });
        return;
      }

      const chunk = words[index];
      accumulated += chunk;
      index++;

      onChunk({
        content: chunk,
        done: false,
      });

      const delay = Math.floor(Math.random() * 25) + 15;
      setTimeout(streamNext, delay);
    };

    setTimeout(() => {
      if (!isAborted) {
        streamNext();
      }
    }, 180);

    return abortFn;
  }

  private generateContextualResponse(query: string, params: LLMRequestParams): string {
    const q = query.toLowerCase();

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return `Greetings! I am connected via **${params.modelId}**.\n\n` +
        `How can I assist your mission today? You can ask me to:\n` +
        `* 🛰️ Analyze satellite telemetry and orbital data\n` +
        `* 💻 Write or refactor scalable frontend & backend architectures\n` +
        `* ⚙️ Configure custom themes, personas, and model parameters\n` +
        `* 📊 Generate comparative performance reports and diagrams\n\n` +
        `What shall we explore first?`;
    }

    if (q.includes('code') || q.includes('component') || q.includes('react') || q.includes('typescript')) {
      return `Here is a modular TypeScript pattern designed for high extensibility:\n\n` +
        `### Extensible Plugin Registry Pattern\n\n` +
        `\`\`\`typescript\n` +
        `export interface Plugin<TContext = unknown> {\n` +
        `  id: string;\n` +
        `  version: string;\n` +
        `  initialize: (context: TContext) => Promise<void>;\n` +
        `  execute: (input: unknown) => Promise<unknown>;\n` +
        `}\n\n` +
        `export class PluginManager<TContext> {\n` +
        `  private plugins = new Map<string, Plugin<TContext>>();\n\n` +
        `  register(plugin: Plugin<TContext>) {\n` +
        `    this.plugins.set(plugin.id, plugin);\n` +
        `    console.info(\`[Registry] Registered \${plugin.id}@\${plugin.version}\`);\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `> **Architectural Note:** Decoupling handlers via a pluggable registry allows seamless addition of new LLM capabilities without touching core view components.`;
    }

    if (q.includes('space') || q.includes('egsa') || q.includes('satellite') || q.includes('orbit')) {
      return `### 🛰️ EgSA Satellite Telemetry Overview\n\n` +
        `Telemetry link status: **NOMINAL** (SNR: 18.4 dB, Carrier Lock: Valid).\n\n` +
        `| Subsystem | Status | Temp (°C) | Power Draw (W) |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        `| **ADCS (Attitude Control)** | Active / Fine Sun Tracking | +18.2 | 14.2 |\n` +
        `| **Payload Imager** | Standby / Calibrated | -4.1 | 2.5 |\n` +
        `| **OBC (On-Board Computer)** | Operational | +24.8 | 6.8 |\n` +
        `| **EPS (Solar Panels)** | Sunlit / Charging | +42.0 | +84.5 (Gen) |\n\n` +
        `Orbital altitude is stable at **512 km SSO** with an inclination of **97.4°**. Next ground station pass is in **38 minutes**.`;
    }

    // Default rich response
    return `### Analysis & Recommendations\n\n` +
      `Thank you for the prompt: "*${query}*".\n\n` +
      `Based on the current configuration (${params.modelId}, temperature: ${params.temperature ?? 0.7}):\n\n` +
      `1. **Modularity**: Ensure state and render layers remain completely separated.\n` +
      `2. **Customizability**: Leverage CSS Custom Properties for zero-re-render UI theming.\n` +
      `3. **Performance**: Use virtualized rendering or auto-scrolling hooks to handle long conversations effortlessly.\n\n` +
      `\`\`\`json\n` +
      `{\n` +
      `  "status": "ready",\n` +
      `  "streaming": true,\n` +
      `  "engine": "${params.modelId}",\n` +
      `  "timestamp": "${new Date().toISOString()}"\n` +
      `}\n` +
      `\`\`\`\n\n` +
      `Would you like to drill down further into any specific detail or customize this session's parameters?`;
  }
}
