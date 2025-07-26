'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useSkillStore } from '@/lib/store'

export function AddSkillDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [skillName, setSkillName] = useState('')
  const { addSkill } = useSkillStore()

  const handleAddSkill = () => {
    if (skillName.trim()) {
      addSkill(skillName.trim())
      setSkillName('')
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="mb-6">
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Skill</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter skill name (e.g., Golang, Java, Leadership)"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
          />
          <div className="flex gap-2">
            <Button onClick={handleAddSkill} disabled={!skillName.trim()}>
              Add Skill
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}