import { create } from 'zustand'

export type ProficiencyLevel = 'Want to Learn' | 'Learning' | 'Proficient' | 'Mastered'

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface TeachingEvaluation {
  id: string
  topic: string
  userExplanation: string
  score: {
    clarity: number
    coverage: number
    depth: number
    misconceptions: number
    totalScore: number
  }
  feedback: string
  timestamp: Date
}

export interface Skill {
  id: string
  name: string
  proficiency: ProficiencyLevel
  checklist?: ChecklistItem[]
  teachingEvaluations?: TeachingEvaluation[]
}

export interface UserProfile {
  yearsOfExperience: number
  currentRole: string
}

interface SkillState {
  skills: Skill[]
  userProfile: UserProfile
  profile?: UserProfile
  addSkill: (skillData: { name: string; proficiency?: ProficiencyLevel }) => void
  updateSkillProficiency: (id: string, proficiency: ProficiencyLevel) => void
  removeSkill: (id: string) => void
  updateUserProfile: (profile: Partial<UserProfile>) => void
  toggleChecklistItem: (skillId: string, itemId: string) => void
  initializeChecklist: (skillId: string, items: ChecklistItem[]) => void
  addTeachingEvaluation: (skillId: string, evaluation: TeachingEvaluation) => void
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function addSkillToTree(skills: Skill[], skillData: { name: string; proficiency?: ProficiencyLevel }): Skill[] {
  const { name, proficiency = 'Want to Learn' } = skillData
  
  // Check for case-insensitive duplicates
  const existingSkill = skills.find(skill => 
    skill.name.toLowerCase() === name.toLowerCase()
  )
  
  if (existingSkill) {
    // Skip adding duplicate skill, return existing skills array
    return skills
  }
  
  const newSkill: Skill = {
    id: generateId(),
    name,
    proficiency
  }
  return [...skills, newSkill]
}

function updateSkillProficiencyInTree(skills: Skill[], id: string, proficiency: ProficiencyLevel): Skill[] {
  return skills.map(skill => {
    if (skill.id === id) {
      return { ...skill, proficiency }
    }
    return skill
  })
}

function removeSkillFromTree(skills: Skill[], id: string): Skill[] {
  return skills.filter(skill => skill.id !== id)
}

function toggleChecklistItemInTree(skills: Skill[], skillId: string, itemId: string): Skill[] {
  return skills.map(skill => {
    if (skill.id === skillId && skill.checklist) {
      return {
        ...skill,
        checklist: skill.checklist.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      }
    }
    return skill
  })
}

function initializeChecklistInTree(skills: Skill[], skillId: string, items: ChecklistItem[]): Skill[] {
  return skills.map(skill => {
    if (skill.id === skillId) {
      return { ...skill, checklist: items }
    }
    return skill
  })
}

function addTeachingEvaluationToTree(skills: Skill[], skillId: string, evaluation: TeachingEvaluation): Skill[] {
  return skills.map(skill => {
    if (skill.id === skillId) {
      return {
        ...skill,
        teachingEvaluations: [...(skill.teachingEvaluations || []), evaluation]
      }
    }
    return skill
  })
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: [],
  userProfile: {
    yearsOfExperience: 0,
    currentRole: ''
  },
  get profile() {
    const state = get()
    return {
      experience: state.userProfile.yearsOfExperience,
      role: state.userProfile.currentRole,
      yearsOfExperience: state.userProfile.yearsOfExperience,
      currentRole: state.userProfile.currentRole
    }
  },
  addSkill: (skillData) => set((state) => ({
    skills: addSkillToTree(state.skills, skillData)
  })),
  updateSkillProficiency: (id, proficiency) => set((state) => ({
    skills: updateSkillProficiencyInTree(state.skills, id, proficiency)
  })),
  removeSkill: (id) => set((state) => ({
    skills: removeSkillFromTree(state.skills, id)
  })),
  updateUserProfile: (profile) => set((state) => ({
    userProfile: { ...state.userProfile, ...profile }
  })),
  toggleChecklistItem: (skillId, itemId) => set((state) => ({
    skills: toggleChecklistItemInTree(state.skills, skillId, itemId)
  })),
  initializeChecklist: (skillId, items) => set((state) => ({
    skills: initializeChecklistInTree(state.skills, skillId, items)
  })),
  addTeachingEvaluation: (skillId, evaluation) => set((state) => ({
    skills: addTeachingEvaluationToTree(state.skills, skillId, evaluation)
  }))
}))