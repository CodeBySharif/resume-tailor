"use client";

import { useState } from "react";
import { CircleHelp, Loader2, RefreshCw, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatAttemptLog } from "@/lib/llm/format-meta";
import { OPENROUTER_MODEL_PRESETS } from "@/lib/llm/openrouter";
import { hasConfiguredApiKey } from "@/lib/llm/validate-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LLMProvider } from "@/lib/resume-schema";
import { useResumeStore } from "@/store/resume-store";

function OpenRouterKeyHelp() {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="How to get a free OpenRouter API key"
      >
        <CircleHelp className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="start">
        <p className="font-medium">Get a free OpenRouter API key</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-muted-foreground">
          <li>
            Sign up at{" "}
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline"
            >
              openrouter.ai
            </a>{" "}
            (no credit card required)
          </li>
          <li>
            Open{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline"
            >
              openrouter.ai/keys
            </a>{" "}
            and create a new key
          </li>
          <li>Paste the key below and click Save Settings</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Free tier limits: <strong>50 requests/day</strong> (20/min). Each
          resume parse or generate counts as at least 1 request. Add{" "}
          <a
            href="https://openrouter.ai/settings/credits"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline"
          >
            $10 credits
          </a>{" "}
          once to unlock 1,000 free requests/day permanently. Resets midnight
          UTC.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function SettingsDialog() {
  const { llmSettings, saveLLMSettings } = useResumeStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(llmSettings);
  const [testingLlm, setTestingLlm] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setDraft(llmSettings);
      setTestResult(null);
    }
    setOpen(isOpen);
  }

  async function testConnection() {
    setTestingLlm(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/llm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: draft }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const attempts = data.attempts?.length
          ? ` (${formatAttemptLog(data.attempts)})`
          : "";
        setTestResult(`Failed: ${data.error ?? "Unknown error"}${attempts}`);
        return;
      }
      setTestResult(
        `Success via ${data.provider} in ${(data.totalDurationMs / 1000).toFixed(1)}s`
      );
    } catch {
      setTestResult("Failed: could not reach the server");
    } finally {
      setTestingLlm(false);
    }
  }

  function handleSave() {
    saveLLMSettings(draft);
    setOpen(false);
  }

  const keyConfigured = hasConfiguredApiKey(draft);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          />
        }
      >
        <Settings className="size-4" />
        Settings
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Bring your own API key (BYOK). Keys are saved in this browser only
            and sent to the AI provider when you generate content — never
            stored on our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-brand-accent/30 bg-brand-accent/5 px-3 py-2.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Recommended:</span>{" "}
              OpenRouter — free models, no credit card, up to 1M context.
            </div>

            <div className="space-y-1.5">
              <Label>AI Provider</Label>
              <Select
                value={draft.provider}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, provider: v as LLMProvider }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openrouter">
                    OpenRouter (free, recommended)
                  </SelectItem>
                  <SelectItem value="groq">Groq (Llama 3.3 70B)</SelectItem>
                  <SelectItem value="gemini">Google Gemini (2.5 Flash)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {draft.provider === "openrouter" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                    <OpenRouterKeyHelp />
                  </div>
                  <Input
                    id="openrouter-key"
                    type="password"
                    placeholder="sk-or-v1-…"
                    autoComplete="off"
                    value={draft.openrouterApiKey}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        openrouterApiKey: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Get a free key at{" "}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      openrouter.ai/keys
                    </a>
                    . Saved locally so you only enter it once per device.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="openrouter-model">OpenRouter Model</Label>
                  <Select
                    value={draft.openrouterModel ?? ""}
                    onValueChange={(v) => {
                      if (v) setDraft((d) => ({ ...d, openrouterModel: v }));
                    }}
                  >
                    <SelectTrigger id="openrouter-model" className="w-full">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENROUTER_MODEL_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label} ({preset.context})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Auto</strong> lets OpenRouter pick a free model
                    (GPT-OSS, Nemotron, Gemini, etc.). If one is busy, the app
                    automatically tries others. You can also pin a specific model
                    below.
                  </p>
                </div>
              </div>
            )}

            {draft.provider === "groq" && (
              <div className="space-y-1.5">
                <Label htmlFor="groq-key">Groq API Key</Label>
                <Input
                  id="groq-key"
                  type="password"
                  placeholder="gsk_…"
                  autoComplete="off"
                  value={draft.groqApiKey}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, groqApiKey: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Free tier at{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    console.groq.com/keys
                  </a>
                  . Saved locally on this device.
                </p>
              </div>
            )}

            {draft.provider === "gemini" && (
              <div className="space-y-1.5">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AIza…"
                  autoComplete="off"
                  value={draft.geminiApiKey}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, geminiApiKey: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Free tier at{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    aistudio.google.com/apikey
                  </a>
                  . Saved locally on this device.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={testingLlm || !keyConfigured}
                onClick={testConnection}
              >
                {testingLlm ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Test connection
              </Button>
              {!keyConfigured && (
                <p className="text-xs text-muted-foreground">
                  Enter an API key above to test your connection.
                </p>
              )}
              {testResult && (
                <p
                  className={`text-xs ${testResult.startsWith("Success") ? "text-green-600" : "text-destructive"}`}
                >
                  {testResult}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!keyConfigured}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
