import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

async function generateZerothReviewPPT() {
  const pptx = new pptxgen();

  // Define exact 16:9 Widescreen dimensions (13.333 x 7.5 inches)
  // Standard modern PowerPoint layout so boxes and cards never overflow
  pptx.defineLayout({ name: 'WIDE16X9', width: 13.333, height: 7.5 });
  pptx.layout = 'WIDE16X9';

  pptx.author = 'Sanjay K (310624104619)';
  pptx.company = 'ReliefLink Project Team';
  pptx.title = 'ReliefLink - Zeroth Review Presentation';
  pptx.subject = 'Real-Time Disaster Relief & Resource Coordination Platform';

  // Design Tokens & Brand Colors
  const NAVY = '0F172A';      // Slate 900
  const BLUE = '2563EB';      // Blue 600
  const INDIGO = '4F46E5';    // Indigo 600
  const RED = 'DC2626';       // Rose 600
  const EMERALD = '059669';   // Emerald 600
  const AMBER = 'D97706';     // Amber 600
  const SLATE_BG = 'F8FAFC';  // Slate 50
  const CARD_BG = 'FFFFFF';
  const TEXT_DARK = '1E293B'; // Slate 800
  const TEXT_MUTED = '64748B';// Slate 500
  const BORDER_COLOR = 'CBD5E1';

  // Helper for standard slide header with strict coordinate bounds
  function addSlideHeader(slide, category, title, subtitle, slideNum) {
    // Top colored bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 0.1,
      fill: { color: INDIGO },
      line: { color: INDIGO }
    });

    // Category badge/tag
    slide.addText(category.toUpperCase(), {
      x: 1.0, y: 0.35, w: 8.0, h: 0.25,
      fontSize: 9.5, bold: true, color: INDIGO, fontFace: 'Calibri'
    });

    // Main Slide Title
    slide.addText(title, {
      x: 1.0, y: 0.6, w: 11.333, h: 0.5,
      fontSize: 22, bold: true, color: NAVY, fontFace: 'Calibri'
    });

    // Subtitle / Context
    if (subtitle) {
      slide.addText(subtitle, {
        x: 1.0, y: 1.12, w: 11.333, h: 0.32,
        fontSize: 11, color: TEXT_MUTED, fontFace: 'Calibri'
      });
    }

    // Bottom footer line
    slide.addShape(pptx.ShapeType.line, {
      x: 1.0, y: 6.85, w: 11.333, h: 0,
      line: { color: 'E2E8F0', width: 0.75 }
    });

    // Left Footer
    slide.addText('ReliefLink: Real-Time Disaster Relief Coordination | Candidate: Sanjay K (310624104619)', {
      x: 1.0, y: 6.95, w: 9.0, h: 0.25,
      fontSize: 9, color: '94A3B8', fontFace: 'Calibri'
    });

    // Right Slide Counter
    if (slideNum) {
      slide.addText(`Slide ${slideNum} of 12`, {
        x: 10.333, y: 6.95, w: 2.0, h: 0.25,
        fontSize: 9, bold: true, color: '94A3B8', fontFace: 'Calibri', align: 'right'
      });
    }
  }

  // ==========================================
  // SLIDE 1: TITLE SLIDE
  // ==========================================
  {
    const s1 = pptx.addSlide();
    s1.background = { color: NAVY };

    // Accent Line
    s1.addShape(pptx.ShapeType.rect, {
      x: 1.0, y: 1.1, w: 2.0, h: 0.08,
      fill: { color: RED }
    });

    s1.addText('PROJECT PHASE 0 • ZEROTH REVIEW', {
      x: 1.0, y: 1.3, w: 11.333, h: 0.3,
      fontSize: 12, bold: true, color: '94A3B8', fontFace: 'Calibri', charSpacing: 2
    });

    s1.addText('ReliefLink', {
      x: 1.0, y: 1.7, w: 11.333, h: 0.95,
      fontSize: 42, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    s1.addText('Real-Time Decentralized Disaster Relief & Community Rescue Coordination Platform', {
      x: 1.0, y: 2.7, w: 11.333, h: 0.5,
      fontSize: 17, bold: true, color: '38BDF8', fontFace: 'Calibri'
    });

    s1.addText('A mission-critical spatial coordination platform uniting distress victims, spontaneous community volunteers, and government forces (NDRF / SDRF / Fire & Rescue) during the Golden Hour of calamities.', {
      x: 1.0, y: 3.35, w: 11.333, h: 0.8,
      fontSize: 12, color: 'CBD5E1', fontFace: 'Calibri', lineSpacingMultiple: 1.25
    });

    // Left Card: Candidate Details
    s1.addShape(pptx.ShapeType.roundRect, {
      x: 1.0, y: 4.5, w: 5.4, h: 2.1,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1.2 },
      rectRadius: 0.08
    });

    s1.addText('PRESENTED BY', {
      x: 1.3, y: 4.7, w: 4.8, h: 0.25,
      fontSize: 10, bold: true, color: '38BDF8', fontFace: 'Calibri'
    });

    s1.addText('SANJAY K', {
      x: 1.3, y: 5.0, w: 4.8, h: 0.4,
      fontSize: 18, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    s1.addText('Register / Roll No: 310624104619\nDepartment of Computer Science & Engineering\nAcademic Year: 2025–2026', {
      x: 1.3, y: 5.45, w: 4.8, h: 0.85,
      fontSize: 11, color: '94A3B8', fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });

    // Right Card: Project Specifications
    s1.addShape(pptx.ShapeType.roundRect, {
      x: 6.9, y: 4.5, w: 5.433, h: 2.1,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1.2 },
      rectRadius: 0.08
    });

    s1.addText('PROJECT SPECIFICATIONS', {
      x: 7.2, y: 4.7, w: 4.8, h: 0.25,
      fontSize: 10, bold: true, color: '34D399', fontFace: 'Calibri'
    });

    s1.addText('Domain: Full-Stack Web, GIS Spatial Computing, Real-Time Distributed Systems\nTech Stack: Node.js, Express, Socket.IO, PostgreSQL, Leaflet OSM, React 18, TypeScript\nTarget Application: National Disaster Response & Humanitarian Relief (India)', {
      x: 7.2, y: 5.05, w: 4.8, h: 1.25,
      fontSize: 10.5, color: 'CBD5E1', fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });
  }

  // ==========================================
  // SLIDE 2: PROJECT OVERVIEW & CONTEXT
  // ==========================================
  {
    const s2 = pptx.addSlide();
    s2.background = { color: SLATE_BG };
    addSlideHeader(s2, 'Introduction', 'Project Overview & National Context', 'Bridging the critical response gap during severe natural and anthropogenic calamities.', 2);

    const cards = [
      {
        title: 'The Indian Calamity Landscape',
        desc: 'India is intensely vulnerable to recurrent severe disasters: coastal cyclones (Bay of Bengal / Arabian Sea), urban floods (Chennai, Mumbai), river inundations, and landslides affecting millions annually.',
        color: RED,
        x: 1.0
      },
      {
        title: 'The "Golden Hour" Imperative',
        desc: '70% of disaster survivors are saved within the first 60 to 120 minutes by nearby spontaneous citizen volunteers before centralized paramilitary battalions can navigate flooded infrastructure.',
        color: INDIGO,
        x: 4.89
      },
      {
        title: 'The ReliefLink Solution',
        desc: 'An open-source, resilient command-and-control platform uniting affected citizens, community "I Will Go" responders, and NDRF/SDRF government agencies into a synchronized tactical network.',
        color: EMERALD,
        x: 8.78
      }
    ];

    cards.forEach((c) => {
      // Card Container (3.55 width, perfectly spaced)
      s2.addShape(pptx.ShapeType.roundRect, {
        x: c.x, y: 1.65, w: 3.55, h: 4.9,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.2 },
        rectRadius: 0.08
      });

      // Top color indicator bar
      s2.addShape(pptx.ShapeType.rect, {
        x: c.x + 0.3, y: 1.95, w: 0.6, h: 0.08,
        fill: { color: c.color }
      });

      s2.addText(c.title, {
        x: c.x + 0.3, y: 2.15, w: 2.95, h: 0.65,
        fontSize: 14, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s2.addText(c.desc, {
        x: c.x + 0.3, y: 2.95, w: 2.95, h: 3.3,
        fontSize: 11, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.3
      });
    });
  }

  // ==========================================
  // SLIDE 3: PROBLEM STATEMENT & CHALLENGES
  // ==========================================
  {
    const s3 = pptx.addSlide();
    s3.background = { color: SLATE_BG };
    addSlideHeader(s3, 'Problem Formulation', 'Problem Statement & Existing Limitations', 'Critical bottlenecks currently plaguing conventional disaster response operations.', 3);

    const problems = [
      {
        num: '01',
        title: 'Helpline Congestion & Single Points of Failure',
        desc: 'Emergency 112 and 1070 control room lines collapse under call surges during peak disaster events, causing unrecorded calls, dropped lines, and fatal triage delays.'
      },
      {
        num: '02',
        title: 'Unverified Social Media SOS & Resource Mismatch',
        desc: 'Distress messages forwarded across WhatsApp and X lack precise GPS coordinates, leading to multiple rescue teams searching the same flooded street while adjacent sectors starve for aid.'
      },
      {
        num: '03',
        title: 'Isolated Citizen Volunteers',
        desc: 'Willing local youth and citizens have local boats, 4x4 vehicles, and medical kits, but have no verified channel to inform Government Command of their deployments.'
      },
      {
        num: '04',
        title: 'Command Blindspots & Slow Official Dispatch',
        desc: 'Disaster management officers struggle to determine which active rescue team (NDRF/SDRF/Fire) is nearest to a verified emergency cluster.'
      }
    ];

    // 2x2 Grid with exact coordinates within 13.333 x 7.5
    problems.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 1.0 + col * 5.88;
      const y = 1.65 + row * 2.5;

      s3.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.45, h: 2.3,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.2 },
        rectRadius: 0.08
      });

      s3.addText(p.num, {
        x: x + 0.3, y: y + 0.2, w: 0.7, h: 0.4,
        fontSize: 20, bold: true, color: RED, fontFace: 'Calibri'
      });

      s3.addText(p.title, {
        x: x + 1.05, y: y + 0.2, w: 4.1, h: 0.45,
        fontSize: 12.5, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s3.addText(p.desc, {
        x: x + 1.05, y: y + 0.7, w: 4.1, h: 1.35,
        fontSize: 10.5, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.2
      });
    });
  }

  // ==========================================
  // SLIDE 4: PROPOSED SYSTEM & NOVELTY
  // ==========================================
  {
    const s4 = pptx.addSlide();
    s4.background = { color: SLATE_BG };
    addSlideHeader(s4, 'Solution & Innovation', 'Proposed System & Key Innovations', 'ReliefLink introduces a unified real-time spatial fabric with bidirectional accountability.', 4);

    const innovations = [
      {
        tag: 'COMMUNITY MOBILIZATION',
        title: 'Hybrid Citizen-Volunteer Dynamic Model',
        points: [
          'Every registered citizen account can toggle and configure a verified community volunteer profile.',
          'Citizens can click "I Will Go and Help" with estimated ETA, vehicle type, and responder notes.',
          'Government Command instantly visualizes citizen deployments on the live operational board.'
        ]
      },
      {
        tag: 'TACTICAL DISPATCH',
        title: 'Proximity-Sorted Government Rapid Dispatch',
        points: [
          'Spatial engine uses Haversine geodesic indexing to locate closest NDRF/SDRF units.',
          'Enables instant team assignment with direct operational orders and live ETA tracking.',
          'Automatically flags unbacked citizen volunteers so official rescue backup is dispatched.'
        ]
      },
      {
        tag: 'GEOSPATIAL INTELLIGENCE',
        title: 'Live Interactive Tactical Map (GIS Leaflet)',
        points: [
          'Real-time visualization of distress markers, volunteer units, relief hubs, and hazard zones.',
          'Dynamic evacuation perimeters rendered as interactive circular geofences.',
          'Instant filter by urgency level (CRITICAL, HIGH, MEDIUM) and emergency type.'
        ]
      },
      {
        tag: 'RAPID BROADCASTING',
        title: 'Multi-Channel Alert & Broadcast Engine',
        points: [
          'Instant regional toast alerts with Web Audio two-tone emergency chimes.',
          'Live Socket.IO bidirectional event broadcasts across all connected dashboards.',
          'Government emergency broadcast banner with strict cryptographic access control.'
        ]
      }
    ];

    innovations.forEach((inn, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 1.0 + col * 5.88;
      const y = 1.65 + row * 2.5;

      s4.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.45, h: 2.3,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.2 },
        rectRadius: 0.08
      });

      s4.addText(inn.tag, {
        x: x + 0.3, y: y + 0.18, w: 4.85, h: 0.22,
        fontSize: 9, bold: true, color: INDIGO, fontFace: 'Calibri'
      });

      s4.addText(inn.title, {
        x: x + 0.3, y: y + 0.42, w: 4.85, h: 0.38,
        fontSize: 12.5, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      const bulletText = inn.points.map(pt => '• ' + pt).join('\n');
      s4.addText(bulletText, {
        x: x + 0.3, y: y + 0.82, w: 4.85, h: 1.35,
        fontSize: 10, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.2
      });
    });
  }

  // ==========================================
  // SLIDE 5: OBJECTIVES & SCOPE
  // ==========================================
  {
    const s5 = pptx.addSlide();
    s5.background = { color: SLATE_BG };
    addSlideHeader(s5, 'Scope & Goals', 'Project Objectives & Operational Scope', 'Clear engineering milestones guiding the implementation and deployment.', 5);

    // Left Box: Objectives
    s5.addShape(pptx.ShapeType.roundRect, {
      x: 1.0, y: 1.65, w: 5.45, h: 4.9,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.2 },
      rectRadius: 0.08
    });

    s5.addText('PRIMARY PROJECT OBJECTIVES', {
      x: 1.3, y: 1.9, w: 4.85, h: 0.3,
      fontSize: 13, bold: true, color: INDIGO, fontFace: 'Calibri'
    });

    const objList = [
      '1. Sub-Second SOS Transmission: Enable distress signal dispatch with automated GPS capture and offline resilience.',
      '2. Hybrid Volunteer Dispatching: Empower local citizens to register emergency skills and immediately volunteer to assist nearby victims.',
      '3. Spatial Proximity Routing: Calculate real-time geodesic distance between active rescue teams and distress tickets.',
      '4. Unified Command Intelligence: Deliver real-time telemetry, SLA auto-escalation (30 min breaches), and shelter occupancy updates to State Disaster Management Authorities.',
      '5. Zero Single-Point-of-Failure: Build on scalable Node.js event loops, robust WebSockets, and ACID-compliant relational persistence.'
    ];

    s5.addText(objList.join('\n\n'), {
      x: 1.3, y: 2.35, w: 4.85, h: 3.9,
      fontSize: 10.5, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });

    // Right Box: Scope
    s5.addShape(pptx.ShapeType.roundRect, {
      x: 6.88, y: 1.65, w: 5.45, h: 4.9,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.2 },
      rectRadius: 0.08
    });

    s5.addText('OPERATIONAL & GEOGRAPHIC SCOPE', {
      x: 7.18, y: 1.9, w: 4.85, h: 0.3,
      fontSize: 13, bold: true, color: EMERALD, fontFace: 'Calibri'
    });

    const scopeList = [
      '• In-Scope Target Stakeholders:\n  - Affected Citizens (SOS reporting, shelter locating, volunteer response)\n  - Registered Volunteers (Mission claiming, field status updates)\n  - Government Command (NDRF/SDRF team dispatch, zone creation)\n  - System Administrators (Audit logging, resource tracking)',
      '• Deployment Target:\n  High-density coastal and flood-prone districts across India (e.g. Chennai coastal belt, Cuddalore, Delta regions).',
      '• Performance Target:\n  Support 10,000+ concurrent WebSocket listeners with sub-100ms dispatch latency.',
      '• Accessibility:\n  Fully responsive progressive web client functioning on mobile smartphones, tablets, and command desktop video-walls.'
    ];

    s5.addText(scopeList.join('\n\n'), {
      x: 7.18, y: 2.35, w: 4.85, h: 3.9,
      fontSize: 10.5, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });
  }

  // ==========================================
  // SLIDE 6: LITERATURE SURVEY / COMPARATIVE MATRIX
  // ==========================================
  {
    const s6 = pptx.addSlide();
    s6.background = { color: SLATE_BG };
    addSlideHeader(s6, 'Research Background', 'Literature Survey & Competitive Comparison', 'Benchmarking ReliefLink against established global and domestic disaster frameworks.', 6);

    const tableRows = [
      [
        { text: 'Feature / Capability', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Traditional Helplines (112)', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Social Media / WhatsApp', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Sahana Eden / Ushahidi', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'ReliefLink (Proposed)', options: { bold: true, fill: { color: INDIGO }, color: 'FFFFFF' } }
      ],
      [
        { text: 'Real-Time Spatial Map', options: { bold: true } },
        { text: 'No (Voice Only)' },
        { text: 'No (Unstructured Text)' },
        { text: 'Partial / Static' },
        { text: 'Live Interactive (OSM)', options: { bold: true, color: EMERALD } }
      ],
      [
        { text: 'Citizen "I Will Go" Hybrid Model', options: { bold: true } },
        { text: 'Not Supported' },
        { text: 'Chaotic / Uncoordinated' },
        { text: 'Separate Registration' },
        { text: 'Native 1-Click Response', options: { bold: true, color: EMERALD } }
      ],
      [
        { text: 'Official Rescue Team Proximity Dispatch', options: { bold: true } },
        { text: 'Manual Radio Relay' },
        { text: 'Not Supported' },
        { text: 'Manual Backoffice' },
        { text: 'Automated Geodesic Ranking', options: { bold: true, color: EMERALD } }
      ],
      [
        { text: 'Automated SLA Escalation', options: { bold: true } },
        { text: 'No' },
        { text: 'No' },
        { text: 'Basic Ticketing' },
        { text: 'Yes (30-min SLA timer)', options: { bold: true, color: EMERALD } }
      ],
      [
        { text: 'Regional Auditory Toast Alerts', options: { bold: true } },
        { text: 'No' },
        { text: 'App Notifications Only' },
        { text: 'No' },
        { text: 'Web Audio API Chime + Toasts', options: { bold: true, color: EMERALD } }
      ],
      [
        { text: 'Live Shelter Occupancy Sync', options: { bold: true } },
        { text: 'Manual phone check' },
        { text: 'Crowdsourced / Stale' },
        { text: 'Periodic batch sync' },
        { text: 'Instant WebSocket broadcast', options: { bold: true, color: EMERALD } }
      ]
    ];

    s6.addTable(tableRows, {
      x: 1.0, y: 1.65, w: 11.333, h: 4.9,
      colW: [2.533, 2.2, 2.2, 2.2, 2.2],
      fontSize: 10,
      border: { pt: 1, color: BORDER_COLOR },
      fill: { color: CARD_BG },
      align: 'center',
      valign: 'middle'
    });
  }

  // ==========================================
  // SLIDE 7: SYSTEM ARCHITECTURE & DATAFLOW
  // ==========================================
  {
    const s7 = pptx.addSlide();
    s7.background = { color: SLATE_BG };
    addSlideHeader(s7, 'System Design', 'System Architecture & Real-Time Flow', 'End-to-end multi-tier architecture with decoupled reactive layers.', 7);

    // 4 Architecture Column Cards perfectly fitting 11.333 width
    const archBlocks = [
      {
        layer: 'TIER 1: CLIENT PRESENTATION',
        title: 'Multi-Role SPA Dashboard',
        details: '• React 18 + TypeScript\n• Tailwind CSS Design System\n• Leaflet GIS Engine\n• Web Audio API Synthesizer\n• Geolocation Watcher API\n• Responsive Mobile View',
        fill: 'EEF2FF', border: '6366F1', x: 1.0
      },
      {
        layer: 'TIER 2: REAL-TIME EVENT BUS',
        title: 'Socket.IO Hub & Rooms',
        details: '• Real-Time Event Dispatch\n• Room Clustering by Sector\n• Heartbeat / Liveness Ping\n• Reconnection Handlers\n• Instant SOS Broadcasts\n• Sub-100ms Latency',
        fill: 'FEF3C7', border: 'F59E0B', x: 3.9
      },
      {
        layer: 'TIER 3: APPLICATION SERVICES',
        title: 'Express REST & Dispatcher',
        details: '• JWT RBAC Middleware\n• Haversine Spatial Ranker\n• SLA Escalation Daemon\n• Rescue Dispatch Engine\n• Broadcast Controller\n• Rate-Limiting Security',
        fill: 'ECFDF5', border: '10B981', x: 6.8
      },
      {
        layer: 'TIER 4: DATA & PERSISTENCE',
        title: 'PostgreSQL Relational DB',
        details: '• Distress Requests Schema\n• Users & Volunteer Profiles\n• Rescue Teams Registry\n• Relief Centers & Occupancy\n• Hazard Zones Geometries\n• ACID Transaction Safety',
        fill: 'F1F5F9', border: '64748B', x: 9.7
      }
    ];

    archBlocks.forEach((b) => {
      s7.addShape(pptx.ShapeType.roundRect, {
        x: b.x, y: 1.65, w: 2.63, h: 4.9,
        fill: { color: b.fill },
        line: { color: b.border, width: 1.5 },
        rectRadius: 0.08
      });

      s7.addText(b.layer, {
        x: b.x + 0.18, y: 1.85, w: 2.27, h: 0.35,
        fontSize: 8.5, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s7.addText(b.title, {
        x: b.x + 0.18, y: 2.22, w: 2.27, h: 0.5,
        fontSize: 12, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s7.addText(b.details, {
        x: b.x + 0.18, y: 2.85, w: 2.27, h: 3.5,
        fontSize: 10, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.25
      });
    });
  }

  // ==========================================
  // SLIDE 8: CORE MODULES BREAKDOWN
  // ==========================================
  {
    const s8 = pptx.addSlide();
    s8.background = { color: SLATE_BG };
    addSlideHeader(s8, 'Functional Decomposition', 'Core System Modules Description', 'Granular overview of the functional modules comprising the ReliefLink platform.', 8);

    const modules = [
      {
        title: 'Module 1: Citizen SOS & Distress Reporting',
        desc: 'Enables distress victims to submit emergency requests in 3 clicks. Automatically captures high-accuracy GPS coordinates, emergency type (RESCUE, MEDICAL, FOOD, SHELTER), number of affected persons, and landmark descriptions. Features live tracking of submitted tickets.'
      },
      {
        title: 'Module 2: Community Citizen-Volunteer Hybrid Engine',
        desc: 'Eliminates barriers between citizens and volunteers. Any registered citizen can edit their volunteer skill set (medical, boating, 4x4 vehicle) and click "I Will Go and Help" on nearby emergency tickets. Synchronizes response ETA and phone directly to Government Command.'
      },
      {
        title: 'Module 3: Government Command Room & Rapid Force Dispatch',
        desc: 'Provides State Disaster Management Authorities with real-time incident triage, automated 30-minute SLA escalations, coverage gap analyzers, and proximity-sorted NDRF/SDRF rescue unit dispatching. Directs official backup to unbacked citizen volunteers.'
      },
      {
        title: 'Module 4: Spatial GIS Tactical Map & Regional Alerts',
        desc: 'Full-screen OpenStreetMap interface rendering live clusters of distress signals, relief hubs, field responders, and dynamic evacuation perimeters. Integrated with regional toast alerts and Web Audio two-tone emergency auditory chimes.'
      }
    ];

    modules.forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 1.0 + col * 5.88;
      const y = 1.65 + row * 2.5;

      s8.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.45, h: 2.3,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.2 },
        rectRadius: 0.08
      });

      s8.addText(m.title, {
        x: x + 0.3, y: y + 0.2, w: 4.85, h: 0.38,
        fontSize: 12.5, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s8.addText(m.desc, {
        x: x + 0.3, y: y + 0.65, w: 4.85, h: 1.45,
        fontSize: 10.5, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.2
      });
    });
  }

  // ==========================================
  // SLIDE 9: TECH STACK & REQUIREMENTS
  // ==========================================
  {
    const s9 = pptx.addSlide();
    s9.background = { color: SLATE_BG };
    addSlideHeader(s9, 'System Specifications', 'Hardware & Software Requirements', 'Comprehensive technology stack and infrastructure dependencies.', 9);

    // Left Table: Software Stack (7.0 inches wide)
    const swRows = [
      [
        { text: 'Component', options: { bold: true, fill: { color: INDIGO }, color: 'FFFFFF' } },
        { text: 'Technology / Library', options: { bold: true, fill: { color: INDIGO }, color: 'FFFFFF' } },
        { text: 'Role & Functionality', options: { bold: true, fill: { color: INDIGO }, color: 'FFFFFF' } }
      ],
      [
        { text: 'Frontend UI', options: { bold: true } },
        { text: 'React 18, TypeScript, Tailwind CSS' },
        { text: 'Type-safe reactive dashboard with responsive layouts' }
      ],
      [
        { text: 'Mapping & GIS', options: { bold: true } },
        { text: 'Leaflet.js + OpenStreetMap' },
        { text: 'Interactive markers, hazard geofences, tactical zoom' }
      ],
      [
        { text: 'Backend Server', options: { bold: true } },
        { text: 'Node.js, Express.js' },
        { text: 'REST API, Haversine geospatial proximity engine' }
      ],
      [
        { text: 'Real-Time Sync', options: { bold: true } },
        { text: 'Socket.IO (WebSockets)' },
        { text: 'Sub-second event propagation, regional broadcasts' }
      ],
      [
        { text: 'Database', options: { bold: true } },
        { text: 'PostgreSQL' },
        { text: 'ACID-compliant storage for users, tickets, and teams' }
      ],
      [
        { text: 'Security & Auth', options: { bold: true } },
        { text: 'JWT + bcrypt' },
        { text: 'Role-Based Access Control (CITIZEN, VOLUNTEER, GOV, ADMIN)' }
      ]
    ];

    s9.addTable(swRows, {
      x: 1.0, y: 1.65, w: 7.0, h: 4.9,
      colW: [1.8, 2.5, 2.7],
      fontSize: 9.5,
      border: { pt: 1, color: BORDER_COLOR },
      fill: { color: CARD_BG },
      align: 'left',
      valign: 'middle'
    });

    // Right Card: Hardware Specifications (4.05 inches wide)
    s9.addShape(pptx.ShapeType.roundRect, {
      x: 8.28, y: 1.65, w: 4.05, h: 4.9,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.2 },
      rectRadius: 0.08
    });

    s9.addText('HARDWARE SPECIFICATIONS', {
      x: 8.55, y: 1.9, w: 3.5, h: 0.3,
      fontSize: 12, bold: true, color: NAVY, fontFace: 'Calibri'
    });

    const hwDetails = [
      '• Server Node (Deployment):\n  - Processor: 4-Core vCPU (2.4 GHz+)\n  - RAM: 8 GB DDR4 minimum\n  - Storage: 100 GB SSD (NVMe preferred)\n  - Network: 1 Gbps high-availability link',
      '• Client Device (Citizens / Volunteers):\n  - Any smartphone / tablet with modern browser (Chrome / Safari / Firefox)\n  - Built-in GPS chip with location accuracy within 10 meters\n  - 3G / 4G / 5G / Broadband connectivity',
      '• Government Command Center:\n  - Multi-monitor workstation / Video wall\n  - Display Resolution: 1080p Full HD or 4K UHD'
    ];

    s9.addText(hwDetails.join('\n\n'), {
      x: 8.55, y: 2.35, w: 3.5, h: 3.9,
      fontSize: 10, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });
  }

  // ==========================================
  // SLIDE 10: WORK PLAN & REVIEW TIMELINE
  // ==========================================
  {
    const s10 = pptx.addSlide();
    s10.background = { color: SLATE_BG };
    addSlideHeader(s10, 'Project Roadmap', 'Work Plan & Review Milestones (Gantt Schedule)', 'Phased project lifecycle aligned with academic review guidelines.', 10);

    const phases = [
      {
        phase: 'Zeroth Review',
        timeframe: 'Current Milestone',
        status: 'COMPLETED',
        color: EMERALD,
        x: 1.0,
        tasks: [
          'Problem formulation and literature benchmark analysis',
          'System architecture and spatial data modeling',
          'Prototype dashboard and UX design system finalized',
          'Preliminary real-time WebSocket communication test'
        ]
      },
      {
        phase: 'Review 1',
        timeframe: 'Month 2',
        status: 'IN PROGRESS',
        color: INDIGO,
        x: 3.9,
        tasks: [
          'PostgreSQL schema optimization & foreign key constraints',
          'SOS Distress submission API with GPS reverse-geocoding',
          'Leaflet tactical map clustering & layer filtering',
          'Role-based JWT authentication and authorization gates'
        ]
      },
      {
        phase: 'Review 2',
        timeframe: 'Month 3',
        status: 'PLANNED',
        color: BLUE,
        x: 6.8,
        tasks: [
          'Citizen-Volunteer hybrid "I Will Go" action engine',
          'Proximity Haversine dispatch algorithm integration',
          'Web Audio two-tone emergency chime & regional alerts',
          'Relief center real-time occupancy synchronization'
        ]
      },
      {
        phase: 'Final Review',
        timeframe: 'Month 4',
        status: 'PLANNED',
        color: AMBER,
        x: 9.7,
        tasks: [
          'End-to-end stress testing under 5,000 simulated SOS calls',
          'Disaster simulation exercises with regional field trials',
          'Security audit against injection and unauthorized broadcasts',
          'Final project report, paper publication & viva defense'
        ]
      }
    ];

    phases.forEach((ph) => {
      s10.addShape(pptx.ShapeType.roundRect, {
        x: ph.x, y: 1.65, w: 2.63, h: 4.9,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.2 },
        rectRadius: 0.08
      });

      // Colored status bar
      s10.addShape(pptx.ShapeType.rect, {
        x: ph.x + 0.2, y: 1.9, w: 0.5, h: 0.08,
        fill: { color: ph.color }
      });

      s10.addText(ph.status, {
        x: ph.x + 0.8, y: 1.85, w: 1.6, h: 0.25,
        fontSize: 8.5, bold: true, color: ph.color, fontFace: 'Calibri', align: 'right'
      });

      s10.addText(ph.phase, {
        x: ph.x + 0.2, y: 2.15, w: 2.2, h: 0.35,
        fontSize: 13, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s10.addText(ph.timeframe, {
        x: ph.x + 0.2, y: 2.5, w: 2.2, h: 0.25,
        fontSize: 9.5, color: TEXT_MUTED, fontFace: 'Calibri'
      });

      const taskText = ph.tasks.map(t => '• ' + t).join('\n\n');
      s10.addText(taskText, {
        x: ph.x + 0.2, y: 2.9, w: 2.23, h: 3.4,
        fontSize: 9.5, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.15
      });
    });
  }

  // ==========================================
  // SLIDE 11: EXPECTED OUTCOMES & SOCIETAL IMPACT
  // ==========================================
  {
    const s11 = pptx.addSlide();
    s11.background = { color: SLATE_BG };
    addSlideHeader(s11, 'Impact & Results', 'Expected Outcomes & Societal Impact', 'Tangible operational and humanitarian benefits delivered by ReliefLink.', 11);

    const outcomes = [
      {
        metric: '85% ↓',
        title: 'Reduction in Golden Hour Triage Delay',
        desc: 'Distress calls reach nearby citizen responders and NDRF control rooms within seconds rather than hours of congested phone lines.'
      },
      {
        metric: '0%',
        title: 'Duplicated Volunteer Deployments',
        desc: 'Live tactical spatial markers ensure multiple volunteer units do not blindly duplicate efforts on the same rescue ticket.'
      },
      {
        metric: '100%',
        title: 'Accountability & Audit Trails',
        desc: 'Every dispatch, volunteer response, shelter update, and official NDRF team assignment is permanently logged in a verifiable database.'
      },
      {
        metric: 'Direct',
        title: 'Citizen Empowerment in Calamities',
        desc: 'Transforms stranded citizens from helpless bystanders into organized, recognized emergency responders.'
      }
    ];

    outcomes.forEach((o, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 1.0 + col * 5.88;
      const y = 1.65 + row * 2.5;

      s11.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.45, h: 2.3,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.2 },
        rectRadius: 0.08
      });

      s11.addText(o.metric, {
        x: x + 0.3, y: y + 0.25, w: 1.4, h: 0.55,
        fontSize: 24, bold: true, color: INDIGO, fontFace: 'Calibri'
      });

      s11.addText(o.title, {
        x: x + 1.8, y: y + 0.25, w: 3.35, h: 0.5,
        fontSize: 12.5, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s11.addText(o.desc, {
        x: x + 0.3, y: y + 0.9, w: 4.85, h: 1.1,
        fontSize: 10.5, color: TEXT_DARK, fontFace: 'Calibri', lineSpacingMultiple: 1.2
      });
    });
  }

  // ==========================================
  // SLIDE 12: CONCLUSION & REFERENCES
  // ==========================================
  {
    const s12 = pptx.addSlide();
    s12.background = { color: NAVY };

    // Accent line
    s12.addShape(pptx.ShapeType.rect, {
      x: 1.0, y: 0.9, w: 1.8, h: 0.08,
      fill: { color: INDIGO }
    });

    s12.addText('CONCLUSION & FUTURE DIRECTIONS', {
      x: 1.0, y: 1.15, w: 11.333, h: 0.45,
      fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    s12.addText('ReliefLink addresses the most critical bottleneck in modern disaster management: real-time spatial coordination and community mobilization during the Golden Hour. By providing a unified platform for citizens, spontaneous volunteers, and government forces, it bridges the gap between chaotic crowd distress and structured official response.', {
      x: 1.0, y: 1.7, w: 11.333, h: 0.85,
      fontSize: 12, color: 'CBD5E1', fontFace: 'Calibri', lineSpacingMultiple: 1.3
    });

    // References Box
    s12.addShape(pptx.ShapeType.roundRect, {
      x: 1.0, y: 2.8, w: 11.333, h: 2.5,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1.2 },
      rectRadius: 0.08
    });

    s12.addText('KEY REFERENCES & STANDARDS', {
      x: 1.3, y: 3.0, w: 10.7, h: 0.28,
      fontSize: 11, bold: true, color: '38BDF8', fontFace: 'Calibri'
    });

    const refs = [
      '[1] National Disaster Management Authority (NDMA), Government of India — "National Disaster Management Plan (NDMP)", 2019.',
      '[2] United Nations Office for Disaster Risk Reduction (UNDRR) — "Sendai Framework for Disaster Risk Reduction 2015–2030".',
      '[3] S. Currion, C. Silva, and B. Van de Walle — "Open Source Software for Disaster Management", Communications of the ACM, Vol. 50, No. 3, 2007.',
      '[4] P. Meier — "Digital Humanitarians: How Big Data is Changing the Face of Humanitarian Response", CRC Press, 2015.'
    ];

    s12.addText(refs.join('\n\n'), {
      x: 1.3, y: 3.35, w: 10.7, h: 1.75,
      fontSize: 9.5, color: '94A3B8', fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });

    // Thank you section
    s12.addText('THANK YOU — OPEN FOR QUESTIONS & SUGGESTIONS', {
      x: 1.0, y: 5.65, w: 11.333, h: 0.45,
      fontSize: 18, bold: true, color: '34D399', fontFace: 'Calibri', align: 'center'
    });

    s12.addText('Candidate: Sanjay K | Roll No: 310624104619 | Department of Computer Science & Engineering', {
      x: 1.0, y: 6.2, w: 11.333, h: 0.35,
      fontSize: 12, color: '94A3B8', fontFace: 'Calibri', align: 'center'
    });
  }

  // Ensure public directory exists and write PPTX
  const outputDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'ReliefLink_Zeroth_Review_Sanjay_K.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`[SUCCESS] PPTX generated cleanly at: ${outputPath}`);
}

generateZerothReviewPPT().catch(err => {
  console.error('[ERROR] Failed to generate PPT:', err);
  process.exit(1);
});
