export interface LLMAttempt {
  name: string;
  ok: boolean;
  durationMs: number;
  error?: string;
}

export interface LLMGenerateResult {
  text: string;
  provider: string;
  attempts: LLMAttempt[];
  totalDurationMs: number;
}

export class LLMProviderError extends Error {
  attempts: LLMAttempt[];

  constructor(message: string, attempts: LLMAttempt[]) {
    super(message);
    this.name = "LLMProviderError";
    this.attempts = attempts;
  }
}
