'use client'

import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Badge } from './ui/badge'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { ConsistencyWarning } from '@/lib/skill-dependencies'

interface ConsistencyWarningsProps {
  warnings: ConsistencyWarning[]
  className?: string
}

const severityConfig = {
  low: {
    icon: Info,
    variant: 'default' as const,
    badgeVariant: 'secondary' as const,
    title: 'Suggestion'
  },
  medium: {
    icon: AlertCircle,
    variant: 'default' as const,
    badgeVariant: 'default' as const,
    title: 'Notice'
  },
  high: {
    icon: AlertTriangle,
    variant: 'destructive' as const,
    badgeVariant: 'destructive' as const,
    title: 'Important'
  }
}

const typeLabels = {
  missing_dependency: 'Missing Foundation',
  proficiency_mismatch: 'Proficiency Gap'
}

export function ConsistencyWarnings({ warnings, className }: ConsistencyWarningsProps) {
  if (warnings.length === 0) {
    return null
  }

  // Group warnings by severity
  const groupedWarnings = warnings.reduce(
    (acc, warning) => {
      acc[warning.severity].push(warning)
      return acc
    },
    { high: [], medium: [], low: [] } as Record<string, ConsistencyWarning[]>
  )

  return (
    <div className={className}>
      {(['high', 'medium', 'low'] as const).map(severity => {
        const severityWarnings = groupedWarnings[severity]
        if (severityWarnings.length === 0) return null
        
        const config = severityConfig[severity]
        const Icon = config.icon
        
        return (
          <div key={severity} className="space-y-2 mb-4">
            {severityWarnings.map(warning => (
              <Alert key={warning.id} variant={config.variant} className="relative">
                <Icon className="h-4 w-4" />
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      {config.title}
                      <Badge variant={config.badgeVariant} className="text-xs">
                        {typeLabels[warning.type]}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-1">
                      <p className="font-medium">{warning.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {warning.suggestion}
                      </p>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function SkillConsistencyWarnings({ warnings }: { warnings: ConsistencyWarning[] }) {
  const skillWarnings = warnings.filter(w => w.type === 'missing_dependency' || w.type === 'proficiency_mismatch')
  
  if (skillWarnings.length === 0) {
    return (
      <Alert variant="default" className="border-green-200 bg-green-50">
        <Info className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Skills Look Consistent</AlertTitle>
        <AlertDescription className="text-green-700">
          No consistency issues detected in your skill tree.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <ConsistencyWarnings warnings={skillWarnings} />
}