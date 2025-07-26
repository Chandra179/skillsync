'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, ArrowRight, Lightbulb } from "lucide-react"
import { LearningRecommendation } from "@/lib/learning-path-service"
import { useSkillStore } from "@/lib/store"

interface LearningRecommendationsProps {
  recommendations: LearningRecommendation[]
  title: string
  description?: string
  onAddSkill?: (skillName: string) => void
}

export function LearningRecommendations({ 
  recommendations, 
  title, 
  description, 
  onAddSkill 
}: LearningRecommendationsProps) {
  const addSkill = useSkillStore(state => state.addSkill)

  const handleAddSkill = (skillName: string) => {
    addSkill({ name: skillName, proficiency: 'Want to Learn' })
    onAddSkill?.(skillName)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prerequisite': return <ArrowRight className="h-4 w-4" />
      case 'next_step': return <TrendingUp className="h-4 w-4" />
      case 'advanced': return <Lightbulb className="h-4 w-4" />
      default: return <TrendingUp className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'prerequisite': return 'Prerequisite'
      case 'next_step': return 'Next Step'
      case 'advanced': return 'Advanced'
      default: return 'Recommended'
    }
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div 
              key={rec.id} 
              className="flex items-start justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm">{rec.skillName}</h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPriorityColor(rec.priority)}`}
                  >
                    {rec.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    {getTypeIcon(rec.type)}
                    {getTypeLabel(rec.type)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {rec.category}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">{rec.reason}</p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {rec.estimatedHours}h
                  </div>
                  <div>Difficulty: {rec.difficulty}/10</div>
                  {rec.currentSkillProficiency && (
                    <div>Current: {rec.currentSkillProficiency}</div>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSkill(rec.skillName)}
                className="ml-4 shrink-0"
              >
                Add Skill
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}