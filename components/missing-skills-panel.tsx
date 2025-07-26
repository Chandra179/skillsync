'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Lightbulb, Brain } from 'lucide-react'
import { useSkillStore } from '@/lib/store'
import { discoverMissingSkillsEnhanced, MissingSkill } from '@/lib/missing-skills-service'

export function MissingSkillsPanel() {
  const { skills, userProfile, addSkill } = useSkillStore()
  const [missingSkills, setMissingSkills] = useState<MissingSkill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeMissingSkills = useCallback(async () => {
    if (!userProfile.yearsOfExperience || !userProfile.currentRole) {
      setError('Please complete your profile first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const discovered = await discoverMissingSkillsEnhanced(
        skills,
        {
          yearsOfExperience: userProfile.yearsOfExperience,
          currentRole: userProfile.currentRole
        }
      )
      setMissingSkills(discovered)
    } catch (err) {
      setError('Failed to analyze missing skills')
      console.error('Error discovering missing skills:', err)
    } finally {
      setLoading(false)
    }
  }, [skills, userProfile.yearsOfExperience, userProfile.currentRole])


  const addMissingSkill = (skill: MissingSkill) => {
    addSkill({
      name: skill.name,
      proficiency: 'Want to Learn'
    })
    
    // Remove from missing skills list
    setMissingSkills(prev => prev.filter(s => s.id !== skill.id))
  }

  const getSourceIcon = (source: MissingSkill['source']) => {
    switch (source) {
      case 'llm':
        return <Brain className="h-3 w-3" />
      default:
        return <Brain className="h-3 w-3" />
    }
  }

  const getConfidenceColor = (confidence: MissingSkill['confidence']) => {
    switch (confidence) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  if (skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Missing Skills Discovery
          </CardTitle>
          <CardDescription>
            Add some skills first to discover missing prerequisites
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Missing Skills Discovery
            </CardTitle>
            <CardDescription>
              AI-powered analysis of prerequisite skills you might be missing
            </CardDescription>
          </div>
          <Button 
            onClick={analyzeMissingSkills}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Refresh Analysis'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              Analyzing your skills for missing prerequisites...
            </span>
          </div>
        )}

        {!loading && missingSkills.length === 0 && !error && (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">
              Great! No obvious missing prerequisites detected in your skill tree.
            </p>
          </div>
        )}

        {!loading && missingSkills.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground mb-4">
              Found {missingSkills.length} potentially missing prerequisite skills:
            </div>
            
            {missingSkills.map((skill) => (
              <div 
                key={skill.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{skill.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getConfidenceColor(skill.confidence)}`}
                      >
                        {skill.confidence} confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {getSourceIcon(skill.source)}
                        {skill.source}
                      </Badge>
                      {skill.category && (
                        <Badge variant="secondary" className="text-xs">
                          {skill.category}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {skill.reason}
                    </p>
                    
                    <p className="text-xs text-blue-600">
                      Prerequisite for: {skill.parentSkill}
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => addMissingSkill(skill)}
                    className="ml-4"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Skill
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <span className="font-medium">How it works:</span> This analysis uses AI to understand 
                skill dependencies based on your specific context and experience level. 
                Recommendations are tailored to your role and existing skills.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}