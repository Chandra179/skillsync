'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSkillStore } from '@/lib/store'
import { SkillCard } from '@/components/skill-card'
import { AddSkillDialog } from '@/components/add-skill-dialog'
import { UserProfileForm } from '@/components/user-profile-form'
import { MissingSkillsPanel } from '@/components/missing-skills-panel'
export default function Home() {
  const { skills } = useSkillStore()

  return (
    <main className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8 text-center">SkillSync</h1>
        
        <UserProfileForm />
        
        {/* Missing Skills Discovery Panel */}
        <div className="mb-8">
          <MissingSkillsPanel />
        </div>
        
        
        {/* Show consistency warnings when there are skills */}
        {/* {skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Skill Consistency Check</h2>
            <SkillConsistencyWarnings warnings={allWarnings} />
          </div>
        )} */}
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Skills</h2>
          <AddSkillDialog />
        </div>

        {skills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-4">No skills added yet</p>
            <p>Click &quot;Add Skill&quot; to get started with tracking your skills!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </motion.div>
    </main>
  )
}