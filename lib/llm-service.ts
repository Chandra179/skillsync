interface EvaluationScore {
  clarity: number;
  coverage: number;
  depth: number;
  misconceptions: number;
  feedback: string;
  totalScore: number;
}

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class LLMService {
  private baseUrl = 'http://192.168.1.4:1234/v1';

  async evaluateExplanation(
    topic: string, 
    userExplanation: string,
    skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<EvaluationScore> {
    const prompt = this.buildEvaluationPrompt(topic, userExplanation, skillLevel);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-8b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert technical evaluator. Provide scores and feedback in valid JSON format only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const data: LLMResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from LLM');
      }

      return this.parseEvaluationResponse(content);
    } catch (error) {
      console.error('LLM evaluation error:', error);
      return this.getFallbackScore();
    }
  }

  private buildEvaluationPrompt(topic: string, explanation: string, level: string): string {
    const rubric = this.getRubricForTopic(topic);
    
    return `Evaluate this ${level}-level explanation of "${topic}":

EXPLANATION TO EVALUATE:
"${explanation}"

EVALUATION CRITERIA:
${rubric}

SCORING SCALE: 0-25 points each category (0=poor, 25=excellent)

Return ONLY valid JSON in this exact format:
{
  "clarity": <score>,
  "coverage": <score>, 
  "depth": <score>,
  "misconceptions": <score>,
  "feedback": "<brief constructive feedback>",
  "totalScore": <sum of all scores>
}`;
  }

  private getRubricForTopic(topic: string): string {
    const rubrics: Record<string, string> = {
      'goroutines': `
CLARITY (0-25):
- Clear explanation of what goroutines are
- Well-structured explanation with logical flow
- Proper use of technical terminology

COVERAGE (0-25):
- Explains goroutines vs threads
- Covers mutex vs channel usage scenarios
- Mentions Go scheduler and lightweight nature

DEPTH (0-25):
- Provides concrete examples or code snippets
- Explains performance implications
- Discusses common patterns and best practices

MISCONCEPTIONS (0-25):
- Correctly explains concurrency vs parallelism
- Avoids common pitfalls (shared memory issues)
- Accurate technical details`,

      'docker': `
CLARITY (0-25):
- Clear explanation of containerization concepts
- Well-organized explanation structure
- Appropriate technical vocabulary

COVERAGE (0-25):
- Covers key Docker concepts (images, containers, Dockerfile)
- Explains benefits and use cases
- Mentions container orchestration basics

DEPTH (0-25):
- Provides practical examples
- Discusses best practices
- Covers networking and volume concepts

MISCONCEPTIONS (0-25):
- Correctly distinguishes containers from VMs
- Accurate security considerations
- Proper understanding of layered architecture`,

      'default': `
CLARITY (0-25): Clear, well-structured explanation with proper terminology
COVERAGE (0-25): Addresses key concepts and use cases comprehensively  
DEPTH (0-25): Provides examples, best practices, and technical details
MISCONCEPTIONS (0-25): Technically accurate with no major errors`
    };

    return rubrics[topic.toLowerCase()] || rubrics.default;
  }

  private parseEvaluationResponse(content: string): EvaluationScore {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize scores
      const clarity = Math.max(0, Math.min(25, parsed.clarity || 0));
      const coverage = Math.max(0, Math.min(25, parsed.coverage || 0));
      const depth = Math.max(0, Math.min(25, parsed.depth || 0));
      const misconceptions = Math.max(0, Math.min(25, parsed.misconceptions || 0));
      
      return {
        clarity,
        coverage,
        depth,
        misconceptions,
        feedback: parsed.feedback || 'No feedback provided',
        totalScore: clarity + coverage + depth + misconceptions
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return this.getFallbackScore();
    }
  }

  private getFallbackScore(): EvaluationScore {
    return {
      clarity: 10,
      coverage: 10,
      depth: 10,
      misconceptions: 10,
      feedback: 'Unable to evaluate at this time. Please try again.',
      totalScore: 40
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const llmService = new LLMService();
export type { EvaluationScore };