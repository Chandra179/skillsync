import { NextRequest, NextResponse } from 'next/server'

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skillName, prompt, userContext } = body
    
    if (!skillName) {
      return NextResponse.json(
        { error: 'Missing skillName' },
        { status: 400 }
      )
    }

    // Use custom prompt if provided, otherwise default to missing skills analysis
    const analysisPrompt = prompt || buildDefaultPrompt(skillName, userContext)

    // Use your existing LMStudio setup
    const baseUrl = 'http://192.168.1.4:1234/v1'

    const completion = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-8b',
        messages: [
          {
            role: 'system',
            content: `You are a professional skill analysis expert. Analyze skills across all domains including technical, business, creative, and academic fields. 
            You must return valid JSON only. Do not include any explanatory text outside the JSON response.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!completion.ok) {
      throw new Error(`LLM API error: ${completion.status}`)
    }

    const data: LLMResponse = await completion.json()
    const response = data.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from LLM')
    }

    // Parse the JSON response
    let analysis
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        analysis = JSON.parse(response)
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', response)
      
      // For skill dependency analysis, try to extract structured data
      if (prompt) {
        throw new Error('Invalid JSON response from LLM')
      } else {
        // Fallback for missing skills analysis
        const suggestions = extractSkillsFromText(response, skillName)
        const validatedSuggestions = validateSuggestions(suggestions)
        
        return NextResponse.json({
          success: true,
          suggestions: validatedSuggestions,
          skillName,
          userContext
        })
      }
    }

    // If this is a skill dependency analysis (has custom prompt), return the analysis
    if (prompt) {
      // Validate required fields for skill dependency analysis
      const validatedAnalysis = {
        dependencies: Array.isArray(analysis.dependencies) ? analysis.dependencies : [],
        description: typeof analysis.description === 'string' ? analysis.description : `Analysis for ${skillName}`,
        difficulty: typeof analysis.difficulty === 'number' ? Math.max(1, Math.min(10, analysis.difficulty)) : 5,
        estimatedHours: typeof analysis.estimatedHours === 'number' ? Math.max(1, analysis.estimatedHours) : 20,
        enables: Array.isArray(analysis.enables) ? analysis.enables : [],
        category: typeof analysis.category === 'string' ? analysis.category : 'general'
      }
      
      return NextResponse.json(validatedAnalysis)
    } else {
      // This is missing skills analysis
      const validatedSuggestions = validateSuggestions(analysis)
      
      return NextResponse.json({
        success: true,
        suggestions: validatedSuggestions,
        skillName,
        userContext
      })
    }

  } catch (error) {
    console.error('Error in analyze-skill API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze skill prerequisites' },
      { status: 500 }
    )
  }
}

/**
 * Build default prompt for missing skills analysis
 */
function buildDefaultPrompt(skillName: string, userContext: any): string {
  return `Analyze the skill "${skillName}" for someone with ${userContext?.experience || 'unknown'} years of experience in the role of "${userContext?.role || 'professional'}".

Current skills they have: ${userContext?.existingSkills?.join(', ') || 'none specified'}

Please identify missing prerequisite skills that would be important for mastering "${skillName}". Consider:
1. Foundational technologies and concepts
2. Related tools and frameworks
3. System administration knowledge
4. Programming languages or paradigms
5. Infrastructure and deployment concepts

Return a JSON array of missing skills with this format:
[
  {
    "name": "skill name",
    "reason": "explanation of why this is needed",
    "confidence": "high|medium|low",
    "category": "programming|infrastructure|devops|database|security|networking|other"
  }
]

Focus on skills that are truly prerequisite (needed before learning the target skill), not complementary skills. Limit to 5 most important missing skills.`
}

/**
 * Validate and clean suggestion objects
 */
function validateSuggestions(suggestions: any[]): any[] {
  if (!Array.isArray(suggestions)) {
    return []
  }

  return suggestions
    .filter(suggestion => 
      suggestion && 
      typeof suggestion === 'object' &&
      suggestion.name && 
      typeof suggestion.name === 'string'
    )
    .map(suggestion => ({
      name: suggestion.name.trim(),
      reason: suggestion.reason || 'Prerequisite skill identified by AI analysis',
      confidence: ['high', 'medium', 'low'].includes(suggestion.confidence) 
        ? suggestion.confidence 
        : 'medium',
      category: suggestion.category || 'other'
    }))
    .slice(0, 5) // Limit to 5 suggestions
}

/**
 * Fallback function to extract skills from text response
 */
function extractSkillsFromText(text: string, skillName: string): any[] {
  const skills: any[] = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    // Look for skill names in bullet points or numbered lists
    const skillMatch = line.match(/^[\s\-\*\d\.]*(.+?)[\s\-\:]*(.*)$/)
    if (skillMatch && skillMatch[1] && skillMatch[1].trim().length > 0) {
      const name = skillMatch[1].trim()
      const reason = skillMatch[2] ? skillMatch[2].trim() : `Prerequisite for ${skillName}`
      
      // Skip if it looks like a header or too long
      if (name.length < 50 && !name.includes('prerequisite') && !name.includes(':')) {
        skills.push({
          name,
          reason,
          confidence: 'medium',
          category: 'other'
        })
      }
    }
  }
  
  return skills.slice(0, 5)
}