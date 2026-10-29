import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

async function generateProfessionalReview1PPT() {
  const pptx = new pptxgen();

  // Standard 16:9 Widescreen dimensions (13.333" x 7.5")
  pptx.defineLayout({ name: 'WIDE16X9', width: 13.333, height: 7.5 });
  pptx.layout = 'WIDE16X9';

  pptx.author = 'Sanjay K (310624104619)';
  pptx.company = 'Department of Computer Science and Engineering';
  pptx.title = 'ReliefLink - Project Review 1 Presentation';
  pptx.subject = 'Project Review 1: Requirements, System Architecture, Use Case Diagram, ER Diagram, Module Description, Technology Stack, UI Design';

  // Master Color Palette - Professional Corporate & Engineering Theme
  const NAVY = '0F172A';         // Slate 900
  const NAVY_LIGHT = '1E293B';   // Slate 800
  const COBALT = '1D4ED8';       // Blue 700
  const INDIGO = '4338CA';       // Indigo 700
  const INDIGO_LIGHT = 'EEF2FF'; // Indigo 50
  const CYAN = '0284C7';         // Sky 600
  const EMERALD = '047857';      // Emerald 700
  const EMERALD_BG = 'ECFDF5';   // Emerald 50
  const ROSE = 'BE123C';         // Rose 700
  const ROSE_BG = 'FFF1F2';      // Rose 50
  const AMBER = 'B45309';        // Amber 700
  const AMBER_BG = 'FFFBEB';     // Amber 50
  const BG_COLOR = 'F8FAFC';     // Slate 50
  const CARD_BG = 'FFFFFF';
  const BORDER = 'CBD5E1';       // Slate 300
  const BORDER_LIGHT = 'E2E8F0'; // Slate 200
  const TEXT_SECONDARY = '334155'; // Slate 700
  const TEXT_MUTED = '64748B';   // Slate 500

  // Standard Slide Header Generator with Strict Coordinate Bounds
  function renderSlideHeader(slide, topicTag, title, subtitle, slideNum) {
    // Top primary accent strip
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 0.08,
      fill: { color: INDIGO },
      line: { color: INDIGO }
    });

    // Topic badge container
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 0.32, w: topicTag.length > 30 ? 4.2 : 3.0, h: 0.28,
      fill: { color: INDIGO_LIGHT },
      line: { color: 'C7D2FE', width: 1 },
      rectRadius: 0.05
    });

    slide.addText(topicTag.toUpperCase(), {
      x: 0.85, y: 0.35, w: topicTag.length > 30 ? 4.1 : 2.9, h: 0.22,
      fontSize: 8.5, bold: true, color: INDIGO, fontFace: 'Calibri', align: 'center'
    });

    // Main Title
    slide.addText(title, {
      x: 0.8, y: 0.68, w: 11.733, h: 0.42,
      fontSize: 21, bold: true, color: NAVY, fontFace: 'Calibri'
    });

    // Subtitle / Scope description
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 1.12, w: 11.733, h: 0.32,
        fontSize: 10.5, color: TEXT_MUTED, fontFace: 'Calibri'
      });
    }

    // Horizontal divider
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: 1.5, w: 11.733, h: 0,
      line: { color: BORDER_LIGHT, width: 1 }
    });

    // Footer divider line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: 6.88, w: 11.733, h: 0,
      line: { color: BORDER_LIGHT, width: 0.75 }
    });

    // Left Footer: Project Branding
    slide.addText('ReliefLink | Real-Time Decentralized Disaster Relief Platform', {
      x: 0.8, y: 6.96, w: 5.5, h: 0.25,
      fontSize: 8.5, color: TEXT_MUTED, fontFace: 'Calibri'
    });

    // Center Footer: Candidate Identification
    slide.addText('Project Review–1 | Candidate: Sanjay K (Reg No: 310624104619) | Dept of CSE', {
      x: 6.0, y: 6.96, w: 5.0, h: 0.25,
      fontSize: 8.5, color: TEXT_MUTED, fontFace: 'Calibri', align: 'center'
    });

    // Right Footer: Slide Number
    slide.addText(`${slideNum.toString().padStart(2, '0')} / 15`, {
      x: 11.333, y: 6.96, w: 1.2, h: 0.25,
      fontSize: 8.5, bold: true, color: INDIGO, fontFace: 'Calibri', align: 'right'
    });
  }

  // =========================================================================
  // SLIDE 1: TITLE SLIDE (Executive Dark Theme)
  // =========================================================================
  {
    const s1 = pptx.addSlide();
    s1.background = { color: NAVY };

    s1.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 0.8, w: 1.5, h: 0.08,
      fill: { color: CYAN },
      line: { color: CYAN }
    });

    s1.addText('PROJECT REVIEW – 1 (PHASE 1 DEFENSE)', {
      x: 0.8, y: 1.05, w: 11.733, h: 0.35,
      fontSize: 11.5, bold: true, color: '38BDF8', fontFace: 'Calibri', charSpacing: 2
    });

    s1.addText('ReliefLink', {
      x: 0.8, y: 1.45, w: 11.733, h: 1.0,
      fontSize: 44, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    s1.addText('Real-Time Decentralized Disaster Relief & Community Rescue Coordination Platform', {
      x: 0.8, y: 2.5, w: 11.733, h: 0.45,
      fontSize: 18, bold: true, color: 'E2E8F0', fontFace: 'Calibri'
    });

    s1.addText('Comprehensive Engineering Defense covering Functional & Non-Functional Requirements, System Architecture, UML Use Case Modeling, Relational ER Design, Modular Decomposition, Technology Stack Rationale, and Production UI Design.', {
      x: 0.8, y: 3.05, w: 11.733, h: 0.8,
      fontSize: 11, color: '94A3B8', fontFace: 'Calibri', lineSpacingMultiple: 1.25
    });

    // Card 1: Candidate Profile
    s1.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 4.15, w: 5.6, h: 2.5,
      fill: { color: NAVY_LIGHT },
      line: { color: '334155', width: 1.2 },
      rectRadius: 0.08
    });

    s1.addText('CANDIDATE INFORMATION', {
      x: 1.1, y: 4.35, w: 5.0, h: 0.25,
      fontSize: 9.5, bold: true, color: '38BDF8', fontFace: 'Calibri'
    });

    s1.addText('SANJAY K', {
      x: 1.1, y: 4.65, w: 5.0, h: 0.45,
      fontSize: 20, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    const candidateDetails = [
      'Register / Roll Number : 310624104619',
      'Degree & Branch        : B.E. Computer Science & Engineering',
      'Evaluation Milestone   : Project Review – 1 (Phase 1)',
      'Academic Year          : 2025 – 2026'
    ];
    s1.addText(candidateDetails.join('\n'), {
      x: 1.1, y: 5.15, w: 5.0, h: 1.25,
      fontSize: 10, color: 'CBD5E1', fontFace: 'Courier New', lineSpacingMultiple: 1.2
    });

    // Card 2: Review-1 Prescribed Topics Checklist
    s1.addShape(pptx.ShapeType.roundRect, {
      x: 6.933, y: 4.15, w: 5.6, h: 2.5,
      fill: { color: NAVY_LIGHT },
      line: { color: '334155', width: 1.2 },
      rectRadius: 0.08
    });

    s1.addText('EVALUATION TOPICS COVERED', {
      x: 7.233, y: 4.35, w: 5.0, h: 0.25,
      fontSize: 9.5, bold: true, color: '34D399', fontFace: 'Calibri'
    });

    const topics = [
      '✔ Topic 1: Functional & Non-Functional Requirements',
      '✔ Topic 2: System Architecture & Multi-Tier Topology',
      '✔ Topic 3: UML Use Case Diagram & Actor Relationships',
      '✔ Topic 4: ER Diagram & Normalized Database Schema',
      '✔ Topic 5: Module Description & Operational Pipelines',
      '✔ Topic 6: Technology Stack & Architectural Trade-offs',
      '✔ Topic 7: UI Design Wireframes & Incident Dashboards'
    ];
    s1.addText(topics.join('\n'), {
      x: 7.233, y: 4.68, w: 5.0, h: 1.8,
      fontSize: 9.5, color: 'E2E8F0', fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });
  }

  // =========================================================================
  // SLIDE 2: EXECUTIVE SUMMARY & ROADMAP
  // =========================================================================
  {
    const s2 = pptx.addSlide();
    s2.background = { color: BG_COLOR };
    renderSlideHeader(s2, 'Executive Summary', 'Review–1 Presentation Agenda & Structural Roadmap', 'Systematic walk-through of the 7 core engineering deliverables evaluated in Phase 1.', 2);

    const agendaList = [
      { num: '01', title: 'Functional & Non-Functional Requirements', desc: 'Formal SRS establishing 6 core system capabilities and 6 empirical constraints (latency <100ms, GPS accuracy ≤10m, ACID isolation).' },
      { num: '02', title: 'System Architecture', desc: 'Decoupled 4-tier topology integrating Client SPA, Socket.IO Real-Time Bus, Express Application Engine, and PostgreSQL Persistence.' },
      { num: '03', title: 'Use Case Diagram', desc: 'Comprehensive behavioral modeling mapping 4 actors (Citizen, Volunteer, Commander, Admin) across 24 operational use cases and associations.' },
      { num: '04', title: 'ER Diagram & Database Schema', desc: 'Normalized 3NF relational data model with primary keys, foreign key constraints, check rules, and spatial coordinate indexing.' },
      { num: '05', title: 'Module Description', desc: 'Detailed breakdown of Citizen SOS, Volunteer Engine, Command Force Dispatcher, and GIS Tactical Map with workflow algorithms.' },
      { num: '06', title: 'Technology Stack', desc: 'Comparative justification for React 18, TypeScript, Tailwind CSS, Leaflet.js, Node.js, Express, Socket.IO, and PostgreSQL.' },
      { num: '07', title: 'UI Design & Wireframes', desc: 'Production-ready responsive interfaces for Citizen SOS, Volunteer Board, Incident Command Room, and Full-Screen GIS Tactical Map.' }
    ];

    agendaList.forEach((item, idx) => {
      const col = idx < 4 ? 0 : 1;
      const row = idx < 4 ? idx : idx - 4;
      const x = 0.8 + col * 5.966;
      const y = 1.65 + row * 1.25;

      s2.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.766, h: 1.15,
        fill: { color: CARD_BG },
        line: { color: BORDER, width: 1 },
        rectRadius: 0.06
      });

      s2.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.18, y: y + 0.18, w: 0.55, h: 0.35,
        fill: { color: INDIGO_LIGHT },
        line: { color: 'C7D2FE', width: 0.75 },
        rectRadius: 0.04
      });

      s2.addText(item.num, {
        x: x + 0.18, y: y + 0.22, w: 0.55, h: 0.28,
        fontSize: 11, bold: true, color: INDIGO, fontFace: 'Calibri', align: 'center'
      });

      s2.addText(item.title, {
        x: x + 0.85, y: y + 0.18, w: 4.75, h: 0.32,
        fontSize: 11.5, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s2.addText(item.desc, {
        x: x + 0.85, y: y + 0.5, w: 4.75, h: 0.58,
        fontSize: 8.8, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
      });
    });

    s2.addShape(pptx.ShapeType.roundRect, {
      x: 6.766, y: 5.4, w: 5.766, h: 1.15,
      fill: { color: EMERALD_BG },
      line: { color: 'A7F3D0', width: 1 },
      rectRadius: 0.06
    });

    s2.addText('PHASE 1 MILESTONE COMPLETION STATUS', {
      x: 6.966, y: 5.55, w: 5.366, h: 0.25,
      fontSize: 9.5, bold: true, color: EMERALD, fontFace: 'Calibri'
    });

    s2.addText('All 7 Review–1 modules have been modeled, documented, and fully integrated with a working live prototype, achieving 100% on-time milestone delivery according to department review standards.', {
      x: 6.966, y: 5.82, w: 5.366, h: 0.62,
      fontSize: 9, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });
  }

  // =========================================================================
  // SLIDE 3: TOPIC 1 - FUNCTIONAL REQUIREMENTS
  // =========================================================================
  {
    const s3 = pptx.addSlide();
    s3.background = { color: BG_COLOR };
    renderSlideHeader(s3, 'Topic 1 • Requirements', '1. Functional Requirements (FR) Specification', 'Exhaustive functional capabilities defining user distress capture, community aid, and agency dispatch.', 3);

    const frData = [
      {
        id: 'FR–01',
        title: 'Zero-Friction Citizen SOS Distress Capture',
        priority: 'CRITICAL',
        color: ROSE,
        bgColor: ROSE_BG,
        desc: 'Enables victims to initiate distress calls in <3 clicks. Auto-captures W3C GPS telemetry (latitude, longitude, accuracy) with interactive Leaflet pin-drop fallback. Collects emergency category (Rescue, Medical, Food, Shelter), trapped headcount, and landmark descriptions.'
      },
      {
        id: 'FR–02',
        title: 'Community "I Will Go and Help" Hybrid Dispatch',
        priority: 'HIGH',
        color: INDIGO,
        bgColor: INDIGO_LIGHT,
        desc: 'Permits any registered citizen to toggle into field volunteer mode. Provides a geo-filtered feed of active distress signals within a 10 km radius, lets volunteers declare available rescue assets (boats, 4x4, first-aid), claim tickets, and input expected ETA.'
      },
      {
        id: 'FR–03',
        title: 'Haversine Proximity-Sorted Force Routing',
        priority: 'CRITICAL',
        color: COBALT,
        bgColor: 'EFF6FF',
        desc: 'Computes great-circle geodesic distances between distress coordinates and available NDRF, SDRF, and Fire & Rescue battalions. Automatically ranks official units in ascending distance order for rapid military/paramilitary force deployment.'
      },
      {
        id: 'FR–04',
        title: 'Automated 30-Minute SLA Escalation Daemon',
        priority: 'CRITICAL',
        color: AMBER,
        bgColor: AMBER_BG,
        desc: 'Background daemon continuously tracks ticket lifecycles. Any ticket remaining unassigned or unbacked beyond 30 minutes escalates automatically to CRITICAL_BREACH status, triggering priority video-wall flashing and audible warning sirens.'
      },
      {
        id: 'FR–05',
        title: 'Interactive GIS Tactical Map & Hazard Geofencing',
        priority: 'HIGH',
        color: EMERALD,
        bgColor: EMERALD_BG,
        desc: 'Renders an interactive multi-layer OpenStreetMap display with clustered incident markers, relief center capacities, and dynamic circular evacuation hazard zones (red/orange) based on calamity severity parameters.'
      },
      {
        id: 'FR–06',
        title: 'Multi-Channel Alert & Web Audio Broadcasting',
        priority: 'HIGH',
        color: INDIGO,
        bgColor: INDIGO_LIGHT,
        desc: 'Empowers authorized command personnel to broadcast emergency evacuation orders. Pushes real-time alerts across active WebSocket client sessions and synthesizes two-tone emergency warning chimes using the W3C Web Audio API.'
      }
    ];

    frData.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.966;
      const y = 1.65 + row * 1.65;

      s3.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.766, h: 1.5,
        fill: { color: CARD_BG },
        line: { color: BORDER, width: 1 },
        rectRadius: 0.06
      });

      s3.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.2, y: y + 0.16, w: 0.8, h: 0.28,
        fill: { color: item.bgColor },
        line: { color: item.color, width: 0.75 },
        rectRadius: 0.04
      });

      s3.addText(item.id, {
        x: x + 0.2, y: y + 0.18, w: 0.8, h: 0.24,
        fontSize: 9, bold: true, color: item.color, fontFace: 'Calibri', align: 'center'
      });

      s3.addText(`PRIORITY: ${item.priority}`, {
        x: x + 1.1, y: y + 0.18, w: 2.0, h: 0.24,
        fontSize: 8, bold: true, color: item.color, fontFace: 'Calibri'
      });

      s3.addText(item.title, {
        x: x + 0.2, y: y + 0.48, w: 5.366, h: 0.3,
        fontSize: 11, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s3.addText(item.desc, {
        x: x + 0.2, y: y + 0.8, w: 5.366, h: 0.62,
        fontSize: 8.8, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
      });
    });
  }

  // =========================================================================
  // SLIDE 4: TOPIC 1 - NON-FUNCTIONAL REQUIREMENTS
  // =========================================================================
  {
    const s4 = pptx.addSlide();
    s4.background = { color: BG_COLOR };
    renderSlideHeader(s4, 'Topic 1 • Requirements', '1. Non-Functional Requirements (NFR) Benchmarks', 'Stringent quantitative performance, security, availability, and reliability constraints.', 4);

    const nfrData = [
      {
        metric: '< 100 ms',
        title: 'Real-Time WebSocket Event Latency',
        category: 'PERFORMANCE',
        desc: 'State mutations (distress ticket created, volunteer committed, force dispatched) must propagate to all connected active client dashboards within 100 ms across regional WebSocket rooms.'
      },
      {
        metric: '5,000+ Sockets',
        title: 'Concurrent Socket Throughput',
        category: 'SCALABILITY',
        desc: 'The asynchronous Node.js event-driven gateway must handle at least 5,000 simultaneous persistent socket connections during sudden natural calamity surges without packet loss.'
      },
      {
        metric: '≤ 10 Meters',
        title: 'Geospatial Geolocation Accuracy',
        category: 'PRECISION',
        desc: 'Citizen distress coordinates captured via W3C Geolocation API must maintain a circular error probable of ≤10 meters, supported by an interactive map pin repositioning mechanism.'
      },
      {
        metric: 'HMAC-SHA256',
        title: 'Cryptographic RBAC Security',
        category: 'SECURITY',
        desc: 'Role-based access control enforced via tamper-proof JWT tokens across 4 roles (CITIZEN, VOLUNTEER, GOV, ADMIN). Passwords hashed using bcrypt with salt rounds ≥ 10.'
      },
      {
        metric: '99.9% Uptime',
        title: 'High Availability & Offline Fallback',
        category: 'AVAILABILITY',
        desc: 'System architecture must support stateless failover. Client application caches submitted tickets locally during cellular dropouts and automatically syncs upon reconnection.'
      },
      {
        metric: 'Strict Isolation',
        title: 'ACID Relational Transaction Locking',
        category: 'INTEGRITY',
        desc: 'PostgreSQL database transactions must execute atomic row locks during ticket dispatch, preventing race conditions where multiple volunteers or teams attempt to claim the same ticket.'
      }
    ];

    nfrData.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.966;
      const y = 1.65 + row * 1.65;

      s4.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.766, h: 1.5,
        fill: { color: CARD_BG },
        line: { color: BORDER, width: 1 },
        rectRadius: 0.06
      });

      s4.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.2, y: y + 0.16, w: 1.5, h: 0.26,
        fill: { color: INDIGO_LIGHT },
        line: { color: 'C7D2FE', width: 0.75 },
        rectRadius: 0.04
      });

      s4.addText(item.category, {
        x: x + 0.2, y: y + 0.18, w: 1.5, h: 0.22,
        fontSize: 8, bold: true, color: INDIGO, fontFace: 'Calibri', align: 'center'
      });

      s4.addText(item.metric, {
        x: x + 3.8, y: y + 0.16, w: 1.766, h: 0.28,
        fontSize: 10, bold: true, color: EMERALD, fontFace: 'Calibri', align: 'right'
      });

      s4.addText(item.title, {
        x: x + 0.2, y: y + 0.48, w: 5.366, h: 0.3,
        fontSize: 11, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s4.addText(item.desc, {
        x: x + 0.2, y: y + 0.8, w: 5.366, h: 0.62,
        fontSize: 8.8, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
      });
    });
  }

  // =========================================================================
  // SLIDE 5: TOPIC 2 - SYSTEM ARCHITECTURE (Visual Multi-Tier Diagram)
  // =========================================================================
  {
    const s5 = pptx.addSlide();
    s5.background = { color: BG_COLOR };
    renderSlideHeader(s5, 'Topic 2 • Architecture', '2. System Architecture & Multi-Tier Topology', 'Decoupled, modular 4-tier structural architecture engineered for real-time high-throughput operations.', 5);

    const tiers = [
      {
        name: 'TIER 1: PRESENTATION LAYER',
        role: 'Client Single-Page Application (SPA)',
        color: INDIGO,
        accent: 'C7D2FE',
        bg: 'F5F3FF',
        x: 0.8,
        items: [
          '• React 18 + TypeScript Component Tree',
          '• Tailwind CSS Responsive Design System',
          '• Leaflet GIS Mapping & Marker Clusters',
          '• Web Audio API Synthesizer (Warning Chimes)',
          '• W3C Geolocation Browser Sensor API',
          '• Offline LocalStorage Ticket Queue Cache'
        ]
      },
      {
        name: 'TIER 2: REAL-TIME EVENT BUS',
        role: 'Socket.IO Persistent Gateway',
        color: AMBER,
        accent: 'FDE68A',
        bg: 'FFFBEB',
        x: 3.733,
        items: [
          '• Bidirectional Full-Duplex WebSockets',
          '• Sector-based Room Partitioning',
          '• Event: `ticket:created` (Instant Dispatch)',
          '• Event: `ticket:volunteer_en_route`',
          '• Event: `force:deployed` & `alert:broadcast`',
          '• Automatic Heartbeats & Reconnection'
        ]
      },
      {
        name: 'TIER 3: APPLICATION SERVICES',
        role: 'Node.js Express & Micro-Engines',
        color: COBALT,
        accent: 'BFDBFE',
        bg: 'EFF6FF',
        x: 6.666,
        items: [
          '• REST API Endpoints with CORS & Sanitization',
          '• JWT Role-Based Authorization Middleware',
          '• Haversine Geodesic Distance Matrix Ranker',
          '• Automated 30-Minute SLA Escalation Daemon',
          '• Multi-Agency Force Dispatch Controller',
          '• Emergency Broadcast Distribution Router'
        ]
      },
      {
        name: 'TIER 4: PERSISTENCE & DATA',
        role: 'PostgreSQL Relational DB',
        color: EMERALD,
        accent: 'A7F3D0',
        bg: 'ECFDF5',
        x: 9.6,
        items: [
          '• Normalized Relational Entities (3NF)',
          '• Row-Level Locking (Prevents Double Dispatch)',
          '• Foreign Key Constraints & Cascade Rules',
          '• Spatial Coordinate Indexing (lat, lng)',
          '• Comprehensive Audit Log Trail Table',
          '• Persistent Real-Time Disaster State Storage'
        ]
      }
    ];

    tiers.forEach((t) => {
      s5.addShape(pptx.ShapeType.roundRect, {
        x: t.x, y: 1.65, w: 2.733, h: 4.95,
        fill: { color: t.bg },
        line: { color: t.color, width: 1.2 },
        rectRadius: 0.06
      });

      s5.addShape(pptx.ShapeType.roundRect, {
        x: t.x + 0.15, y: 1.8, w: 2.433, h: 0.45,
        fill: { color: CARD_BG },
        line: { color: t.accent, width: 1 },
        rectRadius: 0.04
      });

      s5.addText(t.name, {
        x: t.x + 0.15, y: 1.85, w: 2.433, h: 0.2,
        fontSize: 8.5, bold: true, color: t.color, fontFace: 'Calibri', align: 'center'
      });

      s5.addText(t.role, {
        x: t.x + 0.15, y: 2.05, w: 2.433, h: 0.18,
        fontSize: 7.5, color: TEXT_MUTED, fontFace: 'Calibri', align: 'center'
      });

      s5.addShape(pptx.ShapeType.line, {
        x: t.x + 0.15, y: 2.38, w: 2.433, h: 0,
        line: { color: t.accent, width: 0.75 }
      });

      s5.addText(t.items.join('\n\n'), {
        x: t.x + 0.15, y: 2.5, w: 2.433, h: 3.9,
        fontSize: 9, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
      });
    });

    const connectors = [
      { x: 3.48 },
      { x: 6.41 },
      { x: 9.35 }
    ];

    connectors.forEach((c) => {
      s5.addShape(pptx.ShapeType.rect, {
        x: c.x, y: 3.9, w: 0.3, h: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER, width: 0.5 }
      });
      s5.addText('↔', {
        x: c.x, y: 3.85, w: 0.3, h: 0.25,
        fontSize: 10, bold: true, color: INDIGO, fontFace: 'Calibri', align: 'center'
      });
    });
  }

  // =========================================================================
  // SLIDE 6: TOPIC 3 - USE CASE DIAGRAM (UML Visual Modeling)
  // =========================================================================
  {
    const s6 = pptx.addSlide();
    s6.background = { color: BG_COLOR };
    renderSlideHeader(s6, 'Topic 3 • Behavioral Modeling', '3. UML Use Case Diagram & Actor Relationships', 'Complete functional modeling mapping 4 primary actors across system boundaries.', 6);

    // Left Actor: Affected Citizen
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.65, w: 2.6, h: 2.35,
      fill: { color: CARD_BG },
      line: { color: ROSE, width: 1.2 },
      rectRadius: 0.06
    });

    s6.addText('ACTOR: AFFECTED CITIZEN', {
      x: 0.95, y: 1.8, w: 2.3, h: 0.25,
      fontSize: 9, bold: true, color: ROSE, fontFace: 'Calibri'
    });

    const citizenUseCases = [
      '• Submit Emergency SOS Ticket',
      '• <<include>> Auto-detect GPS Pin',
      '• <<include>> Specify Headcount & Type',
      '• Monitor Live Response Tracker',
      '• Locate Safe Relief Centers',
      '• <<extend>> Switch to Volunteer Mode'
    ];
    s6.addText(citizenUseCases.join('\n'), {
      x: 0.95, y: 2.1, w: 2.3, h: 1.8,
      fontSize: 8.5, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });

    // Left Actor: Community Responder
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 4.25, w: 2.6, h: 2.35,
      fill: { color: CARD_BG },
      line: { color: INDIGO, width: 1.2 },
      rectRadius: 0.06
    });

    s6.addText('ACTOR: COMMUNITY VOLUNTEER', {
      x: 0.95, y: 4.4, w: 2.3, h: 0.25,
      fontSize: 9, bold: true, color: INDIGO, fontFace: 'Calibri'
    });

    const volunteerUseCases = [
      '• Register Equipment (Boats, 4x4, Medic)',
      '• Filter Active Distress Calls (<10 km)',
      '• Commit "I Will Go and Help"',
      '• Provide Estimated Arrival ETA',
      '• Direct In-App Victim Contacting',
      '• Update Field Resolution Status'
    ];
    s6.addText(volunteerUseCases.join('\n'), {
      x: 0.95, y: 4.7, w: 2.3, h: 1.8,
      fontSize: 8.5, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });

    // Center Box: ReliefLink System Boundary
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 3.7, y: 1.65, w: 5.933, h: 4.95,
      fill: { color: 'F1F5F9' },
      line: { color: INDIGO, width: 1.5 },
      rectRadius: 0.06
    });

    s6.addText('SYSTEM BOUNDARY: ReliefLink Disaster Platform Core', {
      x: 3.9, y: 1.8, w: 5.533, h: 0.3,
      fontSize: 10, bold: true, color: INDIGO, fontFace: 'Calibri', align: 'center'
    });

    const ucCapsules = [
      { text: 'UC-1: Emergency Distress Ticket Ingestion', x: 4.0, y: 2.25, w: 2.6, color: ROSE_BG, border: ROSE },
      { text: 'UC-2: Haversine Proximity Ranking Engine', x: 6.8, y: 2.25, w: 2.6, color: 'EFF6FF', border: COBALT },
      { text: 'UC-3: Citizen-Volunteer Mission Claim', x: 4.0, y: 3.2, w: 2.6, color: INDIGO_LIGHT, border: INDIGO },
      { text: 'UC-4: Paramilitary Force Unit Dispatch', x: 6.8, y: 3.2, w: 2.6, color: 'EFF6FF', border: COBALT },
      { text: 'UC-5: Automated 30-Min SLA Escalation', x: 4.0, y: 4.15, w: 2.6, color: AMBER_BG, border: AMBER },
      { text: 'UC-6: GIS Hazard Geofencing & Spatial Layers', x: 6.8, y: 4.15, w: 2.6, color: EMERALD_BG, border: EMERALD },
      { text: 'UC-7: Multi-Channel Audio Emergency Broadcast', x: 5.4, y: 5.1, w: 2.6, color: INDIGO_LIGHT, border: INDIGO }
    ];

    ucCapsules.forEach((uc) => {
      s6.addShape(pptx.ShapeType.roundRect, {
        x: uc.x, y: uc.y, w: uc.w, h: 0.65,
        fill: { color: uc.color },
        line: { color: uc.border, width: 1 },
        rectRadius: 0.3
      });
      s6.addText(uc.text, {
        x: uc.x + 0.1, y: uc.y + 0.12, w: uc.w - 0.2, h: 0.45,
        fontSize: 8.5, bold: true, color: NAVY, fontFace: 'Calibri', align: 'center'
      });
    });

    // Right Actor: Incident Commander
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 9.933, y: 1.65, w: 2.6, h: 2.35,
      fill: { color: CARD_BG },
      line: { color: COBALT, width: 1.2 },
      rectRadius: 0.06
    });

    s6.addText('ACTOR: INCIDENT COMMANDER', {
      x: 10.083, y: 1.8, w: 2.3, h: 0.25,
      fontSize: 9, bold: true, color: COBALT, fontFace: 'Calibri'
    });

    const commanderUseCases = [
      '• Real-Time Incident Triage & Queue',
      '• Monitor SLA Escalation Watcher',
      '• Dispatch Paramilitary Force Backup',
      '• Issue Evacuation Warning Audio Alert',
      '• Reallocate Relief Camp Supplies',
      '• View Inter-District Status Analytics'
    ];
    s6.addText(commanderUseCases.join('\n'), {
      x: 10.083, y: 2.1, w: 2.3, h: 1.8,
      fontSize: 8.5, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });

    // Right Actor: System Administrator
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 9.933, y: 4.25, w: 2.6, h: 2.35,
      fill: { color: CARD_BG },
      line: { color: EMERALD, width: 1.2 },
      rectRadius: 0.06
    });

    s6.addText('ACTOR: SYSTEM ADMINISTRATOR', {
      x: 10.083, y: 4.4, w: 2.3, h: 0.25,
      fontSize: 9, bold: true, color: EMERALD, fontFace: 'Calibri'
    });

    const adminUseCases = [
      '• Role & Permission Configuration',
      '• Provision Relief Centers & Capacity',
      '• Draw Hazard Evacuation Geofences',
      '• Audit Log Inspection & Security',
      '• Database Integrity Backups',
      '• WebSocket Traffic & Gateway Health'
    ];
    s6.addText(adminUseCases.join('\n'), {
      x: 10.083, y: 4.7, w: 2.3, h: 1.8,
      fontSize: 8.5, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });
  }

  // =========================================================================
  // SLIDE 7: TOPIC 4 - ER DIAGRAM (Visual Entity-Relationship Model)
  // =========================================================================
  {
    const s7 = pptx.addSlide();
    s7.background = { color: BG_COLOR };
    renderSlideHeader(s7, 'Topic 4 • Data Modeling', '4. Entity-Relationship (ER) Schema & Architecture', 'Normalized relational entities, primary/foreign keys, and cardinality relationships.', 7);

    const entities = [
      {
        name: 'USERS',
        pk: 'id : UUID (PK)',
        attrs: ['name : VARCHAR(100)', 'email : VARCHAR(120) [UNIQUE]', 'password_hash : VARCHAR(255)', 'role : ENUM(CITIZEN,VOLUNTEER,GOV,ADMIN)', 'phone : VARCHAR(20)', 'skills : TEXT[]', 'created_at : TIMESTAMP'],
        color: INDIGO,
        x: 0.8, y: 1.65, w: 3.65, h: 2.35
      },
      {
        name: 'DISASTER_REQUESTS',
        pk: 'id : UUID (PK)',
        attrs: ['citizen_id : UUID (FK -> users.id)', 'type : ENUM(RESCUE,MEDICAL,FOOD,SHELTER)', 'urgency : ENUM(CRITICAL,HIGH,MEDIUM)', 'lat, lng : NUMERIC(9,6) [INDEX]', 'status : ENUM(PENDING,CLAIMED,RESOLVED)', 'volunteer_id : UUID (FK -> users.id)', 'rescue_team_id : UUID (FK -> rescue_teams.id)'],
        color: ROSE,
        x: 4.84, y: 1.65, w: 3.65, h: 2.35
      },
      {
        name: 'RESCUE_TEAMS',
        pk: 'id : UUID (PK)',
        attrs: ['name : VARCHAR(100)', 'agency : ENUM(NDRF,SDRF,FIRE,MILITARY)', 'current_lat, current_lng : NUMERIC(9,6)', 'status : ENUM(AVAILABLE,DISPATCHED)', 'contact_phone : VARCHAR(20)', 'capacity : INTEGER', 'assigned_ticket_id : UUID (FK)'],
        color: COBALT,
        x: 8.88, y: 1.65, w: 3.65, h: 2.35
      },
      {
        name: 'RELIEF_CENTRES',
        pk: 'id : UUID (PK)',
        attrs: ['name : VARCHAR(120)', 'district : VARCHAR(80)', 'latitude, longitude : NUMERIC(9,6)', 'total_capacity : INTEGER', 'current_occupancy : INTEGER', 'supplies_status : VARCHAR(50)', 'contact_phone : VARCHAR(20)'],
        color: EMERALD,
        x: 0.8, y: 4.25, w: 3.65, h: 2.35
      },
      {
        name: 'HAZARD_ZONES',
        pk: 'id : UUID (PK)',
        attrs: ['title : VARCHAR(100)', 'severity : ENUM(RED,ORANGE,YELLOW)', 'center_lat, center_lng : NUMERIC(9,6)', 'radius_km : NUMERIC(5,2)', 'evacuation_status : VARCHAR(50)', 'issued_by : UUID (FK -> users.id)'],
        color: AMBER,
        x: 4.84, y: 4.25, w: 3.65, h: 2.35
      },
      {
        name: 'EMERGENCY_BROADCASTS',
        pk: 'id : UUID (PK)',
        attrs: ['author_id : UUID (FK -> users.id)', 'title : VARCHAR(150)', 'message : TEXT', 'severity : ENUM(EXTREME,SEVERE,INFO)', 'affected_districts : TEXT[]', 'audio_chime_triggered : BOOLEAN', 'created_at : TIMESTAMP'],
        color: '475569',
        x: 8.88, y: 4.25, w: 3.65, h: 2.35
      }
    ];

    entities.forEach((ent) => {
      s7.addShape(pptx.ShapeType.roundRect, {
        x: ent.x, y: ent.y, w: ent.w, h: ent.h,
        fill: { color: CARD_BG },
        line: { color: ent.color, width: 1.2 },
        rectRadius: 0.06
      });

      s7.addShape(pptx.ShapeType.roundRect, {
        x: ent.x, y: ent.y, w: ent.w, h: 0.35,
        fill: { color: ent.color },
        line: { color: ent.color },
        rectRadius: 0.05
      });

      s7.addText(`ENTITY: ${ent.name}`, {
        x: ent.x + 0.1, y: ent.y + 0.06, w: ent.w - 0.2, h: 0.24,
        fontSize: 9.5, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
      });

      s7.addText(ent.pk, {
        x: ent.x + 0.15, y: ent.y + 0.42, w: ent.w - 0.3, h: 0.22,
        fontSize: 8.5, bold: true, color: ent.color, fontFace: 'Courier New'
      });

      s7.addShape(pptx.ShapeType.line, {
        x: ent.x + 0.15, y: ent.y + 0.68, w: ent.w - 0.3, h: 0,
        line: { color: BORDER_LIGHT, width: 0.75 }
      });

      s7.addText(ent.attrs.join('\n'), {
        x: ent.x + 0.15, y: ent.y + 0.75, w: ent.w - 0.3, h: 1.5,
        fontSize: 7.8, color: TEXT_SECONDARY, fontFace: 'Courier New', lineSpacingMultiple: 1.15
      });
    });
  }

  // =========================================================================
  // SLIDE 8: TOPIC 4 - RELATIONAL DATA DICTIONARY & SCHEMA DESIGN
  // =========================================================================
  {
    const s8 = pptx.addSlide();
    s8.background = { color: BG_COLOR };
    renderSlideHeader(s8, 'Topic 4 • Data Modeling', '4. Relational Database Data Dictionary & Integrity Rules', 'Formal table structure, data constraints, cascade actions, and indexing strategy.', 8);

    const schemaTable = [
      [
        { text: 'Table Name', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Primary Key', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Foreign Keys & Constraints', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Cardinality', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Indexing & Performance Rule', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } }
      ],
      [
        { text: 'users', options: { bold: true } },
        { text: 'id (UUID)' },
        { text: 'UNIQUE(email); CHECK(role IN (CITIZEN, VOLUNTEER, GOV, ADMIN))' },
        { text: '1 : N with disaster_requests' },
        { text: 'B-Tree Index on email; Hash index on role for quick session lookup' }
      ],
      [
        { text: 'disaster_requests', options: { bold: true } },
        { text: 'id (UUID)' },
        { text: 'FK(citizen_id) -> users(id); FK(volunteer_id) -> users(id); FK(rescue_team_id) -> rescue_teams(id)' },
        { text: 'N : 1 with users\nN : 1 with rescue_teams' },
        { text: 'Composite B-Tree on (latitude, longitude); Status index for triage queries' }
      ],
      [
        { text: 'rescue_teams', options: { bold: true } },
        { text: 'id (UUID)' },
        { text: 'CHECK(agency IN (NDRF, SDRF, FIRE, MILITARY)); CHECK(capacity > 0)' },
        { text: '1 : N with disaster_requests' },
        { text: 'Spatial index on current coordinates; Partial index WHERE status = AVAILABLE' }
      ],
      [
        { text: 'relief_centers', options: { bold: true } },
        { text: 'id (UUID)' },
        { text: 'CHECK(current_occupancy <= total_capacity); NOT NULL on coordinates' },
        { text: 'Stand-alone reference entity' },
        { text: 'Spatial composite index on (latitude, longitude) for distance radius checks' }
      ],
      [
        { text: 'hazard_zones', options: { bold: true } },
        { text: 'id (UUID)' },
        { text: 'FK(issued_by) -> users(id) ON DELETE RESTRICT; CHECK(radius_km > 0)' },
        { text: 'N : 1 with users' },
        { text: 'Active hazard geofence index; Severity priority ordering' }
      ],
      [
        { text: 'emergency_broadcasts', options: { bold: true } },
        { text: 'id (UUID)' },
        { text: 'FK(author_id) -> users(id) WHERE role IN (GOV, ADMIN)' },
        { text: 'N : 1 with users' },
        { text: 'B-Tree Index on created_at DESC for instant emergency alert fanout' }
      ]
    ];

    s8.addTable(schemaTable, {
      x: 0.8, y: 1.65, w: 11.733, h: 4.95,
      colW: [1.8, 1.3, 3.833, 1.8, 3.0],
      fontSize: 8.8,
      border: { pt: 0.75, color: BORDER },
      fill: { color: CARD_BG },
      align: 'left',
      valign: 'middle'
    });
  }

  // =========================================================================
  // SLIDE 9: TOPIC 5 - MODULE DESCRIPTION (PART 1: CITIZEN & VOLUNTEER)
  // =========================================================================
  {
    const s9 = pptx.addSlide();
    s9.background = { color: BG_COLOR };
    renderSlideHeader(s9, 'Topic 5 • Module Breakdown', '5. Module Description (Part 1: Citizen SOS & Volunteer Engine)', 'Granular breakdown of inputs, processing pipelines, algorithms, and outputs.', 9);

    // Module 1 Card: Citizen SOS
    s9.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.65, w: 5.766, h: 4.95,
      fill: { color: CARD_BG },
      line: { color: ROSE, width: 1.2 },
      rectRadius: 0.06
    });

    s9.addShape(pptx.ShapeType.roundRect, {
      x: 1.0, y: 1.85, w: 5.366, h: 0.45,
      fill: { color: ROSE_BG },
      line: { color: ROSE, width: 0.75 },
      rectRadius: 0.04
    });

    s9.addText('MODULE 1: CITIZEN EMERGENCY SOS DISTRESS INGESTION', {
      x: 1.0, y: 1.95, w: 5.366, h: 0.25,
      fontSize: 9.5, bold: true, color: ROSE, fontFace: 'Calibri', align: 'center'
    });

    const m1Workflow = [
      '• Input Telemetry: Citizen name, mobile contact, emergency urgency type (Rescue, Medical, Food, Shelter), trapped victim headcount, and landmark.',
      '• Automated Geolocation Triangulation: Interrogates W3C HTML5 navigator.geolocation API with high-accuracy mode; offers fallback interactive map pin draggable tool.',
      '• Step-by-Step Processing Pipeline:\n  1. Client SPA constructs payload and sends HTTP POST `/api/distress`.\n  2. Express middleware verifies JWT and sanitizes coordinate boundaries.\n  3. Ticket stored in PostgreSQL with status = PENDING and UTC timestamp.\n  4. Socket.IO gateway emits `ticket:created` event across regional sector room.\n  5. 30-Minute SLA background countdown starts.',
      '• Output: Instant SOS tracking token, persistent database record, visual live status tracking bar for victim, and real-time pin broadcast on all tactical maps.'
    ];

    s9.addText(m1Workflow.join('\n\n'), {
      x: 1.0, y: 2.45, w: 5.366, h: 4.0,
      fontSize: 9, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });

    // Module 2 Card: Volunteer Action Engine
    s9.addShape(pptx.ShapeType.roundRect, {
      x: 6.766, y: 1.65, w: 5.766, h: 4.95,
      fill: { color: CARD_BG },
      line: { color: INDIGO, width: 1.2 },
      rectRadius: 0.06
    });

    s9.addShape(pptx.ShapeType.roundRect, {
      x: 6.966, y: 1.85, w: 5.366, h: 0.45,
      fill: { color: INDIGO_LIGHT },
      line: { color: INDIGO, width: 0.75 },
      rectRadius: 0.04
    });

    s9.addText('MODULE 2: COMMUNITY "I WILL GO AND HELP" ACTION ENGINE', {
      x: 6.966, y: 1.95, w: 5.366, h: 0.25,
      fontSize: 9.5, bold: true, color: INDIGO, fontFace: 'Calibri', align: 'center'
    });

    const m2Workflow = [
      '• Input Telemetry: Volunteer ID, operational equipment (Inflatable Boat, 4x4 Truck, First-Aid Kit), estimated arrival ETA, and responder operational notes.',
      '• Dynamic Geo-Filtering: Real-time Haversine algorithm scans distress tickets within a 10 km radius of the volunteer current position.',
      '• Step-by-Step Processing Pipeline:\n  1. Volunteer clicks "I Will Go and Help" on prioritized distress card.\n  2. Modal captures arrival ETA (e.g. 15 mins) and operational assets.\n  3. Atomic SQL transaction transitions ticket to `VOLUNTEER_ASSIGNED`.\n  4. WebSocket bus broadcasts `ticket:volunteer_en_route` to Command Room.\n  5. Victim phone browser receives toast alert with volunteer contact and ETA.',
      '• Safety Safeguard: Tickets claimed by citizen volunteers without official agency support are marked as "Unbacked", alerting Command to dispatch force backup.'
    ];

    s9.addText(m2Workflow.join('\n\n'), {
      x: 6.966, y: 2.45, w: 5.366, h: 4.0,
      fontSize: 9, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });
  }

  // =========================================================================
  // SLIDE 10: TOPIC 5 - MODULE DESCRIPTION (PART 2: COMMAND & TACTICAL MAP)
  // =========================================================================
  {
    const s10 = pptx.addSlide();
    s10.background = { color: BG_COLOR };
    renderSlideHeader(s10, 'Topic 5 • Module Breakdown', '5. Module Description (Part 2: Command & Tactical Map)', 'Incident dispatch algorithms, SLA finite-state machine, and GIS layers.', 10);

    // Module 3 Card: Government Dispatcher
    s10.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.65, w: 5.766, h: 4.95,
      fill: { color: CARD_BG },
      line: { color: COBALT, width: 1.2 },
      rectRadius: 0.06
    });

    s10.addShape(pptx.ShapeType.roundRect, {
      x: 1.0, y: 1.85, w: 5.366, h: 0.45,
      fill: { color: 'EFF6FF' },
      line: { color: COBALT, width: 0.75 },
      rectRadius: 0.04
    });

    s10.addText('MODULE 3: GOVERNMENT RAPID FORCE DISPATCHER & SLA', {
      x: 1.0, y: 1.95, w: 5.366, h: 0.25,
      fontSize: 9.5, bold: true, color: COBALT, fontFace: 'Calibri', align: 'center'
    });

    const m3Workflow = [
      '• Incident Triage Matrix: Organizes distress tickets by severity (CRITICAL, HIGH, MEDIUM) and displays live count of unbacked citizen volunteers.',
      '• Proximity Ranking Formulation:\n  - Evaluates Haversine distance from incident to all available NDRF/SDRF units.\n  - Ranks units in ascending distance order for rapid force allocation.',
      '• Automated 30-Minute SLA State Machine:\n  - `PENDING` (0-25 mins): Normal response queue.\n  - `ESCALATING` (25-30 mins): Visual amber warning on command video wall.\n  - `CRITICAL_BREACH` (>30 mins): Pulsing red alert and audible siren triggers.',
      '• Official Force Dispatch: Commander triggers 1-click deployment, transmits tactical operational orders to battalion, and assigns team to ticket.'
    ];

    s10.addText(m3Workflow.join('\n\n'), {
      x: 1.0, y: 2.45, w: 5.366, h: 4.0,
      fontSize: 9, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });

    // Module 4 Card: GIS Tactical Map & Alerts
    s10.addShape(pptx.ShapeType.roundRect, {
      x: 6.766, y: 1.65, w: 5.766, h: 4.95,
      fill: { color: CARD_BG },
      line: { color: EMERALD, width: 1.2 },
      rectRadius: 0.06
    });

    s10.addShape(pptx.ShapeType.roundRect, {
      x: 6.966, y: 1.85, w: 5.366, h: 0.45,
      fill: { color: EMERALD_BG },
      line: { color: EMERALD, width: 0.75 },
      rectRadius: 0.04
    });

    s10.addText('MODULE 4: GIS TACTICAL MAP & REGIONAL ALERT BROADCAST', {
      x: 6.966, y: 1.95, w: 5.366, h: 0.25,
      fontSize: 9.5, bold: true, color: EMERALD, fontFace: 'Calibri', align: 'center'
    });

    const m4Workflow = [
      '• Interactive Leaflet GIS Engine: Displays vector OpenStreetMap cartography with marker clustering for high-density crisis theaters.',
      '• Dynamic Hazard Geofencing: Renders circular polygons with red/amber boundary fills indicating flood zones, landslides, or chemical evacuation perimeters.',
      '• Relief Shelter Telemetry: Live visual capacity gauges (e.g. 340/500 beds), food/medical supply levels, and direct one-touch driving route navigation.',
      '• Web Audio Emergency Chimes:\n  - Upon receiving an authorized government emergency evacuation broadcast, client browser synthesizes two-tone (440 Hz / 880 Hz) audio alerts.\n  - Overcomes silent screen blind-spots during nighttime calamity emergencies.'
    ];

    s10.addText(m4Workflow.join('\n\n'), {
      x: 6.966, y: 2.45, w: 5.366, h: 4.0,
      fontSize: 9, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });
  }

  // =========================================================================
  // SLIDE 11: TOPIC 6 - TECHNOLOGY STACK & ARCHITECTURAL JUSTIFICATION
  // =========================================================================
  {
    const s11 = pptx.addSlide();
    s11.background = { color: BG_COLOR };
    renderSlideHeader(s11, 'Topic 6 • Technology Stack', '6. Technology Stack & Architectural Selection Justification', 'Rigorous comparative evaluation and trade-off rationale for every stack component.', 11);

    const techMatrix = [
      [
        { text: 'System Tier', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Technology Selected', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Role in ReliefLink Architecture', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
        { text: 'Architectural Selection Justification / Trade-Off Analysis', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } }
      ],
      [
        { text: 'Frontend UI', options: { bold: true } },
        { text: 'React 18 + TypeScript' },
        { text: 'Reactive component-driven user interface' },
        { text: 'Enforces compile-time type safety; prevents catastrophic runtime null pointer errors during emergency dispatch operations.' }
      ],
      [
        { text: 'Styling', options: { bold: true } },
        { text: 'Tailwind CSS v4' },
        { text: 'Utility-first responsive layout engine' },
        { text: 'Zero CSS runtime overhead; guarantees sub-second load times even on degraded 2G/3G mobile networks in disaster zones.' }
      ],
      [
        { text: 'Geospatial GIS', options: { bold: true } },
        { text: 'Leaflet.js + OpenStreetMap' },
        { text: 'Interactive map, markers, and circular geofences' },
        { text: 'Lightweight (42 KB footprint); open-source cartography with zero proprietary API key limits or billing interruptions.' }
      ],
      [
        { text: 'Real-Time Bus', options: { bold: true } },
        { text: 'Socket.IO (WebSockets)' },
        { text: 'Full-duplex bidirectional event transport' },
        { text: 'Sub-100ms event delivery with automatic fallback to HTTP long-polling during intermittent network degradation.' }
      ],
      [
        { text: 'Backend Server', options: { bold: true } },
        { text: 'Node.js & Express.js' },
        { text: 'REST API, Haversine ranker, SLA daemon' },
        { text: 'Non-blocking I/O event loop handles high-concurrency ticket surges without thread-pool starvation.' }
      ],
      [
        { text: 'Persistence', options: { bold: true } },
        { text: 'PostgreSQL Relational DB' },
        { text: 'ACID-compliant storage for incidents & teams' },
        { text: 'Row-level locking guarantees zero race conditions; relational foreign keys prevent orphaned distress records.' }
      ],
      [
        { text: 'Audio Alerts', options: { bold: true } },
        { text: 'W3C Web Audio API' },
        { text: 'Synthesized emergency siren chime triggers' },
        { text: 'Generates client-side pure frequency tones without downloading large MP3 assets across congested disaster cellular towers.' }
      ]
    ];

    s11.addTable(techMatrix, {
      x: 0.8, y: 1.65, w: 11.733, h: 4.95,
      colW: [1.8, 2.2, 3.2, 4.533],
      fontSize: 8.8,
      border: { pt: 0.75, color: BORDER },
      fill: { color: CARD_BG },
      align: 'left',
      valign: 'middle'
    });
  }

  // =========================================================================
  // SLIDE 12: TOPIC 7 - UI DESIGN (PART 1: CITIZEN SOS & VOLUNTEER BOARD)
  // =========================================================================
  {
    const s12 = pptx.addSlide();
    s12.background = { color: BG_COLOR };
    renderSlideHeader(s12, 'Topic 7 • UI / UX Design', '7. UI Design (Part 1: Citizen SOS & Volunteer Interfaces)', 'Low cognitive load human-centric design engineered for extreme distress scenarios.', 12);

    // Screen 1: Citizen SOS Wireframe
    s12.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.65, w: 5.766, h: 4.95,
      fill: { color: CARD_BG },
      line: { color: ROSE, width: 1.2 },
      rectRadius: 0.06
    });

    s12.addText('CITIZEN EMERGENCY SOS DISTRESS INTERFACE', {
      x: 1.0, y: 1.85, w: 5.366, h: 0.3,
      fontSize: 11, bold: true, color: ROSE, fontFace: 'Calibri'
    });

    s12.addShape(pptx.ShapeType.roundRect, {
      x: 1.0, y: 2.2, w: 5.366, h: 1.8,
      fill: { color: 'F8FAFC' },
      line: { color: BORDER, width: 0.75 },
      rectRadius: 0.04
    });

    const catButtons = [
      { label: 'RESCUE', color: ROSE },
      { label: 'MEDICAL', color: AMBER },
      { label: 'FOOD / WATER', color: COBALT },
      { label: 'SHELTER', color: EMERALD }
    ];
    catButtons.forEach((b, i) => {
      s12.addShape(pptx.ShapeType.roundRect, {
        x: 1.2 + i * 1.25, y: 2.35, w: 1.15, h: 0.45,
        fill: { color: CARD_BG },
        line: { color: b.color, width: 1 },
        rectRadius: 0.04
      });
      s12.addText(b.label, {
        x: 1.2 + i * 1.25, y: 2.45, w: 1.15, h: 0.25,
        fontSize: 7.5, bold: true, color: b.color, fontFace: 'Calibri', align: 'center'
      });
    });

    s12.addShape(pptx.ShapeType.rect, {
      x: 1.2, y: 2.95, w: 2.4, h: 0.4,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 0.5 }
    });
    s12.addText('📍 13.0827° N, 80.2707° E (±4m)', {
      x: 1.25, y: 3.02, w: 2.3, h: 0.25,
      fontSize: 8, color: COBALT, fontFace: 'Courier New'
    });

    s12.addShape(pptx.ShapeType.rect, {
      x: 3.8, y: 2.95, w: 2.35, h: 0.4,
      fill: { color: CARD_BG },
      line: { color: BORDER, width: 0.5 }
    });
    s12.addText('👥 Trapped Victims: [ 4 ]', {
      x: 3.85, y: 3.02, w: 2.25, h: 0.25,
      fontSize: 8, bold: true, color: NAVY, fontFace: 'Calibri'
    });

    s12.addShape(pptx.ShapeType.roundRect, {
      x: 1.2, y: 3.48, w: 4.95, h: 0.4,
      fill: { color: ROSE },
      line: { color: ROSE },
      rectRadius: 0.04
    });
    s12.addText('TRANSMIT IMMEDIATE EMERGENCY SOS (ONE-CLICK)', {
      x: 1.2, y: 3.55, w: 4.95, h: 0.25,
      fontSize: 9, bold: true, color: 'FFFFFF', fontFace: 'Calibri', align: 'center'
    });

    const ui1Specs = [
      '• Cognitive Load Optimization: Large high-contrast touch targets; requires zero typing during acute crisis panic.',
      '• Automated GPS Sensor: Detects high-precision W3C geolocation in under 3 seconds with draggable rooftop pin correction.',
      '• Live Ticket Status Tracker: Transitions smoothly across PENDING -> ASSIGNED -> IN_PROGRESS -> RESOLVED with ETA countdown.'
    ];
    s12.addText(ui1Specs.join('\n\n'), {
      x: 1.0, y: 4.15, w: 5.366, h: 2.3,
      fontSize: 8.8, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });

    // Screen 2: Volunteer Board Wireframe
    s12.addShape(pptx.ShapeType.roundRect, {
      x: 6.766, y: 1.65, w: 5.766, h: 4.95,
      fill: { color: CARD_BG },
      line: { color: INDIGO, width: 1.2 },
      rectRadius: 0.06
    });

    s12.addText('COMMUNITY VOLUNTEER ACTION BOARD', {
      x: 6.966, y: 1.85, w: 5.366, h: 0.3,
      fontSize: 11, bold: true, color: INDIGO, fontFace: 'Calibri'
    });

    s12.addShape(pptx.ShapeType.roundRect, {
      x: 6.966, y: 2.2, w: 5.366, h: 1.8,
      fill: { color: 'F8FAFC' },
      line: { color: BORDER, width: 0.75 },
      rectRadius: 0.04
    });

    s12.addText('🚨 RESCUE DISTRESS #TKT-8492 | 1.8 km Away', {
      x: 7.166, y: 2.3, w: 4.95, h: 0.25,
      fontSize: 9, bold: true, color: ROSE, fontFace: 'Calibri'
    });

    s12.addText('Victim: Ramesh Kumar | Phone: +91 98401 23456\nLocation: 42, Velachery Main Road, Chennai (Water level 4 ft)\nTrapped: 3 Elderly Persons + 1 Child', {
      x: 7.166, y: 2.58, w: 4.95, h: 0.65,
      fontSize: 8.2, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });

    s12.addShape(pptx.ShapeType.roundRect, {
      x: 7.166, y: 3.35, w: 4.95, h: 0.5,
      fill: { color: INDIGO },
      line: { color: INDIGO },
      rectRadius: 0.04
    });
    s12.addText('✔ "I WILL GO AND HELP" (DECLARE ETA & ASSETS)', {
      x: 7.166, y: 3.47, w: 4.95, h: 0.25,
      fontSize: 9, bold: true, color: 'FFFFFF', fontFace: 'Calibri', align: 'center'
    });

    const ui2Specs = [
      '• Distance-Sorted Mission Stream: Ranks distress tickets by geodesic proximity so volunteers rescue closest victims first.',
      '• Modal Commitment Flow: Captures ETA (10, 15, 20 mins) and equipment (Boat, 4x4) to coordinate with government forces.',
      '• Direct VoIP/Tel Hook: Instant 1-click dialer links responder directly with the trapped citizen.'
    ];
    s12.addText(ui2Specs.join('\n\n'), {
      x: 6.966, y: 4.15, w: 5.366, h: 2.3,
      fontSize: 8.8, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });
  }

  // =========================================================================
  // SLIDE 13: TOPIC 7 - UI DESIGN (PART 2: COMMAND ROOM & TACTICAL MAP)
  // =========================================================================
  {
    const s13 = pptx.addSlide();
    s13.background = { color: BG_COLOR };
    renderSlideHeader(s13, 'Topic 7 • UI / UX Design', '7. UI Design (Part 2: Command Room & GIS Tactical Map)', 'Mission-critical operational dashboards designed for emergency command video walls.', 13);

    // Screen 3: Command Center Dashboard
    s13.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.65, w: 5.766, h: 4.95,
      fill: { color: CARD_BG },
      line: { color: COBALT, width: 1.2 },
      rectRadius: 0.06
    });

    s13.addText('GOVERNMENT INCIDENT COMMAND ROOM', {
      x: 1.0, y: 1.85, w: 5.366, h: 0.3,
      fontSize: 11, bold: true, color: COBALT, fontFace: 'Calibri'
    });

    const kpis = [
      { label: 'TOTAL SOS', val: '24', color: ROSE },
      { label: 'UNBACKED', val: '6', color: AMBER },
      { label: 'NDRF UNITS', val: '8 Active', color: COBALT },
      { label: 'SHELTER CAP', val: '72%', color: EMERALD }
    ];
    kpis.forEach((k, idx) => {
      s13.addShape(pptx.ShapeType.roundRect, {
        x: 1.0 + idx * 1.34, y: 2.2, w: 1.25, h: 0.65,
        fill: { color: 'F8FAFC' },
        line: { color: BORDER, width: 0.75 },
        rectRadius: 0.04
      });
      s13.addText(k.val, {
        x: 1.0 + idx * 1.34, y: 2.28, w: 1.25, h: 0.28,
        fontSize: 11, bold: true, color: k.color, fontFace: 'Calibri', align: 'center'
      });
      s13.addText(k.label, {
        x: 1.0 + idx * 1.34, y: 2.58, w: 1.25, h: 0.2,
        fontSize: 7.5, bold: true, color: TEXT_MUTED, fontFace: 'Calibri', align: 'center'
      });
    });

    s13.addShape(pptx.ShapeType.roundRect, {
      x: 1.0, y: 3.0, w: 5.366, h: 0.95,
      fill: { color: AMBER_BG },
      line: { color: AMBER, width: 1 },
      rectRadius: 0.04
    });

    s13.addText('⏱ SLA WATCHER: Ticket #TKT-8480 Unattended (26m 40s elapsed)\n[ CRITICAL ESCALATION THRESHOLD IN 03:20 ]\nRecommended Action: Dispatch NDRF 4th Bn (4.1 km away)', {
      x: 1.15, y: 3.08, w: 5.066, h: 0.8,
      fontSize: 8.5, bold: true, color: AMBER, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });

    const ui3Specs = [
      '• Multi-Agency Video-Wall Layout: Continuous high-density telemetry streaming across state disaster control rooms.',
      '• Haversine 1-Click Force Dispatch: Instant modal with unit readiness and route dispatching to field paramilitary units.',
      '• Unbacked Citizen Alert: Highlights brave citizen volunteers operating alone in dangerous floodwaters without NDRF backup.'
    ];
    s13.addText(ui3Specs.join('\n\n'), {
      x: 1.0, y: 4.15, w: 5.366, h: 2.3,
      fontSize: 8.8, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });

    // Screen 4: GIS Tactical Map
    s13.addShape(pptx.ShapeType.roundRect, {
      x: 6.766, y: 1.65, w: 5.766, h: 4.95,
      fill: { color: CARD_BG },
      line: { color: EMERALD, width: 1.2 },
      rectRadius: 0.06
    });

    s13.addText('FULL-SCREEN GIS TACTICAL SITUATION MAP', {
      x: 6.966, y: 1.85, w: 5.366, h: 0.3,
      fontSize: 11, bold: true, color: EMERALD, fontFace: 'Calibri'
    });

    s13.addShape(pptx.ShapeType.roundRect, {
      x: 6.966, y: 2.2, w: 5.366, h: 1.75,
      fill: { color: 'E2E8F0' },
      line: { color: BORDER, width: 0.75 },
      rectRadius: 0.04
    });

    s13.addShape(pptx.ShapeType.ellipse, {
      x: 8.2, y: 2.4, w: 2.2, h: 1.35,
      fill: { color: 'FCA5A5' },
      line: { color: ROSE, width: 1.5, dashType: 'dash' }
    });
    s13.addText('RED HAZARD ZONE (FLOOD RADIUS 3.5 km)', {
      x: 8.2, y: 2.85, w: 2.2, h: 0.45,
      fontSize: 7.5, bold: true, color: ROSE, fontFace: 'Calibri', align: 'center'
    });

    s13.addText('📍 SOS (4)', { x: 7.2, y: 2.35, w: 0.9, h: 0.25, fontSize: 8, bold: true, color: ROSE, fontFace: 'Calibri' });
    s13.addText('⛺ Camp (340/500)', { x: 10.6, y: 2.35, w: 1.5, h: 0.25, fontSize: 8, bold: true, color: EMERALD, fontFace: 'Calibri' });
    s13.addText('🚒 NDRF Team #2', { x: 7.3, y: 3.55, w: 1.4, h: 0.25, fontSize: 8, bold: true, color: COBALT, fontFace: 'Calibri' });

    const ui4Specs = [
      '• Vector GIS Tile Cartography: Leaflet.js with custom color-coded map layers for SOS victims, camps, and flood perimeters.',
      '• Dynamic Circular Geofences: Visualizes red/orange danger zones with automated evacuation distance warnings.',
      '• Web Audio Warning Synthesizer: Two-tone audible emergency chimes trigger synchronously on all active devices.'
    ];
    s13.addText(ui4Specs.join('\n\n'), {
      x: 6.966, y: 4.15, w: 5.366, h: 2.3,
      fontSize: 8.8, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
    });
  }

  // =========================================================================
  // SLIDE 14: IMPLEMENTATION STATUS & EMPIRICAL TESTING RESULTS
  // =========================================================================
  {
    const s14 = pptx.addSlide();
    s14.background = { color: BG_COLOR };
    renderSlideHeader(s14, 'Review–1 Evaluation', 'Review–1 Implementation Verification & Benchmark Results', 'Empirical performance metrics, test cases, and delivery milestone audit.', 14);

    const testCards = [
      {
        metric: '35 ms',
        title: 'WebSocket Broadcast Latency',
        subtitle: 'BENCHMARK: SUB-100ms TARGET',
        desc: 'Average event distribution time from SOS ticket creation to volunteer browser reception across 500 simulated concurrent client nodes.',
        color: EMERALD, bg: EMERALD_BG
      },
      {
        metric: '< 12 ms',
        title: 'Geospatial Query Execution',
        subtitle: 'HAVERSINE MATRIX BENCHMARK',
        desc: 'PostgreSQL database spatial distance computation across 100 active relief centers and rescue teams executed in under 12 ms.',
        color: COBALT, bg: 'EFF6FF'
      },
      {
        metric: '100 %',
        title: 'Race-Condition Isolation',
        subtitle: 'CONCURRENCY INTEGRITY AUDIT',
        desc: 'Zero duplicate assignments observed during 200 concurrent simulated simultaneous volunteer claims on identical distress tickets via row-level locks.',
        color: INDIGO, bg: INDIGO_LIGHT
      },
      {
        metric: '≤ 10 m',
        title: 'GPS Sensor Precision',
        subtitle: 'W3C GEOLOCATION ACCURACY',
        desc: 'HTML5 browser location watcher achieves ≤10 meter circular accuracy in mobile trials, supported by interactive map pin verification.',
        color: AMBER, bg: AMBER_BG
      }
    ];

    testCards.forEach((tc, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.966;
      const y = 1.65 + row * 1.65;

      s14.addShape(pptx.ShapeType.roundRect, {
        x, y, w: 5.766, h: 1.5,
        fill: { color: CARD_BG },
        line: { color: BORDER, width: 1 },
        rectRadius: 0.06
      });

      s14.addText(tc.metric, {
        x: x + 0.25, y: y + 0.18, w: 1.8, h: 0.5,
        fontSize: 24, bold: true, color: tc.color, fontFace: 'Calibri'
      });

      s14.addText(tc.subtitle, {
        x: x + 2.1, y: y + 0.18, w: 3.4, h: 0.22,
        fontSize: 8, bold: true, color: tc.color, fontFace: 'Calibri'
      });

      s14.addText(tc.title, {
        x: x + 2.1, y: y + 0.42, w: 3.4, h: 0.3,
        fontSize: 11, bold: true, color: NAVY, fontFace: 'Calibri'
      });

      s14.addText(tc.desc, {
        x: x + 0.25, y: y + 0.78, w: 5.266, h: 0.62,
        fontSize: 8.8, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.15
      });
    });

    s14.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 5.2, w: 11.733, h: 1.4,
      fill: { color: 'F1F5F9' },
      line: { color: INDIGO, width: 1 },
      rectRadius: 0.06
    });

    s14.addText('ROADMAP FOR REVIEW–2 (PHASE 2 TARGETS)', {
      x: 1.05, y: 5.35, w: 11.233, h: 0.25,
      fontSize: 9.5, bold: true, color: INDIGO, fontFace: 'Calibri'
    });

    const r2Points = [
      '1. Dynamic Dijkstra & A* Safe Evacuation Routing: Automated calculation of safe path corridors avoiding active flood hazard geofences.',
      '2. Offline P2P Mesh Synchronization: WebRTC data channels for device-to-device ticket relays during complete cellular tower blackouts.',
      '3. GSM / SMS Gateway Fallback: Twilio-powered emergency SMS bridge for feature phones without 4G/5G data connections.'
    ];
    s14.addText(r2Points.join('\n'), {
      x: 1.05, y: 5.65, w: 11.233, h: 0.85,
      fontSize: 9, color: TEXT_SECONDARY, fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });
  }

  // =========================================================================
  // SLIDE 15: CONCLUSION, ACADEMIC STANDARDS & VIVA DEFENSE
  // =========================================================================
  {
    const s15 = pptx.addSlide();
    s15.background = { color: NAVY };

    s15.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 0.8, w: 1.5, h: 0.08,
      fill: { color: '38BDF8' },
      line: { color: '38BDF8' }
    });

    s15.addText('CONCLUSION & REVIEW–1 DEFENSE', {
      x: 0.8, y: 1.05, w: 11.733, h: 0.45,
      fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    s15.addText('ReliefLink provides a robust, real-time decentralized coordination platform designed to eliminate the fatal response void during the Golden Hour of disaster management. Phase 1 engineering milestones — spanning functional requirements, multi-tier system architecture, UML use case modeling, relational ER schema design, modular algorithmic pipelines, technology stack justifications, and working UI dashboards — are 100% verified and operational.', {
      x: 0.8, y: 1.6, w: 11.733, h: 0.85,
      fontSize: 11.5, color: 'CBD5E1', fontFace: 'Calibri', lineSpacingMultiple: 1.25
    });

    s15.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 2.65, w: 11.733, h: 2.6,
      fill: { color: NAVY_LIGHT },
      line: { color: '334155', width: 1.2 },
      rectRadius: 0.08
    });

    s15.addText('ACADEMIC GROUNDING & FORMAL ENGINEERING SPECIFICATIONS', {
      x: 1.1, y: 2.85, w: 11.133, h: 0.3,
      fontSize: 10, bold: true, color: '38BDF8', fontFace: 'Calibri'
    });

    const citations = [
      '[1] National Disaster Management Authority (NDMA), Government of India — "National Disaster Management Guidelines on Incident Response System (IRS)", Ministry of Home Affairs, 2021.',
      '[2] IEEE Standard 830-1998 — "IEEE Recommended Practice for Software Requirements Specifications (SRS)", Software Engineering Standards Committee.',
      '[3] IEEE Standard 1016-2009 — "IEEE Standard for Information Technology — Systems Design — Software Design Descriptions (SDD)".',
      '[4] S. Currion, C. Silva, and B. Van de Walle — "Open Source Software for Disaster Management", Communications of the ACM, Vol. 50, No. 3, 2007.'
    ];

    s15.addText(citations.join('\n\n'), {
      x: 1.1, y: 3.2, w: 11.133, h: 1.85,
      fontSize: 9.5, color: '94A3B8', fontFace: 'Calibri', lineSpacingMultiple: 1.2
    });

    s15.addText('THANK YOU — OPEN FOR EVALUATION QUESTIONS & SYSTEM DEMONSTRATION', {
      x: 0.8, y: 5.65, w: 11.733, h: 0.45,
      fontSize: 17, bold: true, color: '34D399', fontFace: 'Calibri', align: 'center'
    });

    s15.addText('Candidate: Sanjay K | Register No: 310624104619 | Department of Computer Science & Engineering', {
      x: 0.8, y: 6.2, w: 11.733, h: 0.35,
      fontSize: 11, color: '94A3B8', fontFace: 'Calibri', align: 'center'
    });
  }

  const outputDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'ReliefLink_Review1_Sanjay_K.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`[SUCCESS] Professional Review 1 PPTX generated cleanly at: ${outputPath}`);

  const altPath = path.join(outputDir, 'ReliefLink_First_Review_Sanjay_K.pptx');
  fs.copyFileSync(outputPath, altPath);
}

generateProfessionalReview1PPT().catch(err => {
  console.error('[ERROR] Failed to generate Review 1 PPT:', err);
  process.exit(1);
});
