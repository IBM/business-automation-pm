import { Fragment, createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import enablementData from './enablement.json'
import {
  onboardingAutomationSections,
  onboardingAutomationTagline,
  type OnboardingBlock,
  type OnboardingSection,
} from './onboardingAutomationContent'

// Resolve files in /public against the deploy base path (e.g. /<repo>/ on GitHub Pages)
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

type SessionType = 'Lab' | 'Meet the Expert' | 'Meetup' | 'Tech Talk' | 'Breakout' | 'Client Advisory Board'
type Page = 'overview' | 'capabilities' | 'badges' | 'lets-create' | 'onboarding-automation' | 'process-automation' | 'content-services' | 'decision-intelligence' | 'cp4ba' | 'conference' | 'think' | 'sessions' | 'techxchange' | 'schedule' | 'maps' | 'ibm' | 'insights' | 'info' | 'product' | 'community' | 'enablement' | 'ug' | 'surveys' | 'speaker'

const pageAnchors: Record<Page, string> = {
  overview: 'main',
  capabilities: 'capabilities-top',
  badges: 'badges-top',
  'lets-create': 'lets-create-top',
  'onboarding-automation': 'onboarding-automation-top',
  'process-automation': 'capabilities-process-automation',
  'content-services': 'capabilities-content-services',
  'decision-intelligence': 'capabilities-decision-intelligence',
  cp4ba: 'capabilities-cp4ba',
  conference: 'conference-top',
  think: 'think-top',
  sessions: 'main-txc',
  techxchange: 'techxchange-top',
  schedule: 'conference-overview',
  maps: 'maps-top',
  ibm: 'ibm-top',
  insights: 'insights-top',
  info: 'info-top',
  product: 'product-top',
  community: 'community-top',
  enablement: 'enablement-top',
  ug: 'ug-top',
  surveys: 'surveys',
  speaker: 'av-top',
}

const breadcrumbLabels: Record<Page, string> = {
  overview: 'Main',
  capabilities: 'Portfolio',
  badges: 'Badge',
  'lets-create': 'Let\'s Create!',
  'onboarding-automation': 'Onboarding Automation',
  'process-automation': 'Process Automation',
  'content-services': 'Content Services',
  'decision-intelligence': 'Decision Intelligence',
  cp4ba: 'CP4BA',
  conference: 'Conference',
  think: 'Think',
  sessions: 'Overview',
  techxchange: 'TechXchange',
  schedule: 'Schedule',
  maps: 'Maps',
  ibm: 'IBM',
  insights: 'Insights',
  info: 'Info',
  product: 'Product Resources',
  community: 'Community',
  enablement: 'Enablement',
  ug: 'User Groups',
  surveys: 'Surveys',
  speaker: 'Audio/Visual',
}

const breadcrumbParents: Partial<Record<Page, Page>> = {
  capabilities: 'overview',
  badges: 'overview',
  'lets-create': 'overview',
  'onboarding-automation': 'lets-create',
  'process-automation': 'capabilities',
  'content-services': 'capabilities',
  'decision-intelligence': 'capabilities',
  cp4ba: 'capabilities',
  product: 'capabilities',
  community: 'overview',
  enablement: 'community',
  think: 'conference',
  techxchange: 'conference',
  sessions: 'techxchange',
  schedule: 'techxchange',
  maps: 'techxchange',
  info: 'techxchange',
  ug: 'techxchange',
  surveys: 'techxchange',
  ibm: 'techxchange',
  insights: 'ibm',
  speaker: 'ibm',
}

const breadcrumbSectionLabels: Record<string, string> = {
  'insights-summary': 'Session Summary',
  'insights-registration': 'Session Search',
  'business-automation-schedule': 'Business Automation Schedule',
  'conference-overview': 'Conference at a Glance',
  'enablement-overview': 'Overview',
  'enablement-activities': 'Activities by Month',
}

function formatBreadcrumbSectionLabel(id: string) {
  if (breadcrumbSectionLabels[id]) return breadcrumbSectionLabels[id]
  const enablementMonth = /^enablement-(\d{4})-(\d{2})$/.exec(id)
  if (enablementMonth) {
    return new Date(Number(enablementMonth[1]), Number(enablementMonth[2]) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  if (id.startsWith('session-')) return id.slice('session-'.length).toUpperCase()

  const label = id
    .replace(/^(capabilities-all|capabilities|portfolio|process-automation|content-services|decision-intelligence|cp4ba|conference|techxchange|think|sessions|maps|info|ug|surveys|av|enablement|onboarding-automation|badges)-/, '')
    .replace(/-/g, ' ')

  return label.replace(/\b\w+/g, word => {
    const uppercaseWords = ['ai', 'av', 'cab', 'cp4ba', 'ibm', 'lab', 'mte', 'qr', 'tlk']
    return uppercaseWords.includes(word.toLowerCase())
      ? word.toUpperCase()
      : `${word.charAt(0).toUpperCase()}${word.slice(1)}`
  })
}

function getBreadcrumbTrail(page: Page) {
  const trail: Page[] = []
  let current: Page | undefined = page
  while (current) {
    trail.unshift(current)
    current = breadcrumbParents[current]
  }
  return trail
}

function pageForHash(hash: string): Page {
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  if (id === 'main') return 'overview'
  if (id === 'onboarding-automation-top' || id.startsWith('onboarding-automation-')) return 'onboarding-automation'
  if (id === 'badges-top' || id.startsWith('badges-')) return 'badges'
  if (id === 'lets-create-top' || id.startsWith('lets-create-')) return 'lets-create'
  if (id === 'capabilities-top') return 'capabilities'
  if (id === 'capabilities-all') return 'capabilities'
  if (id.startsWith('capabilities-all-')) return 'capabilities'
  if (id.startsWith('portfolio-product-resources')) return 'capabilities'
  if (id === 'capabilities-process-automation') return 'process-automation'
  if (id === 'capabilities-content-services') return 'content-services'
  if (id === 'capabilities-decision-intelligence') return 'decision-intelligence'
  if (id === 'capabilities-cp4ba') return 'cp4ba'
  if (id === 'process-automation-top' || id.startsWith('process-automation-')) return 'process-automation'
  if (id === 'content-services-top' || id.startsWith('content-services-')) return 'content-services'
  if (id === 'decision-intelligence-top' || id.startsWith('decision-intelligence-')) return 'decision-intelligence'
  if (id === 'cp4ba-top' || id.startsWith('cp4ba-')) return 'cp4ba'
  if (id === 'conference-top') return 'conference'
  if (id === 'conference-think' || id === 'conference-techxchange') return 'conference'
  if (id === 'think-top' || id.startsWith('think-')) return 'think'
  if (id === 'main-txc' || id.startsWith('sessions-') || id.startsWith('session-')) return 'sessions'
  if (id === 'techxchange-top' || id.startsWith('techxchange-')) return 'techxchange'
  if (id.startsWith('conference-overview') || id === 'business-automation-schedule' || id.startsWith('general-session-')) return 'schedule'
  if (id === 'maps-top' || id.startsWith('maps-') || id.startsWith('venue-map-')) return 'maps'
  if (id === 'ibm-top' || id === 'ibm-access') return 'ibm'
  if (id === 'insights' || id === 'insights-top' || id.startsWith('insights-') || id.startsWith('executive-')) return 'insights'
  if (id === 'info-top' || id.startsWith('info-') || id.startsWith('conference-info-') || id.startsWith('meeting-zone-')) return 'info'
  if (id === 'enablement-top' || id.startsWith('enablement-')) return 'enablement'
  if (id === 'community-top' || id.startsWith('community-') || id === 'product-communities' || id === 'ug-communities') return 'community'
  if (id === 'product-top' || id.startsWith('new-ai-capabilities') || id.startsWith('product-') || id.startsWith('demo-')) return 'capabilities'
  if (id === 'ug-top' || id.startsWith('ug-')) return 'ug'
  if (id === 'surveys' || id.startsWith('survey-')) return 'surveys'
  if (id === 'av-top' || id.startsWith('hybrid-audio') || id.startsWith('speaker-') || id.startsWith('av-')) return 'speaker'
  return 'overview'
}

const businessAutomationCapabilities = [
  {
    page: 'process-automation' as const,
    number: '01',
    title: 'Process Automation',
    tagline: 'Orchestrate work from end to end',
    description: 'Design, run, and optimize workflows that coordinate people, systems, and AI agents across mission-critical operations.',
    overview: 'Process Automation helps organizations replace fragmented work with resilient, transparent operations. Model repeatable processes, manage dynamic cases, automate routine tasks, and introduce AI agents while retaining the controls required for enterprise work.',
    capabilities: ['Workflow orchestration', 'Process intelligence', 'Task and case management'],
    outcomes: [
      { title: 'Move work faster', description: 'Automate handoffs, remove bottlenecks, and coordinate work across teams and systems.' },
      { title: 'Modernize safely', description: 'Extend proven workflows with AI and automation without replacing dependable core systems.' },
      { title: 'Improve continuously', description: 'Use operational insight to identify friction and optimize processes over time.' },
    ],
    products: ['IBM Business Automation Workflow', 'IBM Business Automation Manager Open Editions', 'IBM Blueworks Live', 'IBM Process Mining', 'IBM Robotic Process Automation'],
    color: '#3ddbd9',
  },
  {
    page: 'content-services' as const,
    number: '02',
    title: 'Content Services',
    tagline: 'Activate trusted enterprise content',
    description: 'Turn governed enterprise content into trusted, AI-ready knowledge while maintaining security and compliance.',
    overview: 'Content Services connects documents, records, and unstructured information to the people, processes, and AI systems that need them. Securely understand, govern, and activate enterprise content while preserving context and access controls.',
    capabilities: ['Content understanding', 'Information governance', 'AI-ready repositories'],
    outcomes: [
      { title: 'Unlock information', description: 'Classify, enrich, and retrieve content so users and AI can find the right information quickly.' },
      { title: 'Build trusted AI', description: 'Ground AI experiences in governed enterprise content with permissions and context intact.' },
      { title: 'Reduce content risk', description: 'Apply consistent retention, records, security, and lifecycle policies at enterprise scale.' },
    ],
    products: ['IBM Content Cortex', 'IBM FileNet Content Manager', 'IBM Content Manager OnDemand', 'IBM Datacap', 'IBM Daeja ViewONE'],
    color: '#be95ff',
  },
  {
    page: 'decision-intelligence' as const,
    number: '03',
    title: 'Decision Intelligence',
    tagline: 'Make every decision count',
    description: 'Combine business rules, optimization, and AI to automate transparent, consistent decisions at enterprise scale.',
    overview: 'Decision Intelligence turns policies, expertise, data, and mathematical models into repeatable decisions. Automate high-volume choices, optimize constrained resources, and give teams clear control over how important decisions are made.',
    capabilities: ['Decision automation', 'Rules management', 'Mathematical optimization'],
    outcomes: [
      { title: 'Decide consistently', description: 'Apply transparent policies and business rules the same way across channels and systems.' },
      { title: 'Optimize outcomes', description: 'Find the best action across complex constraints, competing goals, and changing conditions.' },
      { title: 'Adapt with confidence', description: 'Update decision logic independently and maintain governance as requirements evolve.' },
    ],
    products: ['IBM Decision Intelligence', 'IBM Operational Decision Manager', 'IBM ILOG CPLEX Optimization Studio'],
    color: '#f1c21b',
  },
]

const businessAutomationCapabilityFilters = [
  { page: 'process-automation' as const, label: 'Process Automation', color: '#3ddbd9' },
  { page: 'content-services' as const, label: 'Content Services', color: '#be95ff' },
  { page: 'decision-intelligence' as const, label: 'Decision Intelligence', color: '#f1c21b' },
  { page: 'cp4ba' as const, label: 'CP4BA', color: '#4589ff' },
]
const allBusinessAutomationCapabilityPages = businessAutomationCapabilityFilters.map(filter => filter.page)

const IBM_ACCESS_SESSION_KEY = 'ibm-access-granted'
const SITE_ACCESS_COUNTED_KEY = 'site-access-counted'
const SITE_ACCESS_COUNTER_URL = 'https://abacus.jasoncameron.dev'
const SITE_ACCESS_COUNTER_NAMESPACE = 'business-automation-pm-ibm'
const SITE_ACCESS_COUNTER_KEY = 'site-accesses'

const IBM_PASSWORD_HASH = 'd4b720fc558f69d4e4e29c789a25f505a19b662fef228e853dcb67006536e592'

async function hashPassword(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

interface Session {
  id: string
  title: string
  description?: string
  type: SessionType
  day: string
  time: string
  location?: string
  locationUrl?: string
  inviteOnly?: boolean
  speakers: string[]
  url?: string
  track?: string
  image?: string
  imageAlt?: string
}

interface ConferenceGeneralSession {
  id: string
  title: string
  url?: string
  day: string
  time: string
  location: string
  description: string
  accessNote?: string
  activityType: string
  industry?: string
  sessionTopic?: string
  techTrack: string
  technicalLevel?: string
  speakers: { name?: string; role: string }[]
}

const sessions: Session[] = [
  // Monday Oct 26
  {
    id: 'BA-CAB',
    title: 'Client Advisory Board',
    description: 'Participation in the Client Advisory Board is by invitation only.',
    type: 'Client Advisory Board',
    day: 'Mon Oct 26',
    time: '10:00 am–12:00 pm',
    inviteOnly: true,
    speakers: [
      'Matt Vest — Program Director, Product Management, Content Services, IBM',
      'Lenny Bromberg — Program Director, Automation Intelligence and Decision Management Software, IBM',
      'Swapnil Agrawal — Senior Product Manager, IBM Business Automation Workflow, IBM',
    ],
  },
  {
    id: 'LAB-3375',
    title: 'Operationalize embedded AI in IBM Z transactions with Machine Learning for agile business intelligence',
    description: 'Unlock transactional AI on IBM z/OS with IBM z17, where AI is natively embedded across the stack. Work directly with real-world patterns that combine machine learning models and business rules to modernize core applications—without rewriting them. Learn to extract decision logic, augment it with AI, and externalize it into a governed decision layer enabling low-latency, policy-driven decisioning at scale.',
    type: 'Lab',
    day: 'Mon Oct 26',
    time: '10:00–11:30 am',
    location: 'Lab 15, Labs & Certifications',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1779438677361001CDmI',
    speakers: ['Steve Warren — Technical Specialist, IBM', 'Artem Minin — STSM & Principal Z Solution Architect, Worldwide System Center, IBM'],
  },
  {
    id: 'MUP-4643',
    title: 'Agentic Process Automation User Group, Session 1: From Automation to Autonomy',
    description: 'Get the full picture of the IBM Agentic Process Automation portfolio including what\'s new and where the roadmap is heading. Watch it all converge in an end-to-end claims demo spanning the Process Automation portfolio and watsonx Orchestrate working as a single system. Covers BWL, BAMOE, BAW, RPA, IPM, and BAI.',
    type: 'Meetup',
    day: 'Mon Oct 26',
    time: '1:00–3:00 pm',
    location: 'B202, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1787596371723001nVwN',
    speakers: ['Swapnil Agrawal — Senior Product Manager, IBM Business Automation Workflow, IBM'],
  },
  {
    id: 'MUP-4647',
    title: 'Content Services User Group Session 1: Four Platforms, One Agentic Future',
    description: 'See the full shift: four content platforms unifying into one foundation with Content Cortex backed by quantified value data. Deep dive on architecture: consolidation into a single platform, modernized MCP server built for governance and audit, out-of-the-box agent architecture with AI Gateway and AI-ready data, extensibility through Bob and MCP clients, and a Workspace bridging agent conversations with traditional UI.',
    type: 'Meetup',
    day: 'Mon Oct 26',
    time: '1:00–3:00 pm',
    location: 'B203, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1787596374152001n0OI',
    speakers: ['Matt Vest — Program Director, Product Management, Content Services, IBM'],
  },
  {
    id: 'MUP-4645',
    title: 'Decision Intelligence User Group Session 1: Where Agents Meet ROI',
    description: 'The full view: what\'s new and what\'s next for DI SaaS, DICMS, ODM, and CPLEX. Go deeper into where decision intelligence and AI agents actually meet with the ROI customers are seeing, and the business case for blending deterministic rules with agentic AI rather than choosing one over the other.',
    type: 'Meetup',
    day: 'Mon Oct 26',
    time: '1:00–3:00 pm',
    location: 'B204, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1787596372922001nvF1',
    speakers: ['Lenny Bromberg — Program Director, Automation Intelligence and Decision Management Software, IBM'],
  },
  {
    id: 'MUP-4644',
    title: 'Agentic Process Automation User Group, Session 2: From Vision to Value',
    description: 'Session 1 showed you what\'s possible — Session 2 is about how to get there. See how AI-powered development with IBM Bob accelerates building, extending, and automating across the platform. Get a practical modernization roadmap for moving from your current environment to agentic, unified capabilities.',
    type: 'Meetup',
    day: 'Mon Oct 26',
    time: '3:30–5:30 pm',
    location: 'B202, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1787596372324001nkkc',
    speakers: ['Swapnil Agrawal — Senior Product Manager, IBM Business Automation Workflow, IBM'],
  },
  {
    id: 'MUP-4648',
    title: 'Content Services User Group Session 2: Your Path to Consolidation and Trusted Governance',
    description: 'Live demos: MCP Client to MCP Server in action, and IBM Bob at work inside the platform. Get practical with a real consolidation decision framework using Helix tools, a phased migration path (metadata first, content second), and the latest roadmap highlights.',
    type: 'Meetup',
    day: 'Mon Oct 26',
    time: '3:30–5:30 pm',
    location: 'B203, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1787596374755001npeK',
    speakers: ['Matt Vest — Program Director, Product Management, Content Services, IBM'],
  },
  {
    id: 'MUP-4646',
    title: 'Decision Intelligence User Group Session 2: From Automation to Autonomy',
    description: 'Agentic decisioning in action: an end-to-end Agentic Assistant demo across real IBM DI SaaS use cases, an MCP-based look at decision authoring and execution through third-party AI assistants, and an IBM Bob + ODM/DI demo. Exclusive first look at what\'s next for IBM Decision Intelligence with a vision for scaling autonomous decisions through AI agents.',
    type: 'Meetup',
    day: 'Mon Oct 26',
    time: '3:30–5:30 pm',
    location: 'B204, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1787596373524001nSsz',
    speakers: ['Lenny Bromberg — Program Director, Automation Intelligence and Decision Management Software, IBM'],
  },

  // Tuesday Oct 27
  {
    id: 'TEC-4200',
    title: 'Modernizing IBM BAW for Agentic AI with IBM Bob and watsonx Orchestrate',
    description: 'Many enterprises depend on IBM Business Automation Workflow (BAW) for mission-critical processes, but now need agentic AI without a risky rewrite. This session shows an incremental modernization architecture using IBM BAW, IBM Bob and watsonx Orchestrate — covering BPMN reuse, BAW as deterministic control layer, Agent Tasks, Orchestrate skills, and integration patterns between processes, agents and enterprise services.',
    type: 'Breakout',
    day: 'Tue Oct 27',
    time: '11:45 am–12:30 pm',
    location: 'C113, Level 1, Building C',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1779503319744001pUZZ',
    speakers: ['Waldemar Pietrzak — Enterprise Architect, AI & Integration | IBM Champion, IBPM S.A.', 'Michal Nowoszewski — CTO | AI & Automation Executive | IBM Champion \'25 \'26, IBPM S.A.'],
  },
  {
    id: 'MTE-5681',
    title: 'Meet the Expert: Swapnil Agrawal — Business Automation, Process Automation',
    description: 'Talk with Swapnil Agrawal, Senior Product Manager for IBM Business Automation Workflow, about how IBM\'s Agentic Process Automation portfolio helps organizations automate, orchestrate, and optimize work across the enterprise. Drawing on more than a decade of hands-on experience in development, customer success, and product strategy.',
    type: 'Meet the Expert',
    day: 'Tue Oct 27',
    time: '12:30–1:00 pm',
    location: 'Tech Desk 05, Integration | AI Applications',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1790734617450001RF6h',
    speakers: ['Swapnil Agrawal — Senior Product Manager, IBM Business Automation Workflow, IBM'],
    image: asset('sessions/mte-5681.png'),
    imageAlt: 'Collectible figure of Swapnil Agrawal in Business Automation packaging with agentic process automation details',
  },
  {
    id: 'TEC-1487',
    title: 'Beyond Theory: Enterprise AI in a Manufacturing Environment',
    description: 'A real-world enterprise AI implementation delivered for Končar using IBM FileNet Content Manager, IBM Content Navigator, and IBM Content Assistant. Demonstrates how document-intensive processes were transformed into automated and insight-driven operations. Covers solution architecture, integration patterns, and practical challenges including performance, governance, security, and user adoption.',
    type: 'Breakout',
    day: 'Tue Oct 27',
    time: '1:30–2:15 pm',
    location: 'B213, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1776683141384001k6JA',
    speakers: ['Tomislav Strgar — Head of AI Department, TIS Grupa', 'Marina Sokol — Enterprise Architect, Končar d.d.'],
  },
  {
    id: 'TLK-9069',
    title: 'Transforming Crew Management with AI: IBM watsonx and IBM ODM for Smarter Crew Legality Validation',
    description: 'How modern AI capabilities were integrated with an enterprise decision management platform to enhance crew management operations. Learn how an AI-powered crew legality platform was developed to accelerate rules interpretation, generate test cases and scenarios, and assist users with rule authoring and maintenance.',
    type: 'Tech Talk',
    day: 'Tue Oct 27',
    time: '1:30–1:50 pm',
    location: 'Tech Talk 04 | 140',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1783364075417001vgyr',
    speakers: ['Sararn Velusamy — Technical Specialist, IBM Decision Intelligence & AI, CAE'],
  },
  {
    id: 'MTE-5682',
    title: 'Meet the Expert: Matt Vest — Business Automation, Content Services',
    description: 'Talk with Matt Vest, Program Director, Product Management for IBM Content Services, about how trusted enterprise content can help organizations unlock the full value of AI and automation. Discover how modern content services enable businesses to govern information, accelerate productivity, and turn content into a strategic asset.',
    type: 'Meet the Expert',
    day: 'Tue Oct 27',
    time: '2:30–3:00 pm',
    location: 'Tech Desk 05, Integration | AI Applications',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1790734829375001gIqw',
    speakers: ['Matt Vest — Program Director, Product Management, Content Services, IBM'],
    image: asset('sessions/mte-5682.png'),
    imageAlt: 'Collectible figure of Matt Vest in Business Automation packaging with IBM Content Services details',
  },
  {
    id: 'TEC-2964',
    title: 'AI and Event-Driven Workflow Automation',
    description: 'At Westfield Insurance, commercial lines endorsement requests arrive through unstructured emails requiring manual review and routing. This session shows how Westfield is modernizing that process using IBM BAW, Event-Driven Architecture, and Agentic AI. AI-driven orchestration, human-in-the-loop collaboration, and dynamic user interfaces reduce processing time while improving accuracy.',
    type: 'Breakout',
    day: 'Tue Oct 27',
    time: '2:45–3:30 pm',
    location: 'B215, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1779383001125001BeuS',
    speakers: ['Viren Bhayani — Solutions Architect, Westfield', 'Joey Perri — Application Development Engineer, Westfield'],
  },
  {
    id: 'TEC-3311',
    title: 'Classification and Security in IBM FileNet P8 in the Age of AI, RAG, and Content Cortex',
    description: 'Unstructured content stored in a content repository is a precious resource for AI, RAG, and IBM\'s Content Cortex product. P8\'s architecture natively supports taxonomy application and document security implementation. Learn how to implement a taxonomy and document security in IBM FileNet P8, and how AI and RAG rely on well-classified, properly secured content.',
    type: 'Breakout',
    day: 'Tue Oct 27',
    time: '2:45–3:30 pm',
    location: 'B217, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1779427924788001xS1F',
    speakers: ['Caleb Gattegno — ECM Architect, Content Capture Lead, New York Life Insurance Company'],
  },

  // Wednesday Oct 28
  {
    id: 'TEC-4006',
    title: 'Journey to Content Cortex: GraphQL as a Building Block for AI Agent Ready Document Storage',
    description: 'At TD Bank, the journey to modernize FileNet for 65,000+ colleagues to search, summarize, understand, and retrieve enterprise documents. This session explores Content Services GraphQL as the foundation for API-first content access, enabling modern application development, DevSecOps automation, and seamless integration with AI-powered solutions and emerging MCP-based ecosystems.',
    type: 'Breakout',
    day: 'Wed Oct 28',
    time: '10:30–11:15 am',
    location: 'B216, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1779484155755001hRNH',
    speakers: ['Sushrut Patankar — Principal Architect and Practice Area Lead, Digitization, TD Bank', 'Venky Nalla — Full Stack Architect, TD Bank'],
  },
  {
    id: 'TEC-3996',
    title: 'United Airlines: Streamlining Flight Operations with IBM BAW and AI',
    description: 'Blue Polaris partnered with United Airlines to transform flight issue resolution using IBM BAW. The solution replaces a fragmented process with a structured, automated workflow integrating with ServiceNow. Stakeholders gain real-time visibility while operations teams benefit from dramatically improved efficiency. The roadmap includes IBM ODM for automated decisioning and generative AI for issue summarization.',
    type: 'Breakout',
    day: 'Wed Oct 28',
    time: '10:30–11:15 am',
    location: 'B215, Level 2, Building B',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1779483809777001d76W',
    speakers: ['Mike Fink — Senior Developer, United Airlines', 'Jared Michalec — Partner and Head of Innovation, Blue Polaris'],
  },
  {
    id: 'MTE-5683',
    title: 'Meet the Expert: Lenny Bromberg — Business Automation, Decision Intelligence',
    description: 'Talk with Lenny Bromberg, Program Director for Automation Intelligence and Decision Management Software at IBM, about the IBM Decision Intelligence platform and how intelligent decisioning enables organizations to automate complex business decisions with confidence. Drawing on experience across technical implementation, sales, and product management.',
    type: 'Meet the Expert',
    day: 'Wed Oct 28',
    time: '12:30–1:00 pm',
    location: 'Tech Desk 05, Integration | AI Applications',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1790735000300001q0us',
    speakers: ['Lenny Bromberg — Program Director, Automation Intelligence and Decision Management Software, IBM'],
    image: asset('sessions/mte-5683.png'),
    imageAlt: 'Collectible figure of Lenny Bromberg in IBM AI packaging holding a decision flow diagram',
  },
  {
    id: 'TLK-6335',
    title: 'Business Automation User Group: BA for the AI Era — Process Automation, Content Services, Decision Intelligence',
    description: 'Discover how Process Automation, Content Services, and Decision Intelligence help organizations unlock the value of enterprise content, automate complex decisions, and optimize business operations. The latest innovations, modernization strategies, and roadmap direction across IBM\'s Business Automation portfolio including Content Cortex, Decision Intelligence, BAW, AI-powered development with IBM Bob, MCP-based extensibility, and agent-enabled experiences.',
    type: 'Tech Talk',
    day: 'Wed Oct 28',
    time: '2:00–2:30 pm',
    location: 'Theater, User Group Pavilion',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1792415713421001sTpI',
    speakers: [
      'Lenny Bromberg — Program Director, Automation Intelligence and Decision Management Software, IBM',
      'Matt Vest — Program Director, Product Management, Content Services, IBM',
      'Swapnil Agrawal — Senior Product Manager, IBM Business Automation Workflow, IBM',
    ],
  },
  {
    id: 'LAB-3267',
    title: 'Solving Real-World Content Challenges with IBM Content Cortex & Agentic AI',
    description: 'Discover agentic content automation using IBM Content Cortex. Scenario-based exercises showcasing agentic AI capabilities—automating classification and extraction of key data from documents, governance such as AI-applied legal holds, and automating compliance. Get hands-on experience with activating content for AI, reducing manual effort, and unlocking massive productivity gains.',
    type: 'Lab',
    day: 'Wed Oct 28',
    time: '4:45–6:15 pm',
    location: 'Lab 02, Labs & Certifications',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1779421579972001pQZz',
    speakers: ['Matt Vest — Program Director, Product Management, Content Services, IBM', 'Anh Tranh — Software Developer, CCx AI Services Tech Lead, IBM'],
  },

  // Thursday Oct 29
  {
    id: 'TLK-4208',
    title: 'Design AI Agents as Enterprise Components with watsonx Orchestrate and BAW',
    description: 'AI agents should not be designed as isolated chatbots or autonomous black boxes. This Tech Talk shows how to build them as enterprise components with bounded responsibility, explicit interfaces, controlled tools, governance and observability. Using watsonx Orchestrate and IBM BAW Agent Tasks, map proven architecture principles to agentic AI: workflows control execution, agents augment decisions, outputs are structured.',
    type: 'Tech Talk',
    day: 'Thu Oct 29',
    time: '9:30–9:50 am',
    location: 'Tech Talk 04 | 140',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1779503709608001EldO',
    speakers: ['Waldemar Pietrzak — Enterprise Architect, AI & Integration | IBM Champion, IBPM S.A.'],
  },
  {
    id: 'LAB-1481',
    title: 'Build AI-Powered Staff Schedules with Planning Analytics, Decision Optimization, and IBM Bob',
    description: 'Organizations often spend weeks evaluating staffing strategies using spreadsheets and manual scenario analysis. This lab demonstrates prescriptive analytics with IBM Planning Analytics, Decision Optimization (CPLEX), and IBM Bob. Create and compare staffing scenarios, use Bob as an AI coding partner to translate planning rules from plain English into optimization constraints, and execute enterprise-grade CPLEX optimization.',
    type: 'Lab',
    day: 'Thu Oct 29',
    time: '11:00 am–12:30 pm',
    location: 'Lab 02, Labs & Certifications',
    url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1776643955192001lYGZ',
    speakers: ['Brittany Bogle — Principal AI Forward Deployed Engineer, IBM Client Engineering, IBM', 'Christina Zhao — CVE, IBM Client Engineering, IBM'],
  },
]

const days = ['Mon Oct 26', 'Tue Oct 27', 'Wed Oct 28', 'Thu Oct 29']
const conferenceDays = ['Sun Oct 25', ...days]

function getInitialConferenceDay() {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find(datePart => datePart.type === type)?.value
  const conferenceDayByDate: Record<string, string> = {
    '2026-10-25': 'Sun Oct 25',
    '2026-10-26': 'Mon Oct 26',
    '2026-10-27': 'Tue Oct 27',
    '2026-10-28': 'Wed Oct 28',
    '2026-10-29': 'Thu Oct 29',
  }
  const dateKey = `${part('year')}-${part('month')}-${part('day')}`
  return conferenceDayByDate[dateKey] ?? 'Thu Oct 29'
}

const dayLabels: Record<string, string> = {
  'Sun Oct 25': 'Sunday · Oct 25',
  'Mon Oct 26': 'Monday · Oct 26',
  'Tue Oct 27': 'Tuesday · Oct 27',
  'Wed Oct 28': 'Wednesday · Oct 28',
  'Thu Oct 29': 'Thursday · Oct 29',
}

const dayAbbreviations: Record<string, string> = {
  'Sun Oct 25': 'Sun 10/25',
  'Mon Oct 26': 'Mon 10/26',
  'Tue Oct 27': 'Tue 10/27',
  'Wed Oct 28': 'Wed 10/28',
  'Thu Oct 29': 'Thu 10/29',
}

const conferenceSchedule: Record<string, {
  heading: string
  eyebrow?: string
  introduction?: string
  items: { time: string; title: string; subtitle?: string }[]
  note?: string
}> = {
  'Sun Oct 25': {
    heading: 'Sunday, 25 October',
    eyebrow: 'Speaker support',
    items: [
      { time: '12:00 PM–6:00 PM', title: 'Speaker Ready Room', subtitle: 'Room C111 - Level 1 · Building C' },
    ],
  },
  'Mon Oct 26': {
    heading: 'Monday, 26 October',
    eyebrow: 'Pre-conference activities',
    introduction: 'Featuring hands-on learning, certification testing, peer connection and tailored experiences',
    items: [
      { time: '10:00 AM–5:45 PM', title: 'Hands-on labs' },
      { time: '8:30 AM–5:45 PM', title: 'Certification testing (last seating 4:00 PM)' },
      { time: '10:00 AM–5:30 PM', title: 'Partner Day — Activities open only to Business Partners registered to attend' },
      { time: '10:00 AM–5:30 PM', title: 'User Group Meetups' },
      { time: '9:00 AM–6:00 PM', title: 'Speaker Ready Room', subtitle: 'Room C111 - Level 1 · Building C' },
      { time: '6:00 PM–9:00 PM', title: 'Opening Night Block Party at Sandbox Expo' },
    ],
    note: 'Jumpstart your week at the Opening Night Block Party! Reconnect with peers and familiar faces, explore the Sandbox, and get inspired before sessions officially start on Tuesday.',
  },
  'Tue Oct 27': {
    heading: 'Tuesday, 27 October',
    items: [
      { time: '7:00 AM–9:00 AM', title: 'Breakfast' },
      { time: '9:00 AM–10:00 AM', title: 'Make Your Agents Enterprise Ready' },
      { time: '1:30 PM–2:30 PM', title: 'The Future of Software Development in the Age of AI' },
      { time: '10:00 AM–5:00 PM', title: 'Sandbox Expo open' },
      { time: '10:30 AM–6:15 PM', title: 'Hands-on labs' },
      { time: '10:30 AM–6:00 PM', title: 'Certification testing (last seating 4:30 PM)' },
      { time: '10:30 AM–5:00 PM', title: 'Technology Breakouts, Meet the Experts, Live Demos, and Tech Talks' },
      { time: '12:00 PM–2:00 PM', title: 'Lunch and networking' },
      { time: '8:00 AM–6:30 PM', title: 'Speaker Ready Room', subtitle: 'Room C111 - Level 1 · Building C' },
    ],
  },
  'Wed Oct 28': {
    heading: 'Wednesday, 28 October',
    items: [
      { time: '7:00 AM–9:00 AM', title: 'Breakfast' },
      { time: '9:00 AM–10:00 AM', title: 'The Future: Built by You' },
      { time: '1:30 PM–2:30 PM', title: 'Finding Your Next Move: Reinvention in the Age of AI' },
      { time: '10:00 AM–5:00 PM', title: 'Sandbox Expo open' },
      { time: '10:30 AM–6:15 PM', title: 'Hands-on labs' },
      { time: '10:30 AM–6:00 PM', title: 'Certification testing (last seating 4:30 PM)' },
      { time: '10:30 AM–5:00 PM', title: 'Technology Breakouts, Meet the Experts, Live Demos, and Tech Talks' },
      { time: '12:00 PM–2:00 PM', title: 'Lunch and networking' },
      { time: '8:00 AM–6:30 PM', title: 'Speaker Ready Room', subtitle: 'Room C111 - Level 1 · Building C' },
      { time: '7:00 PM–10:00 PM', title: 'IBM TechXchange Unplugged — An Evening at Georgia Aquarium and World of Coca-Cola' },
    ],
  },
  'Thu Oct 29': {
    heading: 'Thursday, 29 October',
    items: [
      { time: '7:00 AM–9:00 AM', title: 'Breakfast' },
      { time: '9:00 AM–11:30 AM', title: 'Technology Breakouts, Meet the Experts, Live Demos, and Tech Talks' },
      { time: '9:00 AM–12:00 PM', title: 'Sandbox Expo open' },
      { time: '9:00 AM–12:30 PM', title: 'Hands-on labs' },
      { time: '9:00 AM–12:30 PM', title: 'Certification testing (last seating 11:00 AM)' },
      { time: '8:00 AM–12:30 PM', title: 'Speaker Ready Room', subtitle: 'Room C111 - Level 1 · Building C' },
    ],
  },
}

const generalSessions: ConferenceGeneralSession[] = [{
  id: 'GEN-5572',
  title: 'Make Your Agents Enterprise Ready',
  url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1790115059212001fgKJ',
  day: 'Tue Oct 27',
  time: '9:00 AM–10:00 AM',
  location: 'General Session, Hall B4, Building B, GWCC',
  description: 'Agents are changing how applications are built and how work gets done. Our day one general session will explore what it takes to make them work across the enterprise. Expect live demos, real-world examples and a first look at the latest from IBM, with practical insight into how these technologies come together to turn agentic potential into enterprise impact.',
  accessNote: 'Doors open at 8:30 a.m. Reserved seating will be released at 8:50 a.m. The program begins promptly at 9:00 a.m.',
  activityType: 'General Session',
  industry: 'Cross Industry',
  sessionTopic: 'Hybrid Cloud, Business Automation, FinOps, Databases, Engineering Lifecycle Management, Infrastructure Lifecycle Management, Mainframe Storage, Data Management and Integration, Agentic AI, AI-Assisted Software Development, AI Infrastructure, All-Flash Storage, Business Analytics & Intelligence, Cryptography, Data Governance & Security, Data Intelligence, Data Protection, DevOps & Site Reliability Engineering, IBM Z and LinuxONE, Infrastructure as Code, Large Language Models, Mission-Critical Applications, Mission-Critical Infrastructure, Non Human identity, Operational Resilience, Platform Engineering, Power & IBM i Modernization, Secrets Management, Sovereignty, Agentic Identity Access Management, Quantum',
  techTrack: 'AI Applications, Data Management, Hybrid Cloud Management, Security & Governance, Infrastructure',
  technicalLevel: 'Introductory Level',
  speakers: [
    { name: 'Dinesh Nirmal', role: 'Senior Vice President, IBM Software, IBM' },
    { name: 'Neel Sundaresan', role: 'General Manager, Automation and AI, IBM' },
    { name: 'SC', role: 'GM, IBM Data and Confluent, IBM' },
    { name: 'Tyler Lynch', role: 'Outbound CTO, IBM Automation, IBM' },
    { name: 'KG', role: 'Field CTO, Data, IBM' },
    { name: 'SV', role: 'Vice President, Security Products, IBM' },
    { name: 'Arvid Ottenberg', role: 'Product Manager IBM Bob, IBM' },
  ],
}, {
  id: 'GEN-5607',
  title: 'The Future of Software Development in the Age of AI',
  url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1790339030684001eXz4',
  day: 'Tue Oct 27',
  time: '1:30 PM–2:30 PM',
  location: 'General Session, Hall B4, Building B, GWCC',
  description: 'AI is transforming every aspect of software development, from coding and testing to deployment, operations, and governance. Join industry leaders for a discussion on how leading development teams are putting AI to work today, the skills developers will need over the next 12 to 24 months, and how organizations can embrace innovation while building responsible, trustworthy AI systems. Walk away with practical insights, real-world examples, and a clearer view of how AI is reshaping the future of software development.',
  activityType: 'General Session',
  sessionTopic: 'Agentic AI, DevOps & Site Reliability Engineering',
  techTrack: 'AI Applications, Data Management, Hybrid Cloud Management, Security & Governance, Infrastructure',
  speakers: [
    { role: 'VP, AI Developer Relations, IBM' },
    { role: 'Vice President, Corporate Social Responsibility, and Chief Impact Officer, IBM' },
    { role: 'Founder & CEO, NeuralSeek' },
    { role: 'Founder & CEO, O’Reilly Media' },
  ],
}, {
  id: 'GEN-5821',
  title: 'The Future: Built by You',
  url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1791474637517001mYaJ',
  day: 'Wed Oct 28',
  time: '9:00 AM–10:00 AM',
  location: 'General Session, Hall B4, Building B, GWCC',
  description: 'The next generation of technology won’t just be intelligent. It will be built on systems that can act. This keynote puts you at the center of that shift, designing, building and running the applications and infrastructure that make up the next enterprise stack. See the latest innovations from IBM in action and how they can help you build what comes next.',
  accessNote: 'Doors open at 8:30 a.m. Reserved seating will be released at 8:50 a.m. The program begins promptly at 9:00 a.m.',
  activityType: 'General Session',
  techTrack: 'AI Applications, Data Management, Hybrid Cloud Management, Security & Governance, Infrastructure',
  technicalLevel: 'Intermediate Level',
  speakers: [
    { role: 'General Manager, Automation and AI, IBM' },
    { role: 'CTO & SVP of Global Engineering, Red Hat, an IBM Company' },
    { role: 'CTO and GM of Innovation, IBM Infrastructure; IBM Fellow, IBM' },
    { role: 'Engineering Director, Meta' },
    { role: 'Director, Cybersecurity Developer Relations, Nvidia' },
    { role: 'Product Manager — IBM Bob, IBM' },
    { role: 'Director, Product Management, IBM' },
  ],
}, {
  id: 'GEN-5608',
  title: 'Finding Your Next Move: Reinvention in the Age of AI',
  url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1790339456694001e0s3',
  day: 'Wed Oct 28',
  time: '1:30 PM–2:30 PM',
  location: 'General Session, Hall B4, Building B, GWCC',
  description: 'Join legendary skateboarder Rodney Mullen and Chris Wright, CTO of Red Hat, for a candid conversation on how radical adaptation, reinvention, and community-driven innovation can transform not only your technical craft in the age of AI, but your identity and purpose as a technologist.',
  activityType: 'General Session',
  techTrack: 'AI Applications, Data Management, Hybrid Cloud Management, Security & Governance, Infrastructure',
  speakers: [
    { name: 'Chris Wright', role: 'CTO & SVP of Global Engineering, Red Hat, an IBM Company' },
    { name: 'Rodney Mullen', role: 'Skater, Skatrix' },
    { role: 'VP, AI Developer Relations, IBM' },
  ],
}]

const typeConfig: Record<SessionType, { label: string; color: string; bg: string; dot: string }> = {
  'Lab': {
    label: 'Hands-on Lab',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/60 border-emerald-800/40',
    dot: 'bg-emerald-400',
  },
  'Meet the Expert': {
    label: 'Meet the Expert',
    color: 'text-violet-300',
    bg: 'bg-violet-950/60 border-violet-800/40',
    dot: 'bg-violet-400',
  },
  'Meetup': {
    label: 'User Group Meetup',
    color: 'text-amber-300',
    bg: 'bg-amber-950/60 border-amber-800/40',
    dot: 'bg-amber-400',
  },
  'Tech Talk': {
    label: 'Tech Talk',
    color: 'text-sky-300',
    bg: 'bg-sky-950/60 border-sky-800/40',
    dot: 'bg-sky-400',
  },
  'Breakout': {
    label: 'Technology Breakout',
    color: 'text-rose-300',
    bg: 'bg-rose-950/60 border-rose-800/40',
    dot: 'bg-rose-400',
  },
  'Client Advisory Board': {
    label: 'Client Advisory Board',
    color: 'text-cyan-300',
    bg: 'bg-cyan-950/60 border-cyan-800/40',
    dot: 'bg-cyan-400',
  },
}

const allTypes = Object.keys(typeConfig) as SessionType[]
const typeAbbreviations: Record<SessionType, string> = {
  'Lab': 'LAB',
  'Meet the Expert': 'MTE',
  'Meetup': 'MUP',
  'Tech Talk': 'TLK',
  'Breakout': 'TEC',
  'Client Advisory Board': 'CAB',
}
const sessionTypeDropdownLabels: Record<SessionType, string> = {
  'Client Advisory Board': 'CAB - Client Advisory Board',
  'Meetup': 'MUP - Meetup / User Group',
  'Lab': 'LAB - Lab',
  'Meet the Expert': 'MTE - Meet the Expert',
  'Tech Talk': 'TLK - Tech Talk',
  'Breakout': 'TEC - Technology Breakout',
}
const featuredSpeakers = [
  { label: 'Matt Vest', name: 'Matt Vest', indicator: 'MV' },
  { label: 'Swapnil Agrawal', name: 'Swapnil Agrawal', indicator: 'SA' },
  { label: 'Lenny Bromberg', name: 'Lenny Bromberg', indicator: 'LB' },
]
const mainPageSpeakerIndicators = [featuredSpeakers[0], featuredSpeakers[2], featuredSpeakers[1]]
const conferenceSpeakerFilters = [featuredSpeakers[0], featuredSpeakers[2], featuredSpeakers[1]]

const venueMaps = [
  { src: asset('maps/map-01.png'), title: 'Georgia World Congress Center', description: 'GWCC campus, conference buildings, hotels, and nearby attractions' },
  { src: asset('maps/map-02.png'), title: 'Experience building blocks', description: 'General sessions, learning zones, Sandbox, registration, and connector routes' },
  { src: asset('maps/map-03.png'), title: 'Sandbox floor plan', description: 'Bird’s-eye overview of neighborhoods, hubs, studios, and community spaces' },
  { src: asset('maps/map-04.png'), title: 'General Session and MeetingZone', description: 'Bird’s-eye view of the General Session hall, meal areas, and MeetingZone' },
  { src: asset('maps/map-05.png'), title: 'MeetingZone', description: 'Detailed bird’s-eye view of the MeetingZone and surrounding spaces' },
  { src: asset('maps/map-06.png'), title: 'Tech Talk stage numbers', description: 'Sandbox neighborhoods, locations, and Tech Talk stages 1–9' },
  { src: asset('maps/map-07.png'), title: 'Tier 1 neighborhood product mapping', description: 'Product locations across AI Applications, Data Management, Security, Infrastructure, and Hybrid Cloud Management' },
  { src: asset('maps/map-08.png'), title: 'Sandbox entrance', description: 'Entrance view and orientation map' },
  { src: asset('maps/map-09.png'), title: 'Sandbox left main aisle', description: 'Left main aisle view from the Sandbox entrance' },
  { src: asset('maps/map-10.png'), title: 'Sandbox right main aisle', description: 'Right main aisle view from the Sandbox entrance' },
  { src: asset('maps/map-11.png'), title: 'Celebration Wall', description: 'Booth 700 photo-post wall elevation and Sandbox location' },
  { src: asset('maps/map-12.png'), title: 'IBM Bob floor plan', description: 'Booth 520 component layout, co-located spaces, and Sandbox location' },
  { src: asset('maps/map-13.png'), title: 'IBM Bob booth rendering', description: 'Three-dimensional view of booth 520 and its experience components' },
  { src: asset('maps/map-14.png'), title: 'AI Applications floor plan', description: 'Booth 550 component plan for Business Automation, analytics, and agentic AI' },
  { src: asset('maps/map-15.png'), title: 'AI Applications neighborhood — view one', description: 'Three-dimensional view of the AI Applications neighborhood' },
  { src: asset('maps/map-16.png'), title: 'AI Applications neighborhood — view two', description: 'Alternate three-dimensional view with the Tech Talk stage' },
  { src: asset('maps/map-17.png'), title: 'AI Sports Club floor plan', description: 'Booth 180 components, activity areas, and Sandbox location' },
  { src: asset('maps/map-18.png'), title: 'AI Sports Club elevation', description: 'Front elevation of the AI Sports Club experience' },
  { src: asset('maps/map-19.png'), title: 'AI Sports Club booth rendering', description: 'Three-dimensional overview of booth 180 and its components' },
]

const conferenceInfo = [
  { src: asset('info/info-01.png'), title: 'Get Your Ship Together with Shipworks!', description: 'Mobile gaming experience, activities, daily prizes, and Flight School details' },
  { src: asset('info/info-02.png'), title: 'Hands-on Labs', description: 'Pre-conference preparation, on-site admission order, floor plan, and lab support' },
  { src: asset('info/info-03.png'), title: 'Impact Hub', description: 'Volunteer activity overview, location, schedule, and participation details' },
  { src: asset('info/info-04.png'), title: 'Networking & Entertainment', description: 'Opening Night Block Party and IBM TechXchange Unplugged event overview' },
  { src: asset('info/info-05.png'), title: 'IBM TechXchange Unplugged', description: 'Event details, admission requirements, transportation, food, and drinks' },
  { src: asset('info/info-06.png'), title: 'IBM Events Mobile App', description: 'Download instructions and highlights for agenda, messaging, curation, and MeetingZone' },
  { src: asset('info/info-07.png'), title: 'General Sessions & Livestream', description: 'Livestream resources and featured general-session schedule' },
  { src: asset('info/info-08.png'), title: 'Social', description: 'TechXchange 2026 social-sharing assets and suggested copy' },
  { src: asset('info/info-09.png'), title: 'Important to Know — event services', description: 'Session catalog, registration, accessibility, reflection room, and event support' },
  { src: asset('info/info-10.png'), title: 'Important to Know — safety and transportation', description: 'Health, safety, first aid, transportation, hotel, MARTA, and parking information' },
]

const meetingZoneResourceGroups = [
  {
    title: 'Meeting Zone Resources',
    links: [
      {
        name: 'Meeting Zone Dashboard',
        url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/meetingzonerequest/page/meetingsattxcdashboard',
      },
      {
        name: 'Meeting Zone Request (IBMers only)',
        url: 'http://ibm.biz/txc-meeting-zone-request',
      },
      {
        name: 'Host Request Form (Select AI and Data)',
        url: 'https://ibm.biz/txc-meeting-host',
      },
    ],
  },
  {
    title: 'Additional Information',
    links: [
      {
        name: 'MeetingZone Dashboard FAQs',
        url: 'https://reg.tools.ibm.com/flow/ibm/techxchange26/meetingzonefaq/page/faq',
      },
      {
        name: 'MeetingZone Details on Seismic',
        url: 'https://ibm.seismic.com/Link/Content/DCB2XdCMQqRPT89WgD7dJbFcQXBj#/?anchorId=e077a616-cbb7-4585-94a1-8e2ef0d5f979',
      },
    ],
  },
]

const meetingZoneNotes = [
  'IBMers must submit meeting requests on behalf of clients and partners.',
  'Clients and partners cannot book meetings directly.',
  'Hosts review meeting requests individually, so allow adequate time for review and approval.',
]

const referenceInfoGroups = [
  {
    title: 'Resources',
    links: [
      { name: 'IBM TechXchange FAQ', url: 'https://www.ibm.com/events/techxchange/faq' },
      { name: 'IBM Product Hub on YouTube', url: 'https://ibm.biz/business-automation-youtube' },
      { name: 'IBM Content Cortex', url: 'https://ibm.biz/content-cortex-info' },
      { name: 'IBM Content Cortex Demos', url: 'https://ibm.biz/content-cortex-demo' },
      { name: 'IBM Content Cortex AI Agents', url: 'https://ibm.biz/ccx-ai-agents' },
      { name: 'IBM Decision Intelligence', url: 'https://ibm.biz/decision-intelligence-info' },
    ],
  },
  {
    title: 'User Connects',
    links: [
      { name: 'Business Automation Workflow', url: 'https://ibm.biz/uc-business-automation-workflow' },
      { name: 'Decision Intelligence', url: 'https://ibm.biz/uc-decision-intelligence' },
      { name: 'Content Services', url: 'https://ibm.biz/uc-content-services' },
    ],
  },
]

const infoReferenceInfoGroups = referenceInfoGroups.map(group => ({
  ...group,
  links: [
    ...group.links.filter(link => ![
      'IBM Content Cortex',
      'IBM Content Cortex Demos',
      'IBM Content Cortex AI Agents',
      'IBM Decision Intelligence',
    ].includes(link.name)),
    ...(group.title === 'Resources'
      ? [{ name: 'IBM Events on the App Store', url: 'https://apps.apple.com/us/app/ibm-events/id1445946145' }]
      : []),
  ],
}))

const userConnectCommunities = [
  {
    name: 'Cloud Pak for Business Automation',
    capability: 'cp4ba',
    url: 'https://community.ibm.com/community/user/groups/community-home/recent-community-events?communitykey=65a0df07-3745-40d1-a699-304350bd38fc',
    description: 'Community for IBM Cloud Pak for Business Automation users — IBM’s integrated automation platform combining content management, workflow, decisions, capture, and RPA capabilities in a unified, containerized solution. Members discuss deployment, configuration, integration patterns, and best practices across the full Cloud Pak automation stack.',
    products: [
      'IBM Cloud Pak for Business Automation',
      'IBM Business Automation Workflow (BAW)',
      'IBM Operational Decision Manager (ODM)',
      'IBM Content Cortex (previously FNCM)',
      'IBM Datacap',
      'IBM RPA (WDG Automation)',
      'IBM Process Mining',
    ],
  },
  {
    name: 'Content Services (Content Management and Capture)',
    capability: 'content-services',
    url: 'https://community.ibm.com/community/user/groups/community-home/recent-community-events?communitykey=2b67f465-a5fe-4a66-ad25-f5e767b607e3',
    description: 'Community for IBM content management and capture platform users, covering document management, records management, content capture, and viewing solutions.',
    products: [
      'IBM Content Cortex',
      'IBM FileNet P8 Platform',
      'IBM FileNet Content Manager',
      'IBM Content Foundation',
      'IBM Content Manager OnDemand',
      'IBM Content Manager (Enterprise Edition)',
      'IBM Daeja ViewONE',
      'IBM Datacap',
      'IBM Automation Document Processing (Capture)',
    ],
  },
  {
    name: 'Business Automation Workflow (BPM, Workflow, and Case)',
    capability: 'process-automation',
    url: 'https://community.ibm.com/community/user/groups/community-home/recent-community-events?communitykey=810abde6-3916-441b-aac3-b9105bb37e3c',
    description: 'Community for IBM Business Process Manager (BPM), IBM Business Automation Workflow (BAW), and IBM Advanced Case Manager users. Covers process automation, workflow design, case management, and related integrations.',
    products: [
      'IBM Business Process Manager (BPM Server)',
      'IBM Business Process Manager Advanced (ESB)',
      'IBM Business Automation Workflow (BAW)',
      'IBM BAW (Advanced Case Manager)',
    ],
  },
  {
    name: 'Decision Intelligence (Decision Management & Intelligence (ODM, DI))',
    capability: 'decision-intelligence',
    url: 'https://community.ibm.com/community/user/groups/community-home/recent-community-events?communitykey=c0005a22-520b-4181-bfad-feffd8bdc022',
    description: 'Community for IBM Operational Decision Manager (ODM) and Decision Intelligence users. Focuses on business rules, decision automation, and AI-driven decision management.',
    products: [
      'IBM Operational Decision Manager (ODM)',
      'IBM Decision Intelligence (SaaS)',
      'IBM Decision Intelligence Client Managed Services (DICMS)',
      'IBM Decision Optimization (CPLEX)',
    ],
  },
  {
    name: 'Open Editions (BAMOE)',
    capability: 'process-automation',
    url: 'https://community.ibm.com/community/user/groups/community-home/recent-community-events?communitykey=6c04b811-cff1-4f31-bb5c-0185982de671',
    description: 'Community for IBM Business Automation Manager Open Editions (BAMOE) users, covering open-source-based process and decision automation built on Kogito and Drools.',
    products: ['IBM Business Automation Manager Open Editions (BAMOE)'],
  },
  {
    name: 'Robotic Process Automation (RPA)',
    capability: 'process-automation',
    url: 'https://community.ibm.com/community/user/groups/community-home/recent-community-events?communitykey=8e1faacf-120e-4d65-b013-c14cc0e27c04',
    description: 'Community for IBM RPA (formerly WDG Automation) users, focused on robotic process automation, bot development, attended and unattended automation, and workforce orchestration.',
    products: ['IBM RPA (WDG Automation)'],
  },
  {
    name: 'Blueworks Live',
    capability: 'process-automation',
    url: 'https://community.ibm.com/community/user/groups/community-home/recent-community-events?communitykey=6209ec75-bc9a-4b5f-9611-65d286eb7379',
    description: 'Community for IBM Blueworks Live users — IBM’s cloud-native business process discovery and documentation tool. Members share best practices for process mapping, collaboration, process improvement, and connecting Blueworks Live workflows to broader automation initiatives.',
    products: ['IBM Blueworks Live'],
  },
  {
    name: 'Process Mining',
    capability: 'process-automation',
    url: 'https://community.ibm.com/community/user/groups/community-home/recent-community-events?communitykey=347f0b63-ba83-42bb-a040-85d25f9b661a',
    description: 'Community for IBM Process Mining users, focused on data-driven process discovery, conformance checking, and continuous process improvement. Members discuss mining techniques, integration with ERP and BPM systems, and applying AI-powered insights to optimize end-to-end processes.',
    products: ['IBM Process Mining'],
  },
]

const communityCapabilityOptions = businessAutomationCapabilityFilters.map(filter => ({
  id: filter.page as string,
  label: filter.label,
  color: filter.color,
}))
const communityProductsByCapability = new Map<string, string[]>(
  communityCapabilityOptions.map(option => [
    option.id,
    Array.from(new Set(userConnectCommunities.filter(community => community.capability === option.id).flatMap(community => community.products))),
  ]),
)

const communityProductOptions = Array.from(new Set(userConnectCommunities.flatMap(community => community.products)))
  .sort((a, b) => a.localeCompare(b))
  .map(product => ({ id: product, label: product }))

type LetsCreateSection = 'yourlearning' | 'navattic' | 'jam-in-a-box' | 'irt-solutions'

interface LetsCreateAsset {
  name: string
  description: string
  url: string
  // When set, the asset opens this page inside the site instead of the external url.
  page?: Page
  section: LetsCreateSection
  capability: PortfolioResourcePage
  products: string[]
}

const letsCreateSections: { id: LetsCreateSection; label: string; description: string }[] = [
  { id: 'yourlearning', label: 'YourLearning Enablement', description: 'Courses, learning paths, and enablement sessions in IBM YourLearning.' },
  { id: 'navattic', label: 'Navattic', description: 'Interactive product demos built with Navattic.' },
  { id: 'jam-in-a-box', label: 'Jam-in-a-Box', description: 'Jam-in-a-Box assets.' },
  { id: 'irt-solutions', label: 'IRT Solutions', description: 'IRT Solutions assets.' },
]

// Add assets here. Each one is placed in a section and tagged with one capability
// and the products it relates to; the filters on the page use those tags.
// Products must match names in letsCreateProductsByCapability below.
const letsCreateAssets: LetsCreateAsset[] = [
  {
    name: 'Onboarding Automation',
    description: 'Content and document services demo: Focus Corp accelerates employee onboarding with teamspaces, redaction, video bookmarks, and secure external file sharing, then launches a workflow to complete the process.',
    url: '#onboarding-automation-top',
    page: 'onboarding-automation',
    section: 'yourlearning',
    capability: 'content-services',
    products: ['IBM FileNet Content Manager'],
  },
]

const letsCreateProductsByCapability = new Map<string, string[]>([
  ...businessAutomationCapabilities.map(capability => [capability.page as string, capability.products] as [string, string[]]),
  ['cp4ba', ['IBM Cloud Pak for Business Automation']],
])
const letsCreateProductOptions = Array.from(new Set([...letsCreateProductsByCapability.values()].flat()))
  .sort((a, b) => a.localeCompare(b))
  .map(product => ({ id: product, label: product }))

type BadgeEntry = {
  id: string
  capabilities: PortfolioResourcePage[]
  products: string[]
  levels: number[]
  description: string
  name: string
  criteria: string[]
  note?: string
  badgeUrl?: string
  ibmUrl?: string
  bpUrl?: string
  bpAvailable?: boolean
}

// badgeUrl = badge page, ibmUrl = IBM details, bpUrl = Business Partner details (a link only shows once set).
const badgeEntries: BadgeEntry[] = ([
  {
    id: 'cp4ba-sales-foundation-v2',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/cloud-pak-for-business-automation-sales-foundation-v2',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-9EFCCE0B38A9',
    bpUrl: 'https://learn.ibm.com/course/view.php?id=10693',
    capabilities: ['cp4ba', 'process-automation', 'content-services', 'decision-intelligence'],
    products: ['IBM Cloud Pak for Business Automation', 'IBM Business Automation Workflow', 'IBM Operational Decision Manager', 'IBM Content Cortex', 'IBM Process Mining', 'IBM Robotic Process Automation'],
    levels: [1, 2],
    description: 'Recognizes a foundational understanding of IBM Cloud Pak for Business Automation across its process, decision, content and automation capabilities. Earned by completing the Level 1 and Level 2 learning in each area, it shows you can position the platform in sales conversations.',
    name: 'Cloud Pak for Business Automation Sales Foundation V2',
    criteria: [
      'Cloud Pak for Business Automation Fundamentals Level 1',
      'Cloud Pak for Business Automation Level 2',
      'Cloud Pak for Business Automation Workflow and Decisions Level 2',
      'Cloud Pak for Business Automation Content Services and Document Processing Level 2',
      'Introduction to Robotic Process Automation and Process Mining Level 2',
    ],
  },
  {
    id: 'cp4ba-intermediate',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/cloud-pak-for-business-automation-technical-sales-intermediate',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-53EEA5E1D574',
    bpUrl: 'https://learn.ibm.com/course/view.php?id=10559',
    capabilities: ['cp4ba'],
    products: ['IBM Cloud Pak for Business Automation'],
    levels: [3],
    description: 'Recognizes the ability to demonstrate IBM Cloud Pak for Business Automation. Earned by completing the Level 3 demos learning, it builds on a sales foundation with hands-on, presentation-ready skills.',
    name: 'Cloud Pak for Business Automation Intermediate',
    criteria: ['Cloud Pak for Business Automation Demos Level 3'],
  },
  {
    id: 'cp4ba-practitioner-advanced',
    badgeUrl: 'https://w3.ibm.com/hr/badge-me/badge/6a7f5015ea32c286d576b426',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-42B11C97C724',
    bpUrl: 'https://www.ibm.com/training/learning-path/cloud-pak-for-business-automation-level-4-1150',
    capabilities: ['cp4ba'],
    products: ['IBM Cloud Pak for Business Automation'],
    levels: [4],
    description: 'Recognizes advanced, practitioner-level knowledge of IBM Cloud Pak for Business Automation. Earned by completing the Level 4 learning, it shows you can go deep on the platform with clients.',
    name: 'Cloud Pak for Business Automation Practitioner Advanced',
    criteria: ['Cloud Pak for Business Automation Level 4'],
  },
  {
    id: 'cp4ba-practitioner-mastery',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/cloud-pak-for-business-automation-practitioner-mast',
    ibmUrl: 'https://w3.ibm.com/hr/badge-me/badge/6ab171653a52acd3d387ccfd',
    capabilities: ['cp4ba'],
    products: ['IBM Cloud Pak for Business Automation'],
    levels: [5],
    description: 'The highest Cloud Pak for Business Automation recognition. It builds on the Practitioner Advanced badge and is awarded to people who have contributed to internal and external communities beyond individual product mastery.',
    name: 'Cloud Pak for Business Automation Practitioner Mastery',
    criteria: ['Cloud Pak for Business Automation Practitioner Advanced badge'],
    note: 'Applicant must provide examples of internal and external community contributions that show that they have gone beyond individual product mastery.',
    bpAvailable: false,
  },
  {
    id: 'decision-intelligence-sales-foundation',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/decision-intelligence-sales-foundation',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-C3AC3CC70D46',
    bpUrl: 'https://learn.ibm.com/course/view.php?id=18216',
    capabilities: ['decision-intelligence'],
    products: ['IBM Decision Intelligence'],
    levels: [1, 2],
    description: 'Recognizes a foundational understanding of IBM Decision Intelligence and how AI agents fit into automated decisions. Earned by completing AI Agents Level 1 and Decision Intelligence Level 2.',
    name: 'Decision Intelligence Sales Foundation',
    criteria: ['AI Agents Level 1', 'Decision Intelligence Level 2'],
  },
  {
    id: 'process-mining-intermediate',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/process-mining-technical-sales-intermediate',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-DBB5BBD2F053',
    bpUrl: 'https://learn.ibm.com/course/view.php?id=11750',
    capabilities: ['process-automation'],
    products: ['IBM Process Mining'],
    levels: [3],
    description: 'Recognizes intermediate technical sales knowledge of IBM Process Mining. Earned by completing the Level 3 learning.',
    name: 'Process Mining Intermediate',
    criteria: ['Process Mining Level 3'],
  },
  {
    id: 'process-mining-practitioner-advanced',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/ibm-process-mining-practitioner-advanced',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-9763E3E62DE8',
    bpUrl: 'https://www.ibm.com/training/learning-path/ibm-process-mining-for-practitioner-level-4-823',
    capabilities: ['process-automation'],
    products: ['IBM Process Mining'],
    levels: [4],
    description: 'Recognizes advanced, practitioner-level skills with IBM Process Mining. Earned by completing the Level 4 learning and applying it with a client.',
    name: 'Process Mining Practitioner Advanced',
    criteria: ['IBM Process Mining for Practitioner Level 4'],
    note: 'IBMers must apply this learning with a client and complete an application form detailing their interaction.',
  },
  {
    id: 'rpa-intermediate',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/robotic-process-automation-technical-sales-intermediate',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-B196DBDC3714',
    bpUrl: 'https://learn.ibm.com/course/view.php?id=11649',
    capabilities: ['process-automation'],
    products: ['IBM Robotic Process Automation'],
    levels: [3],
    description: 'Recognizes intermediate technical sales knowledge of IBM Robotic Process Automation. Earned by completing the Level 3 learning.',
    name: 'Robotic Process Automation Intermediate',
    criteria: ['Robotic Process Automation Level 3'],
  },
  {
    id: 'bamoe-sales-foundation',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/business-automation-manager-open-editions-sales-foundation',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-A6DD18069FE4',
    bpUrl: 'https://learn.ibm.com/course/view.php?id=11956',
    capabilities: ['process-automation', 'decision-intelligence'],
    products: ['IBM Business Automation Manager Open Editions'],
    levels: [1, 2],
    description: 'Recognizes a foundational understanding of IBM Business Automation Manager Open Editions, covering both Decision Manager Open Edition and Process Automation Manager Open Edition. Earned by completing the Level 1 and Level 2 learning.',
    name: 'Business Automation Manager Open Editions Sales Foundation',
    criteria: [
      'Business Automation Manager Open Editions Fundamentals Level 1',
      'Decision Manager Open Edition Level 2',
      'Process Automation Manager Open Edition Level 2',
    ],
  },
  {
    id: 'decision-manager-oe-intermediate',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/decision-manager-open-edition-technical-sales-intermediate',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-1516B2F8638E',
    bpUrl: 'https://learn.ibm.com/course/view.php?id=12239',
    capabilities: ['decision-intelligence'],
    products: ['IBM Business Automation Manager Open Editions'],
    levels: [3],
    description: 'Recognizes intermediate technical sales knowledge of Decision Manager Open Edition. Earned by completing the Level 3 learning.',
    name: 'Decision Manager Open Edition Intermediate',
    criteria: ['Decision Manager Open Edition Level 3'],
  },
  {
    id: 'process-automation-manager-oe-intermediate',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/process-automation-manager-open-edition-technical-sales-intermediate',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-ACBC2C121799',
    bpUrl: 'https://learn.ibm.com/course/view.php?id=12296',
    capabilities: ['process-automation'],
    products: ['IBM Business Automation Manager Open Editions'],
    levels: [3],
    description: 'Recognizes intermediate technical sales knowledge of Process Automation Manager Open Edition. Earned by completing the Level 3 learning.',
    name: 'Process Automation Manager Open Edition Intermediate',
    criteria: ['Process Automation Manager Open Edition Level 3'],
  },
  {
    id: 'filenet-technical-sales-advanced',
    badgeUrl: 'https://www.credly.com/org/ibm/badge/filenet-content-manager-technical-sales-advanced',
    ibmUrl: 'https://yourlearning.ibm.com/activity/PLAN-AF8DE95A7D19',
    bpUrl: 'https://www.ibm.com/training/learning-path/filenet-content-manager-for-technical-sales-level-4-915',
    capabilities: ['content-services'],
    products: ['IBM Content Cortex'],
    levels: [4],
    description: 'Recognizes advanced technical sales skills with Content Cortex (formerly FileNet Content Manager). Earned by completing the Level 4 learning and applying it with a client.',
    name: 'Content Cortex (formerly FileNet Content Manager) Technical Sales Advanced',
    criteria: ['Content Cortex (formerly FileNet Content Manager) for Technical Sales Level 4'],
    note: 'IBMers must apply this learning with a client and complete an application form detailing their interaction.',
  },
] as BadgeEntry[]).sort((a, b) => a.name.localeCompare(b.name))

function BadgesPage() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(true)
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<PortfolioResourcePage>>(() => new Set(businessAutomationCapabilityFilters.map(filter => filter.page)))
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(() => new Set(badgeEntries.flatMap(badge => badge.products)))
  const badgeLevels = [1, 2, 3, 4, 5]
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(() => new Set(badgeLevels))
  const [expandedBadges, setExpandedBadges] = useState<Set<string>>(new Set())
  useEffect(() => {
    const expandFromHash = () => {
      const target = window.location.hash.replace(/^#badges-/, '')
      if (target !== window.location.hash.slice(1) && badgeEntries.some(badge => badge.id === target)) {
        setExpandedBadges(current => new Set(current).add(target))
      }
    }
    expandFromHash()
    window.addEventListener('hashchange', expandFromHash)
    return () => window.removeEventListener('hashchange', expandFromHash)
  }, [])
  const linkClass =
    'inline-flex items-center gap-1.5 rounded-md border border-[#4589ff]/35 bg-[#0f62fe]/10 px-2.5 py-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/25 hover:text-white'
  const toggleIn = <T,>(setter: (updater: (current: Set<T>) => Set<T>) => void, value: T) =>
    setter(current => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  const badgeProducts = Array.from(new Set(badgeEntries.flatMap(badge => badge.products))).sort((x, y) => x.localeCompare(y))
  const visibleBadges = badgeEntries.filter(
    badge =>
      (selectedCapabilities.size === 0 || badge.capabilities.some(capability => selectedCapabilities.has(capability))) &&
      (selectedProducts.size === 0 || badge.products.some(product => selectedProducts.has(product))) &&
      (selectedLevels.size === 0 || badge.levels.some(level => selectedLevels.has(level))),
  )
  const pillClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
      active
        ? 'border-[#78a9ff]/70 bg-[#0f62fe]/20 text-white'
        : 'border-white/[0.1] bg-white/[0.03] text-[#a8a8a8] hover:border-[#4589ff]/45 hover:text-white'
    }`
  const allVisibleExpanded = visibleBadges.length > 0 && visibleBadges.every(badge => expandedBadges.has(badge.id))
  const toggleAllBadges = () => {
    if (!allVisibleExpanded) setIsFilterExpanded(true)
    setExpandedBadges(current => {
      const next = new Set(current)
      visibleBadges.forEach(badge => (allVisibleExpanded ? next.delete(badge.id) : next.add(badge.id)))
      return next
    })
  }
  const countClass = (active: boolean) =>
    `rounded-full px-1.5 py-0.5 font-mono text-[9px] ${active ? 'bg-white/10 text-white' : 'bg-black/20 text-[#a8a8a8]'}`
  const checkIcon = (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3" fill="none">
      <path d="m3.5 8.2 2.7 2.7 6.3-6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return (
    <section id="badges-top" aria-labelledby="badges-heading" className="scroll-mt-28">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">IBM Data &amp; AI: Business Automation</p>
          <h2 id="badges-heading" className="mt-1 text-2xl font-semibold text-white">Badge</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#c6c6c6]">
            Business Automation sales and technical badges, the earning criteria for each, and where to find the IBM and Business Partner details.
          </p>
        </div>
        <CopySectionLink id="badges-top" label="Badge page" />
      </div>
      <section aria-labelledby="badge-search-heading" className="mb-6 rounded-xl border border-white/[0.07] bg-[#262626] px-5 py-3">
        <div className={`${isFilterExpanded ? 'mb-2' : ''} flex items-start justify-between gap-3`}>
          <div className="flex items-center gap-2">
            <h3 id="badge-search-heading" className="text-base font-semibold text-white">Badge Search</h3>
            <button
              type="button"
              onClick={() => setIsFilterExpanded(expanded => !expanded)}
              aria-expanded={isFilterExpanded}
              aria-controls="badges-filters"
              aria-label={isFilterExpanded ? 'Collapse Badge Search filters' : 'Expand Badge Search filters'}
              title={isFilterExpanded ? 'Collapse filters' : 'Expand filters'}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#ffb784] transition-colors hover:border-[#ff832b]/55 hover:bg-[#ff832b]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb784]"
            >
              <VideoVisibilityIcon visible={isFilterExpanded} />
            </button>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={toggleAllBadges}
              disabled={visibleBadges.length === 0}
              aria-label={allVisibleExpanded ? 'Collapse all badges' : 'Expand all badges'}
              title={allVisibleExpanded ? 'Collapse all badges' : 'Expand all badges and Badge Search'}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#78a9ff] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] disabled:opacity-40"
            >
              <VideoVisibilityIcon visible={allVisibleExpanded} />
            </button>
            <p aria-live="polite" className="text-[11px] font-medium text-[#c6c6c6]">
              {visibleBadges.length} of {badgeEntries.length} badges
            </p>
          </div>
        </div>
        <div id="badges-filters" hidden={!isFilterExpanded} className="grid gap-3">
          <div role="group" aria-label="Filter badges by capability" className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8d8d8d]">Capability</span>
            <button type="button" aria-pressed={selectedCapabilities.size === businessAutomationCapabilityFilters.length} onClick={() => setSelectedCapabilities(current => (current.size === businessAutomationCapabilityFilters.length ? new Set() : new Set(businessAutomationCapabilityFilters.map(filter => filter.page))))} className={pillClass(selectedCapabilities.size === businessAutomationCapabilityFilters.length)}>
              {selectedCapabilities.size === businessAutomationCapabilityFilters.length && checkIcon}
              All
              <span className={countClass(selectedCapabilities.size === businessAutomationCapabilityFilters.length)}>{badgeEntries.length}</span>
            </button>
            {businessAutomationCapabilityFilters.map(option => {
              const isActive = selectedCapabilities.has(option.page)
              return (
                <button key={option.page} type="button" aria-pressed={isActive} onClick={() => toggleIn(setSelectedCapabilities, option.page)} className={pillClass(isActive)}>
                  {isActive && checkIcon}
                  <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} />
                  {option.label}
                  <span className={countClass(isActive)}>{badgeEntries.filter(badge => badge.capabilities.includes(option.page)).length}</span>
                </button>
              )
            })}
          </div>
          <div role="group" aria-label="Filter badges by product" className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8d8d8d]">Product</span>
            <button type="button" aria-pressed={selectedProducts.size === badgeProducts.length} onClick={() => setSelectedProducts(current => (current.size === badgeProducts.length ? new Set() : new Set(badgeProducts)))} className={pillClass(selectedProducts.size === badgeProducts.length)}>
              {selectedProducts.size === badgeProducts.length && checkIcon}
              All
              <span className={countClass(selectedProducts.size === badgeProducts.length)}>{badgeEntries.length}</span>
            </button>
            {badgeProducts.map(product => {
              const isActive = selectedProducts.has(product)
              return (
                <button key={product} type="button" aria-pressed={isActive} onClick={() => toggleIn(setSelectedProducts, product)} className={pillClass(isActive)}>
                  {isActive && checkIcon}
                  {product}
                  <span className={countClass(isActive)}>{badgeEntries.filter(badge => badge.products.includes(product)).length}</span>
                </button>
              )
            })}
          </div>
          <div role="group" aria-label="Filter badges by level" className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8d8d8d]">Level</span>
            <button type="button" aria-pressed={selectedLevels.size === badgeLevels.length} onClick={() => setSelectedLevels(current => (current.size === badgeLevels.length ? new Set() : new Set(badgeLevels)))} className={pillClass(selectedLevels.size === badgeLevels.length)}>
              {selectedLevels.size === badgeLevels.length && checkIcon}
              All
              <span className={countClass(selectedLevels.size === badgeLevels.length)}>{badgeEntries.length}</span>
            </button>
            {badgeLevels.map(level => {
              const isActive = selectedLevels.has(level)
              return (
                <button key={level} type="button" aria-pressed={isActive} onClick={() => toggleIn(setSelectedLevels, level)} className={pillClass(isActive)}>
                  {isActive && checkIcon}
                  Level {level}
                  <span className={countClass(isActive)}>{badgeEntries.filter(badge => badge.levels.includes(level)).length}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
      {visibleBadges.length === 0 ? (
        <p className="rounded-xl border border-white/[0.07] bg-[#262626] px-5 py-6 text-sm text-[#c6c6c6]">No badges match the selected filters.</p>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#161616] p-3 sm:p-4">
        <ul className="grid gap-3">
          {visibleBadges.map(badge => (
            <li
              key={badge.id}
              id={`badges-${badge.id}`}
              className="scroll-mt-28 flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#262626] p-5 lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="flex items-center gap-3 text-base font-semibold text-white">
                    <span className="font-mono text-xs text-[#8d8d8d]">{String(badgeEntries.indexOf(badge) + 1).padStart(2, '0')}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBadges(current => {
                          const next = new Set(current)
                          if (next.has(badge.id)) next.delete(badge.id)
                          else next.add(badge.id)
                          return next
                        })
                      }
                      aria-expanded={expandedBadges.has(badge.id)}
                      aria-controls={`badges-${badge.id}-details`}
                      title={`${expandedBadges.has(badge.id) ? 'Collapse' : 'Expand'} ${badge.name}`}
                      className="inline-flex items-center gap-2 rounded-sm text-left transition-colors hover:text-[#a6c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                    >
                      <span>{badge.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBadges(current => {
                          const next = new Set(current)
                          if (next.has(badge.id)) next.delete(badge.id)
                          else next.add(badge.id)
                          return next
                        })
                      }
                      aria-expanded={expandedBadges.has(badge.id)}
                      aria-controls={`badges-${badge.id}-details`}
                      aria-label={`${expandedBadges.has(badge.id) ? 'Collapse' : 'Expand'} ${badge.name}`}
                      title={`${expandedBadges.has(badge.id) ? 'Collapse' : 'Expand'} ${badge.name}`}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                    >
                      <VideoVisibilityIcon visible={expandedBadges.has(badge.id)} />
                    </button>
                  </h3>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {badge.capabilities.map(capability => {
                    const option = businessAutomationCapabilityFilters.find(filter => filter.page === capability)
                    return option ? (
                      <span
                        key={capability}
                        className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                        style={{ borderColor: `${option.color}66`, backgroundColor: `${option.color}1a`, color: option.color }}
                      >
                        {option.label}
                      </span>
                    ) : null
                  })}
                  {badge.levels.map(level => (
                    <span key={level} className="rounded-full border border-[#ff832b]/50 bg-[#ff832b]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ffb784]">
                      Level {level}
                    </span>
                  ))}
                  {badge.products.map(product => (
                    <span key={product} className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#c6c6c6]">
                      {product}
                    </span>
                  ))}
                </div>
                <div id={`badges-${badge.id}-details`} hidden={!expandedBadges.has(badge.id)}>
                <p className="mt-3 text-sm leading-relaxed text-[#e0e0e0]">{badge.description}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8d8d8d]">Badge earning criteria</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#c6c6c6]">
                  {badge.criteria.map(item => <li key={item}>{item}</li>)}
                </ul>
                {badge.note && (
                  <p className="mt-3 rounded-md border border-[#f1c21b]/25 bg-[#f1c21b]/[0.06] px-3 py-2 text-xs leading-relaxed text-[#e0e0e0]">
                    <span className="font-semibold">Note:</span> {badge.note}
                  </p>
                )}
                </div>
              </div>
              <div className="flex flex-col gap-2 lg:w-44">
              <div className="flex justify-end">
                <CopySectionLink id={`badges-${badge.id}`} label={badge.name} />
              </div>
              <div hidden={!expandedBadges.has(badge.id)} className="flex-wrap items-center gap-2 lg:flex-col lg:items-stretch [&:not([hidden])]:flex">
                {badge.badgeUrl && (
                  <a href={badge.badgeUrl} target="_blank" rel="noreferrer" className={linkClass}>Badge<ExternalLinkIcon /></a>
                )}
                {badge.ibmUrl && (
                  <a href={badge.ibmUrl} target="_blank" rel="noreferrer" className={linkClass}>IBM details<ExternalLinkIcon /></a>
                )}
                {badge.bpUrl && (
                  <a href={badge.bpUrl} target="_blank" rel="noreferrer" className={linkClass}>BP details<ExternalLinkIcon /></a>
                )}
                {badge.bpAvailable === false && (
                  <span className="text-xs text-[#8d8d8d]">BP details: not available</span>
                )}
              </div>
              </div>
            </li>
          ))}
        </ul>
        </div>
      )}
          <p className="mt-6 rounded-md border border-[#4589ff]/30 bg-[#0f62fe]/10 px-3 py-2 text-sm leading-relaxed text-[#e0e0e0]">
            The latest list of badges can always be found on Seismic:{' '}
            <a
              href="https://ibm.biz/BadgeBA"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#78a9ff] underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              ibm.biz/BadgeBA
            </a>
          </p>
    </section>
  )
}

const onboardingAutomationSourceUrl = 'https://ibm-cloud-architecture.github.io/refarch-dba/use-cases/onboarding-automation'


const onboardingAutomationAnchor = (id: string) => `onboarding-automation-${id}`

// Renders **bold** and [label](url) markup. "#id" links stay on this page.
function renderOnboardingInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g
  const nodes: ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  let index = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const key = `${keyPrefix}-${index++}`
    if (match[1] !== undefined) {
      const href = match[2]
      const internal = href.startsWith('#')
      nodes.push(
        <a
          key={key}
          href={internal ? `#${onboardingAutomationAnchor(href.slice(1))}` : href}
          {...(internal ? {} : { target: '_blank', rel: 'noreferrer' })}
          className="text-[#78a9ff] underline decoration-[#78a9ff]/40 underline-offset-2 transition-colors hover:text-white"
        >
          {renderOnboardingInline(match[1], key)}
        </a>,
      )
    } else {
      nodes.push(
        <strong key={key} className="font-semibold text-white">
          {match[3]}
        </strong>,
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function OnboardingAutomationBlockView({ block, depth, index }: { block: OnboardingBlock; depth: number; index: number }) {
  switch (block.t) {
    case 'p':
      return <p className="text-sm leading-relaxed text-[#c6c6c6]">{renderOnboardingInline(block.x)}</p>
    case 'step':
      return (
        <p className="mt-2 flex gap-2 text-sm leading-relaxed text-[#e0e0e0]">
          <span className="shrink-0 font-semibold text-[#78a9ff]">{block.n}</span>
          <span>{renderOnboardingInline(block.x)}</span>
        </p>
      )
    case 'list':
      return block.labels ? (
        <ul className="grid gap-1 pl-6 text-sm leading-relaxed text-[#c6c6c6]">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2">
              <span className="w-5 shrink-0 text-[#8d8d8d]">{block.labels![itemIndex]}</span>
              <span>{renderOnboardingInline(item)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid list-disc gap-1 pl-10 text-sm leading-relaxed text-[#c6c6c6]">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderOnboardingInline(item)}</li>
          ))}
        </ul>
      )
    case 'img':
      return (
        <a
          href={asset(`onboarding-automation/${block.src}`)}
          target="_blank"
          rel="noreferrer"
          title="Open full-size screenshot"
          className="block max-w-3xl overflow-hidden rounded-lg border border-white/[0.1] bg-[#161616] transition-colors hover:border-[#4589ff]"
        >
          <img
            src={asset(`onboarding-automation/${block.src}`)}
            alt={block.alt}
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
        </a>
      )
    case 'table':
      return (
        <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
          <table className="w-full border-collapse text-left text-sm text-[#c6c6c6]">
            {block.head && (
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-[#a8a8a8]">
                <tr>
                  {block.head.map(cell => (
                    <th key={cell} scope="col" className="px-3 py-2 font-semibold">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-white/[0.06] align-top">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2">
                      {renderOnboardingInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'note': {
      const kind = block.kind === 'info' && block.x.startsWith('\u26a0') ? 'warning' : block.kind
      const classes =
        kind === 'warning'
          ? 'border-[#f1c21b]/50 bg-[#f1c21b]/10'
          : kind === 'success'
            ? 'border-[#42be65]/50 bg-[#42be65]/10'
            : kind === 'info'
              ? 'border-[#4589ff]/50 bg-[#0f62fe]/10'
              : 'border-white/[0.14] bg-white/[0.04]'
      return (
        <p className={`rounded-lg border px-3 py-2 text-sm leading-relaxed text-[#e0e0e0] ${classes}`}>
          {renderOnboardingInline(block.x)}
        </p>
      )
    }
    case 'nav':
      return (
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-[#8d8d8d]">
          {block.links.map((link, linkIndex) => (
            <Fragment key={linkIndex}>
              {linkIndex > 0 && <span aria-hidden="true">|</span>}
              <a
                href={`#${onboardingAutomationAnchor(link.to)}`}
                className="text-[#78a9ff] transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </Fragment>
          ))}
        </p>
      )
    case 'sec':
      return <OnboardingAutomationSectionView section={block.s} depth={depth + 1} index={index} />
  }
}

const onboardingAutomationParents = new Map<string, string | null>()
;(function indexOnboardingSections(sections: OnboardingSection[], parent: string | null) {
  for (const section of sections) {
    onboardingAutomationParents.set(section.id, parent)
    indexOnboardingSections(
      section.blocks.filter((block): block is Extract<OnboardingBlock, { t: 'sec' }> => block.t === 'sec').map(block => block.s),
      section.id,
    )
  }
})(onboardingAutomationSections, null)
const allOnboardingSectionIds = Array.from(onboardingAutomationParents.keys())
const onboardingAutomationDescendants = new Map<string, string[]>(
  allOnboardingSectionIds.map(id => [
    id,
    allOnboardingSectionIds.filter(other => {
      let parent = onboardingAutomationParents.get(other) ?? null
      while (parent) {
        if (parent === id) return true
        parent = onboardingAutomationParents.get(parent) ?? null
      }
      return false
    }),
  ]),
)

const onboardingTopLevelSectionIds = onboardingAutomationSections.map(section => section.id)

// Page-wide level: 0 = everything collapsed, 1 = top-level sections open with subsections collapsed, 2 = everything expanded.
function onboardingPageLevel(collapsed: Set<string>): 0 | 1 | 2 {
  if (collapsed.size === allOnboardingSectionIds.length) return 0
  if (collapsed.size === 0) return 2
  return 1
}

function nextOnboardingPageCollapsed(collapsed: Set<string>): Set<string> {
  const level = onboardingPageLevel(collapsed)
  if (level === 0) {
    return new Set(allOnboardingSectionIds.filter(id => !onboardingTopLevelSectionIds.includes(id)))
  }
  if (level === 1) return new Set()
  return new Set(allOnboardingSectionIds)
}

const onboardingPageCycleLabels = [
  'Show the top-level sections of the page',
  'Expand all content on the page',
  'Collapse all sections on the page',
] as const

function OnboardingPageCycleButton({ collapsed, onCycle }: { collapsed: Set<string>; onCycle: () => void }) {
  const level = onboardingPageLevel(collapsed)
  const label = onboardingPageCycleLabels[level]
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
    >
      <ThreeLevelVisibilityIcon level={level} />
    </button>
  )
}

const OnboardingCollapseContext = createContext<{
  collapsed: Set<string>
  toggle: (id: string) => void
  cycle: (id: string) => void
  goToSection: (id: string) => void
  goToPageEdge: (edge: 'top' | 'bottom') => void
}>({
  collapsed: new Set(),
  toggle: () => {},
  cycle: () => {},
  goToSection: () => {},
  goToPageEdge: () => {},
})

const onboardingSectionTitles = new Map<string, string>()
;(function indexOnboardingTitles(sections: OnboardingSection[]) {
  for (const section of sections) {
    onboardingSectionTitles.set(section.id, section.title)
    indexOnboardingTitles(
      section.blocks.filter((block): block is Extract<OnboardingBlock, { t: 'sec' }> => block.t === 'sec').map(block => block.s),
    )
  }
})(onboardingAutomationSections)

function OnboardingSectionNavButtons({ sectionId }: { sectionId: string }) {
  const { goToSection, goToPageEdge } = useContext(OnboardingCollapseContext)
  const position = allOnboardingSectionIds.indexOf(sectionId)
  const previousId = position > 0 ? allOnboardingSectionIds[position - 1] : null
  const nextId = position >= 0 && position < allOnboardingSectionIds.length - 1 ? allOnboardingSectionIds[position + 1] : null
  const segmentClass =
    'inline-flex h-8 w-9 items-center justify-center text-[#c6c6c6] transition-colors hover:bg-[#0f62fe]/20 hover:text-white focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#c6c6c6]'
  const groupClass = 'inline-flex overflow-hidden rounded-md border border-white/[0.12] bg-white/[0.04]'
  const iconProps = {
    'aria-hidden': true,
    viewBox: '0 0 16 16',
    className: 'h-3.5 w-3.5',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const
  return (
    <nav
      aria-label="Section navigation"
      className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-white/[0.06] pt-3"
    >
      <div className={groupClass} role="group" aria-label="Previous and next section">
        <button
          type="button"
          disabled={!previousId}
          onClick={() => previousId && goToSection(previousId)}
          aria-label={previousId ? `Previous section: ${onboardingSectionTitles.get(previousId)}` : 'Previous section'}
          title="Previous section"
          className={segmentClass}
        >
          <svg {...iconProps}>
            <path d="M10 3 5 8l5 5" />
          </svg>
        </button>
        <button
          type="button"
          disabled={!nextId}
          onClick={() => nextId && goToSection(nextId)}
          aria-label={nextId ? `Next section: ${onboardingSectionTitles.get(nextId)}` : 'Next section'}
          title="Next section"
          className={`${segmentClass} border-l border-white/[0.12]`}
        >
          <svg {...iconProps}>
            <path d="m6 3 5 5-5 5" />
          </svg>
        </button>
      </div>
      <p className="min-w-0 truncate text-center text-xs font-semibold text-[#c6c6c6]">
        {onboardingSectionTitles.get(sectionId)}
      </p>
      <div className={groupClass} role="group" aria-label="Top and bottom of page">
        <button type="button" onClick={() => goToPageEdge('top')} aria-label="Go to the top of the page" title="Top of page" className={segmentClass}>
          <svg {...iconProps}>
            <path d="M3 2.5h10M8 14V5M4.5 8.5 8 5l3.5 3.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => goToPageEdge('bottom')}
          aria-label="Go to the end of the page"
          title="End of page"
          className={`${segmentClass} border-l border-white/[0.12]`}
        >
          <svg {...iconProps}>
            <path d="M3 13.5h10M8 2v9M4.5 7.5 8 11l3.5-3.5" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

function OnboardingAutomationSections({
  collapsed,
  setCollapsed,
}: {
  collapsed: Set<string>
  setCollapsed: (update: Set<string> | ((current: Set<string>) => Set<string>)) => void
}) {
  useEffect(() => {
    const reveal = () => {
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      const prefix = 'onboarding-automation-'
      if (!hash.startsWith(prefix)) return
      const sectionId = hash.slice(prefix.length)
      if (!onboardingAutomationParents.has(sectionId)) return
      // Expand every ancestor so the target section is visible (the target itself stays as-is).
      setCollapsed(current => {
        const next = new Set(current)
        let parent = onboardingAutomationParents.get(sectionId) ?? null
        while (parent) {
          next.delete(parent)
          parent = onboardingAutomationParents.get(parent) ?? null
        }
        next.delete(sectionId)
        return next
      })
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => scrollElementBelowPageHeader(hash, 'smooth')),
      )
    }
    reveal()
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  }, [])

  const toggle = (id: string) =>
    setCollapsed(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Sections with subsections cycle: collapsed -> subsections shown (collapsed) -> everything expanded -> collapsed.
  const cycle = (id: string) =>
    setCollapsed(current => {
      const descendants = onboardingAutomationDescendants.get(id) ?? []
      const next = new Set(current)
      if (current.has(id)) {
        next.delete(id)
        descendants.forEach(descendant => next.add(descendant))
      } else if (descendants.some(descendant => current.has(descendant))) {
        next.delete(id)
        descendants.forEach(descendant => next.delete(descendant))
      } else {
        next.add(id)
        descendants.forEach(descendant => next.add(descendant))
      }
      return next
    })

  const goToSection = (id: string) => {
    setCollapsed(current => {
      const next = new Set(current)
      next.delete(id)
      let parent = onboardingAutomationParents.get(id) ?? null
      while (parent) {
        next.delete(parent)
        parent = onboardingAutomationParents.get(parent) ?? null
      }
      return next
    })
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => scrollElementBelowPageHeader(onboardingAutomationAnchor(id), 'smooth')),
    )
  }

  const goToPageEdge = (edge: 'top' | 'bottom') => {
    if (edge === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }

  return (
    <OnboardingCollapseContext.Provider value={{ collapsed, toggle, cycle, goToSection, goToPageEdge }}>
      <div className="grid gap-4">
        {onboardingAutomationSections.map((section, index) => (
          <OnboardingAutomationSectionView
            key={section.id}
            section={section}
            depth={0}
            index={index}
            total={onboardingAutomationSections.length}
          />
        ))}
      </div>
      <div id="onboarding-automation-bottom" aria-hidden="true" />
    </OnboardingCollapseContext.Provider>
  )
}

function OnboardingAutomationSectionView({
  section,
  depth,
  index,
  total,
}: {
  section: OnboardingSection
  depth: number
  index: number
  total?: number
}) {
  const { collapsed: collapsedSections, toggle, cycle } = useContext(OnboardingCollapseContext)
  const isCollapsed = collapsedSections.has(section.id)
  const descendantIds = onboardingAutomationDescendants.get(section.id) ?? []
  const hasSubsections = descendantIds.length > 0
  // 0 = section collapsed, 1 = subsections shown but collapsed, 2 = subsections expanded
  const expansionLevel: 0 | 1 | 2 = isCollapsed ? 0 : descendantIds.some(id => collapsedSections.has(id)) ? 1 : 2
  const cycleLabel = [
    `Show subsections of ${section.title}`,
    `Expand all content in ${section.title}`,
    `Collapse ${section.title} and its subsections`,
  ][expansionLevel]
  const sectionId = onboardingAutomationAnchor(section.id)
  const headingId = `${sectionId}-heading`
  const contentId = `${sectionId}-content`
  const headingClass =
    depth === 0
      ? 'mt-2 text-lg font-semibold text-white'
      : depth === 1
        ? 'text-base font-semibold text-white'
        : depth === 2
          ? 'text-sm font-semibold text-white'
          : 'text-sm font-semibold text-[#e0e0e0]'
  const HeadingTag = (depth === 0 ? 'h3' : depth === 1 ? 'h4' : 'h5') as 'h3' | 'h4' | 'h5'
  const header = (
    <div className="flex items-start justify-between gap-4">
      <div>
        {depth === 0 && total !== undefined && (
          <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#8d8d8d]">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
        )}
        <HeadingTag id={headingId} className={headingClass}>
          <button
            type="button"
            onClick={() => toggle(section.id)}
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            title={`${isCollapsed ? 'Expand' : 'Collapse'} ${section.title}`}
            className="inline-flex items-center gap-2 rounded-sm text-left transition-colors hover:text-[#a6c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
          >
            <span>{section.title}</span>
            <ChevronIcon expanded={!isCollapsed} />
          </button>
        </HeadingTag>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {hasSubsections ? (
          <button
            type="button"
            onClick={() => cycle(section.id)}
            aria-controls={contentId}
            aria-label={cycleLabel}
            title={cycleLabel}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
          >
            <ThreeLevelVisibilityIcon level={expansionLevel} />
          </button>
        ) : (
          <ProductResourceSectionToggleButton
            expanded={!isCollapsed}
            controls={contentId}
            label={section.title}
            onToggle={() => toggle(section.id)}
          />
        )}
        <CopySectionLink id={sectionId} label={section.title} />
      </div>
    </div>
  )
  const body = isCollapsed ? null : (
    <div id={contentId} className="grid gap-3">
      {section.blocks.map((block, blockIndex) => (
        <OnboardingAutomationBlockView key={blockIndex} block={block} depth={depth} index={blockIndex} />
      ))}
      <OnboardingSectionNavButtons sectionId={section.id} />
    </div>
  )
  if (depth === 0) {
    return (
      <article
        id={sectionId}
        aria-labelledby={headingId}
        className="scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626]"
      >
        <div className={`px-5 py-4 ${isCollapsed ? '' : 'border-b border-white/[0.06]'}`}>{header}</div>
        {body && <div className="p-5">{body}</div>}
      </article>
    )
  }
  return (
    <section
      id={sectionId}
      aria-labelledby={headingId}
      className={`scroll-mt-28 grid gap-3 ${
        depth === 1 ? 'rounded-lg border border-white/[0.08] bg-[#1f1f1f] p-4' : 'mt-1 border-l border-white/[0.08] pl-4'
      }`}
    >
      {header}
      {body}
    </section>
  )
}

function OnboardingAutomationContents({
  contentsCollapsed,
  setContentsCollapsed,
}: {
  contentsCollapsed: boolean
  setContentsCollapsed: (update: boolean | ((current: boolean) => boolean)) => void
}) {
  const renderEntries = (blocks: OnboardingBlock[]): ReactNode => {
    const entries = blocks.filter((block): block is Extract<OnboardingBlock, { t: 'sec' }> => block.t === 'sec' && block.s.toc !== false)
    if (entries.length === 0) return null
    return (
      <ul className="mt-1 grid gap-1 pl-4">
        {entries.map(entry => (
          <li key={entry.s.id}>
            <a
              href={`#${onboardingAutomationAnchor(entry.s.id)}`}
              className="text-[#78a9ff] transition-colors hover:text-white"
            >
              {entry.s.title}
            </a>
            {renderEntries(entry.s.blocks)}
          </li>
        ))}
      </ul>
    )
  }
  return (
    <nav aria-label="Onboarding Automation contents" className="mb-6 rounded-xl border border-[#4589ff]/30 bg-[#1c1c1c] p-4 sm:p-5">
      <h3 className="text-base font-semibold text-white">
        <button
          type="button"
          onClick={() => setContentsCollapsed(current => !current)}
          aria-expanded={!contentsCollapsed}
          aria-controls="onboarding-automation-contents-list"
          title={`${contentsCollapsed ? 'Expand' : 'Collapse'} Contents`}
          className="inline-flex items-center gap-2 rounded-sm text-left transition-colors hover:text-[#a6c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
        >
          <span>Contents</span>
          <ChevronIcon expanded={!contentsCollapsed} />
        </button>
      </h3>
      {!contentsCollapsed && (
        <ul id="onboarding-automation-contents-list" className="mt-3 grid gap-2 text-sm">
          {onboardingAutomationSections.map(section => (
            <li key={section.id}>
              <a
                href={`#${onboardingAutomationAnchor(section.id)}`}
                className="font-semibold text-[#78a9ff] transition-colors hover:text-white"
              >
                {section.title}
              </a>
              {renderEntries(section.blocks)}
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}

function CommunityFilterGroup({
  id,
  title,
  options,
  selected,
  onChange,
  onOptionDoubleClick,
  noun = 'communities',
}: {
  id: string
  title: string
  options: { id: string; label: string; color?: string }[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  onOptionDoubleClick?: (optionId: string) => void
  noun?: string
}) {
  const [expanded, setExpanded] = useState(true)
  const allSelected = selected.size === options.length
  const noneSelected = selected.size === 0
  const actionButton =
    'inline-flex h-7 items-center rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 text-[11px] font-semibold text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] disabled:cursor-default disabled:opacity-40 disabled:hover:border-white/[0.1] disabled:hover:bg-white/[0.03] disabled:hover:text-[#c6c6c6]'
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#262626] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => setExpanded(current => !current)}
            aria-expanded={expanded}
            aria-controls={`${id}-controls`}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title} filter`}
            title={`${expanded ? 'Collapse' : 'Expand'} ${title} filter`}
            className="inline-flex h-7 items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#78a9ff] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
          >
            {title}
            <VideoVisibilityIcon visible={expanded} />
          </button>
          <span className="text-xs font-medium text-[#c6c6c6]">
            {allSelected ? `All ${options.length} selected` : `${selected.size} of ${options.length} selected`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={allSelected} onClick={() => onChange(new Set(options.map(option => option.id)))} className={actionButton}>
            All
          </button>
          <button type="button" disabled={noneSelected} onClick={() => onChange(new Set())} className={actionButton}>
            None
          </button>
        </div>
      </div>
      <div id={`${id}-controls`} hidden={!expanded} role="group" aria-label={`Filter ${noun} by ${title.toLowerCase()}`} className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
        {options.map(option => {
          const isActive = selected.has(option.id)
          const color = option.color ?? '#4589ff'
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              title={onOptionDoubleClick ? 'Click to toggle. Double-click to deselect its products.' : undefined}
              onDoubleClick={onOptionDoubleClick ? () => onOptionDoubleClick(option.id) : undefined}
              onClick={() => {
                const next = new Set(selected)
                if (isActive) next.delete(option.id)
                else next.add(option.id)
                onChange(next)
              }}
              className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] ${
                isActive ? 'text-white' : 'border-white/[0.1] bg-white/[0.02] text-[#a8a8a8] hover:border-white/[0.22] hover:bg-white/[0.05] hover:text-white'
              }`}
              style={isActive ? { borderColor: `${color}bb`, backgroundColor: `${color}20` } : undefined}
            >
              <span
                aria-hidden="true"
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border"
                style={{ borderColor: isActive ? color : `${color}88`, backgroundColor: isActive ? color : `${color}18` }}
              >
                {isActive && (
                  <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-[#161616]" fill="none">
                    <path d="m3.5 8.2 2.7 2.7 6.3-6.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const ugSectionImages = [
  {
    id: 'ug-user-groups-overview',
    title: 'Business Automation User Groups Overview',
    description: 'Overview of the Process Automation, Content Services, and Decision Intelligence user-group sessions.',
    src: asset('ug/user-groups-overview.png'),
  },
  {
    id: 'ug-session-details',
    title: 'User Group Session Details',
    description: 'Session-by-session summary for the six Business Automation user-group meetups.',
    src: asset('ug/user-group-session-details.png'),
  },
  {
    id: 'ug-process-automation',
    title: 'Process Automation User Group',
    description: 'Process Automation user-group themes, session IDs, and exclusive preview information.',
    src: asset('ug/process-automation-user-group.png'),
  },
  {
    id: 'ug-content-services',
    title: 'Content Services User Group',
    description: 'Content Services user-group themes, session IDs, and exclusive preview information.',
    src: asset('ug/content-services-user-group.png'),
  },
  {
    id: 'ug-decision-intelligence',
    title: 'Decision Intelligence User Group',
    description: 'Decision Intelligence user-group themes, session IDs, and exclusive preview information.',
    src: asset('ug/decision-intelligence-user-group.png'),
  },
  {
    id: 'ug-business-automation-sessions',
    title: 'Business Automation Sessions Overview',
    description: 'At-a-glance guide to Business Automation user groups and conference sessions.',
    src: asset('ug/business-automation-sessions-overview.png'),
  },
]

const ugFeaturedSession = sessions.find(session => session.id === 'TLK-6335')
const ugMteSessions = ['MTE-5682', 'MTE-5683', 'MTE-5681']
  .map(id => sessions.find(session => session.id === id))
  .filter((session): session is Session => Boolean(session))
const ugResourceCount = ugSectionImages.length + 1 + ugMteSessions.length
const ugTableOfContents = [
  { id: 'ug-tlk-6335', title: 'Featured Session: TLK-6335' },
  ...ugMteSessions.map(session => ({ id: `ug-${session.id.toLowerCase()}`, title: session.title })),
  ...ugSectionImages.map(item => ({ id: item.id, title: item.title })),
]

interface InsightsEnrollmentRow {
  id: string
  title: string
  enrollments?: number
  attended: number
}

const insightsEnrollmentRoster: InsightsEnrollmentRow[] = [
  {
    id: 'MUP-4643',
    title: 'Agentic Process Automation User Group, Session 1: From Automation to Autonomy',
    enrollments: 78,
    attended: 79,
  },
  {
    id: 'MUP-4647',
    title: 'Content Services User Group Session 1: Four Platforms, One Agentic Future',
    enrollments: 76,
    attended: 108,
  },
  {
    id: 'MUP-4644',
    title: 'Agentic Process Automation User Group, Session 2: From Vision to Value',
    enrollments: 73,
    attended: 74,
  },
  {
    id: 'MUP-4648',
    title: 'Content Services User Group Session 2: Your Path to Consolidation and Trusted Governance',
    enrollments: 57,
    attended: 83,
  },
  {
    id: 'MUP-4646',
    title: 'Decision Intelligence User Group Session 2: From Automation to Autonomy',
    enrollments: 35,
    attended: 45,
  },
  {
    id: 'MUP-4645',
    title: 'Decision Intelligence User Group Session 1: Where Agents Meet ROI',
    enrollments: 34,
    attended: 45,
  },
  {
    id: 'MTE-5681',
    title: 'Meet the Expert: Swapnil Agrawal - Ask Me Anything About Business Automation & Process Automation',
    enrollments: 17,
    attended: 12,
  },
  {
    id: 'MTE-5683',
    title: 'Meet the Expert: Lenny Bromberg - Ask Me Anything About Business Automation & Decision Intelligence',
    enrollments: 12,
    attended: 9,
  },
  {
    id: 'MTE-5682',
    title: 'Meet the Expert: Matt Vest - Ask Me Anything About Business Automation & Content Services',
    enrollments: 4,
    attended: 15,
  },
  {
    id: 'TEC-2964',
    title: 'AI and Event-Driven Workflow Automation',
    enrollments: 110,
    attended: 103,
  },
  {
    id: 'TEC-1487',
    title: 'Beyond Theory: Enterprise AI in a Manufacturing Environment',
    enrollments: 67,
    attended: 132,
  },
  {
    id: 'TEC-3311',
    title: 'Classification and Security in IBM FileNet P8 in the Age of AI, RAG, and Content Cortex',
    enrollments: 67,
    attended: 61,
  },
  {
    id: 'TEC-4006',
    title: 'Journey to Content Cortex: GraphQL as a Building Block for AI Agent Ready Document Storage',
    enrollments: 67,
    attended: 73,
  },
  {
    id: 'TEC-4200',
    title: 'Modernizing IBM BAW for Agentic AI with IBM Bob and watsonx Orchestrate',
    enrollments: 54,
    attended: 0,
  },
  {
    id: 'TEC-3996',
    title: 'United Airlines: Streamlining Flight Operations with IBM BAW and AI',
    enrollments: 47,
    attended: 63,
  },
  {
    id: 'TLK-4208',
    title: 'Design AI Agents as Enterprise Components with watsonx Orchestrate and BAW',
    enrollments: 41,
    attended: 39,
  },
  {
    id: 'LAB-3267',
    title: 'Solving Real-World Content Challenges with IBM Content Cortex & Agentic AI',
    enrollments: 30,
    attended: 30,
  },
  {
    id: 'LAB-3375',
    title: 'Operationalize embedded AI in IBM Z transactions with Machine Learning for agile business intelligence',
    enrollments: 28,
    attended: 17,
  },
  {
    id: 'LAB-1481',
    title: 'Build AI-Powered Staff Schedules with Planning Analytics, Decision Optimization, and IBM Bob',
    enrollments: 25,
    attended: 12,
  },
  {
    id: 'TLK-6335',
    title: 'Business Automation User Group: BA for the AI Era — Process Automation, Content Services, Decision Intelligence',
    enrollments: 49,
    attended: 58,
  },
  {
    id: 'TLK-9069',
    title: 'Transforming Crew Management with AI: IBM watsonx and IBM ODM for Smarter Crew Legality Validation',
    enrollments: 16,
    attended: 12,
  },
  {
    id: 'BA-CAB',
    title: 'Client Advisory Board',
    enrollments: 12,
    attended: 12,
  },
]

const currentAiCapabilities = [
  { name: 'BAW MCP Servers', area: 'Process Automation', description: 'Use existing BAW and BAMOE investments with AI by starting processes and consuming services through custom agents.' },
  { name: 'Agentic Process Builder', area: 'Process Automation', description: 'Guide automation planning through deployment with AI assistance to reduce time to value.' },
  { name: 'BAW Workplace Assistant', area: 'Process Automation', description: 'Help end users quickly find, prioritize, and complete their tasks with an agent-powered assistant.' },
  { name: 'Authoring Assistant in BAW', area: 'Process Automation', description: 'Generate new process solutions through conversational AI to accelerate solution development.' },
  { name: 'AI Model Gateway', area: 'Process Automation', description: 'Target a chosen AI provider, including watsonx.ai, OpenAI, Google Gemini, and AWS Bedrock.' },
  { name: 'Decision Assistant: Multi-Turn Agent', area: 'Decision Intelligence', description: 'Update decision assets through conversational AI across multiple interactions for faster change management.' },
  { name: 'DI and ODM MCP Servers', area: 'Decision Intelligence', description: 'Expose decision services as MCP tools for seamless execution from agentic applications.' },
  { name: 'Agentic-Based Decisions', area: 'Decision Intelligence', description: 'Execute decisions autonomously with agentic frameworks while maintaining trust and transparency.' },
  { name: 'DI Workplace Assistant', area: 'Decision Intelligence', description: 'Transform natural language into decision services through chat to simplify policy interpretation and authoring.' },
  { name: 'BAW + IBM Bob use cases', area: 'Process Automation', description: 'Explore demos and client assets showing how IBM Bob can enhance Business Automation Workflow.', url: 'https://ibm.seismic.com/Link/Content/DCg4cRfBQ6V7G8TW3ppJ6XT8qcM3#/?anchorId=727ac6fc-b259-4575-be2e-6520990b4f15' },
  { name: 'CP4BA + watsonx Orchestrate BOAT', area: 'Process Automation', description: 'Embed AI in core business processes without sacrificing compliance or control.', url: 'https://www.ibm.com/solutions/agentic-process-automation#logo-tabs-09bb43196d-item-51f8ab19ce-tab' },
  { name: 'Decision Assistant for ODM', area: 'Decision Intelligence', description: 'Convert natural-language policies into ODM-ready models while preserving ODM runtime performance.' },
  { name: 'IBM Content Cortex Premium Edition', area: 'Content Management', description: 'Secure, govern, and activate enterprise content at scale while assembling content-centric solutions and enforcing fine-grained controls.' },
  { name: 'Computer Use Agents for RPA', area: 'Process Automation', description: 'Perform user-interface actions from natural-language commands with computer-use agent technology.' },
]

const productPreviews = [
  { name: 'BAW Authoring Assistant', action: 'Private Preview', url: 'https://forms.monday.com/forms/c5d574deb6459201c6bbabc5f869436d?r=use1' },
  { name: 'Decision Intelligence', action: '30 Day Trial', url: 'https://www.ibm.com/account/reg/us-en/signup?formid=urx-53910' },
  { name: 'IBM Content Cortex Premium', action: 'Preview', url: 'https://www.ibm.com/forms/mkt-3a420' },
  { name: 'Business Automation Workflow', action: '30 Day Trial', url: 'https://www.ibm.com/account/reg/us-en/signup?formid=urx-32021' },
  { name: 'Cloud Pak for Business Automation', action: 'Trial', url: 'https://www.ibm.com/account/reg/us-en/signup?formid=urx-45706' },
]

const productDemoGroups = [
  {
    title: 'IBM Content Assistant',
    links: [
      { name: 'Generative AI for FileNet and Content Cortex Content Manager', url: 'https://ibm.seismic.com/Link/Content/DCTFW32XV3J6D8QCM7CB4GW7p3j3' },
      { name: 'Content Assistant — Quick Overview', url: 'https://ibm.seismic.com/Link/Content/DCW2qVHcjbcRc8CHC3f88HRPFM28' },
      { name: 'Document Compare Demo', url: 'https://ibm.box.com/s/forfszbx4x6swr6td9o09sicy83orzg1' },
    ],
  },
  {
    title: 'IBM Content Cortex',
    links: [
      { name: 'IBM Content Cortex website', url: 'https://ibm.biz/content-cortex-info' },
      { name: 'IBM Content Cortex Demos', url: 'https://ibm.biz/content-cortex-demo' },
      { name: 'IBM Content Cortex AI Agents', url: 'https://ibm.biz/ccx-ai-agents' },
      { name: 'Overview video', url: 'http://ibm.biz/ContentCortex' },
    ],
  },
  {
    title: 'IBM Business Automation Workflow',
    links: [
      { name: 'IBM Bob with BAW to increase developer productivity', url: 'https://community.ibm.com/community/user/viewdocument/webinar-ibm-bob-with-baw-to-increase-developer-productivity?CommunityKey=810abde6-3916-441b-aac3-b9105bb37e3c' },
      { name: 'Invoking watsonx Orchestrate agents from Workflow', url: 'https://youtu.be/ep7sByXUaFc' },
      { name: 'The Road to Agentic', url: 'https://ibm.seismic.com/Link/Content/DC62B6qR8fB3XGQGfXB2jb7bm2P8' },
      { name: 'Triggering workflow automation with a local MCP server', url: 'https://youtu.be/7feBwKkR1bQ' },
      { name: 'Simplifying workflow creation with Authoring Assistant', url: 'https://youtu.be/JlSt_J4JkBU' },
      { name: 'Agentic Workplace Assistant', url: 'https://youtu.be/IL5jnGj0V3I' },
    ],
  },
  {
    title: 'IBM Blueworks Live',
    links: [
      { name: 'Blueworks Live IQ Public Preview — Interactive Demo', url: 'https://ibm.biz/bwliq-demo/' },
      { name: 'Blueworks Live IQ – Describe your Process and Let AI Build it!', url: 'https://ibm.biz/bwl-describe-your-process' },
      { name: 'Blueworks Live IQ – Transform any Image and Diagram into a Process Map!', url: 'https://ibm.biz/bwl-transform-process-map' },
    ],
  },
  {
    title: 'IBM Decision Intelligence',
    links: [
      { name: 'IBM Decision Intelligence Enterprise Edition - Every Decision Matters', url: 'https://ibm.biz/decision-intelligence-edm' },
      { name: 'Transform Decision Automation with AI', url: 'https://ibm.biz/decision-intelligence-transform' },
      { name: 'Build AI-powered Decisions', url: 'https://ibm.seismic.com/Link/Content/DCC7RC2q7HM938QWcqcd77DTRVRG' },
      { name: 'Decision Assistant for Operations', url: 'https://ibm.box.com/s/sbaord8e5l9bpg9mxlyghx1xsat03izt' },
    ],
  },
  {
    title: 'IBM Operational Decision Manager',
    links: [
      { name: 'ODM + Decision Assistant Sales Play', url: 'https://ibm.seismic.com/Link/Content/DC88P3cbmqVQ98hRb3dPJFQRf8f3' },
    ],
  },
  {
    title: 'IBM Business Automation Insights',
    links: [
      { name: 'BAI General Capabilities', url: 'https://ibm.box.com/s/m6rl6p7lt3mhj24soq1xit48us68frga' },
      { name: 'BAI — ICM Demo', url: 'https://ibm.box.com/s/m66qwy2zwsa71ferm4obcjgteayud5fa' },
    ],
  },
]

type PortfolioResourcePage = 'process-automation' | 'content-services' | 'decision-intelligence' | 'cp4ba'
type ProductResourceSection = 'reference' | 'previews' | 'ai-capabilities' | 'demos' | 'sales-kits' | 'environments' | 'techzone-collections' | 'youtube-playlists'

const productResourceSectionFilters: { id: ProductResourceSection; label: string }[] = [
  { id: 'reference', label: 'Reference' },
  { id: 'previews', label: 'Previews and trials' },
  { id: 'ai-capabilities', label: 'AI capabilities' },
  { id: 'demos', label: 'Demos and videos' },
  { id: 'sales-kits', label: 'Sales kits' },
  { id: 'environments', label: 'Demo Environments' },
  { id: 'techzone-collections', label: 'TechZone Collections' },
  { id: 'youtube-playlists', label: 'IBM Product Hub on YouTube' },
]
const businessAutomationSalesKitNames = [
  'Business Automation Sales Kits',
  'Business Automation Portfolio Hub',
  'Business Automation 2-Pager',
]
const featuredSalesKitOrder = [
  'Business Automation Sales Kits',
  'Business Automation Portfolio Hub',
  'Business Automation 2-Pager',
  'Cloud Pak for Business Automation',
  'Cloud Pak for Business Automation as a Service',
  'Decision Intelligence Sales Hub',
  'Business Automation Workflow',
]

const portfolioResources: Record<PortfolioResourcePage, {
  references: { name: string; url: string }[]
  aiCapabilities: typeof currentAiCapabilities
  previews: typeof productPreviews
  demos: typeof productDemoGroups
  salesKits: { name: string; url: string }[]
  environments: { name: string; description: string; url: string; recommended?: boolean }[]
  techZoneCollections: { name: string; description: string; url: string }[]
  youtubePlaylists: { name: string; url: string; embedUrl: string; order: number }[]
}> = {
  'process-automation': {
    references: [
      { name: 'IBM Business Automation Workflow', url: 'https://www.ibm.com/products/business-automation-workflow' },
      { name: 'IBM Product Hub on YouTube', url: 'https://ibm.biz/business-automation-youtube' },
    ],
    aiCapabilities: currentAiCapabilities.filter(item =>
      item.area === 'Process Automation' && !item.name.startsWith('CP4BA'),
    ),
    previews: productPreviews.filter(item =>
      item.name === 'BAW Authoring Assistant' || item.name === 'Business Automation Workflow',
    ),
    demos: productDemoGroups.filter(group =>
      ['IBM Business Automation Workflow', 'IBM Blueworks Live'].includes(group.title),
    ),
    salesKits: [
      { name: 'Business Automation Workflow', url: 'https://ibm.seismic.com/Link/Content/DCRFm2Cjhb3gHGcWJcjcFD7QD84P' },
      { name: 'Business Automation Manager', url: 'https://ibm.biz/BAMSalesKit' },
      { name: 'Robotic Process Automation', url: 'http://ibm.biz/RPASalesKit' },
      { name: 'Blueworks Live', url: 'http://ibm.biz/BWLSalesKit' },
      { name: 'Process Mining', url: 'http://ibm.biz/ProcessMiningSalesKit' },
    ],
    environments: [
      { name: 'Americas - Decision Intelligence SaaS', description: 'Access the Americas Decision Intelligence as a Service demo tenant.', url: 'https://demo-americas-di.decision-prod-us-south.decision.saas.ibm.com/landing', recommended: true },
      { name: 'EMEA - Decision Intelligence SaaS', description: 'Access the EMEA Decision Intelligence as a Service demo tenant.', url: 'https://demo-emea-di.decision-prod-eu-de.decision.saas.ibm.com/landing', recommended: true },
      { name: 'NextGen Cloud Pak for Business Automation as a Service', description: 'Access CP4BA as a Service demo tenants; see the environment user guide for onboarding.', url: 'https://www.automationcloud.ibm.com/' },

      { name: 'BAWoC SaaS Trial', description: 'Access the Business Automation Workflow on Cloud SaaS trial.', url: 'https://www.ibm.com/account/reg/signup?formid=urx-32021' },
      { name: 'RPA SaaS Trial Access', description: 'Access the IBM Robotic Process Automation as a Service trial.', url: 'https://www.ibm.com/account/reg/us-en/signup?formid=urx-46597' },
      { name: 'Process Mining SaaS Trial', description: 'Access the IBM Process Mining SaaS trial.', url: 'https://www.ibm.com/account/reg/signup?formid=urx-51356' },
      { name: 'BAMOE Developer Program', description: 'Experiment with the BAMOE offerings through the free developer program.', url: 'https://ibm.biz/bamoe-developer-program' },
      { name: 'Blueworks Live', description: 'Access the collaborative process mapping environment for IBM Blueworks Live.', url: 'https://www.blueworkslive.com/sLogin.html' },
    ],
    techZoneCollections: [
      { name: 'Workflow automation', description: 'Journey assets for workflow, BAW, case management, and Cloud Pak for Business Automation.', url: 'https://techzone.ibm.com/collection/663ac55b1334c5001e7010eb' },
      { name: 'Robotic Process Automation (RPA)', description: 'Technical sales, demonstration, and enablement assets for IBM RPA.', url: 'https://techzone.ibm.com/collection/5f19e9fb704442001eb5ef71' },
      { name: 'Process mining and modeling', description: 'Assets for Process Mining, Blueworks Live, workflow analysis, and process modeling.', url: 'https://techzone.ibm.com/collection/663ac3cc1334c5001e7010c0' },
    ],
    youtubePlaylists: [
      { name: 'Business Automation Workflow', url: 'https://ibm.biz/baw-playlist', embedUrl: 'https://www.youtube.com/embed/videoseries?list=PL_4RxtD-BL5sL6D6XjqTc4DPI0r6GT8yj', order: 3 },
      { name: 'Blueworks Live', url: 'https://ibm.biz/blueworkslive-videos', embedUrl: 'https://www.youtube.com/embed/videoseries?list=PL_4RxtD-BL5tXKORdO-gRTuaXeUU2Rxc_', order: 5 },
    ],
  },
  'content-services': {
    references: [
      { name: 'IBM Content Cortex', url: 'https://ibm.biz/content-cortex-info' },
      { name: 'IBM Content Cortex AI Agents', url: 'https://ibm.biz/ccx-ai-agents' },
    ],
    aiCapabilities: currentAiCapabilities.filter(item => item.area === 'Content Management'),
    previews: productPreviews.filter(item => item.name === 'IBM Content Cortex Premium'),
    demos: productDemoGroups.filter(group =>
      ['IBM Content Assistant', 'IBM Content Cortex'].includes(group.title),
    ),
    salesKits: [
      { name: 'Content Services', url: 'http://ibm.biz/ContentServicesSaleskit' },
      { name: 'Content Cortex', url: 'http://ibm.biz/FileNetSalesKit' },
      { name: 'Datacap', url: 'http://ibm.biz/DatacapSalesKit' },
      { name: 'Enterprise Records', url: 'http://ibm.biz/IERSalesKit' },
      { name: 'IBM Content Collector', url: 'http://ibm.biz/ICCSalesKit' },
      { name: 'Content Manager OnDemand', url: 'http://ibm.biz/CMODSalesKit' },
    ],
    environments: [
      { name: 'Americas - Decision Intelligence SaaS', description: 'Access the Americas Decision Intelligence as a Service demo tenant.', url: 'https://demo-americas-di.decision-prod-us-south.decision.saas.ibm.com/landing', recommended: true },
      { name: 'EMEA - Decision Intelligence SaaS', description: 'Access the EMEA Decision Intelligence as a Service demo tenant.', url: 'https://demo-emea-di.decision-prod-eu-de.decision.saas.ibm.com/landing', recommended: true },
      { name: 'NextGen Cloud Pak for Business Automation as a Service', description: 'Access CP4BA as a Service demo tenants; see the environment user guide for onboarding.', url: 'https://www.automationcloud.ibm.com/' },
      { name: 'Apollo Business Automation Demo Environment', description: 'Access the Apollo Business Automation journey for Cloud Pak for Business Automation demos.', url: 'https://techzone.ibm.com/collection/apollo-business-automation/journey-cp4ba-demos', recommended: true },
    ],
    techZoneCollections: [
      { name: 'Apollo Business Automation', description: 'AI-powered productivity assets collected from Business Automation engagements.', url: 'https://techzone.ibm.com/collection/606d975f4bb0fb00182d15c5' },
      { name: 'IBM ECM System Monitor', description: 'Technical assets for monitoring and managing enterprise content environments.', url: 'https://techzone.ibm.com/collection/642be8753dc6450017510c5c' },
      { name: 'FileNet Content Manager for Technical Sales Level 4', description: 'Hands-on technical sales labs for IBM FileNet Content Manager.', url: 'https://techzone.ibm.com/collection/67b35eb3cbd2be7df984a4ac' },
      { name: 'Content services and Document processing', description: 'Journey assets for content services, document processing, governance, and capture.', url: 'https://techzone.ibm.com/collection/5f1b3ab4c1a2cf00201d47c4' },
    ],
    youtubePlaylists: [
      { name: 'IBM Content Cortex', url: 'https://ibm.biz/content-cortex-playlist', embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLLmIY2jRnXtU', order: 2 },
    ],
  },
  'decision-intelligence': {
    references: [
      { name: 'IBM Decision Intelligence', url: 'https://ibm.biz/decision-intelligence-info' },
    ],
    aiCapabilities: currentAiCapabilities.filter(item => item.area === 'Decision Intelligence'),
    previews: productPreviews.filter(item => item.name === 'Decision Intelligence'),
    demos: productDemoGroups.filter(group =>
      ['IBM Decision Intelligence', 'IBM Operational Decision Manager'].includes(group.title),
    ),
    salesKits: [
      { name: 'Decision Intelligence Sales Hub', url: 'https://ibm.seismic.com/Link/Content/DCfd77jWhBTR4G4VpQfGXJcF94PV' },
      { name: 'Decision Intelligence', url: 'http://ibm.biz/DecisionIntelligenceSalesKit' },
      { name: 'Operational Decision Manager', url: 'http://ibm.biz/ODMSalesKit' },
      { name: 'Decision Intelligence CMS', url: 'http://ibm.biz/ADSSalesKit' },
    ],
    environments: [
      { name: 'Americas - Decision Intelligence SaaS', description: 'Access the Americas Decision Intelligence as a Service demo tenant.', url: 'https://demo-americas-di.decision-prod-us-south.decision.saas.ibm.com/landing', recommended: true },
      { name: 'EMEA - Decision Intelligence SaaS', description: 'Access the EMEA Decision Intelligence as a Service demo tenant.', url: 'https://demo-emea-di.decision-prod-eu-de.decision.saas.ibm.com/landing', recommended: true },
      { name: 'NextGen Cloud Pak for Business Automation as a Service', description: 'Access CP4BA as a Service demo tenants; see the environment user guide for onboarding.', url: 'https://www.automationcloud.ibm.com/' },
      { name: 'Build a Decision Model', description: 'Follow a hands-on tutorial to model, test, and simulate a business-rule decision model.', url: 'https://techzone.ibm.com/collection/5fa5a97fd48208001863e43a#tab-2' },
      { name: 'ODMoC SaaS Trial', description: 'Access the Operational Decision Manager on Cloud SaaS trial.', url: 'https://www.ibm.com/account/reg/signup?formid=urx-33261' },
    ],
    techZoneCollections: [
      { name: 'Decision management', description: 'Journey assets for Decision Intelligence, ODM, ADS, business rules, and decision services.', url: 'https://techzone.ibm.com/collection/5f1b374cc1a2cf00201d47a9' },
    ],
    youtubePlaylists: [
      { name: 'IBM Decision Intelligence', url: 'https://ibm.biz/decision-intelligence-playlist', embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLbI1TF8727f4', order: 4 },
    ],
  },
  cp4ba: {
    references: [
      { name: 'IBM Cloud Pak for Business Automation', url: 'https://www.ibm.com/products/cloud-pak-for-business-automation' },
      { name: 'Product documentation', url: 'https://www.ibm.com/docs/en/cloud-paks/cp-biz-automation' },
    ],
    aiCapabilities: currentAiCapabilities.filter(item => item.name.startsWith('CP4BA')),
    previews: productPreviews.filter(item => item.name === 'Cloud Pak for Business Automation'),
    demos: productDemoGroups.filter(group => group.title === 'IBM Business Automation Insights'),
    salesKits: [
      { name: 'Business Automation Sales Kits', url: 'http://ibm.biz/BASalesKits' },
      { name: 'Business Automation 2-Pager', url: 'http://ibm.biz/ba-2pager' },
      { name: 'Business Automation Portfolio Hub', url: 'https://ibm.seismic.com/Link/Content/DCVXVmRGj87BmG2Gc368BHMdjQDd' },
      { name: 'Cloud Pak for Business Automation', url: 'http://ibm.biz/CP4BASalesKit' },
      { name: 'Cloud Pak for Business Automation as a Service', url: 'http://ibm.biz/CP4BAaaSSalesKit' },
    ],
    environments: [
      { name: 'NextGen Cloud Pak for Business Automation as a Service', description: 'Access CP4BA as a Service demo tenants; see the environment user guide for onboarding.', url: 'https://www.automationcloud.ibm.com/' },
      { name: 'Apollo Business Automation Demo Environment', description: 'Access the Apollo Business Automation journey for Cloud Pak for Business Automation demos.', url: 'https://techzone.ibm.com/collection/apollo-business-automation/journey-cp4ba-demos', recommended: true },
      { name: 'CP4BAaaS Trial Access', description: 'Access the free 30-day Cloud Pak for Business Automation trial.', url: 'https://www.ibm.com/account/reg/signup?formid=urx-45706' },
      { name: 'Heritage standalone on Cloud offerings', description: 'Access BAW, ODM, BACS, and BACA standalone cloud offerings.', url: 'https://www.bpm.ibmcloud.com/' },
      { name: 'CP4BA on-premises software evaluation', description: 'Obtain software for pre-sales evaluation through the Distributed Software Evaluation Program.', url: 'https://ibm.seismic.com/Link/Content/DC82Wc9PpPqf68MHHTjBpVC84RBB' },
      { name: 'IBM Storage Demo Assets', description: 'Access IBM Storage and Red Hat OpenShift demo assets for IBMers and Business Partners.', url: 'https://techzone.ibm.com/collection/608c4bf4007d260017e993bb/journey-storage-for-hybrid-cloud-fusion' },
    ],
    techZoneCollections: [
      { name: 'Low-code business automation', description: 'Journey assets for low-code application development with Cloud Pak for Business Automation.', url: 'https://techzone.ibm.com/collection/5f1b3565c1a2cf00201d479d' },
      { name: 'Business Automation SaaS (NextGen)', description: 'Enablement, demonstrations, and tenant resources for Business Automation SaaS.', url: 'https://techzone.ibm.com/collection/5fdfcf8b99cf35001ee4954d' },
      { name: 'Apollo Business Automation', description: 'AI-powered productivity assets collected from Business Automation engagements.', url: 'https://techzone.ibm.com/collection/606d975f4bb0fb00182d15c5' },
      { name: 'Business Automation Bite-Sized Demos', description: 'Short product demonstrations designed for sellers to learn and deliver.', url: 'https://techzone.ibm.com/collection/664ce614e7c724001eee429d' },
      { name: 'Business Automation Technology Journey Map', description: 'A guided journey through Business Automation technical assets and experiences.', url: 'https://techzone.ibm.com/collection/5ef3994456dfa7001728cb5c' },
      { name: 'Cloud Pak for Business Automation OpenShift Demo Environments', description: 'Reservable OpenShift environments with Cloud Pak for Business Automation installed.', url: 'https://techzone.ibm.com/collection/5f3551fc5afd330017616fb1' },
      { name: 'CP4BA L’Argent Showcase', description: 'An always-on Cloud Pak for Business Automation showcase environment.', url: 'https://techzone.ibm.com/collection/67af7f9fd435b755e43f44e2' },
      { name: 'Cloud Pak for Automation Traditional Demo Environments', description: 'Reservable Windows and Linux demo platforms for Cloud Pak for Business Automation.', url: 'https://techzone.ibm.com/collection/5fa5a97fd48208001863e43a' },
      { name: 'Code Server', description: 'A code-server utility for secured OpenShift environments, including CP4BA deployments.', url: 'https://techzone.ibm.com/collection/64f757fdf54cab00176dc369' },
      { name: 'TechZone Certified Base Images', description: 'Certified base images for building demonstrations, including Cloud Pak for Business Automation.', url: 'https://techzone.ibm.com/collection/5fb3200cec8dd00017c57f20' },
      { name: 'Utility Equipment Asset Management', description: 'A proof-of-concept featuring BAW, ODM, FileNet, watsonx.ai, Maximo, and SharePoint.', url: 'https://techzone.ibm.com/collection/687086d9b8f4a34893988cf0' },
    ],
    youtubePlaylists: [
      { name: 'IBM Business Automation', url: 'https://ibm.biz/business-automation-playlist', embedUrl: 'https://www.youtube.com/embed/videoseries?list=PL_4RxtD-BL5vuomQEnSVy1qoWY5FOG0Aw', order: 1 },
    ],
  },
}

const surveys = [
  {
    name: 'Survey Launcher',
    url: 'https://ibm.biz/txc-survey-bizauto',
    displayUrl: 'ibm.biz/txc-survey-bizauto',
    qrCode: asset('surveys/business-automation-survey-qr.png'),
  },
  {
    name: 'Client Advisory Board (CAB)',
    url: 'https://ibm.biz/txc-survey-cab',
    displayUrl: 'ibm.biz/txc-survey-cab',
    qrCode: asset('surveys/business-automation-cab-survey-qr.png'),
  },
  {
    name: 'Process Automation User Group',
    url: 'https://ibm.biz/txc-survey-process',
    displayUrl: 'ibm.biz/txc-survey-process',
    qrCode: asset('surveys/process-automation-user-group-survey-qr.png'),
  },
  {
    name: 'Decision Intelligence User Group',
    url: 'https://ibm.biz/txc-survey-di',
    displayUrl: 'ibm.biz/txc-survey-di',
    qrCode: asset('surveys/decision-intelligence-user-group-survey-qr.png'),
  },
  {
    name: 'Content Services User Group',
    url: 'https://ibm.biz/txc-survey-content',
    displayUrl: 'ibm.biz/txc-survey-content',
    qrCode: asset('surveys/content-services-user-group-survey-qr.png'),
  },
  {
    name: 'LAB-3267 Survey',
    url: 'https://ibm.biz/txc-survey-lab3267',
    displayUrl: 'ibm.biz/txc-survey-lab3267',
    qrCode: asset('surveys/lab-3267-survey-qr.png'),
  },
]

function startTimeInMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return Number.MAX_SAFE_INTEGER

  let hour = Number(match[1]) % 12
  if (match[3].toUpperCase() === 'PM') hour += 12
  return hour * 60 + Number(match[2])
}

function formatConferenceTimeRange(time: string) {
  const [start, end] = time.split(/\s*[–-]\s*/)
  const startMatch = start?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  const endMatch = end?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!startMatch || !endMatch) return time

  const startPeriod = (startMatch[3] ?? endMatch[3]).toUpperCase()
  const endPeriod = endMatch[3].toUpperCase()
  return `${startMatch[1].padStart(2, '0')}:${startMatch[2]} ${startPeriod} - ${endMatch[1].padStart(2, '0')}:${endMatch[2]} ${endPeriod}`
}

function TypeBadge({ type }: { type: SessionType }) {
  const cfg = typeConfig[type]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </span>
  )
}

function SessionTypeIdentifier({ type }: { type: SessionType }) {
  const cfg = typeConfig[type]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      {typeAbbreviations[type]} - {cfg.label}
    </span>
  )
}

function SessionCard({
  session,
  expanded,
  onToggle,
  showSpeakerIndicators = false,
}: {
  session: Session
  expanded: boolean
  onToggle: () => void
  showSpeakerIndicators?: boolean
}) {
  const speakerIndicators = showSpeakerIndicators
    ? mainPageSpeakerIndicators.filter(speaker =>
        session.speakers.some(entry => entry.startsWith(`${speaker.name} —`)),
      )
    : []

  return (
    <article
      id={`session-${session.id.toLowerCase()}`}
      className="group scroll-mt-28 border border-white/[0.06] rounded-xl bg-[#262626] hover:border-white/[0.12] transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={onToggle}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {session.url ? (
                <a
                  href={session.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={event => event.stopPropagation()}
                  aria-label={`View ${session.id} on the official IBM session catalog`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#0f62fe]/50 bg-[#0f62fe]/15 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
                >
                  {session.id}
                  <ExternalLinkIcon />
                </a>
              ) : (
                <span className="inline-flex items-center rounded-md border border-[#0f62fe]/40 bg-[#0f62fe]/15 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-[#78a9ff]">
                  {session.id}
                </span>
              )}
              <TypeBadge type={session.type} />
              {speakerIndicators.map(speaker => (
                <span
                  key={speaker.indicator}
                  title={speaker.name}
                  aria-label={speaker.name}
                  className="inline-flex items-center rounded border border-[#3ddbd9]/45 bg-[#3ddbd9]/10 px-2 py-1 font-mono text-[10px] font-bold leading-none tracking-wide text-[#a2f6f4]"
                >
                  {speaker.indicator}
                </span>
              ))}
              {session.inviteOnly && (
                <span className="inline-flex items-center rounded-full border border-[#f1c21b]/40 bg-[#f1c21b]/10 px-2.5 py-1 text-xs font-semibold text-[#f1c21b]">
                  Invite Only
                </span>
              )}
              <CopySectionLink id={`session-${session.id.toLowerCase()}`} label={`${session.id} session`} />
            </div>
            <h3 className="text-[#f4f4f4] font-semibold text-base leading-snug group-hover:text-white transition-colors"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {session.title}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              <span className="flex items-center gap-1.5 text-sm text-[#c6c6c6]">
                <ClockIcon />
                {session.time}
              </span>
              {session.location && (
                session.locationUrl ? (
                  <a
                    href={session.locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={event => event.stopPropagation()}
                    className="flex items-center gap-1.5 text-sm text-[#c6c6c6] transition-colors hover:text-[#a6c8ff]"
                  >
                    <LocationIcon />
                    {session.location}
                    <ExternalLinkIcon />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-[#c6c6c6]">
                    <LocationIcon />
                    {session.location}
                  </span>
                )
              )}
            </div>
          </div>
          <button
            className="shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-[#8d8d8d] bg-white/[0.04] hover:bg-white/[0.08] hover:text-[#c6c6c6] transition-all"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronIcon expanded={expanded} />
          </button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            {session.description && <p className="text-sm text-[#c6c6c6] leading-relaxed">{session.description}</p>}
            {session.image && (
              <a
                href={session.image}
                target="_blank"
                rel="noreferrer"
                onClick={event => event.stopPropagation()}
                className="mt-4 block max-w-sm overflow-hidden rounded-lg border border-white/[0.08] bg-white transition-opacity hover:opacity-95"
                aria-label={`Open full-resolution image for ${session.id}`}
              >
                <img
                  src={session.image}
                  alt={session.imageAlt ?? ''}
                  loading="lazy"
                  className="aspect-square w-full object-contain"
                />
              </a>
            )}
            {session.speakers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-[#8d8d8d] uppercase tracking-widest mb-2">Speakers</p>
                <ul className="space-y-1">
                  {session.speakers.map((speaker, i) => {
                    const [name, role] = speaker.split(' — ')
                    return (
                      <li key={i} className="text-sm text-[#c6c6c6] flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#8d8d8d] shrink-0" />
                        <span>
                          <span className={role ? 'font-semibold text-[#f4f4f4]' : undefined}>{name}</span>
                          {role && <span className="mt-0.5 block text-xs leading-relaxed text-[#c6c6c6]">{role}</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function GeneralSessionCard({ session }: { session: ConferenceGeneralSession }) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = `general-session-details-${session.id.toLowerCase()}`

  return (
    <article
      id={`general-session-${session.id.toLowerCase()}`}
      className="scroll-mt-28 overflow-hidden rounded-xl border border-[#0f62fe]/30 bg-[#0f62fe]/[0.07]"
    >
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#0f62fe]/40 bg-[#0f62fe]/15 px-2.5 py-1 text-xs font-semibold text-[#a6c8ff]">
            General Session
          </span>
          {session.url ? (
            <a
              href={session.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#0f62fe]/50 bg-[#0f62fe]/15 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
              aria-label={`View ${session.id} on the official IBM session catalog`}
            >
              {session.id}
              <ExternalLinkIcon />
            </a>
          ) : (
            <span className="inline-flex items-center rounded-md border border-[#0f62fe]/40 bg-[#0f62fe]/15 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-[#78a9ff]">
              {session.id}
            </span>
          )}
          <CopySectionLink id={`general-session-${session.id.toLowerCase()}`} label={`${session.id} general session`} />
        </div>
        <h4 className="text-lg font-semibold text-white sm:text-xl">{session.title}</h4>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-sm text-[#a6c8ff]">
            <ClockIcon />
            {session.time}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[#c6c6c6]">
            <LocationIcon />
            {session.location}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#c6c6c6]">{session.description}</p>
        {session.accessNote && (
          <p className="mt-3 border-l-2 border-[#78a9ff] pl-3 text-sm leading-relaxed text-[#c6c6c6]">
            {session.accessNote}
          </p>
        )}
        <button
          onClick={() => setExpanded(current => !current)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#a6c8ff] transition-colors hover:text-white"
        >
          {expanded ? 'Hide session details' : 'View session details'}
          <ChevronIcon expanded={expanded} />
        </button>
      </div>
      {expanded && (
        <div id={detailsId} className="border-t border-white/[0.06] bg-[#161616]/70 p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">Activity type</dt>
              <dd className="mt-1 text-sm text-[#f4f4f4]">{session.activityType}</dd>
            </div>
            {session.industry && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">Industry</dt>
                <dd className="mt-1 text-sm text-[#f4f4f4]">{session.industry}</dd>
              </div>
            )}
            {session.technicalLevel && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">Technical level</dt>
                <dd className="mt-1 text-sm text-[#f4f4f4]">{session.technicalLevel}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">Tech track</dt>
              <dd className="mt-1 text-sm leading-relaxed text-[#f4f4f4]">{session.techTrack}</dd>
            </div>
            {session.sessionTopic && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">Session topics</dt>
                <dd className="mt-1 text-sm leading-relaxed text-[#c6c6c6]">{session.sessionTopic}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">Speakers</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {session.speakers.map((speaker, index) => (
                <li key={`${speaker.name ?? 'speaker'}-${speaker.role}-${index}`}>
                  {speaker.name && <p className="text-sm font-semibold text-[#f4f4f4]">{speaker.name}</p>}
                  <p className={`${speaker.name ? 'mt-0.5 text-xs text-[#c6c6c6]' : 'text-sm text-[#f4f4f4]'} leading-relaxed`}>
                    {speaker.role}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </article>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 12 16" fill="none" className="shrink-0">
      <path d="M6 1C3.79 1 2 2.79 2 5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
      <path d="M6 3H3.75A.75.75 0 003 3.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75V10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 3h4v4M13 3L7.5 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
      <path d="M6.25 9.75l3.5-3.5M5.25 11.75l-1 .99a2.47 2.47 0 01-3.49-3.49l2.5-2.5a2.47 2.47 0 013.49 0M10.75 4.25l1-.99a2.47 2.47 0 013.49 3.49l-2.5 2.5a2.47 2.47 0 01-3.49 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ReturnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
      <path d="M13.5 8H2.5M6.5 4L2.5 8l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FullscreenIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
      {active ? (
        <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Filters applied on the current page are written to the query string of copied section links
// (e.g. ?cc=process-automation#community-top) and restored from it when the page loads.
// Only filters that differ from their defaults are included.
const linkFilterKeys = [
  'cc', 'cp', 'lcs', 'lcc', 'lcp', 'days', 'types', 'sspk', 'day', 'basess', 'cspk', 'basched',
  'iid', 'ity', 'ispk', 'caps', 'prs', 'sort',
  'eq', 'ey', 'equ', 'et', 'ep', 'ea', 'es', 'elayout', 'emonth',
] as const
const linkFilterStore: { app: Record<string, string>; enablement: Record<string, string> } = {
  app: {},
  enablement: {},
}
const initialSearchParams = new URLSearchParams(window.location.search)
// The filters are applied once on load; drop them from the address bar so later filter changes
// are not contradicted by stale parameters (copied links always rebuild them from live state).
if (linkFilterKeys.some(key => initialSearchParams.has(key))) {
  const remaining = new URLSearchParams(window.location.search)
  linkFilterKeys.forEach(key => remaining.delete(key))
  const search = remaining.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`)
}

function readSetParam<T extends string>(key: string, allowed: readonly T[] | null, fallback: () => Set<T>): Set<T> {
  const raw = initialSearchParams.get(key)
  if (raw === null) return fallback()
  const values = raw.split('|').filter(Boolean) as T[]
  return new Set(allowed ? values.filter(value => allowed.includes(value)) : values)
}

function readStringParam(key: string, fallback: string, allowed?: readonly string[]) {
  const raw = initialSearchParams.get(key)
  if (raw === null) return fallback
  return !allowed || allowed.includes(raw) ? raw : fallback
}

function readFlagParam(key: string) {
  return initialSearchParams.get(key) === '1'
}

function encodeSetParam(out: Record<string, string>, key: string, selected: Set<string>, all: readonly string[] | null) {
  const isDefault = all ? selected.size === all.length && all.every(value => selected.has(value)) : selected.size === 0
  if (!isDefault) out[key] = [...selected].join('|')
}

function encodeStringParam(out: Record<string, string>, key: string, value: string, fallback: string) {
  if (value !== fallback) out[key] = value
}

function CopySectionLink({ id, label = 'section' }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    const url = new URL(window.location.href)
    const params = new URLSearchParams(url.search)
    linkFilterKeys.forEach(key => params.delete(key))
    Object.entries({ ...linkFilterStore.app, ...linkFilterStore.enablement }).forEach(([key, value]) => {
      params.set(key, value)
    })
    url.search = params.toString()
    url.hash = id
    try {
      await navigator.clipboard.writeText(url.toString())
    } catch {
      const input = document.createElement('textarea')
      input.value = url.toString()
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation()
        void copyLink()
      }}
      aria-label={`Copy hyperlink to ${label}`}
      title={`Copy hyperlink to ${label}`}
      className="ml-auto inline-flex h-5 shrink-0 self-start items-center gap-1 rounded px-1 text-[10px] font-medium leading-none text-[#8d8d8d] opacity-40 transition-all hover:bg-white/[0.04] hover:text-[#a6c8ff] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4589ff]/60"
    >
      <LinkIcon />
      {copied ? 'Copied' : 'Link'}
    </button>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    >
      <path d="M2 4.5l4 3 4-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VideoVisibilityIcon({ visible }: { visible: boolean }) {
  return !visible ? (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
      <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
      <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ThreeLevelVisibilityIcon({ level }: { level: 0 | 1 | 2 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
      {[2, 7, 12].map((y, index) => (
        <rect
          key={y}
          x="2"
          y={y}
          width="12"
          height="2"
          rx="1"
          fill="currentColor"
          opacity={index <= level ? 1 : 0.22}
        />
      ))}
    </svg>
  )
}

function ProductResourceSectionToggleButton({
  expanded,
  controls,
  label,
  onToggle,
}: {
  expanded: boolean
  controls: string
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
      title={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
    >
      <VideoVisibilityIcon visible={expanded} />
    </button>
  )
}

function SalesKitSortIcon({ direction }: { direction: 'asc' | 'desc' }) {
  const ascending = direction === 'asc'
  return (
    <svg aria-hidden="true" viewBox="0 0 18 16" className="h-3.5 w-4" fill="none">
      <text x="1" y="6" fill="currentColor" fontSize="6" fontWeight="600">{ascending ? 'A' : 'Z'}</text>
      <text x="1" y="14" fill="currentColor" fontSize="6" fontWeight="600">{ascending ? 'Z' : 'A'}</text>
      <path d={ascending ? 'M13 2v11m-3-3 3 3 3-3' : 'M13 14V3m-3 3 3-3 3 3'} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SalesKitCapabilitySortIcon({ direction }: { direction: 'asc' | 'desc' }) {
  const ascending = direction === 'asc'
  return (
    <svg aria-hidden="true" viewBox="0 0 18 16" className="h-3.5 w-4" fill="none">
      <rect x="1" y="2" width="7" height="4" rx="1" stroke="currentColor" strokeWidth="1" />
      <rect x="1" y="10" width="7" height="4" rx="1" stroke="currentColor" strokeWidth="1" />
      <path d={ascending ? 'M13 2v11m-3-3 3 3 3-3' : 'M13 14V3m-3 3 3-3 3 3'} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BackToCapabilityTopButton({ onBackToTop }: { onBackToTop: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        onBackToTop()
        window.requestAnimationFrame(() => document.getElementById('capabilities-top')?.scrollIntoView({ behavior: 'smooth' }))
      }}
      aria-label="Back to the top of the page"
      title="Back to top"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#8d8d8d] transition-colors hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
        <path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function scrollElementBelowPageHeader(id: string, behavior: ScrollBehavior = 'auto') {
  const element = document.getElementById(id)
  if (!element) return
  const header = document.querySelector<HTMLElement>('[data-page-header]')
  const headerHeight = header?.getBoundingClientRect().height ?? 0
  const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - 16
  window.scrollTo({ top: Math.max(0, top), behavior })
}

type EnablementItem = {
  name: string
  group: string
  type?: string
  product?: string
  status?: string
  date?: string
  quarter?: string
  audience?: string
  link?: string
  registration?: string
  time?: string
  topic?: string
}

const enablementItems = enablementData.items as EnablementItem[]

const enablementStatusStyles: Record<string, string> = {
  Done: 'border-[#42be65]/40 bg-[#42be65]/10 text-[#6fdc8c]',
  'Working on it': 'border-[#f1c21b]/40 bg-[#f1c21b]/10 text-[#f1c21b]',
  Stuck: 'border-[#fa4d56]/40 bg-[#fa4d56]/10 text-[#ff8389]',
  'On Hold': 'border-white/20 bg-white/[0.05] text-[#c6c6c6]',
}

function safeHttpUrl(url?: string) {
  return url && /^https?:\/\//i.test(url) ? url : undefined
}

function formatEnablementDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatEnablementMonth(key: string) {
  if (key === 'unscheduled') return 'Unscheduled'
  const parsed = new Date(`${key}-01T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? key
    : parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const enablementDatedMonthKeys = Array.from(
  new Set(enablementItems.filter(item => item.date).map(item => item.date!.slice(0, 7))),
).sort()
const enablementCurrentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
const enablementDefaultCalendarMonth = enablementDatedMonthKeys.includes(enablementCurrentMonthKey)
  ? enablementCurrentMonthKey
  : (enablementDatedMonthKeys[enablementDatedMonthKeys.length - 1] ?? enablementCurrentMonthKey)

function shiftEnablementMonth(key: string, delta: number) {
  const next = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1 + delta, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

function parseEnablementTime(time?: string) {
  const match = time && /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim())
  if (!match) return null
  const hours = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  return { hours, minutes: Number(match[2]) }
}

const enablementMinutesOf = (item: EnablementItem) => {
  const time = parseEnablementTime(item.time)
  return time ? time.hours * 60 + time.minutes : -1
}

function icsEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

// Lines longer than 75 octets must be folded; continuation lines start with a space.
function icsFold(line: string) {
  const encoder = new TextEncoder()
  const lines: string[] = []
  let current = ''
  let size = 0
  for (const char of line) {
    const bytes = encoder.encode(char).length
    if (size + bytes > (lines.length === 0 ? 75 : 74)) {
      lines.push(current)
      current = ''
      size = 0
    }
    current += char
    size += bytes
  }
  lines.push(current)
  return lines.join('\r\n ')
}

function icsHash(value: string) {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0
  return hash.toString(16)
}

const icsDate = (date: Date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`

// Items with a time become one-hour events in the viewer's local time (the tracker stores no time zone);
// items without a time become all-day events.
function buildEnablementIcs(items: EnablementItem[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IBM Business Automation//Enablement//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Business Automation Enablement',
  ]
  for (const item of items) {
    if (!item.date) continue
    const start = new Date(`${item.date}T00:00:00`)
    if (Number.isNaN(start.getTime())) continue
    const time = parseEnablementTime(item.time)
    const baseTitle = item.topic || item.name
    const title = /\bIBM\b/i.test(baseTitle) ? baseTitle : `IBM: ${baseTitle}`
    const url = safeHttpUrl(item.link) ?? safeHttpUrl(item.registration)
    const description = [
      item.topic && item.topic !== item.name ? item.name : '',
      item.type ? `Enablement Type: ${item.type}` : '',
      item.product ? `Product: ${item.product}` : '',
      item.audience ? `Audience: ${item.audience}` : '',
      url ? `Link: ${url}` : '',
      time ? `Starts at ${item.time}; time zone not specified, shown in your local time.` : '',
    ].filter(Boolean).join('\n')
    lines.push('BEGIN:VEVENT', `UID:${icsHash(`${item.name}|${item.topic ?? ''}|${item.date}|${item.time ?? ''}`)}@business-automation-pm`, `DTSTAMP:${stamp}`)
    if (time) {
      const begin = new Date(start)
      begin.setHours(time.hours, time.minutes)
      const end = new Date(begin.getTime() + 60 * 60 * 1000)
      const local = (date: Date) => `${icsDate(date)}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}00`
      lines.push(`DTSTART:${local(begin)}`, `DTEND:${local(end)}`)
    } else {
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      lines.push(`DTSTART;VALUE=DATE:${icsDate(start)}`, `DTEND;VALUE=DATE:${icsDate(end)}`)
    }
    lines.push(`SUMMARY:${icsEscape(title)}`)
    if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`)
    if (url) lines.push(`URL:${url}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return `${lines.map(icsFold).join('\r\n')}\r\n`
}

function downloadEnablementIcs(items: EnablementItem[], filename: string) {
  const blob = new Blob([buildEnablementIcs(items)], { type: 'text/calendar;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

const enablementFilenameOf = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'enablement'

function CalendarPlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
      <path d="M2.75 4.25a1 1 0 011-1h8.5a1 1 0 011 1v8.5a1 1 0 01-1 1h-8.5a1 1 0 01-1-1v-8.5zM2.75 6.75h10.5M5.5 2v2.5M10.5 2v2.5M8 8.5v3.5M6.25 10.25h3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EnablementAddToCalendarButton({ item }: { item: EnablementItem }) {
  if (!item.date) return null
  const title = item.topic || item.name
  return (
    <button
      type="button"
      onClick={() => downloadEnablementIcs([item], `${enablementFilenameOf(title)}.ics`)}
      title="Add to calendar"
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.12] bg-white/[0.03] px-2 py-1 text-xs font-semibold text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
    >
      <CalendarPlusIcon />
      <span className="sr-only">Add {title} to calendar</span>
    </button>
  )
}

type EnablementViewMode = 'quarter' | 'collapsed' | 'expanded'
type EnablementFilterKey = 'year' | 'quarter' | 'type' | 'product' | 'audience' | 'status'

const enablementNow = new Date()
const enablementCurrentQuarter = `Q${Math.floor(enablementNow.getMonth() / 3) + 1}`
const enablementCurrentYear = String(enablementNow.getFullYear())
const enablementDefaultQuarter = enablementItems.some(
  item => item.date?.startsWith(enablementCurrentYear) && item.quarter === enablementCurrentQuarter,
)
  ? enablementCurrentQuarter
  : ''
const enablementDefaultYear = enablementItems.some(item => item.date?.startsWith(enablementCurrentYear))
  ? enablementCurrentYear
  : ''
const enablementValuesOf = (item: EnablementItem, key: EnablementFilterKey) =>
  key === 'year'
    ? item.date
      ? [item.date.slice(0, 4)]
      : []
    : (item[key] ?? '').split(',').map(value => value.trim()).filter(Boolean)
const enablementMonthKeyOf = (item: EnablementItem) => (item.date ? item.date.slice(0, 7) : 'unscheduled')
const enablementMonthKeys = Array.from(new Set(enablementItems.map(enablementMonthKeyOf))).sort((a, b) =>
  a === 'unscheduled' ? 1 : b === 'unscheduled' ? -1 : a.localeCompare(b),
)
const enablementQuarterOfMonth = (key: string) =>
  key === 'unscheduled' ? '' : `Q${Math.floor((Number(key.slice(5, 7)) - 1) / 3) + 1}`
const isEnablementCurrentQuarterMonth = (key: string) =>
  key !== 'unscheduled' &&
  key.slice(0, 4) === String(enablementNow.getFullYear()) &&
  enablementQuarterOfMonth(key) === enablementCurrentQuarter
const enablementAllSectionKeys = ['overview', 'activities', ...enablementMonthKeys]

const enablementViewModeLabels: Record<EnablementViewMode, string> = {
  quarter: 'Current year and quarter, first month with data expanded',
  expanded: 'All sections expanded',
  collapsed: 'All sections collapsed',
}
const enablementNextViewMode = (mode: EnablementViewMode | null): EnablementViewMode =>
  mode === 'quarter' ? 'expanded' : mode === 'expanded' ? 'collapsed' : 'quarter'

function EnablementCalendar({
  items,
  month,
  onMonthChange,
}: {
  items: EnablementItem[]
  month: string
  onMonthChange: (month: string) => void
}) {
  const [selected, setSelected] = useState<EnablementItem | null>(null)
  const year = Number(month.slice(0, 4))
  const monthIndex = Number(month.slice(5, 7)) - 1
  const leadingBlanks = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const weekCount = Math.ceil((leadingBlanks + daysInMonth) / 7)
  const byDay = new Map<string, EnablementItem[]>()
  for (const item of items) {
    if (!item.date?.startsWith(month)) continue
    byDay.set(item.date, [...(byDay.get(item.date) ?? []), item].sort((a, b) => enablementMinutesOf(a) - enablementMinutesOf(b)))
  }
  const monthItems = items.filter(item => item.date?.startsWith(month))
  const today = new Date()
  const todayKey = `${enablementCurrentMonthKey}-${String(today.getDate()).padStart(2, '0')}`
  const navButton =
    'inline-flex h-8 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 text-xs font-semibold text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]'
  const selectedUrl = selected ? (safeHttpUrl(selected.link) ?? safeHttpUrl(selected.registration)) : undefined

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button type="button" className={navButton} onClick={() => onMonthChange(shiftEnablementMonth(month, -1))} aria-label="Previous month">
            ←
          </button>
          <button type="button" className={navButton} onClick={() => onMonthChange(shiftEnablementMonth(month, 1))} aria-label="Next month">
            →
          </button>
          <button type="button" className={navButton} onClick={() => onMonthChange(enablementCurrentMonthKey)}>
            Today
          </button>
          <h4 className="ml-2 text-base font-semibold text-white" aria-live="polite">{formatEnablementMonth(month)}</h4>
        </div>
        <button
          type="button"
          disabled={monthItems.length === 0}
          onClick={() => downloadEnablementIcs(monthItems, `business-automation-enablement-${month}.ics`)}
          className={`${navButton} gap-1.5 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <CalendarPlusIcon />
          Add {monthItems.length} in {formatEnablementMonth(month)} to calendar
        </button>
      </div>

      <div className="overflow-x-auto">
        <div role="grid" aria-label={`Enablement activities, ${formatEnablementMonth(month)}`} className="min-w-[44rem]">
          <div role="row" className="grid grid-cols-7 gap-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} role="columnheader" className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8d8d8d]">
                {day}
              </div>
            ))}
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07]">
            {Array.from({ length: weekCount }, (_, week) => (
              <div key={week} role="row" className="grid grid-cols-7 gap-px">
                {Array.from({ length: 7 }, (_, weekday) => {
                  const day = week * 7 + weekday - leadingBlanks + 1
                  if (day < 1 || day > daysInMonth) {
                    return <div key={weekday} role="gridcell" className="min-h-[6.5rem] bg-[#1a1a1a]" />
                  }
                  const dateKey = `${month}-${String(day).padStart(2, '0')}`
                  const dayItems = byDay.get(dateKey) ?? []
                  return (
                    <div key={weekday} role="gridcell" className={`min-h-[6.5rem] min-w-0 p-1.5 ${dateKey === todayKey ? 'bg-[#0f62fe]/15' : 'bg-[#262626]'}`}>
                      <p className={`mb-1 text-[11px] font-semibold ${dateKey === todayKey ? 'text-[#78a9ff]' : 'text-[#8d8d8d]'}`}>{day}</p>
                      <ul className="grid gap-1">
                        {dayItems.map((item, index) => {
                          const label = item.topic || item.name
                          const isSelected = selected === item
                          return (
                            <li key={`${item.name}-${index}`} className="flex items-stretch gap-0.5">
                              <button
                                type="button"
                                onClick={() => setSelected(isSelected ? null : item)}
                                aria-pressed={isSelected}
                                title={`${item.time ? `${item.time} · ` : ''}${label}${item.topic && item.topic !== item.name ? ` (${item.name})` : ''}`}
                                className={`block min-w-0 flex-1 truncate rounded border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] ${
                                  item.status === 'Done' ? 'border-[#42be65] bg-[#42be65]/10 text-[#c6c6c6]' : 'border-[#4589ff] bg-[#0f62fe]/20 text-white'
                                } ${isSelected ? 'ring-2 ring-[#78a9ff]' : 'hover:bg-white/[0.12]'}`}
                              >
                                {item.time && <span className="mr-1 text-[#a8a8a8]">{item.time.replace(':00', '').replace(' ', '').toLowerCase()}</span>}
                                {label}
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadEnablementIcs([item], `${enablementFilenameOf(label)}.ics`)}
                                title="Add this event to calendar (.ics)"
                                className="inline-flex shrink-0 items-center justify-center rounded px-1 text-[#a8a8a8] transition-colors hover:bg-[#0f62fe]/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                              >
                                <CalendarPlusIcon />
                                <span className="sr-only">Add {label} to calendar</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {monthItems.length === 0 && (
        <p className="mt-3 text-center text-sm text-[#c6c6c6]">No activities match your filters in {formatEnablementMonth(month)}.</p>
      )}

      {selected && (
        <div className="mt-3 rounded-lg border border-[#4589ff]/35 bg-[#0f62fe]/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8d8d8d]">
            {selected.date ? formatEnablementDate(selected.date) : 'Date TBD'}{selected.time ? ` · ${selected.time}` : ''}{selected.status ? ` · ${selected.status}` : ''}
          </p>
          <h5 className="mt-1 text-sm font-semibold text-white">{selected.topic || selected.name}</h5>
          {selected.topic && selected.topic !== selected.name && <p className="text-xs text-[#c6c6c6]">{selected.name}</p>}
          <p className="mt-1 text-xs text-[#a8a8a8]">
            {[selected.type, selected.product, selected.audience].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {selectedUrl && (
              <a
                href={selectedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[#4589ff]/35 bg-[#0f62fe]/10 px-2 py-1 text-xs font-semibold text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/25 hover:text-white"
              >
                {safeHttpUrl(selected.link) ? 'Open' : 'Register'}
                <ExternalLinkIcon />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => downloadEnablementIcs([selected], `${enablementFilenameOf(selected.topic || selected.name)}.ics`)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.12] bg-white/[0.03] px-2 py-1 text-xs font-semibold text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white"
            >
              <CalendarPlusIcon />
              Add to calendar (.ics)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EnablementContainer({
  sectionKey,
  linkId,
  title,
  eyebrow,
  count,
  heading: Heading = 'h3',
  headingId,
  collapsed,
  onToggle,
  actions,
  nested = false,
  children,
}: {
  sectionKey: string
  linkId?: string
  title: string
  eyebrow?: string
  count?: string
  heading?: 'h2' | 'h3' | 'h4'
  headingId?: string
  collapsed: boolean
  onToggle: () => void
  actions?: ReactNode
  nested?: boolean
  children: ReactNode
}) {
  const id = `enablement-${sectionKey}`
  const contentId = `${id}-content`
  return (
    <div
      id={id}
      className={`scroll-mt-28 overflow-hidden rounded-xl border ${
        nested ? 'border-white/[0.07] bg-[#1f1f1f]' : 'border-[#4589ff]/25 bg-white/[0.02]'
      }`}
    >
      <div className={`flex items-center justify-between gap-3 px-4 py-3 ${collapsed ? '' : 'border-b border-white/[0.06]'}`}>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">{eyebrow}</p>
          )}
          <Heading
            id={headingId}
            className={`${eyebrow ? 'mt-1 text-2xl' : nested ? 'text-sm' : 'text-base'} font-semibold text-white`}
          >
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={!collapsed}
              aria-controls={contentId}
              title={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
              className="inline-flex items-center gap-2 rounded-sm text-left transition-colors hover:text-[#a6c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
            >
              <span>{title}</span>
              {count && <span className="text-xs font-normal text-[#8d8d8d]">{count}</span>}
              <ChevronIcon expanded={!collapsed} />
            </button>
          </Heading>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <CopySectionLink id={linkId ?? id} label={title} />
        </div>
      </div>
      {!collapsed && (
        <div id={contentId} className={nested ? 'p-3' : 'p-4'}>
          {children}
        </div>
      )}
    </div>
  )
}

function EnablementPage() {
  const [search, setSearch] = useState(() => readStringParam('eq', ''))
  const [filters, setFilters] = useState<Record<EnablementFilterKey, string>>({
    year: readStringParam('ey', enablementDefaultYear),
    quarter: readStringParam('equ', enablementDefaultQuarter),
    type: readStringParam('et', ''),
    product: readStringParam('ep', ''),
    audience: readStringParam('ea', ''),
    status: readStringParam('es', ''),
  })
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(enablementMonthKeys.filter(key => !isEnablementCurrentQuarterMonth(key))),
  )
  const [viewMode, setViewMode] = useState<EnablementViewMode | null>(null)
  const [layout, setLayout] = useState<'list' | 'calendar'>(() =>
    readStringParam('elayout', 'list', ['list', 'calendar']) as 'list' | 'calendar',
  )
  const [calendarMonth, setCalendarMonth] = useState(() =>
    readStringParam('emonth', enablementDefaultCalendarMonth, enablementDatedMonthKeys),
  )

  // Publish the applied filters so copied section links on this page carry them.
  useEffect(() => {
    const out: Record<string, string> = {}
    encodeStringParam(out, 'eq', search.trim(), '')
    encodeStringParam(out, 'ey', filters.year, enablementDefaultYear)
    encodeStringParam(out, 'equ', filters.quarter, enablementDefaultQuarter)
    encodeStringParam(out, 'et', filters.type, '')
    encodeStringParam(out, 'ep', filters.product, '')
    encodeStringParam(out, 'ea', filters.audience, '')
    encodeStringParam(out, 'es', filters.status, '')
    encodeStringParam(out, 'elayout', layout, 'list')
    if (layout === 'calendar') encodeStringParam(out, 'emonth', calendarMonth, enablementDefaultCalendarMonth)
    linkFilterStore.enablement = out
    return () => {
      linkFilterStore.enablement = {}
    }
  }, [search, filters, layout, calendarMonth])

  const isCollapsed = (key: string) => collapsed.has(key)
  const toggleSection = (key: string) =>
    setCollapsed(current => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  // Opening a link to a month or the activities list reveals it, even if it was collapsed or filtered out.
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      const monthMatch = /^enablement-(\d{4}-\d{2})$/.exec(id)
      if (id !== 'enablement-activities' && !monthMatch) return
      setCollapsed(current => {
        const next = new Set(current)
        next.delete('activities')
        if (monthMatch) next.delete(monthMatch[1])
        return next
      })
      if (monthMatch) {
        setFilters(current => ({
          ...current,
          year: current.year && current.year !== monthMatch[1].slice(0, 4) ? '' : current.year,
          quarter: current.quarter && current.quarter !== enablementQuarterOfMonth(monthMatch[1]) ? '' : current.quarter,
        }))
      }
      window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }))
    }
    reveal()
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  }, [])

  const cycleViewMode = () => {
    const next = enablementNextViewMode(viewMode)
    setViewMode(next)
    if (next === 'expanded') {
      setCollapsed(new Set())
    } else if (next === 'collapsed') {
      setCollapsed(new Set(enablementAllSectionKeys))
    } else {
      // Current year and quarter; only the first month that has data stays open.
      // The "Activities by month" container is kept open too, since the month lives inside it.
      const nextFilters = { ...filters, year: enablementDefaultYear, quarter: enablementDefaultQuarter }
      const firstMonthWithData = enablementMonthKeys.find(monthKey =>
        enablementItems.some(item => enablementMonthKeyOf(item) === monthKey && matchesFilters(item, nextFilters)),
      )
      setFilters(nextFilters)
      setCollapsed(
        new Set(enablementAllSectionKeys.filter(key => key !== 'activities' && key !== firstMonthWithData)),
      )
    }
  }
  const nextViewMode = enablementNextViewMode(viewMode)

  const optionsFor = (key: EnablementFilterKey) =>
    Array.from(new Set(enablementItems.flatMap(item => enablementValuesOf(item, key)))).sort()

  const filterFields = [
    { key: 'year', label: 'Year' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'type', label: 'Enablement type' },
    { key: 'product', label: 'Product' },
    { key: 'audience', label: 'Audience' },
    { key: 'status', label: 'Status' },
  ] as const

  const handleFilterChange = (key: EnablementFilterKey, value: string) => {
    setFilters(current => ({ ...current, [key]: value }))
    // Choosing a year or quarter opens the months that match both and collapses the rest.
    if ((key === 'year' || key === 'quarter') && value) {
      const year = key === 'year' ? value : filters.year
      const quarter = key === 'quarter' ? value : filters.quarter
      setCollapsed(current => {
        const next = new Set(current)
        for (const monthKey of enablementMonthKeys) {
          const matches =
            (!year || monthKey.slice(0, 4) === year) && (!quarter || enablementQuarterOfMonth(monthKey) === quarter)
          if (matches) next.delete(monthKey)
          else next.add(monthKey)
        }
        return next
      })
    }
  }

  const query = search.trim().toLowerCase()
  function matchesFilters(item: EnablementItem, activeFilters: Record<EnablementFilterKey, string>) {
    for (const { key } of filterFields) {
      const selected = activeFilters[key]
      if (selected && !enablementValuesOf(item, key).includes(selected)) return false
    }
    if (!query) return true
    return [item.name, item.topic, item.product, item.type, item.audience, item.group]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  }
  const filtered = enablementItems.filter(item => matchesFilters(item, filters))

  const grouped = new Map<string, EnablementItem[]>()
  for (const item of filtered) {
    const key = enablementMonthKeyOf(item)
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }
  const monthKeys = enablementMonthKeys.filter(key => grouped.has(key))

  const doneCount = enablementItems.filter(item => item.status === 'Done').length
  const hasActiveFilters = Boolean(query) || Object.values(filters).some(Boolean)
  const syncedOn = formatEnablementDate(enablementData.generatedAt)

  return (
    <section id="enablement-top" aria-labelledby="enablement-heading" className="grid grid-cols-[minmax(0,1fr)] scroll-mt-28 gap-6">
      <EnablementContainer
        sectionKey="overview"
        linkId="enablement-top"
        eyebrow="Community"
        title="Business Automation Enablement"
        heading="h2"
        headingId="enablement-heading"
        collapsed={isCollapsed('overview')}
        onToggle={() => toggleSection('overview')}
        actions={
          <button
            type="button"
            onClick={cycleViewMode}
            aria-label={`View: ${viewMode ? enablementViewModeLabels[viewMode] : 'default'}. Switch to: ${enablementViewModeLabels[nextViewMode]}`}
            title={`Switch to: ${enablementViewModeLabels[nextViewMode]}`}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
          >
            <ThreeLevelVisibilityIcon level={viewMode === 'expanded' ? 2 : viewMode === 'collapsed' ? 0 : 1} />
          </button>
        }
      >
        <p className="max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
          User group sessions, COE enablement, and sales enablement activities for IBM Business Automation, organized by date.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#4589ff]/35 bg-gradient-to-r from-[#0f62fe]/15 to-[#262626]">
          <div className="grid gap-px bg-white/[0.06] sm:grid-cols-3">
            {[
              { label: 'Activities', value: enablementItems.length },
              { label: 'Completed', value: doneCount },
              { label: 'Upcoming or in progress', value: enablementItems.length - doneCount },
            ].map(stat => (
              <div key={stat.label} className="bg-[#262626]/95 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8d8d8d]">{stat.label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.07] bg-[#262626] p-4">
          <label className="block">
            <span className="sr-only">Search enablement activities</span>
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by name, topic, product, or audience"
              className="h-10 w-full rounded-md border border-white/[0.1] bg-[#161616] px-3 text-sm text-white placeholder:text-[#8d8d8d] focus:outline-none focus:ring-2 focus:ring-[#78a9ff]"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {filterFields.map(({ key, label }) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d8d8d]">{label}</span>
                <select
                  value={filters[key]}
                  onChange={event => handleFilterChange(key, event.target.value)}
                  className="h-9 w-full rounded-md border border-white/[0.1] bg-[#161616] px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#78a9ff]"
                >
                  <option value="">All</option>
                  {optionsFor(key).map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#8d8d8d]">
            <span aria-live="polite">Showing {filtered.length} of {enablementItems.length} activities</span>
            <span className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={filtered.every(item => !item.date)}
                onClick={() => downloadEnablementIcs(filtered, 'business-automation-enablement.ics')}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] px-2.5 py-1 font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CalendarPlusIcon />
                Export {filtered.filter(item => item.date).length} to calendar (.ics)
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setFilters({ year: '', quarter: '', type: '', product: '', audience: '', status: '' })
                  }}
                  className="rounded-md border border-white/[0.1] px-2.5 py-1 font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </span>
          </div>
        </div>
      </EnablementContainer>

      <EnablementContainer
        sectionKey="activities"
        title="Activities by month"
        count={`${filtered.length} of ${enablementItems.length}`}
        collapsed={isCollapsed('activities')}
        onToggle={() => toggleSection('activities')}
        actions={
          <div role="group" aria-label="Activities layout" className="mr-1 inline-flex overflow-hidden rounded-md border border-white/[0.1]">
            {(['list', 'calendar'] as const).map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={layout === option}
                onClick={() => setLayout(option)}
                className={`px-2.5 py-1 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] ${
                  layout === option ? 'bg-[#0f62fe]/30 text-white' : 'bg-white/[0.03] text-[#c6c6c6] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        }
      >
        {layout === 'calendar' ? (
          <EnablementCalendar items={filtered} month={calendarMonth} onMonthChange={setCalendarMonth} />
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-[#262626] px-5 py-8 text-center text-sm text-[#c6c6c6]">
            No activities match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
            {monthKeys.map(monthKey => (
              <EnablementContainer
                key={monthKey}
                sectionKey={monthKey}
                nested
                heading="h3"
                title={formatEnablementMonth(monthKey)}
                count={`(${grouped.get(monthKey)?.length})`}
                collapsed={isCollapsed(monthKey)}
                onToggle={() => toggleSection(monthKey)}
              >
                <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5">
                  {grouped.get(monthKey)?.map((item, index) => {
                    const url = safeHttpUrl(item.link) ?? safeHttpUrl(item.registration)
                    const actionLabel = safeHttpUrl(item.link) ? 'Open' : 'Register'
                    const title = item.topic || item.name
                    const dateLabel = item.date ? formatEnablementDate(item.date) : 'Date TBD'
                    const tags = [item.type, item.product, item.audience, item.quarter].filter((tag): tag is string =>
                      Boolean(tag),
                    )
                    const fullDetails = [
                      `${item.date ? formatEnablementDate(item.date) : 'Date to be determined'}${item.time ? ` · ${item.time}` : ''}`,
                      title,
                      item.topic && item.topic !== item.name ? item.name : '',
                      tags.join(' · '),
                    ]
                      .filter(Boolean)
                      .join('\n')
                    return (
                      <li
                        key={`${item.name}-${item.date ?? 'none'}-${index}`}
                        title={fullDetails}
                        className="flex min-w-0 items-center gap-3 rounded-lg border border-white/[0.07] bg-[#262626] px-3 py-1.5 transition-colors hover:border-[#4589ff]/35"
                      >
                        <span className="w-24 shrink-0 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8d8d8d]">
                          {dateLabel}
                        </span>
                        <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                          {title}
                          {item.topic && item.topic !== item.name && (
                            <span className="ml-2 text-xs font-normal text-[#c6c6c6]">{item.name}</span>
                          )}
                        </h4>
                        {tags.length > 0 && (
                          <span className="hidden max-w-[14rem] shrink truncate whitespace-nowrap text-[11px] text-[#a8a8a8] lg:block">
                            {tags.join(' · ')}
                          </span>
                        )}
                        {item.status && (
                          <span
                            className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                              enablementStatusStyles[item.status] ?? 'border-white/20 bg-white/[0.05] text-[#c6c6c6]'
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                        <EnablementAddToCalendarButton item={item} />
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-[#4589ff]/35 bg-[#0f62fe]/10 px-2 py-1 text-xs font-semibold text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/25 hover:text-white"
                          >
                            {actionLabel}
                            <ExternalLinkIcon />
                            <span className="sr-only"> {title} (opens in a new tab)</span>
                          </a>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </EnablementContainer>
            ))}
          </div>
        )}
      </EnablementContainer>

      <p className="text-center text-xs text-[#8d8d8d]">
        Snapshot of the Business Automation Enablement Tracker, last synced on {syncedOn}.
      </p>
      <div className="flex justify-center">
        <a
          href="#enablement-top"
          className="rounded-lg border border-[#4589ff]/50 bg-[#0f62fe]/15 px-4 py-2.5 text-sm font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
        >
          Back to top
        </a>
      </div>
    </section>
  )
}

type GlobalSearchEntry = {
  id: string
  title: string
  subtitle: string
  category: string
  haystack: string
  pages: Page[]
  url?: string
  sessionId?: string
  gated?: boolean
  element?: HTMLElement
}

type GlobalSearchScope = 'site' | 'page' | 'subpages'

const globalSearchScopes: { id: GlobalSearchScope; chip: string; placeholder: string; description: string }[] = [
  { id: 'site', chip: 'Site', placeholder: 'Search site', description: 'entire site' },
  { id: 'page', chip: 'Page', placeholder: 'Search page', description: 'current page' },
  { id: 'subpages', chip: 'Page+', placeholder: 'Search page and subpages', description: 'current page and sub-pages' },
]

function isPageWithin(page: Page, root: Page) {
  let current: Page | undefined = page
  while (current) {
    if (current === root) return true
    current = breadcrumbParents[current]
  }
  return false
}

const globalSearchGatedPages: Page[] = ['ibm', 'insights', 'speaker']

function buildGlobalSearchEntries(): GlobalSearchEntry[] {
  const entries: GlobalSearchEntry[] = []
  const text = (...parts: Array<string | string[] | undefined>) => parts.flat().filter(Boolean).join(' ')
  const add = (entry: Omit<GlobalSearchEntry, 'haystack'>, ...extra: Array<string | string[] | undefined>) => {
    const created = { ...entry, haystack: text(entry.title, entry.subtitle, entry.category, ...extra).toLowerCase() }
    entries.push(created)
    return created
  }
  const hostOf = (url: string) => url.replace(/^https?:\/\//, '').split('/')[0]

  ;(Object.keys(pageAnchors) as Page[]).filter(page => page !== 'product').forEach(page => {
    const capability = businessAutomationCapabilities.find(item => item.page === page)
    const parents = getBreadcrumbTrail(page).slice(0, -1).map(parent => breadcrumbLabels[parent]).join(' / ')
    add({
      id: pageAnchors[page],
      pages: [page],
      title: page === 'sessions' ? 'Sessions' : breadcrumbLabels[page],
      subtitle: capability?.tagline ?? (parents || 'Home'),
      category: 'Page',
      gated: globalSearchGatedPages.includes(page),
    }, capability?.description, capability?.overview, capability?.capabilities)
  })

  sessions.forEach(session => add({
    id: `session-${session.id.toLowerCase()}`,
    sessionId: session.id,
    pages: ['sessions'],
    title: session.title,
    subtitle: `${session.id} · ${session.type} · ${session.day} · ${session.time}`,
    category: 'Session',
  }, session.description, session.speakers, session.location, session.track))

  generalSessions.forEach(session => add({
    id: `general-session-${session.id.toLowerCase()}`,
    pages: ['schedule'],
    title: session.title,
    subtitle: `${session.day} · ${session.time} · ${session.location}`,
    category: 'General session',
  }, session.description, session.speakers.map(speaker => text(speaker.name, speaker.role)), session.techTrack, session.sessionTopic, session.industry))

  venueMaps.forEach((map, index) => add({
    id: `venue-map-${index + 1}`, pages: ['maps'], title: map.title, subtitle: map.description, category: 'Map',
  }))
  conferenceInfo.forEach((item, index) => add({
    id: `conference-info-${index + 3}`, pages: ['info'], title: item.title, subtitle: item.description, category: 'Conference info',
  }))
  userConnectCommunities.forEach((community, index) => add({
    id: `community-${index + 1}`, pages: ['community'], title: community.name, subtitle: 'IBM User Connect community', category: 'Community',
  }, community.description, community.products))
  surveys.forEach((survey, index) => add({
    id: `survey-${index + 1}`, pages: ['surveys'], title: survey.name, subtitle: survey.displayUrl, category: 'Survey',
  }))
  ugSectionImages.forEach(item => add({
    id: item.id, pages: ['ug'], title: item.title, subtitle: item.description ?? 'User group resource', category: 'User group',
  }))

  const seenResources = new Map<string, GlobalSearchEntry>()
  const addResource = (page: PortfolioResourcePage, name: string, subtitle: string, category: string, url?: string) => {
    const key = `${category}|${name}|${url ?? ''}`
    const existing = seenResources.get(key)
    if (existing) {
      if (!existing.pages.includes(page)) existing.pages.push(page)
      return
    }
    seenResources.set(key, add({
      id: 'new-ai-capabilities',
      pages: [page, 'capabilities'],
      title: name,
      subtitle: url ? `${subtitle ? `${subtitle} · ` : ''}${hostOf(url)}` : subtitle,
      category,
      url,
    }))
  }
  ;(Object.entries(portfolioResources) as [PortfolioResourcePage, (typeof portfolioResources)[PortfolioResourcePage]][]).forEach(([page, resources]) => {
    resources.references.forEach(item => addResource(page, item.name, '', 'Reference', item.url))
    resources.aiCapabilities.forEach(item => addResource(page, item.name, `${item.area} · ${item.description}`, 'AI capability'))
    resources.previews.forEach(item => addResource(page, item.name, item.action, 'Preview or trial', item.url))
    resources.demos.forEach(group => group.links.forEach(link => addResource(page, link.name, group.title, 'Demo', link.url)))
    resources.salesKits.forEach(item => addResource(page, item.name, '', 'Sales kit', item.url))
    resources.environments.forEach(item => addResource(page, item.name, item.description, 'Demo environment', item.url))
    resources.techZoneCollections.forEach(item => addResource(page, item.name, item.description, 'TechZone collection', item.url))
    resources.youtubePlaylists.forEach(item => addResource(page, item.name, '', 'YouTube playlist', item.url))
  })

  enablementItems.forEach(item => add({
    id: item.date ? `enablement-${enablementMonthKeyOf(item)}` : 'enablement-activities',
    pages: ['enablement'],
    title: item.topic ? `${item.name} — ${item.topic}` : item.name,
    subtitle: [item.date, item.group, item.status].filter(Boolean).join(' · '),
    category: 'Enablement',
  }, item.type, item.product, item.audience, item.quarter))

  badgeEntries.forEach(badge => add({
    id: `badges-${badge.id}`,
    pages: ['badges'],
    title: badge.name,
    subtitle: badge.criteria.join(' · '),
    category: 'Badge',
  }, badge.capabilities.map(capability => businessAutomationCapabilityFilters.find(filter => filter.page === capability)?.label ?? capability), badge.levels.map(level => `Level ${level}`), badge.products, badge.description, badge.criteria, badge.note))

  // Onboarding Automation page: index every block of text in every (nested) section.
  const plainOnboardingText = (value: string) => value.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1').replace(/\*\*/g, '')
  const indexOnboardingSections = (sectionList: OnboardingSection[], trail: string[]) => {
    sectionList.forEach(section => {
      const path = [...trail, section.title]
      const sectionSubtitle = trail.length > 0 ? trail.join(' / ') : 'Onboarding Automation'
      add({
        id: onboardingAutomationAnchor(section.id),
        pages: ['onboarding-automation'],
        title: section.title,
        subtitle: sectionSubtitle,
        category: 'Onboarding Automation',
      })
      section.blocks.forEach(block => {
        if (block.t === 'sec') {
          indexOnboardingSections([block.s], path)
          return
        }
        let content = ''
        if (block.t === 'p' || block.t === 'note') content = block.x
        else if (block.t === 'step') content = `${block.n} ${block.x}`
        else if (block.t === 'list') content = [...(block.labels ?? []), ...block.items].join(' ')
        else if (block.t === 'table') content = [...(block.head ?? []), ...block.rows.flat()].join(' ')
        else if (block.t === 'img') content = block.alt
        content = plainOnboardingText(content).replace(/\s+/g, ' ').trim()
        if (!content) return
        add({
          id: onboardingAutomationAnchor(section.id),
          pages: ['onboarding-automation'],
          title: section.title,
          subtitle: content.length > 160 ? `${content.slice(0, 160)}…` : content,
          category: 'Onboarding Automation',
        }, content)
      })
    })
  }
  indexOnboardingSections(onboardingAutomationSections, [])

  return entries
}

const globalSearchEntries = buildGlobalSearchEntries()

const globalSearchResultLimit = 100

function searchGlobalEntries(entries: GlobalSearchEntry[], query: string, limit = globalSearchResultLimit) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []
  return entries
    .map((entry, index) => {
      if (!tokens.every(token => entry.haystack.includes(token))) return null
      const title = entry.title.toLowerCase()
      const score = tokens.reduce((total, token) => total + (title.startsWith(token) ? 3 : title.includes(token) ? 2 : 0), 0) +
        (entry.category === 'Page' ? 1 : 0)
      return { entry, index, score }
    })
    .filter((match): match is { entry: GlobalSearchEntry; index: number; score: number } => match !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(match => match.entry)
}

function searchRenderedPage(query: string, limit: number): GlobalSearchEntry[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  const root = document.querySelector('main')
  if (!root || tokens.length === 0) return []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const seen = new Set<HTMLElement>()
  const found: GlobalSearchEntry[] = []
  for (let node = walker.nextNode(); node && found.length < limit; node = walker.nextNode()) {
    let block = node.parentElement
    if (!block || block.closest('svg, script, style, [role="search"]')) continue
    while (block.parentElement && block !== root && getComputedStyle(block).display === 'inline') block = block.parentElement
    if (seen.has(block)) continue
    seen.add(block)
    const content = (block.textContent ?? '').replace(/\s+/g, ' ').trim()
    const lower = content.toLowerCase()
    if (!tokens.every(token => lower.includes(token)) || block.getClientRects().length === 0) continue
    const start = Math.max(0, lower.indexOf(tokens[0]) - 30)
    found.push({
      id: `rendered-${found.length}`,
      title: `${start > 0 ? '…' : ''}${content.slice(start, start + 110)}${start + 110 < content.length ? '…' : ''}`,
      subtitle: '',
      category: 'On this page',
      haystack: lower,
      pages: [],
      element: block,
    })
  }
  return found
}

function GlobalSearch({
  currentPage,
  includeGated,
  onSelect,
}: {
  currentPage: Page
  includeGated: boolean
  onSelect: (entry: GlobalSearchEntry) => void
}) {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<GlobalSearchScope>('site')
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const scopeConfig = globalSearchScopes.find(item => item.id === scope) ?? globalSearchScopes[0]
  const entries = useMemo(
    () => globalSearchEntries.filter(entry => {
      if (entry.gated && !includeGated) return false
      if (scope === 'page') return entry.pages.includes(currentPage)
      if (scope === 'subpages') return entry.pages.some(page => isPageWithin(page, currentPage))
      return true
    }),
    [currentPage, includeGated, scope],
  )
  const cycleScope = () => {
    const next = globalSearchScopes[(globalSearchScopes.findIndex(item => item.id === scope) + 1) % globalSearchScopes.length]
    setScope(next.id)
    setActiveIndex(0)
    inputRef.current?.focus()
  }
  const results = useMemo(() => {
    const indexed = searchGlobalEntries(entries, query)
    if (scope === 'site' || indexed.length >= globalSearchResultLimit) return indexed
    return [...indexed, ...searchRenderedPage(query, globalSearchResultLimit - indexed.length)]
  }, [entries, query, scope])
  const isOpen = isFocused && query.trim() !== ''
  const optionId = (index: number) => `global-search-option-${index}`

  const choose = (entry: GlobalSearchEntry) => {
    setQuery('')
    setActiveIndex(0)
    inputRef.current?.blur()
    const element = entry.element
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const previous = element.style.outline
      element.style.outline = '2px solid #78a9ff'
      element.style.outlineOffset = '4px'
      window.setTimeout(() => { element.style.outline = previous }, 2000)
      return
    }
    onSelect(entry)
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault()
      setActiveIndex(index => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault()
      setActiveIndex(index => (index - 1 + results.length) % results.length)
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault()
      choose(results[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setQuery('')
      inputRef.current?.blur()
    }
  }

  return (
    <div role="search" className="relative w-44 shrink-0 sm:w-72">
      <label htmlFor="global-search-input" className="sr-only">Search the site</label>
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8d8d8d]" />
      <input
        ref={inputRef}
        id="global-search-input"
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="global-search-results"
        aria-autocomplete="list"
        aria-activedescendant={isOpen && results.length > 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        placeholder={scopeConfig.placeholder}
        value={query}
        onChange={event => {
          setQuery(event.target.value)
          setActiveIndex(0)
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="h-8 w-full rounded-md border border-white/[0.1] bg-white/[0.04] pl-8 pr-11 text-xs text-white placeholder:text-[#8d8d8d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
      />
      <button
        type="button"
        onMouseDown={event => event.preventDefault()}
        onClick={cycleScope}
        aria-label={`Search scope: ${scopeConfig.description}. Activate to change.`}
        title={`Searching ${scopeConfig.description}. Click to change.`}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#a6c8ff] transition-colors hover:bg-white/[0.16] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
      >
        {scopeConfig.chip}
      </button>
      {isOpen && (
        <ul
          id="global-search-results"
          role="listbox"
          aria-label="Search results"
          className="absolute right-0 top-full z-30 mt-1 max-h-96 w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-white/[0.12] bg-[#262626] py-1 shadow-xl"
        >
          {results.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-xs text-[#c6c6c6]">No results for “{query.trim()}” in {scopeConfig.description}</li>
          ) : results.map((entry, index) => (
            <li
              key={`${entry.category}-${entry.id}-${entry.title}-${index}`}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(entry)}
              className={`cursor-pointer px-3 py-2 ${index === activeIndex ? 'bg-[#0f62fe]/25' : ''}`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#78a9ff]">
                {entry.category}{entry.url ? ' ↗' : ''}
              </span>
              <span className="block truncate text-xs font-semibold text-white">{entry.title}</span>
              {entry.subtitle && <span className="block truncate text-[11px] text-[#a8a8a8]">{entry.subtitle}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => pageForHash(window.location.hash))
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    const page = pageForHash(window.location.hash)
    return id && id !== pageAnchors[page] ? id : null
  })
  const [communityCapabilities, setCommunityCapabilities] = useState<Set<string>>(() => {
    const ids = communityCapabilityOptions.map(option => option.id)
    return readSetParam('cc', ids, () => new Set(ids))
  })
  const [isCommunityFiltersExpanded, setIsCommunityFiltersExpanded] = useState(true)
  const [communityProducts, setCommunityProducts] = useState<Set<string>>(() => {
    const ids = communityProductOptions.map(option => option.id)
    return readSetParam('cp', ids, () => new Set(ids))
  })
  const [letsCreateVisibleSections, setLetsCreateVisibleSections] = useState<Set<string>>(() => {
    const ids = letsCreateSections.map(section => section.id)
    return readSetParam('lcs', ids, () => new Set(ids))
  })
  const [letsCreateCapabilities, setLetsCreateCapabilities] = useState<Set<string>>(() => {
    const ids = communityCapabilityOptions.map(option => option.id)
    return readSetParam('lcc', ids, () => new Set(ids))
  })
  const [letsCreateProducts, setLetsCreateProducts] = useState<Set<string>>(() => {
    const ids = letsCreateProductOptions.map(option => option.id)
    return readSetParam('lcp', ids, () => new Set(ids))
  })
  const [isLetsCreateFiltersExpanded, setIsLetsCreateFiltersExpanded] = useState(false)
  const [onboardingCollapsed, setOnboardingCollapsed] = useState<Set<string>>(() => new Set(allOnboardingSectionIds))
  const [onboardingContentsCollapsed, setOnboardingContentsCollapsed] = useState(false)
  // The header button also drives Contents: it is collapsed together with the sections, open at the other two levels.
  const cycleOnboardingPage = () => {
    const next = nextOnboardingPageCollapsed(onboardingCollapsed)
    setOnboardingCollapsed(next)
    setOnboardingContentsCollapsed(onboardingPageLevel(next) === 0)
  }
  const [siteAccessCount, setSiteAccessCount] = useState<number | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    let alreadyCounted = false
    try {
      alreadyCounted = sessionStorage.getItem(SITE_ACCESS_COUNTED_KEY) === 'true'
    } catch {
      // sessionStorage unavailable; count this load.
    }
    fetch(`${SITE_ACCESS_COUNTER_URL}/${alreadyCounted ? 'get' : 'hit'}/${SITE_ACCESS_COUNTER_NAMESPACE}/${SITE_ACCESS_COUNTER_KEY}`, {
      signal: controller.signal,
    })
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: { value?: number }) => {
        if (typeof data.value !== 'number') return
        setSiteAccessCount(data.value)
        try {
          sessionStorage.setItem(SITE_ACCESS_COUNTED_KEY, 'true')
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // Counter unavailable or blocked; the footer simply omits the count.
      })
    return () => controller.abort()
  }, [])
  const currentPageRef = useRef(currentPage)
  const previousPageRef = useRef<Page | null>(null)
  const [selectedCapabilityPages, setSelectedCapabilityPages] = useState<Set<PortfolioResourcePage>>(() => {
    const initialPage = pageForHash(window.location.hash)
    const selectedPage = businessAutomationCapabilityFilters.find(filter => filter.page === initialPage)?.page
    if (!selectedPage && initialPage === 'capabilities') {
      const linked = readSetParam<PortfolioResourcePage>('caps', allBusinessAutomationCapabilityPages, () => new Set())
      if (linked.size > 0) return linked
    }
    return new Set(selectedPage ? [selectedPage] : allBusinessAutomationCapabilityPages)
  })
  const [hasIbmAccess, setHasIbmAccess] = useState(() => {
    try {
      return sessionStorage.getItem(IBM_ACCESS_SESSION_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [ibmPassword, setIbmPassword] = useState('')
  const [ibmAccessError, setIbmAccessError] = useState('')
  const [insightsSessionIdFilter, setInsightsSessionIdFilter] = useState(() => readStringParam('iid', 'all'))
  const [insightsSessionTypeFilter, setInsightsSessionTypeFilter] = useState(() => readStringParam('ity', 'all'))
  const [insightsSpeakerFilter, setInsightsSpeakerFilter] = useState(() => readStringParam('ispk', 'all'))
  const [isMainHeaderExpanded, setIsMainHeaderExpanded] = useState(true)
  const [activeOverviewDay, setActiveOverviewDay] = useState<string>(() =>
    readStringParam('day', getInitialConferenceDay(), conferenceDays),
  )
  const [activeConferenceSpeakers, setActiveConferenceSpeakers] = useState<Set<string>>(() =>
    readSetParam('cspk', null, () => new Set<string>()),
  )
  const [showBASessions, setShowBASessions] = useState(() => readFlagParam('basess') || activeConferenceSpeakers.size > 0)
  const [showBusinessAutomationSchedule, setShowBusinessAutomationSchedule] = useState(() => readFlagParam('basched'))
  const [activeDays, setActiveDays] = useState<Set<string>>(() => readSetParam('days', days, () => new Set(days)))
  const [activeTypes, setActiveTypes] = useState<Set<SessionType>>(() =>
    readSetParam<SessionType>('types', allTypes, () => new Set(allTypes)),
  )
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(() => readSetParam('sspk', null, () => new Set<string>()))
  const [showFilters, setShowFilters] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showThomasImage, setShowThomasImage] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))
  const [isOverviewVideoExpanded, setIsOverviewVideoExpanded] = useState(false)
  const [isCapabilityFilterExpanded, setIsCapabilityFilterExpanded] = useState(true)
  const [isCapabilityContentsExpanded, setIsCapabilityContentsExpanded] = useState(true)
  const [isCapabilityOverviewExpanded, setIsCapabilityOverviewExpanded] = useState(false)
  const [isConferenceTechxchangeExpanded, setIsConferenceTechxchangeExpanded] = useState(false)
  const [isProductResourcesExpanded, setIsProductResourcesExpanded] = useState(false)
  const [isProductResourceFiltersExpanded, setIsProductResourceFiltersExpanded] = useState(true)
  const [salesKitSortMode, setSalesKitSortMode] = useState<
    'default' | 'title-asc' | 'title-desc' | 'capability-asc' | 'capability-desc'
  >(() =>
    readStringParam('sort', 'default', ['default', 'title-asc', 'title-desc', 'capability-asc', 'capability-desc']) as
      'default' | 'title-asc' | 'title-desc' | 'capability-asc' | 'capability-desc',
  )
  const [visibleProductResourceSections, setVisibleProductResourceSections] = useState<Set<ProductResourceSection>>(
    () => {
      const ids = productResourceSectionFilters.map(filter => filter.id)
      return readSetParam<ProductResourceSection>('prs', ids, () => new Set(ids))
    },
  )
  // An empty selection means no filtering, same as selecting all.
  const allOrSelected = (selected: Set<string>, all: readonly string[]) => selected.size === 0 ? new Set(all) : selected
  const effectiveLetsCreateSections = allOrSelected(letsCreateVisibleSections, letsCreateSections.map(section => section.id))
  const effectiveVisibleProductResourceSections = visibleProductResourceSections.size === 0
    ? new Set<ProductResourceSection>(productResourceSectionFilters.map(filter => filter.id))
    : visibleProductResourceSections
  const [collapsedProductResourceSections, setCollapsedProductResourceSections] = useState<Set<ProductResourceSection>>(new Set())
  const [hiddenYoutubePlaylistFrames, setHiddenYoutubePlaylistFrames] = useState<Set<string>>(
    () => new Set(Object.values(portfolioResources).flatMap(resources =>
      resources.youtubePlaylists.map(playlist => playlist.embedUrl),
    )),
  )

  // Publish the filters that apply to the current page so copied section links can carry them.
  useEffect(() => {
    const out: Record<string, string> = {}
    const isPortfolioPage = currentPage === 'capabilities' || businessAutomationCapabilityFilters.some(filter => filter.page === currentPage)
    if (isPortfolioPage) {
      if (currentPage === 'capabilities') {
        encodeSetParam(out, 'caps', selectedCapabilityPages, allBusinessAutomationCapabilityPages)
      }
      encodeSetParam(out, 'prs', visibleProductResourceSections, productResourceSectionFilters.map(filter => filter.id))
      encodeStringParam(out, 'sort', salesKitSortMode, 'default')
    } else if (currentPage === 'community') {
      encodeSetParam(out, 'cc', communityCapabilities, communityCapabilityOptions.map(option => option.id))
      encodeSetParam(out, 'cp', communityProducts, communityProductOptions.map(option => option.id))
    } else if (currentPage === 'lets-create') {
      encodeSetParam(out, 'lcs', letsCreateVisibleSections, letsCreateSections.map(section => section.id))
      encodeSetParam(out, 'lcc', letsCreateCapabilities, communityCapabilityOptions.map(option => option.id))
      encodeSetParam(out, 'lcp', letsCreateProducts, letsCreateProductOptions.map(option => option.id))
    } else if (currentPage === 'sessions') {
      encodeSetParam(out, 'days', activeDays, days)
      encodeSetParam(out, 'types', activeTypes, allTypes)
      encodeSetParam(out, 'sspk', activeSpeakers, null)
    } else if (currentPage === 'schedule') {
      encodeStringParam(out, 'day', activeOverviewDay, getInitialConferenceDay())
      if (showBASessions) out.basess = '1'
      encodeSetParam(out, 'cspk', activeConferenceSpeakers, null)
      if (showBusinessAutomationSchedule) out.basched = '1'
    } else if (currentPage === 'insights') {
      encodeStringParam(out, 'iid', insightsSessionIdFilter, 'all')
      encodeStringParam(out, 'ity', insightsSessionTypeFilter, 'all')
      encodeStringParam(out, 'ispk', insightsSpeakerFilter, 'all')
    }
    linkFilterStore.app = out
  }, [
    currentPage, selectedCapabilityPages, visibleProductResourceSections, salesKitSortMode,
    communityCapabilities, communityProducts,
    letsCreateVisibleSections, letsCreateCapabilities, letsCreateProducts,
    activeDays, activeTypes, activeSpeakers,
    activeOverviewDay, showBASessions, activeConferenceSpeakers, showBusinessAutomationSchedule,
    insightsSessionIdFilter, insightsSessionTypeFilter, insightsSpeakerFilter,
  ])

  useEffect(() => {
    if (visibleProductResourceSections.size !== 1) return
    const [onlyVisibleSection] = visibleProductResourceSections
    setCollapsedProductResourceSections(current => {
      if (!current.has(onlyVisibleSection)) return current
      const next = new Set(current)
      next.delete(onlyVisibleSection)
      return next
    })
  }, [visibleProductResourceSections])

  useEffect(() => {
    if (currentPageRef.current === currentPage) return
    previousPageRef.current = currentPageRef.current
    currentPageRef.current = currentPage
    if (currentPage !== 'insights') {
      setIsMainHeaderExpanded(true)
    }
  }, [currentPage])

  useEffect(() => {
    let keepLinkedCapabilities = initialSearchParams.has('caps')
    const syncPageToHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      const nextPage = pageForHash(window.location.hash)
      setCurrentPage(nextPage)
      setSelectedSectionId(id && id !== pageAnchors[nextPage] ? id : null)
      const selectedPage = businessAutomationCapabilityFilters.find(filter => filter.page === nextPage)?.page
      if (selectedPage) {
        setSelectedCapabilityPages(new Set([selectedPage]))
      } else if (nextPage === 'capabilities' && !keepLinkedCapabilities) {
        setSelectedCapabilityPages(new Set(allBusinessAutomationCapabilityPages))
      }
      keepLinkedCapabilities = false
      if (id === 'business-automation-schedule') {
        setActiveOverviewDay(days[0])
        setShowBusinessAutomationSchedule(true)
      }
      const linkedGeneralSession = generalSessions.find(session => `general-session-${session.id.toLowerCase()}` === id)
      if (linkedGeneralSession) {
        setActiveOverviewDay(linkedGeneralSession.day)
      }
      if (id) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => scrollElementBelowPageHeader(id))
        })
      } else {
        window.scrollTo({ top: 0 })
      }
    }

    window.addEventListener('hashchange', syncPageToHash)
    window.addEventListener('popstate', syncPageToHash)
    syncPageToHash()
    return () => {
      window.removeEventListener('hashchange', syncPageToHash)
      window.removeEventListener('popstate', syncPageToHash)
    }
  }, [])

  useEffect(() => {
    if (!showThomasImage) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowThomasImage(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [showThomasImage])

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // The browser or embedding context may not permit fullscreen mode.
    }
  }

  const toggleDay = (day: string) => {
    setActiveDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }
      return next
    })
  }

  const unlockIbmPages = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const passwordHash = await hashPassword(ibmPassword)
    if (passwordHash !== IBM_PASSWORD_HASH) {
      setIbmAccessError('Incorrect password. Please try again.')
      return
    }

    try {
      sessionStorage.setItem(IBM_ACCESS_SESSION_KEY, 'true')
    } catch {
      // The current page can still be unlocked when session storage is unavailable.
    }
    setHasIbmAccess(true)
    setIbmPassword('')
    setIbmAccessError('')
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    window.requestAnimationFrame(() => scrollElementBelowPageHeader(id))
  }

  const navigateToPage = (page: Page, targetId?: string) => {
    const nextPage = page === 'product' ? 'capabilities' : page
    const selectedPage = businessAutomationCapabilityFilters.find(filter => filter.page === nextPage)?.page
    if (selectedPage) {
      setSelectedCapabilityPages(new Set([selectedPage]))
    } else if (nextPage === 'capabilities') {
      setSelectedCapabilityPages(new Set(allBusinessAutomationCapabilityPages))
    }
    const id = targetId ?? pageAnchors[nextPage]
    const hash = `#${id}`
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash)
    }
    setCurrentPage(nextPage)
    setSelectedSectionId(id !== pageAnchors[nextPage] ? id : null)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollElementBelowPageHeader(id))
    })
  }
  const openSearchResult = (entry: GlobalSearchEntry) => {
    if (entry.url) {
      window.open(entry.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (entry.sessionId) {
      const sessionId = entry.sessionId
      setActiveTypes(new Set(allTypes))
      setActiveDays(new Set(days))
      setActiveSpeakers(new Set())
      setExpandedIds(current => new Set(current).add(sessionId))
    }
    if (window.location.hash === `#${entry.id}`) {
      if (entry.pages.includes('onboarding-automation')) window.dispatchEvent(new Event('hashchange'))
      scrollElementBelowPageHeader(entry.id)
    } else {
      window.location.hash = entry.id
    }
  }
  const navigateToBreadcrumbPage = (page: Page) => {
    navigateToPage(page, pageAnchors[page])
  }
  const returnFromInsights = () => {
    const previousPage = previousPageRef.current
    navigateToPage(previousPage && previousPage !== 'insights' ? previousPage : 'ibm')
  }
  const filterCapabilities = (
    page: 'capabilities' | PortfolioResourcePage,
  ) => {
    const nextSelected = page === 'capabilities'
      ? selectedCapabilityPages.size === allBusinessAutomationCapabilityPages.length
        ? new Set<PortfolioResourcePage>()
        : new Set<PortfolioResourcePage>(allBusinessAutomationCapabilityPages)
      : new Set(selectedCapabilityPages)

    if (page !== 'capabilities') {
      if (nextSelected.has(page)) {
        if (nextSelected.size > 1) nextSelected.delete(page)
      } else {
        nextSelected.add(page)
      }
    }

    const nextPage: Page = nextSelected.size === 1 ? [...nextSelected][0] : 'capabilities'
    const hash = `#${pageAnchors[nextPage]}`
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash)
    }
    setSelectedCapabilityPages(nextSelected)
    setCurrentPage(nextPage)
    setSelectedSectionId(null)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollElementBelowPageHeader('capabilities-top'))
    })
  }

  const toggleType = (t: SessionType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) {
        next.delete(t)
      } else {
        next.add(t)
      }
      return next
    })
  }

  const toggleSpeaker = (speaker: string) => {
    setActiveSpeakers(prev => {
      const next = new Set(prev)
      next.has(speaker) ? next.delete(speaker) : next.add(speaker)
      return next
    })
  }

  const toggleConferenceSpeaker = (indicator: string) => {
    const next = new Set(activeConferenceSpeakers)
    next.has(indicator) ? next.delete(indicator) : next.add(indicator)
    setActiveConferenceSpeakers(next)
    setShowBASessions(next.size > 0)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const hasSpeaker = (session: Session, speaker: string) =>
    session.speakers.some(entry => entry.startsWith(`${speaker} —`))

  const speakerFiltered = activeSpeakers.size === 0
    ? sessions
    : sessions.filter(session => [...activeSpeakers].some(speaker => hasSpeaker(session, speaker)))
  const typeFiltered = speakerFiltered.filter(s => activeTypes.has(s.type))
  const filtered = typeFiltered.filter(s => activeDays.has(s.day))
  const selectedFilterSummary = [
    activeDays.size === days.length
      ? 'All days'
      : activeDays.size === 0
        ? 'No days'
        : days.filter(day => activeDays.has(day)).map(day => dayAbbreviations[day]).join(', '),
    activeTypes.size === allTypes.length
      ? 'All types'
      : activeTypes.size === 0
        ? 'No types'
        : allTypes.filter(type => activeTypes.has(type)).map(type => typeAbbreviations[type]).join(', '),
    activeSpeakers.size === 0 ? 'Any speaker' : [...activeSpeakers].join(', '),
  ].join(' · ')

  const countForDay = (day: string) =>
    typeFiltered.filter(s => s.day === day).length
  const activeConferenceDay = conferenceSchedule[activeOverviewDay]
  const activeDaySessions = sessions
    .filter(session => session.day === activeOverviewDay)
    .sort((a, b) => startTimeInMinutes(a.time) - startTimeInMinutes(b.time))
  const matchingActiveDaySessions = activeDaySessions.filter(session =>
    activeConferenceSpeakers.size === 0 ||
    featuredSpeakers.some(speaker =>
      activeConferenceSpeakers.has(speaker.indicator) && hasSpeaker(session, speaker.name),
    ),
  )
  const activeConferenceItems = [
    ...activeConferenceDay.items.map(item => ({
      ...item,
      key: `conference-${item.time}-${item.title}`,
      isBusinessAutomation: false,
      speakerIndicators: [],
      url: undefined,
      sessionId: undefined,
      location: undefined,
    })),
    ...(showBASessions
      ? matchingActiveDaySessions.map(session => ({
          time: session.time,
          title: session.title,
          subtitle: undefined,
          key: session.id,
          isBusinessAutomation: true,
          speakerIndicators: featuredSpeakers.filter(speaker => hasSpeaker(session, speaker.name)),
          url: session.url,
          sessionId: session.id,
          location: session.location,
        }))
      : []),
  ].sort((a, b) => startTimeInMinutes(a.time) - startTimeInMinutes(b.time))
  const activeGeneralSessions = generalSessions
    .filter(session => session.day === activeOverviewDay)
    .sort((a, b) => startTimeInMinutes(a.time) - startTimeInMinutes(b.time))
  const activeBusinessAutomationCapability = businessAutomationCapabilities.find(
    capability => capability.page === currentPage,
  )
  const isCapabilitiesPage =
    currentPage === 'capabilities' ||
    currentPage === 'cp4ba' ||
    Boolean(activeBusinessAutomationCapability)
  const isCommunitySection = currentPage === 'community' || currentPage === 'enablement'
  const isBusinessAutomationSection =
    currentPage === 'overview' || currentPage === 'badges' || currentPage === 'lets-create' || currentPage === 'onboarding-automation' || isCapabilitiesPage
  const isIbmSection = currentPage === 'ibm' || currentPage === 'insights' || currentPage === 'speaker'
  const isTechXchangeSection =
    currentPage === 'techxchange' ||
    currentPage === 'sessions' ||
    currentPage === 'schedule' ||
    currentPage === 'maps' ||
    currentPage === 'info' ||
    currentPage === 'ug' ||
    currentPage === 'surveys' ||
    isIbmSection
  const isConferenceSection = currentPage === 'conference' || currentPage === 'think' || isTechXchangeSection
  const pageLastPublishedDate = new Date(__PUBLISHED_AT__)
  const hasValidPublishedDate = !Number.isNaN(pageLastPublishedDate.getTime())
  const pagePublishIdentifier = hasValidPublishedDate
    ? `${pageLastPublishedDate.getFullYear()}${String(pageLastPublishedDate.getMonth() + 1).padStart(2, '0')}${String(pageLastPublishedDate.getDate()).padStart(2, '0')} ${String(pageLastPublishedDate.getHours()).padStart(2, '0')}:${String(pageLastPublishedDate.getMinutes()).padStart(2, '0')}:${String(pageLastPublishedDate.getSeconds()).padStart(2, '0')}`
    : 'CURRENT'
  const insightsSessionTypes = allTypes.filter(type =>
    insightsEnrollmentRoster.some(row => sessions.find(session => session.id === row.id)?.type === type),
  )
  const insightsSpeakers = [...new Set(
    insightsEnrollmentRoster.flatMap(row =>
      sessions.find(session => session.id === row.id)?.speakers.map(speaker => speaker.split(' — ')[0]) ?? [],
    ),
  )].sort((a, b) => a.localeCompare(b))
  const featuredInsightsSpeakers = ['Matt Vest', 'Lenny Bromberg', 'Swapnil Agrawal']
    .filter(speaker => insightsSpeakers.includes(speaker))
  const remainingInsightsSpeakers = insightsSpeakers.filter(
    speaker => !featuredInsightsSpeakers.includes(speaker),
  )
  const filteredInsightsEnrollmentRoster = insightsEnrollmentRoster.filter(row => {
    const catalogSession = sessions.find(session => session.id === row.id)
    const matchesId = insightsSessionIdFilter === 'all' || row.id === insightsSessionIdFilter
    const matchesType = insightsSessionTypeFilter === 'all' || catalogSession?.type === insightsSessionTypeFilter
    const matchesSpeaker = insightsSpeakerFilter === 'all' ||
      catalogSession?.speakers.some(speaker => speaker.startsWith(`${insightsSpeakerFilter} —`))
    return matchesId && matchesType && matchesSpeaker
  })
  const filteredInsightsTotalAttended = filteredInsightsEnrollmentRoster.reduce(
    (total, session) => total + session.attended,
    0,
  )
  const filteredInsightsTypeSummaries = insightsSessionTypes.map(type => {
    const typeRows = filteredInsightsEnrollmentRoster.filter(row =>
      sessions.find(session => session.id === row.id)?.type === type,
    )
    return {
      type,
      rows: typeRows,
      sessions: typeRows.length,
      enrollments: typeRows.reduce((total, session) => total + (session.enrollments ?? 0), 0),
      reportedEnrollments: typeRows.filter(session => session.enrollments !== undefined).length,
      attended: typeRows.reduce((total, session) => total + session.attended, 0),
    }
  }).filter(summary => summary.sessions > 0)
  const hasInsightsFilters = insightsSessionIdFilter !== 'all' ||
    insightsSessionTypeFilter !== 'all' ||
    insightsSpeakerFilter !== 'all'
  const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
    const escapeCsvValue = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const csv = `\uFEFF${rows.map(row => row.map(escapeCsvValue).join(',')).join('\n')}`
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.download = filename
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
    URL.revokeObjectURL(downloadUrl)
  }
  const exportInsightsAttendance = () => {
    downloadCsv('ibm-techxchange-session-attendance.csv', [
      ['Session ID', 'Session Title', 'Attended Count'],
      ...filteredInsightsEnrollmentRoster.map(row => [row.id, row.title, row.attended]),
    ])
  }
  const exportAllInsightsRegistration = () => {
    downloadCsv('ibm-techxchange-session-registration.csv', [
      [
        'Session ID',
        'Session Title',
        'Session Type',
        'Speakers',
        'Day',
        'Time',
        'Location',
        'Total Enrollments',
        'Attended Count',
      ],
      ...insightsEnrollmentRoster.map(row => {
        const catalogSession = sessions.find(session => session.id === row.id)
        return [
          row.id,
          row.title,
          catalogSession?.type ?? '',
          catalogSession?.speakers.join('; ') ?? '',
          catalogSession?.day ?? '',
          catalogSession?.time ?? '',
          catalogSession?.location ?? '',
          row.enrollments ?? '',
          row.attended,
        ]
      }),
    ])
  }
  const renderProductResourceSectionFilters = (counts: Record<ProductResourceSection, number>) => {
    const allSectionsVisible = visibleProductResourceSections.size === productResourceSectionFilters.length
    const selectedFilters = productResourceSectionFilters.filter(filter => visibleProductResourceSections.has(filter.id))
    const visibleResourceCount = selectedFilters.reduce((total, filter) => total + counts[filter.id], 0)
    return (
      <div className="border-b border-white/[0.06] bg-black/10 px-5 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsProductResourceFiltersExpanded(expanded => !expanded)}
            aria-expanded={isProductResourceFiltersExpanded}
            aria-controls="product-resource-subsection-filters"
            aria-label={isProductResourceFiltersExpanded ? 'Collapse Product Resources filters' : 'Expand Product Resources filters'}
            title={isProductResourceFiltersExpanded ? 'Collapse filters' : 'Expand filters'}
            className="inline-flex h-7 items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ffb784] transition-colors hover:border-[#ff832b]/55 hover:bg-[#ff832b]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb784]"
          >
            Filter
            <VideoVisibilityIcon visible={isProductResourceFiltersExpanded} />
          </button>
          <div id="product-resource-subsection-filters" role="group" aria-label="Filter Product Resources subsections" className={isProductResourceFiltersExpanded ? 'contents' : 'hidden'}>
          <button
            type="button"
            aria-pressed={allSectionsVisible}
            onClick={() => {
              setVisibleProductResourceSections(current =>
                current.size === productResourceSectionFilters.length
                  ? new Set<ProductResourceSection>()
                  : new Set(productResourceSectionFilters.map(filter => filter.id)),
              )
            }}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              allSectionsVisible
                ? 'border-[#ffb784] bg-[#ff832b]/20 text-white'
                : 'border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] hover:border-[#ff832b]/45 hover:text-white'
            }`}
          >
            All sections
            <span className="ml-1 rounded-full bg-black/20 px-1.5 py-0.5 font-mono text-[9px]">
              {Object.values(counts).reduce((total, count) => total + count, 0)}
            </span>
          </button>
          {productResourceSectionFilters.map(filter => {
            const isActive = visibleProductResourceSections.has(filter.id)
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setVisibleProductResourceSections(current => {
                    const next = new Set(current)
                    if (next.has(filter.id)) {
                      next.delete(filter.id)
                    } else {
                      next.add(filter.id)
                    }
                    return next
                  })
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'border-[#78a9ff]/70 bg-[#0f62fe]/20 text-white'
                    : 'border-white/[0.1] bg-white/[0.03] text-[#a8a8a8] hover:border-[#4589ff]/45 hover:text-white'
                }`}
              >
                {isActive && (
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                    <path d="m3.5 8.2 2.7 2.7 6.3-6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {filter.label}
                <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${isActive ? 'bg-white/10 text-white' : 'bg-black/20 text-[#a8a8a8]'}`}>
                  {counts[filter.id]}
                </span>
              </button>
            )
          })}
          {renderProductResourceCollapseControls()}
          </div>
          <p aria-live="polite" className="ml-auto text-[11px] font-medium text-[#c6c6c6]">
            {selectedFilters.length > 0
              ? `${selectedFilters.length} selected: ${selectedFilters.map(filter => filter.label).join(' · ')} · ${visibleResourceCount} resources`
              : `0 selected · showing all ${Object.values(counts).reduce((total, count) => total + count, 0)} resources`}
          </p>
        </div>
      </div>
    )
  }
  const toggleProductResourceSection = (section: ProductResourceSection) => {
    const willCollapse = !collapsedProductResourceSections.has(section)
    if (willCollapse && visibleProductResourceSections.size === 1 && visibleProductResourceSections.has(section)) {
      setIsProductResourcesExpanded(false)
    }
    setCollapsedProductResourceSections(current => {
      const next = new Set(current)
      next.has(section) ? next.delete(section) : next.add(section)
      return next
    })
  }
  const collapseCapabilitySubsections = () => {
    setIsCapabilityOverviewExpanded(false)
    setIsProductResourcesExpanded(false)
    setCollapsedProductResourceSections(new Set(productResourceSectionFilters.map(filter => filter.id)))
  }
  const toggleYoutubePlaylistFrame = (embedUrl: string) => {
    setHiddenYoutubePlaylistFrames(current => {
      const next = new Set(current)
      next.has(embedUrl) ? next.delete(embedUrl) : next.add(embedUrl)
      return next
    })
  }
  const toggleYoutubePlaylistFrames = (embedUrls: string[]) => {
    setHiddenYoutubePlaylistFrames(current => {
      const next = new Set(current)
      const allFramesHidden = embedUrls.every(embedUrl => current.has(embedUrl))
      embedUrls.forEach(embedUrl => allFramesHidden ? next.delete(embedUrl) : next.add(embedUrl))
      return next
    })
  }
  const productResourceAssetCountLabel = (count: number) => `${count} ${count === 1 ? 'asset' : 'assets'}`
  const renderCollapsedProductResourceSummary = (
    counts: Record<ProductResourceSection, number>,
    sectionId: string,
  ) => {
    const displayedSections = productResourceSectionFilters.filter(filter =>
      effectiveVisibleProductResourceSections.has(filter.id),
    )
    return (
      <div className="border-t border-white/[0.06] bg-black/10 px-5 py-4 sm:px-6">
        {displayedSections.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {displayedSections.map(filter => {
              const position = productResourceSectionFilters.findIndex(item => item.id === filter.id) + 1
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setIsProductResourcesExpanded(true)
                    setCollapsedProductResourceSections(current => {
                      const next = new Set(current)
                      next.delete(filter.id)
                      return next
                    })
                    const subsectionId = `${sectionId}-${filter.id}`
                    const hash = `#${subsectionId}`
                    if (window.location.hash !== hash) window.history.pushState(null, '', hash)
                    setSelectedSectionId(subsectionId)
                    window.requestAnimationFrame(() => {
                      window.requestAnimationFrame(() => document.getElementById(subsectionId)?.scrollIntoView({ behavior: 'smooth' }))
                    })
                  }}
                  aria-label={`Expand ${filter.label} Product Resources`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-[#161616] px-3 py-2.5 text-left transition-colors hover:border-[#ff832b]/45 hover:bg-[#ff832b]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb784]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-[#e0e0e0]">{filter.label}</span>
                    <span className="mt-0.5 block text-[10px] text-[#c6c6c6]">{productResourceAssetCountLabel(counts[filter.id])}</span>
                  </span>
                  <span className="shrink-0 rounded bg-[#ff832b]/15 px-1.5 py-1 font-mono text-[9px] font-semibold text-[#ffb784]">
                    {String(position).padStart(2, '0')}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-white/[0.1] bg-[#161616] px-4 py-3 text-xs text-[#c6c6c6]">
            No Product Resources subsections are displayed.
          </p>
        )}
      </div>
    )
  }
  const compareSalesKitTitles = (a: string, b: string) => {
    if (salesKitSortMode === 'title-asc' || salesKitSortMode === 'capability-asc') return a.localeCompare(b)
    if (salesKitSortMode === 'title-desc' || salesKitSortMode === 'capability-desc') return b.localeCompare(a)
    const aOrder = featuredSalesKitOrder.indexOf(a)
    const bOrder = featuredSalesKitOrder.indexOf(b)
    return (aOrder < 0 ? Number.MAX_SAFE_INTEGER : aOrder) -
      (bOrder < 0 ? Number.MAX_SAFE_INTEGER : bOrder)
  }
  const compareSalesKitCards = (
    a: { name: string; capability: string },
    b: { name: string; capability: string },
  ) => {
    if (salesKitSortMode === 'capability-asc' || salesKitSortMode === 'capability-desc') {
      const capabilityComparison = salesKitSortMode === 'capability-asc'
        ? a.capability.localeCompare(b.capability)
        : b.capability.localeCompare(a.capability)
      if (capabilityComparison !== 0) return capabilityComparison
    }
    return compareSalesKitTitles(a.name, b.name)
  }
  const toggleSalesKitTitleSort = () => {
    setSalesKitSortMode(current => current === 'title-asc' ? 'title-desc' : 'title-asc')
  }
  const toggleSalesKitCapabilitySort = () => {
    setSalesKitSortMode(current => current === 'capability-asc' ? 'capability-desc' : 'capability-asc')
  }
  const nextSalesKitTitleSortDirection = salesKitSortMode === 'title-asc' ? 'desc' : 'asc'
  const nextSalesKitCapabilitySortDirection = salesKitSortMode === 'capability-asc' ? 'desc' : 'asc'
  const renderSalesKitSortControl = () => (
    <button
      type="button"
      onClick={toggleSalesKitTitleSort}
      aria-label={`Sort sales kits by title ${nextSalesKitTitleSortDirection === 'asc' ? 'A to Z' : 'Z to A'}`}
      title={`Sort titles ${nextSalesKitTitleSortDirection === 'asc' ? 'A–Z' : 'Z–A'}`}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
    >
      <SalesKitSortIcon direction={nextSalesKitTitleSortDirection} />
    </button>
  )
  const renderSalesKitCapabilitySortControl = () => (
    <button
      type="button"
      onClick={toggleSalesKitCapabilitySort}
      aria-label={`Sort sales kits by capability and title ${nextSalesKitCapabilitySortDirection === 'asc' ? 'forward' : 'reverse'}`}
      title={`Sort by capability + title (${nextSalesKitCapabilitySortDirection === 'asc' ? 'forward' : 'reverse'})`}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
    >
      <SalesKitCapabilitySortIcon direction={nextSalesKitCapabilitySortDirection} />
    </button>
  )
  const renderProductResourceCollapseControls = () => {
    const allSectionsCollapsed = productResourceSectionFilters.every(filter =>
      collapsedProductResourceSections.has(filter.id),
    )
    const label = allSectionsCollapsed ? 'Expand all Product Resources subsections' : 'Collapse all Product Resources subsections'
    return (
      <button
        type="button"
        onClick={() => {
          if (!allSectionsCollapsed && visibleProductResourceSections.size === 1) {
            setIsProductResourcesExpanded(false)
          }
          setCollapsedProductResourceSections(
            allSectionsCollapsed
              ? new Set()
              : new Set(productResourceSectionFilters.map(filter => filter.id)),
          )
        }}
        aria-label={label}
        title="Expand/Collapse Resources"
        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#ff832b]/45 bg-[#ff832b]/10 px-3 text-xs font-semibold text-[#ffb784] shadow-[0_0_18px_rgba(255,131,43,0.08)] transition-colors hover:border-[#ff832b]/75 hover:bg-[#ff832b]/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb784]"
      >
        {allSectionsCollapsed ? (
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {allSectionsCollapsed ? 'Expand Resources' : 'Collapse Resources'}
      </button>
    )
  }
  const renderCapabilityProductResources = (page: PortfolioResourcePage) => {
    const resources = portfolioResources[page]
    const label = page === 'cp4ba'
      ? 'CP4BA'
      : businessAutomationCapabilities.find(capability => capability.page === page)?.title ?? 'Capability'
    const capabilityColor = page === 'cp4ba'
      ? '#4589ff'
      : businessAutomationCapabilities.find(capability => capability.page === page)?.color ?? '#78a9ff'
    const sectionId = `${page}-product-resources`
    const playlistEmbedUrls = resources.youtubePlaylists.map(playlist => playlist.embedUrl)
    const allPlaylistFramesHidden = playlistEmbedUrls.every(embedUrl => hiddenYoutubePlaylistFrames.has(embedUrl))
    const sectionCounts: Record<ProductResourceSection, number> = {
      reference: resources.references.length,
      previews: resources.previews.length,
      'ai-capabilities': resources.aiCapabilities.length,
      demos: resources.demos.reduce((total, group) => total + group.links.length, 0),
      'sales-kits': resources.salesKits.length,
      environments: resources.environments.length,
      'techzone-collections': resources.techZoneCollections.length,
      'youtube-playlists': resources.youtubePlaylists.length,
    }
    return (
      <section
        id={sectionId}
        aria-labelledby={`${sectionId}-heading`}
        className="mt-8 scroll-mt-28 overflow-hidden rounded-xl border border-[#ff832b]/25 bg-[#262626]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ff832b]">Product resources</p>
            </div>
            <h3 id={`${sectionId}-heading`} className="mt-1 text-lg font-semibold text-white">
              <button
                type="button"
                onClick={() => setIsProductResourcesExpanded(expanded => !expanded)}
                aria-expanded={isProductResourcesExpanded}
                aria-controls={`${sectionId}-body`}
                aria-label={isProductResourcesExpanded ? `Collapse ${label} Product Resources` : `Expand ${label} Product Resources`}
                title={isProductResourcesExpanded ? 'Collapse Product Resources' : 'Expand Product Resources'}
                className="inline-flex max-w-full items-center gap-3 overflow-x-auto whitespace-nowrap rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-[#ff832b]/55 hover:bg-[#ff832b]/10 hover:text-[#ffb784] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb784]"
              >
                <span>Product Resources</span>
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{
                    borderColor: `${capabilityColor}66`,
                    backgroundColor: `${capabilityColor}18`,
                    color: capabilityColor,
                  }}
                >
                  {label}
                </span>
                <span className="text-xs font-medium text-[#c6c6c6]">1 selected</span>
                <VideoVisibilityIcon visible={isProductResourcesExpanded} />
              </button>
            </h3>
          </div>
          <CopySectionLink id={sectionId} label={`${label} product resources`} />
        </div>

        {!isProductResourcesExpanded && renderCollapsedProductResourceSummary(sectionCounts, sectionId)}
        <div id={`${sectionId}-body`} hidden={!isProductResourcesExpanded}>
        {renderProductResourceSectionFilters(sectionCounts)}

        {(effectiveVisibleProductResourceSections.has('reference') || effectiveVisibleProductResourceSections.has('previews')) && (
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          {effectiveVisibleProductResourceSections.has('reference') && (
          <div id={`${sectionId}-reference`} className="scroll-mt-28">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleProductResourceSection('reference')}
                aria-expanded={!collapsedProductResourceSections.has('reference')}
                aria-controls={`${sectionId}-reference-content`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
              >
                <ChevronIcon expanded={!collapsedProductResourceSections.has('reference')} />
                Reference
              </button>
              <div className="flex items-center gap-1">
                <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('reference')} controls={`${sectionId}-reference-content`} label="Reference" onToggle={() => toggleProductResourceSection('reference')} />
                <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts.reference)}</span>
                <span className="font-mono text-[10px] text-[#8d8d8d]">01 / 08</span>
                <CopySectionLink id={`${sectionId}-reference`} label={`${label} reference resources`} />
                <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
              </div>
            </div>
            {!collapsedProductResourceSections.has('reference') && <div id={`${sectionId}-reference-content`} className="mt-3 space-y-2">
              {resources.references.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10 hover:text-white"
                >
                  <span>{link.name}</span>
                  <ExternalLinkIcon />
                </a>
              ))}
            </div>}
          </div>
          )}

          {effectiveVisibleProductResourceSections.has('previews') && (
          <div id={`${sectionId}-previews`} className="scroll-mt-28">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleProductResourceSection('previews')}
                aria-expanded={!collapsedProductResourceSections.has('previews')}
                aria-controls={`${sectionId}-previews-content`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
              >
                <ChevronIcon expanded={!collapsedProductResourceSections.has('previews')} />
                Previews and trials
              </button>
              <div className="flex items-center gap-1">
                <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('previews')} controls={`${sectionId}-previews-content`} label="Previews and trials" onToggle={() => toggleProductResourceSection('previews')} />
                <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts.previews)}</span>
                <span className="font-mono text-[10px] text-[#8d8d8d]">02 / 08</span>
                <CopySectionLink id={`${sectionId}-previews`} label={`${label} previews and trials`} />
                <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
              </div>
            </div>
            {!collapsedProductResourceSections.has('previews') && <div id={`${sectionId}-previews-content`}>{resources.previews.length > 0 ? (
              <div className="mt-3 space-y-2">
                {resources.previews.map(preview => (
                  <a
                    key={preview.url}
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10 hover:text-white"
                  >
                    <span>{preview.name}<span className="ml-2 text-xs text-[#c6c6c6]">{preview.action}</span></span>
                    <ExternalLinkIcon />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm text-[#8d8d8d]">No active preview listed.</p>
            )}</div>}
          </div>
          )}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('ai-capabilities') && resources.aiCapabilities.length > 0 && (
          <div id={`${sectionId}-ai-capabilities`} className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleProductResourceSection('ai-capabilities')}
                aria-expanded={!collapsedProductResourceSections.has('ai-capabilities')}
                aria-controls={`${sectionId}-ai-capabilities-content`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
              >
                <ChevronIcon expanded={!collapsedProductResourceSections.has('ai-capabilities')} />
                AI capabilities
              </button>
              <div className="flex items-center gap-1">
                <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('ai-capabilities')} controls={`${sectionId}-ai-capabilities-content`} label="AI capabilities" onToggle={() => toggleProductResourceSection('ai-capabilities')} />
                <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts['ai-capabilities'])}</span>
                <span className="font-mono text-[10px] text-[#8d8d8d]">03 / 08</span>
                <CopySectionLink id={`${sectionId}-ai-capabilities`} label={`${label} AI capabilities`} />
                <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
              </div>
            </div>
            {!collapsedProductResourceSections.has('ai-capabilities') && <div id={`${sectionId}-ai-capabilities-content`} className="mt-3 grid gap-3 sm:grid-cols-2">
              {resources.aiCapabilities.map(capability => (
                <article key={capability.name} className="rounded-lg border border-white/[0.06] bg-[#161616] p-4">
                  <h5 className="text-sm font-semibold text-white">{capability.name}</h5>
                  <p className="mt-2 text-xs leading-relaxed text-[#c6c6c6]">{capability.description}</p>
                  {'url' in capability && capability.url && (
                    <a href={capability.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#78a9ff] hover:text-white">
                      Learn more
                      <ExternalLinkIcon />
                    </a>
                  )}
                </article>
              ))}
            </div>}
          </div>
        )}

        {effectiveVisibleProductResourceSections.has('demos') && resources.demos.length > 0 && (
          <div id={`${sectionId}-demos`} className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleProductResourceSection('demos')}
                aria-expanded={!collapsedProductResourceSections.has('demos')}
                aria-controls={`${sectionId}-demos-content`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
              >
                <ChevronIcon expanded={!collapsedProductResourceSections.has('demos')} />
                Demos and videos
              </button>
              <div className="flex items-center gap-1">
                <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('demos')} controls={`${sectionId}-demos-content`} label="Demos and videos" onToggle={() => toggleProductResourceSection('demos')} />
                <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts.demos)}</span>
                <span className="font-mono text-[10px] text-[#8d8d8d]">04 / 08</span>
                <CopySectionLink id={`${sectionId}-demos`} label={`${label} demos and videos`} />
                <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
              </div>
            </div>
            {!collapsedProductResourceSections.has('demos') && <div id={`${sectionId}-demos-content`} className="mt-3 grid gap-5 lg:grid-cols-2">
              {resources.demos.map(group => (
                <div
                  key={group.title}
                  id={`demo-${group.title.toLowerCase().replaceAll(' ', '-').replaceAll('—', '')}`}
                  className="scroll-mt-28"
                >
                  <h5 className="text-sm font-semibold text-white">{group.title}</h5>
                  <ul className="mt-2 space-y-2">
                    {group.links.map(link => (
                      <li key={link.url}>
                        <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-xs font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:text-white">
                          <span>{link.name}</span>
                          <ExternalLinkIcon />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>}
          </div>
        )}

        {effectiveVisibleProductResourceSections.has('sales-kits') && (
        <div id={`${sectionId}-sales-kits`} className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('sales-kits')}
              aria-expanded={!collapsedProductResourceSections.has('sales-kits')}
              aria-controls={`${sectionId}-sales-kits-content`}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('sales-kits')} />
              Sales kits
            </button>
            <div className="flex items-center gap-1">
              {renderSalesKitSortControl()}
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('sales-kits')} controls={`${sectionId}-sales-kits-content`} label="Sales kits" onToggle={() => toggleProductResourceSection('sales-kits')} />
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts['sales-kits'])}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">05 / 08</span>
              <CopySectionLink id={`${sectionId}-sales-kits`} label={`${label} sales kits`} />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('sales-kits') && <div id={`${sectionId}-sales-kits-content`} className="mt-3 grid gap-2 sm:grid-cols-2">
            {[...resources.salesKits].sort((a, b) => compareSalesKitTitles(a.name, b.name)).map(link => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10 hover:text-white"
              >
                <span>{link.name}</span>
                <ExternalLinkIcon />
              </a>
            ))}
          </div>}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('environments') && (
        <div id={`${sectionId}-environments`} className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('environments')}
              aria-expanded={!collapsedProductResourceSections.has('environments')}
              aria-controls={`${sectionId}-environments-content`}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('environments')} />
              Demo Environments
            </button>
            <div className="flex items-center gap-1">
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('environments')} controls={`${sectionId}-environments-content`} label="Demo environments" onToggle={() => toggleProductResourceSection('environments')} />
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts.environments)}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">06 / 08</span>
              <CopySectionLink id={`${sectionId}-environments`} label={`${label} demo environments`} />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('environments') && (
            <div id={`${sectionId}-environments-content`} className="mt-3 grid gap-3 sm:grid-cols-2">
              {resources.environments.length > 0 ? [...resources.environments]
                .sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)))
                .map(environment => (
                <a
                  key={environment.url}
                  href={environment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/[0.06] bg-[#161616] p-4 transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-[#a6c8ff]">{environment.name}</span>
                    <span className="flex items-center gap-2">
                      {environment.recommended && (
                        <span className="rounded-full border border-[#42be65]/45 bg-[#42be65]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6fdc8c]">
                          Recommended
                        </span>
                      )}
                      <ExternalLinkIcon />
                    </span>
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-[#c6c6c6]">{environment.description}</span>
                </a>
              )) : (
                <p className="rounded-lg border border-dashed border-white/[0.1] bg-[#161616] px-4 py-5 text-sm text-[#8d8d8d] sm:col-span-2">
                  No demo environments are listed for {label}.
                </p>
              )}
            </div>
          )}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('techzone-collections') && (
        <div id={`${sectionId}-techzone-collections`} className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('techzone-collections')}
              aria-expanded={!collapsedProductResourceSections.has('techzone-collections')}
              aria-controls={`${sectionId}-techzone-collections-content`}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('techzone-collections')} />
              TechZone Collections
            </button>
            <div className="flex items-center gap-1">
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('techzone-collections')} controls={`${sectionId}-techzone-collections-content`} label="TechZone Collections" onToggle={() => toggleProductResourceSection('techzone-collections')} />
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts['techzone-collections'])}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">07 / 08</span>
              <CopySectionLink id={`${sectionId}-techzone-collections`} label={`${label} TechZone Collections`} />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('techzone-collections') && (
            <div id={`${sectionId}-techzone-collections-content`} className="mt-3 grid gap-3 sm:grid-cols-2">
              {resources.techZoneCollections.length > 0 ? resources.techZoneCollections.map(collection => (
                <a
                  key={collection.url}
                  href={collection.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/[0.06] bg-[#161616] p-4 transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-[#a6c8ff]">{collection.name}</span>
                    <ExternalLinkIcon />
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-[#c6c6c6]">{collection.description}</span>
                </a>
              )) : (
                <p className="rounded-lg border border-dashed border-white/[0.1] bg-[#161616] px-4 py-5 text-sm text-[#8d8d8d] sm:col-span-2">
                  No TechZone Collections are listed for {label}.
                </p>
              )}
            </div>
          )}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('youtube-playlists') && (
        <div id={`${sectionId}-youtube-playlists`} className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('youtube-playlists')}
              aria-expanded={!collapsedProductResourceSections.has('youtube-playlists')}
              aria-controls={`${sectionId}-youtube-playlists-content`}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('youtube-playlists')} />
              IBM Product Hub on YouTube
            </button>
            <div className="flex items-center gap-1">
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('youtube-playlists')} controls={`${sectionId}-youtube-playlists-content`} label="IBM Product Hub on YouTube" onToggle={() => toggleProductResourceSection('youtube-playlists')} />
              {playlistEmbedUrls.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleYoutubePlaylistFrames(playlistEmbedUrls)}
                  aria-label={allPlaylistFramesHidden ? `Expand all ${label} Product Hub videos` : `Collapse all ${label} Product Hub videos`}
                  title={allPlaylistFramesHidden ? 'Expand all videos' : 'Collapse all videos'}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  <VideoVisibilityIcon visible={!allPlaylistFramesHidden} />
                </button>
              )}
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts['youtube-playlists'])}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">08 / 08</span>
              <CopySectionLink id={`${sectionId}-youtube-playlists`} label={`${label} IBM Product Hub YouTube playlists`} />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('youtube-playlists') && (
            <div id={`${sectionId}-youtube-playlists-content`} className="mt-3 grid gap-2 sm:grid-cols-2">
              {[...resources.youtubePlaylists].sort((a, b) => a.order - b.order).map(playlist => (
                <article key={playlist.url} className="overflow-hidden rounded-lg border border-white/[0.06] bg-[#161616]">
                  <div id={`${sectionId}-playlist-${playlist.order}-frame`}>
                    {!hiddenYoutubePlaylistFrames.has(playlist.embedUrl) && (
                      <iframe
                        src={playlist.embedUrl}
                        title={`${playlist.name} playlist`}
                        className="aspect-video w-full bg-black"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm font-semibold text-white">{playlist.name}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleYoutubePlaylistFrame(playlist.embedUrl)}
                        aria-expanded={!hiddenYoutubePlaylistFrames.has(playlist.embedUrl)}
                        aria-controls={`${sectionId}-playlist-${playlist.order}-frame`}
                        aria-label={hiddenYoutubePlaylistFrames.has(playlist.embedUrl) ? `Show ${playlist.name} video` : `Hide ${playlist.name} video`}
                        title={hiddenYoutubePlaylistFrames.has(playlist.embedUrl) ? 'Show video' : 'Hide video'}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-[#a6c8ff] transition-colors hover:border-[#4589ff]/50 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        <VideoVisibilityIcon visible={!hiddenYoutubePlaylistFrames.has(playlist.embedUrl)} />
                      </button>
                      <a
                        href={playlist.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${playlist.name} playlist in a new tab`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#a6c8ff] hover:bg-[#ff832b]/10 hover:text-white"
                      >
                        <ExternalLinkIcon />
                      </a>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        )}
        </div>
      </section>
    )
  }
  const renderCombinedPortfolioProductResources = () => {
    const resourceGroups = [
      ...businessAutomationCapabilities.map(capability => ({
        page: capability.page,
        label: capability.title,
        color: capability.color,
        resources: portfolioResources[capability.page],
      })),
      {
        page: 'cp4ba' as const,
        label: 'CP4BA',
        color: '#4589ff',
        resources: portfolioResources.cp4ba,
      },
    ].filter(group => selectedCapabilityPages.has(group.page))
    const sectionCounts: Record<ProductResourceSection, number> = {
      reference: resourceGroups.reduce((total, group) => total + group.resources.references.length, 0),
      previews: resourceGroups.reduce((total, group) => total + group.resources.previews.length, 0),
      'ai-capabilities': resourceGroups.reduce((total, group) => total + group.resources.aiCapabilities.length, 0),
      demos: resourceGroups.reduce(
        (total, group) => total + group.resources.demos.reduce((demoTotal, demoGroup) => demoTotal + demoGroup.links.length, 0),
        0,
      ),
      'sales-kits': resourceGroups.reduce((total, group) => total + group.resources.salesKits.length, 0),
      environments: resourceGroups.reduce((total, group) => total + group.resources.environments.length, 0),
      'techzone-collections': resourceGroups.reduce((total, group) => total + group.resources.techZoneCollections.length, 0),
      'youtube-playlists': resourceGroups.reduce((total, group) => total + group.resources.youtubePlaylists.length, 0),
    }
    const playlistEmbedUrls = resourceGroups.flatMap(group =>
      group.resources.youtubePlaylists.map(playlist => playlist.embedUrl),
    )
    const allPlaylistFramesHidden = playlistEmbedUrls.every(embedUrl => hiddenYoutubePlaylistFrames.has(embedUrl))
    const capabilityTag = (label: string, color: string) => (
      <span
        className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{
          borderColor: `${color}66`,
          backgroundColor: `${color}18`,
          color,
        }}
      >
        {label}
      </span>
    )

    return (
      <section
        id="portfolio-product-resources"
        aria-labelledby="portfolio-product-resources-heading"
        className="mt-14 scroll-mt-28 overflow-hidden rounded-2xl border-2 border-[#ff832b]/45 bg-[linear-gradient(145deg,rgba(255,131,43,0.08),rgba(14,16,25,1)_28%)] shadow-[0_20px_60px_rgba(0,0,0,0.3),0_0_32px_rgba(255,131,43,0.08)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ff832b]/20 bg-[#ff832b]/[0.04] px-5 py-6 sm:px-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff832b]">Multi-capability resource library</p>
            </div>
            <h2 id="portfolio-product-resources-heading" className="mt-2 text-3xl font-semibold text-white">
              <button
                type="button"
                onClick={() => setIsProductResourcesExpanded(expanded => !expanded)}
                aria-expanded={isProductResourcesExpanded}
                aria-controls="portfolio-product-resources-body"
                aria-label={isProductResourcesExpanded ? 'Collapse Product Resources' : 'Expand Product Resources'}
                title={isProductResourcesExpanded ? 'Collapse Product Resources' : 'Expand Product Resources'}
                className="inline-flex max-w-full items-center gap-3 overflow-x-auto whitespace-nowrap rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-[#ff832b]/55 hover:bg-[#ff832b]/10 hover:text-[#ffb784] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb784]"
              >
                <span>Product Resources</span>
                <span className="inline-flex items-center gap-1.5">
                  {resourceGroups.map(group => (
                    <Fragment key={group.page}>{capabilityTag(group.label, group.color)}</Fragment>
                  ))}
                </span>
                <span className="text-xs font-medium text-[#c6c6c6]">{resourceGroups.length} selected</span>
                <VideoVisibilityIcon visible={isProductResourcesExpanded} />
              </button>
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c6c6c6]">
              Explore references, previews, AI capabilities, demos, sales kits, demo environments, TechZone Collections, and IBM Product Hub playlists for every capability shown above. Tags identify where each resource belongs.
            </p>
          </div>
          <CopySectionLink id="portfolio-product-resources" label="Portfolio product resources" />
        </div>

        {!isProductResourcesExpanded && renderCollapsedProductResourceSummary(sectionCounts, 'portfolio-product-resources')}
        <div id="portfolio-product-resources-body" hidden={!isProductResourcesExpanded}>
        {renderProductResourceSectionFilters(sectionCounts)}

        {(effectiveVisibleProductResourceSections.has('reference') || effectiveVisibleProductResourceSections.has('previews')) && (
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
          {effectiveVisibleProductResourceSections.has('reference') && (
          <div id="portfolio-product-resources-reference" className="scroll-mt-28">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleProductResourceSection('reference')}
                aria-expanded={!collapsedProductResourceSections.has('reference')}
                aria-controls="portfolio-product-resources-reference-content"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
              >
                <ChevronIcon expanded={!collapsedProductResourceSections.has('reference')} />
                Reference
              </button>
              <div className="flex items-center gap-1">
                <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('reference')} controls="portfolio-product-resources-reference-content" label="Reference" onToggle={() => toggleProductResourceSection('reference')} />
                <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts.reference)}</span>
                <span className="font-mono text-[10px] text-[#8d8d8d]">01 / 08</span>
                <CopySectionLink id="portfolio-product-resources-reference" label="Portfolio reference resources" />
                <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
              </div>
            </div>
            {!collapsedProductResourceSections.has('reference') && <div id="portfolio-product-resources-reference-content" className="mt-3 space-y-2">
              {resourceGroups.flatMap(group =>
                group.resources.references.map(link => (
                  <a
                    key={`${group.page}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10 hover:text-white"
                  >
                    <span>{link.name}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {capabilityTag(group.label, group.color)}
                      <ExternalLinkIcon />
                    </span>
                  </a>
                )),
              )}
            </div>}
          </div>
          )}

          {effectiveVisibleProductResourceSections.has('previews') && (
          <div id="portfolio-product-resources-previews" className="scroll-mt-28">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleProductResourceSection('previews')}
                aria-expanded={!collapsedProductResourceSections.has('previews')}
                aria-controls="portfolio-product-resources-previews-content"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
              >
                <ChevronIcon expanded={!collapsedProductResourceSections.has('previews')} />
                Previews and trials
              </button>
              <div className="flex items-center gap-1">
                <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('previews')} controls="portfolio-product-resources-previews-content" label="Previews and trials" onToggle={() => toggleProductResourceSection('previews')} />
                <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts.previews)}</span>
                <span className="font-mono text-[10px] text-[#8d8d8d]">02 / 08</span>
                <CopySectionLink id="portfolio-product-resources-previews" label="Portfolio previews and trials" />
                <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
              </div>
            </div>
            {!collapsedProductResourceSections.has('previews') && <div id="portfolio-product-resources-previews-content" className="mt-3 space-y-2">
              {resourceGroups.flatMap(group =>
                group.resources.previews.map(preview => (
                  <a
                    key={`${group.page}-${preview.url}`}
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10 hover:text-white"
                  >
                    <span>{preview.name}<span className="ml-2 text-xs text-[#c6c6c6]">{preview.action}</span></span>
                    <span className="ml-auto flex items-center gap-2">
                      {capabilityTag(group.label, group.color)}
                      <ExternalLinkIcon />
                    </span>
                  </a>
                )),
              )}
            </div>}
          </div>
          )}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('ai-capabilities') && (
        <div id="portfolio-product-resources-ai-capabilities" className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('ai-capabilities')}
              aria-expanded={!collapsedProductResourceSections.has('ai-capabilities')}
              aria-controls="portfolio-product-resources-ai-capabilities-content"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('ai-capabilities')} />
              AI capabilities
            </button>
            <div className="flex items-center gap-1">
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('ai-capabilities')} controls="portfolio-product-resources-ai-capabilities-content" label="AI capabilities" onToggle={() => toggleProductResourceSection('ai-capabilities')} />
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts['ai-capabilities'])}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">03 / 08</span>
              <CopySectionLink id="portfolio-product-resources-ai-capabilities" label="Portfolio AI capabilities" />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('ai-capabilities') && <div id="portfolio-product-resources-ai-capabilities-content" className="mt-3 grid gap-3 sm:grid-cols-2">
            {resourceGroups.flatMap(group =>
              group.resources.aiCapabilities.map(capability => (
                <article key={`${group.page}-${capability.name}`} className="rounded-lg border border-white/[0.06] bg-[#161616] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{capability.name}</h4>
                    {capabilityTag(group.label, group.color)}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#c6c6c6]">{capability.description}</p>
                  {'url' in capability && capability.url && (
                    <a href={capability.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#78a9ff] hover:text-white">
                      Learn more
                      <ExternalLinkIcon />
                    </a>
                  )}
                </article>
              )),
            )}
          </div>}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('demos') && (
        <div id="portfolio-product-resources-demos" className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('demos')}
              aria-expanded={!collapsedProductResourceSections.has('demos')}
              aria-controls="portfolio-product-resources-demos-content"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('demos')} />
              Demos and videos
            </button>
            <div className="flex items-center gap-1">
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('demos')} controls="portfolio-product-resources-demos-content" label="Demos and videos" onToggle={() => toggleProductResourceSection('demos')} />
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts.demos)}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">04 / 08</span>
              <CopySectionLink id="portfolio-product-resources-demos" label="Portfolio demos and videos" />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('demos') && <div id="portfolio-product-resources-demos-content" className="mt-3 grid gap-5 lg:grid-cols-2">
            {resourceGroups.flatMap(group =>
              group.resources.demos.map(demoGroup => (
                <div key={`${group.page}-${demoGroup.title}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{demoGroup.title}</h4>
                    {capabilityTag(group.label, group.color)}
                  </div>
                  <ul className="mt-2 space-y-2">
                    {demoGroup.links.map(link => (
                      <li key={link.url}>
                        <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-xs font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:text-white">
                          <span>{link.name}</span>
                          <ExternalLinkIcon />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )),
            )}
          </div>}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('sales-kits') && (
        <div id="portfolio-product-resources-sales-kits" className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('sales-kits')}
              aria-expanded={!collapsedProductResourceSections.has('sales-kits')}
              aria-controls="portfolio-product-resources-sales-kits-content"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('sales-kits')} />
              Sales kits
            </button>
            <div className="flex items-center gap-1">
              {renderSalesKitSortControl()}
              {renderSalesKitCapabilitySortControl()}
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('sales-kits')} controls="portfolio-product-resources-sales-kits-content" label="Sales kits" onToggle={() => toggleProductResourceSection('sales-kits')} />
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts['sales-kits'])}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">05 / 08</span>
              <CopySectionLink id="portfolio-product-resources-sales-kits" label="Portfolio sales kits" />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('sales-kits') && <div id="portfolio-product-resources-sales-kits-content" className="mt-3 grid gap-2 sm:grid-cols-2">
            {resourceGroups.flatMap(group =>
              group.resources.salesKits.map(link => ({
                link,
                group,
                capability: businessAutomationSalesKitNames.includes(link.name) ? 'BA' : group.label,
              })),
            )
              .sort((a, b) => compareSalesKitCards(
                { name: a.link.name, capability: a.capability },
                { name: b.link.name, capability: b.capability },
              ))
              .map(({ link, group, capability }) => (
                <a
                  key={`${group.page}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10 hover:text-white"
                >
                  <span>{link.name}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {capabilityTag(capability, group.color)}
                    <ExternalLinkIcon />
                  </span>
                </a>
              ))}
          </div>}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('environments') && (
        <div id="portfolio-product-resources-environments" className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('environments')}
              aria-expanded={!collapsedProductResourceSections.has('environments')}
              aria-controls="portfolio-product-resources-environments-content"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('environments')} />
              Demo Environments
            </button>
            <div className="flex items-center gap-1">
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('environments')} controls="portfolio-product-resources-environments-content" label="Demo environments" onToggle={() => toggleProductResourceSection('environments')} />
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts.environments)}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">06 / 08</span>
              <CopySectionLink id="portfolio-product-resources-environments" label="Portfolio demo environments" />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('environments') && (
            <div id="portfolio-product-resources-environments-content" className="mt-3 grid gap-3 sm:grid-cols-2">
              {sectionCounts.environments > 0 ? resourceGroups.flatMap(group =>
                group.resources.environments.map(environment => ({ environment, group })),
              )
                .sort((a, b) => Number(Boolean(b.environment.recommended)) - Number(Boolean(a.environment.recommended)))
                .map(({ environment, group }) => (
                  <a
                    key={`${group.page}-${environment.url}`}
                    href={environment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/[0.06] bg-[#161616] p-4 transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10"
                  >
                    <span className="flex flex-wrap items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-[#a6c8ff]">{environment.name}</span>
                      <span className="flex items-center gap-2">
                        {environment.recommended && (
                          <span className="rounded-full border border-[#42be65]/45 bg-[#42be65]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6fdc8c]">
                            Recommended
                          </span>
                        )}
                        {capabilityTag(group.label, group.color)}
                        <ExternalLinkIcon />
                      </span>
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-[#c6c6c6]">{environment.description}</span>
                  </a>
                )) : (
                <p className="rounded-lg border border-dashed border-white/[0.1] bg-[#161616] px-4 py-5 text-sm text-[#8d8d8d] sm:col-span-2">
                  No demo environments are listed for the selected capabilities.
                </p>
              )}
            </div>
          )}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('techzone-collections') && (
        <div id="portfolio-product-resources-techzone-collections" className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('techzone-collections')}
              aria-expanded={!collapsedProductResourceSections.has('techzone-collections')}
              aria-controls="portfolio-product-resources-techzone-collections-content"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('techzone-collections')} />
              TechZone Collections
            </button>
            <div className="flex items-center gap-1">
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('techzone-collections')} controls="portfolio-product-resources-techzone-collections-content" label="TechZone Collections" onToggle={() => toggleProductResourceSection('techzone-collections')} />
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts['techzone-collections'])}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">07 / 08</span>
              <CopySectionLink id="portfolio-product-resources-techzone-collections" label="Portfolio TechZone Collections" />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('techzone-collections') && (
            <div id="portfolio-product-resources-techzone-collections-content" className="mt-3 grid gap-3 sm:grid-cols-2">
              {sectionCounts['techzone-collections'] > 0 ? resourceGroups.flatMap(group =>
                group.resources.techZoneCollections.map(collection => (
                  <a
                    key={`${group.page}-${collection.url}`}
                    href={collection.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/[0.06] bg-[#161616] p-4 transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10"
                  >
                    <span className="flex flex-wrap items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-[#a6c8ff]">{collection.name}</span>
                      <span className="flex items-center gap-2">
                        {capabilityTag(group.label, group.color)}
                        <ExternalLinkIcon />
                      </span>
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-[#c6c6c6]">{collection.description}</span>
                  </a>
                )),
              ) : (
                <p className="rounded-lg border border-dashed border-white/[0.1] bg-[#161616] px-4 py-5 text-sm text-[#8d8d8d] sm:col-span-2">
                  No TechZone Collections are listed for the selected capabilities.
                </p>
              )}
            </div>
          )}
        </div>
        )}

        {effectiveVisibleProductResourceSections.has('youtube-playlists') && (
        <div id="portfolio-product-resources-youtube-playlists" className="scroll-mt-28 border-t border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => toggleProductResourceSection('youtube-playlists')}
              aria-expanded={!collapsedProductResourceSections.has('youtube-playlists')}
              aria-controls="portfolio-product-resources-youtube-playlists-content"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff] hover:text-white"
            >
              <ChevronIcon expanded={!collapsedProductResourceSections.has('youtube-playlists')} />
              IBM Product Hub on YouTube
            </button>
            <div className="flex items-center gap-1">
              <ProductResourceSectionToggleButton expanded={!collapsedProductResourceSections.has('youtube-playlists')} controls="portfolio-product-resources-youtube-playlists-content" label="IBM Product Hub on YouTube" onToggle={() => toggleProductResourceSection('youtube-playlists')} />
              {playlistEmbedUrls.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleYoutubePlaylistFrames(playlistEmbedUrls)}
                  aria-label={allPlaylistFramesHidden ? 'Expand all Portfolio Product Hub videos' : 'Collapse all Portfolio Product Hub videos'}
                  title={allPlaylistFramesHidden ? 'Expand all videos' : 'Collapse all videos'}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  <VideoVisibilityIcon visible={!allPlaylistFramesHidden} />
                </button>
              )}
              <span className="text-[10px] font-medium text-[#c6c6c6]">{productResourceAssetCountLabel(sectionCounts['youtube-playlists'])}</span>
              <span className="font-mono text-[10px] text-[#8d8d8d]">08 / 08</span>
              <CopySectionLink id="portfolio-product-resources-youtube-playlists" label="Portfolio IBM Product Hub YouTube playlists" />
              <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
            </div>
          </div>
          {!collapsedProductResourceSections.has('youtube-playlists') && (
            <div id="portfolio-product-resources-youtube-playlists-content" className="mt-3 grid gap-2 sm:grid-cols-2">
              {resourceGroups.flatMap(group =>
                group.resources.youtubePlaylists.map(playlist => ({ playlist, group })),
              )
                .sort((a, b) => a.playlist.order - b.playlist.order)
                .map(({ playlist, group }) => (
                  <article key={`${group.page}-${playlist.url}`} className="overflow-hidden rounded-lg border border-white/[0.06] bg-[#161616]">
                    <div id={`portfolio-${group.page}-playlist-${playlist.order}-frame`}>
                      {!hiddenYoutubePlaylistFrames.has(playlist.embedUrl) && (
                        <iframe
                          src={playlist.embedUrl}
                          title={`${playlist.name} playlist`}
                          className="aspect-video w-full bg-black"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <span className="text-sm font-semibold text-white">{playlist.name}</span>
                      <span className="ml-auto flex items-center gap-1">
                        {capabilityTag(group.label, group.color)}
                        <button
                          type="button"
                          onClick={() => toggleYoutubePlaylistFrame(playlist.embedUrl)}
                          aria-expanded={!hiddenYoutubePlaylistFrames.has(playlist.embedUrl)}
                          aria-controls={`portfolio-${group.page}-playlist-${playlist.order}-frame`}
                          aria-label={hiddenYoutubePlaylistFrames.has(playlist.embedUrl) ? `Show ${playlist.name} video` : `Hide ${playlist.name} video`}
                          title={hiddenYoutubePlaylistFrames.has(playlist.embedUrl) ? 'Show video' : 'Hide video'}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-[#a6c8ff] transition-colors hover:border-[#4589ff]/50 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                        >
                          <VideoVisibilityIcon visible={!hiddenYoutubePlaylistFrames.has(playlist.embedUrl)} />
                        </button>
                        <a
                          href={playlist.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${playlist.name} playlist in a new tab`}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#a6c8ff] hover:bg-[#ff832b]/10 hover:text-white"
                        >
                          <ExternalLinkIcon />
                        </a>
                      </span>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
        )}
        </div>

      </section>
    )
  }
  const selectedCapabilityLabels = businessAutomationCapabilityFilters
    .filter(filter => selectedCapabilityPages.has(filter.page))
    .map(filter => filter.label)
  const selectedCapabilitySummary = selectedCapabilityLabels.length > 0
    ? `${selectedCapabilityLabels.length} selected: ${selectedCapabilityLabels.join(' · ')}`
    : '0 selected'
  const capabilityContentNavigation = (() => {
    const resourceSubsections = (sectionId: string) => productResourceSectionFilters
      .filter(filter => effectiveVisibleProductResourceSections.has(filter.id))
      .map(filter => ({
        id: `${sectionId}-${filter.id}`,
        label: filter.label,
      }))

    if (selectedCapabilityPages.size === allBusinessAutomationCapabilityPages.length) {
      return [
        { id: 'capabilities-all', label: 'Portfolio overview' },
        ...businessAutomationCapabilityFilters.map(filter => ({
          id: `capabilities-all-${filter.page}`,
          label: filter.label,
        })),
        { id: 'portfolio-product-resources', label: 'Product resources' },
        ...resourceSubsections('portfolio-product-resources'),
      ]
    }
    if (selectedCapabilityPages.size !== 1) return []

    const page = [...selectedCapabilityPages][0]
    const label = businessAutomationCapabilityFilters.find(filter => filter.page === page)?.label ?? 'Capability'
    if (page === 'cp4ba') {
      return [
        { id: pageAnchors.cp4ba, label: 'CP4BA overview' },
        { id: 'cp4ba-platform-overview', label: 'Platform overview' },
        { id: 'cp4ba-domains', label: 'Automation domains' },
        { id: 'cp4ba-foundation', label: 'Platform foundation' },
        { id: 'cp4ba-value', label: 'Business value' },
        { id: 'cp4ba-product-resources', label: 'Product resources' },
        ...resourceSubsections('cp4ba-product-resources'),
      ]
    }
    return [
      { id: pageAnchors[page], label: `${label} overview` },
      { id: `${page}-outcomes`, label: 'Business outcomes' },
      { id: `${page}-capabilities`, label: 'Core capabilities' },
      { id: `${page}-products`, label: 'Products and solutions' },
      { id: `${page}-product-resources`, label: 'Product resources' },
      ...resourceSubsections(`${page}-product-resources`),
    ]
  })()
  const navigateToCapabilityContent = (id: string) => {
    if (id === 'capabilities-all' || id.startsWith('capabilities-all-')) {
      setIsCapabilityOverviewExpanded(true)
    }
    if (id.includes('product-resources')) {
      setIsProductResourcesExpanded(true)
      const resourceSection = productResourceSectionFilters.find(filter => id.endsWith(`-${filter.id}`))
      if (resourceSection) {
        setCollapsedProductResourceSections(current => {
          const next = new Set(current)
          next.delete(resourceSection.id)
          return next
        })
      }
    }

    const hash = `#${id}`
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash)
    }
    setSelectedSectionId(id)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }))
    })
  }
  const renderCapabilityFilters = () => (
    <section
      id="capabilities-top"
      aria-labelledby="capabilities-filter-heading"
      className="mb-8 scroll-mt-28 rounded-xl border border-[#4589ff]/30 bg-[#262626] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => setIsCapabilityFilterExpanded(expanded => !expanded)}
            aria-expanded={isCapabilityFilterExpanded}
            aria-controls="capability-filter-controls"
            aria-label={isCapabilityFilterExpanded ? 'Collapse Filter' : 'Expand Filter'}
            title={isCapabilityFilterExpanded ? 'Collapse Filter' : 'Expand Filter'}
            className="inline-flex h-7 items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#78a9ff] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
          >
            Filter
            <VideoVisibilityIcon visible={isCapabilityFilterExpanded} />
          </button>
          <h2 id="capabilities-filter-heading" className="text-lg font-semibold text-white">Business Automation Capability</h2>
          <span className="text-xs font-medium text-[#c6c6c6]">{selectedCapabilitySummary}</span>
        </div>
        <CopySectionLink id="capabilities-top" label="Business Automation portfolio" />
      </div>
      <div id="capability-filter-controls" hidden={!isCapabilityFilterExpanded} role="group" aria-label="Filter Business Automation portfolio" className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
        <button
          type="button"
          aria-pressed={selectedCapabilityPages.size === allBusinessAutomationCapabilityPages.length}
          onClick={() => filterCapabilities('capabilities')}
          className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] ${
            selectedCapabilityPages.size === allBusinessAutomationCapabilityPages.length
              ? 'border-[#78a9ff] bg-[#0f62fe] text-white shadow-[0_0_0_2px_rgba(120,169,255,0.18),0_0_18px_rgba(15,98,254,0.35)]'
              : 'border-white/[0.1] bg-white/[0.02] text-[#a8a8a8] hover:border-[#4589ff]/50 hover:bg-white/[0.05] hover:text-white'
          }`}
        >
          {selectedCapabilityPages.size === allBusinessAutomationCapabilityPages.length && (
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="m3.5 8.2 2.7 2.7 6.3-6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          Show all
        </button>
        {businessAutomationCapabilityFilters.map(filter => {
          const isActive = selectedCapabilityPages.has(filter.page)
          return (
            <button
              key={filter.page}
              type="button"
              aria-pressed={isActive}
              onClick={() => filterCapabilities(filter.page)}
              className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] ${
                isActive
                  ? 'text-white'
                  : 'border-white/[0.1] bg-white/[0.02] text-[#a8a8a8] hover:border-white/[0.22] hover:bg-white/[0.05] hover:text-white'
              }`}
              style={isActive ? {
                borderColor: `${filter.color}bb`,
                backgroundColor: `${filter.color}20`,
                boxShadow: `0 0 0 2px ${filter.color}16, 0 0 18px ${filter.color}24`,
              } : undefined}
            >
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-transform ${isActive ? 'scale-105' : ''}`}
                style={{
                  borderColor: isActive ? filter.color : `${filter.color}88`,
                  backgroundColor: isActive ? filter.color : `${filter.color}18`,
                }}
              >
                {isActive && (
                  <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-[#161616]" fill="none">
                    <path d="m3.5 8.2 2.7 2.7 6.3-6.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {filter.label}
            </button>
          )
        })}
      </div>
      {capabilityContentNavigation.length > 0 && (
        <nav aria-label="Contents" className="mt-4 border-t border-white/[0.06] pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <button
              type="button"
              onClick={() => setIsCapabilityContentsExpanded(expanded => !expanded)}
              aria-expanded={isCapabilityContentsExpanded}
              aria-controls="capability-contents-list"
              aria-label={isCapabilityContentsExpanded ? 'Collapse Contents' : 'Expand Contents'}
              title={isCapabilityContentsExpanded ? 'Collapse Contents' : 'Expand Contents'}
              className="inline-flex h-7 shrink-0 items-center gap-2 self-start rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#78a9ff] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
            >
              Contents
              <VideoVisibilityIcon visible={isCapabilityContentsExpanded} />
            </button>
            <ol id="capability-contents-list" hidden={!isCapabilityContentsExpanded} className="flex flex-wrap gap-1.5">
              {capabilityContentNavigation.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={event => {
                      event.preventDefault()
                      navigateToCapabilityContent(item.id)
                    }}
                    className="group inline-flex min-h-7 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[11px] font-medium text-[#c6c6c6] transition-colors hover:border-[#4589ff]/45 hover:bg-[#0f62fe]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    <span className={`rounded px-1 py-0.5 font-mono text-[9px] font-semibold transition-colors group-hover:text-white ${
                      index >= 6
                        ? 'bg-[#ff832b]/18 text-[#ffb784] group-hover:bg-[#ff832b]/30'
                        : 'bg-[#0f62fe]/18 text-[#78a9ff] group-hover:bg-[#0f62fe]/30'
                    }`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}
    </section>
  )

  const mainHeaderTitle = isCapabilitiesPage
    ? 'Business Automation Portfolio'
    : currentPage === 'badges'
    ? 'Badge'
    : currentPage === 'lets-create'
    ? 'Let\'s Create!'
    : currentPage === 'conference'
      ? 'Conference'
      : currentPage === 'think'
        ? 'Think'
        : currentPage === 'techxchange'
          ? 'TechXchange'
          : currentPage === 'schedule'
            ? 'Conference Schedule'
            : currentPage === 'maps'
              ? 'Maps'
              : currentPage === 'ibm'
                ? 'IBM'
                : currentPage === 'insights'
                  ? 'Insights'
                  : currentPage === 'info'
                      ? 'Conference Info'
                      : currentPage === 'community'
                        ? 'Community'
                        : currentPage === 'enablement'
                          ? 'Community Enablement'
                        : currentPage === 'ug'
                          ? 'User Groups'
                          : currentPage === 'surveys'
                            ? 'Surveys'
                            : currentPage === 'speaker'
                              ? 'Audio/Visual'
                              : 'Business Automation'
  const breadcrumbTrail = getBreadcrumbTrail(currentPage)
  const selectedSectionLabel = selectedSectionId
    ? capabilityContentNavigation.find(item => item.id === selectedSectionId)?.label ??
      formatBreadcrumbSectionLabel(selectedSectionId)
    : null

  return (
    <div className="min-h-screen bg-[#161616]">
      {/* Header */}
      <header data-page-header className="border-b border-white/[0.06] bg-[#161616]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className={`relative w-full px-4 sm:px-6 lg:px-10 ${isMainHeaderExpanded ? 'py-3 sm:py-4' : 'py-2'}`}>
          {isMainHeaderExpanded ? (
          <div id="main-page-header-content" className="flex flex-col justify-between gap-3 md:flex-row md:items-start md:gap-0">
            <div>
              {isConferenceSection ? (
                <a
                  href="https://www.ibm.com/events/techxchange"
                  target="_blank"
                  rel="noreferrer"
                  className="mb-1 inline-block text-xs font-medium uppercase tracking-[0.18em] text-[#0f62fe] transition-colors hover:text-[#78a9ff]"
                >
                  IBM TechXchange 2026
                </a>
              ) : (
                <a
                  href="https://ibm.biz/business-automation"
                  aria-label="IBM Business Automation"
                  className="mb-1 inline-flex items-center gap-2.5 text-[#78a9ff] transition-colors hover:text-white"
                >
                  <img
                    src={asset('ibm-logo.png')}
                    alt="IBM"
                    className="h-5 w-auto shrink-0"
                  />
                  <span className="border-l border-white/[0.14] pl-2.5 text-xs font-semibold uppercase tracking-[0.16em]">
                    Business Automation
                  </span>
                </a>
              )}
              <h1
                className={`font-semibold leading-tight text-white ${
                  currentPage === 'cp4ba'
                    ? 'whitespace-nowrap text-xl sm:text-2xl lg:text-3xl'
                    : 'text-2xl sm:text-3xl'
                }`}
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                <button
                  type="button"
                  onClick={() => setIsMainHeaderExpanded(false)}
                  aria-expanded="true"
                  aria-label={`Collapse header: ${mainHeaderTitle}`}
                  title="Collapse header"
                  className="inline-flex items-center gap-2 rounded-sm text-left transition-colors hover:text-[#a6c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  <span>{mainHeaderTitle}</span>
                  <VideoVisibilityIcon visible />
                </button>
              </h1>
              {currentPage === 'insights' && (
                <button
                  type="button"
                  onClick={returnFromInsights}
                  className="mt-2 inline-flex h-8 items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.03] px-3 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  <ReturnIcon />
                  Return
                </button>
              )}
            </div>
            <div className="min-w-0 flex flex-col gap-2 sm:items-end">
              <div className="flex w-full flex-nowrap items-center gap-1.5 overflow-x-auto sm:justify-end">
                {([
                  ['overview', 'Main'],
                  ['community', 'Community'],
                  ['conference', 'Conference'],
                ] as const).map(([page, label]) => {
                  const isActive = page === 'overview'
                    ? isBusinessAutomationSection
                    : page === 'conference'
                      ? isConferenceSection
                      : page === 'community'
                        ? isCommunitySection
                        : currentPage === page
                  return (
                    <a
                      key={page}
                      href={`#${pageAnchors[page]}`}
                      onClick={event => {
                        event.preventDefault()
                        navigateToPage(page)
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors sm:px-3 sm:text-xs ${
                        isActive
                          ? 'border-[#0f62fe] bg-[#0f62fe] text-white shadow-[0_0_16px_rgba(15,98,254,0.24)]'
                          : 'border-white/[0.1] bg-white/[0.04] text-[#a6c8ff] hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white'
                      }`}
                    >
                      {label}
                    </a>
                  )
                })}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-pressed={isFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] ${
                    isFullscreen
                      ? 'border-[#4589ff] bg-[#0f62fe]/25 text-white'
                      : 'border-white/[0.1] bg-white/[0.04] text-[#a6c8ff] hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white'
                  }`}
                >
                  <FullscreenIcon active={isFullscreen} />
                </button>
              </div>
              {isCommunitySection && (
                <nav aria-label="Community subpages" className="flex w-full flex-wrap items-center gap-1.5 sm:justify-end">
                  {([
                    ['community', 'Overview'],
                    ['enablement', 'Enablement'],
                  ] as const).map(([page, label]) => {
                    const isActive = currentPage === page
                    return (
                      <a
                        key={page}
                        href={`#${pageAnchors[page]}`}
                        onClick={event => {
                          event.preventDefault()
                          navigateToPage(page)
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded px-2.5 text-[11px] font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#0f62fe]/20 text-white'
                            : 'text-[#c6c6c6] hover:bg-white/[0.04] hover:text-[#a6c8ff]'
                        }`}
                      >
                        {label}
                      </a>
                    )
                  })}
                </nav>
              )}
              {isBusinessAutomationSection && (
                <nav aria-label="Business Automation subpages" className="flex w-full flex-wrap items-center gap-1.5 sm:justify-end">
                  {([
                    ['overview', 'Overview'],
                    ['capabilities', 'Portfolio'],
                    ['badges', 'Badge'],
                    ['lets-create', 'Let\'s Create!'],
                  ] as const).map(([page, label]) => {
                    const isActive = page === 'capabilities' ? isCapabilitiesPage : currentPage === page
                    return (
                      <a
                        key={page}
                        href={`#${pageAnchors[page]}`}
                        onClick={event => {
                          event.preventDefault()
                          navigateToPage(page)
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded px-2.5 text-[11px] font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#0f62fe]/20 text-white'
                            : 'text-[#c6c6c6] hover:bg-white/[0.04] hover:text-[#a6c8ff]'
                        }`}
                      >
                        {label}
                      </a>
                    )
                  })}
                </nav>
              )}
              {isConferenceSection && (
                <nav aria-label="Conference subpages" className="flex w-full flex-wrap items-center gap-1.5 sm:justify-end">
                  {([
                    ['think', 'Think'],
                    ['techxchange', 'TechXchange'],
                  ] as const).map(([page, label]) => {
                    const isActive = page === 'techxchange' ? isTechXchangeSection : currentPage === page
                    return (
                      <a
                        key={page}
                        href={`#${pageAnchors[page]}`}
                        onClick={event => {
                          event.preventDefault()
                          navigateToPage(page)
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded px-2.5 text-[11px] font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#0f62fe]/20 text-white'
                            : 'text-[#c6c6c6] hover:bg-white/[0.04] hover:text-[#a6c8ff]'
                        }`}
                      >
                        {label}
                      </a>
                    )
                  })}
                </nav>
              )}
              {isTechXchangeSection && (
                <nav aria-label="TechXchange subpages" className="flex w-full flex-wrap items-center gap-1.5 sm:justify-end">
                  {([
                    ['sessions', 'Overview'],
                    ['schedule', 'Schedule'],
                    ['maps', 'Maps'],
                    ['info', 'Info'],
                    ['ug', 'User Group'],
                    ['surveys', 'Surveys'],
                    ['ibm', 'IBM'],
                  ] as const).map(([page, label]) => {
                    const isActive = page === 'ibm' ? isIbmSection : currentPage === page
                    return (
                      <a
                        key={page}
                        href={`#${pageAnchors[page]}`}
                        onClick={event => {
                          event.preventDefault()
                          navigateToPage(page)
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded px-2.5 text-[11px] font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#0f62fe]/20 text-white'
                            : 'text-[#c6c6c6] hover:bg-white/[0.04] hover:text-[#a6c8ff]'
                        }`}
                      >
                        {label}
                      </a>
                    )
                  })}
                </nav>
              )}
              {isIbmSection && (
                <nav aria-label="IBM subpages" className="flex w-full flex-wrap items-center gap-1.5 sm:justify-end">
                  {([
                    ['ibm', 'Overview'],
                    ['insights', 'Insights'],
                    ['speaker', 'AV'],
                  ] as const).map(([page, label]) => {
                    const isActive = currentPage === page
                    return (
                      <a
                        key={page}
                        href={`#${pageAnchors[page]}`}
                        onClick={event => {
                          event.preventDefault()
                          navigateToPage(page)
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded px-2.5 text-[11px] font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#0f62fe]/20 text-white'
                            : 'text-[#c6c6c6] hover:bg-white/[0.04] hover:text-[#a6c8ff]'
                        }`}
                      >
                        {label}
                      </a>
                    )
                  })}
                </nav>
              )}
              <p className="text-right text-sm text-[#8d8d8d]">
                {activeBusinessAutomationCapability
                  ? activeBusinessAutomationCapability.tagline
                  : currentPage === 'onboarding-automation'
                    ? 'Employee onboarding use case · content and document services'
                  : currentPage === 'cp4ba'
                    ? 'IBM Cloud Pak for Business Automation'
                  : currentPage === 'capabilities'
                    ? 'Process · Content · Decisions · Platform'
                  : currentPage === 'badges'
                    ? `${badgeEntries.length} Business Automation badges`
                  : currentPage === 'lets-create'
                    ? 'Learn, demo, and build with Business Automation'
                  : currentPage === 'overview'
                  ? 'IBM Business Automation · AI-powered operations'
                  : currentPage === 'sessions'
                  ? `Business Automation Sessions · ${sessions.length} sessions · Oct 26–29, Atlanta, GA`
                  : currentPage === 'conference'
                    ? 'IBM events, experiences, and conference resources'
                  : currentPage === 'think'
                    ? 'June 7-10, 2027 | Boston, MA'
                  : currentPage === 'techxchange'
                    ? 'Oct 26–29, 2026 · Atlanta, Georgia'
                  : currentPage === 'schedule'
                    ? 'Conference at a glance including General Sessions along with a view of Business Automation'
                  : currentPage === 'maps'
                  ? `${venueMaps.length} venue maps · GWCC, Atlanta`
                  : currentPage === 'ibm'
                    ? 'Insights · presenter AV resources'
                  : currentPage === 'insights'
                    ? 'IBM TechXchange insights'
                  : currentPage === 'info'
                    ? `${conferenceInfo.length + 2} conference guides · Atlanta, GA`
                      : currentPage === 'community'
                        ? `${userConnectCommunities.length} IBM Business Automation User Connect communities`
                      : currentPage === 'enablement'
                        ? `${enablementItems.length} enablement activities · user groups, COE, and sales`

                      : currentPage === 'ug'
                        ? `${ugResourceCount} Business Automation user group resources`
                        : currentPage === 'surveys'
                          ? `${surveys.length} surveys · IBM TechXchange 2026`
                          : currentPage === 'speaker'
                            ? 'Presenter setup · AV support'
                            : `${sessions.length} sessions · Oct 26–29, Atlanta, GA`}
              </p>
            </div>
          </div>
          ) : (
            <div className="flex min-h-9 items-center gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {isConferenceSection ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#78a9ff] sm:text-xs">
                    IBM TechXchange 2026
                  </span>
                ) : (
                  <a
                    href="https://ibm.biz/business-automation"
                    aria-label="IBM Business Automation"
                    className="flex shrink-0 items-center gap-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    <img src={asset('ibm-logo.png')} alt="IBM" className="h-4 w-auto" />
                    <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78a9ff] sm:inline">
                      Business Automation
                    </span>
                  </a>
                )}
                <span className="h-5 w-px shrink-0 bg-white/[0.14]" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setIsMainHeaderExpanded(true)}
                  aria-expanded="false"
                  aria-label={`Expand header: ${mainHeaderTitle}`}
                  title="Expand header"
                  className="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-left text-sm font-semibold text-white transition-colors hover:text-[#a6c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  <span className="truncate">{mainHeaderTitle}</span>
                  <VideoVisibilityIcon visible={false} />
                </button>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
              {currentPage === 'insights' && (
                <button
                  type="button"
                  onClick={returnFromInsights}
                  className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.03] px-3 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  <ReturnIcon />
                  Return
                </button>
              )}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-pressed={isFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff] ${
                    isFullscreen
                      ? 'border-[#4589ff] bg-[#0f62fe]/25 text-white'
                      : 'border-white/[0.1] bg-white/[0.04] text-[#a6c8ff] hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white'
                  }`}
                >
                  <FullscreenIcon active={isFullscreen} />
                </button>
              </div>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2">
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#8d8d8d]">
              {breadcrumbTrail.map((page, index) => {
                const isCurrentPage = index === breadcrumbTrail.length - 1 && !selectedSectionLabel
                return (
                  <li key={page} className="flex items-center gap-2">
                    {isCurrentPage ? (
                      <span aria-current="page" className="font-semibold text-[#e0e0e0]">
                        {breadcrumbLabels[page]}
                      </span>
                    ) : (
                      <a
                        href={`#${pageAnchors[page]}`}
                        onClick={event => {
                          event.preventDefault()
                          navigateToBreadcrumbPage(page)
                        }}
                        className="rounded-sm text-[#a6c8ff] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        {breadcrumbLabels[page]}
                      </a>
                    )}
                    {!isCurrentPage && <span aria-hidden="true" className="text-[#525252]">/</span>}
                  </li>
                )
              })}
              {selectedSectionLabel && (
                <li className="flex items-center gap-2">
                  <span aria-current="page" className="font-semibold text-[#e0e0e0]">
                    {selectedSectionLabel}
                  </span>
                </li>
              )}
            </ol>
          </nav>
          <GlobalSearch currentPage={currentPage} includeGated={hasIbmAccess} onSelect={openSearchResult} />
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
        {isIbmSection && !hasIbmAccess ? (
          <section
            id="ibm-access"
            aria-labelledby="ibm-access-heading"
            className="mx-auto mt-8 max-w-lg overflow-hidden rounded-2xl border border-[#4589ff]/35 bg-[#262626] shadow-[0_24px_72px_rgba(0,0,0,0.35)]"
          >
            <div className="border-b border-white/[0.06] bg-gradient-to-r from-[#0f62fe]/20 to-transparent px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78a9ff]">Restricted resources</p>
                <CopySectionLink id="ibm-access" label="IBM access page" />
              </div>
              <h2 id="ibm-access-heading" className="mt-1 text-2xl font-semibold text-white">Enter IBM page password</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#c6c6c6]">
                A password is required to access the IBM overview, insights, and audio/visual instructions.
              </p>
              <p className="mt-2 text-sm text-[#c6c6c6]">
                Contact{' '}
                <a
                  href="https://ibm.enterprise.slack.com/archives/D3UJ1BAG6"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#78a9ff] transition-colors hover:text-white"
                >
                  Thomas Yang on Slack
                </a>{' '}
                for the password.
              </p>
            </div>
            <form onSubmit={unlockIbmPages} className="p-6">
              <label htmlFor="ibm-password" className="block text-sm font-semibold text-[#f4f4f4]">
                Password
              </label>
              <input
                id="ibm-password"
                type="password"
                value={ibmPassword}
                onChange={event => {
                  setIbmPassword(event.target.value)
                  if (ibmAccessError) setIbmAccessError('')
                }}
                autoComplete="current-password"
                autoFocus
                aria-invalid={Boolean(ibmAccessError)}
                aria-describedby={ibmAccessError ? 'ibm-password-error' : undefined}
                className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#161616] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#8d8d8d] focus:border-[#4589ff] focus:ring-2 focus:ring-[#0f62fe]/30"
                placeholder="Enter password"
              />
              {ibmAccessError && (
                <p id="ibm-password-error" role="alert" className="mt-2 text-sm text-[#ff8389]">
                  {ibmAccessError}
                </p>
              )}
              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-[#0f62fe] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
              >
                Unlock IBM resources
              </button>
              <p className="mt-4 text-xs leading-relaxed text-[#8d8d8d]">
                Access remains unlocked for this browser tab until it is closed.
              </p>
            </form>
          </section>
        ) : currentPage === 'overview' ? (
          <section id="main" aria-labelledby="business-automation-overview-heading" className="scroll-mt-28">
            <div className="relative overflow-hidden rounded-2xl border border-[#4589ff]/25 bg-[#262626]">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(15,98,254,0.34),transparent_34%),radial-gradient(circle_at_12%_100%,rgba(61,219,217,0.11),transparent_38%)]"
              />
              <div aria-hidden="true" className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-[#78a9ff]/15" />
              <div aria-hidden="true" className="absolute right-5 top-4 h-40 w-40 rounded-full border border-[#78a9ff]/20" />
              <div className="relative px-6 py-7 sm:px-10 sm:py-9">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#78a9ff]">IBM Business Automation</p>
                    <h2
                      id="business-automation-overview-heading"
                      className="mt-3 w-full whitespace-nowrap text-[clamp(0.8rem,4.3vw,3.25rem)] font-semibold leading-[1.06] tracking-tight text-white"
                    >
                      Put AI to work across your business.
                    </h2>
                  </div>
                  <CopySectionLink id="main" label="Business Automation overview" />
                </div>
                <div className={`mt-4 grid gap-6 ${isOverviewVideoExpanded ? '' : 'md:grid-cols-[1fr_18rem] md:items-end'}`}>
                  <div>
                    <p className="max-w-2xl text-base leading-relaxed text-[#c6c6c6] sm:text-lg">
                      Automate complex work, activate trusted enterprise content, and make better decisions with an integrated portfolio built for intelligent operations.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => navigateToPage('capabilities')}
                        className="cta-bounce-glow rounded-lg bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        Explore the portfolio
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToPage('techxchange')}
                        className="rounded-lg border border-white/[0.14] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        Visit TechXchange
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToPage('think')}
                        className="rounded-lg border border-white/[0.14] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        Visit IBM Think 2027
                      </button>
                    </div>
                  </div>
                  <div className={`w-full ${isOverviewVideoExpanded ? '' : 'max-w-sm md:justify-self-end'}`}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-[#4589ff]/35 bg-black shadow-[0_12px_32px_rgba(0,0,0,0.32)]">
                        <iframe
                          src="https://www.youtube.com/embed/CuxTmVCbG80"
                          title="IBM Business Automation video"
                          className="aspect-video w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOverviewVideoExpanded(expanded => !expanded)}
                        aria-pressed={isOverviewVideoExpanded}
                        aria-label={isOverviewVideoExpanded ? 'Compact video' : 'Fill section'}
                        title={isOverviewVideoExpanded ? 'Compact video' : 'Fill section'}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                          <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <a
                        href="https://youtu.be/CuxTmVCbG80"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open video in new tab"
                        title="Open video in new tab"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        <ExternalLinkIcon />
                      </a>
                      <a
                        href="https://ibm.biz/business-automation-playlist"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open Business Automation playlist"
                        title="Open Business Automation playlist"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                          <path d="M2.5 4h7M2.5 7h5M2.5 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          <path d="m9.5 8.5 4 2.5-4 2.5v-5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                        </svg>
                      </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section id="overview-capabilities" className="mt-6 scroll-mt-28" aria-labelledby="overview-capabilities-heading">
              <div className="flex items-start justify-between gap-4">
                <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">One integrated portfolio</p>
                <h3 id="overview-capabilities-heading" className="mt-1 text-2xl font-semibold text-white">Transform how work gets done</h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c6c6c6]">
                  Business Automation brings people, processes, content, decisions, and AI together so organizations can modernize at their own pace without losing control, trust, or visibility.
                </p>
                </div>
                <CopySectionLink id="overview-capabilities" label="Business Automation capabilities overview" />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {businessAutomationCapabilities.map(pillar => (
                  <article
                    key={pillar.title}
                    id={`overview-${pillar.page}`}
                    className="group relative scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626] p-6 text-left transition-all hover:-translate-y-0.5 hover:border-white/[0.16]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-0.5"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: pillar.color }}>
                        Capability
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#8d8d8d]">{pillar.number}</span>
                        <CopySectionLink id={`overview-${pillar.page}`} label={`${pillar.title} overview`} />
                      </div>
                    </div>
                    <h4 className="mt-7 text-xl font-semibold text-white">{pillar.title}</h4>
                    <p className="mt-3 text-sm leading-relaxed text-[#c6c6c6]">{pillar.description}</p>
                    <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                      {pillar.capabilities.map(capability => (
                        <li key={capability} className="flex items-center gap-2.5 text-xs text-[#c6c6c6]">
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pillar.color }} />
                          {capability}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => navigateToPage(pillar.page)}
                      className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#78a9ff] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]"
                    >
                      Explore {pillar.title}
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </button>
                  </article>
                ))}
                <article
                  id="overview-cp4ba"
                  className="group relative scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/30 bg-[linear-gradient(120deg,rgba(15,98,254,0.16),rgba(14,16,25,1)_42%)] p-6 text-left transition-all hover:-translate-y-0.5 hover:border-[#78a9ff]/55 lg:col-span-3 sm:p-7"
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[#4589ff]" />
                  <div className="absolute right-6 top-6 z-10 flex items-center gap-2 sm:right-7 sm:top-7">
                    <span className="font-mono text-xs text-[#8d8d8d]">04</span>
                    <CopySectionLink id="overview-cp4ba" label="Cloud Pak for Business Automation overview" />
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#78a9ff]/10 bg-[#0f62fe]/5"
                  />
                  <div className="relative grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <p className="pr-20 text-xs font-semibold uppercase tracking-[0.16em] text-[#78a9ff]">Integrated platform</p>
                      </div>
                      <h4 className="mt-5 text-2xl font-semibold text-white">Cloud Pak for Business Automation</h4>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                        Bring process, content, and decision capabilities together on one modular platform with shared services, enterprise governance, and built-in AI.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateToPage('cp4ba')}
                        className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#78a9ff] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]"
                      >
                        Explore Cloud Pak for Business Automation
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:pt-8">
                      {[
                        { label: 'Process Automation', color: '#3ddbd9' },
                        { label: 'Content Services', color: '#be95ff' },
                        { label: 'Decision Intelligence', color: '#f1c21b' },
                      ].map(item => (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-[#161616]/80 px-4 py-3 text-sm font-medium text-[#e0e0e0]"
                        >
                          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'Portfolio overview',
                  description: 'Explore every capability with its related products, previews, trials, and demos.',
                  page: 'capabilities' as Page,
                  action: 'Explore the portfolio',
                },
                {
                  label: 'Community',
                  description: `Connect with ${userConnectCommunities.length} Business Automation user communities.`,
                  page: 'community' as Page,
                  action: 'Find your community',
                },
                {
                  label: 'TechXchange 2026',
                  description: `Build your agenda across ${sessions.length} focused sessions in Atlanta.`,
                  page: 'techxchange' as Page,
                  action: 'Plan your experience',
                },
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigateToPage(item.page)}
                  className="group rounded-xl border border-white/[0.07] bg-[#161616] p-5 text-left transition-colors hover:border-[#4589ff]/45 hover:bg-[#0f62fe]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]"
                >
                  <h4 className="text-base font-semibold text-white">{item.label}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#c6c6c6]">{item.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#78a9ff] transition-colors group-hover:text-white">
                    {item.action}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : currentPage === 'badges' ? (
          <BadgesPage />

        ) : currentPage === 'lets-create' ? (
          <section id="lets-create-top" aria-labelledby="lets-create-heading" className="scroll-mt-28">
            {(() => {
              const visibleAssets = letsCreateAssets.filter(asset =>
                effectiveLetsCreateSections.has(asset.section) &&
                ((letsCreateCapabilities.size === 0 && letsCreateProducts.size === 0) ||
                  letsCreateCapabilities.has(asset.capability) ||
                  asset.products.some(product => letsCreateProducts.has(product))),
              )
              const handleCapabilityChange = (next: Set<string>) => {
                const added = [...next].filter(id => !letsCreateCapabilities.has(id))
                if (added.length > 0) {
                  setLetsCreateProducts(current => {
                    const merged = new Set(current)
                    added.forEach(id => letsCreateProductsByCapability.get(id)?.forEach(product => merged.add(product)))
                    return merged
                  })
                }
                setLetsCreateCapabilities(next)
              }
              const shownSections = letsCreateSections.filter(section => effectiveLetsCreateSections.has(section.id))
              return (
                <>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">IBM Data &amp; AI: Business Automation</p>
                      <h2 id="lets-create-heading" className="mt-1 text-2xl font-semibold text-white">Let&rsquo;s Create!</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                        Learn, demo, and build with Business Automation. Filter by section, capability, or product to find the right asset.
                      </p>
                    </div>
                    <CopySectionLink id="lets-create-top" label="Let's Create page" />
                  </div>

                  <section
                    id="lets-create-filters"
                    aria-labelledby="lets-create-filters-heading"
                    className="mb-6 scroll-mt-28 rounded-xl border border-[#4589ff]/30 bg-[#1c1c1c] p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <h3 id="lets-create-filters-heading" className="text-base font-semibold text-white">Sections, Capabilities and Products</h3>
                      <button
                        type="button"
                        onClick={() => setIsLetsCreateFiltersExpanded(expanded => !expanded)}
                        aria-expanded={isLetsCreateFiltersExpanded}
                        aria-controls="lets-create-filters-body"
                        aria-label={isLetsCreateFiltersExpanded ? 'Collapse Filters' : 'Expand Filters'}
                        title={isLetsCreateFiltersExpanded ? 'Collapse Filters' : 'Expand Filters'}
                        className="inline-flex h-7 items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#78a9ff] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                      >
                        Filter
                        <VideoVisibilityIcon visible={isLetsCreateFiltersExpanded} />
                      </button>
                      <span aria-live="polite" className="text-xs font-medium text-[#c6c6c6]">
                        Sections: {shownSections.length} of {letsCreateSections.length} · Assets: {visibleAssets.length} of {letsCreateAssets.length}
                      </span>
                      <span className="ml-auto"><CopySectionLink id="lets-create-filters" label="Let's Create filters" /></span>
                    </div>
                    <div id="lets-create-filters-body" hidden={!isLetsCreateFiltersExpanded} className="mt-4 grid gap-4 border-t border-white/[0.06] pt-4">
                      <CommunityFilterGroup
                        id="lets-create-section-filter"
                        title="Sections"
                        noun="assets"
                        options={letsCreateSections.map(section => ({ id: section.id, label: section.label }))}
                        selected={letsCreateVisibleSections}
                        onChange={setLetsCreateVisibleSections}
                      />
                      <CommunityFilterGroup
                        id="lets-create-capability-filter"
                        title="Capabilities"
                        noun="assets"
                        options={communityCapabilityOptions}
                        selected={letsCreateCapabilities}
                        onChange={handleCapabilityChange}
                        onOptionDoubleClick={id => {
                          const associated = letsCreateProductsByCapability.get(id) ?? []
                          setLetsCreateProducts(current => new Set([...current].filter(product => !associated.includes(product))))
                        }}
                      />
                      <CommunityFilterGroup
                        id="lets-create-product-filter"
                        title="Products"
                        noun="assets"
                        options={letsCreateProductOptions}
                        selected={letsCreateProducts}
                        onChange={setLetsCreateProducts}
                      />
                    </div>
                  </section>

                  {shownSections.length === 0 && (
                    <p className="rounded-xl border border-white/[0.07] bg-[#262626] px-5 py-6 text-center text-sm text-[#c6c6c6]">
                      No sections are selected.
                    </p>
                  )}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {shownSections.map((section, sectionIndex) => {
                      const sectionAssets = visibleAssets.filter(asset => asset.section === section.id)
                      const sectionId = `lets-create-${section.id}`
                      return (
                        <article
                          key={section.id}
                          id={sectionId}
                          aria-labelledby={`${sectionId}-heading`}
                          className="scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626]"
                        >
                          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
                            <div>
                              <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#8d8d8d]">
                                {String(sectionIndex + 1).padStart(2, '0')} / {String(shownSections.length).padStart(2, '0')}
                              </p>
                              <h3 id={`${sectionId}-heading`} className="mt-2 text-base font-semibold text-white">{section.label}</h3>
                              <p className="mt-1 text-xs leading-relaxed text-[#c6c6c6]">{section.description}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[10px] font-medium text-[#c6c6c6]">
                                {sectionAssets.length} {sectionAssets.length === 1 ? 'asset' : 'assets'}
                              </span>
                              <CopySectionLink id={sectionId} label={section.label} />
                            </div>
                          </div>
                          <div className="p-5">
                            {sectionAssets.length === 0 ? (
                              <p className="text-sm text-[#8d8d8d]">
                                {letsCreateAssets.some(asset => asset.section === section.id)
                                  ? 'No assets match the selected capabilities and products.'
                                  : 'No assets have been added yet.'}
                              </p>
                            ) : (
                              <ul className="grid gap-3">
                                {sectionAssets.map(asset => {
                                  const capability = businessAutomationCapabilityFilters.find(filter => filter.page === asset.capability)
                                  return (
                                    <li key={`${asset.section}-${asset.name}`} className="rounded-lg border border-white/[0.07] bg-[#161616] p-4">
                                      <div className="flex items-start justify-between gap-3">
                                        <h4 className="text-sm font-semibold text-white">{asset.name}</h4>
                                        {asset.page ? (
                                          <a
                                            href={asset.url}
                                            onClick={event => {
                                              event.preventDefault()
                                              navigateToPage(asset.page!)
                                            }}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#4589ff]/35 bg-[#0f62fe]/10 px-2.5 py-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/25 hover:text-white"
                                          >
                                            View
                                            <span aria-hidden="true">&rarr;</span>
                                          </a>
                                        ) : (
                                          <a
                                            href={asset.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#4589ff]/35 bg-[#0f62fe]/10 px-2.5 py-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/25 hover:text-white"
                                          >
                                            Open
                                            <ExternalLinkIcon />
                                          </a>
                                        )}
                                      </div>
                                      <p className="mt-2 text-xs leading-relaxed text-[#c6c6c6]">{asset.description}</p>
                                      <div className="mt-3 flex flex-wrap gap-1.5">
                                        {capability && (
                                          <span
                                            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold text-white"
                                            style={{ borderColor: `${capability.color}bb`, backgroundColor: `${capability.color}20` }}
                                          >
                                            {capability.label}
                                          </span>
                                        )}
                                        {asset.products.map(product => (
                                          <span key={product} className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-[#c6c6c6]">
                                            {product}
                                          </span>
                                        ))}
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </section>

        ) : currentPage === 'onboarding-automation' ? (
          <section id="onboarding-automation-top" aria-labelledby="onboarding-automation-heading" className="scroll-mt-28">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 id="onboarding-automation-heading" className="text-2xl font-semibold text-white">Onboarding Automation</h2>
                  <OnboardingPageCycleButton collapsed={onboardingCollapsed} onCycle={cycleOnboardingPage} />
                </div>
                <p className="mt-1 text-sm font-semibold text-[#c6c6c6]">{onboardingAutomationTagline}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#c6c6c6]">
                  Content and document services demo: help Lucy, an HR onboarding specialist at Focus Corp, review applicant John Doe&rsquo;s materials in a secure teamspace and launch the onboarding process.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {(() => {
                    const capability = businessAutomationCapabilityFilters.find(filter => filter.page === 'content-services')
                    return capability ? (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ borderColor: `${capability.color}bb`, backgroundColor: `${capability.color}20` }}
                      >
                        {capability.label}
                      </span>
                    ) : null
                  })()}
                  <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-[#c6c6c6]">
                    IBM FileNet Content Manager
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-3">
                <CopySectionLink id="onboarding-automation-top" label="Onboarding Automation page" />
                <a
                  href={onboardingAutomationSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#4589ff]/35 bg-[#0f62fe]/10 px-2.5 py-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/25 hover:text-white"
                >
                  View original lab
                  <ExternalLinkIcon />
                </a>
              </div>
            </div>

            <OnboardingAutomationContents
              contentsCollapsed={onboardingContentsCollapsed}
              setContentsCollapsed={setOnboardingContentsCollapsed}
            />

            <OnboardingAutomationSections collapsed={onboardingCollapsed} setCollapsed={setOnboardingCollapsed} />
          </section>

        ) : currentPage === 'capabilities' ? (
          <>
          {renderCapabilityFilters()}
          <section id="capabilities-all" aria-labelledby="capabilities-all-heading" className="scroll-mt-28">
            <span id="product-top" className="sr-only" aria-hidden="true" />
            <span id="product-info" className="sr-only" aria-hidden="true" />
            <span id="new-ai-capabilities" className="sr-only" aria-hidden="true" />
            <span id="product-previews" className="sr-only" aria-hidden="true" />
            <span id="product-demos" className="sr-only" aria-hidden="true" />
            <div className="rounded-xl border border-white/[0.07] bg-[#262626] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Portfolio Overview</p>
                  <h2 id="capabilities-all-heading" className="mt-1 text-2xl font-semibold text-white">
                    <button
                      type="button"
                      onClick={() => setIsCapabilityOverviewExpanded(expanded => !expanded)}
                      aria-expanded={isCapabilityOverviewExpanded}
                      aria-controls="capability-overview-subsections"
                      aria-label={isCapabilityOverviewExpanded ? 'Collapse Overview' : 'Expand Overview'}
                      title={isCapabilityOverviewExpanded ? 'Collapse overview' : 'Expand overview'}
                      className="inline-flex max-w-full items-center gap-3 overflow-x-auto whitespace-nowrap rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-[#a6c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                    >
                      <span>Capabilities</span>
                      <span className="inline-flex items-center gap-1.5">
                        {businessAutomationCapabilityFilters.filter(filter => selectedCapabilityPages.has(filter.page)).map(filter => (
                          <span
                            key={filter.page}
                            className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                            style={{
                              borderColor: `${filter.color}66`,
                              backgroundColor: `${filter.color}18`,
                              color: filter.color,
                            }}
                          >
                            {filter.label}
                          </span>
                        ))}
                        {selectedCapabilityPages.size === 0 && (
                          <span className="text-xs font-normal text-[#8d8d8d]">None</span>
                        )}
                      </span>
                      <span className="text-xs font-medium text-[#c6c6c6]">{selectedCapabilityPages.size} selected</span>
                      <span className="inline-flex shrink-0 items-center justify-center text-[#c6c6c6]">
                        <VideoVisibilityIcon visible={isCapabilityOverviewExpanded} />
                      </span>
                    </button>
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c6c6c6]">
                    Select or deselect capabilities above to compare them. Choosing another capability keeps your existing selections active.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <CopySectionLink id="capabilities-all" label="Business Automation portfolio overview" />
                  <BackToCapabilityTopButton onBackToTop={collapseCapabilitySubsections} />
                </div>
              </div>

              <div id="capability-overview-subsections" className="mt-6">
              <div hidden={!isCapabilityOverviewExpanded} className="space-y-5">
                {businessAutomationCapabilities.filter(capability => selectedCapabilityPages.has(capability.page)).map(capability => (
                <article
                  key={capability.page}
                  id={`capabilities-all-${capability.page}`}
                  className="relative scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626]"
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: capability.color }} />
                  <div className="absolute right-3 top-3 z-10">
                    <CopySectionLink id={`capabilities-all-${capability.page}`} label={`${capability.title} overview`} />
                  </div>
                  <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#8d8d8d]">{capability.number}</span>
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold text-white">{capability.title}</h3>
                      <p className="mt-1 text-sm font-medium text-[#e0e0e0]">{capability.tagline}</p>
                      <p className="mt-4 text-sm leading-relaxed text-[#c6c6c6]">{capability.overview}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="rounded-lg border border-white/[0.06] bg-[#161616] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff]">Core capabilities</p>
                        <ul className="mt-3 space-y-2">
                          {capability.capabilities.map(item => (
                            <li key={item} className="flex gap-2.5 text-xs text-[#c6c6c6]">
                              <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: capability.color }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] bg-[#161616] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff]">Products and solutions</p>
                        <ul className="mt-3 space-y-2">
                          {capability.products.map(product => (
                            <li key={product} className="text-xs leading-relaxed text-[#c6c6c6]">{product}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
                ))}

                {selectedCapabilityPages.has('cp4ba') && <article id="capabilities-all-cp4ba" className="relative scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/25 bg-[#262626]">
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[#4589ff]" />
                <div className="absolute right-3 top-3 z-10">
                  <CopySectionLink id="capabilities-all-cp4ba" label="Cloud Pak for Business Automation overview" />
                </div>
                <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#8d8d8d]">04</span>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4589ff]">Integrated platform</p>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-white">Cloud Pak for Business Automation</h3>
                    <p className="mt-1 text-sm font-medium text-[#e0e0e0]">One modular platform for intelligent automation</p>
                    <p className="mt-4 text-sm leading-relaxed text-[#c6c6c6]">
                      Bring content, process, and decision capabilities together with generative and agentic AI, shared platform services, and enterprise governance.
                    </p>
                  </div>
                  <a
                    href={asset('cp4ba-overview.svg')}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border border-white/[0.1] bg-white transition-opacity hover:opacity-95"
                    aria-label="Open the CP4BA platform graphic"
                  >
                    <img
                      src={asset('cp4ba-overview.svg')}
                      alt="IBM Cloud Pak for Business Automation platform overview"
                      className="h-full min-h-52 w-full object-contain"
                    />
                  </a>
                </div>
                </article>}
                {selectedCapabilityPages.size === 0 && (
                <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#262626] px-6 py-10 text-center">
                  <p className="text-base font-semibold text-white">No capabilities selected</p>
                  <p className="mt-2 text-sm text-[#c6c6c6]">
                    Select one or more capabilities above, or use Show all to restore the complete portfolio.
                  </p>
                </div>
                )}
              </div>
              {!isCapabilityOverviewExpanded && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {businessAutomationCapabilities.filter(capability => selectedCapabilityPages.has(capability.page)).map(capability => (
                    <article
                      key={capability.page}
                      className="relative overflow-hidden rounded-lg border border-white/[0.07] bg-[#161616] px-4 py-3"
                    >
                      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5" style={{ backgroundColor: capability.color }} />
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">{capability.title}</h3>
                        <span className="font-mono text-[10px] text-[#8d8d8d]">{capability.number}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#c6c6c6]">{capability.tagline}</p>
                    </article>
                  ))}
                  {selectedCapabilityPages.has('cp4ba') && (
                    <article className="relative overflow-hidden rounded-lg border border-[#4589ff]/25 bg-[#161616] px-4 py-3">
                      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-[#4589ff]" />
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">CP4BA</h3>
                        <span className="font-mono text-[10px] text-[#8d8d8d]">04</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#c6c6c6]">One modular platform for intelligent automation</p>
                    </article>
                  )}
                  {selectedCapabilityPages.size === 0 && (
                    <p className="rounded-lg border border-dashed border-white/[0.12] bg-[#161616] px-4 py-3 text-xs text-[#c6c6c6] sm:col-span-2 lg:col-span-4">
                      No capabilities selected.
                    </p>
                  )}
                </div>
              )}
              </div>
            </div>

            {selectedCapabilityPages.size > 1 && renderCombinedPortfolioProductResources()}
          </section>
          </>
        ) : activeBusinessAutomationCapability ? (
          <>
          {renderCapabilityFilters()}
          <section
            id={pageAnchors[activeBusinessAutomationCapability.page]}
            aria-labelledby={`${activeBusinessAutomationCapability.page}-heading`}
            role="tabpanel"
            className="scroll-mt-28"
          >
            <span id={`${activeBusinessAutomationCapability.page}-top`} className="sr-only" aria-hidden="true" />
            <div
              className="rounded-xl border bg-[#161616] p-5 sm:p-6"
              style={{ borderColor: `${activeBusinessAutomationCapability.color}44` }}
            >
            <div
              className="relative overflow-hidden rounded-2xl border bg-[#262626]"
              style={{ borderColor: `${activeBusinessAutomationCapability.color}55` }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(circle at 88% 18%, ${activeBusinessAutomationCapability.color}, transparent 36%)`,
                }}
              />
              <div className="relative px-6 py-10 sm:px-10 sm:py-12">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#8d8d8d]">{activeBusinessAutomationCapability.number} / 03</span>
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.18em]"
                        style={{ color: activeBusinessAutomationCapability.color }}
                      >
                        Business Automation foundation
                      </p>
                    </div>
                    <h2
                      id={`${activeBusinessAutomationCapability.page}-heading`}
                      className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl"
                    >
                      {activeBusinessAutomationCapability.title}
                    </h2>
                    <p className="mt-3 text-xl font-medium text-[#e0e0e0]">{activeBusinessAutomationCapability.tagline}</p>
                  </div>
                  <CopySectionLink
                    id={pageAnchors[activeBusinessAutomationCapability.page]}
                    label={`${activeBusinessAutomationCapability.title} page`}
                  />
                </div>
                <p className="mt-6 max-w-3xl text-base leading-relaxed text-[#c6c6c6]">
                  {activeBusinessAutomationCapability.overview}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById(`${activeBusinessAutomationCapability.page}-product-resources`)?.scrollIntoView({ behavior: 'smooth' })}
                    className="rounded-lg bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    Jump to product resources
                  </button>
                </div>
              </div>
            </div>

            <div id={`${activeBusinessAutomationCapability.page}-outcomes`} className="mt-8 scroll-mt-28">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Business outcomes</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">Create measurable impact</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {activeBusinessAutomationCapability.outcomes.map((outcome, index) => (
                  <article key={outcome.title} className="rounded-xl border border-white/[0.07] bg-[#262626] p-5">
                    <span className="font-mono text-xs" style={{ color: activeBusinessAutomationCapability.color }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h4 className="mt-4 text-lg font-semibold text-white">{outcome.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-[#c6c6c6]">{outcome.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section
                id={`${activeBusinessAutomationCapability.page}-capabilities`}
                className="scroll-mt-28 rounded-xl border border-white/[0.07] bg-[#262626] p-6"
                aria-labelledby={`${activeBusinessAutomationCapability.page}-capabilities-heading`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: activeBusinessAutomationCapability.color }}>
                    Core capabilities
                  </p>
                  <CopySectionLink id={`${activeBusinessAutomationCapability.page}-capabilities`} label={`${activeBusinessAutomationCapability.title} capabilities`} />
                </div>
                <h3 id={`${activeBusinessAutomationCapability.page}-capabilities-heading`} className="mt-1 text-xl font-semibold text-white">
                  What it enables
                </h3>
                <ul className="mt-5 space-y-3">
                  {activeBusinessAutomationCapability.capabilities.map(capability => (
                    <li key={capability} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#e0e0e0]">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: activeBusinessAutomationCapability.color }} />
                      {capability}
                    </li>
                  ))}
                </ul>
              </section>
              <section
                id={`${activeBusinessAutomationCapability.page}-products`}
                className="scroll-mt-28 rounded-xl border border-white/[0.07] bg-[#262626] p-6"
                aria-labelledby={`${activeBusinessAutomationCapability.page}-products-heading`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">IBM portfolio</p>
                  <CopySectionLink id={`${activeBusinessAutomationCapability.page}-products`} label={`${activeBusinessAutomationCapability.title} products`} />
                </div>
                <h3 id={`${activeBusinessAutomationCapability.page}-products-heading`} className="mt-1 text-xl font-semibold text-white">
                  Products and solutions
                </h3>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {activeBusinessAutomationCapability.products.map(product => (
                    <div key={product} className="flex min-h-14 items-center rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm text-[#e0e0e0]">
                      {product}
                    </div>
                  ))}
                </div>
              </section>
            </div>
            </div>

            {renderCapabilityProductResources(activeBusinessAutomationCapability.page)}

            <div className="mt-8 flex flex-col justify-between gap-4 rounded-xl border border-[#4589ff]/25 bg-[#0f62fe]/10 px-6 py-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-white">Explore the complete Business Automation portfolio</p>
                <p className="mt-1 text-xs text-[#c6c6c6]">See how all three foundations work together across your enterprise.</p>
              </div>
              <button
                type="button"
                onClick={() => navigateToPage('overview')}
                className="shrink-0 rounded-lg border border-[#4589ff]/45 bg-[#0f62fe]/15 px-4 py-2.5 text-sm font-semibold text-[#a6c8ff] transition-colors hover:bg-[#0f62fe]/30 hover:text-white"
              >
                Back to overview
              </button>
            </div>
          </section>
          </>
        ) : currentPage === 'cp4ba' ? (
          <>
          {renderCapabilityFilters()}
          <section id={pageAnchors.cp4ba} aria-labelledby="cp4ba-heading" role="tabpanel" className="scroll-mt-28">
            <span id="cp4ba-top" className="sr-only" aria-hidden="true" />
            <div className="rounded-xl border border-[#4589ff]/30 bg-[#161616] p-5 sm:p-6">
            <div className="relative overflow-hidden rounded-2xl border border-[#4589ff]/30 bg-[#262626]">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_86%_14%,rgba(15,98,254,0.38),transparent_34%),radial-gradient(circle_at_8%_100%,rgba(190,149,255,0.12),transparent_38%)]"
              />
              <div aria-hidden="true" className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-[#78a9ff]/15" />
              <div className="relative px-6 py-10 sm:px-10 sm:py-14">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#78a9ff]">IBM Cloud Pak for Business Automation</p>
                    <h2 id="cp4ba-heading" className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.06] text-white sm:text-6xl">
                      Automate work. Activate intelligence.
                    </h2>
                  </div>
                  <CopySectionLink id={pageAnchors.cp4ba} label="CP4BA capability" />
                </div>
                <p className="mt-6 max-w-3xl text-base leading-relaxed text-[#c6c6c6] sm:text-lg">
                  A modular platform for building and running AI-powered business automation across content, processes, and decisions—designed to help organizations improve productivity, respond faster, and govern work at enterprise scale.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="https://www.ibm.com/products/cloud-pak-for-business-automation"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    Explore CP4BA
                    <ExternalLinkIcon />
                  </a>
                  <a
                    href="https://www.ibm.com/docs/en/cloud-paks/cp-biz-automation"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/[0.14] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    Product documentation
                    <ExternalLinkIcon />
                  </a>
                </div>
              </div>
              <div className="relative grid border-t border-white/[0.07] bg-black/10 sm:grid-cols-3">
                {[
                  { value: 'Content', label: 'activate trusted information' },
                  { value: 'Process', label: 'orchestrate end-to-end work' },
                  { value: 'Decisions', label: 'automate with confidence' },
                ].map((item, index) => (
                  <div
                    key={item.value}
                    className={`px-6 py-5 sm:px-8 ${index > 0 ? 'border-t border-white/[0.07] sm:border-l sm:border-t-0' : ''}`}
                  >
                    <p className="text-base font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-[#c6c6c6]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="cp4ba-platform-overview" className="mt-8 scroll-mt-28">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Platform overview</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">One platform for intelligent automation</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c6c6c6]">
                    CP4BA brings specialized automation capabilities together with generative and agentic AI, shared platform services, and enterprise governance.
                  </p>
                </div>
                <CopySectionLink id="cp4ba-architecture" label="CP4BA architecture graphic" />
              </div>
              <figure
                id="cp4ba-architecture"
                className="mt-5 scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/35 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
              >
                <a
                  href={asset('cp4ba-overview.svg')}
                  target="_blank"
                  rel="noreferrer"
                  className="block transition-opacity hover:opacity-95"
                  aria-label="Open the full-resolution IBM Cloud Pak for Business Automation platform graphic"
                >
                  <img
                    src={asset('cp4ba-overview.svg')}
                    alt="IBM Cloud Pak for Business Automation platform diagram showing generative and agentic AI across content, process, and decisions with shared modular platform services"
                    className="h-auto w-full"
                  />
                </a>
                <figcaption className="border-t border-black/10 bg-[#f4f4f4] px-5 py-3 text-xs leading-relaxed text-[#525252]">
                  IBM Cloud Pak for Business Automation unifies content, process, and decision capabilities on a modular platform with shared services and built-in governance.
                </figcaption>
              </figure>
            </div>

            <div id="cp4ba-domains" className="mt-8 scroll-mt-28">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Core automation domains</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">Build around the work that matters</h3>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {[
                  {
                    number: '01',
                    title: 'Content',
                    description: 'Capture, classify, govern, and activate business content so people, workflows, and AI can use trusted information.',
                    items: ['Content management', 'Document processing', 'Records and governance'],
                    color: '#3ddbd9',
                  },
                  {
                    number: '02',
                    title: 'Process',
                    description: 'Model and orchestrate workflows, cases, and tasks that coordinate teams, applications, data, and AI agents.',
                    items: ['Workflow automation', 'Case management', 'Process visibility'],
                    color: '#be95ff',
                  },
                  {
                    number: '03',
                    title: 'Decisions',
                    description: 'Externalize and automate business decisions with transparent rules, optimization, and governed intelligence.',
                    items: ['Business rules', 'Decision services', 'AI-powered decisions'],
                    color: '#f1c21b',
                  },
                ].map(domain => (
                  <article key={domain.title} className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626] p-6">
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: domain.color }} />
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: domain.color }}>Domain</p>
                      <span className="font-mono text-xs text-[#8d8d8d]">{domain.number}</span>
                    </div>
                    <h4 className="mt-7 text-xl font-semibold text-white">{domain.title}</h4>
                    <p className="mt-3 text-sm leading-relaxed text-[#c6c6c6]">{domain.description}</p>
                    <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                      {domain.items.map(item => (
                        <li key={item} className="flex items-center gap-2.5 text-xs text-[#c6c6c6]">
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: domain.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section id="cp4ba-foundation" className="scroll-mt-28 rounded-xl border border-white/[0.07] bg-[#262626] p-6 sm:p-7" aria-labelledby="cp4ba-foundation-heading">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78a9ff]">Platform foundation</p>
                  <CopySectionLink id="cp4ba-foundation" label="CP4BA platform foundation" />
                </div>
                <h3 id="cp4ba-foundation-heading" className="mt-1 text-xl font-semibold text-white">Designed for enterprise scale</h3>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    'Modular capabilities',
                    'Shared platform services',
                    'Built-in AI',
                    'Security and governance',
                    'Operational observability',
                    'Hybrid cloud deployment',
                  ].map(item => (
                    <div key={item} className="flex min-h-14 items-center gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm text-[#e0e0e0]">
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4589ff]" />
                      {item}
                    </div>
                  ))}
                </div>
              </section>
              <section id="cp4ba-value" className="scroll-mt-28 flex flex-col justify-between rounded-xl border border-[#3ddbd9]/20 bg-gradient-to-br from-[#0b2426] to-[#262626] p-6 sm:p-7" aria-labelledby="cp4ba-value-heading">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3ddbd9]">Business value</p>
                    <CopySectionLink id="cp4ba-value" label="CP4BA business value" />
                  </div>
                  <h3 id="cp4ba-value-heading" className="mt-1 text-xl font-semibold text-white">Modernize at your own pace</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#c6c6c6]">
                    Start with the capability that addresses your highest-value work, then extend across the platform as your automation program grows.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {[
                      'Increase employee productivity',
                      'Reduce manual work and cycle time',
                      'Improve consistency and compliance',
                      'Scale automation across business units',
                    ].map(item => (
                      <li key={item} className="flex gap-3 text-sm text-[#e0e0e0]">
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3ddbd9]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('cp4ba-product-resources')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-8 rounded-lg border border-[#3ddbd9]/40 bg-[#3ddbd9]/10 px-4 py-3 text-sm font-semibold text-[#a2f6f4] transition-colors hover:bg-[#3ddbd9]/20 hover:text-white"
                >
                  Jump to product resources
                </button>
              </section>
            </div>
            </div>

            {renderCapabilityProductResources('cp4ba')}
          </section>
          </>
        ) : currentPage === 'conference' ? (
          <section id="conference-top" aria-labelledby="conference-heading" className="scroll-mt-28">
            <div className="relative overflow-hidden rounded-2xl border border-[#4589ff]/25 bg-[#262626]">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_86%_16%,rgba(15,98,254,0.34),transparent_34%),radial-gradient(circle_at_8%_100%,rgba(190,149,255,0.12),transparent_36%)]"
              />
              <div aria-hidden="true" className="absolute -right-14 -top-16 h-64 w-64 rounded-full border border-[#78a9ff]/15" />
              <div className="relative px-6 py-10 sm:px-10 sm:py-14">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#78a9ff]">IBM conferences and events</p>
                    <h2 id="conference-heading" className="mt-3 w-full whitespace-nowrap text-[clamp(0.8rem,4.3vw,3.25rem)] font-semibold leading-[1.06] tracking-tight text-white">
                      Learn. Connect. Build what’s next.
                    </h2>
                  </div>
                  <CopySectionLink id="conference-top" label="Conference page" />
                </div>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#c6c6c6] sm:text-lg">
                  Explore IBM conference experiences, technical sessions, community programs, and the practical resources you need to make the most of every event.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigateToPage('think')}
                    className="rounded-lg bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    Explore IBM Think
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateToPage('techxchange')}
                    className="rounded-lg border border-white/[0.14] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    Explore TechXchange
                  </button>
                </div>
              </div>
              <div className="relative grid border-t border-white/[0.07] bg-black/10 sm:grid-cols-3">
                {[
                  { label: 'Featured event', value: 'IBM Think' },
                  { label: 'Dates', value: 'June 7-10, 2027' },
                  { label: 'Location', value: 'Boston, MA' },
                ].map((detail, index) => (
                  <div
                    key={detail.label}
                    className={`px-6 py-5 sm:px-8 ${index > 0 ? 'border-t border-white/[0.07] sm:border-l sm:border-t-0' : ''}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d8d8d]">{detail.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <section
              id="conference-think"
              aria-labelledby="conference-think-heading"
              className="mt-8 scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/30 bg-[linear-gradient(125deg,rgba(15,98,254,0.18),rgba(14,16,25,1)_48%)]"
            >
              <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78a9ff]">Featured conference</p>
                    <CopySectionLink id="conference-think" label="IBM Think featured conference" />
                  </div>
                  <h3 id="conference-think-heading" className="mt-2 text-3xl font-semibold text-white">IBM Think</h3>
                  <p className="mt-2 text-sm font-semibold text-[#a6c8ff]">June 7-10, 2027 <span className="mx-2 text-white/30">|</span> Boston, MA</p>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    IBM’s flagship conference brings business and technology leaders together to explore how AI, hybrid cloud, automation, data, and quantum computing turn ambition into impact.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateToPage('think')}
                  className="shrink-0 rounded-lg bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  Explore IBM Think
                </button>
              </div>
            </section>

            <section
              id="conference-techxchange"
              aria-labelledby="conference-techxchange-heading"
              className="mt-8 scroll-mt-28 rounded-2xl border border-white/[0.1] bg-[#262626] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.2)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6c6c6]">Past conference</p>
                  <h3 id="conference-techxchange-heading" className="mt-1 text-2xl font-semibold text-white">
                    <button
                      type="button"
                      onClick={() => setIsConferenceTechxchangeExpanded(expanded => !expanded)}
                      aria-expanded={isConferenceTechxchangeExpanded}
                      aria-controls="conference-techxchange-details"
                      title={`${isConferenceTechxchangeExpanded ? 'Collapse' : 'Expand'} IBM TechXchange 2026`}
                      className="inline-flex max-w-full items-center gap-3 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-[#a6c8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                    >
                      <span>IBM TechXchange 2026</span>
                      <ChevronIcon expanded={isConferenceTechxchangeExpanded} />
                    </button>
                  </h3>
                </div>
                <CopySectionLink id="conference-techxchange" label="IBM TechXchange 2026 past conference" />
              </div>
              <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-[#a6c8ff]">October 26-29, 2026 <span className="mx-2 text-white/30">|</span> Atlanta, Georgia</p>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c6c6c6]">
                    Four days of technical learning, hands-on experiences, product expertise, and community for the builders shaping enterprise technology.
                  </p>
                </div>
                <a
                  href="http://ibm.biz/techxchange"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  Explore IBM TechXchange
                  <ExternalLinkIcon />
                </a>
              </div>
              <div id="conference-techxchange-details" hidden={!isConferenceTechxchangeExpanded}>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    page: 'techxchange' as Page,
                    number: '01',
                    title: 'TechXchange',
                    description: 'Start with the event overview, dates, venue, and planning resources.',
                    action: 'Open event hub',
                    color: '#4589ff',
                  },
                  {
                    page: 'schedule' as Page,
                    number: '02',
                    title: 'Schedule',
                    description: 'Browse general sessions and the Business Automation agenda by day.',
                    action: 'Build your agenda',
                    color: '#3ddbd9',
                  },
                  {
                    page: 'maps' as Page,
                    number: '03',
                    title: 'Maps',
                    description: 'Navigate the GWCC, Sandbox neighborhoods, stages, and meeting spaces.',
                    action: 'Find your way',
                    color: '#be95ff',
                  },
                  {
                    page: 'info' as Page,
                    number: '04',
                    title: 'Event information',
                    description: 'Prepare for labs, networking, transportation, accessibility, and support.',
                    action: 'Get prepared',
                    color: '#f1c21b',
                  },
                ].map(item => (
                  <button
                    key={item.number}
                    type="button"
                    onClick={() => navigateToPage(item.page)}
                    className="group relative min-h-56 overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]"
                  >
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: item.color }} />
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#8d8d8d]">{item.number}</span>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    </div>
                    <h4 className="mt-8 text-lg font-semibold text-white">{item.title}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-[#c6c6c6]">{item.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#78a9ff] transition-colors group-hover:text-white">
                      {item.action}
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-col justify-between gap-5 rounded-xl border border-[#3ddbd9]/20 bg-gradient-to-r from-[#0b2426] to-[#262626] px-6 py-7 sm:flex-row sm:items-center sm:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3ddbd9]">Business Automation at TechXchange</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{sessions.length} sessions across four days</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    Explore agentic process automation, content services, and decision intelligence through labs, breakouts, meetups, and expert conversations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateToPage('sessions')}
                  className="shrink-0 rounded-lg border border-[#3ddbd9]/40 bg-[#3ddbd9]/10 px-4 py-2.5 text-sm font-semibold text-[#a2f6f4] transition-colors hover:bg-[#3ddbd9]/20 hover:text-white"
                >
                  View TechXchange overview
                </button>
              </div>
              </div>
            </section>
          </section>
        ) : currentPage === 'think' ? (
          <section id="think-top" aria-labelledby="think-heading" className="scroll-mt-28">
            <div className="relative min-h-[440px] overflow-hidden rounded-2xl border border-[#4589ff]/25 bg-[#262626]">
              <img
                src={asset('ibm-think-hero.jpg')}
                alt="Think wordmark with blue, violet, and pink light"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#161616] via-[#161616]/90 to-[#161616]/30" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent" />
              <div className="relative flex min-h-[440px] max-w-3xl flex-col justify-end px-6 py-7 sm:px-10 sm:py-8">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#78a9ff]">IBM’s flagship conference</p>
                  <CopySectionLink id="think-top" label="Think page" />
                </div>
                <h2 id="think-heading" className="mt-3 text-5xl font-semibold leading-none text-white sm:text-6xl">Think</h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#a6c8ff]">
                  June 7-10, 2027 <span className="mx-2 text-white/35">|</span> Boston, MA
                </p>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#e0e0e0] sm:text-lg">
                  Where business and technology leaders come together to explore how AI, hybrid cloud, automation, data, and quantum computing can turn ambition into impact.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="https://www.ibm.com/events/think"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    Visit the official Think site
                    <ExternalLinkIcon />
                  </a>
                  <button
                    type="button"
                    onClick={() => navigateToPage('conference')}
                    className="rounded-lg border border-white/[0.2] bg-black/30 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-[#78a9ff]/60 hover:bg-[#0f62fe]/20"
                  >
                    All conferences
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Why Think</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">Ideas that move business forward</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c6c6c6]">
                Think combines strategic perspective with real technology, bringing together industry leaders, IBM experts, clients, and partners to examine what is possible now and what comes next.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    number: '01',
                    title: 'Visionary keynotes',
                    description: 'Hear how leaders are applying technology to transform industries and create new opportunities.',
                    color: '#4589ff',
                  },
                  {
                    number: '02',
                    title: 'Technology in action',
                    description: 'See practical applications of enterprise AI, automation, hybrid cloud, data, and infrastructure.',
                    color: '#3ddbd9',
                  },
                  {
                    number: '03',
                    title: 'Executive exchange',
                    description: 'Connect with peers and experts navigating the same strategic and operational challenges.',
                    color: '#be95ff',
                  },
                  {
                    number: '04',
                    title: 'What comes next',
                    description: 'Explore emerging capabilities, from agentic AI to quantum-centric supercomputing.',
                    color: '#f1c21b',
                  },
                ].map(item => (
                  <article key={item.number} className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626] p-4">
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: item.color }} />
                    <span className="font-mono text-xs text-[#8d8d8d]">{item.number}</span>
                    <h4 className="mt-4 text-lg font-semibold text-white">{item.title}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-[#c6c6c6]">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <section id="think-topics" className="scroll-mt-28 rounded-xl border border-white/[0.07] bg-[#262626] p-5 sm:p-6" aria-labelledby="think-topics-heading">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78a9ff]">Explore the agenda</p>
                  <CopySectionLink id="think-topics" label="Think agenda topics" />
                </div>
                <h3 id="think-topics-heading" className="mt-1 text-xl font-semibold text-white">The technologies shaping enterprise</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    'Artificial intelligence',
                    'Hybrid cloud',
                    'Automation',
                    'Data and analytics',
                    'Cybersecurity',
                    'Infrastructure',
                    'Quantum computing',
                    'Responsible innovation',
                  ].map(topic => (
                    <div key={topic} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm text-[#e0e0e0]">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#4589ff]" />
                      {topic}
                    </div>
                  ))}
                </div>
              </section>
              <section id="think-audience" className="scroll-mt-28 flex flex-col justify-between rounded-xl border border-[#3ddbd9]/20 bg-gradient-to-br from-[#0b2426] to-[#262626] p-5 sm:p-6" aria-labelledby="think-audience-heading">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3ddbd9]">Built for leaders</p>
                    <CopySectionLink id="think-audience" label="Think audience" />
                  </div>
                  <h3 id="think-audience-heading" className="mt-1 text-xl font-semibold text-white">Turn insight into action</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#c6c6c6]">
                    Think is designed for executives, technology leaders, architects, innovators, and partners working to scale trusted transformation across their organizations.
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {['Develop a clearer technology strategy', 'Learn from real client transformation', 'Connect with IBM experts and peers'].map(item => (
                      <li key={item} className="flex gap-3 text-sm text-[#e0e0e0]">
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3ddbd9]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="https://www.ibm.com/events/think"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-[#3ddbd9]/40 bg-[#3ddbd9]/10 px-4 py-3 text-sm font-semibold text-[#a2f6f4] transition-colors hover:bg-[#3ddbd9]/20 hover:text-white"
                >
                  Explore IBM Think
                  <ExternalLinkIcon />
                </a>
              </section>
            </div>
          </section>
        ) : currentPage === 'techxchange' ? (
          <section id="techxchange-top" aria-labelledby="techxchange-heading" className="scroll-mt-28">
            <div className="relative overflow-hidden rounded-2xl border border-[#4589ff]/25 bg-[#262626]">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(15,98,254,0.34),transparent_34%),radial-gradient(circle_at_10%_95%,rgba(61,219,217,0.12),transparent_32%)]"
              />
              <div
                aria-hidden="true"
                className="absolute right-[-4rem] top-[-5rem] h-72 w-72 rounded-full border border-[#78a9ff]/15"
              />
              <div
                aria-hidden="true"
                className="absolute right-[-1rem] top-[-2rem] h-48 w-48 rounded-full border border-[#78a9ff]/20"
              />
              <div className="relative px-6 py-10 sm:px-10 sm:py-14">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#78a9ff]">IBM TechXchange 2026</p>
                    <h2 id="techxchange-heading" className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] text-white sm:text-6xl">
                      Build with purpose.
                    </h2>
                  </div>
                  <CopySectionLink id="techxchange-top" label="TechXchange page" />
                </div>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#c6c6c6] sm:text-lg">
                  Connect with the builders, experts, and technology shaping the next era of enterprise AI and automation.
                  Explore four days of technical learning, hands-on experiences, and community in Atlanta.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigateToPage('sessions')}
                    className="rounded-lg bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    Business Automation
                  </button>
                  <a
                    href="https://www.ibm.com/events/techxchange"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/[0.14] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                  >
                    Official event site
                    <ExternalLinkIcon />
                  </a>
                </div>
              </div>
              <div className="relative grid border-t border-white/[0.07] bg-black/10 sm:grid-cols-3">
                {[
                  { label: 'When', value: 'October 26–29, 2026' },
                  { label: 'Where', value: 'Atlanta, Georgia' },
                  { label: 'Venue', value: 'Georgia World Congress Center' },
                ].map((detail, index) => (
                  <div
                    key={detail.label}
                    className={`px-6 py-5 sm:px-8 ${index > 0 ? 'border-t border-white/[0.07] sm:border-l sm:border-t-0' : ''}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d8d8d]">{detail.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <section
              id="techxchange-recap"
              aria-labelledby="techxchange-recap-heading"
              className="mt-8 scroll-mt-28 overflow-hidden rounded-xl border border-[#3ddbd9]/30 bg-gradient-to-br from-[#0b2426] via-[#262626] to-[#262626]"
            >
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3ddbd9]">Relive the event</p>
                  <h3 id="techxchange-recap-heading" className="mt-1 text-2xl font-semibold text-white">TechXchange 2026 recap</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    Revisit the moments, announcements, and resources that defined TechXchange 2026.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href="https://ibm.biz/techxchange2026recap"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#3ddbd9]/40 bg-[#3ddbd9]/10 px-4 py-2.5 text-sm font-semibold text-[#a2f6f4] transition-colors hover:border-[#3ddbd9]/70 hover:bg-[#3ddbd9]/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ddbd9]/60"
                  >
                    Open recap
                    <ExternalLinkIcon />
                  </a>
                  <CopySectionLink id="techxchange-recap" label="TechXchange 2026 recap" />
                </div>
              </div>
              <ul className="grid gap-px border-t border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
                {[
                  'General Session replays',
                  'Conference highlights',
                  'Key announcements',
                  'Resources to continue learning and building',
                ].map((item, index) => (
                  <li key={item} className="flex gap-3 bg-[#161616]/80 px-5 py-4 text-sm leading-relaxed text-[#e0e0e0]">
                    <span className="font-mono text-xs font-semibold text-[#3ddbd9]">{String(index + 1).padStart(2, '0')}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Plan your experience</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">Everything you need for TechXchange</h3>
                </div>
                <span className="hidden font-mono text-xs text-[#8d8d8d] sm:block">ATL · 2026</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    number: '01',
                    page: 'schedule' as Page,
                    eyebrow: 'Conference',
                    title: 'Build your agenda',
                    description: 'Browse the conference at a glance, general sessions, and the complete Business Automation schedule.',
                    action: 'View conference schedule',
                    accent: '#4589ff',
                  },
                  {
                    number: '02',
                    page: 'sessions' as Page,
                    eyebrow: 'Business Automation',
                    title: `${sessions.length} focused sessions`,
                    description: 'Find labs, breakouts, meetups, Tech Talks, and expert conversations across the automation portfolio.',
                    action: 'Explore sessions',
                    accent: '#3ddbd9',
                  },
                  {
                    number: '03',
                    page: 'maps' as Page,
                    eyebrow: 'Wayfinding',
                    title: 'Know where to go',
                    description: 'Navigate the GWCC campus, Sandbox neighborhoods, stages, meeting spaces, and experience zones.',
                    action: 'Open venue maps',
                    accent: '#be95ff',
                  },
                  {
                    number: '04',
                    page: 'info' as Page,
                    eyebrow: 'Event guide',
                    title: 'Arrive prepared',
                    description: 'Get the practical details for labs, networking, the mobile app, accessibility, safety, and transportation.',
                    action: 'Read event information',
                    accent: '#f1c21b',
                  },
                ].map(card => (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => navigateToPage(card.page)}
                    className="group relative min-h-56 overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626] p-6 text-left transition-all hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-0.5"
                      style={{ backgroundColor: card.accent }}
                    />
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: card.accent }}>
                        {card.eyebrow}
                      </p>
                      <span className="font-mono text-xs text-[#8d8d8d]">{card.number}</span>
                    </div>
                    <h4 className="mt-8 text-xl font-semibold text-white">{card.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-[#c6c6c6]">{card.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#a6c8ff] transition-colors group-hover:text-white">
                      {card.action}
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-[#3ddbd9]/20 bg-gradient-to-r from-[#0b2426] to-[#262626]">
              <div className="flex flex-col justify-between gap-5 px-6 py-7 sm:flex-row sm:items-center sm:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3ddbd9]">Business Automation track</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Turn ideas into intelligent operations</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    Discover agentic process automation, trusted content services, and decision intelligence through real client stories and hands-on technical sessions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateToPage('sessions')}
                  className="shrink-0 rounded-lg border border-[#3ddbd9]/40 bg-[#3ddbd9]/10 px-4 py-2.5 text-sm font-semibold text-[#a2f6f4] transition-colors hover:bg-[#3ddbd9]/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ddbd9]/60"
                >
                  View the track
                </button>
              </div>
            </div>
          </section>
        ) : currentPage === 'schedule' ? (
          <>
        <section
          id="conference-overview"
          aria-labelledby="conference-overview-heading"
          className="mb-6 scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.06] bg-[#262626]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:gap-6 sm:px-6 sm:pt-6">
            <div>
              <h2 id="conference-overview-heading" className="text-xl font-semibold text-white">
                Conference at a glance
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <CopySectionLink id="conference-overview" label="Conference at a glance" />
              <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-[#8d8d8d] sm:inline">Display</span>
              <button
                type="button"
                aria-pressed={showBASessions}
                onClick={() => {
                  const next = !showBASessions
                  setShowBASessions(next)
                  if (!next) setActiveConferenceSpeakers(new Set())
                }}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  showBASessions
                    ? 'border-[#3ddbd9]/50 bg-[#3ddbd9]/10 text-[#a2f6f4]'
                    : 'border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] hover:border-white/[0.2] hover:text-white'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-sm ${showBASessions ? 'bg-[#3ddbd9]' : 'bg-[#8d8d8d]'}`}
                />
                BA Sessions
              </button>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-[#8d8d8d] sm:inline">Filter</span>
              <div role="group" aria-label="Filter BA sessions by speaker" className="flex items-center gap-1.5">
                {conferenceSpeakerFilters.map(speaker => {
                  const isActive = activeConferenceSpeakers.has(speaker.indicator)
                  return (
                    <button
                      key={speaker.indicator}
                      type="button"
                      title={speaker.name}
                      aria-label={`${speaker.indicator}: ${speaker.name}`}
                      aria-pressed={isActive}
                      onClick={() => toggleConferenceSpeaker(speaker.indicator)}
                      className={`rounded-full border px-2.5 py-1.5 font-mono text-xs font-bold transition-colors ${
                        isActive
                          ? 'border-[#3ddbd9]/60 bg-[#3ddbd9]/20 text-[#d9fbfa]'
                          : 'border-white/[0.1] bg-white/[0.03] text-[#c6c6c6] hover:border-[#3ddbd9]/35 hover:text-[#a2f6f4]'
                      }`}
                    >
                      {speaker.indicator}
                    </button>
                  )
                })}
              </div>
              <span
                aria-live="polite"
                className={`rounded-full border px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  showBASessions && matchingActiveDaySessions.length > 0
                    ? 'border-[#3ddbd9]/60 bg-[#3ddbd9]/15 text-[#a2f6f4]'
                    : 'border-white/[0.08] bg-white/[0.04] text-[#c6c6c6]'
                }`}
              >
                {showBASessions ? matchingActiveDaySessions.length : 0} of {activeDaySessions.length} BA Sessions
              </span>
            </div>
          </div>
          <div
            role="tablist"
            aria-label="Conference schedule by day"
            className="mt-5 grid grid-cols-5 border-y border-white/[0.06]"
          >
            {conferenceDays.map(day => {
              const isActive = activeOverviewDay === day
              return (
                <button
                  key={day}
                  id={`overview-tab-${day.replaceAll(' ', '-').toLowerCase()}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="conference-overview-panel"
                  onClick={() => setActiveOverviewDay(day)}
                  className={`border-r border-white/[0.06] px-2 py-3 text-xs font-semibold transition-colors last:border-r-0 sm:text-sm ${
                    isActive
                      ? 'bg-[#0f62fe] text-white'
                      : 'bg-[#161616] text-[#c6c6c6] hover:bg-[#393939] hover:text-white'
                  }`}
                >
                  <span className="hidden sm:inline">{dayLabels[day].split(' · ')[0]}</span>
                  <span className="sm:hidden">{dayAbbreviations[day]}</span>
                </button>
              )
            })}
          </div>
          <div
            id="conference-overview-panel"
            role="tabpanel"
            aria-labelledby={`overview-tab-${activeOverviewDay.replaceAll(' ', '-').toLowerCase()}`}
            className="p-5 sm:p-6"
          >
            <div className="mb-4">
              {activeConferenceDay.eyebrow && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#78a9ff]">
                  {activeConferenceDay.eyebrow}
                </p>
              )}
              <h3 className="text-lg font-semibold text-white">{activeConferenceDay.heading}</h3>
              {activeConferenceDay.introduction && (
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#c6c6c6]">
                  {activeConferenceDay.introduction}
                </p>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead className="bg-[#161616]">
                  <tr>
                    <th className="w-[220px] border-b border-white/[0.06] px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">
                      Time
                    </th>
                    <th className="border-b border-white/[0.06] px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {activeConferenceItems.map(item => (
                      <tr
                        key={item.key}
                        className={`transition-colors hover:bg-white/[0.02] ${
                          item.isBusinessAutomation ? 'shadow-[inset_3px_0_0_#3ddbd9]' : ''
                        }`}
                      >
                        <td className={`whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold ${
                          item.isBusinessAutomation ? 'text-[#3ddbd9]' : 'text-[#78a9ff]'
                        }`}>
                          {formatConferenceTimeRange(item.time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#f4f4f4]">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {item.sessionId && (
                                <span className="rounded border border-[#4589ff]/45 bg-[#0f62fe]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none tracking-wide text-[#78a9ff]">
                                  {item.sessionId}
                                </span>
                              )}
                              {item.url ? (
                                <button
                                  type="button"
                                  onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                                  aria-label={`${item.title}. Open the session catalog.`}
                                  className="inline-flex cursor-pointer items-center gap-1.5 text-left underline decoration-[#4589ff]/60 decoration-dotted underline-offset-4 transition-colors hover:text-white hover:decoration-solid focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]/60"
                                >
                                  {item.title}
                                  <ExternalLinkIcon />
                                </button>
                              ) : (
                                <span>{item.title}</span>
                              )}
                              {item.location && (
                                <span className="inline-flex items-center gap-1 text-xs text-[#c6c6c6]">
                                  <LocationIcon />
                                  {item.location}
                                </span>
                              )}
                              {item.subtitle && (
                                <span className="text-xs text-[#c6c6c6]">{item.subtitle}</span>
                              )}
                              {item.speakerIndicators.map(speaker => (
                                <span
                                  key={speaker.indicator}
                                  title={speaker.name}
                                  aria-label={speaker.name}
                                  className="rounded border border-[#3ddbd9]/45 bg-[#3ddbd9]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none tracking-wide text-[#a2f6f4]"
                                >
                                  {speaker.indicator}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {activeConferenceDay.note && (
              <p className="mt-4 border-l-2 border-[#0f62fe] bg-[#0f62fe]/10 px-4 py-3 text-sm leading-relaxed text-[#a6c8ff]">
                {activeConferenceDay.note}
              </p>
            )}
            {activeGeneralSessions.length > 0 && (
              <div className="mt-5 space-y-3">
                {activeGeneralSessions.map(session => <GeneralSessionCard key={session.id} session={session} />)}
              </div>
            )}
            {activeDaySessions.length > 0 && (
              <>
              <button
              onClick={() => setShowBusinessAutomationSchedule(current => !current)}
              aria-expanded={showBusinessAutomationSchedule}
              aria-controls="business-automation-schedule"
              className="mt-5 flex w-full items-center justify-between rounded-lg border border-[#0f62fe]/35 bg-[#0f62fe]/10 px-4 py-3 text-left transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15"
            >
              <span>
                <span className="block text-sm font-semibold text-white">
                  {showBusinessAutomationSchedule ? 'Hide' : 'Show'} Business Automation schedule
                </span>
                <span className="mt-0.5 block text-xs text-[#c6c6c6]">
                  {activeDaySessions.length} {activeDaySessions.length === 1 ? 'session' : 'sessions'} on {dayLabels[activeOverviewDay].split(' · ')[0]}
                </span>
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.05] text-[#78a9ff]">
                <ChevronIcon expanded={showBusinessAutomationSchedule} />
              </span>
            </button>
            {showBusinessAutomationSchedule && (
              <div id="business-automation-schedule" className="mt-5 border-t border-white/[0.06] pt-5">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">Business Automation</p>
                    <h4 className="mt-1 text-lg font-semibold text-white">{activeConferenceDay.heading}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopySectionLink id="business-automation-schedule" label="Business Automation schedule" />
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-[#c6c6c6]">
                      {activeDaySessions.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {activeDaySessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      expanded={expandedIds.has(session.id)}
                      onToggle={() => toggleExpand(session.id)}
                    />
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </section>
          </>
        ) : currentPage === 'maps' ? (
          <>
            <section id="maps-top" aria-labelledby="maps-heading" className="scroll-mt-28">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">GWCC wayfinding</p>
                  <h2 id="maps-heading" className="mt-1 text-2xl font-semibold text-white">Venue maps and floor plans</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    Explore the conference campus, Sandbox neighborhoods, stages, meeting spaces, and entrance views. Select any image to open the full-resolution map.
                  </p>
                </div>
                <CopySectionLink id="maps-top" label="Maps page" />
              </div>
              <nav
                aria-labelledby="maps-contents-heading"
                className="mb-6 rounded-xl border border-[#f1c21b]/55 bg-[#17140a] p-5 shadow-[0_0_32px_rgba(241,194,27,0.14)] sm:p-6"
              >
                <h3 id="maps-contents-heading" className="text-base font-semibold text-[#f1c21b]">Table of contents</h3>
                <ol className="mt-4 sm:columns-2 sm:gap-6 lg:columns-3">
                  {venueMaps.map((map, index) => (
                    <li key={`contents-${map.src}`} className="mb-2 break-inside-avoid">
                      <a
                        href={`#venue-map-${index + 1}`}
                        className="group flex items-start gap-2 rounded px-1 py-1 text-xs leading-relaxed text-[#c6c6c6] transition-colors hover:bg-white/[0.03] hover:text-white"
                      >
                        <span className="font-mono text-[#8d8d8d] transition-colors group-hover:text-[#78a9ff]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{map.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="space-y-6">
                {venueMaps.map((map, index) => (
                  <figure
                    key={map.src}
                    id={`venue-map-${index + 1}`}
                    className="scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.06] bg-[#262626]"
                  >
                    <figcaption className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                      <div>
                        <h3 className="text-sm font-semibold text-white sm:text-base">{map.title}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#c6c6c6]">{map.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-[#8d8d8d]">
                            {String(index + 1).padStart(2, '0')} / {venueMaps.length}
                          </span>
                          <CopySectionLink id={`venue-map-${index + 1}`} label={map.title} />
                        </div>
                        <a
                          href="#maps-top"
                          className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white"
                        >
                          Back to top
                        </a>
                      </div>
                    </figcaption>
                    <a
                      href={map.src}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-white transition-opacity hover:opacity-95"
                      aria-label={`Open full-resolution ${map.title} image`}
                    >
                      <img
                        src={map.src}
                        alt={`${map.title}: ${map.description}`}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        className="aspect-video w-full object-contain"
                      />
                    </a>
                  </figure>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <a
                  href="#maps-top"
                  className="rounded-lg border border-[#4589ff]/50 bg-[#0f62fe]/15 px-4 py-2.5 text-sm font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
                >
                  Back to top
                </a>
              </div>
            </section>
          </>
        ) : currentPage === 'info' ? (
          <>
            <section id="info-top" aria-labelledby="info-heading" className="scroll-mt-28">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Conference guide</p>
                  <h2 id="info-heading" className="mt-1 text-2xl font-semibold text-white">Essential event information</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    Browse Meeting Zone resources, activities, labs, networking events, mobile app guidance, livestream details, accessibility, safety, and transportation information.
                  </p>
                </div>
                <CopySectionLink id="info-top" label="Conference Info page" />
              </div>
              <nav
                aria-labelledby="info-contents-heading"
                className="mb-6 rounded-xl border border-[#f1c21b]/55 bg-[#17140a] p-5 shadow-[0_0_32px_rgba(241,194,27,0.14)] sm:p-6"
              >
                <h3 id="info-contents-heading" className="text-base font-semibold text-[#f1c21b]">Table of contents</h3>
                <ol className="mt-4 grid gap-x-6 gap-y-2 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-6">
                  <li>
                    <a
                      href="#conference-info-1"
                      className="group flex items-start gap-2 rounded px-1 py-1 text-xs leading-relaxed text-[#c6c6c6] transition-colors hover:bg-white/[0.03] hover:text-white"
                    >
                      <span className="font-mono text-[#8d8d8d] transition-colors group-hover:text-[#78a9ff]">01</span>
                      <span>Reference Info</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#conference-info-2"
                      className="group flex items-start gap-2 rounded px-1 py-1 text-xs leading-relaxed text-[#c6c6c6] transition-colors hover:bg-white/[0.03] hover:text-white"
                    >
                      <span className="font-mono text-[#8d8d8d] transition-colors group-hover:text-[#78a9ff]">02</span>
                      <span>Meeting Zone Resources</span>
                    </a>
                  </li>
                  {conferenceInfo.map((item, index) => (
                    <li key={`contents-${item.src}`}>
                      <a
                        href={`#conference-info-${index + 3}`}
                        className="group flex items-start gap-2 rounded px-1 py-1 text-xs leading-relaxed text-[#c6c6c6] transition-colors hover:bg-white/[0.03] hover:text-white"
                      >
                        <span className="font-mono text-[#8d8d8d] transition-colors group-hover:text-[#78a9ff]">
                          {String(index + 3).padStart(2, '0')}
                        </span>
                        <span>{item.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="space-y-6">
                <article
                  id="conference-info-1"
                  className="scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/55 bg-[#262626] shadow-[0_0_24px_rgba(69,137,255,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
                    <div>
                      <h3 className="text-base font-semibold text-white">Reference Info</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#c6c6c6]">
                        Product guidance and communities for IBM Business Automation.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-[#8d8d8d]">
                          01 / {conferenceInfo.length + 2}
                        </span>
                        <CopySectionLink id="conference-info-1" label="Reference Info" />
                      </div>
                      <a
                        href="#info-top"
                        className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white"
                      >
                        Back to top
                      </a>
                    </div>
                  </div>
                  <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
                    {infoReferenceInfoGroups.map(group => (
                      <section
                        key={group.title}
                        id={`info-reference-${group.title.toLowerCase().replaceAll(' ', '-')}`}
                        className="scroll-mt-28"
                        aria-labelledby={`info-reference-${group.title.toLowerCase().replaceAll(' ', '-')}-heading`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 id={`info-reference-${group.title.toLowerCase().replaceAll(' ', '-')}-heading`} className="text-sm font-semibold text-white">
                            {group.title}
                          </h4>
                          <CopySectionLink id={`info-reference-${group.title.toLowerCase().replaceAll(' ', '-')}`} label={group.title} />
                        </div>
                        <ul className="mt-3 space-y-2">
                          {group.links.map(link => (
                            <li key={link.url}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10 hover:text-white"
                              >
                                <span>{link.name}</span>
                                <ExternalLinkIcon />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </article>
                <article
                  id="conference-info-2"
                  className="scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/55 bg-[#262626] shadow-[0_0_24px_rgba(69,137,255,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
                    <div>
                      <h3 className="text-base font-semibold text-white">Meeting Zone Resources</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#c6c6c6]">
                        Request, manage, and host client and partner meetings at TechXchange.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-[#8d8d8d]">
                          02 / {conferenceInfo.length + 2}
                        </span>
                        <CopySectionLink id="conference-info-2" label="Meeting Zone Resources" />
                      </div>
                      <a
                        href="#info-top"
                        className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white"
                      >
                        Back to top
                      </a>
                    </div>
                  </div>
                  <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
                    {meetingZoneResourceGroups.map(group => (
                      <section
                        key={group.title}
                        id={`meeting-zone-${group.title.toLowerCase().replaceAll(' ', '-')}`}
                        className="scroll-mt-28"
                        aria-labelledby={`meeting-zone-${group.title.toLowerCase().replaceAll(' ', '-')}-heading`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4
                            id={`meeting-zone-${group.title.toLowerCase().replaceAll(' ', '-')}-heading`}
                            className="text-sm font-semibold text-white"
                          >
                            {group.title}
                          </h4>
                          <CopySectionLink id={`meeting-zone-${group.title.toLowerCase().replaceAll(' ', '-')}`} label={group.title} />
                        </div>
                        <ul className="mt-3 space-y-2">
                          {group.links.map(link => (
                            <li key={link.url}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#161616] px-4 py-3 text-sm font-medium text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/10 hover:text-white"
                              >
                                <span>{link.name}</span>
                                <ExternalLinkIcon />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                  <section id="meeting-zone-important-notes" aria-labelledby="meeting-zone-important-notes-heading" className="scroll-mt-28 border-t border-white/[0.06] bg-[#161616] px-5 py-5 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <h4 id="meeting-zone-important-notes-heading" className="text-sm font-semibold text-white">Important Notes</h4>
                      <CopySectionLink id="meeting-zone-important-notes" label="Meeting Zone important notes" />
                    </div>
                    <ol className="mt-3 space-y-2">
                      {meetingZoneNotes.map((note, index) => (
                        <li key={note} className="flex gap-3 text-sm leading-relaxed text-[#c6c6c6]">
                          <span className="font-mono font-semibold text-[#78a9ff]">{String(index + 1).padStart(2, '0')}</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                </article>
                {conferenceInfo.map((item, index) => (
                  <figure
                    key={item.src}
                    id={`conference-info-${index + 3}`}
                    className="scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/55 bg-[#262626] shadow-[0_0_24px_rgba(69,137,255,0.08)]"
                  >
                    <figcaption className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                      <div>
                        <h3 className="text-sm font-semibold text-white sm:text-base">{item.title}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#c6c6c6]">{item.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-[#8d8d8d]">
                            {String(index + 3).padStart(2, '0')} / {conferenceInfo.length + 2}
                          </span>
                          <CopySectionLink id={`conference-info-${index + 3}`} label={item.title} />
                        </div>
                        <a
                          href="#info-top"
                          className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white"
                        >
                          Back to top
                        </a>
                      </div>
                    </figcaption>
                    <a
                      href={item.src}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-white transition-opacity hover:opacity-95"
                      aria-label={`Open full-resolution ${item.title} image`}
                    >
                      <img
                        src={item.src}
                        alt={`${item.title}: ${item.description}`}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        className="aspect-video w-full object-contain"
                      />
                    </a>
                  </figure>
                ))}
              </div>
            </section>
          </>
        ) : currentPage === 'community' ? (
          <section id="community-top" aria-labelledby="community-heading" className="scroll-mt-28">
            <span id="product-communities" className="sr-only" aria-hidden="true" />
            <span id="ug-communities" className="sr-only" aria-hidden="true" />
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">IBM Data &amp; AI: Business Automation</p>
                <h2 id="community-heading" className="mt-1 text-2xl font-semibold text-white">Community - User Connects</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                  Connect with IBM product leaders and fellow users to shape the roadmap, exchange practical advice, and get an early look at innovations you can put to work sooner.
                </p>
              </div>
              <CopySectionLink id="community-top" label="Community page" />
            </div>

            {(() => {
              const visibleCommunities = userConnectCommunities
                .map((community, index) => ({ community, index }))
                .filter(({ community }) =>
                  (communityCapabilities.size === 0 && communityProducts.size === 0) ||
                  communityCapabilities.has(community.capability) ||
                  community.products.some(product => communityProducts.has(product)),
                )
              const handleCapabilityChange = (next: Set<string>) => {
                const added = [...next].filter(id => !communityCapabilities.has(id))
                if (added.length > 0) {
                  setCommunityProducts(current => {
                    const merged = new Set(current)
                    added.forEach(id => communityProductsByCapability.get(id)?.forEach(product => merged.add(product)))
                    return merged
                  })
                }
                setCommunityCapabilities(next)
              }
              return (
                <>
            <section
              id="community-filters"
              aria-labelledby="community-filters-heading"
              className="mb-6 scroll-mt-28 rounded-xl border border-[#4589ff]/30 bg-[#1c1c1c] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 id="community-filters-heading" className="text-base font-semibold text-white">Capabilities and Products</h3>
                <button
                  type="button"
                  onClick={() => setIsCommunityFiltersExpanded(expanded => !expanded)}
                  aria-expanded={isCommunityFiltersExpanded}
                  aria-controls="community-filters-body"
                  aria-label={isCommunityFiltersExpanded ? 'Collapse Filters' : 'Expand Filters'}
                  title={isCommunityFiltersExpanded ? 'Collapse Filters' : 'Expand Filters'}
                  className="inline-flex h-7 items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#78a9ff] transition-colors hover:border-[#4589ff]/55 hover:bg-[#0f62fe]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
                >
                  Filter
                  <VideoVisibilityIcon visible={isCommunityFiltersExpanded} />
                </button>
                <span className="text-xs font-medium text-[#c6c6c6]">
                  Communities: {visibleCommunities.length} of {userConnectCommunities.length} · Product connections: {new Set(visibleCommunities.flatMap(({ community }) => community.products)).size}
                </span>
                <span className="ml-auto"><CopySectionLink id="community-filters" label="Community filters" /></span>
              </div>
              <div id="community-filters-body" hidden={!isCommunityFiltersExpanded} className="mt-4 grid gap-4 border-t border-white/[0.06] pt-4">
              <CommunityFilterGroup
                id="community-capability-filter"
                title="Capabilities"
                options={communityCapabilityOptions}
                selected={communityCapabilities}
                onChange={handleCapabilityChange}
                onOptionDoubleClick={id => {
                  const associated = communityProductsByCapability.get(id) ?? []
                  setCommunityProducts(current => new Set([...current].filter(product => !associated.includes(product))))
                }}
              />
              <CommunityFilterGroup
                id="community-product-filter"
                title="Products"
                options={communityProductOptions}
                selected={communityProducts}
                onChange={setCommunityProducts}
              />
              </div>
            </section>

            {visibleCommunities.length === 0 && (
              <p className="rounded-xl border border-white/[0.07] bg-[#262626] px-5 py-6 text-center text-sm text-[#c6c6c6]">
                No communities match the selected capabilities and products.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCommunities.map(({ community, index }) => (
                <article
                  key={community.name}
                  id={`community-${index + 1}`}
                  className="scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.07] bg-[#262626] transition-colors hover:border-[#4589ff]/35"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
                    <div>
                      <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#8d8d8d]">
                        {String(index + 1).padStart(2, '0')} / {String(userConnectCommunities.length).padStart(2, '0')}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-white">{community.name}</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <CopySectionLink id={`community-${index + 1}`} label={community.name} />
                      <a
                        href={community.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#4589ff]/35 bg-[#0f62fe]/10 px-2.5 py-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/25 hover:text-white"
                      >
                        Visit
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-[#c6c6c6]">{community.description}</p>
                    <div className="mt-5 border-t border-white/[0.06] pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff]">Related products</p>
                      <ul className="mt-3 grid gap-2">
                        {community.products.map(product => (
                          <li key={product} className="flex gap-2.5 text-xs leading-relaxed text-[#c6c6c6]">
                            <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#4589ff]" />
                            <span>{product}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
                </>
              )
            })()}
            <div className="mt-8 flex justify-center">
              <a
                href="#community-top"
                className="rounded-lg border border-[#4589ff]/50 bg-[#0f62fe]/15 px-4 py-2.5 text-sm font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
              >
                Back to top
              </a>
            </div>
          </section>
        ) : currentPage === 'enablement' ? (
          <EnablementPage />

        ) : currentPage === 'ug' ? (
          <>
            <section id="ug-top" aria-labelledby="ug-heading" className="scroll-mt-28">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Connect with the community</p>
                  <h2 id="ug-heading" className="mt-1 text-2xl font-semibold text-white">User Groups</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    Connect with IBM product leaders and fellow users to shape the roadmap, exchange practical advice, and explore Business Automation solutions.
                  </p>
                </div>
                <CopySectionLink id="ug-top" label="Business Automation User Groups page" />
              </div>
              <nav
                aria-labelledby="ug-contents-heading"
                className="mb-6 rounded-xl border-[0.5px] border-[#f1c21b] bg-[#17140a] p-5 shadow-[0_0_32px_rgba(241,194,27,0.14)] sm:p-6"
              >
                <h3 id="ug-contents-heading" className="text-base font-semibold text-[#f1c21b]">Table of contents</h3>
                <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ugTableOfContents.map((item, index) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="group flex items-start gap-2 rounded px-1 py-1 text-xs leading-relaxed text-[#c6c6c6] transition-colors hover:bg-white/[0.03] hover:text-white"
                      >
                        <span className="font-mono text-[#8d8d8d] transition-colors group-hover:text-[#78a9ff]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{item.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="space-y-6">
                {ugSectionImages.map((item, index) => {
                  const position = index + 5
                  return (
                    <Fragment key={item.id}>
                      {index === 0 && ugFeaturedSession && (
                        <>
                          <figure
                            id="ug-tlk-6335"
                            className="scroll-mt-28 overflow-hidden rounded-xl border-[0.5px] border-[#f1c21b] bg-[#262626]"
                          >
                          <figcaption className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                            <div>
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <a
                                  href={ugFeaturedSession.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-md border border-[#0f62fe]/50 bg-[#0f62fe]/15 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
                                >
                                  TLK-6335
                                  <ExternalLinkIcon />
                                </a>
                                <TypeBadge type={ugFeaturedSession.type} />
                                <span className="text-xs text-[#c6c6c6]">{ugFeaturedSession.day} · {ugFeaturedSession.time}</span>
                                <span className="text-xs text-[#c6c6c6]">{ugFeaturedSession.location}</span>
                                <a
                                  href={ugFeaturedSession.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:text-white"
                                >
                                  View session
                                  <ExternalLinkIcon />
                                </a>
                              </div>
                              <h3 className="text-sm font-semibold text-white sm:text-base">{ugFeaturedSession.title}</h3>
                              <p className="mt-1 text-xs leading-relaxed text-[#c6c6c6]">{ugFeaturedSession.description}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-[#8d8d8d]">
                                  01 / {String(ugResourceCount).padStart(2, '0')}
                                </span>
                                <CopySectionLink id="ug-tlk-6335" label="TLK-6335 session" />
                              </div>
                              <a
                                href="#ug-top"
                                className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white"
                              >
                                Back to top
                              </a>
                              <div className="mt-1 flex flex-col items-end gap-1">
                                <a
                                  href={ugFeaturedSession.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block w-24 overflow-hidden rounded-lg border border-white/[0.1] bg-white p-1.5 transition-opacity hover:opacity-90"
                                  aria-label="Open the TLK-6335 session catalog page"
                                >
                                  <img
                                    src={asset('ug/tlk-6335-qr.png')}
                                    alt="QR code for the TLK-6335 session catalog page"
                                    className="h-auto w-full"
                                  />
                                </a>
                                <span className="text-[10px] font-medium text-[#c6c6c6]">Scan to view session</span>
                              </div>
                            </div>
                          </figcaption>
                          <div className="grid gap-px bg-white/[0.06] md:grid-cols-3">
                            {[
                              {
                                name: 'Matt Vest',
                                src: asset('ug/tlk-6335/image-02.png'),
                                alt: 'Collectible figure of Matt Vest representing Content Services',
                              },
                              {
                                name: 'Lenny Bromberg',
                                src: asset('ug/tlk-6335/image-03.png'),
                                alt: 'Collectible figure of Lenny Bromberg representing Decision Intelligence',
                              },
                              {
                                name: 'Swapnil Agrawal',
                                src: asset('ug/tlk-6335/image-01.png'),
                                alt: 'Collectible figure of Swapnil Agrawal representing Agentic Process Automation',
                              },
                            ].map((image, imageIndex) => {
                              const speaker = ugFeaturedSession.speakers.find(entry => entry.startsWith(`${image.name} —`))
                              return (
                                <div key={image.src} className="bg-[#262626]">
                                  <p className="px-4 py-3 text-center text-xs leading-relaxed text-[#c6c6c6]">{speaker}</p>
                                  <a
                                    href={image.src}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block bg-white transition-opacity hover:opacity-95"
                                    aria-label={`Open full-resolution TLK-6335 speaker image ${imageIndex + 1}`}
                                  >
                                    <img src={image.src} alt={image.alt} loading="lazy" className="aspect-square w-full object-contain" />
                                  </a>
                                </div>
                              )
                            })}
                          </div>
                          </figure>
                          {ugMteSessions.map((session, mteIndex) => {
                            const sectionId = `ug-${session.id.toLowerCase()}`
                            const sectionImage = session.id === 'MTE-5681'
                              ? asset('ug/mte-5681-section.png')
                              : session.id === 'MTE-5682'
                                ? asset('ug/mte-5682-section.png')
                                : session.id === 'MTE-5683'
                                  ? asset('ug/mte-5683-section.png')
                                  : session.image
                            const sectionQr = session.id === 'MTE-5681'
                              ? asset('ug/mte-5681-qr.png')
                              : session.id === 'MTE-5682'
                                ? asset('ug/mte-5682-qr.png')
                                : session.id === 'MTE-5683'
                                  ? asset('ug/mte-5683-qr.png')
                                  : undefined
                            const usesWideArtwork = ['MTE-5681', 'MTE-5682', 'MTE-5683'].includes(session.id)
                            return (
                              <figure
                                key={session.id}
                                id={sectionId}
                                className="scroll-mt-28 overflow-hidden rounded-xl border-[0.5px] border-[#f1c21b] bg-[#262626]"
                              >
                                <figcaption className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                                  <div>
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                      <a
                                        href={session.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-md border border-[#0f62fe]/50 bg-[#0f62fe]/15 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-[#78a9ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
                                      >
                                        {session.id}
                                        <ExternalLinkIcon />
                                      </a>
                                      <TypeBadge type={session.type} />
                                      <span className="text-xs text-[#c6c6c6]">{session.day} · {session.time}</span>
                                      <span className="text-xs text-[#c6c6c6]">{session.location}</span>
                                      <a
                                        href={session.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:text-white"
                                      >
                                        View session
                                        <ExternalLinkIcon />
                                      </a>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white sm:text-base">{session.title}</h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#c6c6c6]">{session.description}</p>
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-2">
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-xs text-[#8d8d8d]">
                                        {String(mteIndex + 2).padStart(2, '0')} / {String(ugResourceCount).padStart(2, '0')}
                                      </span>
                                      <CopySectionLink id={sectionId} label={`${session.id} session`} />
                                    </div>
                                    <a
                                      href="#ug-top"
                                      className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white"
                                    >
                                      Back to top
                                    </a>
                                  </div>
                                </figcaption>
                                <div className="bg-[#262626]">
                                  {!usesWideArtwork && (
                                    <p className="px-4 py-3 text-center text-xs leading-relaxed text-[#c6c6c6]">{session.speakers[0]}</p>
                                  )}
                                  {sectionImage && (
                                    <a
                                      href={sectionImage}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={usesWideArtwork
                                        ? 'relative block bg-white transition-opacity hover:opacity-95'
                                        : 'relative mx-auto block max-w-xl bg-white transition-opacity hover:opacity-95'}
                                      aria-label={`Open full-resolution image for ${session.id}`}
                                    >
                                      <img
                                        src={sectionImage}
                                        alt={session.imageAlt ?? ''}
                                        loading="lazy"
                                        className={usesWideArtwork
                                          ? 'h-auto w-full object-contain'
                                          : 'aspect-square w-full object-contain'}
                                      />
                                      {sectionQr && (
                                        <span className="absolute left-[44%] top-[21%] w-[9%] -translate-x-1/2 rounded-md border border-black/10 bg-white p-1 shadow-lg">
                                          <img
                                            src={sectionQr}
                                            alt={`QR code for the ${session.id} session catalog page`}
                                            className="h-auto w-full"
                                          />
                                        </span>
                                      )}
                                    </a>
                                  )}
                                </div>
                              </figure>
                            )
                          })}
                        </>
                      )}
                      <figure
                        id={item.id}
                        className="scroll-mt-28 overflow-hidden rounded-xl border-[0.5px] border-[#f1c21b] bg-[#262626]"
                      >
                        <figcaption className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                          <div>
                            <h3 className="text-sm font-semibold text-white sm:text-base">{item.title}</h3>
                            <p className="mt-0.5 text-xs leading-relaxed text-[#c6c6c6]">{item.description}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs text-[#8d8d8d]">
                                {String(position).padStart(2, '0')} / {String(ugResourceCount).padStart(2, '0')}
                              </span>
                              <CopySectionLink id={item.id} label={item.title} />
                            </div>
                            <a
                              href="#ug-top"
                              className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white"
                            >
                              Back to top
                            </a>
                          </div>
                        </figcaption>
                        <a
                          href={item.src}
                          target="_blank"
                          rel="noreferrer"
                          className="block bg-white transition-opacity hover:opacity-95"
                          aria-label={`Open full-resolution ${item.title}`}
                        >
                          <img
                            src={item.src}
                            alt={`${item.title}: ${item.description}`}
                            loading="lazy"
                            className="aspect-video w-full object-contain"
                          />
                        </a>
                      </figure>
                    </Fragment>
                  )
                })}
              </div>
            </section>
          </>
        ) : currentPage === 'ibm' ? (
          <section id="ibm-top" aria-labelledby="ibm-heading" className="scroll-mt-28">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">IBM conference resources</p>
                <h2 id="ibm-heading" className="mt-1 text-2xl font-semibold text-white">IBM</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                  Access IBM TechXchange insights and presenter audio/visual instructions.
                </p>
              </div>
              <CopySectionLink id="ibm-top" label="IBM resources page" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <a
                href="#insights-top"
                onClick={event => {
                  event.preventDefault()
                  navigateToPage('insights')
                }}
                className="group block overflow-hidden rounded-xl border border-[#4589ff]/30 bg-gradient-to-br from-[#0f62fe]/15 via-[#262626] to-[#262626] p-6 transition-colors hover:border-[#4589ff]/70 hover:bg-[#0f62fe]/10"
              >
                <span className="font-mono text-xs font-semibold text-[#78a9ff]">01 / 02</span>
                <h3 className="mt-4 text-xl font-semibold text-white">Insights</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#c6c6c6]">
                  Review curated conference insights, key takeaways, and follow-up resources.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#78a9ff] transition-colors group-hover:text-white">
                  View insights
                  <span aria-hidden="true">→</span>
                </span>
              </a>
              <a
                href="#av-top"
                onClick={event => {
                  event.preventDefault()
                  navigateToPage('speaker')
                }}
                className="group block overflow-hidden rounded-xl border border-[#4589ff]/30 bg-gradient-to-br from-[#0f62fe]/15 via-[#262626] to-[#262626] p-6 transition-colors hover:border-[#4589ff]/70 hover:bg-[#0f62fe]/10"
              >
                <span className="font-mono text-xs font-semibold text-[#78a9ff]">02 / 02</span>
                <h3 className="mt-4 text-xl font-semibold text-white">Audio/Visual</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#c6c6c6]">
                  Review presenter setup, room connection, microphone, hybrid-audio, and onsite support guidance.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#78a9ff] transition-colors group-hover:text-white">
                  View AV instructions
                  <span aria-hidden="true">→</span>
                </span>
              </a>
            </div>
          </section>
        ) : currentPage === 'insights' ? (
          <section id="insights-top" aria-labelledby="insights-heading" className="scroll-mt-28">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">IBM conference resources</p>
                <h2 id="insights-heading" className="mt-1 text-2xl font-semibold text-white">Insights - Business Automation</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                  Curated IBM TechXchange insights, key takeaways, and follow-up resources for Business Automation.
                </p>
              </div>
              <CopySectionLink id="insights-top" label="IBM Insights page" />
            </div>
            <section
              id="insights-summary"
              aria-labelledby="insights-summary-heading"
              className="scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/35 bg-[#262626]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-gradient-to-r from-[#0f62fe]/15 to-transparent px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff]">Registration insights</p>
                  <h3 id="insights-summary-heading" className="mt-1 text-lg font-semibold text-white">Session Summary</h3>
                  <p className="mt-1 text-xs text-[#c6c6c6]">Updates with the roster filters below.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 font-mono text-xs font-semibold text-[#f4f4f4]">
                      {filteredInsightsEnrollmentRoster.length} total {filteredInsightsEnrollmentRoster.length === 1 ? 'session' : 'sessions'}
                      <span className="mx-2 text-[#8d8d8d]" aria-hidden="true">·</span>
                      <span className="text-[#3ddbd9]">{filteredInsightsTotalAttended.toLocaleString()} attended</span>
                    </span>
                    <CopySectionLink id="insights-summary" label="Session Summary" />
                  </div>
                  <button
                    type="button"
                    onClick={exportAllInsightsRegistration}
                    className="rounded-md border border-[#4589ff]/50 bg-[#0f62fe]/15 px-3 py-1.5 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
                  >
                    Export all CSV
                  </button>
                </div>
              </div>
              <div className="bg-[#161616] p-5 sm:p-6">
                {filteredInsightsTypeSummaries.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredInsightsTypeSummaries.map(summary => (
                      <article key={summary.type} className="rounded-lg border border-white/[0.06] bg-[#262626] p-4">
                        <SessionTypeIdentifier type={summary.type} />
                        <dl className="mt-4 grid grid-cols-3 gap-3">
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8d8d8d]">Sessions</dt>
                            <dd className="mt-1 font-mono text-lg font-semibold text-white">{summary.sessions}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8d8d8d]">Enrolled</dt>
                            <dd className="mt-1 font-mono text-lg font-semibold text-[#78a9ff]">
                              {summary.reportedEnrollments > 0 ? summary.enrollments : '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8d8d8d]">Attended</dt>
                            <dd className="mt-1 font-mono text-lg font-semibold text-[#3ddbd9]">{summary.attended}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#c6c6c6]">No session-type totals match the selected filters.</p>
                )}
              </div>
            </section>
            <section
              id="insights-registration"
              aria-labelledby="insights-registration-heading"
              className="mt-6 scroll-mt-28 overflow-hidden rounded-xl border border-[#4589ff]/35 bg-[#262626]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] bg-gradient-to-r from-[#0f62fe]/15 to-transparent px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78a9ff]">Registration insights</p>
                  <h3 id="insights-registration-heading" className="mt-1 text-lg font-semibold text-white">
                    Session Search
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#c6c6c6]">
                    Enrollment and attended-attendee counts for Business Automation user-group sessions.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 font-mono text-xs font-semibold text-[#f4f4f4]">
                      {filteredInsightsEnrollmentRoster.length} {filteredInsightsEnrollmentRoster.length === 1 ? 'session' : 'sessions'}
                      <span className="mx-2 text-[#8d8d8d]" aria-hidden="true">·</span>
                      <span className="text-[#3ddbd9]">{filteredInsightsTotalAttended.toLocaleString()} attended</span>
                    </span>
                    <CopySectionLink id="insights-registration" label="Session Search" />
                  </div>
                  <button
                    type="button"
                    disabled={filteredInsightsEnrollmentRoster.length === 0}
                    onClick={exportInsightsAttendance}
                    className="rounded-md border border-[#4589ff]/50 bg-[#0f62fe]/15 px-3 py-1.5 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
              <div className="border-b border-white/[0.06] bg-[#161616] p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c6c6c6]">Session ID</span>
                    <select
                      value={insightsSessionIdFilter}
                      onChange={event => setInsightsSessionIdFilter(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/[0.1] bg-[#161616] px-3 py-2.5 text-sm text-[#f4f4f4] outline-none transition-colors focus:border-[#4589ff] focus:ring-2 focus:ring-[#0f62fe]/30"
                    >
                      <option value="all">All</option>
                      {insightsEnrollmentRoster.map(row => (
                        <option key={row.id} value={row.id}>{row.id}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c6c6c6]">Session type</span>
                    <select
                      value={insightsSessionTypeFilter}
                      onChange={event => setInsightsSessionTypeFilter(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/[0.1] bg-[#161616] px-3 py-2.5 text-sm text-[#f4f4f4] outline-none transition-colors focus:border-[#4589ff] focus:ring-2 focus:ring-[#0f62fe]/30"
                    >
                      <option value="all">All</option>
                      {[...insightsSessionTypes].sort((a, b) => sessionTypeDropdownLabels[a].localeCompare(sessionTypeDropdownLabels[b])).map(type => (
                        <option key={type} value={type}>{sessionTypeDropdownLabels[type]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c6c6c6]">Speaker</span>
                    <select
                      value={insightsSpeakerFilter}
                      onChange={event => setInsightsSpeakerFilter(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/[0.1] bg-[#161616] px-3 py-2.5 text-sm text-[#f4f4f4] outline-none transition-colors focus:border-[#4589ff] focus:ring-2 focus:ring-[#0f62fe]/30"
                    >
                      <option value="all">All</option>
                      {featuredInsightsSpeakers.map(speaker => (
                        <option key={speaker} value={speaker} className="font-semibold text-[#f1c21b]">
                          {speaker}
                        </option>
                      ))}
                      {featuredInsightsSpeakers.length > 0 && remainingInsightsSpeakers.length > 0 && (
                        <option disabled value="speaker-separator">──────── Other speakers ────────</option>
                      )}
                      {remainingInsightsSpeakers.map(speaker => (
                        <option key={speaker} value={speaker}>{speaker}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p aria-live="polite" className="text-xs text-[#c6c6c6]">
                    Showing {filteredInsightsEnrollmentRoster.length} of {insightsEnrollmentRoster.length} sessions
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!hasInsightsFilters}
                      onClick={() => {
                        setInsightsSessionIdFilter('all')
                        setInsightsSessionTypeFilter('all')
                        setInsightsSpeakerFilter('all')
                      }}
                      className="rounded-md border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <caption className="sr-only">
                    IBM TechXchange available session enrollment roster
                  </caption>
                  <thead className="bg-[#161616]">
                    <tr>
                      <th className="border-b border-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">
                        Session ID
                      </th>
                      <th className="border-b border-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">
                        Title
                      </th>
                      <th className="border-b border-white/[0.06] px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">
                        Total enrollments
                      </th>
                      <th className="border-b border-white/[0.06] px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[#8d8d8d]">
                        Attended attendees
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredInsightsTypeSummaries.map(summary => (
                      <Fragment key={summary.type}>
                        <tr className="bg-[#161616]">
                          <th colSpan={4} className="px-5 py-3 text-left">
                            <div className="flex items-center justify-between gap-3">
                              <SessionTypeIdentifier type={summary.type} />
                              <span className="font-mono text-xs text-[#c6c6c6]">
                                {summary.sessions} {summary.sessions === 1 ? 'session' : 'sessions'}
                              </span>
                            </div>
                          </th>
                        </tr>
                        {summary.rows.map(row => {
                          const catalogSession = sessions.find(session => session.id === row.id)
                          const sessionTypeStyle = catalogSession ? typeConfig[catalogSession.type] : undefined
                          return (
                            <tr key={row.id} className="transition-colors hover:bg-white/[0.02]">
                              <td className="whitespace-nowrap px-5 py-4 align-top">
                                {catalogSession?.url ? (
                                  <a
                                    href={catalogSession.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs font-semibold transition-[filter] hover:brightness-125 ${
                                      sessionTypeStyle
                                        ? `${sessionTypeStyle.color} ${sessionTypeStyle.bg}`
                                        : 'border-[#4589ff]/45 bg-[#0f62fe]/10 text-[#78a9ff]'
                                    }`}
                                  >
                                    {row.id}
                                    <ExternalLinkIcon />
                                  </a>
                                ) : (
                                  <span className={`inline-flex rounded-md border px-2 py-1 font-mono text-xs font-semibold ${
                                    sessionTypeStyle
                                      ? `${sessionTypeStyle.color} ${sessionTypeStyle.bg}`
                                      : 'border-[#4589ff]/45 bg-[#0f62fe]/10 text-[#78a9ff]'
                                  }`}>
                                    {row.id}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-sm leading-relaxed text-[#f4f4f4]">{row.title}</td>
                              <td className="px-5 py-4 text-right font-mono text-sm font-semibold text-[#78a9ff]">
                                {row.enrollments ?? '—'}
                              </td>
                              <td className="px-5 py-4 text-right font-mono text-sm font-semibold text-[#3ddbd9]">{row.attended}</td>
                            </tr>
                          )
                        })}
                        <tr className="bg-white/[0.025]">
                          <td colSpan={2} className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-[#c6c6c6]">
                            {typeConfig[summary.type].label} subtotal
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-sm font-bold text-[#78a9ff]">
                            {summary.reportedEnrollments > 0 ? summary.enrollments : '—'}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-sm font-bold text-[#3ddbd9]">{summary.attended}</td>
                        </tr>
                      </Fragment>
                    ))}
                    {filteredInsightsEnrollmentRoster.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-sm text-[#c6c6c6]">
                          No sessions match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : currentPage === 'surveys' ? (
          <>
            <section id="surveys" aria-labelledby="surveys-heading" className="scroll-mt-28">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">Share your feedback</p>
                  <h2 id="surveys-heading" className="mt-1 text-2xl font-semibold text-white">Business Automation surveys</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    Open a survey directly or scan its QR code with your mobile device.
                  </p>
                </div>
                <CopySectionLink id="surveys" label="Surveys page" />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {surveys.map((survey, index) => (
                  <article
                    key={survey.url}
                    id={`survey-${index + 1}`}
                    className="scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.06] bg-[#262626]"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
                      <div>
                        <p className="font-mono text-xs font-semibold text-[#8d8d8d]">
                          Survey {String(index + 1).padStart(2, '0')}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{survey.name}</h3>
                      </div>
                      <CopySectionLink id={`survey-${index + 1}`} label={survey.name} />
                    </div>
                    <div className="p-5">
                      <div className="mx-auto max-w-[240px] rounded-lg bg-white p-3">
                        <img
                          src={survey.qrCode}
                          alt={`QR code for ${survey.name}`}
                          className="aspect-square w-full"
                        />
                      </div>
                      <a
                        href={survey.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-[#0f62fe]/50 bg-[#0f62fe]/15 px-4 py-3 text-center text-sm font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff] hover:bg-[#0f62fe]/30 hover:text-white"
                        aria-label={`Open ${survey.name} in a new tab`}
                      >
                        <span>{survey.displayUrl}</span>
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : currentPage === 'speaker' ? (
          <>
            <section id="av-top" aria-labelledby="speaker-heading" className="scroll-mt-28">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">IBM TechXchange 2026</p>
                  <h2 id="speaker-heading" className="mt-1 text-2xl font-semibold text-white">Speaker instructions</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c6c6c6]">
                    A quick guide to connecting your laptop, using the room microphones, and getting AV support.
                  </p>
                </div>
                <CopySectionLink id="av-top" label="Audio/Visual page" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <article id="av-present" className="scroll-mt-28 rounded-xl border border-white/[0.06] bg-[#262626] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">Getting set up</p>
                    <CopySectionLink id="av-present" label="Present from your laptop" />
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-white">Present from your laptop</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#c6c6c6]">
                    Each breakout room has a speaker table and lectern. You will present directly from your own laptop.
                  </p>
                  <h4 className="mt-5 text-sm font-semibold text-white">Equipment in the room</h4>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[#c6c6c6]">
                    <li className="flex gap-2"><span className="text-[#78a9ff]">01</span><span>HDMI cable</span></li>
                    <li className="flex gap-2"><span className="text-[#78a9ff]">02</span><span>Multi-port adapter supporting PC and Mac</span></li>
                    <li className="flex gap-2"><span className="text-[#78a9ff]">03</span><span>3.5 mm audio cable for sound</span></li>
                    <li className="flex gap-2"><span className="text-[#78a9ff]">04</span><span>Slide advancer</span></li>
                  </ul>
                  <p className="mt-4 border-l-2 border-[#0f62fe] bg-[#0f62fe]/10 px-4 py-3 text-sm leading-relaxed text-[#a6c8ff]">
                    Leave the HDMI cable, adapter, audio cable, and slide advancer at the table after your session.
                  </p>
                </article>

                <article id="av-connect" className="scroll-mt-28 rounded-xl border border-white/[0.06] bg-[#262626] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">Display and sound</p>
                    <CopySectionLink id="av-connect" label="Connect your laptop" />
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-white">Connect your laptop</h3>
                  <ol className="mt-4 space-y-4">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f62fe]/20 font-mono text-xs font-semibold text-[#78a9ff]">1</span>
                      <p className="text-sm leading-relaxed text-[#c6c6c6]">
                        Plug the HDMI cable into the USB-C adapter. Contact your AV tech if you need another adapter.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f62fe]/20 font-mono text-xs font-semibold text-[#78a9ff]">2</span>
                      <p className="text-sm leading-relaxed text-[#c6c6c6]">Connect the adapter to your laptop.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f62fe]/20 font-mono text-xs font-semibold text-[#78a9ff]">3</span>
                      <p className="text-sm leading-relaxed text-[#c6c6c6]">
                        Select your preferred display setting, such as Duplicate or Extend.
                      </p>
                    </li>
                  </ol>
                  <p className="mt-5 rounded-lg border border-[#0f62fe]/30 bg-[#0f62fe]/10 px-4 py-3 text-sm leading-relaxed text-[#a6c8ff]">
                    For video with sound, connect the audio cable to your laptop’s headphone port so audio plays through the room speakers.
                  </p>
                </article>

                <article id="av-microphones" className="scroll-mt-28 rounded-xl border border-white/[0.06] bg-[#262626] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">Using the microphones</p>
                    <CopySectionLink id="av-microphones" label="Microphone instructions" />
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-white">Choose either or both microphones</h3>
                  <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#c6c6c6]">
                    <li className="flex gap-2"><span className="text-[#78a9ff]">01</span><span>Wireless clip-on lavalier microphone at the lectern</span></li>
                    <li className="flex gap-2"><span className="text-[#78a9ff]">02</span><span>Handheld microphone on the speaker table</span></li>
                  </ul>
                  <p className="mt-4 text-sm leading-relaxed text-[#c6c6c6]">
                    The microphones are pre-configured. When you are ready to begin, switch on the microphone using the power button at the bottom.
                  </p>
                  <div className="mt-5 rounded-lg border border-[#fa4d56]/25 bg-[#fa4d56]/10 px-4 py-3">
                    <h4 className="text-sm font-semibold text-[#ffb3b8]">Do not adjust the audio board</h4>
                    <p className="mt-1 text-sm leading-relaxed text-[#e0e0e0]">
                      The board at the back of the room is already configured. Contact the AV tech if anything is not working.
                    </p>
                  </div>
                </article>

                <article id="speaker-ready-room" className="scroll-mt-28 rounded-xl border border-white/[0.06] bg-[#262626] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">Advance assistance</p>
                    <CopySectionLink id="speaker-ready-room" label="Speaker Ready Room" />
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-white">Speaker Ready Room</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#c6c6c6]">
                    For help before your session, visit the Speaker Ready Room.
                  </p>
                  <div className="mt-4 rounded-lg border border-[#0f62fe]/30 bg-[#0f62fe]/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78a9ff]">Location</p>
                    <p className="mt-1 text-lg font-semibold text-white">Room C111</p>
                    <p className="mt-1 text-sm text-[#c6c6c6]">Level 1 · Building C</p>
                    <div className="mt-4 border-t border-[#4589ff]/20 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78a9ff]">Hours</p>
                      <dl className="mt-2 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-4"><dt className="text-[#c6c6c6]">Sunday</dt><dd className="text-right text-[#f4f4f4]">12:00 PM–6:00 PM</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-[#c6c6c6]">Monday</dt><dd className="text-right text-[#f4f4f4]">9:00 AM–6:00 PM</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-[#c6c6c6]">Tuesday</dt><dd className="text-right text-[#f4f4f4]">8:00 AM–6:30 PM</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-[#c6c6c6]">Wednesday</dt><dd className="text-right text-[#f4f4f4]">8:00 AM–6:30 PM</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-[#c6c6c6]">Thursday</dt><dd className="text-right text-[#f4f4f4]">8:00 AM–12:30 PM</dd></div>
                      </dl>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#c6c6c6]">
                    Sandbox and Tech Talk stages have a dedicated AV tech standing by at each stage.
                  </p>
                </article>
              </div>

              <section id="hybrid-audio" aria-labelledby="hybrid-audio-heading" className="mt-6 scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.06] bg-[#262626]">
                <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">Hybrid meetings</p>
                    <CopySectionLink id="hybrid-audio" label="Hybrid Meeting Audio Setup" />
                  </div>
                  <h3 id="hybrid-audio-heading" className="mt-1 text-lg font-semibold text-white">Hybrid Meeting Audio Setup</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#c6c6c6]">
                    To support remote participants and presenters, use this MacBook, mixer, and Microsoft Teams connection diagram for audio technicians. Select the diagram to open it at full size.
                  </p>
                </div>
                <a
                  href={asset('av/hybrid-meeting-audio-setup.png')}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-white transition-opacity hover:opacity-95"
                >
                  <img
                    src={asset('av/hybrid-meeting-audio-setup.png')}
                    alt="Hybrid meeting audio setup diagram showing radio microphones routed through an audio mixer to a MacBook running Microsoft Teams, with an auxiliary microphone mix sent to remote attendees and Teams audio returned to room speakers."
                    className="h-auto w-full"
                  />
                </a>
                <div className="grid border-t border-white/[0.06] lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="p-5 sm:p-6">
                    <h4 className="text-base font-semibold text-white">Setup checklist</h4>
                    <ol className="mt-4 space-y-3">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f62fe]/20 font-mono text-xs font-semibold text-[#78a9ff]">1</span>
                        <p className="text-sm leading-relaxed text-[#c6c6c6]">
                          Connect the USB-C audio interface cable before starting the Teams meeting. Open the arrow next to <span className="font-semibold text-[#f4f4f4]">Mic</span> and select the connected interface.
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f62fe]/20 font-mono text-xs font-semibold text-[#78a9ff]">2</span>
                        <p className="text-sm leading-relaxed text-[#c6c6c6]">
                          Ask the audio technician to use an <span className="font-semibold text-[#f4f4f4]">Aux Send</span> that sends only the microphone signal to your workstation.
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f62fe]/20 font-mono text-xs font-semibold text-[#78a9ff]">3</span>
                        <p className="text-sm leading-relaxed text-[#c6c6c6]">
                          To play meeting audio through the room speakers, connect the workstation’s headphone output to a spare mixer channel and route that channel to the main speakers.
                        </p>
                      </li>
                    </ol>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <article className="rounded-lg border border-white/[0.06] bg-[#161616] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff]">Mixer to workstation</p>
                        <h5 className="mt-1 text-sm font-semibold text-white">1/4-inch TS to USB-C cable</h5>
                        <p className="mt-2 text-xs leading-relaxed text-[#c6c6c6]">
                          USB guitar cable, 32-bit/384 kHz, 6.5 ft, with mono braided shielding for USB-C ports.
                        </p>
                        <a
                          href="https://www.amazon.com/CIXUN-Interface-Instruments-Recording-Compatible/dp/B0FXX2MTMC/"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:text-white"
                        >
                          View cable
                          <ExternalLinkIcon />
                        </a>
                      </article>
                      <article className="rounded-lg border border-white/[0.06] bg-[#161616] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78a9ff]">Workstation to mixer</p>
                        <h5 className="mt-1 text-sm font-semibold text-white">3.5 mm TRS to dual 1/4-inch TS cable</h5>
                        <p className="mt-2 text-xs leading-relaxed text-[#c6c6c6]">
                          This stereo-to-dual-mono Y-splitter cable should be present for returning meeting audio to the mixer.
                        </p>
                        <a
                          href="https://www.amazon.com/Tisino-Stereo-Y-Splitter-Cable-Breakout/dp/B07K59CQ3R/"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#78a9ff] transition-colors hover:text-white"
                        >
                          View cable
                          <ExternalLinkIcon />
                        </a>
                      </article>
                    </div>

                    <p className="mt-4 border-l-2 border-[#f1c21b] bg-[#f1c21b]/10 px-4 py-3 text-sm leading-relaxed text-[#e0e0e0]">
                      You may need two workstations because the sound equipment is typically at the back of the room while the speaker presents from the front.
                    </p>
                  </div>
                  <figure className="border-t border-white/[0.06] bg-[#161616] p-5 lg:border-l lg:border-t-0 sm:p-6">
                    <img
                      src={asset('av/teams-audio-device-selector.png')}
                      alt="Microsoft Teams audio device selector showing the speaker and microphone menus."
                      className="mx-auto h-auto w-full max-w-64 rounded-lg border border-white/[0.08]"
                    />
                    <figcaption className="mt-3 text-xs leading-relaxed text-[#c6c6c6]">
                      In Teams, use the arrow next to Mic to confirm that the connected audio interface appears as the selected microphone.
                    </figcaption>
                  </figure>
                </div>
              </section>

              <section id="av-support" aria-labelledby="av-support-heading" className="mt-6 scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.06] bg-[#262626]">
                <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">Text for assistance and include your room number</p>
                    <CopySectionLink id="av-support" label="AV support contacts" />
                  </div>
                  <h3 id="av-support-heading" className="mt-1 text-lg font-semibold text-white">AV support contacts</h3>
                </div>
                <div className="grid divide-y divide-white/[0.06] md:grid-cols-2 md:divide-x md:divide-y-0">
                  <div className="bg-[#0f62fe]/10 p-5 shadow-[inset_4px_0_0_#0f62fe] sm:p-6">
                    <h4 className="text-lg font-semibold text-[#a6c8ff]">Building B</h4>
                    <dl className="mt-3 space-y-3 text-sm">
                      <div>
                        <dt className="text-[#8d8d8d]">Overall AV Tech Area Lead</dt>
                        <dd className="mt-0.5 text-[#f4f4f4]">Akira Saito · <a href="tel:+17022929736" className="text-[#78a9ff] hover:text-white">702-292-9736</a></dd>
                      </div>
                      <div>
                        <dt className="text-[#8d8d8d]">Video</dt>
                        <dd className="mt-0.5 text-[#f4f4f4]">Manny Godley · <a href="tel:+15042369571" className="text-[#78a9ff] hover:text-white">504-236-9571</a></dd>
                      </div>
                      <div>
                        <dt className="text-[#8d8d8d]">Audio</dt>
                        <dd className="mt-0.5 text-[#f4f4f4]">Chris Schutz · <a href="tel:+16152896204" className="text-[#78a9ff] hover:text-white">615-289-6204</a></dd>
                      </div>
                    </dl>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h4 className="text-sm font-semibold text-white">Building C</h4>
                    <dl className="mt-3 space-y-3 text-sm">
                      <div>
                        <dt className="text-[#8d8d8d]">Overall AV Tech Area Lead</dt>
                        <dd className="mt-0.5 text-[#f4f4f4]">Shawn Monahan · <a href="tel:+16138848794" className="text-[#78a9ff] hover:text-white">613-884-8794</a></dd>
                      </div>
                      <div>
                        <dt className="text-[#8d8d8d]">Video</dt>
                        <dd className="mt-0.5 text-[#f4f4f4]">Allen Erjavec · <a href="tel:+18476021127" className="text-[#78a9ff] hover:text-white">847-602-1127</a></dd>
                      </div>
                      <div>
                        <dt className="text-[#8d8d8d]">Audio</dt>
                        <dd className="mt-0.5 text-[#f4f4f4]">James Whitten · <a href="tel:+15049316663" className="text-[#78a9ff] hover:text-white">504-931-6663</a></dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="border-t border-white/[0.06] bg-[#161616] px-5 py-4 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d8d8d]">Technical directors · if you cannot reach an area lead</p>
                  <div className="mt-2 flex flex-col gap-2 text-sm text-[#f4f4f4] sm:flex-row sm:gap-6">
                    <span>Will Johnson · <a href="tel:+14805106156" className="text-[#78a9ff] hover:text-white">480-510-6156</a></span>
                    <span>Martin Szymanski · <a href="tel:+19177710646" className="text-[#78a9ff] hover:text-white">917-771-0646</a></span>
                  </div>
                </div>
              </section>
            </section>
          </>
        ) : (
          <>

        {/* Agenda filters */}
        <section id="main-txc" aria-labelledby="session-filters-heading" className="mb-10 scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.06] bg-[#161616]">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="session-filters-heading" className="text-sm font-semibold text-white">Search</h2>
              <p className="flex flex-wrap items-center gap-x-2 text-xs">
                <span className="text-[#a6c8ff]">{selectedFilterSummary}</span>
                <span className="text-[#8d8d8d]">Showing {filtered.length} of {sessions.length} sessions</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CopySectionLink id="main-txc" label="TechXchange overview page" />
              <button
                onClick={() => setShowFilters(current => !current)}
                aria-expanded={showFilters}
                aria-controls="session-filter-controls"
                className="shrink-0 rounded-md border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#a6c8ff] transition-colors hover:border-[#4589ff]/60 hover:bg-[#0f62fe]/15 hover:text-white"
              >
                {showFilters ? 'Hide search' : 'Show search'}
              </button>
            </div>
          </div>
          {showFilters && (
          <div id="session-filter-controls" className="border-t border-white/[0.06] p-3">
          <section
            id="sessions-day-type-filters"
            aria-label="Day and session type filters"
            className="scroll-mt-28 rounded-xl border border-white/[0.06] bg-[#262626] p-3"
          >
            <div className="mb-2 flex justify-end">
              <CopySectionLink id="sessions-day-type-filters" label="Day and session type filters" />
            </div>
            <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium uppercase tracking-widest text-[#8d8d8d]">Days</span>
              <button
                onClick={() => setActiveDays(prev => prev.size === days.length ? new Set() : new Set(days))}
                aria-pressed={activeDays.size === days.length}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  activeDays.size === days.length
                    ? 'border-[#0f62fe] bg-[#0f62fe] text-white'
                    : 'border-white/[0.08] bg-[#393939] text-[#c6c6c6] hover:border-[#0f62fe]/50 hover:text-white'
                }`}
              >
                All
                <span className={`rounded-full px-1.5 py-0.5 font-mono text-xs ${
                  activeDays.size === days.length ? 'bg-white/20 text-white' : 'bg-white/[0.05] text-[#8d8d8d]'
                }`}>
                  {typeFiltered.length}
                </span>
              </button>
              {days.map(day => {
                const isActive = activeDays.has(day)
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'border-[#0f62fe]/50 bg-[#0f62fe]/15 text-white'
                        : 'border-white/[0.06] bg-[#262626] text-[#8d8d8d] hover:border-white/[0.12] hover:text-[#c6c6c6]'
                    }`}
                  >
                    <span>{dayAbbreviations[day]}</span>
                    <span className={`rounded-full px-1.5 py-0.5 font-mono text-xs ${isActive ? 'bg-[#0f62fe]/25 text-[#a6c8ff]' : 'bg-white/[0.05] text-[#8d8d8d]'}`}>
                      {countForDay(day)}
                    </span>
                  </button>
                )
              })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium uppercase tracking-widest text-[#8d8d8d]">Types</span>
              <button
                onClick={() => setActiveTypes(prev => prev.size === allTypes.length ? new Set() : new Set(allTypes))}
                aria-pressed={activeTypes.size === allTypes.length}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  activeTypes.size === allTypes.length
                    ? 'border-[#0f62fe] bg-[#0f62fe] text-white'
                    : 'border-white/[0.08] bg-[#393939] text-[#c6c6c6] hover:border-[#0f62fe]/50 hover:text-white'
                }`}
              >
                All
                <span className={`rounded-full px-1.5 py-0.5 font-mono text-xs ${
                  activeTypes.size === allTypes.length ? 'bg-white/20 text-white' : 'bg-white/[0.05] text-[#8d8d8d]'
                }`}>
                  {speakerFiltered.filter(session => activeDays.has(session.day)).length}
                </span>
              </button>
              {allTypes.map(type => {
                const cfg = typeConfig[type]
                const isActive = activeTypes.has(type)
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    title={cfg.label}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all duration-150
                      ${isActive
                        ? `${cfg.color} ${cfg.bg}`
                        : 'border-white/[0.06] bg-transparent text-[#8d8d8d] hover:border-white/[0.12] hover:text-[#c6c6c6]'
                      }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? cfg.dot : 'bg-[#8d8d8d]'}`} />
                    {typeAbbreviations[type]}
                    <span className={`rounded-full px-1.5 py-0.5 font-mono text-xs ${
                      isActive ? 'bg-white/10 text-current' : 'bg-white/[0.05] text-[#8d8d8d]'
                    }`}>
                      {speakerFiltered.filter(session => session.type === type && activeDays.has(session.day)).length}
                    </span>
                  </button>
                )
              })}
              </div>
            </div>
            <aside
              aria-label="QR code to view all sessions"
              className="flex shrink-0 self-stretch items-center justify-center gap-3 border-l border-white/[0.08] pl-4"
            >
              <a
                href="http://ibm.biz/techxchange-business-automation"
                target="_blank"
                rel="noreferrer"
                className="hidden text-right text-sm font-semibold leading-tight text-[#a6c8ff] transition-colors hover:text-white sm:block"
              >
                View BA<br />sessions
              </a>
              <div className="rounded-md bg-white p-1.5">
                <img
                  src={asset('view-all-sessions-qr.png')}
                  alt="QR code to view all Business Automation sessions"
                  className="h-16 w-16"
                />
              </div>
            </aside>
            </div>
          </section>
          <section
            id="sessions-speaker-filters"
            aria-label="Speaker filters"
            className="mt-3 scroll-mt-28 rounded-xl border border-white/[0.06] bg-[#262626] px-3 py-2"
          >
            <div className="mb-1 flex justify-end">
              <CopySectionLink id="sessions-speaker-filters" label="Speaker filters" />
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <p className="shrink-0 text-xs font-medium uppercase tracking-widest text-[#8d8d8d]">Speakers</p>
                <div className="flex flex-wrap gap-2">
                  {featuredSpeakers.map(speaker => {
                    const isActive = activeSpeakers.has(speaker.name)
                    const count = sessions.filter(session =>
                      activeDays.has(session.day) &&
                      activeTypes.has(session.type) &&
                      hasSpeaker(session, speaker.name)
                    ).length
                    return (
                      <button
                        key={speaker.name}
                        onClick={() => toggleSpeaker(speaker.name)}
                        aria-pressed={isActive}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'border-[#0f62fe]/60 bg-[#0f62fe]/20 text-[#a6c8ff]'
                            : 'border-white/[0.06] bg-transparent text-[#8d8d8d] hover:border-white/[0.12] hover:text-[#c6c6c6]'
                        }`}
                      >
                        {speaker.label}
                        <span className={`rounded-full px-1.5 py-0.5 font-mono text-xs ${
                          isActive ? 'bg-[#0f62fe]/25 text-[#a6c8ff]' : 'bg-white/[0.05] text-[#8d8d8d]'
                        }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
          </div>
          )}
        </section>

        {/* Sessions grouped by day */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#8d8d8d] text-sm">
            No sessions match the selected filters.
          </div>
        ) : (
          <div className="space-y-8">
            {days.filter(day => activeDays.has(day)).map(day => {
              const daySessions = filtered
                .filter(session => session.day === day)
                .sort((a, b) => startTimeInMinutes(a.time) - startTimeInMinutes(b.time))
              if (daySessions.length === 0) return null

              const [dayName, date] = dayLabels[day].split(' · ')
              const dayId = `sessions-${day.replaceAll(' ', '-').toLowerCase()}`
              return (
                <section
                  key={day}
                  id={dayId}
                  aria-labelledby={`heading-${day.replaceAll(' ', '-').toLowerCase()}`}
                  className="scroll-mt-28 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#161616] shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex items-end justify-between gap-4 border-b border-[#4589ff]/20 bg-gradient-to-r from-[#0f62fe]/15 via-[#0f62fe]/[0.04] to-transparent px-5 py-4 shadow-[inset_3px_0_0_#4589ff] sm:px-6">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">{date}</p>
                      <h2
                        id={`heading-${day.replaceAll(' ', '-').toLowerCase()}`}
                        className="text-xl font-semibold text-white sm:text-2xl"
                      >
                        {dayName}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopySectionLink id={dayId} label={`${dayName} sessions`} />
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-[#c6c6c6]">
                        {countForDay(day)} {countForDay(day) === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 p-4 sm:p-5">
                    {daySessions.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        expanded={expandedIds.has(session.id)}
                        onToggle={() => toggleExpand(session.id)}
                        showSpeakerIndicators
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
          </>
        )}

        <footer className="mt-12 grid grid-cols-1 items-center gap-2 border-t border-white/[0.04] pt-6 text-xs text-[#8d8d8d] sm:grid-cols-3">
          <div className="flex flex-wrap items-center gap-x-2 justify-self-start">
            <button
              type="button"
              onDoubleClick={() => setShowThomasImage(true)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setShowThomasImage(true)
                }
              }}
              title="Double-click to display image"
              aria-label="Thomas Yang. Double-click to display image."
              className="rounded text-left transition-colors hover:text-[#c6c6c6] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4589ff]/60"
            >
              Thomas Yang
            </button>
            <span className="whitespace-nowrap">· {pagePublishIdentifier}</span>
            {siteAccessCount !== null && (
              <span className="whitespace-nowrap" title="Total site accesses">
                · {siteAccessCount.toLocaleString('en-US')} {siteAccessCount === 1 ? 'visit' : 'visits'}
              </span>
            )}
          </div>
          <span className="whitespace-nowrap text-center">IBM Business Automation</span>
          <span className="justify-self-end">
            <button
              type="button"
              onDoubleClick={() =>
                window.open('https://github.com/IBM/business-automation-pm', '_blank', 'noopener,noreferrer')
              }
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  window.open('https://github.com/IBM/business-automation-pm', '_blank', 'noopener,noreferrer')
                }
              }}
              title="Double-click to open the GitHub repository"
              aria-label="Go Blue! Double-click to open the GitHub repository in a new tab."
              className="rounded text-right font-semibold text-[#00274c] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4589ff]/60"
            >
              Go Blue!
            </button>
          </span>
        </footer>
      </main>
      {showThomasImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Michigan football image"
          onMouseDown={event => {
            if (event.currentTarget === event.target) setShowThomasImage(false)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
        >
          <div className="relative max-h-full max-w-2xl overflow-hidden rounded-xl border border-white/[0.12] bg-[#161616] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <button
              type="button"
              autoFocus
              onClick={() => setShowThomasImage(false)}
              aria-label="Close image"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.15] bg-black/65 text-white transition-colors hover:border-white/[0.3] hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a9ff]"
            >
              <CloseIcon />
            </button>
            <img
              src={asset('goblue.png')}
              alt="Michigan football helmet and maize block M jersey against a dark blue background"
              className="max-h-[88vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
