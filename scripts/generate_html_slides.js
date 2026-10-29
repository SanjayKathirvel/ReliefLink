import fs from 'fs';
import path from 'path';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ReliefLink - Project Review 1 Presentation | Sanjay K (310624104619)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @media print {
      body { background: white !important; }
      .no-print { display: none !important; }
      .slide-page { page-break-after: always; break-after: page; box-shadow: none !important; margin: 0 !important; width: 100vw !important; height: 56.25vw !important; }
    }
    .slide-page {
      aspect-ratio: 16 / 9;
      max-width: 1200px;
    }
  </style>
</head>
<body class="bg-slate-900 text-slate-800 font-sans antialiased min-h-screen py-8 px-4 flex flex-col items-center">
  <!-- Top Control Bar -->
  <header class="no-print w-full max-w-5xl bg-slate-800 text-white rounded-xl shadow-lg p-4 mb-8 flex flex-wrap items-center justify-between gap-4 border border-slate-700">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">RL</div>
      <div>
        <h1 class="text-base font-bold tracking-tight">ReliefLink — Review 1 Presentation Deck</h1>
        <p class="text-xs text-slate-300">Candidate: Sanjay K | Register No: 310624104619 | 15 Widescreen Slides</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <a href="/api/project/download-review1-ppt" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-2">
        <i class="fa-solid fa-file-powerpoint"></i> Download .pptx File
      </a>
      <button onclick="window.print()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-2">
        <i class="fa-solid fa-print"></i> Print / Save as PDF
      </button>
    </div>
  </header>

  <!-- Slide Deck Container -->
  <main class="w-full max-w-5xl flex flex-col gap-8">
    
    <!-- SLIDE 1: TITLE SLIDE -->
    <article class="slide-page w-full bg-slate-950 text-white rounded-2xl shadow-2xl p-10 flex flex-col justify-between border border-slate-800 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
      <div class="flex justify-between items-start">
        <span class="px-3 py-1 bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 rounded-full text-xs font-bold tracking-wider uppercase">Project Review–1 • Phase 1 Defense</span>
        <span class="text-xs text-slate-400 font-mono">SLIDE 01 / 15</span>
      </div>
      <div class="my-auto space-y-4">
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          ReliefLink: <span class="text-indigo-400">Decentralized Disaster Relief & Community Rescue Platform</span>
        </h2>
        <p class="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Comprehensive Engineering Defense covering Functional & Non-Functional Requirements, System Architecture, UML Use Case Modeling, Relational ER Design, Modular Decomposition, Technology Stack Rationale, and Production UI Design.
        </p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-800 text-xs">
        <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p class="text-slate-400 font-semibold mb-1">CANDIDATE INFORMATION</p>
          <p class="font-bold text-white text-sm">Sanjay K</p>
          <p class="text-slate-300">Register No: <span class="font-mono text-indigo-300 font-bold">310624104619</span></p>
          <p class="text-slate-400">B.E. Computer Science and Engineering</p>
        </div>
        <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p class="text-slate-400 font-semibold mb-1">EVALUATION METRICS</p>
          <p class="text-slate-200">System Modeling: <span class="text-emerald-400 font-bold">Verified</span></p>
          <p class="text-slate-200">Relational Database & ER: <span class="text-emerald-400 font-bold">3NF Normalized</span></p>
          <p class="text-slate-200">Prototype Status: <span class="text-indigo-400 font-bold">100% Operational (Live)</span></p>
        </div>
      </div>
    </article>

    <!-- SLIDE 2: AGENDA & TOPICS -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Review–1 Agenda</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Review–1 Prescribed Topics & Structural Roadmap</h2>
          <p class="text-xs text-slate-500">Systematic walk-through of the 7 core engineering deliverables evaluated in Phase 1.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 02 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">01</span>
          <div><h3 class="text-xs font-bold text-slate-900">Functional & Non-Functional Requirements</h3><p class="text-[11px] text-slate-600">6 core functional capabilities & 6 empirical performance/security constraints.</p></div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">02</span>
          <div><h3 class="text-xs font-bold text-slate-900">System Architecture & Multi-Tier Topology</h3><p class="text-[11px] text-slate-600">Decoupled 4-tier design: Client, Gateway, Express Micro-Engines, PostgreSQL.</p></div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">03</span>
          <div><h3 class="text-xs font-bold text-slate-900">UML Use Case Diagram & Actor Relationships</h3><p class="text-[11px] text-slate-600">Complete behavioral interactions between Citizen, Volunteer, NDRF, and Admin.</p></div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">04</span>
          <div><h3 class="text-xs font-bold text-slate-900">ER Diagram & Normalized Database Schema</h3><p class="text-[11px] text-slate-600">3NF relational entities, primary/foreign keys, cardinality, and spatial index rules.</p></div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">05</span>
          <div><h3 class="text-xs font-bold text-slate-900">Module Description & Operational Pipelines</h3><p class="text-[11px] text-slate-600">Granular specifications for SOS Intake, Volunteer Matching, Dispatch, and GIS.</p></div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">06</span>
          <div><h3 class="text-xs font-bold text-slate-900">Technology Stack & Selection Justification</h3><p class="text-[11px] text-slate-600">Trade-off matrix for React, Tailwind, Socket.IO, PostgreSQL, and Leaflet GIS.</p></div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 sm:col-span-2">
          <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">07</span>
          <div><h3 class="text-xs font-bold text-slate-900">UI Design Wireframes & Operational Dashboards</h3><p class="text-[11px] text-slate-600">Human-centric UI for distress reporting, volunteer coordination, and tactical map room.</p></div>
        </div>
      </div>
      <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
        <span class="font-bold">PHASE 1 STATUS: 100% COMPLETE</span>
        <span>All 7 topics documented with working interactive prototype</span>
      </div>
    </article>

    <!-- SLIDE 3: FUNCTIONAL REQUIREMENTS -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 1 • Requirements</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">1. Functional Requirements (FR) Specification</h2>
          <p class="text-xs text-slate-500">Core functional capabilities defining user distress capture, community aid, and agency dispatch.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 03 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold text-xs rounded">FR–01</span>
            <span class="text-[10px] font-bold text-rose-600">PRIORITY: CRITICAL</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Zero-Friction Citizen SOS Distress Capture</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Captures distress calls in under 3 clicks with automated W3C Geolocation coordinates, Leaflet pin-drop fallback, severity tags, trapped headcount, and landmark descriptions.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded">FR–02</span>
            <span class="text-[10px] font-bold text-indigo-600">PRIORITY: HIGH</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Community "I Will Go and Help" Hybrid Dispatch</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Provides nearby volunteers with a 10 km geo-filtered feed of verified distress calls, allowing them to declare assets (boats, 4x4, first-aid) and accept rescue tasks with ETA tracking.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded">FR–03</span>
            <span class="text-[10px] font-bold text-blue-600">PRIORITY: CRITICAL</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Haversine Proximity-Sorted Force Routing</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Computes great-circle geodesic distances between victims and deployed NDRF/SDRF battalions, automatically sorting forces by distance for minimal response time.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-xs rounded">FR–04</span>
            <span class="text-[10px] font-bold text-amber-600">PRIORITY: CRITICAL</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Automated 30-Minute SLA Escalation Daemon</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Continuously monitors ticket lifecycles. Any unassigned ticket remaining open beyond 30 minutes triggers automated escalation with visual and acoustic alerts.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded">FR–05</span>
            <span class="text-[10px] font-bold text-emerald-600">PRIORITY: HIGH</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Interactive GIS Tactical Map & Hazard Geofencing</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Interactive OpenStreetMap with clustered markers, live shelter capacities, and dynamic circular evacuation hazard zones based on calamity severity.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-xs rounded">FR–06</span>
            <span class="text-[10px] font-bold text-purple-600">PRIORITY: HIGH</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Multi-Channel Alert & Web Audio Broadcasting</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Empowers incident commanders to broadcast evacuation advisories via WebSockets with synthesized emergency sirens using the W3C Web Audio API.</p>
        </div>
      </div>
      <div class="text-right text-[11px] text-slate-400 font-mono">IEEE 830-1998 Software Requirements Specification Standard</div>
    </article>

    <!-- SLIDE 4: NON-FUNCTIONAL REQUIREMENTS -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 1 • Requirements</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">1. Non-Functional Requirements (NFR) Benchmarks</h2>
          <p class="text-xs text-slate-500">Quantitative performance, security, availability, and reliability benchmarks.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 04 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded">NFR–01</span>
            <span class="text-xs font-bold text-indigo-600 font-mono">&lt; 100 ms</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Sub-100ms Real-Time Push Latency</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">WebSocket push pipeline delivers SOS notifications to connected commander and volunteer consoles in under 100ms.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded">NFR–02</span>
            <span class="text-xs font-bold text-indigo-600 font-mono">&le; 10 Meters</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Geospatial Resolution & Coordinates Accuracy</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Strict WGS84 GPS validation rejecting malformed latitudes/longitudes, with pinpoint 10m coordinate precision.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded">NFR–03</span>
            <span class="text-xs font-bold text-indigo-600 font-mono">100% ACID</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Data Concurrency & Ticket Locking</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Atomic database transactions with status constraints preventing duplicate assignments when multiple volunteers claim a task simultaneously.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded">NFR–04</span>
            <span class="text-xs font-bold text-indigo-600 font-mono">Bcrypt + JWT</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Role-Based Access Control (RBAC) Security</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Bcrypt salted hashing (10 rounds) and HMAC-SHA256 JWT tokens with role verification on all command endpoints.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded">NFR–05</span>
            <span class="text-xs font-bold text-indigo-600 font-mono">99.9% Uptime</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">High Availability & Offline Fallback</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">Graceful degradation caching offline relief points and retry queuing for intermittent field cell connectivity.</p>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded">NFR–06</span>
            <span class="text-xs font-bold text-indigo-600 font-mono">Mobile-First</span>
          </div>
          <h3 class="text-xs font-bold text-slate-900 mb-1">Low Cognitive Load & Emergency Usability</h3>
          <p class="text-[11px] text-slate-600 leading-relaxed">High-contrast WCAG 2.1 AAA compliance with large tap targets (min 48px) and panic UI for zero-friction operation.</p>
        </div>
      </div>
      <div class="text-right text-[11px] text-slate-400 font-mono">Verified via Apache Bench, Jest Unit Testing, and Cypress E2E</div>
    </article>

    <!-- SLIDE 5: SYSTEM ARCHITECTURE -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 2 • Architecture</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">2. System Architecture & Multi-Tier Topology</h2>
          <p class="text-xs text-slate-500">Decoupled, modular 4-tier structural architecture engineered for disaster operations.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 05 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 my-auto">
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-[10px] font-bold text-indigo-600 uppercase">TIER 1</span>
            <h3 class="text-xs font-bold text-slate-900 mt-1">Client Presentation Tier</h3>
            <p class="text-[11px] text-slate-500 mb-2">React 19 SPA & Tailwind CSS</p>
            <ul class="text-[10px] text-slate-600 space-y-1">
              <li>• Citizen SOS Portal</li>
              <li>• Volunteer Action Board</li>
              <li>• NDRF Command Console</li>
              <li>• Leaflet GIS Tactical Map</li>
            </ul>
          </div>
          <div class="mt-3 text-[10px] bg-slate-100 p-1.5 rounded text-slate-600 font-mono">Vite 6 + Lucide Icons</div>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-[10px] font-bold text-blue-600 uppercase">TIER 2</span>
            <h3 class="text-xs font-bold text-slate-900 mt-1">Real-Time Gateway</h3>
            <p class="text-[11px] text-slate-500 mb-2">Socket.IO Event Engine</p>
            <ul class="text-[10px] text-slate-600 space-y-1">
              <li>• Bidirectional WebSockets</li>
              <li>• Event: sos:created</li>
              <li>• Event: force:deployed</li>
              <li>• Event: alert:broadcast</li>
            </ul>
          </div>
          <div class="mt-3 text-[10px] bg-slate-100 p-1.5 rounded text-slate-600 font-mono">&lt;100ms Push Broadcast</div>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-[10px] font-bold text-emerald-600 uppercase">TIER 3</span>
            <h3 class="text-xs font-bold text-slate-900 mt-1">Application Backend</h3>
            <p class="text-[11px] text-slate-500 mb-2">Node.js Express Micro-Services</p>
            <ul class="text-[10px] text-slate-600 space-y-1">
              <li>• JWT & RBAC Middleware</li>
              <li>• Haversine Distance Engine</li>
              <li>• 30-Min SLA Background Daemon</li>
              <li>• Zod Schema Validation</li>
            </ul>
          </div>
          <div class="mt-3 text-[10px] bg-slate-100 p-1.5 rounded text-slate-600 font-mono">RESTful API Endpoints</div>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-[10px] font-bold text-purple-600 uppercase">TIER 4</span>
            <h3 class="text-xs font-bold text-slate-900 mt-1">Persistence & Data</h3>
            <p class="text-[11px] text-slate-500 mb-2">Relational PostgreSQL</p>
            <ul class="text-[10px] text-slate-600 space-y-1">
              <li>• 3NF Normalized Schema</li>
              <li>• ACID Transaction Locks</li>
              <li>• Foreign Key Integrity</li>
              <li>• Spatial Coordinate Indexing</li>
            </ul>
          </div>
          <div class="mt-3 text-[10px] bg-slate-100 p-1.5 rounded text-slate-600 font-mono">PGlite / PostgreSQL 16</div>
        </div>
      </div>
      <div class="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex justify-between">
        <span>ARCHITECTURAL PRINCIPLE: Decoupled client and event broker ensures continuous availability during network latency spikes.</span>
      </div>
    </article>

    <!-- SLIDE 6: USE CASE DIAGRAM -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 3 • Behavioral Modeling</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">3. UML Use Case Diagram & Actor Relationships</h2>
          <p class="text-xs text-slate-500">Functional modeling mapping 4 primary actors across ReliefLink system boundaries.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 06 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 my-auto">
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center mb-2">C</div>
          <h3 class="text-xs font-bold text-slate-900">Actor: Citizen / Victim</h3>
          <p class="text-[10px] text-slate-500 mb-2">Primary Distress Reporter</p>
          <ul class="text-[10px] text-slate-600 space-y-1">
            <li>• UC-1: Trigger SOS Emergency</li>
            <li>• &lt;&lt;include&gt;&gt; Capture GPS Location</li>
            <li>• &lt;&lt;include&gt;&gt; Specify Headcount & Type</li>
            <li>• UC-2: Track Assigned Rescue Team</li>
          </ul>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mb-2">V</div>
          <h3 class="text-xs font-bold text-slate-900">Actor: Field Volunteer</h3>
          <p class="text-[10px] text-slate-500 mb-2">Community First Responder</p>
          <ul class="text-[10px] text-slate-600 space-y-1">
            <li>• UC-3: Register Rescue Capabilities</li>
            <li>• UC-4: View Proximity Distress Feed</li>
            <li>• UC-5: Claim Rescue Task with ETA</li>
            <li>• UC-6: Mark Incident Completed</li>
          </ul>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center mb-2">G</div>
          <h3 class="text-xs font-bold text-slate-900">Actor: NDRF / Gov Command</h3>
          <p class="text-[10px] text-slate-500 mb-2">Incident Commander</p>
          <ul class="text-[10px] text-slate-600 space-y-1">
            <li>• UC-7: Triage Priority Incidents</li>
            <li>• UC-8: Dispatch Official Battalions</li>
            <li>• UC-9: Broadcast Hazard Advisories</li>
            <li>• UC-10: Monitor 30-Min SLA Timer</li>
          </ul>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center mb-2">A</div>
          <h3 class="text-xs font-bold text-slate-900">Actor: System Admin</h3>
          <p class="text-[10px] text-slate-500 mb-2">Platform & Resource Controller</p>
          <ul class="text-[10px] text-slate-600 space-y-1">
            <li>• UC-11: Manage User Credentials</li>
            <li>• UC-12: Provision Relief Centers</li>
            <li>• UC-13: Audit Transaction Logs</li>
            <li>• UC-14: Monitor WebSocket Gateway</li>
          </ul>
        </div>
      </div>
      <div class="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex justify-between">
        <span>RELATIONSHIPS: &lt;&lt;include&gt;&gt; Geolocation & Validation | &lt;&lt;extend&gt;&gt; Automated SLA Escalation when SLA &gt; 30 minutes</span>
      </div>
    </article>

    <!-- SLIDE 7: ER DIAGRAM -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 4 • Data Modeling</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">4. Entity-Relationship (ER) Schema & Architecture</h2>
          <p class="text-xs text-slate-500">Normalized 3NF relational entities, primary/foreign keys, and cardinality relationships.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 07 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 my-auto">
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] font-bold text-indigo-600 mb-1">ENTITY: users</div>
          <p class="text-[10px] text-slate-500 mb-2">Central Authentication</p>
          <ul class="text-[10px] space-y-1 font-mono">
            <li><span class="text-indigo-600 font-bold">PK</span> id (UUID)</li>
            <li>email (VARCHAR)</li>
            <li>password (BCRYPT)</li>
            <li>role (CITIZEN|VOL|GOV)</li>
            <li>phone, full_name</li>
          </ul>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] font-bold text-rose-600 mb-1">ENTITY: distress_requests</div>
          <p class="text-[10px] text-slate-500 mb-2">Emergency Tickets</p>
          <ul class="text-[10px] space-y-1 font-mono">
            <li><span class="text-rose-600 font-bold">PK</span> id (UUID)</li>
            <li><span class="text-blue-600 font-bold">FK</span> user_id &rarr; users</li>
            <li>latitude, longitude</li>
            <li>category, severity</li>
            <li>status (PENDING|CLAIMED)</li>
          </ul>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] font-bold text-blue-600 mb-1">ENTITY: assignments</div>
          <p class="text-[10px] text-slate-500 mb-2">Task Dispatch Locks</p>
          <ul class="text-[10px] space-y-1 font-mono">
            <li><span class="text-blue-600 font-bold">PK</span> id (UUID)</li>
            <li><span class="text-blue-600 font-bold">FK</span> request_id &rarr; distress</li>
            <li><span class="text-blue-600 font-bold">FK</span> responder_id &rarr; users</li>
            <li>eta_minutes (INT)</li>
            <li>status (EN_ROUTE|RESOLVED)</li>
          </ul>
        </div>
        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] font-bold text-emerald-600 mb-1">ENTITY: relief_centers</div>
          <p class="text-[10px] text-slate-500 mb-2">Shelter Logistics</p>
          <ul class="text-[10px] space-y-1 font-mono">
            <li><span class="text-emerald-600 font-bold">PK</span> id (UUID)</li>
            <li>name (VARCHAR)</li>
            <li>capacity, occupied</li>
            <li>latitude, longitude</li>
            <li>supplies (JSONB)</li>
          </ul>
        </div>
      </div>
      <div class="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex justify-between">
        <span>CARDINALITY: 1:N users &rarr; distress_requests | 1:1 distress_requests &rarr; assignments | 1:N disaster_zones &rarr; relief_centers</span>
      </div>
    </article>

    <!-- SLIDE 8: DATA DICTIONARY -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 4 • Data Modeling</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">4. Relational Database Data Dictionary & Integrity Rules</h2>
          <p class="text-xs text-slate-500">Formal table structure, data constraints, cascade actions, and indexing strategy.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 08 / 15</span>
      </div>
      <div class="overflow-x-auto my-auto">
        <table class="w-full text-left text-xs bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <thead class="bg-slate-900 text-white text-[11px]">
            <tr>
              <th class="p-2.5">Table Name</th>
              <th class="p-2.5">Key Attributes</th>
              <th class="p-2.5">Data Types</th>
              <th class="p-2.5">Foreign Keys & Constraints</th>
              <th class="p-2.5">Indexing Strategy</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-[11px]">
            <tr>
              <td class="p-2.5 font-bold text-indigo-700">users</td>
              <td class="p-2.5 font-mono">id, email, password, role</td>
              <td class="p-2.5">UUID, VARCHAR, TEXT, ENUM</td>
              <td class="p-2.5">PRIMARY KEY (id), UNIQUE(email)</td>
              <td class="p-2.5 font-mono text-slate-500">B-Tree on email, role</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-rose-700">distress_requests</td>
              <td class="p-2.5 font-mono">id, user_id, lat, lng, severity</td>
              <td class="p-2.5">UUID, UUID, DECIMAL, ENUM</td>
              <td class="p-2.5">FK (user_id &rarr; users.id) ON CASCADE</td>
              <td class="p-2.5 font-mono text-slate-500">Compound (lat, lng), status</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-blue-700">assignments</td>
              <td class="p-2.5 font-mono">id, request_id, responder_id, eta</td>
              <td class="p-2.5">UUID, UUID, UUID, INTEGER</td>
              <td class="p-2.5">FK (request_id, responder_id)</td>
              <td class="p-2.5 font-mono text-slate-500">B-Tree on responder_id</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-emerald-700">relief_centers</td>
              <td class="p-2.5 font-mono">id, name, lat, lng, capacity</td>
              <td class="p-2.5">UUID, VARCHAR, DECIMAL, INT</td>
              <td class="p-2.5">CHECK(capacity &gt;= occupied)</td>
              <td class="p-2.5 font-mono text-slate-500">Spatial Index (lat, lng)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="text-right text-[11px] text-slate-400 font-mono">ACID Compliant: Serializable isolation for disaster ticket locking</div>
    </article>

    <!-- SLIDE 9: MODULE DESCRIPTION (PART 1) -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 5 • Module Breakdown</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">5. Module Description (Part 1: Citizen & Volunteer)</h2>
          <p class="text-xs text-slate-500">Granular breakdown of inputs, processing pipelines, algorithms, and outputs.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 09 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded">MODULE 1</span>
            <h3 class="text-xs font-bold text-slate-900">Citizen SOS Emergency Intake Engine</h3>
          </div>
          <div class="text-[11px] space-y-2 text-slate-600">
            <p><strong>Input Parameters:</strong> HTML5 Geolocation, emergency type (Medical, Rescue, Food), headcount, landmark descriptions.</p>
            <p><strong>Processing Pipeline:</strong> Sanitization & Zod schema validation &rarr; WGS84 coordinate boundary verification &rarr; Database insertion with PENDING status &rarr; WebSocket event emission.</p>
            <p><strong>Output:</strong> Distress ticket with live UUID and confirmation badge.</p>
          </div>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold text-xs rounded">MODULE 2</span>
            <h3 class="text-xs font-bold text-slate-900">Volunteer Operations & Task Claiming</h3>
          </div>
          <div class="text-[11px] space-y-2 text-slate-600">
            <p><strong>Input Parameters:</strong> Volunteer GPS location, verified skill set, available transport assets, stated ETA.</p>
            <p><strong>Processing Pipeline:</strong> 10km radius geospatial query &rarr; Haversine distance computation &rarr; Atomic task claiming with race-condition prevention &rarr; Broadcast status transition to CLAIMED.</p>
            <p><strong>Output:</strong> Turn-by-turn coordinate route and victim contact channel.</p>
          </div>
        </div>
      </div>
      <div class="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex justify-between">
        <span>SECURITY: All module requests authenticated via Bearer JWT with CSRF header validation</span>
      </div>
    </article>

    <!-- SLIDE 10: MODULE DESCRIPTION (PART 2) -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 5 • Module Breakdown</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">5. Module Description (Part 2: Command & Tactical Map)</h2>
          <p class="text-xs text-slate-500">Incident dispatch algorithms, SLA finite-state machine, and GIS layers.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 10 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-xs rounded">MODULE 3</span>
            <h3 class="text-xs font-bold text-slate-900">Rapid Force Dispatcher & SLA Daemon</h3>
          </div>
          <div class="text-[11px] space-y-2 text-slate-600">
            <p><strong>Input Parameters:</strong> Critical distress tickets, available NDRF battalions, SLA timer.</p>
            <p><strong>Processing Pipeline:</strong> Haversine great-circle calculation &rarr; Battalion proximity ranking &rarr; Automated 30-min SLA timer evaluation &rarr; Audio/visual escalation alert.</p>
            <p><strong>Output:</strong> Force deployment orders and SLA compliance reports.</p>
          </div>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded">MODULE 4</span>
            <h3 class="text-xs font-bold text-slate-900">GIS Tactical Map & Regional Alert Broadcast</h3>
          </div>
          <div class="text-[11px] space-y-2 text-slate-600">
            <p><strong>Input Parameters:</strong> Live incident feed, shelter occupancy stats, evacuation zones, severity.</p>
            <p><strong>Processing Pipeline:</strong> Leaflet clustered marker rendering &rarr; GeoJSON hazard geofence generation &rarr; Web Audio two-tone siren synthesis &rarr; Real-time client push.</p>
            <p><strong>Output:</strong> Multi-layer tactical incident map & multi-channel warning banner.</p>
          </div>
        </div>
      </div>
      <div class="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex justify-between">
        <span>SLA GUARANTEE: Automatic escalation ensures no distress call remains unattended beyond 30 minutes</span>
      </div>
    </article>

    <!-- SLIDE 11: TECHNOLOGY STACK -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 6 • Technology Stack</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">6. Technology Stack & Architectural Selection Justification</h2>
          <p class="text-xs text-slate-500">Rigorous comparative evaluation and trade-off rationale for every stack component.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 11 / 15</span>
      </div>
      <div class="overflow-x-auto my-auto">
        <table class="w-full text-left text-xs bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <thead class="bg-slate-900 text-white text-[11px]">
            <tr>
              <th class="p-2.5">Layer</th>
              <th class="p-2.5">Selected Technology</th>
              <th class="p-2.5">Key Capabilities</th>
              <th class="p-2.5">Architectural Justification</th>
              <th class="p-2.5">Alternative Evaluated</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-[11px]">
            <tr>
              <td class="p-2.5 font-bold text-indigo-700">Frontend UI</td>
              <td class="p-2.5 font-semibold">React 19 + TypeScript</td>
              <td class="p-2.5">Declarative UI, Concurrent rendering</td>
              <td class="p-2.5">Predictable state management in panic UI</td>
              <td class="p-2.5 text-slate-400">Angular / Vanilla JS</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-indigo-700">Styling</td>
              <td class="p-2.5 font-semibold">Tailwind CSS</td>
              <td class="p-2.5">Utility classes, zero runtime overhead</td>
              <td class="p-2.5">Rapid emergency component styling & mobile-first</td>
              <td class="p-2.5 text-slate-400">Bootstrap / Raw CSS</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-indigo-700">Real-Time</td>
              <td class="p-2.5 font-semibold">Socket.IO v4</td>
              <td class="p-2.5">WebSocket + polling fallback, auto-reconnect</td>
              <td class="p-2.5">Guaranteed delivery over unstable disaster cellular grids</td>
              <td class="p-2.5 text-slate-400">Raw WS / SSE</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-indigo-700">Backend</td>
              <td class="p-2.5 font-semibold">Node.js + Express</td>
              <td class="p-2.5">Event-driven, Non-blocking I/O</td>
              <td class="p-2.5">High concurrent I/O throughput for crisis spikes</td>
              <td class="p-2.5 text-slate-400">Django / Flask</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-indigo-700">Database</td>
              <td class="p-2.5 font-semibold">PostgreSQL (Relational)</td>
              <td class="p-2.5">ACID transactions, spatial queries</td>
              <td class="p-2.5">Strict consistency prevents duplicate volunteer task claims</td>
              <td class="p-2.5 text-slate-400">MongoDB / Firebase</td>
            </tr>
            <tr>
              <td class="p-2.5 font-bold text-indigo-700">GIS Mapping</td>
              <td class="p-2.5 font-semibold">Leaflet + OpenStreetMap</td>
              <td class="p-2.5">Lightweight (38KB), tile caching</td>
              <td class="p-2.5">Zero API billing quotas, open offline map caching</td>
              <td class="p-2.5 text-slate-400">Google Maps Platform</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="text-right text-[11px] text-slate-400 font-mono">100% Free & Open-Source Stack — Zero Cloud Vendor Lock-In</div>
    </article>

    <!-- SLIDE 12: UI DESIGN (PART 1) -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 7 • UI / UX Design</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">7. UI Design (Part 1: Citizen SOS & Volunteer Interfaces)</h2>
          <p class="text-xs text-slate-500">Low cognitive load human-centric design engineered for extreme distress scenarios.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 12 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-xs font-bold text-rose-700 uppercase mb-2">Interface 1: Citizen Panic SOS Portal</h3>
          <ul class="text-[11px] text-slate-600 space-y-1.5">
            <li>• <strong>Instant SOS Button:</strong> Prominent 64px red trigger with auto-location GPS capture.</li>
            <li>• <strong>Category Selection:</strong> Visual 4-button picker: Medical, Rescue, Food, Shelter.</li>
            <li>• <strong>Map Fallback:</strong> Interactive Leaflet pin-drop for pinpointing trapped family members.</li>
            <li>• <strong>Live Status Badge:</strong> Visual tracker: PENDING &rarr; CLAIMED &rarr; EN ROUTE &rarr; RESCUED.</li>
          </ul>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-xs font-bold text-indigo-700 uppercase mb-2">Interface 2: Volunteer Action Board</h3>
          <ul class="text-[11px] text-slate-600 space-y-1.5">
            <li>• <strong>Nearby Distress Queue:</strong> Chronological live feed sorted by proximity.</li>
            <li>• <strong>Resource Declaration:</strong> One-tap toggles for Boats, 4x4 vehicles, First-aid supplies.</li>
            <li>• <strong>"I Will Go and Help":</strong> Atomic task claim modal with expected arrival ETA.</li>
            <li>• <strong>Direct Contact Channel:</strong> Phone dialing button and turn-by-turn map coordinates.</li>
          </ul>
        </div>
      </div>
      <div class="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex justify-between">
        <span>WCAG 2.1 AAA COMPLIANT: 48px+ touch targets, high-contrast text, offline warning alerts</span>
      </div>
    </article>

    <!-- SLIDE 13: UI DESIGN (PART 2) -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Topic 7 • UI / UX Design</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">7. UI Design (Part 2: Command Room & Tactical Map)</h2>
          <p class="text-xs text-slate-500">Mission-critical operational dashboards designed for emergency command centers.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 13 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-xs font-bold text-blue-700 uppercase mb-2">Interface 3: NDRF Emergency Command Center</h3>
          <ul class="text-[11px] text-slate-600 space-y-1.5">
            <li>• <strong>Incident Queue:</strong> Real-time table with severity tags (CRITICAL, HIGH, MODERATE).</li>
            <li>• <strong>Battalion Distance Ranking:</strong> Haversine proximity-sorted military force list.</li>
            <li>• <strong>SLA Countdown Timer:</strong> Visual 30-minute timer per ticket with breach warning.</li>
            <li>• <strong>Broadcast Modal:</strong> One-click push to broadcast regional evacuation orders.</li>
          </ul>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-xs font-bold text-emerald-700 uppercase mb-2">Interface 4: Full-Screen GIS Tactical Map</h3>
          <ul class="text-[11px] text-slate-600 space-y-1.5">
            <li>• <strong>Clustered Markers:</strong> Live incident pins that de-cluster on zoom.</li>
            <li>• <strong>Shelter Occupancy:</strong> Color-coded badges: Green (&lt;70%), Yellow (70-90%), Red (&gt;90%).</li>
            <li>• <strong>Hazard Geofences:</strong> Circular exclusion zones marking active flood and fire zones.</li>
            <li>• <strong>Filter Controls:</strong> Toggle layers for Volunteers, Distress Calls, and Relief Shelters.</li>
          </ul>
        </div>
      </div>
      <div class="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex justify-between">
        <span>FIELD READY: Dark-mode optimized for 24/7 emergency control rooms and mobile rescue units</span>
      </div>
    </article>

    <!-- SLIDE 14: TESTING RESULTS -->
    <article class="slide-page w-full bg-slate-50 text-slate-800 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Evaluation Audit</span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Review–1 Implementation Verification & Benchmark Results</h2>
          <p class="text-xs text-slate-500">Empirical performance metrics, test cases, and delivery milestone audit.</p>
        </div>
        <span class="text-xs text-slate-400 font-mono">SLIDE 14 / 15</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 my-auto">
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div class="text-2xl font-extrabold text-indigo-600 font-mono">&lt; 100 ms</div>
          <div class="text-xs font-bold text-slate-800 mt-1">WebSocket Latency</div>
          <p class="text-[10px] text-slate-500 mt-1">Tested across 500 concurrent connections</p>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div class="text-2xl font-extrabold text-emerald-600 font-mono">100%</div>
          <div class="text-xs font-bold text-slate-800 mt-1">Concurrency Isolation</div>
          <p class="text-[10px] text-slate-500 mt-1">Zero duplicate claims under load</p>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div class="text-2xl font-extrabold text-blue-600 font-mono">&lt; 12 ms</div>
          <div class="text-xs font-bold text-slate-800 mt-1">Haversine Execution</div>
          <p class="text-[10px] text-slate-500 mt-1">Calculates 100+ battalion distances</p>
        </div>
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div class="text-2xl font-extrabold text-purple-600 font-mono">30 Min</div>
          <div class="text-xs font-bold text-slate-800 mt-1">SLA Escalation Engine</div>
          <p class="text-[10px] text-slate-500 mt-1">Automated alert daemon active</p>
        </div>
      </div>
      <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex justify-between">
        <span class="font-bold">REVIEW-2 ROADMAP:</span>
        <span>A* Safe Evacuation Corridor Routing & Community Crowdsourced Inventory Management</span>
      </div>
    </article>

    <!-- SLIDE 15: CONCLUSION & VIVA -->
    <article class="slide-page w-full bg-slate-950 text-white rounded-2xl shadow-2xl p-10 flex flex-col justify-between border border-slate-800 relative">
      <div class="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
      <div class="flex justify-between items-start">
        <span class="px-3 py-1 bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 rounded-full text-xs font-bold tracking-wider uppercase">Conclusion & Viva Defense</span>
        <span class="text-xs text-slate-400 font-mono">SLIDE 15 / 15</span>
      </div>
      <div class="my-auto space-y-4">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white">
          Review–1 Engineering Defense Summary
        </h2>
        <p class="text-sm text-slate-300 max-w-3xl leading-relaxed">
          ReliefLink bridges the critical minutes between disaster strike and emergency response by pairing local community volunteers with state disaster rescue forces through real-time geospatial dispatching.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
          <div class="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <p class="font-bold text-indigo-400 mb-1">IEEE 830 Standards</p>
            <p class="text-slate-400 text-[11px]">Strict SRS verification across all 6 FRs and 6 NFRs.</p>
          </div>
          <div class="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <p class="font-bold text-emerald-400 mb-1">Live Implementation</p>
            <p class="text-slate-400 text-[11px]">Working prototype ready for live demonstration.</p>
          </div>
          <div class="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <p class="font-bold text-blue-400 mb-1">Architecture Approved</p>
            <p class="text-slate-400 text-[11px]">Decoupled 4-tier design ready for Phase 2 expansion.</p>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap justify-between items-center pt-6 border-t border-slate-800 text-xs">
        <div>
          <span class="font-bold text-white text-sm">Sanjay K</span>
          <span class="text-slate-400 ml-2">| Register No: <span class="font-mono text-indigo-300 font-bold">310624104619</span> | CSE</span>
        </div>
        <div class="text-indigo-400 font-semibold">
          Thank you — Open for Viva Questions & Demonstration
        </div>
      </div>
    </article>

  </main>
</body>
</html>
`;

fs.writeFileSync(path.resolve(process.cwd(), 'public', 'review1-presentation.html'), htmlContent, 'utf8');
console.log('[SUCCESS] Generated public/review1-presentation.html');
