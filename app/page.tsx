'use client'

import { motion } from 'framer-motion'
import { useSkillStore } from '@/lib/store'
import { SkillCard } from '@/components/skill-card'
import { AddSkillDialog } from '@/components/add-skill-dialog'
import { UserProfileForm } from '@/components/user-profile-form'

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
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Skills</h2>
          <AddSkillDialog />
        </div>

        {skills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-4">No skills added yet</p>
            <p>Click "Add Skill" to get started with tracking your skills!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} level={0} />
            ))}
          </div>
        )}
      </motion.div>
    </main>
  )
}