import { ChecklistItem } from './store'

function createChecklistItem(text: string): ChecklistItem {
  return {
    id: Math.random().toString(36).substring(2, 11),
    text,
    completed: false
  }
}

export const skillChecklists: Record<string, ChecklistItem[]> = {
  docker: [
    createChecklistItem('Build Dockerfile from scratch'),
    createChecklistItem('Use multi-stage builds'),
    createChecklistItem('Optimize for performance'),
    createChecklistItem('Handle environment variables'),
    createChecklistItem('Configure networking between containers')
  ],
  golang: [
    createChecklistItem('Write basic Go programs with functions'),
    createChecklistItem('Understand Go routines and channels'),
    createChecklistItem('Work with interfaces and structs'),
    createChecklistItem('Handle errors properly'),
    createChecklistItem('Write unit tests')
  ],
  javascript: [
    createChecklistItem('Understand closures and scope'),
    createChecklistItem('Work with async/await and Promises'),
    createChecklistItem('Manipulate DOM elements'),
    createChecklistItem('Handle events and callbacks'),
    createChecklistItem('Use ES6+ features confidently')
  ],
  react: [
    createChecklistItem('Create functional components with hooks'),
    createChecklistItem('Manage state with useState and useEffect'),
    createChecklistItem('Handle forms and user input'),
    createChecklistItem('Implement conditional rendering'),
    createChecklistItem('Understand component lifecycle')
  ],
  kubernetes: [
    createChecklistItem('Deploy applications using kubectl'),
    createChecklistItem('Create and manage pods, services, deployments'),
    createChecklistItem('Configure ingress and load balancing'),
    createChecklistItem('Set up persistent volumes'),
    createChecklistItem('Monitor cluster health and logs')
  ],
  python: [
    createChecklistItem('Write functions and classes'),
    createChecklistItem('Work with data structures (lists, dicts, sets)'),
    createChecklistItem('Handle exceptions and error cases'),
    createChecklistItem('Use virtual environments and pip'),
    createChecklistItem('Write unit tests with pytest')
  ]
}

export function getSkillChecklist(skillName: string): ChecklistItem[] | undefined {
  const normalizedName = skillName.toLowerCase().trim()
  return skillChecklists[normalizedName]
}