'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSkillStore } from '@/lib/store'

export function UserProfileForm() {
  const { userProfile, updateUserProfile } = useSkillStore()
  const [years, setYears] = useState(userProfile.yearsOfExperience.toString())
  const [role, setRole] = useState(userProfile.currentRole)

  const handleSave = () => {
    updateUserProfile({
      yearsOfExperience: parseInt(years) || 0,
      currentRole: role
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Years of Experience</label>
          <Input
            type="number"
            placeholder="0"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="w-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Current Role</label>
          <Input
            placeholder="e.g., Software Engineer, Product Manager"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Button onClick={handleSave}>Save Profile</Button>
      </CardContent>
    </Card>
  )
}