import { Skill, ProficiencyLevel } from './store'

export interface SkillDependency {
  skillName: string
  dependencies: string[]
  description: string
}

export interface ConsistencyWarning {
  id: string
  type: 'missing_dependency' | 'proficiency_mismatch'
  skillName: string
  message: string
  suggestion: string
  severity: 'low' | 'medium' | 'high'
}

// Define skill dependencies - skills that typically require knowledge of other skills
export const SKILL_DEPENDENCIES: SkillDependency[] = [
  {
    skillName: 'Kubernetes',
    dependencies: ['Docker', 'Linux', 'YAML'],
    description: 'Kubernetes orchestrates containers, requiring Docker knowledge'
  },
  {
    skillName: 'Docker Compose',
    dependencies: ['Docker'],
    description: 'Docker Compose builds on basic Docker concepts'
  },
  {
    skillName: 'Microservices',
    dependencies: ['API Design', 'HTTP'],
    description: 'Microservices architecture requires API and HTTP knowledge'
  },
  {
    skillName: 'GraphQL',
    dependencies: ['HTTP', 'API Design'],
    description: 'GraphQL is an API technology requiring HTTP understanding'
  },
  {
    skillName: 'React Native',
    dependencies: ['React', 'JavaScript'],
    description: 'React Native extends React concepts to mobile development'
  },
  {
    skillName: 'Next.js',
    dependencies: ['React', 'JavaScript', 'Node.js'],
    description: 'Next.js is a React framework requiring React and Node.js knowledge'
  },
  {
    skillName: 'TypeScript',
    dependencies: ['JavaScript'],
    description: 'TypeScript builds on JavaScript fundamentals'
  },
  {
    skillName: 'Node.js',
    dependencies: ['JavaScript'],
    description: 'Node.js runs JavaScript on the server'
  },
  {
    skillName: 'Express.js',
    dependencies: ['Node.js', 'JavaScript', 'HTTP'],
    description: 'Express.js is a Node.js web framework'
  },
  {
    skillName: 'MongoDB',
    dependencies: ['Database Design', 'JSON'],
    description: 'MongoDB is a NoSQL database requiring database concepts'
  },
  {
    skillName: 'PostgreSQL',
    dependencies: ['SQL', 'Database Design'],
    description: 'PostgreSQL requires SQL and database design knowledge'
  },
  {
    skillName: 'Redis',
    dependencies: ['Database Design', 'Caching'],
    description: 'Redis is an in-memory database used for caching'
  },
  {
    skillName: 'AWS Lambda',
    dependencies: ['Cloud Computing', 'Serverless'],
    description: 'Lambda is a serverless compute service requiring cloud knowledge'
  },
  {
    skillName: 'Terraform',
    dependencies: ['Cloud Computing', 'Infrastructure as Code'],
    description: 'Terraform requires cloud and IaC understanding'
  },
  {
    skillName: 'Ansible',
    dependencies: ['Linux', 'Configuration Management'],
    description: 'Ansible automates configuration management on Linux systems'
  },
  {
    skillName: 'Jenkins',
    dependencies: ['CI/CD', 'Linux'],
    description: 'Jenkins is a CI/CD tool typically running on Linux'
  },
  {
    skillName: 'Git',
    dependencies: ['Version Control'],
    description: 'Git is a version control system'
  }
]

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

// Main validation function
export function validateSkillConsistency(skills: Skill[]): ConsistencyWarning[] {
  const warnings: ConsistencyWarning[] = []
  const allSkills = getAllSkills(skills)
  
  // Check each skill against dependency rules
  for (const skill of allSkills) {
    // Only check skills with meaningful proficiency
    if (!hasMeaningfulProficiency(skill.proficiency)) {
      continue
    }
    
    // Find dependency rule for this skill
    const dependencyRule = SKILL_DEPENDENCIES.find(rule => 
      normalizeSkillName(rule.skillName) === normalizeSkillName(skill.name)
    )
    
    if (!dependencyRule) {
      continue // No dependency rules for this skill
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
  }
  
  return warnings
}

// Helper function to get warnings for a specific skill
export function getSkillWarnings(skills: Skill[], skillId: string): ConsistencyWarning[] {
  const allWarnings = validateSkillConsistency(skills)
  const targetSkill = getAllSkills(skills).find(s => s.id === skillId)
  
  if (!targetSkill) return []
  
  return allWarnings.filter(warning => warning.skillName === targetSkill.name)
}