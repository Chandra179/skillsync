import { Skill, ProficiencyLevel } from './store'

export interface UserContext {
  yearsOfExperience?: number
  currentRole?: string
  existingSkills?: string[]
  industry?: string
}

export interface SkillDependency {
  skillName: string
  dependencies: string[]
  description: string
  difficulty: number        // 1-10 scale (1 = beginner, 10 = expert)
  estimatedHours: number   // Estimated learning time
  enables: string[]        // Skills this skill unlocks/enables
  category: string         // Skill category for grouping
  source?: 'hardcoded' | 'llm' | 'algorithmic'  // Track data source
  analyzedAt?: Date        // When LLM analysis was done
}

export interface ConsistencyWarning {
  id: string
  type: 'missing_dependency' | 'proficiency_mismatch'
  skillName: string
  message: string
  suggestion: string
  severity: 'low' | 'medium' | 'high'
}

// Helper function to get all skills from flat array
function getAllSkills(skills: Skill[]): Skill[] {
  return skills
}

// Helper function to normalize skill names for comparison
function normalizeSkillName(name: string): string {
  return name.toLowerCase().trim()
}

// Helper function to check if a skill exists in the user's skill tree
function hasSkill(skills: Skill[], targetSkillName: string): { exists: boolean; skill?: Skill } {
  const normalizedTarget = normalizeSkillName(targetSkillName)
  const allSkills = getAllSkills(skills)
  
  const foundSkill = allSkills.find(skill => 
    normalizeSkillName(skill.name) === normalizedTarget
  )
  
  return {
    exists: !!foundSkill,
    skill: foundSkill
  }
}

// Helper function to check if a skill has meaningful proficiency
function hasMeaningfulProficiency(proficiency: ProficiencyLevel): boolean {
  return proficiency === 'Learning' || proficiency === 'Proficient' || proficiency === 'Mastered'
}

// Main validation function - now uses LLM analysis
export async function validateSkillConsistency(skills: Skill[], userContext?: UserContext): Promise<ConsistencyWarning[]> {
  return await validateSkillConsistencyEnhanced(skills, userContext)
}

// Helper function to get warnings for a specific skill
export async function getSkillWarnings(skills: Skill[], skillId: string, userContext?: UserContext): Promise<ConsistencyWarning[]> {
  const allWarnings = await validateSkillConsistency(skills, userContext)
  const targetSkill = getAllSkills(skills).find(s => s.id === skillId)
  
  if (!targetSkill) return []
  
  return allWarnings.filter(warning => warning.skillName === targetSkill.name)
}

// LLM-based skill analysis function
async function analyzeSkillWithLLM(skillName: string, userContext?: UserContext): Promise<SkillDependency> {
  try {
    const contextPrompt = userContext ? `
Context: User has ${userContext.yearsOfExperience || 'unknown'} years of experience as a ${userContext.currentRole || 'professional'}.
${userContext.existingSkills?.length ? `Existing skills: ${userContext.existingSkills.join(', ')}` : ''}
${userContext.industry ? `Industry: ${userContext.industry}` : ''}
` : ''

    const prompt = `Analyze the skill "${skillName}" and provide a structured response.${contextPrompt}

Please respond with a JSON object containing:
{
  "dependencies": ["prerequisite1", "prerequisite2"],
  "description": "Brief description of why these dependencies are needed",
  "difficulty": 5,
  "estimatedHours": 25,
  "enables": ["skill1", "skill2", "skill3"],
  "category": "category_name"
}

Guidelines:
- Dependencies: 1-4 prerequisite skills needed before learning this skill
- Difficulty: 1-10 scale (1=basic, 10=expert level)
- EstimatedHours: Realistic learning time for someone with prerequisites
- Enables: 2-5 skills this skill unlocks or makes easier to learn
- Category: business, technical, creative, analytical, management, communication, etc.

Be specific and practical. For non-technical skills, focus on business/professional context.`

    const response = await fetch('/api/analyze-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        skillName, 
        prompt,
        userContext 
      })
    })

    if (!response.ok) {
      throw new Error(`LLM analysis failed: ${response.statusText}`)
    }

    const analysis = await response.json()
    
    const skillDependency: SkillDependency = {
      skillName,
      dependencies: analysis.dependencies || [],
      description: analysis.description || `Analysis for ${skillName}`,
      difficulty: analysis.difficulty || 5,
      estimatedHours: analysis.estimatedHours || 20,
      enables: analysis.enables || [],
      category: analysis.category || 'general',
      source: 'llm',
      analyzedAt: new Date()
    }

    return skillDependency
  } catch (error) {
    console.error('LLM skill analysis failed:', error)
    
    // Fallback to basic structure
    return {
      skillName,
      dependencies: [],
      description: `${skillName} is a professional skill`,
      difficulty: 5,
      estimatedHours: 20,
      enables: [],
      category: 'general',
      source: 'llm',
      analyzedAt: new Date()
    }
  }
}

// Enhanced skill dependency lookup with LLM analysis
export async function getSkillDependencies(skillName: string, userContext?: UserContext): Promise<SkillDependency> {
  // Use LLM analysis for skill dependencies
  const llmAnalysis = await analyzeSkillWithLLM(skillName, userContext)
  
  return llmAnalysis
}

// Enhanced validation function using the new service
export async function validateSkillConsistencyEnhanced(skills: Skill[], userContext?: UserContext): Promise<ConsistencyWarning[]> {
  const warnings: ConsistencyWarning[] = []
  const allSkills = getAllSkills(skills)
  
  // Get user's existing skill names for context
  const existingSkillNames = allSkills.map(s => s.name)
  const contextWithSkills = { ...userContext, existingSkills: existingSkillNames }
  
  // Check each skill against dependency rules
  for (const skill of allSkills) {
    // Only check skills with meaningful proficiency
    if (!hasMeaningfulProficiency(skill.proficiency)) {
      continue
    }
    
    try {
      // Get dependencies using enhanced service
      const dependencyRule = await getSkillDependencies(skill.name, contextWithSkills)
      
      if (!dependencyRule.dependencies.length) {
        continue // No dependencies for this skill
      }
      
      // Check each dependency
      for (const dependency of dependencyRule.dependencies) {
        const { exists, skill: dependencySkill } = hasSkill(skills, dependency)
        
        if (!exists) {
          // Missing dependency entirely
          warnings.push({
            id: `${skill.id}-missing-${dependency.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'missing_dependency',
            skillName: skill.name,
            message: `You know ${skill.name} but don't have ${dependency} in your skills`,
            suggestion: `Consider adding ${dependency} to your skill tree as it's foundational for ${skill.name}`,
            severity: 'medium'
          })
        } else if (dependencySkill && !hasMeaningfulProficiency(dependencySkill.proficiency)) {
          // Has dependency but only as "Want to Learn"
          warnings.push({
            id: `${skill.id}-proficiency-${dependency.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'proficiency_mismatch',
            skillName: skill.name,
            message: `You're ${skill.proficiency.toLowerCase()} in ${skill.name} but only want to learn ${dependency}`,
            suggestion: `Consider updating your ${dependency} proficiency since it's foundational for ${skill.name}`,
            severity: 'low'
          })
        }
      }
    } catch (error) {
      console.error(`Failed to analyze dependencies for ${skill.name}:`, error)
      // Continue with other skills if one fails
    }
  }
  
  return warnings
}