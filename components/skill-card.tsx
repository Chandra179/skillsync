'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, MoreVertical, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skill, ProficiencyLevel, useSkillStore } from '@/lib/store'
import { getSkillChecklist } from '@/lib/skill-checklists'
import { TeachingEvaluationDialog } from '@/components/teaching-evaluation-dialog'
import { ConsistencyWarnings } from '@/components/consistency-warnings'
import { getSkillWarnings } from '@/lib/skill-dependencies'

interface SkillCardProps {
  skill: Skill
}

const proficiencyColors = {
  'Want to Learn': 'bg-gray-100 text-gray-800 border-gray-300',
  'Learning': 'bg-blue-100 text-blue-800 border-blue-300',
  'Proficient': 'bg-green-100 text-green-800 border-green-300',
  'Mastered': 'bg-purple-100 text-purple-800 border-purple-300'
}

export function SkillCard({ skill }: SkillCardProps) {
  const { skills, updateSkillProficiency, toggleChecklistItem, initializeChecklist, removeSkill } = useSkillStore()
  
  // Get consistency warnings for this specific skill
  const skillWarnings = getSkillWarnings(skills, skill.id)

  useEffect(() => {
    if (!skill.checklist) {
      const predefinedChecklist = getSkillChecklist(skill.name)
      if (predefinedChecklist) {
        initializeChecklist(skill.id, predefinedChecklist)
      }
    }
  }, [skill.id, skill.name, skill.checklist, initializeChecklist])


  const handleProficiencyChange = (proficiency: ProficiencyLevel) => {
    updateSkillProficiency(skill.id, proficiency)
  }

  const handleRemoveSkill = () => {
    removeSkill(skill.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{skill.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${proficiencyColors[skill.proficiency]}`}>
                {skill.proficiency}
              </span>
              {(skill.proficiency === 'Proficient' || skill.proficiency === 'Mastered') && (
                <TeachingEvaluationDialog skillId={skill.id} skillName={skill.name}>
                  <Button variant="outline" size="sm" className="h-8">
                    <Brain className="h-4 w-4 mr-1" />
                    Teach
                  </Button>
                </TeachingEvaluationDialog>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleRemoveSkill} className="text-red-600 focus:text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Skill
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={skill.proficiency} onValueChange={handleProficiencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Want to Learn">Want to Learn</SelectItem>
              <SelectItem value="Learning">Learning</SelectItem>
              <SelectItem value="Proficient">Proficient</SelectItem>
              <SelectItem value="Mastered">Mastered</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Display consistency warnings */}
          {skillWarnings.length > 0 && (
            <div className="mt-4">
              <ConsistencyWarnings warnings={skillWarnings} />
            </div>
          )}
          
          {/* {skill.checklist && skill.checklist.length > 0 && (
            <SkillChecklist
              items={skill.checklist}
              onItemToggle={handleChecklistItemToggle}
            />
          )} */}

          {skill.teachingEvaluations && skill.teachingEvaluations.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Teaching History</h4>
                <span className="text-xs text-gray-500">
                  {skill.teachingEvaluations.length} evaluation{skill.teachingEvaluations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {skill.teachingEvaluations.slice(-3).map((evaluation) => (
                  <div key={evaluation.id} className="bg-gray-50 p-2 rounded text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Score: {evaluation.score.totalScore}/100</span>
                      <span className="text-gray-500">
                        {new Date(evaluation.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {evaluation.feedback && (
                      <p className="text-gray-600 mt-1 truncate">{evaluation.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </motion.div>
  )
}