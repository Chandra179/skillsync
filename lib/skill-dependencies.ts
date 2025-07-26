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
  source?: 'hardcoded' | 'llm' | 'cache' | 'algorithmic'  // Track data source
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

// In-memory cache for LLM analyzed skills
const skillAnalysisCache = new Map<string, SkillDependency>()

// Define skill dependencies - skills that typically require knowledge of other skills
export const SKILL_DEPENDENCIES: SkillDependency[] = [
  {
    skillName: 'Kubernetes',
    dependencies: ['Docker', 'Linux', 'YAML'],
    description: 'Kubernetes orchestrates containers, requiring Docker knowledge',
    difficulty: 8,
    estimatedHours: 60,
    enables: ['Helm', 'Istio', 'Docker Swarm', 'Container Orchestration'],
    category: 'devops'
  },
  {
    skillName: 'Docker Compose',
    dependencies: ['Docker'],
    description: 'Docker Compose builds on basic Docker concepts',
    difficulty: 5,
    estimatedHours: 15,
    enables: ['Multi-container Applications', 'Development Environments'],
    category: 'devops'
  },
  {
    skillName: 'Microservices',
    dependencies: ['API Design', 'HTTP'],
    description: 'Microservices architecture requires API and HTTP knowledge',
    difficulty: 7,
    estimatedHours: 40,
    enables: ['Service Mesh', 'Event-Driven Architecture', 'Domain-Driven Design'],
    category: 'architecture'
  },
  {
    skillName: 'GraphQL',
    dependencies: ['HTTP', 'API Design'],
    description: 'GraphQL is an API technology requiring HTTP understanding',
    difficulty: 6,
    estimatedHours: 25,
    enables: ['Apollo', 'Relay', 'GraphQL Subscriptions'],
    category: 'api'
  },
  {
    skillName: 'React Native',
    dependencies: ['React', 'JavaScript'],
    description: 'React Native extends React concepts to mobile development',
    difficulty: 7,
    estimatedHours: 50,
    enables: ['Expo', 'Mobile App Development', 'Cross-platform Development'],
    category: 'mobile'
  },
  {
    skillName: 'Next.js',
    dependencies: ['React', 'JavaScript', 'Node.js'],
    description: 'Next.js is a React framework requiring React and Node.js knowledge',
    difficulty: 6,
    estimatedHours: 30,
    enables: ['Server-Side Rendering', 'Static Site Generation', 'Vercel'],
    category: 'frontend'
  },
  {
    skillName: 'TypeScript',
    dependencies: ['JavaScript'],
    description: 'TypeScript builds on JavaScript fundamentals',
    difficulty: 5,
    estimatedHours: 20,
    enables: ['Angular', 'Strict Type Checking', 'Advanced JavaScript'],
    category: 'programming'
  },
  {
    skillName: 'Node.js',
    dependencies: ['JavaScript'],
    description: 'Node.js runs JavaScript on the server',
    difficulty: 4,
    estimatedHours: 25,
    enables: ['Express.js', 'NestJS', 'Server-side JavaScript'],
    category: 'backend'
  },
  {
    skillName: 'Express.js',
    dependencies: ['Node.js', 'JavaScript', 'HTTP'],
    description: 'Express.js is a Node.js web framework',
    difficulty: 4,
    estimatedHours: 20,
    enables: ['REST APIs', 'Web Applications', 'Middleware'],
    category: 'backend'
  },
  {
    skillName: 'MongoDB',
    dependencies: ['Database Design', 'JSON'],
    description: 'MongoDB is a NoSQL database requiring database concepts',
    difficulty: 5,
    estimatedHours: 30,
    enables: ['Mongoose', 'Aggregation Pipelines', 'NoSQL Design'],
    category: 'database'
  },
  {
    skillName: 'PostgreSQL',
    dependencies: ['SQL', 'Database Design'],
    description: 'PostgreSQL requires SQL and database design knowledge',
    difficulty: 6,
    estimatedHours: 35,
    enables: ['Advanced SQL', 'Database Administration', 'Data Analytics'],
    category: 'database'
  },
  {
    skillName: 'Redis',
    dependencies: ['Database Design', 'Caching'],
    description: 'Redis is an in-memory database used for caching',
    difficulty: 4,
    estimatedHours: 15,
    enables: ['Session Management', 'Message Queues', 'Real-time Applications'],
    category: 'database'
  },
  {
    skillName: 'AWS Lambda',
    dependencies: ['Cloud Computing', 'Serverless'],
    description: 'Lambda is a serverless compute service requiring cloud knowledge',
    difficulty: 6,
    estimatedHours: 25,
    enables: ['Serverless Architecture', 'Event-driven Computing', 'AWS Services'],
    category: 'cloud'
  },
  {
    skillName: 'Terraform',
    dependencies: ['Cloud Computing', 'Infrastructure as Code'],
    description: 'Terraform requires cloud and IaC understanding',
    difficulty: 7,
    estimatedHours: 40,
    enables: ['Infrastructure Automation', 'Multi-cloud Deployments', 'DevOps'],
    category: 'infrastructure'
  },
  {
    skillName: 'Ansible',
    dependencies: ['Linux', 'Configuration Management'],
    description: 'Ansible automates configuration management on Linux systems',
    difficulty: 6,
    estimatedHours: 30,
    enables: ['Infrastructure Automation', 'Server Configuration', 'DevOps'],
    category: 'infrastructure'
  },
  {
    skillName: 'Jenkins',
    dependencies: ['CI/CD', 'Linux'],
    description: 'Jenkins is a CI/CD tool typically running on Linux',
    difficulty: 5,
    estimatedHours: 25,
    enables: ['Build Automation', 'Deployment Pipelines', 'DevOps'],
    category: 'devops'
  },
  {
    skillName: 'Git',
    dependencies: ['Version Control'],
    description: 'Git is a version control system',
    difficulty: 3,
    estimatedHours: 15,
    enables: ['GitHub', 'GitLab', 'Collaborative Development'],
    category: 'tools'
  },
  {
    skillName: 'Docker',
    dependencies: ['Linux', 'Containerization'],
    description: 'Docker enables application containerization',
    difficulty: 5,
    estimatedHours: 25,
    enables: ['Kubernetes', 'Docker Compose', 'Container Orchestration'],
    category: 'devops'
  },
  {
    skillName: 'React',
    dependencies: ['JavaScript', 'HTML', 'CSS'],
    description: 'React is a JavaScript library for building user interfaces',
    difficulty: 6,
    estimatedHours: 40,
    enables: ['Next.js', 'React Native', 'Redux', 'Component Libraries'],
    category: 'frontend'
  },
  {
    skillName: 'JavaScript',
    dependencies: ['HTML', 'CSS'],
    description: 'JavaScript is the programming language of the web',
    difficulty: 4,
    estimatedHours: 50,
    enables: ['TypeScript', 'Node.js', 'React', 'Vue.js', 'Angular'],
    category: 'programming'
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

// Cache management functions
function getCachedSkillAnalysis(skillName: string): SkillDependency | null {
  const normalizedName = normalizeSkillName(skillName)
  return skillAnalysisCache.get(normalizedName) || null
}

function cacheSkillAnalysis(skillName: string, analysis: SkillDependency): void {
  const normalizedName = normalizeSkillName(skillName)
  skillAnalysisCache.set(normalizedName, analysis)
}

// Algorithmic pattern matching for common skill dependencies
function getAlgorithmicDependencies(skillName: string): SkillDependency | null {
  const normalized = normalizeSkillName(skillName)
  
  // Framework patterns
  if (normalized.includes('react native')) {
    return createSkillDependency(skillName, ['React', 'JavaScript', 'Mobile Development'], 'React Native extends React for mobile apps', 7, 50, ['Expo', 'Mobile App Development'], 'mobile')
  }
  if (normalized.includes('react') && !normalized.includes('native')) {
    return createSkillDependency(skillName, ['JavaScript', 'HTML', 'CSS'], 'React is a JavaScript library for building UIs', 6, 40, ['Next.js', 'React Native', 'Redux'], 'frontend')
  }
  if (normalized.includes('vue')) {
    return createSkillDependency(skillName, ['JavaScript', 'HTML', 'CSS'], 'Vue.js is a progressive JavaScript framework', 5, 35, ['Nuxt.js', 'Vuex', 'Vue Router'], 'frontend')
  }
  if (normalized.includes('angular')) {
    return createSkillDependency(skillName, ['TypeScript', 'JavaScript', 'HTML', 'CSS'], 'Angular is a TypeScript-based web framework', 7, 45, ['RxJS', 'Angular Material', 'NgRx'], 'frontend')
  }
  if (normalized.includes('next.js') || normalized.includes('nextjs')) {
    return createSkillDependency(skillName, ['React', 'JavaScript', 'Node.js'], 'Next.js is a React framework with SSR capabilities', 6, 30, ['Vercel', 'Server-Side Rendering'], 'frontend')
  }
  
  // Backend frameworks
  if (normalized.includes('express')) {
    return createSkillDependency(skillName, ['Node.js', 'JavaScript', 'HTTP'], 'Express.js is a Node.js web framework', 4, 20, ['REST APIs', 'Middleware'], 'backend')
  }
  if (normalized.includes('django')) {
    return createSkillDependency(skillName, ['Python', 'HTTP', 'Database Design'], 'Django is a Python web framework', 6, 35, ['Django REST Framework', 'PostgreSQL'], 'backend')
  }
  if (normalized.includes('flask')) {
    return createSkillDependency(skillName, ['Python', 'HTTP'], 'Flask is a lightweight Python web framework', 4, 20, ['REST APIs', 'Jinja2'], 'backend')
  }
  if (normalized.includes('spring')) {
    return createSkillDependency(skillName, ['Java', 'HTTP', 'Database Design'], 'Spring is a Java application framework', 7, 40, ['Spring Boot', 'Microservices'], 'backend')
  }
  
  // DevOps and Infrastructure
  if (normalized.includes('kubernetes') || normalized.includes('k8s')) {
    return createSkillDependency(skillName, ['Docker', 'Linux', 'YAML', 'Containerization'], 'Kubernetes orchestrates containerized applications', 8, 60, ['Helm', 'Istio', 'Container Orchestration'], 'devops')
  }
  if (normalized.includes('docker')) {
    return createSkillDependency(skillName, ['Linux', 'Containerization'], 'Docker enables application containerization', 5, 25, ['Kubernetes', 'Docker Compose'], 'devops')
  }
  if (normalized.includes('terraform')) {
    return createSkillDependency(skillName, ['Cloud Computing', 'Infrastructure as Code'], 'Terraform manages infrastructure through code', 7, 40, ['AWS', 'Multi-cloud'], 'infrastructure')
  }
  if (normalized.includes('ansible')) {
    return createSkillDependency(skillName, ['Linux', 'YAML', 'Configuration Management'], 'Ansible automates configuration management', 6, 30, ['Infrastructure Automation'], 'infrastructure')
  }
  
  // Cloud platforms
  if (normalized.includes('aws') && !normalized.includes('lambda')) {
    return createSkillDependency(skillName, ['Cloud Computing'], 'Amazon Web Services cloud platform', 6, 50, ['AWS Lambda', 'EC2', 'S3'], 'cloud')
  }
  if (normalized.includes('aws lambda')) {
    return createSkillDependency(skillName, ['AWS', 'Serverless', 'Cloud Computing'], 'AWS Lambda serverless computing service', 6, 25, ['Serverless Architecture'], 'cloud')
  }
  if (normalized.includes('azure')) {
    return createSkillDependency(skillName, ['Cloud Computing'], 'Microsoft Azure cloud platform', 6, 50, ['Azure Functions', 'Azure DevOps'], 'cloud')
  }
  if (normalized.includes('gcp') || normalized.includes('google cloud')) {
    return createSkillDependency(skillName, ['Cloud Computing'], 'Google Cloud Platform', 6, 50, ['Google App Engine', 'BigQuery'], 'cloud')
  }
  
  // Databases
  if (normalized.includes('postgresql') || normalized.includes('postgres')) {
    return createSkillDependency(skillName, ['SQL', 'Database Design'], 'PostgreSQL is an advanced relational database', 6, 35, ['Advanced SQL', 'Database Administration'], 'database')
  }
  if (normalized.includes('mongodb') || normalized.includes('mongo')) {
    return createSkillDependency(skillName, ['Database Design', 'JSON', 'NoSQL'], 'MongoDB is a document-based NoSQL database', 5, 30, ['Mongoose', 'Aggregation Pipelines'], 'database')
  }
  if (normalized.includes('redis')) {
    return createSkillDependency(skillName, ['Database Design', 'Caching'], 'Redis is an in-memory data structure store', 4, 15, ['Session Management', 'Message Queues'], 'database')
  }
  if (normalized.includes('mysql')) {
    return createSkillDependency(skillName, ['SQL', 'Database Design'], 'MySQL is a popular relational database', 5, 30, ['Database Administration', 'Replication'], 'database')
  }
  
  // Programming languages
  if (normalized.includes('typescript')) {
    return createSkillDependency(skillName, ['JavaScript'], 'TypeScript adds static typing to JavaScript', 5, 20, ['Angular', 'Strict Type Checking'], 'programming')
  }
  if (normalized.includes('node.js') || normalized.includes('nodejs')) {
    return createSkillDependency(skillName, ['JavaScript'], 'Node.js runs JavaScript on the server', 4, 25, ['Express.js', 'NPM'], 'backend')
  }
  if (normalized.includes('python')) {
    return createSkillDependency(skillName, ['Programming Fundamentals'], 'Python is a versatile programming language', 3, 40, ['Django', 'Flask', 'Data Science'], 'programming')
  }
  if (normalized.includes('java') && !normalized.includes('javascript')) {
    return createSkillDependency(skillName, ['Programming Fundamentals', 'Object-Oriented Programming'], 'Java is an object-oriented programming language', 5, 50, ['Spring', 'Android Development'], 'programming')
  }
  if (normalized.includes('go') || normalized.includes('golang')) {
    return createSkillDependency(skillName, ['Programming Fundamentals'], 'Go is a statically typed programming language', 5, 35, ['Microservices', 'Concurrency'], 'programming')
  }
  
  // Mobile development
  if (normalized.includes('ios') || normalized.includes('swift')) {
    return createSkillDependency(skillName, ['Programming Fundamentals', 'Mobile Development'], 'iOS development with Swift', 6, 60, ['App Store', 'UIKit'], 'mobile')
  }
  if (normalized.includes('android') || normalized.includes('kotlin')) {
    return createSkillDependency(skillName, ['Programming Fundamentals', 'Mobile Development'], 'Android development', 6, 60, ['Google Play', 'Android SDK'], 'mobile')
  }
  if (normalized.includes('flutter')) {
    return createSkillDependency(skillName, ['Dart', 'Mobile Development'], 'Flutter cross-platform mobile framework', 6, 45, ['Cross-platform Development'], 'mobile')
  }
  
  // Testing
  if (normalized.includes('jest')) {
    return createSkillDependency(skillName, ['JavaScript', 'Testing'], 'Jest is a JavaScript testing framework', 4, 15, ['Unit Testing', 'Test-Driven Development'], 'testing')
  }
  if (normalized.includes('cypress')) {
    return createSkillDependency(skillName, ['JavaScript', 'Testing', 'Web Development'], 'Cypress is an end-to-end testing framework', 5, 20, ['E2E Testing', 'Test Automation'], 'testing')
  }
  
  // API and protocols
  if (normalized.includes('graphql')) {
    return createSkillDependency(skillName, ['HTTP', 'API Design'], 'GraphQL is a query language for APIs', 6, 25, ['Apollo', 'GraphQL Subscriptions'], 'api')
  }
  if (normalized.includes('rest') || normalized.includes('rest api')) {
    return createSkillDependency(skillName, ['HTTP', 'API Design'], 'REST is an architectural style for APIs', 4, 20, ['OpenAPI', 'Microservices'], 'api')
  }
  
  return null
}

// Helper function to create SkillDependency objects
function createSkillDependency(
  skillName: string,
  dependencies: string[],
  description: string,
  difficulty: number,
  estimatedHours: number,
  enables: string[],
  category: string
): SkillDependency {
  return {
    skillName,
    dependencies,
    description,
    difficulty,
    estimatedHours,
    enables,
    category,
    source: 'algorithmic',
    analyzedAt: new Date()
  }
}

// Enhanced skill dependency lookup with hybrid approach
export async function getSkillDependencies(skillName: string, userContext?: UserContext): Promise<SkillDependency> {
  // 1. Try algorithmic pattern matching first (fastest)
  const algorithmicResult = getAlgorithmicDependencies(skillName)
  if (algorithmicResult) {
    return algorithmicResult
  }
  
  // 2. Check cache for previously analyzed skills
  const cachedAnalysis = getCachedSkillAnalysis(skillName)
  if (cachedAnalysis) {
    return { ...cachedAnalysis, source: 'cache' }
  }
  
  // 3. Use LLM analysis for unknown skills
  const llmAnalysis = await analyzeSkillWithLLM(skillName, userContext)
  cacheSkillAnalysis(skillName, llmAnalysis)
  
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