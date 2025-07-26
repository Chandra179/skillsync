import { Skill } from './store'
import { SKILL_DEPENDENCIES } from './skill-dependencies'

export interface MissingSkill {
  id: string
  name: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  source: 'rules' | 'llm' | 'hybrid'
  parentSkill: string
  category?: string
}

export interface SkillAnalysisRequest {
  skillName: string
  userExperience: number
  currentRole: string
  existingSkills: string[]
}

/**
 * Discover missing prerequisite skills using rule-based approach
 */
export function discoverMissingSkillsFromRules(skills: Skill[]): MissingSkill[] {
  const missingSkills: MissingSkill[] = []
  const allSkills = getAllSkillsFlat(skills)
  const skillNames = allSkills.map(s => s.name.toLowerCase())
  
  // Check each skill for missing prerequisites
  for (const skill of allSkills) {
    if (skill.proficiency === 'Want to Learn') continue
    
    const dependencyRule = SKILL_DEPENDENCIES.find(rule => 
      rule.skillName.toLowerCase() === skill.name.toLowerCase()
    )
    
    if (!dependencyRule) continue
    
    // Check each dependency
    for (const dependency of dependencyRule.dependencies) {
      const hasPrerequisite = skillNames.some(name => 
        name === dependency.toLowerCase() ||
        name.includes(dependency.toLowerCase()) ||
        dependency.toLowerCase().includes(name)
      )
      
      if (!hasPrerequisite) {
        missingSkills.push({
          id: `rule-${skill.id}-${dependency.toLowerCase().replace(/\s+/g, '-')}`,
          name: dependency,
          reason: `Required for ${skill.name} - ${dependencyRule.description}`,
          confidence: 'high',
          source: 'rules',
          parentSkill: skill.name,
          category: getCategoryForSkill(dependency)
        })
      }
    }
  }
  
  return removeDuplicateMissingSkills(missingSkills)
}

/**
 * Analyze skill using LLM to discover missing prerequisites
 */
export async function analyzeSkillWithLLM(request: SkillAnalysisRequest): Promise<MissingSkill[]> {
  try {
    // Use the API endpoint for client-side calls
    const response = await fetch('/api/analyze-skill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        skillName: request.skillName,
        userContext: {
          experience: request.userExperience,
          role: request.currentRole,
          existingSkills: request.existingSkills
        }
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to analyze skill with LLM')
    }
    
    const data = await response.json()
    const llmResults: any[] = Array.isArray(data.suggestions) ? data.suggestions : []
    
    return llmResults.map((result, index) => ({
      id: `llm-${request.skillName.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      name: result.name,
      reason: result.reason,
      confidence: result.confidence as 'high' | 'medium' | 'low',
      source: 'llm',
      parentSkill: request.skillName,
      category: result.category
    }))
    
  } catch (error) {
    console.error('Error analyzing skill with LLM:', error)
    return []
  }
}

/**
 * Hybrid approach: combine rule-based and LLM analysis
 */
export async function discoverMissingSkillsHybrid(
  skills: Skill[], 
  userExperience: number, 
  currentRole: string
): Promise<MissingSkill[]> {
  const allSkills = getAllSkillsFlat(skills)
  const skillNames = allSkills.map(s => s.name)
  
  // Get rule-based suggestions
  const ruleBased = discoverMissingSkillsFromRules(skills)
  
  // Get LLM analysis for complex skills
  const complexSkills = allSkills.filter(skill => 
    skill.proficiency !== 'Want to Learn' && 
    isComplexSkill(skill.name)
  )
  
  const llmPromises = complexSkills.slice(0, 3).map(skill => // Limit to 3 to avoid API costs
    analyzeSkillWithLLM({
      skillName: skill.name,
      userExperience,
      currentRole,
      existingSkills: skillNames
    })
  )
  
  const llmResults = await Promise.all(llmPromises)
  const allLlmSuggestions = llmResults.flat()
  
  // Combine and validate suggestions
  const combined = [...ruleBased, ...allLlmSuggestions]
  const validated = validateMissingSuggestions(combined, skillNames)
  
  // Mark hybrid confidence for overlapping suggestions
  const final = markHybridConfidence(validated)
  
  return removeDuplicateMissingSkills(final).slice(0, 10) // Limit to top 10
}

/**
 * Helper function to get all skills in a flat array
 */
function getAllSkillsFlat(skills: Skill[]): Skill[] {
  return skills
}

/**
 * Check if a skill is considered complex (worth LLM analysis)
 */
function isComplexSkill(skillName: string): boolean {
  const complexSkillKeywords = [
    'kubernetes', 'docker', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
    'microservices', 'devops', 'ci/cd', 'machine learning', 'ai', 'blockchain',
    'react', 'vue', 'angular', 'next.js', 'django', 'spring', 'express',
    'postgresql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'rabbitmq'
  ]
  
  const lowerSkillName = skillName.toLowerCase()
  return complexSkillKeywords.some(keyword => 
    lowerSkillName.includes(keyword) || keyword.includes(lowerSkillName)
  )
}

/**
 * Validate that missing skill suggestions are not already in user's skill tree
 */
function validateMissingSuggestions(suggestions: MissingSkill[], existingSkills: string[]): MissingSkill[] {
  const existingLower = existingSkills.map(s => s.toLowerCase())
  
  return suggestions.filter(suggestion => {
    const suggestionLower = suggestion.name.toLowerCase()
    return !existingLower.some(existing => 
      existing === suggestionLower ||
      existing.includes(suggestionLower) ||
      suggestionLower.includes(existing)
    )
  })
}

/**
 * Mark suggestions that appear in both rules and LLM as hybrid with higher confidence
 */
function markHybridConfidence(suggestions: MissingSkill[]): MissingSkill[] {
  const ruleSkills = suggestions.filter(s => s.source === 'rules')
  const llmSkills = suggestions.filter(s => s.source === 'llm')
  
  return suggestions.map(suggestion => {
    if (suggestion.source === 'rules') {
      // Check if LLM also suggested this skill
      const llmMatch = llmSkills.find(llm => 
        llm.name.toLowerCase() === suggestion.name.toLowerCase()
      )
      
      if (llmMatch) {
        return {
          ...suggestion,
          source: 'hybrid' as const,
          confidence: 'high' as const,
          reason: `${suggestion.reason} (Confirmed by AI analysis)`
        }
      }
    }
    
    return suggestion
  })
}

/**
 * Remove duplicate missing skills based on name similarity
 */
function removeDuplicateMissingSkills(skills: MissingSkill[]): MissingSkill[] {
  const seen = new Set<string>()
  const unique: MissingSkill[] = []
  
  for (const skill of skills) {
    const normalizedName = skill.name.toLowerCase().trim()
    if (!seen.has(normalizedName)) {
      seen.add(normalizedName)
      unique.push(skill)
    }
  }
  
  return unique.sort((a, b) => {
    // Sort by confidence (high > medium > low) then by source (hybrid > rules > llm)
    const confidenceOrder = { high: 3, medium: 2, low: 1 }
    const sourceOrder = { hybrid: 3, rules: 2, llm: 1 }
    
    if (a.confidence !== b.confidence) {
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
    }
    
    return sourceOrder[b.source] - sourceOrder[a.source]
  })
}

/**
 * Get category for a skill name
 */
function getCategoryForSkill(skillName: string): string {
  const skillLower = skillName.toLowerCase()
  
  const categories = {
    programming: ['javascript', 'python', 'java', 'go', 'rust', 'typescript', 'c++', 'c#'],
    infrastructure: ['linux', 'networking', 'virtualization', 'cloud', 'vm'],
    devops: ['docker', 'kubernetes', 'ci/cd', 'ansible', 'terraform', 'jenkins'],
    database: ['sql', 'postgresql', 'mongodb', 'redis', 'database'],
    security: ['oauth', 'jwt', 'authentication', 'encryption', 'security'],
    networking: ['http', 'https', 'tcp', 'networking', 'dns', 'load balancing']
  }
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => skillLower.includes(keyword))) {
      return category
    }
  }
  
  return 'other'
}