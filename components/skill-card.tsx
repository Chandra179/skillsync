'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, MoreVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skill, ProficiencyLevel, useSkillStore } from '@/lib/store'
import { TeachingEvaluationDialog } from '@/components/teaching-evaluation-dialog'
import { ConsistencyWarnings } from '@/components/consistency-warnings'
import { getSkillWarnings } from '@/lib/skill-dependencies'
import { getSkillLearningRecommendations, LearningPath } from '@/lib/learning-path-service'
import { LearningRecommendations } from '@/components/learning-recommendations'

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
  const { skills, updateSkillProficiency, removeSkill } = useSkillStore()
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [learningPath, setLearningPath] = useState<LearningPath>({
    targetSkill: '',
    prerequisites: [],
    nextSteps: [],
    estimatedTotalHours: 0
  })
  
  // Get consistency warnings for this specific skill
  const skillWarnings = getSkillWarnings(skills, skill.id)
  
  // Get learning recommendations for this skill
  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        const path = await getSkillLearningRecommendations(skill.name, skills)
        setLearningPath(path)
      } catch (error) {
        console.error('Failed to fetch learning path:', error)
        setLearningPath({ targetSkill: skill.name, prerequisites: [], nextSteps: [], estimatedTotalHours: 0 })
      }
    }
    
    fetchLearningPath()
  }, [skill.name, skills])

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
          
          {/* Learning Recommendations Section */}
          {(learningPath.prerequisites.length > 0 || learningPath.nextSteps.length > 0) && (
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="w-full justify-between p-2 h-auto text-sm"
              >
                <span>Learning Path Recommendations</span>
                {showRecommendations ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {showRecommendations && (
                <div className="mt-3 space-y-3">
                  {learningPath.prerequisites.length > 0 && (
                    <LearningRecommendations
                      recommendations={learningPath.prerequisites}
                      title="Prerequisites"
                      description={`Learn these skills before advancing your ${skill.name} proficiency`}
                    />
                  )}
                  
                  {learningPath.nextSteps.length > 0 && (
                    <LearningRecommendations
                      recommendations={learningPath.nextSteps}
                      title="What This Enables"
                      description={`Skills you can learn next with your ${skill.name} knowledge`}
                    />
                  )}
                  
                  {learningPath.estimatedTotalHours > 0 && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                      Total estimated learning time for prerequisites: {learningPath.estimatedTotalHours} hours
                    </div>
                  )}
                </div>
              )}
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