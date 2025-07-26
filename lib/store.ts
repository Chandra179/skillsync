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
  subSkills: Skill[]
  parentId?: string
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
  addSkill: (name: string, parentId?: string) => void
  updateSkillProficiency: (id: string, proficiency: ProficiencyLevel) => void
  updateUserProfile: (profile: Partial<UserProfile>) => void
  toggleChecklistItem: (skillId: string, itemId: string) => void
  initializeChecklist: (skillId: string, items: ChecklistItem[]) => void
  addTeachingEvaluation: (skillId: string, evaluation: TeachingEvaluation) => void
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function addSkillToTree(skills: Skill[], name: string, parentId?: string): Skill[] {
  if (!parentId) {
    const newSkill: Skill = {
      id: generateId(),
      name,
      proficiency: 'Want to Learn',
      subSkills: []
    }
    return [...skills, newSkill]
  }

  return skills.map(skill => {
    if (skill.id === parentId) {
      const newSubSkill: Skill = {
        id: generateId(),
        name,
        proficiency: 'Want to Learn',
        subSkills: [],
        parentId
      }
      return {
        ...skill,
        subSkills: [...skill.subSkills, newSubSkill]
      }
    }
    if (skill.subSkills.length > 0) {
      return {
        ...skill,
        subSkills: addSkillToTree(skill.subSkills, name, parentId)
      }
    }
    return skill
  })
}

function updateSkillProficiencyInTree(skills: Skill[], id: string, proficiency: ProficiencyLevel): Skill[] {
  return skills.map(skill => {
    if (skill.id === id) {
      return { ...skill, proficiency }
    }
    if (skill.subSkills.length > 0) {
      return {
        ...skill,
        subSkills: updateSkillProficiencyInTree(skill.subSkills, id, proficiency)
      }
    }
    return skill
  })
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
    if (skill.subSkills.length > 0) {
      return {
        ...skill,
        subSkills: toggleChecklistItemInTree(skill.subSkills, skillId, itemId)
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
    if (skill.subSkills.length > 0) {
      return {
        ...skill,
        subSkills: initializeChecklistInTree(skill.subSkills, skillId, items)
      }
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
    if (skill.subSkills.length > 0) {
      return {
        ...skill,
        subSkills: addTeachingEvaluationToTree(skill.subSkills, skillId, evaluation)
      }
    }
    return skill
  })
}

export const useSkillStore = create<SkillState>((set) => ({
  skills: [],
  userProfile: {
    yearsOfExperience: 0,
    currentRole: ''
  },
  addSkill: (name, parentId) => set((state) => ({
    skills: addSkillToTree(state.skills, name, parentId)
  })),
  updateSkillProficiency: (id, proficiency) => set((state) => ({
    skills: updateSkillProficiencyInTree(state.skills, id, proficiency)
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