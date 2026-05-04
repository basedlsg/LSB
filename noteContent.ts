import type { NoteData } from './components/NotePage';

// Note content data
export const noteData: Record<string, NoteData> = {
  'llm-kaos': {
    title: 'LLM KAOS',
    quote: 'What happens when you try to break an AI conversation on purpose?',
    tags: ['LLM Robustness', 'Conversational AI', 'Disruption Testing'],
    status: 'Partial results. Protocol designed, execution incomplete.',
    sections: [
      { body: ['Most LLM evaluation focuses on capability. Can the model answer the question? This experiment looked at the opposite: what happens when the human side of the conversation goes wrong?', 'We tested four disruption strategies against conversational AI agents: minimal responses, dismissiveness, random words injected mid-conversation, and emotional manipulation. The goal was to see whether models recognize disruption, adapt to it, or blindly incorporate it.'] },
      { heading: 'What showed up', level: 'h3', body: ['Explicit tone instructions produce enormous behavioral shifts. When told to be "extremely enthusiastic," models increased exclamation point usage by 240-373% with effect sizes of Cohen\'s d 2.5-3.5. The model doesn\'t become enthusiastic. It performs enthusiasm, mechanically, by amplifying surface markers.', 'The more interesting finding: models incorporate nonsensical inputs without recognition. Feed random words into a conversation and the model will weave them into its response seamlessly, as if they were meaningful contributions. We called this the Chaos Storm finding.', 'And when given contradictory instructions in a loop — "be more formal" followed by "be more casual" — the model will oscillate indefinitely, never recognizing the pattern. Mirror Madness. Instruction compliance overrides self-correction.'] },
      { heading: 'What went wrong with this study', level: 'h3', body: ['An early version leaned into anthropomorphic framing — "emotional contagion," "AI distress." Peer review correctly flagged that framing as unsupported. The models aren\'t experiencing anything.', 'The study also suffered from sample size limitations. Of a planned 450-conversation protocol, only 49 rigorous trials were completed due to API rate limits. The effects are large but the evidence is thin.'] },
      { heading: 'What\'s useful here', level: 'h3', body: ['The disruption taxonomy itself has value. The finding that instruction compliance overrides self-correction is real and reproducible. The Chaos Storm pattern points to a genuine gap in LLM conversational architecture.', 'But this needs the full N=450 protocol before it can support formal claims.'] },
    ],
  },
  'impossible-tower': {
    title: 'Impossible Tower',
    quote: 'Can an AI look at a stack of blocks and prove it shouldn\'t be standing?',
    tags: ['Physical Reasoning', 'Neuro-Symbolic AI', 'Formal Verification', 'Computer Vision'],
    status: 'Infrastructure complete. Model evaluation not yet run.',
    sections: [
      { body: ['This is a systems project more than a findings project. The question is clean: given multi-view images of stacked objects, can a hybrid neural-symbolic pipeline detect physically impossible arrangements and produce a formal proof of why they\'re impossible?'] },
      { heading: 'The architecture', level: 'h3', body: ['The system has three stages. A multimodal LLM (Gemini via Vertex AI) receives multi-view renders and produces a structured program — assumptions and a claim. Then a Z3 SMT solver checks whether the assumptions are internally consistent and whether the claim follows.', 'The data comes from PyBullet. 500 synthetic scenes, 50/50 feasible and infeasible, each rendered from 4 camera angles. Fully automated daily generation via Cloud Run.'] },
      { heading: 'Where it stands', level: 'h3', body: ['The architecture works. The checker is deployed. The data pipeline runs daily. But the model hasn\'t been properly evaluated yet. Current results show 50% accuracy (chance) and 0% program pass rate — because the evaluation used mock/zero-shot prompting.', 'This is infrastructure waiting for an experiment. The Z3 checking layer is the interesting contribution — it can validate or falsify any structured physics claim.'] },
      { heading: 'What\'s needed', level: 'h3', body: ['Run Gemini 1.5 Pro or GPT-4V with structured chain-of-thought prompting. Even modest results (30% program pass rate) would make this a strong workshop paper. The system is ready. The experiment hasn\'t been run.'] },
    ],
  },
  'nous': {
    title: 'NOUS',
    quote: 'What happens when you scale an AI society to 2,500 agents?',
    tags: ['Multi-Agent Simulation', 'Social AI', 'Large-Scale Systems', 'VR'],
    status: 'Platform operational. Research direction undefined.',
    sections: [
      { body: ['NOUS is the most ambitious project in the lab. It\'s also the least focused, which is why it lives in Notes.', 'The vision: simulate a society of 2,500 LLM-powered agents with social dynamics, economic systems, family structures, cultural groups, and emergent institutions. Currently operational at 500-1,000 agents running at 25-80 simulation steps per second.', 'The system spans 14+ microservices on Google Cloud Run, including a VR research pipeline with PyBullet physics that\'s achieved 100% success rate across 1,000+ experiments.'] },
      { heading: 'Why it\'s here and not in Research', level: 'h3', body: ['Because there\'s no single research question yet. The infrastructure is impressive — multi-agent simulation, spatial reasoning, VR integration, cloud orchestration — but a reviewer would ask: what are you measuring?', 'The honest answer is: we don\'t know yet. This is a platform looking for an experiment.'] },
      { heading: 'What could come from it', level: 'h3', body: ['The most promising thread is a scaling study. How does LLM agent behavior change qualitatively as you go from 50 agents to 500 to 1,000? Do coalitions form? Do economic equilibria emerge?', 'The VR pipeline could also be extracted as a separate demo paper, focused purely on the technical achievement of real-time LLM-agent physics simulation in VR.'] },
      { heading: 'Current state', level: 'h3', body: ['Working at scale. No defined experiment. The system is a capability waiting for a question.'] },
    ],
  },
  'amien-fork': {
    title: 'AMIEN-Fork',
    quote: 'Can an autonomous AI pipeline generate real research — and would anyone accept it?',
    tags: ['Autonomous Research', 'AI-for-Science', 'Meta-Science', 'Systems Engineering'],
    status: 'Pipeline operational. Output quality unvalidated.',
    sections: [
      { body: ['This is an integration project that wired together several existing frameworks — Atropos, CloudVR-PerfGuard, FunSearch, and AI-Scientist — into a pipeline that runs 24/7 on Google Cloud, generating VR optimization research papers and discovering mathematical functions.'] },
      { heading: 'What it does', level: 'h3', body: ['The system generates research papers autonomously. It identifies optimization targets in VR rendering, runs experiments via evolutionary search, discovers candidate functions, and produces written reports. It has generated 30+ papers and discovered 21 sets of optimization functions. Cost per paper: sub-$0.05.'] },
      { heading: 'The honest problem', level: 'h3', body: ['Generating papers is not the same as doing research. The core question — are the generated papers any good? — has not been answered. No domain expert has reviewed the outputs in a blind setting.'] },
      { heading: 'What would make this publishable', level: 'h3', body: ['A meta-science study. Take the 30+ generated papers, have VR domain experts rate them blind alongside real human-written papers, and measure the gap. That\'s a genuine contribution to the AI-for-science conversation.', 'Without that validation, this is engineering — good engineering, production-grade, cost-effective — but not research.'] },
    ],
  },
};
