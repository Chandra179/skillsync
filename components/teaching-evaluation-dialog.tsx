"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useSkillStore, type TeachingEvaluation } from '@/lib/store'
import { llmService, type EvaluationScore } from '@/lib/llm-service'
import { Brain, MessageSquare, Trophy, AlertCircle } from 'lucide-react'

interface TeachingEvaluationDialogProps {
  skillId: string
  skillName: string
  children: React.ReactNode
}

export function TeachingEvaluationDialog({ 
  skillId, 
  skillName, 
  children 
}: TeachingEvaluationDialogProps) {
  const [open, setOpen] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationScore | null>(null)
  const addTeachingEvaluation = useSkillStore(state => state.addTeachingEvaluation)

  const evaluationPrompts = {
    'golang': "Explain goroutines and when to use mutex vs channel.",
    'docker': "Explain Docker containers and how they differ from virtual machines.",
    'react': "Explain React's component lifecycle and when to use useEffect.",
    'default': `Explain a key concept in ${skillName} and provide practical examples.`
  }

  const getPromptForSkill = (skillName: string): string => {
    const key = skillName.toLowerCase()
    return evaluationPrompts[key as keyof typeof evaluationPrompts] || 
           evaluationPrompts.default
  }

  const handleEvaluate = async () => {
    if (!explanation.trim()) return

    setIsEvaluating(true)
    try {
      const score = await llmService.evaluateExplanation(
        skillName,
        explanation,
        'intermediate'
      )
      
      setCurrentEvaluation(score)
      
      const evaluation: TeachingEvaluation = {
        id: Math.random().toString(36).substring(2, 11),
        topic: skillName,
        userExplanation: explanation,
        score: {
          clarity: score.clarity,
          coverage: score.coverage,
          depth: score.depth,
          misconceptions: score.misconceptions,
          totalScore: score.totalScore
        },
        feedback: score.feedback,
        timestamp: new Date()
      }
      
      addTeachingEvaluation(skillId, evaluation)
    } catch (error) {
      console.error('Evaluation failed:', error)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleReset = () => {
    setExplanation('')
    setCurrentEvaluation(null)
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      handleReset()
    }, 300)
  }

  const getScoreColor = (score: number): string => {
    if (score >= 20) return 'bg-green-500'
    if (score >= 15) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getOverallGrade = (totalScore: number): { grade: string, color: string } => {
    const percentage = (totalScore / 100) * 100
    if (percentage >= 85) return { grade: 'A', color: 'text-green-600' }
    if (percentage >= 75) return { grade: 'B', color: 'text-blue-600' }
    if (percentage >= 65) return { grade: 'C', color: 'text-yellow-600' }
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Teaching Evaluation: {skillName}
          </DialogTitle>
          <DialogDescription>
            Explain the concept below and receive AI-powered feedback on your teaching ability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Teaching Prompt
            </h4>
            <p className="text-blue-800">{getPromptForSkill(skillName)}</p>
          </div>

          {!currentEvaluation ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Explanation
                </label>
                <Textarea
                  placeholder="Provide a clear, comprehensive explanation..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aim for 150-500 words with examples and practical details.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Your Explanation</h4>
                <p className="text-sm text-gray-700">{explanation}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-green-900 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Evaluation Results
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {currentEvaluation.totalScore}/100
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`${getOverallGrade(currentEvaluation.totalScore).color} font-bold`}
                    >
                      {getOverallGrade(currentEvaluation.totalScore).grade}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Clarity', score: currentEvaluation.clarity },
                    { label: 'Coverage', score: currentEvaluation.coverage },
                    { label: 'Depth', score: currentEvaluation.depth },
                    { label: 'Misconceptions', score: currentEvaluation.misconceptions }
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span>{item.score}/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getScoreColor(item.score)}`}
                          style={{ width: `${(item.score / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {currentEvaluation.feedback && (
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Feedback
                    </h5>
                    <p className="text-sm text-gray-700">{currentEvaluation.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {currentEvaluation ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Try Again
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleEvaluate}
                disabled={!explanation.trim() || isEvaluating}
              >
                {isEvaluating ? 'Evaluating...' : 'Get Evaluation'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}