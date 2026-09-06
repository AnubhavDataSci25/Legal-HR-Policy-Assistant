/**
 * Shared UI constants. Keeping the motion scale here means every
 * component references the same three timing tiers instead of
 * inventing new durations ad hoc.
 */

export const MOTION = {
  micro: 0.15,      // button press/hover feedback -- 150ms
  standard: 0.22,   // message entrance, badges -- 220ms
  panel: 0.28,      // drawer/panel open-close -- 280ms
};

export const EASE = [0.4, 0, 0.2, 1]; // matches Tailwind's "smooth" easing

export const SUGGESTED_PROMPTS = [
  "Summarize the key policies in this document",
  "Find a specific clause",
  "What are the notice period requirements?",
];

export const MAX_QUESTION_LENGTH = 1000;