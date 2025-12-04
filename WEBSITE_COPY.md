# Walking Stick Labs - Website Copy

---

## HOME PAGE

### Navigation
- Chapter 1: ORIGIN
- Chapter 2: TOOL
- Chapter 3: ASCENT
- Chapter 4: SYSTEM
- Chapter 5: FUTURE

### Section 1: The Dreamtime (ORIGIN)
**Chapter Label:** Chapter I : The Dreamtime

**Headline:**
In the beginning,  
there was void.

**Subhead:** From the void came humans.

---

### Section 2: The Stick (TOOL)
**Lead:**
And from humans came the first technology:

**Title:**
THE STICK

**Body Copy:**
A tool that let us leave the ground,  
cross new terrain,  
and discover what we couldn't reach alone.

---

### Section 3: Shared Learning (ASCENT)
**Section Label:** Shared Learning

**Quote:**
"A tool learns from the world through us."

**Body Copy:**
As we reached higher, we learned something simple and powerful. Through shared learning, it carries us beyond our old limits.

---

### Section 4: The Lab (SYSTEM)
**Title:** Walking Stick Labs

**Tagline:** System Architecture & Intelligence

**Body Copy:**
Today, we're building the next version of that tool. One that pushes us beyond our current limits and into new realities.

---

### Section 5: Call to Action (FUTURE)
**Title:** Come walk with us.

**Buttons:**
- Our Work
- Our Story  
- Learn More

**Footer:**
San Francisco — CA, Beijing — CN  
© Walking Stick Labs

---

## OUR WORK PAGE (Projects Overview)

### Navigation
- ← Walking Stick Labs

### Hero Section
**Title:** Our Work

**Subtitle:** Deep research at the intersection of AI and spatial intelligence

---

### Project Card 1: Spatial Lab
**Title:** Spatial Lab

**Description:**
Teaching AI to understand space through pure reasoning — no vision, no sensors, just language and logic.

**Tags:**
- Python
- AI Research
- Simulation

**Link:** Explore

---

### Project Card 2: What's In The Room
**Title:** What's In The Room

**Description:**
Testing whether vision-language models can deduce hidden rooms from architectural context alone.

**Tags:**
- Vision AI
- Spatial Reasoning
- Synthetic Data

**Link:** Explore

---

## CASE STUDY: SPATIAL LAB

### Navigation
- ← Walking Stick Labs
- View Code →

### Hero Section
**Label:** Case Study

**Title:** Spatial Lab

**Subtitle:**
Teaching AI to understand space — not through vision, but through reasoning

**Tags:**
- Python
- AI Research
- Spatial Intelligence
- Simulation

---

### Section 1: Hypothesis (Window: Hypothesis.md)
**Section Label:** The Question

**Quote:**
"Can an AI that's only ever read words understand how to move through a room?"

**Body Copy:**
Language models learn from text alone — they've never walked through a room or moved an object. Yet somehow, they can often answer spatial questions correctly. This experiment explores a simple question: how far does that understanding actually go?

#### Expanded Content: Research Context
Traditional robotics relies on SLAM (Simultaneous Localization and Mapping) and explicit geometric planning. While robust, these systems lack semantic understanding. They know "obstacle at (x,y)" but not "that is a chair, I should move it."

Large Language Models (LLMs) have demonstrated remarkable reasoning capabilities in text. Our hypothesis posits that this reasoning can be grounded in spatial environments without visual training, using coordinate-based prompts to build an internal "mental map."

#### Experimental Setup
- Model: GPT-4 / Gemini Pro
- Input: JSON Grid State
- Output: Action Vector (x, y)
- Metric: Path Optimality %

---

### Section 2: System Architecture (Window: System_Architecture.canvas)
**Section Label:** System Architecture

**Title:** How it works

**Diagram Labels:**
- LLM Reasoning (GPT-4 / Gemini processing spatial context)
- Action Space (Discrete movement primitives)
- Coordination (Multi-agent conflict resolution)
- State Memory (Grid occupancy tracking)
- Simulation (Physics & Environment Update)

---

### Section 3: Building Blocks (Window: Components.json)
**Section Label:** The Building Blocks

**Title:** What powers the experiment

#### Component 1: A World to Live In
A simulated grid environment where every position, obstacle, and path is visible. Small enough to hold in your head, detailed enough to reveal meaningful patterns.

**Path:** environments/ — simulation engine

#### Component 2: Movement & Coordination
Multiple agents moving through shared space, avoiding collisions, finding paths, and working together — or getting in each other's way.

**Path:** coordination/ — path planning

#### Component 3: The AI Mind
Language models (GPT-4, Gemini) receive descriptions of the world and decide how to act. They see coordinates and consequences. Then they choose.

**Path:** llm/ — reasoning engine

#### Component 4: Measuring Truth
Every experiment runs with controls, statistics, and reproducibility. The goal isn't to prove anything — it's to see what's actually there.

**Path:** evaluation/ — validation

---

### Section 4: Results (Window: Results_Dashboard.py)
**Section Label:** What We Found

**Title:** The numbers tell a story

#### Metrics
- **85%** - Found Good Paths
- **92%** - Avoided Collisions
- **81%** - Worked Together
- **+18.7%** - vs. Baseline

#### Compared to Others
- Random (no thinking): 30% success
- Simple rules: 60% success
- With LLM reasoning: 85% success

#### Is it Real?
- Without LLM reasoning: 69.5% avg
- With LLM reasoning: 82.5% avg
- Statistical significance: p < 0.001

#### Expanded Content: Detailed Analysis
The data reveals a clear hierarchy of capability. While heuristic methods (A*) are optimal for single-agent pathfinding, they fail in dynamic multi-agent scenarios without complex conflict resolution logic. The LLM agents, however, demonstrated emergent cooperative behavior—waiting for others to pass, choosing alternate routes to avoid congestion—without explicit programming. This suggests that "common sense" reasoning from language training transfers to spatial negotiation.

---

### Section 5: Limitations (Window: TODO.md)
**Section Label:** Honest Assessment

**Title:** What we know we don't know

#### Current State
- LLM integration framework operational
- Multi-robot coordination validated
- Statistical validation framework
- Reproducible experiment runners

#### In Progress
- Full A* pathfinding implementation
- Multi-agent conflict resolution
- Automated test coverage
- Production hardening

---

### Section 6: Codebase (Window: Codebase_Structure.svg)
**Section Label:** Codebase

**Title:** Explore the implementation

**Description:**
Built in Python for research clarity. Open and reproducible.

**File Structure:**
- environments/
  - warehouse.py (Layout generation, physics)
- coordination/
  - fleet.py (Robot management)
  - pathfinding.py (A*, collision avoidance)
  - communication.py (Inter-robot messaging)
- llm/
  - gemini.py (Google Gemini client)
  - openai.py (GPT-4 client)
- evaluation/
  - metrics.py (Performance measurement)
  - statistics.py (Significance testing)
- config.py (Experiment configuration)

---

## CASE STUDY: WHAT'S IN THE ROOM

### Navigation
- ← Walking Stick Labs
- View Code →

### Hero Section
**Label:** Case Study

**Title:** What's In The Room

**Subtitle:**
Testing whether AI can understand architecture — by hiding one room and asking it to guess

**Tags:**
- Python
- Vision AI
- Spatial Reasoning
- Synthetic Data

---

### Section 1: Hypothesis (Window: Hypothesis.md)
**Section Label:** The Question

**Quote:**
"If you hide one room in a floorplan, can AI figure out what it is just by looking at everything else?"

**Body Copy:**
Humans use context constantly. A small room next to the master bedroom is probably a closet. A room with a door to the outside might be a garage. Can vision-language models pick up on these spatial relationships — or do they just see pixels?

---

### Section 2: The Experiment (Window: Experiment_Flow.canvas)
**Section Label:** The Experiment

**Title:** How we tested it

**Diagram Labels:**
- Generate (Create authentic floorplan)
- Hide (Mask one ambiguous room)
- Ask (Query VLM to identify)
- Measure (Precision, Recall, F1)

---

### Section 3: Building Blocks (Window: Components.json)
**Section Label:** The Building Blocks

**Title:** What powers the experiment

#### Component 1: Infinite Floorplans
Procedural generation creates unlimited unique layouts. No external datasets needed — every floorplan is synthesized from architectural rules and regional constraints.

**Path:** src/generation/ — layout synthesis

#### Component 2: Regional Architecture
US suburbs have attached garages. Chinese apartments have shoe rooms. European flats have different proportions. The generator knows these rules.

**Scale:** 6+ architectural regions

#### Component 3: Deterministic Seeds
Every experiment is reproducible. Same seed, same floorplan. This lets us isolate variables and trust our results.

**Feature:** Full reproducibility

#### Component 4: Ambiguity by Design
We don't hide obvious rooms. We pick closets, offices, storage rooms — spaces that require reasoning about neighbors and context.

**Path:** src/inference/ — mystery selection

---

### Section 4: Results (Window: Results_Analysis.py)
**Section Label:** What We Found

**Title:** The numbers tell a story

#### Metrics
- **1000s** - Floorplans Tested
- **6+** - Architectural Regions
- **F1/P/R** - Per Room Type
- **100%** - Reproducible

#### What Models Got Right
- Bathrooms: High confidence
- Kitchens: Size + proximity
- Living rooms: Central, large

#### Where Models Struggled
- Closets vs. Storage: Similar size
- Office vs. Guest Bedroom: Context-dependent
- Regional variations: Cultural norms

---

### Section 5: Limitations (Window: TODO.md)
**Section Label:** Known Limitations

**Title:** What this doesn't tell us

#### What We Can't Claim
Models may rely on visual artifacts (e.g., door placement, annotation style) rather than true spatial reasoning.

#### Next Steps
- Ablation studies isolating cues
- Testing with varied visual styles
- Human baseline comparisons
- Multi-modal architecture analysis

---

### Section 6: Codebase (Window: Codebase_Files.svg)
**Section Label:** Codebase

**Title:** Explore the implementation

**Description:**
Pure Python. Zero external datasets. Fully procedural.

**File Structure:**
(Similar structure to Spatial Lab, adapted for floorplan generation)

---

## FOOTER (Global)

**Locations:**
San Francisco — CA, Beijing — CN

**Copyright:**
© Walking Stick Labs

---

## END OF COPY DOCUMENT
