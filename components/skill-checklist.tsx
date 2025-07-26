'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface SkillChecklistProps {
  items: ChecklistItem[]
  onItemToggle: (itemId: string) => void
}

export function SkillChecklist({ items, onItemToggle }: SkillChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 p-0 h-auto font-medium"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Self Assessment ({completedCount}/{totalCount})
          </Button>
          <div className="text-sm text-gray-500">
            {Math.round((completedCount / totalCount) * 100)}% complete
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => onItemToggle(item.id)}
              >
                <div className={`
                  flex items-center justify-center w-5 h-5 rounded border-2 mt-0.5
                  ${item.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-300 hover:border-green-400'}
                `}>
                  {item.completed && <Check className="h-3 w-3" />}
                </div>
                <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {item.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      )}
    </Card>
  )
}