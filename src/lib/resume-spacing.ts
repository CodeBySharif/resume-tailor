/** Body font size used for resume section content (ATS-friendly). */
export const RESUME_BODY_FONT_PT = 10;

/**
 * Spacing scale relative to body font (0.5 = half line, 1.0 = one line).
 * PDF: multiplied by RESUME_BODY_FONT_PT → 5pt / 10pt.
 * Web preview: use em units so gaps scale with 10pt body text.
 */
export const RESUME_SPACE_UNITS = {
  /** Below section header underline → first content line */
  afterHeader: 0.5,
  /** Below section content → next section header */
  afterSection: 1.0,
  /** Between content blocks within a section */
  betweenContent: 0.5,
} as const;

export const RESUME_SPACE_PT = {
  afterHeader: RESUME_SPACE_UNITS.afterHeader * RESUME_BODY_FONT_PT,
  afterSection: RESUME_SPACE_UNITS.afterSection * RESUME_BODY_FONT_PT,
  betweenContent: RESUME_SPACE_UNITS.betweenContent * RESUME_BODY_FONT_PT,
} as const;

export const RESUME_SPACE_EM = {
  afterHeader: `${RESUME_SPACE_UNITS.afterHeader}em`,
  afterSection: `${RESUME_SPACE_UNITS.afterSection}em`,
  betweenContent: `${RESUME_SPACE_UNITS.betweenContent}em`,
} as const;
