import { Skill } from './store'
import { SKILL_DEPENDENCIES, UserContext, getSkillDependencies } from './skill-dependencies'

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
 * Discover missing prerequisite skills using hybrid approach
 */
export async function discoverMissingSkillsFromHybrid(skills: Skill[], userContext?: UserContext): Promise<MissingSkill[]> {
  const missingSkills: MissingSkill[] = []
  const allSkills = getAllSkillsFlat(skills)
  const skillNames = allSkills.map(s => s.name.toLowerCase())
  
  // Check each skill for missing prerequisites using hybrid system
  for (const skill of allSkills) {
    if (skill.proficiency === 'Want to Learn') continue
    
    try {
      // Use the new hybrid dependency system
      const dependencyData = await getSkillDependencies(skill.name, userContext)
      
      if (!dependencyData.dependencies.length) continue
      
      // Check each dependency
      for (const dependency of dependencyData.dependencies) {
        const hasPrerequisite = skillNames.some(name => 
          name === dependency.toLowerCase() ||
          name.includes(dependency.toLowerCase()) ||
          dependency.toLowerCase().includes(name)
        )
        
        if (!hasPrerequisite) {
          missingSkills.push({
            id: `hybrid-${skill.id}-${dependency.toLowerCase().replace(/\s+/g, '-')}`,
            name: dependency,
            reason: `Required for ${skill.name} - ${dependencyData.description}`,
            confidence: dependencyData.source === 'algorithmic' ? 'high' : 'medium',
            source: 'hybrid',
            parentSkill: skill.name,
            category: dependencyData.category || getCategoryForSkill(dependency)
          })
        }
      }
    } catch (error) {
      console.error(`Failed to get dependencies for ${skill.name}:`, error)
      // Continue with other skills
    }
  }
  
  return removeDuplicateMissingSkills(missingSkills)
}

/**
 * Discover missing prerequisite skills using rule-based approach (legacy)
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
    const llmResults: Array<{name: string; reason: string; confidence: string; category: string}> = Array.isArray(data.suggestions) ? data.suggestions : []
    
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
 * Enhanced hybrid approach using new skill dependency system
 */
export async function discoverMissingSkillsEnhanced(
  skills: Skill[], 
  userContext: UserContext
): Promise<MissingSkill[]> {
  try {
    // Use the new hybrid approach directly
    return await discoverMissingSkillsFromHybrid(skills, userContext)
  } catch (error) {
    console.error('Error in enhanced missing skills discovery:', error)
    // Fallback to rule-based approach
    return discoverMissingSkillsFromRules(skills)
  }
}

/**
 * Helper function to get all skills in a flat array
 */
function getAllSkillsFlat(skills: Skill[]): Skill[] {
  return skills
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

