import { Skill, ProficiencyLevel } from './store'
import { getSkillDependencies, SkillDependency, UserContext } from './skill-dependencies'

export interface LearningRecommendation {
  id: string
  skillName: string
  type: 'prerequisite' | 'next_step' | 'advanced'
  reason: string
  difficulty: number
  estimatedHours: number
  category: string
  priority: 'high' | 'medium' | 'low'
  currentSkillProficiency?: ProficiencyLevel
}

export interface LearningPath {
  targetSkill: string
  prerequisites: LearningRecommendation[]
  nextSteps: LearningRecommendation[]
  estimatedTotalHours: number
}

/**
 * Get learning recommendations for a specific skill using dynamic analysis
 */
export async function getSkillLearningRecommendations(
  targetSkillName: string, 
  userSkills: Skill[],
  userContext?: UserContext
): Promise<LearningPath> {
  try {
    // Use dynamic skill dependency analysis
    const skillDep = await getSkillDependencies(targetSkillName, {
      ...userContext,
      existingSkills: userSkills.map(s => s.name)
    })

    const userSkillMap = createSkillMap(userSkills)
    const prerequisites = getPrerequisiteRecommendations(skillDep, userSkillMap)
    const nextSteps = getNextStepRecommendations(skillDep, userSkillMap)

    return {
      targetSkill: targetSkillName,
      prerequisites,
      nextSteps,
      estimatedTotalHours: prerequisites.reduce((sum, rec) => sum + rec.estimatedHours, 0)
    }
  } catch (error) {
    console.error(`Failed to analyze skill dependencies for ${targetSkillName}:`, error)
    // Fallback to basic recommendations
    return generateFallbackLearningPath(targetSkillName, userSkills)
  }
}

/**
 * Get "What to Learn Next" recommendations based on user's current skills using dynamic analysis
 */
export async function getWhatToLearnNext(
  userSkills: Skill[], 
  userContext?: UserContext
): Promise<LearningRecommendation[]> {
  const recommendations: LearningRecommendation[] = []
  const userSkillMap = createSkillMap(userSkills)
  
  // Get all skills the user has with meaningful proficiency
  const learnedSkills = userSkills.filter(skill => 
    skill.proficiency === 'Learning' || 
    skill.proficiency === 'Proficient' || 
    skill.proficiency === 'Mastered'
  )

  // For each learned skill, find what it enables using dynamic analysis
  for (const skill of learnedSkills) {
    try {
      const skillDep = await getSkillDependencies(skill.name, {
        ...userContext,
        existingSkills: userSkills.map(s => s.name)
      })

      // Add skills this skill enables
      for (const enabledSkill of skillDep.enables) {
        if (!userSkillMap.has(normalizeSkillName(enabledSkill))) {
          recommendations.push({
            id: `next-${generateId()}`,
            skillName: enabledSkill,
            type: 'next_step',
            reason: `You know ${skill.name}, which enables learning ${enabledSkill}`,
            difficulty: await getDynamicSkillDifficulty(enabledSkill),
            estimatedHours: await getDynamicSkillHours(enabledSkill),
            category: await getDynamicSkillCategory(enabledSkill),
            priority: calculatePriority(skill.proficiency, await getDynamicSkillDifficulty(enabledSkill)),
            currentSkillProficiency: skill.proficiency
          })
        }
      }
    } catch (error) {
      console.error(`Failed to analyze enablements for ${skill.name}:`, error)
      // Continue with other skills
    }
  }

  // Also generate algorithmic suggestions based on skill patterns
  const algorithmicSuggestions = await generateAlgorithmicSuggestions(userSkills, userContext)
  recommendations.push(...algorithmicSuggestions)

  // Add semantic similarity recommendations
  const enhancedRecommendations = await addSemanticSimilarityRecommendations(userSkills, recommendations)

  return removeDuplicateRecommendations(enhancedRecommendations)
    .sort((a, b) => {
      // Sort by priority, then by difficulty
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return a.difficulty - b.difficulty
    })
    .slice(0, 8) // Limit to top 8 recommendations
}

/**
 * Get skills that user can learn next based on dynamic analysis (deprecated - use generateAlgorithmicSuggestions)
 */
export async function getSkillsReadyToLearn(_userSkills: Skill[], _userContext?: UserContext): Promise<SkillDependency[]> {
  // This function is deprecated in favor of the new algorithmic approach
  // Return empty array to maintain compatibility
  console.warn('getSkillsReadyToLearn is deprecated. Use generateAlgorithmicSuggestions instead.')
  return []
}

/**
 * Generate learning path using dynamic analysis
 */
export async function generateLearningPath(
  targetSkills: string[], 
  userSkills: Skill[], 
  userContext?: UserContext
): Promise<LearningRecommendation[]> {
  const path: LearningRecommendation[] = []

  for (const targetSkill of targetSkills) {
    try {
      const skillPath = await dynamicTopologicalSort(targetSkill, userSkills, userContext)
      path.push(...skillPath)
    } catch (error) {
      console.error(`Failed to generate path for ${targetSkill}:`, error)
      // Add fallback recommendation
      path.push({
        id: `path-${generateId()}`,
        skillName: targetSkill,
        type: 'prerequisite',
        reason: 'Target skill',
        difficulty: 5,
        estimatedHours: 20,
        category: 'general',
        priority: 'high'
      })
    }
  }

  return removeDuplicateRecommendations(path)
}

/**
 * Dynamic topological sorting using LLM/algorithmic analysis
 */
async function dynamicTopologicalSort(
  skillName: string, 
  userSkills: Skill[], 
  userContext?: UserContext,
  visited: Set<string> = new Set()
): Promise<LearningRecommendation[]> {
  const normalizedName = normalizeSkillName(skillName)
  const userSkillMap = createSkillMap(userSkills)
  
  if (visited.has(normalizedName)) {
    return []
  }

  visited.add(normalizedName)

  // If user already has this skill with meaningful proficiency, skip
  const userSkill = userSkillMap.get(normalizedName)
  if (userSkill && hasMeaningfulProficiency(userSkill.proficiency)) {
    return []
  }

  try {
    const skillDep = await getSkillDependencies(skillName, {
      ...userContext,
      existingSkills: userSkills.map(s => s.name)
    })

    const path: LearningRecommendation[] = []

    // Recursively get prerequisites
    for (const dependency of skillDep.dependencies) {
      const depPath = await dynamicTopologicalSort(dependency, userSkills, userContext, visited)
      path.push(...depPath)
    }

    // Add current skill if user doesn't have it
    if (!userSkill || !hasMeaningfulProficiency(userSkill.proficiency)) {
      path.push({
        id: `path-${generateId()}`,
        skillName,
        type: 'prerequisite',
        reason: `Required for learning path`,
        difficulty: skillDep.difficulty,
        estimatedHours: skillDep.estimatedHours,
        category: skillDep.category,
        priority: calculatePriorityFromDifficulty(skillDep.difficulty)
      })
    }

    return path
  } catch (error) {
    console.error(`Failed to analyze dependencies for ${skillName}:`, error)
    // Fallback for unknown skills
    return [{
      id: `path-${generateId()}`,
      skillName,
      type: 'prerequisite',
      reason: 'Foundational skill',
      difficulty: 3,
      estimatedHours: 15,
      category: 'general',
      priority: 'medium'
    }]
  }
}

// Helper functions
function createSkillMap(skills: Skill[]): Map<string, Skill> {
  const map = new Map<string, Skill>()
  for (const skill of skills) {
    map.set(normalizeSkillName(skill.name), skill)
  }
  return map
}

function normalizeSkillName(name: string): string {
  return name.toLowerCase().trim()
}

function hasMeaningfulProficiency(proficiency: ProficiencyLevel): boolean {
  return proficiency === 'Learning' || proficiency === 'Proficient' || proficiency === 'Mastered'
}

function getPrerequisiteRecommendations(
  skillDep: SkillDependency, 
  userSkillMap: Map<string, Skill>
): LearningRecommendation[] {
  const prerequisites: LearningRecommendation[] = []

  for (const dependency of skillDep.dependencies) {
    const userSkill = userSkillMap.get(normalizeSkillName(dependency))
    
    if (!userSkill) {
      // User doesn't have this prerequisite at all
      prerequisites.push({
        id: `prereq-${generateId()}`,
        skillName: dependency,
        type: 'prerequisite',
        reason: `Required prerequisite for ${skillDep.skillName}`,
        difficulty: getSkillDifficulty(dependency),
        estimatedHours: getSkillEstimatedHours(dependency),
        category: getSkillCategory(dependency),
        priority: 'high'
      })
    } else if (!hasMeaningfulProficiency(userSkill.proficiency)) {
      // User has skill but only as "Want to Learn"
      prerequisites.push({
        id: `prereq-${generateId()}`,
        skillName: dependency,
        type: 'prerequisite',
        reason: `Strengthen prerequisite for ${skillDep.skillName}`,
        difficulty: getSkillDifficulty(dependency),
        estimatedHours: getSkillEstimatedHours(dependency),
        category: getSkillCategory(dependency),
        priority: 'medium',
        currentSkillProficiency: userSkill.proficiency
      })
    }
  }

  return prerequisites
}

function getNextStepRecommendations(
  skillDep: SkillDependency, 
  userSkillMap: Map<string, Skill>
): LearningRecommendation[] {
  const nextSteps: LearningRecommendation[] = []

  for (const enabledSkill of skillDep.enables) {
    if (!userSkillMap.has(normalizeSkillName(enabledSkill))) {
      nextSteps.push({
        id: `next-${generateId()}`,
        skillName: enabledSkill,
        type: 'next_step',
        reason: `Natural progression from ${skillDep.skillName}`,
        difficulty: getSkillDifficulty(enabledSkill),
        estimatedHours: getSkillEstimatedHours(enabledSkill),
        category: getSkillCategory(enabledSkill),
        priority: calculatePriorityFromDifficulty(getSkillDifficulty(enabledSkill))
      })
    }
  }

  return nextSteps.sort((a, b) => a.difficulty - b.difficulty).slice(0, 5)
}

// Legacy functions (deprecated - use dynamic versions instead)
function getSkillDifficulty(_skillName: string): number {
  console.warn('getSkillDifficulty is deprecated. Use getDynamicSkillDifficulty instead.')
  return 5 // Default difficulty
}

function getSkillEstimatedHours(_skillName: string): number {
  console.warn('getSkillEstimatedHours is deprecated. Use getDynamicSkillHours instead.')
  return 20 // Default hours
}

function getSkillCategory(_skillName: string): string {
  console.warn('getSkillCategory is deprecated. Use getDynamicSkillCategory instead.')
  return 'general' // Default category
}

function calculatePriority(proficiency: ProficiencyLevel, difficulty: number): 'high' | 'medium' | 'low' {
  if (proficiency === 'Mastered' && difficulty <= 6) return 'high'
  if (proficiency === 'Proficient' && difficulty <= 5) return 'high'
  if (difficulty <= 4) return 'medium'
  return 'low'
}

function calculatePriorityFromDifficulty(difficulty: number): 'high' | 'medium' | 'low' {
  if (difficulty <= 4) return 'high'
  if (difficulty <= 6) return 'medium'
  return 'low'
}

function removeDuplicateRecommendations(recommendations: LearningRecommendation[]): LearningRecommendation[] {
  const seen = new Set<string>()
  const unique: LearningRecommendation[] = []

  for (const rec of recommendations) {
    const key = normalizeSkillName(rec.skillName)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(rec)
    }
  }

  return unique
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

/**
 * Generate fallback learning path for unknown skills
 */
function generateFallbackLearningPath(targetSkillName: string, userSkills: Skill[]): LearningPath {
  const recommendations: LearningRecommendation[] = []
  
  // Suggest foundational skills if user has few skills
  if (userSkills.length < 3) {
    const foundationalSkills = ['Problem Solving', 'Critical Thinking', 'Communication']
    for (const skill of foundationalSkills) {
      if (!userSkills.some(s => normalizeSkillName(s.name) === normalizeSkillName(skill))) {
        recommendations.push({
          id: `fallback-${generateId()}`,
          skillName: skill,
          type: 'prerequisite',
          reason: `Foundational skill that supports learning ${targetSkillName}`,
          difficulty: 2,
          estimatedHours: 10,
          category: 'foundational',
          priority: 'medium'
        })
      }
    }
  }
  
  // Suggest next steps based on skill category patterns
  const nextSteps = generateFallbackNextSteps(targetSkillName)
  
  return {
    targetSkill: targetSkillName,
    prerequisites: recommendations,
    nextSteps,
    estimatedTotalHours: recommendations.reduce((sum, rec) => sum + rec.estimatedHours, 0)
  }
}

/**
 * Generate fallback next steps based on skill name patterns
 */
function generateFallbackNextSteps(skillName: string): LearningRecommendation[] {
  const normalized = normalizeSkillName(skillName)
  const suggestions: LearningRecommendation[] = []
  
  // Pattern-based suggestions
  if (normalized.includes('programming') || normalized.includes('coding')) {
    suggestions.push(
      createFallbackRecommendation('Software Engineering', 'next_step', `Apply ${skillName} in larger projects`),
      createFallbackRecommendation('Version Control', 'next_step', 'Essential for any programming work'),
      createFallbackRecommendation('Testing', 'next_step', 'Quality assurance for code')
    )
  } else if (normalized.includes('management') || normalized.includes('leadership')) {
    suggestions.push(
      createFallbackRecommendation('Team Building', 'next_step', `Enhance ${skillName} with team dynamics`),
      createFallbackRecommendation('Strategic Planning', 'next_step', 'Long-term thinking and planning'),
      createFallbackRecommendation('Communication', 'next_step', 'Essential for effective leadership')
    )
  } else if (normalized.includes('design') || normalized.includes('ui') || normalized.includes('ux')) {
    suggestions.push(
      createFallbackRecommendation('User Research', 'next_step', 'Understand user needs for better design'),
      createFallbackRecommendation('Prototyping', 'next_step', 'Rapid iteration and testing'),
      createFallbackRecommendation('Design Systems', 'next_step', 'Scalable and consistent design')
    )
  } else if (normalized.includes('data') || normalized.includes('analytics')) {
    suggestions.push(
      createFallbackRecommendation('Statistics', 'next_step', 'Mathematical foundation for data work'),
      createFallbackRecommendation('Visualization', 'next_step', 'Present data insights effectively'),
      createFallbackRecommendation('Machine Learning', 'advanced', 'Advanced data analysis techniques')
    )
  } else {
    // Generic professional development suggestions
    suggestions.push(
      createFallbackRecommendation('Project Management', 'next_step', `Organize and execute ${skillName} projects`),
      createFallbackRecommendation('Documentation', 'next_step', 'Share knowledge and best practices'),
      createFallbackRecommendation('Continuous Learning', 'next_step', `Stay current with ${skillName} trends`)
    )
  }
  
  return suggestions.slice(0, 3) // Limit to 3 suggestions
}

/**
 * Create a fallback recommendation
 */
function createFallbackRecommendation(
  skillName: string, 
  type: 'prerequisite' | 'next_step' | 'advanced',
  reason: string
): LearningRecommendation {
  const difficultyMap = { prerequisite: 3, next_step: 4, advanced: 6 }
  const hoursMap = { prerequisite: 15, next_step: 20, advanced: 30 }
  
  return {
    id: `fallback-${generateId()}`,
    skillName,
    type,
    reason,
    difficulty: difficultyMap[type],
    estimatedHours: hoursMap[type],
    category: 'general',
    priority: type === 'prerequisite' ? 'high' : 'medium'
  }
}

/**
 * Get dynamic skill difficulty using the skill dependencies service
 */
async function getDynamicSkillDifficulty(skillName: string): Promise<number> {
  try {
    const skillDep = await getSkillDependencies(skillName)
    return skillDep.difficulty
  } catch (error) {
    return 5 // Default difficulty
  }
}

/**
 * Get dynamic skill estimated hours using the skill dependencies service
 */
async function getDynamicSkillHours(skillName: string): Promise<number> {
  try {
    const skillDep = await getSkillDependencies(skillName)
    return skillDep.estimatedHours
  } catch (error) {
    return 20 // Default hours
  }
}

/**
 * Get dynamic skill category using the skill dependencies service
 */
async function getDynamicSkillCategory(skillName: string): Promise<string> {
  try {
    const skillDep = await getSkillDependencies(skillName)
    return skillDep.category
  } catch (error) {
    return 'general' // Default category
  }
}

/**
 * Generate algorithmic suggestions based on skill patterns and user context
 */
async function generateAlgorithmicSuggestions(
  userSkills: Skill[], 
  userContext?: UserContext
): Promise<LearningRecommendation[]> {
  const suggestions: LearningRecommendation[] = []
  const userSkillMap = createSkillMap(userSkills)
  
  // Analyze skill patterns to suggest related skills
  const skillCategories = await analyzeSkillCategories(userSkills)
  
  // Suggest complementary skills based on existing skills
  for (const [category, count] of Object.entries(skillCategories)) {
    if (count > 0) {
      const complementarySkills = getComplementarySkills(category, userSkillMap)
      suggestions.push(...complementarySkills)
    }
  }
  
  // Suggest skills based on user role and experience
  if (userContext?.currentRole) {
    const roleBasedSkills = getRoleBasedSuggestions(userContext.currentRole, userSkillMap)
    suggestions.push(...roleBasedSkills)
  }
  
  // Suggest trending skills in user's domain
  const trendingSkills = getTrendingSkillSuggestions(userSkills, userSkillMap)
  suggestions.push(...trendingSkills)
  
  return suggestions.slice(0, 5) // Limit algorithmic suggestions
}

/**
 * Analyze skill categories to understand user's focus areas
 */
async function analyzeSkillCategories(userSkills: Skill[]): Promise<Record<string, number>> {
  const categories: Record<string, number> = {}
  
  for (const skill of userSkills) {
    try {
      const skillDep = await getSkillDependencies(skill.name)
      categories[skillDep.category] = (categories[skillDep.category] || 0) + 1
    } catch (error) {
      // Continue with other skills
    }
  }
  
  return categories
}

/**
 * Get complementary skills for a given category
 */
function getComplementarySkills(category: string, userSkillMap: Map<string, Skill>): LearningRecommendation[] {
  const complementarySkillsMap: Record<string, string[]> = {
    'frontend': ['Testing', 'Performance Optimization', 'Accessibility', 'SEO'],
    'backend': ['Database Design', 'API Design', 'Security', 'Monitoring'],
    'devops': ['Security', 'Monitoring', 'Automation', 'Infrastructure as Code'],
    'mobile': ['UX Design', 'App Store Optimization', 'Performance Testing'],
    'data': ['Statistics', 'Machine Learning', 'Data Visualization', 'Big Data'],
    'cloud': ['Security', 'Cost Optimization', 'Monitoring', 'DevOps'],
    'programming': ['Algorithm Design', 'Code Review', 'Testing', 'Documentation']
  }
  
  const skills = complementarySkillsMap[category] || []
  return skills
    .filter(skill => !userSkillMap.has(normalizeSkillName(skill)))
    .slice(0, 2)
    .map(skill => ({
      id: `comp-${generateId()}`,
      skillName: skill,
      type: 'next_step' as const,
      reason: `Complements your ${category} skills`,
      difficulty: 4,
      estimatedHours: 25,
      category,
      priority: 'medium' as const
    }))
}

/**
 * Get role-based skill suggestions
 */
function getRoleBasedSuggestions(role: string, userSkillMap: Map<string, Skill>): LearningRecommendation[] {
  const roleSkillsMap: Record<string, string[]> = {
    'developer': ['Code Review', 'Testing', 'Version Control', 'Debugging'],
    'frontend developer': ['UX Design', 'Performance Optimization', 'Browser DevTools'],
    'backend developer': ['Database Design', 'API Design', 'Security', 'Scalability'],
    'fullstack developer': ['System Design', 'DevOps', 'Testing', 'Performance'],
    'devops engineer': ['Infrastructure as Code', 'Monitoring', 'Security', 'Automation'],
    'data scientist': ['Statistics', 'Machine Learning', 'Data Visualization', 'Python'],
    'product manager': ['User Research', 'Data Analysis', 'Project Management', 'Communication'],
    'designer': ['User Research', 'Prototyping', 'Design Systems', 'Accessibility']
  }
  
  const normalizedRole = role.toLowerCase()
  let suggestedSkills: string[] = []
  
  // Find matching role or partial match
  for (const [roleKey, skills] of Object.entries(roleSkillsMap)) {
    if (normalizedRole.includes(roleKey) || roleKey.includes(normalizedRole)) {
      suggestedSkills = skills
      break
    }
  }
  
  return suggestedSkills
    .filter(skill => !userSkillMap.has(normalizeSkillName(skill)))
    .slice(0, 2)
    .map(skill => ({
      id: `role-${generateId()}`,
      skillName: skill,
      type: 'next_step' as const,
      reason: `Essential for ${role} role`,
      difficulty: 4,
      estimatedHours: 20,
      category: 'professional',
      priority: 'high' as const
    }))
}

/**
 * Get trending skill suggestions based on user's existing skills
 */
function getTrendingSkillSuggestions(_userSkills: Skill[], userSkillMap: Map<string, Skill>): LearningRecommendation[] {
  const trendingSkills = [
    'AI/Machine Learning', 'Cloud Computing', 'Cybersecurity', 'DevOps',
    'Data Analysis', 'Agile Methodology', 'Microservices', 'Containerization'
  ]
  
  return trendingSkills
    .filter(skill => !userSkillMap.has(normalizeSkillName(skill)))
    .slice(0, 2)
    .map(skill => ({
      id: `trend-${generateId()}`,
      skillName: skill,
      type: 'advanced' as const,
      reason: 'High-demand skill in current market',
      difficulty: 6,
      estimatedHours: 40,
      category: 'trending',
      priority: 'medium' as const
    }))
}

/**
 * Add semantic similarity matching to existing algorithmic suggestions
 */
async function addSemanticSimilarityRecommendations(
  userSkills: Skill[], 
  existingSuggestions: LearningRecommendation[]
): Promise<LearningRecommendation[]> {
  const semanticSuggestions: LearningRecommendation[] = []
  const userSkillMap = createSkillMap(userSkills)
  const existingSkillNames = new Set(existingSuggestions.map(s => normalizeSkillName(s.skillName)))
  
  // Get semantic matches for each user skill
  for (const userSkill of userSkills) {
    if (hasMeaningfulProficiency(userSkill.proficiency)) {
      const similarSkills = getSemanticallySimilarSkills(userSkill.name)
      
      for (const similarSkill of similarSkills) {
        const normalizedSimilar = normalizeSkillName(similarSkill.name)
        
        // Skip if user already has this skill or it's already suggested
        if (!userSkillMap.has(normalizedSimilar) && !existingSkillNames.has(normalizedSimilar)) {
          semanticSuggestions.push({
            id: `semantic-${generateId()}`,
            skillName: similarSkill.name,
            type: 'next_step',
            reason: `Similar to your ${userSkill.name} skill (${similarSkill.reason})`,
            difficulty: similarSkill.difficulty,
            estimatedHours: similarSkill.estimatedHours,
            category: similarSkill.category,
            priority: 'medium'
          })
          
          existingSkillNames.add(normalizedSimilar) // Prevent duplicates
        }
      }
    }
  }
  
  return [...existingSuggestions, ...semanticSuggestions.slice(0, 3)]
}

/**
 * Get semantically similar skills based on domain knowledge and patterns
 */
function getSemanticallySimilarSkills(skillName: string): Array<{
  name: string
  reason: string
  difficulty: number
  estimatedHours: number
  category: string
}> {
  const normalized = normalizeSkillName(skillName)
  const similarSkills: Array<{
    name: string
    reason: string
    difficulty: number
    estimatedHours: number
    category: string
  }> = []
  
  // Define semantic skill clusters
  const skillClusters = {
    // Frontend Technologies
    react: ['Vue.js', 'Angular', 'Svelte', 'Solid.js'],
    vue: ['React', 'Angular', 'Svelte', 'Alpine.js'],
    angular: ['React', 'Vue.js', 'TypeScript', 'RxJS'],
    
    // Backend Technologies
    nodejs: ['Deno', 'Bun', 'Express.js', 'Fastify'],
    express: ['Fastify', 'Koa.js', 'Hapi.js', 'NestJS'],
    django: ['Flask', 'FastAPI', 'Ruby on Rails', 'Laravel'],
    flask: ['Django', 'FastAPI', 'Express.js', 'Sinatra'],
    
    // Databases
    postgresql: ['MySQL', 'SQLite', 'MariaDB', 'CockroachDB'],
    mysql: ['PostgreSQL', 'MariaDB', 'SQLite', 'Microsoft SQL Server'],
    mongodb: ['DynamoDB', 'CouchDB', 'Cassandra', 'Firebase Firestore'],
    redis: ['Memcached', 'Amazon ElastiCache', 'Hazelcast', 'Apache Ignite'],
    
    // Cloud Platforms
    aws: ['Azure', 'Google Cloud Platform', 'DigitalOcean', 'Heroku'],
    azure: ['AWS', 'Google Cloud Platform', 'IBM Cloud', 'Oracle Cloud'],
    gcp: ['AWS', 'Azure', 'DigitalOcean', 'Linode'],
    
    // DevOps Tools
    docker: ['Podman', 'LXC', 'Containerd', 'rkt'],
    kubernetes: ['Docker Swarm', 'Nomad', 'OpenShift', 'Rancher'],
    jenkins: ['GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI'],
    terraform: ['Ansible', 'Pulumi', 'CloudFormation', 'Chef'],
    
    // Programming Languages
    javascript: ['TypeScript', 'Python', 'Java', 'C#'],
    python: ['JavaScript', 'Java', 'Go', 'Ruby'],
    java: ['C#', 'Kotlin', 'Scala', 'Python'],
    go: ['Rust', 'Python', 'C++', 'Java'],
    rust: ['Go', 'C++', 'Zig', 'Carbon'],
    
    // Testing Frameworks
    jest: ['Mocha', 'Jasmine', 'Vitest', 'Cypress'],
    cypress: ['Playwright', 'Selenium', 'Puppeteer', 'TestCafe'],
    mocha: ['Jest', 'Jasmine', 'AVA', 'Tape'],
    
    // Mobile Development
    'react native': ['Flutter', 'Ionic', 'Xamarin', 'Cordova'],
    flutter: ['React Native', 'Ionic', 'NativeScript', 'Xamarin'],
    ios: ['Android', 'Flutter', 'React Native', 'Xamarin'],
    android: ['iOS', 'Flutter', 'React Native', 'Ionic']
  }
  
  // Find matches for the skill
  for (const [key, relatedSkills] of Object.entries(skillClusters)) {
    if (normalized.includes(key) || key.includes(normalized.split(' ')[0])) {
      for (const relatedSkill of relatedSkills) {
        similarSkills.push({
          name: relatedSkill,
          reason: `alternative to ${skillName}`,
          difficulty: getSimilarSkillDifficulty(skillName, relatedSkill),
          estimatedHours: getSimilarSkillHours(skillName, relatedSkill),
          category: getSimilarSkillCategory(skillName)
        })
      }
      break
    }
  }
  
  // Pattern-based matching for broader categories
  if (similarSkills.length === 0) {
    if (normalized.includes('framework') || normalized.includes('library')) {
      similarSkills.push(
        { name: 'Software Architecture', reason: 'frameworks require architectural knowledge', difficulty: 6, estimatedHours: 30, category: 'architecture' },
        { name: 'Design Patterns', reason: 'common in framework development', difficulty: 5, estimatedHours: 25, category: 'programming' }
      )
    } else if (normalized.includes('database') || normalized.includes('sql')) {
      similarSkills.push(
        { name: 'Database Design', reason: 'fundamental for database technologies', difficulty: 5, estimatedHours: 25, category: 'database' },
        { name: 'Data Modeling', reason: 'essential for database work', difficulty: 4, estimatedHours: 20, category: 'database' }
      )
    }
  }
  
  return similarSkills.slice(0, 3) // Limit to 3 most relevant
}

/**
 * Estimate difficulty for similar skills based on the original skill
 */
function getSimilarSkillDifficulty(_originalSkill: string, similarSkill: string): number {
  const baseMapping: Record<string, number> = {
    'Vue.js': 5, 'Angular': 7, 'Svelte': 4, 'Solid.js': 5,
    'Deno': 4, 'Bun': 3, 'Express.js': 4, 'Fastify': 4,
    'Flask': 4, 'FastAPI': 5, 'Ruby on Rails': 6, 'Laravel': 5
  }
  
  return baseMapping[similarSkill] || 5 // Default difficulty
}

/**
 * Estimate hours for similar skills
 */
function getSimilarSkillHours(_originalSkill: string, similarSkill: string): number {
  const baseMapping: Record<string, number> = {
    'Vue.js': 30, 'Angular': 40, 'Svelte': 25, 'Solid.js': 25,
    'Deno': 20, 'Bun': 15, 'Express.js': 20, 'Fastify': 20,
    'Flask': 20, 'FastAPI': 25, 'Ruby on Rails': 35, 'Laravel': 30
  }
  
  return baseMapping[similarSkill] || 25 // Default hours
}

/**
 * Get category for similar skills based on original skill
 */
function getSimilarSkillCategory(originalSkill: string): string {
  const normalized = normalizeSkillName(originalSkill)
  
  if (normalized.includes('react') || normalized.includes('vue') || normalized.includes('angular')) {
    return 'frontend'
  }
  if (normalized.includes('node') || normalized.includes('express') || normalized.includes('django')) {
    return 'backend'
  }
  if (normalized.includes('docker') || normalized.includes('kubernetes') || normalized.includes('jenkins')) {
    return 'devops'
  }
  if (normalized.includes('aws') || normalized.includes('azure') || normalized.includes('gcp')) {
    return 'cloud'
  }
  
  return 'general'
}