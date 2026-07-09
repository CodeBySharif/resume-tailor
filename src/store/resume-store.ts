import { create } from "zustand";
import {
  createEmptyJobDetails,
  createEmptyResume,
  DEFAULT_LLM_SETTINGS,
  LLM_SETTINGS_KEY,
  normalizeResume,
  type JobDetails,
  type LLMSettings,
  type Resume,
  type ResumeChange,
} from "@/lib/resume-schema";
import {
  DEFAULT_GENERATION_STYLE,
  type GenerationStyle,
} from "@/lib/writing-tone";
import { normalizePrintableText } from "@/lib/text-normalize";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

interface ResumeStore {
  step: WizardStep;
  resume: Resume;
  originalResume: Resume | null;
  tailoredResume: Resume | null;
  coverLetter: string;
  changes: ResumeChange[];
  jobDetails: JobDetails;
  generationStyle: GenerationStyle;
  llmSettings: LLMSettings;
  isLoading: boolean;
  error: string | null;

  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setResume: (resume: Resume) => void;
  updateResume: (updater: (resume: Resume) => Resume) => void;
  setOriginalResume: (resume: Resume) => void;
  setTailoredResume: (resume: Resume) => void;
  updateTailoredResume: (updater: (resume: Resume) => Resume) => void;
  setCoverLetter: (letter: string) => void;
  setChanges: (changes: ResumeChange[]) => void;
  setJobDetails: (details: JobDetails) => void;
  updateJobDetails: (partial: Partial<JobDetails>) => void;
  setGenerationStyle: (style: GenerationStyle) => void;
  updateGenerationStyle: (partial: Partial<GenerationStyle>) => void;
  setLLMSettings: (settings: LLMSettings) => void;
  loadLLMSettings: () => void;
  saveLLMSettings: (settings: LLMSettings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetGeneration: () => void;
  resetAll: () => void;
}

function loadSettingsFromStorage(): LLMSettings {
  if (typeof window === "undefined") return DEFAULT_LLM_SETTINGS;
  try {
    const stored = localStorage.getItem(LLM_SETTINGS_KEY);
    if (stored) {
      const raw = JSON.parse(stored) as Record<string, unknown>;
      const parsed: LLMSettings = {
        ...DEFAULT_LLM_SETTINGS,
        ...raw,
        provider:
          raw.provider === "ollama"
            ? "openrouter"
            : (raw.provider as LLMSettings["provider"]) ??
              DEFAULT_LLM_SETTINGS.provider,
      };
      if (!parsed.groqApiKey) parsed.groqApiKey = "";
      if (!parsed.openrouterApiKey) parsed.openrouterApiKey = "";
      if (!parsed.openrouterModel) {
        parsed.openrouterModel = "openrouter/free";
      }
      return parsed;
    }
  } catch {
    /* use defaults */
  }
  return DEFAULT_LLM_SETTINGS;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  step: 1,
  resume: createEmptyResume(),
  originalResume: null,
  tailoredResume: null,
  coverLetter: "",
  changes: [],
  jobDetails: createEmptyJobDetails(),
  generationStyle: DEFAULT_GENERATION_STYLE,
  llmSettings: DEFAULT_LLM_SETTINGS,
  isLoading: false,
  error: null,

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(5, s.step + 1) as WizardStep })),
  prevStep: () => set((s) => ({ step: Math.max(1, s.step - 1) as WizardStep })),
  setResume: (resume) => set({ resume: normalizeResume(resume) }),
  updateResume: (updater) => set((s) => ({ resume: updater(s.resume) })),
  setOriginalResume: (resume) => set({ originalResume: normalizeResume(resume) }),
  setTailoredResume: (resume) => set({ tailoredResume: normalizeResume(resume) }),
  updateTailoredResume: (updater) =>
    set((s) => ({
      tailoredResume: s.tailoredResume ? updater(s.tailoredResume) : null,
    })),
  setCoverLetter: (letter) =>
    set({ coverLetter: normalizePrintableText(letter) }),
  setChanges: (changes) => set({ changes }),
  setJobDetails: (details) =>
    set({ jobDetails: { ...createEmptyJobDetails(), ...details } }),
  updateJobDetails: (partial) =>
    set((s) => ({
      jobDetails: { ...createEmptyJobDetails(), ...s.jobDetails, ...partial },
    })),
  setGenerationStyle: (style) => set({ generationStyle: style }),
  updateGenerationStyle: (partial) =>
    set((s) => ({
      generationStyle: { ...DEFAULT_GENERATION_STYLE, ...s.generationStyle, ...partial },
    })),
  setLLMSettings: (settings) => set({ llmSettings: settings }),
  loadLLMSettings: () => set({ llmSettings: loadSettingsFromStorage() }),
  saveLLMSettings: (settings) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(settings));
    }
    set({ llmSettings: settings });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  resetGeneration: () =>
    set({ tailoredResume: null, coverLetter: "", changes: [], error: null }),
  resetAll: () =>
    set({
      step: 1,
      resume: createEmptyResume(),
      originalResume: null,
      tailoredResume: null,
      coverLetter: "",
      changes: [],
      jobDetails: createEmptyJobDetails(),
      generationStyle: DEFAULT_GENERATION_STYLE,
      isLoading: false,
      error: null,
    }),
}));
