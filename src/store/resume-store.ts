import { create } from "zustand";
import {
  createAtsScaffoldResume,
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
  DEFAULT_EDIT_COVER_TONE,
  DEFAULT_EDIT_RESUME_TONE,
  DEFAULT_GENERATION_STYLE,
  type GenerationStyle,
} from "@/lib/writing-tone";
import type { AtsCheckResult } from "@/lib/ats-types";
import type { ResumeSuggestResult } from "@/lib/resume-suggest-types";
import { resumeHasParseArtifacts } from "@/lib/resume-parse-sanitize";
import { normalizePrintableText } from "@/lib/text-normalize";

export type AppFlow =
  | "landing"
  | "create"
  | "tailor"
  | "ats"
  | "edit-resume"
  | "edit-cover"
  | "generate-cv";
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
export type CoverLetterMode = "templated" | "freeform";

function finalizeResume(resume: Resume): Resume {
  const normalized = normalizeResume(resume);
  if (resumeHasParseArtifacts(normalized)) {
    return normalizeResume(normalized, { sanitizeArtifacts: true });
  }
  return normalized;
}

function maxStepForFlow(flow: AppFlow): number {
  if (flow === "create") return 4;
  if (flow === "ats") return 4;
  if (flow === "tailor") return 5;
  if (flow === "edit-resume") return 6;
  if (flow === "edit-cover") return 4;
  if (flow === "generate-cv") return 4;
  return 1;
}

function clearFlowState() {
  return {
    resume: createEmptyResume(),
    originalResume: null as Resume | null,
    tailoredResume: null as Resume | null,
    fixedResume: null as Resume | null,
    createdResume: null as Resume | null,
    coverLetter: "",
    coverLetterMode: "templated" as CoverLetterMode,
    rewriteLocks: [] as string[],
    changes: [] as ResumeChange[],
    jobDetails: createEmptyJobDetails(),
    generationStyle: DEFAULT_GENERATION_STYLE,
    isLoading: false,
    error: null as string | null,
    atsResult: null as AtsCheckResult | null,
    atsChecking: false,
    atsError: null as string | null,
    fixedAtsResult: null as AtsCheckResult | null,
    fixedAtsChecking: false,
    resumeSuggestions: null as ResumeSuggestResult | null,
    suggestLoading: false,
    suggestError: null as string | null,
  };
}

interface ResumeStore {
  flow: AppFlow;
  step: WizardStep;
  resume: Resume;
  originalResume: Resume | null;
  tailoredResume: Resume | null;
  fixedResume: Resume | null;
  createdResume: Resume | null;
  coverLetter: string;
  coverLetterMode: CoverLetterMode;
  /** Locked summary / bullets that AI must not rewrite. */
  rewriteLocks: string[];
  changes: ResumeChange[];
  jobDetails: JobDetails;
  generationStyle: GenerationStyle;
  llmSettings: LLMSettings;
  isLoading: boolean;
  error: string | null;
  atsResult: AtsCheckResult | null;
  atsChecking: boolean;
  atsError: string | null;
  fixedAtsResult: AtsCheckResult | null;
  fixedAtsChecking: boolean;
  resumeSuggestions: ResumeSuggestResult | null;
  suggestLoading: boolean;
  suggestError: string | null;

  setFlow: (flow: AppFlow) => void;
  setStep: (step: WizardStep) => void;
  startCreateFlow: () => void;
  startTailorFlow: () => void;
  startAtsFlow: () => void;
  startEditResumeFlow: () => void;
  startEditCoverFlow: () => void;
  startGenerateCvFlow: () => void;
  goToLanding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setResume: (resume: Resume) => void;
  updateResume: (updater: (resume: Resume) => Resume) => void;
  setOriginalResume: (resume: Resume) => void;
  setTailoredResume: (resume: Resume) => void;
  updateTailoredResume: (updater: (resume: Resume) => Resume) => void;
  setFixedResume: (resume: Resume) => void;
  updateFixedResume: (updater: (resume: Resume) => Resume) => void;
  setCreatedResume: (resume: Resume) => void;
  updateCreatedResume: (updater: (resume: Resume) => Resume) => void;
  setCoverLetter: (letter: string) => void;
  setCoverLetterMode: (mode: CoverLetterMode) => void;
  setRewriteLocks: (locks: string[]) => void;
  toggleRewriteLock: (key: string) => void;
  clearRewriteLocks: () => void;
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
  setAtsResult: (result: AtsCheckResult | null) => void;
  setAtsChecking: (checking: boolean) => void;
  setAtsError: (error: string | null) => void;
  clearAtsResult: () => void;
  setFixedAtsResult: (result: AtsCheckResult | null) => void;
  setFixedAtsChecking: (checking: boolean) => void;
  clearFixedAtsResult: () => void;
  setResumeSuggestions: (result: ResumeSuggestResult | null) => void;
  setSuggestLoading: (loading: boolean) => void;
  setSuggestError: (error: string | null) => void;
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

export const useResumeStore = create<ResumeStore>((set) => ({
  flow: "landing",
  step: 1,
  resume: createEmptyResume(),
  originalResume: null,
  tailoredResume: null,
  fixedResume: null,
  createdResume: null,
  coverLetter: "",
  coverLetterMode: "templated",
  rewriteLocks: [],
  changes: [],
  jobDetails: createEmptyJobDetails(),
  generationStyle: DEFAULT_GENERATION_STYLE,
  llmSettings: DEFAULT_LLM_SETTINGS,
  isLoading: false,
  error: null,
  atsResult: null,
  atsChecking: false,
  atsError: null,
  fixedAtsResult: null,
  fixedAtsChecking: false,
  resumeSuggestions: null,
  suggestLoading: false,
  suggestError: null,

  setFlow: (flow) => set({ flow }),
  setStep: (step) => set({ step }),
  startCreateFlow: () =>
    set({
      flow: "create",
      step: 1,
      ...clearFlowState(),
      resume: createAtsScaffoldResume(),
    }),
  startTailorFlow: () =>
    set({
      flow: "tailor",
      step: 1,
      ...clearFlowState(),
    }),
  startAtsFlow: () =>
    set({
      flow: "ats",
      step: 1,
      ...clearFlowState(),
    }),
  startEditResumeFlow: () =>
    set({
      flow: "edit-resume",
      step: 1,
      ...clearFlowState(),
      generationStyle: {
        ...DEFAULT_GENERATION_STYLE,
        resumeTone: DEFAULT_EDIT_RESUME_TONE,
      },
    }),
  startEditCoverFlow: () =>
    set({
      flow: "edit-cover",
      step: 1,
      ...clearFlowState(),
      coverLetterMode: "freeform",
      generationStyle: {
        ...DEFAULT_GENERATION_STYLE,
        coverLetterTone: DEFAULT_EDIT_COVER_TONE,
      },
    }),
  startGenerateCvFlow: () =>
    set({
      flow: "generate-cv",
      step: 1,
      ...clearFlowState(),
      coverLetterMode: "templated",
      generationStyle: {
        ...DEFAULT_GENERATION_STYLE,
        resumeTone: DEFAULT_EDIT_RESUME_TONE,
      },
    }),
  goToLanding: () =>
    set({
      flow: "landing",
      step: 1,
      ...clearFlowState(),
    }),
  nextStep: () =>
    set((s) => ({
      step: Math.min(maxStepForFlow(s.flow), s.step + 1) as WizardStep,
    })),
  prevStep: () =>
    set((s) => ({
      step: Math.max(1, s.step - 1) as WizardStep,
    })),
  setResume: (resume) => set({ resume: finalizeResume(resume) }),
  updateResume: (updater) =>
    set((s) => ({ resume: updater(s.resume) })),
  setOriginalResume: (resume) => set({ originalResume: finalizeResume(resume) }),
  setTailoredResume: (resume) => set({ tailoredResume: finalizeResume(resume) }),
  updateTailoredResume: (updater) =>
    set((s) => ({
      tailoredResume: s.tailoredResume ? updater(s.tailoredResume) : null,
    })),
  setFixedResume: (resume) => set({ fixedResume: finalizeResume(resume) }),
  updateFixedResume: (updater) =>
    set((s) => ({
      fixedResume: s.fixedResume ? updater(s.fixedResume) : null,
    })),
  setCreatedResume: (resume) => set({ createdResume: finalizeResume(resume) }),
  updateCreatedResume: (updater) =>
    set((s) => ({
      createdResume: s.createdResume ? updater(s.createdResume) : null,
    })),
  setCoverLetter: (letter) =>
    set({ coverLetter: normalizePrintableText(letter) }),
  setCoverLetterMode: (mode) => set({ coverLetterMode: mode }),
  setRewriteLocks: (locks) => set({ rewriteLocks: [...new Set(locks)] }),
  toggleRewriteLock: (key) =>
    set((s) => ({
      rewriteLocks: s.rewriteLocks.includes(key)
        ? s.rewriteLocks.filter((k) => k !== key)
        : [...s.rewriteLocks, key],
    })),
  clearRewriteLocks: () => set({ rewriteLocks: [] }),
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
  setAtsResult: (result) => set({ atsResult: result, atsError: null }),
  setAtsChecking: (checking) => set({ atsChecking: checking }),
  setAtsError: (error) => set({ atsError: error }),
  clearAtsResult: () => set({ atsResult: null, atsError: null, atsChecking: false }),
  setFixedAtsResult: (result) => set({ fixedAtsResult: result }),
  setFixedAtsChecking: (checking) => set({ fixedAtsChecking: checking }),
  clearFixedAtsResult: () =>
    set({ fixedAtsResult: null, fixedAtsChecking: false }),
  setResumeSuggestions: (result) =>
    set({ resumeSuggestions: result, suggestError: null }),
  setSuggestLoading: (loading) => set({ suggestLoading: loading }),
  setSuggestError: (error) => set({ suggestError: error }),
  resetGeneration: () =>
    set({
      tailoredResume: null,
      fixedResume: null,
      createdResume: null,
      coverLetter: "",
      coverLetterMode: "templated",
      rewriteLocks: [],
      changes: [],
      error: null,
      atsResult: null,
      atsError: null,
      atsChecking: false,
      fixedAtsResult: null,
      fixedAtsChecking: false,
      resumeSuggestions: null,
      suggestError: null,
      suggestLoading: false,
    }),
  resetAll: () =>
    set({
      flow: "landing",
      step: 1,
      ...clearFlowState(),
    }),
}));
