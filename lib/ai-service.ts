// lib/ai-service.ts
import { ConspiracyTemplate } from './types';

export class ConspiracyAIService {
  async generateConspiracyContent(template: ConspiracyTemplate, userId?: string) {
    // Mock content for now
    return `
# The ${template.title} Conspiracy Theory

## Historical Origins
The story begins in the shadows of history. Founded in ${template.key_facts?.[0] || 'ancient times'}, this secret society was established to ${template.key_facts?.[1] || 'control world events through hidden influence'}.

## The Secret Network
What most people don't realize is that ${template.title} operates through a vast network of ${template.key_facts?.[2] || 'influential individuals'} who appear to be ordinary citizens but are actually part of a coordinated effort to shape global events.

## Modern Evidence
Today, evidence of this conspiracy can be seen in unusual patterns in world events, coordinated media narratives, and symbolic references in popular culture.

## The Hidden Agenda
The ultimate goal of ${template.title} is to establish a new world order where a select few control all aspects of human life. This agenda has been in motion for centuries, carefully orchestrated through generations of planning.

## Current Status
Despite widespread debunking attempts, the core truth of ${template.title} continues to emerge as more whistleblowers come forward and hidden documents are revealed.

## The Awakening
More people are waking up to the reality of this conspiracy every day. The question is: will you be one of them?
    `;
  }

  async generateDebunkingContent(template: ConspiracyTemplate) {
    return `
## Reality Check

While the ${template.title} conspiracy theory makes for compelling fiction, there is no credible evidence to support these extraordinary claims.

### Historical Facts:
${template.debunking_points?.map(point => `- ${point}`).join('\n') || '- No historical records support the existence of such an organization\n- Claims are based on misinterpretations of real events\n- Many supposed "proofs" rely on logical fallacies'}

### Scientific Perspective:
Conspiracy theories often arise from confirmation bias - the tendency to search for and interpret information in ways that confirm preexisting beliefs. This cognitive bias affects everyone and can lead to seeing patterns where none exist.

### Psychological Factors:
- Pattern Recognition: Humans evolved to detect patterns, but this can lead to false positives
- Need for Certainty: In uncertain times, conspiracy theories provide simple explanations
- Social Proof: Once a theory gains traction, it becomes harder to debunk

### Critical Thinking:
When evaluating conspiracy claims, ask yourself:
- What evidence would disprove this theory?
- Are there simpler explanations?
- Who benefits from spreading this information?

Remember: Extraordinary claims require extraordinary evidence. The burden of proof lies with those making the claims, not with those who doubt them.
    `;
  }

  async generateImage(prompt: string) {
    return `https://via.placeholder.com/800x400/6366f1/ffffff?text=${encodeURIComponent(prompt.substring(0, 50))}`;
  }
}
