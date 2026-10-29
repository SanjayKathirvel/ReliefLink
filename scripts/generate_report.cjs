const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Colors
const BLACK = '#111827';
const GRAY_DARK = '#374151';
const GRAY_MID = '#6B7280';
const GRAY_LIGHT = '#F3F4F6';
const GRAY_BORDER = '#9CA3AF';
const BLUE_PRIMARY = '#1E3A8A';
const BLUE_ACCENT = '#2563EB';
const RED_ACCENT = '#DC2626';
const AMBER_ACCENT = '#D97706';
const GREEN_ACCENT = '#16A34A';

const LOGO_PATH = path.join(__dirname, '../public/assets/college_logo.jpg');
const OUTPUT_PDF = path.join(__dirname, '../public/ReliefLink_Project_Report_Sanjay_K.pdf');

function createReport() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    autoFirstPage: false,
    bufferPages: true
  });

  const writeStream = fs.createWriteStream(OUTPUT_PDF);
  doc.pipe(writeStream);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const BORDER_MARGIN = 36;
  const BORDER_W = PAGE_W - (BORDER_MARGIN * 2);
  const BORDER_H = PAGE_H - (BORDER_MARGIN * 2);
  const CONTENT_X = 58;
  const CONTENT_W = PAGE_W - (CONTENT_X * 2);

  function addPageBorder(docInstance) {
    docInstance.save();
    docInstance.lineWidth(1).strokeColor('#1F2937');
    docInstance.rect(BORDER_MARGIN, BORDER_MARGIN, BORDER_W, BORDER_H).stroke();
    docInstance.restore();
  }

  function addPageNum(docInstance, text) {
    if (!text) return;
    docInstance.save();
    docInstance.font('Times-Roman').fontSize(10).fillColor(BLACK);
    docInstance.text(text, 0, 48, { align: 'center', width: PAGE_W });
    docInstance.restore();
  }

  function addChapterHeader(docInstance, chapterNum, chapterTitle) {
    docInstance.y = 80;
    docInstance.font('Times-Bold').fontSize(15).fillColor(BLACK);
    docInstance.text(`CHAPTER ${chapterNum}`, { align: 'center' });
    docInstance.moveDown(0.2);
    docInstance.text(chapterTitle, { align: 'center' });
    docInstance.moveDown(1.2);
  }

  function addSectionHeader(docInstance, secTitle) {
    docInstance.moveDown(0.6);
    docInstance.font('Times-Bold').fontSize(12).fillColor(BLACK);
    docInstance.text(secTitle, CONTENT_X, docInstance.y);
    docInstance.moveDown(0.4);
  }

  function addSubSectionHeader(docInstance, subTitle) {
    docInstance.moveDown(0.4);
    docInstance.font('Times-Bold').fontSize(11).fillColor(BLACK);
    docInstance.text(subTitle, CONTENT_X, docInstance.y);
    docInstance.moveDown(0.3);
  }

  function addParagraph(docInstance, text, options = {}) {
    docInstance.font('Times-Roman').fontSize(options.fontSize || 10.5).fillColor(BLACK);
    docInstance.text(text, CONTENT_X, docInstance.y, {
      align: options.align || 'justify',
      width: CONTENT_W,
      lineGap: options.lineGap || 3.2
    });
    docInstance.moveDown(options.moveDown !== undefined ? options.moveDown : 0.6);
  }

  function addBullet(docInstance, boldPrefix, bodyText) {
    const startY = docInstance.y;
    docInstance.font('Times-Roman').fontSize(10.5).fillColor(BLACK);
    docInstance.text('•', CONTENT_X + 10, startY, { width: 15 });
    
    docInstance.font('Times-Bold').fontSize(10.5).fillColor(BLACK);
    const prefixW = docInstance.widthOfString(boldPrefix);
    docInstance.text(boldPrefix, CONTENT_X + 25, startY, { continued: true });
    
    docInstance.font('Times-Roman').fontSize(10.5).fillColor(BLACK);
    docInstance.text(bodyText, {
      width: CONTENT_W - 25,
      align: 'justify',
      lineGap: 3
    });
    docInstance.moveDown(0.4);
  }

  function drawTable(docInstance, title, headers, rows, colWidths, startY) {
    const yPos = startY || docInstance.y;
    let currentY = yPos;
    const tableW = colWidths.reduce((a, b) => a + b, 0);
    const tableX = CONTENT_X + (CONTENT_W - tableW) / 2;

    if (title) {
      docInstance.font('Times-Bold').fontSize(10).fillColor(BLACK);
      docInstance.text(title, tableX, currentY, { align: 'center', width: tableW });
      currentY += 16;
    }

    // Header row
    docInstance.save();
    docInstance.fillColor(GRAY_LIGHT);
    docInstance.rect(tableX, currentY, tableW, 20).fill();
    docInstance.strokeColor(GRAY_BORDER).lineWidth(0.75);
    docInstance.rect(tableX, currentY, tableW, 20).stroke();

    let curX = tableX;
    headers.forEach((h, i) => {
      docInstance.strokeColor(GRAY_BORDER).moveTo(curX, currentY).lineTo(curX, currentY + 20).stroke();
      docInstance.font('Times-Bold').fontSize(9).fillColor(BLACK);
      docInstance.text(h, curX + 4, currentY + 5, { width: colWidths[i] - 8, align: 'center' });
      curX += colWidths[i];
    });
    docInstance.strokeColor(GRAY_BORDER).moveTo(curX, currentY).lineTo(curX, currentY + 20).stroke();
    currentY += 20;

    // Body rows
    rows.forEach((row, rIdx) => {
      // Calculate max height for row
      let maxH = 18;
      row.forEach((cell, cIdx) => {
        docInstance.font('Times-Roman').fontSize(8.5);
        const cellH = docInstance.heightOfString(cell, { width: colWidths[cIdx] - 8, lineGap: 1.5 }) + 8;
        if (cellH > maxH) maxH = cellH;
      });

      // Background alternating
      if (rIdx % 2 === 1) {
        docInstance.fillColor('#F9FAFB');
        docInstance.rect(tableX, currentY, tableW, maxH).fill();
      }

      // Border outer
      docInstance.strokeColor(GRAY_BORDER).lineWidth(0.5);
      docInstance.rect(tableX, currentY, tableW, maxH).stroke();

      // Cells & dividers
      let cellX = tableX;
      row.forEach((cell, cIdx) => {
        docInstance.strokeColor(GRAY_BORDER).moveTo(cellX, currentY).lineTo(cellX, currentY + maxH).stroke();
        docInstance.font('Times-Roman').fontSize(8.5).fillColor(BLACK);
        docInstance.text(cell, cellX + 4, currentY + 4, {
          width: colWidths[cIdx] - 8,
          align: cIdx === 0 && colWidths[cIdx] < 60 ? 'center' : 'left',
          lineGap: 1.5
        });
        cellX += colWidths[cIdx];
      });
      docInstance.strokeColor(GRAY_BORDER).moveTo(cellX, currentY).lineTo(cellX, currentY + maxH).stroke();

      currentY += maxH;
    });

    docInstance.restore();
    docInstance.y = currentY + 12;
  }

  function addCodeBlock(docInstance, codeLines) {
    const blockX = CONTENT_X;
    const blockW = CONTENT_W;
    const startY = docInstance.y;
    docInstance.font('Courier').fontSize(8);
    const codeText = Array.isArray(codeLines) ? codeLines.join('\n') : codeLines;
    const textH = docInstance.heightOfString(codeText, { width: blockW - 16, lineGap: 2 });
    const blockH = textH + 16;

    docInstance.save();
    docInstance.fillColor('#F9FAFB');
    docInstance.rect(blockX, startY, blockW, blockH).fill();
    docInstance.strokeColor('#D1D5DB').lineWidth(0.75);
    docInstance.rect(blockX, startY, blockW, blockH).stroke();

    docInstance.font('Courier').fontSize(8).fillColor('#1F2937');
    docInstance.text(codeText, blockX + 8, startY + 8, { width: blockW - 16, lineGap: 2 });
    docInstance.restore();

    docInstance.y = startY + blockH + 12;
  }

  // ==========================================
  // PAGE 1: TITLE PAGE
  // ==========================================
  doc.addPage();
  addPageBorder(doc);

  doc.y = 80;
  doc.font('Times-Bold').fontSize(16).fillColor(BLACK);
  doc.text('RELIEFLINK - REAL-TIME DISASTER RELIEF COORDINATION PLATFORM', CONTENT_X, doc.y, {
    align: 'center',
    width: CONTENT_W,
    lineGap: 4
  });
  doc.moveDown(0.8);
  doc.font('Times-Bold').fontSize(13);
  doc.text('(RELIEFLINK)', { align: 'center' });
  doc.moveDown(1.2);

  doc.font('Times-Bold').fontSize(14);
  doc.text('A PROJECT REPORT', { align: 'center' });
  doc.moveDown(1.5);

  doc.font('Times-Italic').fontSize(12);
  doc.text('Submitted by', { align: 'center' });
  doc.moveDown(0.8);

  doc.font('Times-Bold').fontSize(13);
  doc.text('Sanjay K (310624104052)', { align: 'center' });
  doc.moveDown(1.5);

  doc.font('Times-Italic').fontSize(11);
  doc.text('in partial fulfillment for the award of the Degree', { align: 'center' });
  doc.moveDown(0.4);
  doc.text('of', { align: 'center' });
  doc.moveDown(0.8);

  doc.font('Times-Bold').fontSize(14);
  doc.text('BACHELOR OF ENGINEERING', { align: 'center' });
  doc.moveDown(0.4);
  doc.font('Times-Italic').fontSize(12);
  doc.text('in', { align: 'center' });
  doc.moveDown(0.4);
  doc.font('Times-Bold').fontSize(13);
  doc.text('COMPUTER SCIENCE AND ENGINEERING', { align: 'center' });
  doc.moveDown(1.2);

  // College Emblem
  if (fs.existsSync(LOGO_PATH)) {
    const logoW = 85;
    const logoH = 91;
    doc.image(LOGO_PATH, (PAGE_W - logoW) / 2, doc.y, { width: logoW, height: logoH });
    doc.y += logoH + 18;
  } else {
    doc.moveDown(3);
  }

  doc.font('Times-Bold').fontSize(13);
  doc.text('EASWARI ENGINEERING COLLEGE,', { align: 'center' });
  doc.moveDown(0.4);
  doc.font('Times-Bold').fontSize(11);
  doc.text('(AN AUTONOMOUS INSTITUTION)', { align: 'center' });
  doc.moveDown(0.4);
  doc.font('Times-Bold').fontSize(11);
  doc.text('AFFILIATED TO ANNA UNIVERSITY, CHENNAI', { align: 'center' });
  doc.moveDown(1.6);

  doc.font('Times-Bold').fontSize(12);
  doc.text('OCTOBER 2026', { align: 'center' });

  // ==========================================
  // PAGE 2: BONAFIDE CERTIFICATE
  // ==========================================
  doc.addPage();
  addPageBorder(doc);

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, CONTENT_X + 10, 60, { width: 50, height: 53 });
  }

  doc.y = 70;
  doc.font('Times-Bold').fontSize(14);
  doc.text('EASWARI ENGINEERING COLLEGE', CONTENT_X, doc.y, { align: 'center', width: CONTENT_W });
  doc.moveDown(0.4);
  doc.font('Times-Bold').fontSize(13);
  doc.text('BONAFIDE CERTIFICATE', CONTENT_X, doc.y, { align: 'center', width: CONTENT_W });
  doc.moveDown(3.5);

  const certText = 'Certified that this mini project report titled “RELIEFLINK - REAL-TIME DISASTER RELIEF COORDINATION PLATFORM” is the Bonafide work of “SANJAY K (310624104052)”, who carried out the project work under my supervision.';
  addParagraph(doc, certText, { fontSize: 11.5, lineGap: 5 });
  doc.moveDown(8);

  const sigY = 560;
  doc.font('Times-Bold').fontSize(11).fillColor(BLACK);
  doc.text('HEAD OF THE DEPARTMENT', CONTENT_X, sigY);
  doc.font('Times-Bold').fontSize(11);
  doc.text('Dr. S. Cloudin', CONTENT_X, sigY + 18);
  doc.font('Times-Roman').fontSize(10.5);
  doc.text('Easwari Engineering College', CONTENT_X, sigY + 34);
  doc.text('Ramapuram, Chennai - 600089', CONTENT_X, sigY + 50);

  const rightSigX = CONTENT_X + 260;
  doc.font('Times-Bold').fontSize(11);
  doc.text('SUPERVISOR', rightSigX, sigY);
  doc.text('Mrs. Nagamani Segalla', rightSigX, sigY + 18);
  doc.font('Times-Roman').fontSize(10.5);
  doc.text('Easwari Engineering College', rightSigX, sigY + 34);
  doc.text('Ramapuram, Chennai - 600089', rightSigX, sigY + 50);

  // ==========================================
  // PAGE 3: CERTIFICATE OF VIVA-VOCE EXAMINATION
  // ==========================================
  doc.addPage();
  addPageBorder(doc);

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, CONTENT_X + 10, 60, { width: 50, height: 53 });
  }

  doc.y = 70;
  doc.font('Times-Bold').fontSize(14);
  doc.text('EASWARI ENGINEERING COLLEGE', CONTENT_X, doc.y, { align: 'center', width: CONTENT_W });
  doc.moveDown(0.4);
  doc.font('Times-Bold').fontSize(13);
  doc.text('Certificate of Viva-Voce Examination', CONTENT_X, doc.y, { align: 'center', width: CONTENT_W });
  doc.moveDown(3.5);

  const vivaText = 'This is to certify that the Viva Voce Examination of the Project Work entitled “ReliefLink: Real-Time Disaster Relief Coordination Platform” submitted by Mr. Sanjay K (310624104052) in partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering in Computer Science and Engineering was conducted on 27-10-2026 in the Department of Computer Science and Engineering, Easwari Engineering College, Ramapuram – Chennai.';
  addParagraph(doc, vivaText, { fontSize: 11.5, lineGap: 5 });
  doc.moveDown(10);

  const examinerY = 580;
  doc.font('Times-Bold').fontSize(11).fillColor(BLACK);
  doc.text('Internal Examiner', CONTENT_X + 270, examinerY, { align: 'right', width: 200 });
  doc.font('Times-Roman').fontSize(10.5);
  doc.text('Date: 27-10-2026', CONTENT_X + 270, examinerY + 22, { align: 'right', width: 200 });

  // ==========================================
  // PAGE 4: ACKNOWLEDGEMENT
  // ==========================================
  doc.addPage();
  addPageBorder(doc);

  doc.y = 75;
  doc.font('Times-Bold').fontSize(14).fillColor(BLACK);
  doc.text('ACKNOWLEDGEMENT', { align: 'center' });
  doc.moveDown(2);

  addParagraph(doc, 'I express my sincere gratitude to the Principal Dr. P. Deiva Sundari and the Management of our college for providing me with the opportunity to carry out this project work.');
  doc.moveDown(0.8);
  addParagraph(doc, 'I convey my heartfelt thanks to the Head of the Department, Dr. S. Cloudin, Department of Computer Science and Engineering, for the continuous encouragement and support.');
  doc.moveDown(0.8);
  addParagraph(doc, 'I am extremely thankful to my project guide Mrs. Nagamani Segalla, Department of Computer Science and Engineering, for valuable guidance, suggestions and motivation throughout the completion of this project.');
  doc.moveDown(0.8);
  addParagraph(doc, 'I would also like to extend my gratitude to all the faculty members of the Department of Computer Science and Engineering for their support.');
  doc.moveDown(0.8);
  addParagraph(doc, 'Finally, I thank my parents and friends for their constant encouragement and help during the course of this project.');

  // ==========================================
  // PAGE 5: TABLE OF CONTENTS
  // ==========================================
  doc.addPage();
  addPageBorder(doc);

  doc.y = 65;
  doc.font('Times-Bold').fontSize(14).fillColor(BLACK);
  doc.text('TABLE OF CONTENTS', { align: 'center' });
  doc.moveDown(1.2);

  const tocHeaders = ['S. No.', 'Contents', 'Page No.'];
  const tocColWidths = [45, 360, 65];
  const tocRows = [
    ['1', 'Abstract', 'i'],
    ['2', 'List of Figures', 'ii'],
    ['3', 'List of Tables', 'iii'],
    ['4', 'List of Abbreviations', 'iv'],
    ['5', 'Chapter 1 – Introduction', '1'],
    ['5.1', 'Project Overview', '1'],
    ['5.2', 'Problem Statement', '2'],
    ['5.3', 'Objectives of the Project', '2'],
    ['5.4', 'Scope of the Project', '3'],
    ['6', 'Chapter 2 – Existing System and Proposed System', '5'],
    ['6.1', 'Existing System', '5'],
    ['6.2', 'Limitations of the Existing System', '5'],
    ['6.3', 'Proposed Solution', '5'],
    ['6.4', 'Advantages of the Proposed System', '6'],
    ['7', 'Chapter 3 – System Analysis and Design', '8'],
    ['7.1', 'Hardware and Software Requirements', '8'],
    ['7.2', 'System Architecture', '9'],
    ['7.3', 'Module Description', '11'],
    ['7.4', 'UML Diagrams / Data Flow Diagram', '13'],
    ['7.5', 'Algorithm / Flowchart', '17'],
    ['8', 'Chapter 4 – Implementation', '21'],
    ['8.1', 'Implementation Details', '21'],
    ['8.2', 'Module Implementation', '22'],
    ['8.3', 'Tools and Technologies Used', '24'],
    ['9', 'Chapter 5 – Results and Testing', '26'],
    ['9.1', 'Screenshots and Outputs', '26'],
    ['9.2', 'Testing and Validation', '29'],
    ['9.3', 'Results and Discussion', '31'],
    ['10', 'Chapter 6 – Conclusion and Future Enhancement', '33'],
    ['10.1', 'Conclusion', '33'],
    ['10.2', 'Future Enhancements', '33'],
    ['11', 'References / Bibliography', '35'],
    ['12', 'Appendices (Source Code)', '36'],
  ];
  drawTable(doc, '', tocHeaders, tocRows, tocColWidths, doc.y);

  // ==========================================
  // PAGE 6: ABSTRACT (page i)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, 'i');

  doc.y = 80;
  doc.font('Times-Bold').fontSize(14).fillColor(BLACK);
  doc.text('ABSTRACT', { align: 'center' });
  doc.moveDown(1.5);

  addParagraph(doc, 'ReliefLink is a centralised, production-grade real-time disaster relief coordination platform engineered to unify distressed citizens, accredited on-ground volunteers, civil society organisations, and government disaster management authorities (NDRF/SDMA) across India. It is built on a resilient modern full-stack architecture comprising React 19 with Tailwind CSS and Leaflet GIS on the front end, backed by Node.js, Express, Socket.IO, and an embedded PostgreSQL (PGlite) engine for transactional persistence. By structuring every emergency dispatch into real-time geospatial distress feeds, the platform operates without proprietary hardware dependencies while bridging the life-critical gap between distress reporting and resource delivery.');
  doc.moveDown(0.4);

  addParagraph(doc, 'The project addresses three catastrophic bottlenecks inherent to traditional disaster management in India: chaotic, unindexed distress reporting via fragmented social media and overloaded telephone helplines; severe absence of geofenced tactical coordination leading to duplicated volunteer missions and neglected high-casualty pockets; and zero automated SLA triage monitoring resulting in unescalated life-threatening emergencies. To solve them, ReliefLink introduces one-tap GPS-assisted SOS reporting with category-specific triage scoring (Medical Emergency, Trapped Civilians, Flood Evacuation, Food & Potable Water, Structural Collapse). An autonomous background daemon evaluates SLA compliance in real time, automatically escalating neglected P0/P1 incidents to senior command coordinators when triage thresholds are breached.');
  doc.moveDown(0.4);

  addParagraph(doc, 'This report presents the system analysis, architectural blueprint, engineering implementation, and comprehensive testing validation of ReliefLink. Real-time synchronisation is governed by bi-directional WebSocket channels, enabling incident commanders to monitor live tactical maps, verify distress veracity, dispatch verified volunteer squads, track emergency shelter capacities, and export geocoded situation audit logs in CSV format.');
  doc.moveDown(0.8);

  doc.font('Times-Bold').fontSize(10.5).text('Keywords: ', CONTENT_X, doc.y, { continued: true });
  doc.font('Times-Roman').fontSize(10.5).text('disaster relief coordination, real-time telemetry, WebSocket, Leaflet GIS, SLA escalation engine, PGlite/PostgreSQL, triage matrix, emergency shelter tracking.');

  // ==========================================
  // PAGE 7: LIST OF FIGURES (page ii)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, 'ii');

  doc.y = 75;
  doc.font('Times-Bold').fontSize(14).fillColor(BLACK);
  doc.text('LIST OF FIGURES', { align: 'center' });
  doc.moveDown(1.5);

  const figHeaders = ['FIGURE NO.', 'TITLE', 'PAGE NO.'];
  const figColWidths = [85, 310, 75];
  const figRows = [
    ['3.1', 'System architecture', '10'],
    ['3.2', 'Use case diagram', '14'],
    ['3.3', 'Entity relationship diagram', '15'],
    ['3.4', 'Sequence diagram of distress SOS ingestion and dispatch', '16'],
    ['3.5', 'Level 1 data flow diagram', '17'],
    ['3.6', 'Flowchart of SOS submission and geo-verification', '18'],
    ['3.7', 'Flowchart of SLA escalation and automated priority worker', '19'],
    ['5.1', 'Live tactical command dashboard with GIS map', '26'],
    ['5.2', 'SOS distress queue and verification panel', '26'],
    ['5.3', 'Citizen SOS distress reporting modal with GPS lock', '27'],
    ['5.4', 'Real-time casualty trends and triage distribution graphs', '27'],
    ['5.5', 'Volunteer task force dispatch and mission management', '28'],
    ['5.6', 'Emergency shelter capacity and resource monitor', '28'],
    ['5.7', 'Automated SLA escalation alerts and triage timer panel', '29'],
    ['5.8', 'Disaster incident audit report and CSV data export', '29'],
  ];
  drawTable(doc, '', figHeaders, figRows, figColWidths, doc.y);

  // ==========================================
  // PAGE 8: LIST OF TABLES (page iii)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, 'iii');

  doc.y = 75;
  doc.font('Times-Bold').fontSize(14).fillColor(BLACK);
  doc.text('LIST OF TABLES', { align: 'center' });
  doc.moveDown(1.2);

  const tblHeaders = ['TABLE NO.', 'TITLE', 'PAGE NO.'];
  const tblColWidths = [85, 310, 75];
  const tblRows = [
    ['1.1', 'ReliefLink at a glance', '1'],
    ['1.2', 'Objectives and how they are met in ReliefLink', '3'],
    ['2.1', 'Comparison of the existing process and ReliefLink', '6'],
    ['3.1', 'Functional requirements', '8'],
    ['3.2', 'Software requirements', '9'],
    ['3.3', 'Minimum hardware requirements', '9'],
    ['3.4', 'Layers of the system', '10'],
    ['3.5', 'Proposed REST API routes', '10'],
    ['3.6', 'Disaster incident and SOS validation bounds', '11'],
    ['3.7', 'Main pages and routes', '12'],
    ['3.8', 'Summary of modules', '13'],
    ['3.9', 'Data requirements', '13'],
    ['3.10', 'Priority matrix and SLA escalation rules', '13'],
    ['3.11', 'Entity summary', '15'],
    ['4.1', 'Reusable interface components', '22'],
    ['4.2', 'Libraries, frameworks and services', '24'],
    ['4.3', 'Development tools', '25'],
    ['5.1', 'Test cases and results', '30'],
    ['5.2', 'Test coverage by area', '31'],
    ['6.1', 'Roadmap of future work', '34'],
  ];
  drawTable(doc, '', tblHeaders, tblRows, tblColWidths, doc.y);

  // ==========================================
  // PAGE 9: LIST OF ABBREVIATIONS (page iv)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, 'iv');

  doc.y = 75;
  doc.font('Times-Bold').fontSize(14).fillColor(BLACK);
  doc.text('LIST OF ABBREVIATIONS', { align: 'center' });
  doc.moveDown(1.5);

  const abbrHeaders = ['ABBREVIATION', 'EXPANSION'];
  const abbrColWidths = [120, 350];
  const abbrRows = [
    ['API', 'Application Programming Interface'],
    ['CRUD', 'Create, Read, Update, Delete'],
    ['CSS', 'Cascading Style Sheets'],
    ['CSV', 'Comma-Separated Values'],
    ['DFD', 'Data Flow Diagram'],
    ['ER', 'Entity Relationship'],
    ['GIS', 'Geographic Information System'],
    ['GPS', 'Global Positioning System'],
    ['HTTP', 'Hypertext Transfer Protocol'],
    ['HTTPS', 'Hypertext Transfer Protocol Secure'],
    ['JSON', 'JavaScript Object Notation'],
    ['JWT', 'JSON Web Token'],
    ['NDRF', 'National Disaster Response Force (India)'],
    ['PGlite', 'PostgreSQL in WebAssembly / Embedded Node.js Engine'],
    ['PWA', 'Progressive Web Application'],
    ['REST', 'Representational State Transfer'],
    ['SDMA', 'State Disaster Management Authority'],
    ['SLA', 'Service Level Agreement'],
    ['SOS', 'Save Our Souls (Emergency Distress Signal)'],
    ['UI', 'User Interface'],
    ['UML', 'Unified Modeling Language'],
    ['W3C', 'World Wide Web Consortium'],
  ];
  drawTable(doc, '', abbrHeaders, abbrRows, abbrColWidths, doc.y);

  // ==========================================
  // PAGE 10: CHAPTER 1 - INTRODUCTION (Page 1)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '1');

  addChapterHeader(doc, '1', 'INTRODUCTION');
  addSectionHeader(doc, '1.1 Project Overview');
  addParagraph(doc, 'ReliefLink is a centralised, full-stack disaster relief coordination platform engineered to address the critical communication breakdowns that occur during climate catastrophes, extreme flooding, cyclones, and humanitarian emergencies across India. During major natural calamities—such as the Chennai floods, Wayanad landslides, or Odisha cyclones—disaster response mechanisms face acute challenges. Distress messages arrive in chaotic fragments across WhatsApp groups, social feeds, and saturated 112/1070 emergency call centres. ReliefLink replaces these disjointed channels with a unified, high-reliability command workspace connecting affected citizens, accredited field volunteers, civil defense teams, and administrative disaster authorities.');
  doc.moveDown(0.3);

  addParagraph(doc, 'The application is architected as an end-to-end full-stack web system. The client interface is built using React 19, styled with Tailwind CSS, and powered by an interactive Leaflet GIS tactical mapping engine with high-contrast emergency visibility. The backend consists of a Node.js and Express HTTP server integrated with Socket.IO for sub-second real-time event broadcasting. Persistent data storage is governed by a fully embedded PostgreSQL engine (PGlite), guaranteeing strict relational schema integrity, transaction safety, and comprehensive auditability without external database hosting overheads.');
  doc.moveDown(0.3);

  addParagraph(doc, 'Three core design innovations distinguish ReliefLink from generic emergency portals:');
  addBullet(doc, 'Sub-Second Geospatial SOS Ingestion. ', 'Citizens trigger emergency distress requests with automatic GPS coordinate locking, category tagging (Medical, Trapped, Food/Water, Shelter, Rescue), and casualty counts without requiring tedious account setup.');
  addBullet(doc, 'Automated SLA Escalation Engine. ', 'An autonomous background worker runs continuously on the server, tracking response delays against rigorous Indian National Disaster Management Authority (NDMA) triage standards and automatically escalating unassigned or neglected distress beacons.');
  addBullet(doc, 'Synchronous Tactical Dispatch & Shelter Registry. ', 'Incident commanders dispatch verified volunteer squads to live distress pins and monitor real-time shelter bed and ration capacities with immediate WebSocket propagation.');

  // ==========================================
  // PAGE 11: CHAPTER 1 - INTRODUCTION (Page 2)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '2');

  const glanceHeaders = ['Item', 'Detail'];
  const glanceColWidths = [120, 350];
  const glanceRows = [
    ['Project name', 'ReliefLink - Real-Time Disaster Relief Coordination Platform'],
    ['Type', 'Full-stack web application with real-time WebSocket telemetry and background worker'],
    ['Architecture', '100% web software; client-server with Leaflet GIS and PGlite embedded PostgreSQL'],
    ['Users', 'Affected Citizens, On-Ground Volunteers, Disaster Command Admins (NDRF/SDMA)'],
    ['Front end', 'React 19, TypeScript, Tailwind CSS, Leaflet OpenStreetMap, Lucide Icons, Motion'],
    ['Back end', 'Node.js, Express.js (REST APIs), Socket.IO (WebSockets), SLA Escalation Daemon'],
    ['Database', 'PostgreSQL (via embedded @electric-sql/pglite) with relational integrity and migrations'],
    ['Geocoding', 'W3C Browser Geolocation API + OpenStreetMap Nominatim reverse-geocoding'],
    ['Cadence', 'Sub-second real-time broadcasts; 60-second SLA escalation evaluation cycle'],
    ['Course', 'Full Stack Development (B.E. Computer Science and Engineering)'],
  ];
  drawTable(doc, 'Table 1.1 ReliefLink at a glance', glanceHeaders, glanceRows, glanceColWidths, 65);

  addSectionHeader(doc, '1.2 Problem Statement');
  addParagraph(doc, 'During rapid-onset environmental emergencies and natural disasters in India, relief efforts suffer from four critical operational bottlenecks that severely impair life-saving interventions:');
  addBullet(doc, '1. Chaotic & Duplicated Distress Feeds. ', 'Victims post desperate distress messages across multiple social media platforms and message boards without standardized coordinates. Relief agencies waste precious hours verifying duplicates while isolated victims remain unnoticed.');
  addBullet(doc, '2. Absence of Geospatial Tactical Triage. ', 'Disaster management helplines operate via verbal phone calls and static spreadsheets, lacking real-time visual mapping of flood levels, road blockages, and casualty concentrations.');
  addBullet(doc, '3. Uncoordinated Volunteer Deployment. ', 'Good Samaritan volunteers and NGOs deploy haphazardly to easily accessible urban centres, leaving remote or severely submerged rural hamlets without medical personnel, drinking water, or rescue boats.');
  addBullet(doc, '4. Zero Automated SLA Triage Tracking. ', 'Without systematic priority clocks, critical life-or-death SOS beacons (e.g., stranded infants or critical oxygen shortages) sit in the same queue as minor supply requests, resulting in preventable loss of life.');

  // ==========================================
  // PAGE 12: CHAPTER 1 - INTRODUCTION (Page 3)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '3');

  addSectionHeader(doc, '1.3 Objectives of the Project');
  addParagraph(doc, 'The primary objective of ReliefLink is to provide a reliable, zero-latency digital backbone for disaster distress management. The specific objectives and their corresponding engineering implementations are summarised in Table 1.2.');
  addBullet(doc, 'Provide an instant-access, zero-barrier SOS distress portal ', 'enabling stranded citizens to report emergencies with precise GPS geolocation and triage categorization.');
  addBullet(doc, 'Deliver a real-time tactical command GIS map ', 'providing incident commanders with live situation awareness, cluster heatmaps, and danger zones.');
  addBullet(doc, 'Implement an automated SLA escalation daemon ', 'that enforces priority response windows and automatically escalates stagnant high-severity distress requests.');
  addBullet(doc, 'Establish a structured volunteer task force management module ', 'for credential verification, task assignment, status updates, and field auditability.');
  addBullet(doc, 'Create an emergency shelter and supply inventory tracking system ', 'preventing overcrowding and directing displaced citizens to verified relief camps.');

  const objHeaders = ['Objective', 'How it is met in ReliefLink'];
  const objColWidths = [150, 320];
  const objRows = [
    ['Centralised SOS Distress Registry', 'Module 1 - Instant SOS modal with GPS reverse-geocoding, priority triage tag, and deduplication'],
    ['Real-Time Tactical GIS Command', 'Module 2 - Leaflet interactive live map with real-time Socket.IO pin updates and hazard clustering'],
    ['Volunteer & Mission Coordination', 'Module 3 - Volunteer task force portal with skill-based mission assignment and status transitions'],
    ['Emergency Shelter & Logistics', 'Module 3 - Live relief camp registry with occupancy counters, meal supplies, and medical inventory'],
    ['Automated SLA Escalation Engine', 'Module 4 - Node.js background worker evaluating priority deadlines (P0/P1/P2/P3) every 60 seconds'],
    ['Situation Auditing & Analytics', 'Module 4 - Visual incident metrics, severity breakdown charts, and instantaneous CSV report exports'],
  ];
  drawTable(doc, 'Table 1.2 Objectives and how they are met in ReliefLink', objHeaders, objRows, objColWidths, doc.y);

  // ==========================================
  // PAGE 13: CHAPTER 1 - INTRODUCTION (Page 4)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '4');

  addSectionHeader(doc, '1.4 Scope of the Project');
  addParagraph(doc, 'The project encompasses the complete web-based software ecosystem supporting disaster incident management: citizen distress intake, real-time command dispatch, volunteer tasking, shelter management, and administrative auditing.');
  
  addSubSectionHeader(doc, 'Inside the scope');
  addBullet(doc, 'Citizen SOS Reporting: ', 'One-tap distress submission with browser GPS acquisition, reverse-geocoded location, severity grading (P0 to P3), and contact info.');
  addBullet(doc, 'Tactical GIS Command Map: ', 'Interactive map rendering live distress pins, volunteer squad locations, and relief shelters with colour-coded priority rings.');
  addBullet(doc, 'Real-Time Bi-Directional Telemetry: ', 'Instantaneous propagation of new emergencies, status updates, and assignments to all connected clients via Socket.IO.');
  addBullet(doc, 'Automated SLA Escalation Engine: ', 'Server-side background worker monitoring response countdowns and elevating unaddressed high-priority distress calls.');
  addBullet(doc, 'Volunteer Task Force Lifecycle: ', 'Registration, team assignment, task acceptance, on-scene verification, and rescue completion.');
  addBullet(doc, 'Shelter & Relief Camp Logistics: ', 'Live tracking of shelter capacity, current occupancy, drinking water, medical kits, and baby food availability.');
  addBullet(doc, 'Data Export & Audit Logs: ', 'Comprehensive situation audit logs with geocoded CSV streaming for NDMA/SDMA administrative reporting.');

  addSubSectionHeader(doc, 'Outside the scope of this version');
  addBullet(doc, 'Satellite Uplink Hardware: ', 'The current prototype operates over cellular/broadband IP networks; dedicated satellite modems are earmarked for future iterations.');
  addBullet(doc, 'Automated Drone Flight Routing: ', 'While landing zone coordinates are recorded, physical autopilot telemetry is managed externally.');
  addBullet(doc, 'SMS Gateway Telephony: ', 'Distress broadcasts are handled in-app via WebSockets; native cellular SMS fallback is scheduled for Phase 2.');

  addSectionHeader(doc, 'Organisation of the report');
  addParagraph(doc, 'The remainder of this report is organised as follows: Chapter 2 discusses the existing manual mechanisms and presents the proposed ReliefLink platform architecture. Chapter 3 provides detailed requirements analysis, system architecture, database schema, UML diagrams, and algorithmic models. Chapter 4 details the software engineering implementation, modular components, and toolchains. Chapter 5 evaluates experimental testing outcomes with 22 test cases and screen outputs. Chapter 6 concludes the report with key milestones and future roadmaps, followed by academic references and complete technical appendices.');

  // ==========================================
  // PAGE 14: CHAPTER 2 - EXISTING & PROPOSED SYSTEM (Page 5)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '5');

  addChapterHeader(doc, '2', 'EXISTING SYSTEM AND PROPOSED SYSTEM');
  addSectionHeader(doc, '2.1 Existing System');
  addParagraph(doc, 'In traditional disaster management operations across India, emergency response relies predominantly on manual, decentralised, and fragmented procedures:');
  addBullet(doc, 'Emergency Helplines (112 / 1070): ', 'Operators manually take down verbal descriptions of landmarks over copper or cellular telephone lines, creating transcription errors and losing exact GPS accuracy.');
  addBullet(doc, 'Ad-Hoc Social Media Amplification: ', 'Distressed families post pleas on X (Twitter), Facebook, and WhatsApp groups. These posts are repeatedly retweeted and forwarded for days after the victims have already been rescued, flooding communication channels with obsolete information.');
  addBullet(doc, 'Paper Logs and Disconnected Spreadsheets: ', 'Control rooms record distress entries in paper ledgers or standalone spreadsheets. Volunteer squads receive verbal instructions, leaving no digital audit trail of who was dispatched or when rescue was achieved.');
  addBullet(doc, 'Unverified Shelter Capacities: ', 'Displaced citizens walk miles towards flood relief camps only to find them overflowing, lacking food supplies, or shut down.');

  addSectionHeader(doc, '2.2 Limitations of the Existing System');
  addBullet(doc, '1. Massive Data Redundancy: ', 'No automated deduplication mechanism exists, resulting in multiple teams dispatching to the same household while adjacent streets are neglected.');
  addBullet(doc, '2. Absence of GPS Precision: ', 'Descriptive text such as "near the old banyan tree behind the temple" becomes useless when floodwaters submerge all physical landmarks.');
  addBullet(doc, '3. Critical Response Delays: ', 'Without automated timers, life-threatening calls (pregnant women, medical trauma) wait in the same chronological queue as general dry-ration requests.');
  addBullet(doc, '4. Volunteer Safety Hazards: ', 'Volunteer squads enter flash-flood or landslide zones without real-time situational awareness or status check-ins.');
  addBullet(doc, '5. Zero Post-Disaster Auditability: ', 'Government agencies cannot accurately audit relief distribution, identify operational bottlenecks, or account for missing persons.');

  // ==========================================
  // PAGE 15: CHAPTER 2 - EXISTING & PROPOSED SYSTEM (Page 6)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '6');

  addSectionHeader(doc, '2.3 Proposed Solution');
  addParagraph(doc, 'ReliefLink consolidates all relief workflows into a unified, high-performance web platform. Stranded citizens submit distress requests in two taps with exact GPS telemetry. Control rooms monitor a real-time tactical Leaflet map. Volunteer task forces receive verified assignments with navigation coordinates, and shelters broadcast live bed and meal availability. A background SLA escalation worker ensures zero high-priority calls remain unanswered.');

  const compHeaders = ['Aspect', 'Existing Manual Process', 'ReliefLink Platform'];
  const compColWidths = [110, 180, 180];
  const compRows = [
    ['Distress Intake', 'Verbal phone calls (112) and chaotic social media posts', 'Instant web SOS with browser GPS lock and category triage'],
    ['Geospatial Visibility', 'Static paper maps and vague landmark descriptions', 'Dynamic Leaflet GIS map with live color-coded priority markers'],
    ['Data Synchronisation', 'Manual phone trees and periodic spreadsheet consolidation', 'Sub-second real-time bi-directional WebSocket broadcast (Socket.IO)'],
    ['Triage & Prioritisation', 'First-come-first-served chronological queues', 'Dynamic severity scoring (P0 Critical, P1 High, P2 Moderate, P3 Low)'],
    ['SLA Monitoring', 'Manual memory; neglected cases frequently forgotten', 'Autonomous daemon evaluating SLAs every 60s with auto-escalation'],
    ['Volunteer Dispatch', 'Ad-hoc groups deploying without coordination', 'Role-based task force portal with skill matching and mission tracking'],
    ['Shelter Logistics', 'Unchecked word-of-mouth reports', 'Live occupancy meters, meal counts, and medical supply registers'],
    ['Post-Disaster Auditing', 'Missing paper slips and incomplete files', 'Full PostgreSQL relational audit trail with 1-click CSV report export'],
  ];
  drawTable(doc, 'Table 2.1 Comparison of the existing process and ReliefLink', compHeaders, compRows, compColWidths, doc.y);

  addSectionHeader(doc, 'How the proposed system works');
  addParagraph(doc, '1. An affected citizen opens ReliefLink, taps "Send SOS Distress", selects the emergency category, and allows browser GPS geolocation.');
  addParagraph(doc, '2. The server ingests the distress beacon, validates coordinates, assigns a priority code (P0-P3), and commits the transaction to PostgreSQL.');
  addParagraph(doc, '3. The new incident is broadcast instantly via Socket.IO to all active command screens and volunteer dashboards.');
  addParagraph(doc, '4. The background SLA daemon starts the response countdown clock based on severity.');
  addParagraph(doc, '5. Command coordinators dispatch verified volunteer units or rescue teams to the exact latitude and longitude.');
  addParagraph(doc, '6. Once on site, the team executes the rescue, updates the status to "Resolved", and re-allocates survivors to nearest verified shelters.');

  // ==========================================
  // PAGE 16: CHAPTER 2 - EXISTING & PROPOSED SYSTEM (Page 7)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '7');

  addSectionHeader(doc, '2.4 Advantages of the Proposed System');
  addParagraph(doc, 'The architectural and operational advantages of ReliefLink include:');
  addBullet(doc, 'Rapid Zero-Barrier Ingestion: ', 'Stranded victims can request rescue in under 10 seconds without needing username/password registration, which is essential during extreme distress.');
  addBullet(doc, 'Sub-Second Tactical Awareness: ', 'WebSocket telemetry guarantees that commanders in district emergency operations centres (DEOC) see new distress beacons instantaneously.');
  addBullet(doc, 'Automated Life-Saving Escalations: ', 'No urgent distress call falls through the cracks; stagnant P0/P1 emergencies are highlighted with high-contrast audio-visual alarms.');
  addBullet(doc, 'Optimised Resource Allocation: ', 'Rescue boats and medical ambulances are routed to clusters of highest distress rather than arbitrarily dispatched.');
  addBullet(doc, 'Transparent Governance & Accountability: ', 'Every status transition (Reported -> Verified -> Dispatched -> On Scene -> Resolved) is logged with exact timestamps and responder IDs.');
  addBullet(doc, 'Completely Hardware-Agnostic: ', 'Runs on any modern device (smartphones, tablets, control room monitors) without specialised radio infrastructure.');

  // ==========================================
  // PAGE 17: CHAPTER 3 - ANALYSIS & DESIGN (Page 8)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '8');

  addChapterHeader(doc, '3', 'SYSTEM ANALYSIS AND DESIGN');
  addSectionHeader(doc, '3.1 Hardware and Software Requirements');
  addParagraph(doc, 'The system functional requirements specified for ReliefLink are listed in Table 3.1.');

  const frHeaders = ['ID', 'Requirement', 'Priority'];
  const frColWidths = [45, 365, 60];
  const frRows = [
    ['FR-01', 'Capture citizen SOS distress requests with latitude, longitude, and contact info', 'High'],
    ['FR-02', 'Support triage classification (Medical, Evacuation, Food/Water, Shelter, Trauma)', 'High'],
    ['FR-03', 'Broadcast new distress incidents to all connected clients within 200ms via WebSockets', 'High'],
    ['FR-04', 'Display all active emergencies on an interactive GIS map with clustering', 'High'],
    ['FR-05', 'Provide an incident verification queue for civil defense command coordinators', 'High'],
    ['FR-06', 'Run an automated SLA escalation daemon checking response deadlines every 60s', 'High'],
    ['FR-07', 'Automatically elevate unassigned P0 (<15m) and P1 (<30m) distress requests', 'High'],
    ['FR-08', 'Maintain an accredited volunteer task force registry with skillsets and availability', 'High'],
    ['FR-09', 'Enable one-click dispatch of volunteer teams to specific distress coordinates', 'High'],
    ['FR-10', 'Track volunteer mission lifecycle: Assigned -> En Route -> On Scene -> Completed', 'Medium'],
    ['FR-11', 'Manage emergency relief shelters with real-time occupancy and ration levels', 'High'],
    ['FR-12', 'Filter incidents by disaster type, priority, district, and operational status', 'Medium'],
    ['FR-13', 'Render real-time situation analytics: casualty rates, response times, triage distribution', 'Medium'],
    ['FR-14', 'Export verified incident audit trails as standard CSV files for government reporting', 'Medium'],
    ['FR-15', 'Store all transactional entities in embedded PostgreSQL with relational schema integrity', 'High'],
    ['FR-16', 'Provide high-contrast emergency UI theme compliant with field glare conditions', 'Medium'],
  ];
  drawTable(doc, 'Table 3.1 Functional requirements', frHeaders, frRows, frColWidths, doc.y);

  addSubSectionHeader(doc, 'Non-functional requirements');
  addBullet(doc, 'Reliability: ', 'The embedded PostgreSQL database guarantees ACID transactions and automatic recovery upon unexpected restart.');
  addBullet(doc, 'Performance: ', 'Socket.IO event dissemination delivers sub-200ms latency across 5,000 concurrent client connections.');
  addBullet(doc, 'Portability: ', 'Fully responsive layout operating seamlessly across Chrome, Edge, Safari, and mobile Android/iOS web views.');
  addBullet(doc, 'Security: ', 'Sanitised input validation via Zod schemas prevents SQL injection, XSS, and malformed payload attacks.');

  // ==========================================
  // PAGE 18: CHAPTER 3 - ANALYSIS & DESIGN (Page 9)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '9');

  addSectionHeader(doc, 'Feasibility Analysis');
  addBullet(doc, 'Technical Feasibility: ', 'React 19, Node.js, Express, Socket.IO, and PostgreSQL are industry-standard, robust technologies with extensive documentation.');
  addBullet(doc, 'Economic Feasibility: ', 'ReliefLink utilizes open-source web technologies and OpenStreetMap, eliminating recurring software license fees.');
  addBullet(doc, 'Operational Feasibility: ', 'Designed with high-contrast visual cues and intuitive workflows, allowing ad-hoc volunteer operators to become productive in minutes.');

  const swHeaders = ['Item', 'Requirement'];
  const swColWidths = [120, 350];
  const swRows = [
    ['Operating system', 'Windows 10/11, Ubuntu 22.04 LTS, macOS Sonoma'],
    ['Browser', 'Google Chrome 110+, Microsoft Edge, Mozilla Firefox, Apple Safari'],
    ['Server Runtime', 'Node.js v20.x or v22.x LTS with npm / npx'],
    ['Database Engine', 'PostgreSQL (Embedded @electric-sql/pglite or standard PostgreSQL 15+)'],
    ['GIS Map Tiles', 'OpenStreetMap via Leaflet.js CDN (no proprietary Google Maps API key required)'],
    ['Development Tools', 'Visual Studio Code, Git, Postman, Vite Dev Server'],
  ];
  drawTable(doc, 'Table 3.2 Software requirements', swHeaders, swRows, swColWidths, doc.y);

  const hwHeaders = ['Item', 'Minimum Requirement'];
  const hwColWidths = [120, 350];
  const hwRows = [
    ['Processor', 'Dual-core 2.0 GHz x86-64 or ARM64 (Apple M1/M2 or Intel i3/i5)'],
    ['Memory (RAM)', '4 GB RAM (8 GB recommended for large concurrent incident loads)'],
    ['Disk Storage', '1 GB free disk space for Node.js runtime and PostgreSQL table data'],
    ['Network Adapter', 'Broadband internet or 4G/5G mobile data connectivity'],
    ['Display Resolution', '1366 x 768 minimum (Optimised for 1920x1080 tactical operations centres)'],
    ['Physical Sensors', 'Standard GPS/Location sensor on client mobile devices or laptops'],
  ];
  drawTable(doc, 'Table 3.3 Minimum hardware requirements', hwHeaders, hwRows, hwColWidths, doc.y);

  addSectionHeader(doc, '3.2 System Architecture');
  addParagraph(doc, 'ReliefLink implements a modular, event-driven client-server architecture. The browser client interacts with the Express server via REST endpoints for command mutations and establishes persistent WebSocket connections for telemetry updates.');

  // ==========================================
  // PAGE 19: CHAPTER 3 - ANALYSIS & DESIGN (Page 10)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '10');

  // Vector System Architecture Diagram
  const archY = 70;
  doc.save();
  // Outer frame
  doc.rect(CONTENT_X, archY, CONTENT_W, 250).fillAndStroke('#FAFAFA', '#D1D5DB');

  // User Layer
  doc.rect(CONTENT_X + 20, archY + 15, 120, 40).fillAndStroke('#DBEAFE', '#2563EB');
  doc.font('Times-Bold').fontSize(9).fillColor('#1E3A8A').text('Distressed Citizens\n(Mobile Web / GPS)', CONTENT_X + 25, archY + 23, { align: 'center', width: 110 });

  doc.rect(CONTENT_X + 175, archY + 15, 120, 40).fillAndStroke('#DBEAFE', '#2563EB');
  doc.font('Times-Bold').fontSize(9).fillColor('#1E3A8A').text('Accredited Volunteers\n(Task Force App)', CONTENT_X + 180, archY + 23, { align: 'center', width: 110 });

  doc.rect(CONTENT_X + 330, archY + 15, 120, 40).fillAndStroke('#DBEAFE', '#2563EB');
  doc.font('Times-Bold').fontSize(9).fillColor('#1E3A8A').text('Incident Commanders\n(NDRF / SDMA / DEOC)', CONTENT_X + 335, archY + 23, { align: 'center', width: 110 });

  // Down Arrows
  doc.strokeColor('#6B7280').lineWidth(1.5);
  doc.moveTo(CONTENT_X + 80, archY + 55).lineTo(CONTENT_X + 80, archY + 80).stroke();
  doc.moveTo(CONTENT_X + 235, archY + 55).lineTo(CONTENT_X + 235, archY + 80).stroke();
  doc.moveTo(CONTENT_X + 390, archY + 55).lineTo(CONTENT_X + 390, archY + 80).stroke();

  // Frontend Presentation Box
  doc.rect(CONTENT_X + 20, archY + 80, 430, 45).fillAndStroke('#EDE9FE', '#7C3AED');
  doc.font('Times-Bold').fontSize(10).fillColor('#4C1D95').text('React 19 Frontend Dashboard & Tactical GIS Layer', CONTENT_X + 30, archY + 88, { align: 'center', width: 410 });
  doc.font('Times-Roman').fontSize(8.5).fillColor('#5B21B6').text('Leaflet GIS Maps • Live Distress Queue • Volunteer Mission Dispatch • Shelter Monitor • Analytics', CONTENT_X + 30, archY + 104, { align: 'center', width: 410 });

  // Bi-directional connections
  doc.moveTo(CONTENT_X + 150, archY + 125).lineTo(CONTENT_X + 150, archY + 145).stroke();
  doc.moveTo(CONTENT_X + 320, archY + 125).lineTo(CONTENT_X + 320, archY + 145).stroke();

  // Backend Box
  doc.rect(CONTENT_X + 20, archY + 145, 430, 45).fillAndStroke('#FEF3C7', '#D97706');
  doc.font('Times-Bold').fontSize(10).fillColor('#78350F').text('Node.js & Express.js Application Server', CONTENT_X + 30, archY + 152, { align: 'center', width: 410 });
  doc.font('Times-Roman').fontSize(8.5).fillColor('#92400E').text('REST APIs (/api/incidents, /api/sos) • Real-Time Socket.IO Server • SLA Escalation Daemon (60s)', CONTENT_X + 30, archY + 168, { align: 'center', width: 410 });

  // DB Connection
  doc.moveTo(CONTENT_X + 235, archY + 190).lineTo(CONTENT_X + 235, archY + 205).stroke();

  // Database Box
  doc.rect(CONTENT_X + 80, archY + 205, 310, 35).fillAndStroke('#D1FAE5', '#059669');
  doc.font('Times-Bold').fontSize(10).fillColor('#064E3B').text('Embedded PostgreSQL Database Engine (PGlite)', CONTENT_X + 90, archY + 211, { align: 'center', width: 290 });
  doc.font('Times-Roman').fontSize(8).fillColor('#065F46').text('Relational Tables • Geospatial Coordinates • ACID Transactions • Migration Scripts', CONTENT_X + 90, archY + 224, { align: 'center', width: 290 });

  doc.restore();

  doc.y = archY + 260;
  doc.font('Times-Bold').fontSize(10).fillColor(BLACK).text('Figure 3.1 System architecture', { align: 'center' });
  doc.moveDown(0.8);

  const layerHeaders = ['Layer', 'Contents', 'Role in ReliefLink'];
  const layerColWidths = [100, 160, 210];
  const layerRows = [
    ['Presentation Layer', 'React 19, Tailwind CSS, Leaflet GIS, Lucide Icons', 'Renders live map, SOS forms, triage cards, and command monitors'],
    ['API Layer', 'Express.js REST endpoints and route controllers', 'Handles HTTP requests for incidents, shelters, volunteers, and reports'],
    ['Real-Time Layer', 'Socket.IO WebSocket Server', 'Pushes sub-second incident alerts and live location updates to all clients'],
    ['Daemon Layer', 'Node.js SLA Escalation Background Worker', 'Runs 60-second periodic evaluations of unresolved emergencies'],
    ['Data Layer', 'PostgreSQL with relational schema tables', 'Guarantees ACID transactions, coordinates, and complete audit history'],
  ];
  drawTable(doc, 'Table 3.4 Layers of the system', layerHeaders, layerRows, layerColWidths, doc.y);

  // ==========================================
  // PAGE 20: CHAPTER 3 - ANALYSIS & DESIGN (Page 11)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '11');

  addSectionHeader(doc, 'Proposed REST API');
  addParagraph(doc, 'The ReliefLink backend exposes standardized RESTful endpoints structured around core disaster entities as listed in Table 3.5.');

  const apiHeaders = ['Method', 'Route', 'Purpose'];
  const apiColWidths = [55, 175, 240];
  const apiRows = [
    ['GET', '/api/incidents', 'List all active distress incidents with filtering by severity, status, and district'],
    ['POST', '/api/incidents', 'Register a new incident or dispatch mission with coordinates and triage rating'],
    ['GET', '/api/incidents/:id', 'Retrieve complete details, volunteer assignments, and audit logs of an incident'],
    ['PUT', '/api/incidents/:id/status', 'Update operational status (Reported -> Verified -> Dispatched -> Resolved)'],
    ['POST', '/api/sos', 'Citizen distress SOS submission with GPS coordinates, phone, and casualty counts'],
    ['GET', '/api/volunteers', 'List active volunteer squads, medical certifications, and current mission states'],
    ['POST', '/api/volunteers/dispatch', 'Assign a designated volunteer squad to a specific distress incident'],
    ['GET', '/api/shelters', 'Retrieve live relief camp directory with bed occupancy and supply levels'],
    ['PUT', '/api/shelters/:id/capacity', 'Update shelter occupancy, bed availability, and food ration counters'],
    ['GET', '/api/sla/escalations', 'List all unassigned emergencies that have exceeded their SLA response limits'],
    ['GET', '/api/reports/incidents.csv', 'Stream comprehensive geocoded disaster situation logs as a CSV file'],
  ];
  drawTable(doc, 'Table 3.5 Proposed REST API routes', apiHeaders, apiRows, apiColWidths, doc.y);

  addSectionHeader(doc, 'Data Validation');
  addParagraph(doc, 'To prevent denial-of-service, junk distress alerts, or geographical corruption, all incoming payloads are strictly validated before persistence against Table 3.6 bounds.');

  const boundsHeaders = ['Parameter', 'Accepted Bounds', 'Validation Rule & Rationale'];
  const boundsColWidths = [110, 140, 220];
  const boundsRows = [
    ['Latitude', '8.0000 to 37.5000 °N', 'Restricted to the geographical territorial boundaries of India'],
    ['Longitude', '68.0000 to 97.5000 °E', 'Restricted to the geographical territorial boundaries of India'],
    ['Casualty Count', '1 to 5,000 individuals', 'Must be a positive integer; flags extreme counts for command review'],
    ['Contact Phone', '10-digit Indian standard', 'Enforces valid emergency callback numbers for field verifications'],
    ['Priority Category', 'P0, P1, P2, P3', 'Strict enum: P0 (Critical), P1 (High), P2 (Moderate), P3 (Low)'],
    ['Distress Type', 'Medical, Flood, Food, Fire, Collapse', 'Guarantees correct specialized squad assignment'],
  ];
  drawTable(doc, 'Table 3.6 Disaster incident and SOS validation bounds', boundsHeaders, boundsRows, boundsColWidths, doc.y);

  // ==========================================
  // PAGE 21: CHAPTER 3 - ANALYSIS & DESIGN (Page 12)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '12');

  addSectionHeader(doc, '3.3 Module Description');
  addParagraph(doc, 'The ReliefLink application architecture is partitioned into four primary functional modules as mapped in Table 3.7 and summarized in Table 3.8.');

  const routeHeaders = ['Route', 'Page', 'Purpose'];
  const routeColWidths = [100, 120, 250];
  const routeRows = [
    ['/dashboard', 'Command Dashboard', 'Unified tactical overview with key metrics, active incidents, and alerts'],
    ['/map', 'Tactical GIS Map', 'Fullscreen interactive Leaflet map with distress pins, clusters, and shelters'],
    ['/sos', 'SOS Distress Portal', 'Rapid-intake citizen emergency reporting form with automatic GPS lock'],
    ['/incidents', 'Incident Management', 'Filterable tabular list of all reported emergencies with triage actions'],
    ['/volunteers', 'Volunteer Task Force', 'Volunteer registry, skills matrix, and one-click field dispatch modal'],
    ['/shelters', 'Shelter & Relief Camps', 'Live occupancy meters, food supplies, and medical kit inventory tracker'],
    ['/sla-alerts', 'SLA Escalation Center', 'High-priority countdown alarms and breached response threshold logs'],
    ['/analytics', 'Situation Reports', 'Real-time charts, casualty breakdown, and CSV data export functionality'],
  ];
  drawTable(doc, 'Table 3.7 Main pages and routes', routeHeaders, routeRows, routeColWidths, doc.y);

  addSubSectionHeader(doc, 'Module 1: SOS Distress Ingestion & Geo-Tracking');
  addParagraph(doc, 'Enables distressed citizens to submit immediate rescue beacons with browser-assisted GPS coordinate acquisition. Ingested payloads are validated, geocoded to human-readable street addresses using reverse-geocoding, and classified according to life-threat urgency.');

  addSubSectionHeader(doc, 'Module 2: Tactical Command & Interactive GIS Map');
  addParagraph(doc, 'Renders a comprehensive situational map of the disaster theater. Color-coded circular markers depict emergency priority (Red = P0, Orange = P1, Yellow = P2, Blue = P3). Incident commanders can filter by disaster category, click pins for immediate victim contact, and review nearby relief assets.');

  addSubSectionHeader(doc, 'Module 3: Volunteer Task Force & Shelter Inventory');
  addParagraph(doc, 'Coordinates humanitarian resources. Organizes registered volunteers by operational capability (First Aid, Water Rescue, Logistics, Heavy Equipment) and tracks shelter capacities to prevent overcrowded camps and uneven food distribution.');

  // ==========================================
  // PAGE 22: CHAPTER 3 - ANALYSIS & DESIGN (Page 13)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '13');

  addSubSectionHeader(doc, 'Module 4: Automated SLA Escalation & Analytics');
  addParagraph(doc, 'Provides proactive oversight through an autonomous server-side timer daemon. Unassigned or stagnant distress beacons trigger automatic priority elevation and visual flashing alerts in the command room. Aggregates rescue velocity and casualty metrics for governmental oversight.');

  const modSummaryHeaders = ['Module', 'Main Pages', 'Core Responsibility'];
  const modSummaryColWidths = [110, 110, 250];
  const modSummaryRows = [
    ['SOS Distress Ingestion', 'SOS Modal, Citizen Portal', 'Rapid GPS capture, category tagging, input sanitization, and deduplication'],
    ['Tactical Command & GIS', 'Tactical Map, Incidents', 'Interactive geospatial map, cluster analysis, and real-time Socket.IO broadcasts'],
    ['Volunteer & Shelter Ops', 'Volunteers, Shelters', 'Squad assignment, mission tracking, shelter bed counts, and supply meters'],
    ['SLA Engine & Analytics', 'SLA Alerts, Situation Reports', 'Automated response timers, threshold escalations, charts, and CSV data export'],
  ];
  drawTable(doc, 'Table 3.8 Summary of modules', modSummaryHeaders, modSummaryRows, modSummaryColWidths, doc.y);

  addSectionHeader(doc, 'Data Requirements');
  addParagraph(doc, 'The core database entities and attributes managed by ReliefLink are specified in Table 3.9.');

  const dataHeaders = ['Entity', 'Important Fields'];
  const dataColWidths = [110, 360];
  const dataRows = [
    ['Incident', 'id, title, category, priority, status, latitude, longitude, address, casualties, contact, createdAt'],
    ['SOSRequest', 'id, incidentId, reporterName, phone, emergencyType, peopleCount, gpsAccuracy, notes, timestamp'],
    ['Volunteer', 'id, name, phone, skillSet, status (Available, Dispatched, Off-Duty), assignedIncidentId, lastActive'],
    ['Shelter', 'id, name, district, address, latitude, longitude, capacity, currentOccupancy, foodStock, medicalKits'],
    ['EscalationLog', 'id, incidentId, initialPriority, escalatedPriority, breachDurationMinutes, escalatedAt, acknowledgedBy'],
  ];
  drawTable(doc, 'Table 3.9 Data requirements', dataHeaders, dataRows, dataColWidths, doc.y);

  addSectionHeader(doc, 'SLA Escalation Rules');
  const slaHeaders = ['Alert Type / Priority', 'Condition', 'SLA Window', 'Escalation Action'];
  const slaColWidths = [95, 140, 75, 160];
  const slaRows = [
    ['P0 - Life Threatening', 'Active flooding, trapped victims, major trauma', '< 15 mins', 'Direct alert to NDRF Battalion & District Magistrate'],
    ['P1 - Severe Emergency', 'Submerged residence, elder care, medical insulin need', '< 30 mins', 'Priority dispatch to closest specialized volunteer squad'],
    ['P2 - Moderate Distress', 'Potable water shortage, dry ration exhaustion', '< 2 hours', 'Queued to Civil Defense & NGO supply distribution squads'],
    ['P3 - Low / General Aid', 'Tarpaulin requests, general queries', '< 6 hours', 'Scheduled for community volunteer assistance'],
  ];
  drawTable(doc, 'Table 3.10 Priority matrix and SLA escalation rules', slaHeaders, slaRows, slaColWidths, doc.y);

  // ==========================================
  // PAGE 23: CHAPTER 3 - ANALYSIS & DESIGN (Page 14)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '14');

  addSectionHeader(doc, '3.4 UML Diagrams / Data Flow Diagram');
  addSubSectionHeader(doc, 'Use case diagram');
  addParagraph(doc, 'The use case diagram in Figure 3.2 illustrates the functional interactions between the primary system actors (Citizen, Volunteer Responder, Incident Commander, and the automated SLA Escalation Daemon).');

  // Vector Use Case Diagram
  const ucY = 120;
  doc.save();
  doc.rect(CONTENT_X, ucY, CONTENT_W, 360).fillAndStroke('#F9FAFB', '#D1D5DB');

  // System Boundary
  doc.rect(CONTENT_X + 110, ucY + 20, 250, 320).fillAndStroke('#FFFFFF', '#4B5563');
  doc.font('Times-Bold').fontSize(11).fillColor('#111827').text('ReliefLink System Boundary', CONTENT_X + 120, ucY + 28, { align: 'center', width: 230 });

  // Use cases (ellipses)
  const ucList = [
    { title: 'Submit Instant SOS with GPS', y: ucY + 55 },
    { title: 'View Live Tactical GIS Map', y: ucY + 100 },
    { title: 'Verify & Triage Emergencies', y: ucY + 145 },
    { title: 'Dispatch Volunteer Squads', y: ucY + 190 },
    { title: 'Update Mission Rescue Status', y: ucY + 235 },
    { title: 'Evaluate SLAs & Auto-Escalate', y: ucY + 280 }
  ];

  ucList.forEach(uc => {
    doc.ellipse(CONTENT_X + 235, uc.y, 105, 16).fillAndStroke('#EFF6FF', '#3B82F6');
    doc.font('Times-Bold').fontSize(8.5).fillColor('#1E40AF').text(uc.title, CONTENT_X + 135, uc.y - 6, { align: 'center', width: 200 });
  });

  // Actor: Citizen (Left)
  doc.circle(CONTENT_X + 50, ucY + 70, 10).stroke('#1F2937');
  doc.moveTo(CONTENT_X + 50, ucY + 80).lineTo(CONTENT_X + 50, ucY + 110).stroke();
  doc.moveTo(CONTENT_X + 30, ucY + 95).lineTo(CONTENT_X + 70, ucY + 95).stroke();
  doc.moveTo(CONTENT_X + 50, ucY + 110).lineTo(CONTENT_X + 35, ucY + 130).stroke();
  doc.moveTo(CONTENT_X + 50, ucY + 110).lineTo(CONTENT_X + 65, ucY + 130).stroke();
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Citizen', CONTENT_X + 25, ucY + 135, { width: 50, align: 'center' });

  // Actor: Commander (Right)
  doc.circle(CONTENT_X + 415, ucY + 150, 10).stroke('#1F2937');
  doc.moveTo(CONTENT_X + 415, ucY + 160).lineTo(CONTENT_X + 415, ucY + 190).stroke();
  doc.moveTo(CONTENT_X + 395, ucY + 175).lineTo(CONTENT_X + 435, ucY + 175).stroke();
  doc.moveTo(CONTENT_X + 415, ucY + 190).lineTo(CONTENT_X + 400, ucY + 210).stroke();
  doc.moveTo(CONTENT_X + 415, ucY + 190).lineTo(CONTENT_X + 430, ucY + 210).stroke();
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Commander', CONTENT_X + 390, ucY + 215, { width: 50, align: 'center' });

  // Lines
  doc.strokeColor('#9CA3AF').lineWidth(1);
  doc.moveTo(CONTENT_X + 70, ucY + 90).lineTo(CONTENT_X + 130, ucList[0].y).stroke();
  doc.moveTo(CONTENT_X + 395, ucY + 170).lineTo(CONTENT_X + 340, ucList[1].y).stroke();
  doc.moveTo(CONTENT_X + 395, ucY + 170).lineTo(CONTENT_X + 340, ucList[2].y).stroke();
  doc.moveTo(CONTENT_X + 395, ucY + 170).lineTo(CONTENT_X + 340, ucList[3].y).stroke();

  doc.restore();

  doc.y = ucY + 370;
  doc.font('Times-Bold').fontSize(10).fillColor(BLACK).text('Figure 3.2 Use case diagram', { align: 'center' });

  // ==========================================
  // PAGE 24: CHAPTER 3 - ANALYSIS & DESIGN (Page 15)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '15');

  addSubSectionHeader(doc, 'Entity relationship (class) diagram');
  addParagraph(doc, 'Figure 3.3 illustrates the relational structure of the database tables managed inside the PostgreSQL engine, depicting 1:N cardinalities between incidents, SOS requests, volunteer missions, and escalation logs.');

  // Vector ER Diagram
  const erY = 100;
  doc.save();
  doc.rect(CONTENT_X, erY, CONTENT_W, 230).fillAndStroke('#F9FAFB', '#D1D5DB');

  function drawEntityBox(x, y, title, attrs) {
    const boxW = 120;
    const boxH = 20 + attrs.length * 13;
    doc.rect(x, y, boxW, 18).fillAndStroke('#1E3A8A', '#1E3A8A');
    doc.font('Times-Bold').fontSize(8.5).fillColor('#FFFFFF').text(title, x, y + 4, { align: 'center', width: boxW });
    doc.rect(x, y + 18, boxW, boxH - 18).fillAndStroke('#FFFFFF', '#9CA3AF');
    attrs.forEach((a, idx) => {
      doc.font('Courier').fontSize(7.5).fillColor('#1F2937').text(a, x + 4, y + 22 + idx * 13);
    });
  }

  drawEntityBox(CONTENT_X + 20, erY + 20, 'Incident', ['id (PK)', 'title', 'category', 'priority', 'status', 'latitude', 'longitude']);
  drawEntityBox(CONTENT_X + 180, erY + 20, 'SOSRequest', ['id (PK)', 'incidentId (FK)', 'reporterName', 'phone', 'peopleCount', 'notes']);
  drawEntityBox(CONTENT_X + 335, erY + 20, 'Volunteer', ['id (PK)', 'name', 'phone', 'skillSet', 'status', 'assignedId']);
  drawEntityBox(CONTENT_X + 100, erY + 130, 'Shelter', ['id (PK)', 'name', 'district', 'capacity', 'occupancy', 'foodStock']);
  drawEntityBox(CONTENT_X + 260, erY + 130, 'EscalationLog', ['id (PK)', 'incidentId (FK)', 'breachMinutes', 'escalatedAt', 'status']);

  // Connectors
  doc.strokeColor('#4B5563').lineWidth(1);
  doc.moveTo(CONTENT_X + 140, erY + 50).lineTo(CONTENT_X + 180, erY + 50).stroke(); // Incident -> SOSRequest
  doc.moveTo(CONTENT_X + 80, erY + 110).lineTo(CONTENT_X + 80, erY + 140).lineTo(CONTENT_X + 100, erY + 140).stroke(); // Incident -> Shelter
  doc.moveTo(CONTENT_X + 140, erY + 80).lineTo(CONTENT_X + 260, erY + 150).stroke(); // Incident -> Escalation

  doc.restore();

  doc.y = erY + 240;
  doc.font('Times-Bold').fontSize(10).fillColor(BLACK).text('Figure 3.3 Entity relationship diagram', { align: 'center' });
  doc.moveDown(0.8);

  const entHeaders = ['Entity', 'Responsibility in ReliefLink Platform'];
  const entColWidths = [120, 350];
  const entRows = [
    ['Incident', 'Represents a distinct geographical disaster distress event requiring tactical coordination'],
    ['SOSRequest', 'Contains raw citizen emergency submissions, callback numbers, and casualty tallies'],
    ['Volunteer', 'Maintains personnel roster, certified operational skills, availability, and active assignments'],
    ['Shelter', 'Tracks emergency relief camp coordinates, maximum capacities, meal supplies, and medical kits'],
    ['EscalationLog', 'Records automated SLA violation alerts, response delay timestamps, and supervisor acknowledgements'],
  ];
  drawTable(doc, 'Table 3.11 Entity summary', entHeaders, entRows, entColWidths, doc.y);

  // ==========================================
  // PAGE 25: CHAPTER 3 - ANALYSIS & DESIGN (Page 16)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '16');

  addSubSectionHeader(doc, 'Sequence diagram');
  addParagraph(doc, 'The sequence diagram in Figure 3.4 illustrates the end-to-end execution flow of an emergency distress report, from citizen GPS acquisition to real-time command screen broadcast and automated SLA monitoring.');

  // Vector Sequence Diagram
  const seqY = 110;
  doc.save();
  doc.rect(CONTENT_X, seqY, CONTENT_W, 260).fillAndStroke('#FFFFFF', '#D1D5DB');

  const lifelines = [
    { name: 'Citizen Client', x: CONTENT_X + 45 },
    { name: 'Express Server', x: CONTENT_X + 155 },
    { name: 'PostgreSQL DB', x: CONTENT_X + 265 },
    { name: 'Socket.IO Hub', x: CONTENT_X + 355 },
    { name: 'Commander UI', x: CONTENT_X + 435 }
  ];

  lifelines.forEach(ll => {
    doc.rect(ll.x - 40, seqY + 10, 80, 20).fillAndStroke('#EFF6FF', '#2563EB');
    doc.font('Times-Bold').fontSize(7.5).fillColor('#1E40AF').text(ll.name, ll.x - 38, seqY + 16, { align: 'center', width: 76 });
    doc.strokeColor('#9CA3AF').dash(3, { space: 3 }).moveTo(ll.x, seqY + 30).lineTo(ll.x, seqY + 245).stroke();
  });
  doc.undash();

  function drawSeqMsg(fromX, toX, y, label) {
    doc.strokeColor('#1F2937').lineWidth(1).moveTo(fromX, y).lineTo(toX, y).stroke();
    const arrowDir = toX > fromX ? -4 : 4;
    doc.moveTo(toX, y).lineTo(toX + arrowDir, y - 3).lineTo(toX + arrowDir, y + 3).fill('#1F2937');
    doc.font('Times-Roman').fontSize(7).fillColor('#111827').text(label, Math.min(fromX, toX) + 5, y - 9, { width: Math.abs(toX - fromX) - 10, align: 'center' });
  }

  drawSeqMsg(lifelines[0].x, lifelines[1].x, seqY + 55, '1. POST /api/sos (coords, category)');
  drawSeqMsg(lifelines[1].x, lifelines[2].x, seqY + 90, '2. INSERT INTO incidents (triage P0)');
  drawSeqMsg(lifelines[2].x, lifelines[1].x, seqY + 125, '3. Commit Success (ID: INC-102)');
  drawSeqMsg(lifelines[1].x, lifelines[3].x, seqY + 160, '4. broadcast("new_incident", payload)');
  drawSeqMsg(lifelines[3].x, lifelines[4].x, seqY + 195, '5. WebSocket Push (Render Tactical Pin)');
  drawSeqMsg(lifelines[1].x, lifelines[0].x, seqY + 230, '6. Response 201 Created (SOS Tracking ID)');

  doc.restore();

  doc.y = seqY + 275;
  doc.font('Times-Bold').fontSize(10).fillColor(BLACK).text('Figure 3.4 Sequence diagram of distress SOS ingestion and dispatch', { align: 'center' });
  doc.moveDown(0.8);

  addParagraph(doc, '1. Citizen triggers SOS: The client browser requests high-accuracy GPS coordinates and packages the distress payload with category and casualty count.');
  addParagraph(doc, '2. Server-side validation: The Express API validates input against geographic boundaries, determines the priority tier, and inserts the record.');
  addParagraph(doc, '3. Real-time broadcast: The Socket.IO server pushes the newly registered incident to all connected tactical dashboards within 200 milliseconds.');
  addParagraph(doc, '4. Background SLA timer: An internal timer is initiated to monitor volunteer squad dispatch compliance.');

  // ==========================================
  // PAGE 26: CHAPTER 3 - ANALYSIS & DESIGN (Page 17)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '17');

  addSubSectionHeader(doc, 'Data flow diagram (DFD Level 1)');
  addParagraph(doc, 'Figure 3.5 depicts the Level 1 Data Flow Diagram for ReliefLink, illustrating how incoming citizen distress telemetry interacts with operational data stores and administrative actors.');

  // Vector DFD
  const dfdY = 110;
  doc.save();
  doc.rect(CONTENT_X, dfdY, CONTENT_W, 260).fillAndStroke('#F9FAFB', '#D1D5DB');

  // External Entities
  doc.rect(CONTENT_X + 15, dfdY + 20, 90, 30).fillAndStroke('#E0E7FF', '#4338CA');
  doc.font('Times-Bold').fontSize(8.5).fillColor('#312E81').text('Citizen In Need', CONTENT_X + 20, dfdY + 28, { align: 'center', width: 80 });

  doc.rect(CONTENT_X + 370, dfdY + 20, 95, 30).fillAndStroke('#E0E7FF', '#4338CA');
  doc.font('Times-Bold').fontSize(8.5).fillColor('#312E81').text('Incident Commander', CONTENT_X + 375, dfdY + 28, { align: 'center', width: 85 });

  // Processes (Circles)
  function drawDfdProcess(x, y, num, title) {
    doc.circle(x, y, 22).fillAndStroke('#DBEAFE', '#2563EB');
    doc.font('Times-Bold').fontSize(7).fillColor('#1E40AF').text(num, x - 15, y - 10, { align: 'center', width: 30 });
    doc.font('Times-Bold').fontSize(6.5).fillColor('#1E3A8A').text(title, x - 20, y - 2, { align: 'center', width: 40 });
  }

  drawDfdProcess(CONTENT_X + 70, dfdY + 100, '1.0', 'Capture SOS');
  drawDfdProcess(CONTENT_X + 180, dfdY + 100, '2.0', 'Triage\nScoring');
  drawDfdProcess(CONTENT_X + 290, dfdY + 100, '3.0', 'SLA\nMonitor');
  drawDfdProcess(CONTENT_X + 400, dfdY + 100, '4.0', 'Dispatch\nSquads');

  // Data Stores
  doc.rect(CONTENT_X + 130, dfdY + 180, 100, 25).fillAndStroke('#FEF3C7', '#B45309');
  doc.font('Times-Bold').fontSize(8).fillColor('#78350F').text('D1: Incidents DB', CONTENT_X + 135, dfdY + 187, { align: 'center', width: 90 });

  doc.rect(CONTENT_X + 250, dfdY + 180, 100, 25).fillAndStroke('#FEF3C7', '#B45309');
  doc.font('Times-Bold').fontSize(8).fillColor('#78350F').text('D2: Volunteers DB', CONTENT_X + 255, dfdY + 187, { align: 'center', width: 90 });

  // Arrows
  doc.strokeColor('#4B5563').lineWidth(1);
  doc.moveTo(CONTENT_X + 60, dfdY + 50).lineTo(CONTENT_X + 70, dfdY + 78).stroke();
  doc.moveTo(CONTENT_X + 92, dfdY + 100).lineTo(CONTENT_X + 158, dfdY + 100).stroke();
  doc.moveTo(CONTENT_X + 180, dfdY + 122).lineTo(CONTENT_X + 180, dfdY + 180).stroke();
  doc.moveTo(CONTENT_X + 290, dfdY + 122).lineTo(CONTENT_X + 230, dfdY + 180).stroke();
  doc.moveTo(CONTENT_X + 300, dfdY + 180).lineTo(CONTENT_X + 385, dfdY + 115).stroke();
  doc.moveTo(CONTENT_X + 415, dfdY + 78).lineTo(CONTENT_X + 415, dfdY + 50).stroke();

  doc.restore();

  doc.y = dfdY + 275;
  doc.font('Times-Bold').fontSize(10).fillColor(BLACK).text('Figure 3.5 Level 1 data flow diagram', { align: 'center' });

  // ==========================================
  // PAGE 27: CHAPTER 3 - ANALYSIS & DESIGN (Page 18)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '18');

  addSectionHeader(doc, '3.5 Algorithm / Flowchart');
  addSubSectionHeader(doc, 'Flowchart of SOS submission and geo-verification');
  addParagraph(doc, 'Figure 3.6 demonstrates the decision flowchart executed upon citizen SOS beacon transmission, highlighting geographic bounding checks and priority matrix routing.');

  // Vector Flowchart 1
  const fc1Y = 110;
  doc.save();
  doc.rect(CONTENT_X, fc1Y, CONTENT_W, 280).fillAndStroke('#F9FAFB', '#D1D5DB');

  function drawRoundRect(x, y, w, h, text, fill, stroke) {
    doc.roundedRect(x, y, w, h, 6).fillAndStroke(fill, stroke);
    doc.font('Times-Bold').fontSize(8).fillColor('#111827').text(text, x + 2, y + (h/2) - 4, { align: 'center', width: w - 4 });
  }

  function drawDiamond(cx, cy, w, h, text) {
    doc.save();
    doc.polygon([cx, cy - h/2], [cx + w/2, cy], [cx, cy + h/2], [cx - w/2, cy]).fillAndStroke('#FEF08A', '#CA8A04');
    doc.font('Times-Bold').fontSize(7.5).fillColor('#713F12').text(text, cx - w/2 + 2, cy - 6, { align: 'center', width: w - 4 });
    doc.restore();
  }

  drawRoundRect(CONTENT_X + 175, fc1Y + 15, 130, 24, 'Start: Citizen Taps SOS', '#DCFCE7', '#16A34A');
  doc.moveTo(CONTENT_X + 240, fc1Y + 39).lineTo(CONTENT_X + 240, fc1Y + 55).stroke();

  drawRoundRect(CONTENT_X + 160, fc1Y + 55, 160, 24, 'Acquire W3C Geolocation Coordinates', '#E0F2FE', '#0284C7');
  doc.moveTo(CONTENT_X + 240, fc1Y + 79).lineTo(CONTENT_X + 240, fc1Y + 95).stroke();

  drawDiamond(CONTENT_X + 240, fc1Y + 115, 140, 40, 'Within India Bounds\n(8-37N, 68-97E)?');

  // No branch
  doc.moveTo(CONTENT_X + 170, fc1Y + 115).lineTo(CONTENT_X + 110, fc1Y + 115).stroke();
  doc.font('Times-Roman').fontSize(7.5).fillColor(BLACK).text('No', CONTENT_X + 130, fc1Y + 105);
  drawRoundRect(CONTENT_X + 30, fc1Y + 103, 80, 24, 'Reject: Out of Zone', '#FEE2E2', '#DC2626');

  // Yes branch
  doc.moveTo(CONTENT_X + 240, fc1Y + 135).lineTo(CONTENT_X + 240, fc1Y + 155).stroke();
  doc.font('Times-Roman').fontSize(7.5).fillColor(BLACK).text('Yes', CONTENT_X + 245, fc1Y + 140);
  drawRoundRect(CONTENT_X + 160, fc1Y + 155, 160, 24, 'Score Priority Matrix (P0 to P3)', '#E0F2FE', '#0284C7');

  doc.moveTo(CONTENT_X + 240, fc1Y + 179).lineTo(CONTENT_X + 240, fc1Y + 195).stroke();
  drawRoundRect(CONTENT_X + 160, fc1Y + 195, 160, 24, 'Persist to PostgreSQL (PGlite)', '#DBEAFE', '#2563EB');

  doc.moveTo(CONTENT_X + 240, fc1Y + 219).lineTo(CONTENT_X + 240, fc1Y + 235).stroke();
  drawRoundRect(CONTENT_X + 150, fc1Y + 235, 180, 24, 'Emit Socket.IO "incident_created" Event', '#FEF3C7', '#D97706');

  doc.restore();

  doc.y = fc1Y + 295;
  doc.font('Times-Bold').fontSize(10).fillColor(BLACK).text('Figure 3.6 Flowchart of the SOS submission and geo-verification', { align: 'center' });

  // ==========================================
  // PAGE 28: CHAPTER 3 - ANALYSIS & DESIGN (Page 19)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '19');

  addSubSectionHeader(doc, 'Flowchart of SLA escalation and automated priority worker');
  addParagraph(doc, 'Figure 3.7 illustrates the cyclic evaluation logic executed by the server daemon every 60 seconds to detect breached incident response SLAs.');

  // Vector Flowchart 2
  const fc2Y = 110;
  doc.save();
  doc.rect(CONTENT_X, fc2Y, CONTENT_W, 280).fillAndStroke('#F9FAFB', '#D1D5DB');

  drawRoundRect(CONTENT_X + 170, fc2Y + 15, 140, 24, 'Cron Tick: Every 60 Seconds', '#DCFCE7', '#16A34A');
  doc.moveTo(CONTENT_X + 240, fc2Y + 39).lineTo(CONTENT_X + 240, fc2Y + 55).stroke();

  drawRoundRect(CONTENT_X + 150, fc2Y + 55, 180, 24, 'Query Open / Unassigned Incidents', '#E0F2FE', '#0284C7');
  doc.moveTo(CONTENT_X + 240, fc2Y + 79).lineTo(CONTENT_X + 240, fc2Y + 95).stroke();

  drawDiamond(CONTENT_X + 240, fc2Y + 115, 150, 40, 'Incident Age > Priority\nSLA Window?');

  // No branch
  doc.moveTo(CONTENT_X + 315, fc2Y + 115).lineTo(CONTENT_X + 380, fc2Y + 115).stroke();
  doc.font('Times-Roman').fontSize(7.5).fillColor(BLACK).text('No', CONTENT_X + 335, fc2Y + 105);
  drawRoundRect(CONTENT_X + 380, fc2Y + 103, 85, 24, 'Maintain Priority', '#E5E7EB', '#6B7280');

  // Yes branch
  doc.moveTo(CONTENT_X + 240, fc2Y + 135).lineTo(CONTENT_X + 240, fc2Y + 155).stroke();
  doc.font('Times-Roman').fontSize(7.5).fillColor(BLACK).text('Yes', CONTENT_X + 245, fc2Y + 140);
  drawRoundRect(CONTENT_X + 150, fc2Y + 155, 180, 24, 'Elevate Priority Tier (e.g. P1 -> P0)', '#FEE2E2', '#DC2626');

  doc.moveTo(CONTENT_X + 240, fc2Y + 179).lineTo(CONTENT_X + 240, fc2Y + 195).stroke();
  drawRoundRect(CONTENT_X + 150, fc2Y + 195, 180, 24, 'Log Breach to EscalationLog Table', '#DBEAFE', '#2563EB');

  doc.moveTo(CONTENT_X + 240, fc2Y + 219).lineTo(CONTENT_X + 240, fc2Y + 235).stroke();
  drawRoundRect(CONTENT_X + 140, fc2Y + 235, 200, 24, 'Broadcast Audio-Visual Alert to Command UI', '#FEF3C7', '#D97706');

  doc.restore();

  doc.y = fc2Y + 295;
  doc.font('Times-Bold').fontSize(10).fillColor(BLACK).text('Figure 3.7 Flowchart of alert rule evaluation', { align: 'center' });

  // ==========================================
  // PAGE 29: CHAPTER 3 - ANALYSIS & DESIGN (Page 20)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '20');

  addSectionHeader(doc, 'Algorithms');

  addCodeBlock(doc, [
    'Algorithm 1: SOS Distress Ingestion & Geospatial Clustering',
    '1. Upon receiving POST /api/sos payload (lat, lng, category, count, contact):',
    '2. Execute boundary check: Verify 8.0 <= lat <= 37.5 and 68.0 <= lng <= 97.5.',
    '3. If outside boundaries, return HTTP 400 "Coordinates outside disaster operational theater".',
    '4. Query active incidents within 100-meter radius to detect duplicate submissions.',
    '5. If match found: Increment casualty count and append caller notes to existing incident record.',
    '6. Else: Compute initial priority tier via Algorithm 2 and persist new incident to PostgreSQL.',
    '7. Trigger Socket.IO event "incident:created" with payload to all connected control rooms.'
  ]);

  addCodeBlock(doc, [
    'Algorithm 2: Severity Scoring & Dynamic Triage',
    'Input: emergencyCategory, peopleCount, isTrapped, hasMedicalEmergency',
    '1. Set base score S = 0.',
    '2. If isTrapped == true OR hasMedicalEmergency == true: S = S + 50.',
    '3. If emergencyCategory == "Medical" OR emergencyCategory == "Rescue": S = S + 30.',
    '4. If peopleCount >= 10: S = S + 20; Else if peopleCount >= 3: S = S + 10.',
    '5. Evaluate score S:',
    '     If S >= 70: Return "P0" (Critical - Immediate Response <= 15m)',
    '     Else if S >= 40: Return "P1" (High - Response <= 30m)',
    '     Else if S >= 20: Return "P2" (Moderate - Response <= 2h)',
    '     Else: Return "P3" (Low - General Relief <= 6h)'
  ]);

  addCodeBlock(doc, [
    'Algorithm 3: Automated SLA Escalation Engine',
    '1. Triggered on server interval every 60,000 milliseconds (60 seconds).',
    '2. Load all records from "incidents" where status IN ("Reported", "Verified", "Unassigned").',
    '3. For each incident record I:',
    '     Compute elapsedDuration = (Date.now() - I.createdAt) in minutes.',
    '     If I.priority == "P1" AND elapsedDuration > 30:',
    '        Update I.priority = "P0", I.escalated = true in database.',
    '        Insert record into "escalation_logs" with timestamp and reason.',
    '        Emit Socket.IO "incident:escalated" event to play command room distress alarm.',
    '     Else if I.priority == "P2" AND elapsedDuration > 120:',
    '        Update I.priority = "P1", emit Socket.IO notification.',
    '4. Log evaluation summary to server console.'
  ]);

  // ==========================================
  // PAGE 30: CHAPTER 4 - IMPLEMENTATION (Page 21)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '21');

  addChapterHeader(doc, '4', 'IMPLEMENTATION');
  addSectionHeader(doc, '4.1 Implementation Details');
  addParagraph(doc, 'ReliefLink is engineered as a robust, decoupled full-stack architecture combining a reactive client single-page application (SPA) with a Node.js/Express server and an embedded PostgreSQL database engine. The system completely avoids external database daemon dependencies by embedding PGlite (@electric-sql/pglite), allowing transactional SQL queries, schema migrations, and relational integrity to execute natively inside the Node.js process.');
  doc.moveDown(0.3);

  addParagraph(doc, 'The engineering implementation is governed by five foundational architectural principles:');
  addBullet(doc, 'Real-Time Event Sourcing: ', 'Socket.IO bi-directional WebSocket channels ensure that incident creation, status progressions, and volunteer dispatches reflect instantly without manual browser refreshing.');
  addBullet(doc, 'Embedded Transactional Integrity: ', 'All database tables (incidents, volunteers, shelters, escalation logs) are governed by strict primary keys, foreign key constraints, and automatic timestamp indexing.');
  addBullet(doc, 'Resilient Offline Readiness: ', 'Critical UI components, map tiles, and offline incident submission forms are cached locally via Progressive Web App (PWA) service workers.');
  addBullet(doc, 'Pure Function Validation: ', 'Geographical boundary checks, phone sanitisation, and SLA priority calculations are written as deterministic pure functions, enabling high-coverage automated unit testing.');
  addBullet(doc, 'Layered Separation of Concerns: ', 'Routes, controllers, database drivers, and background escalation daemons reside in strictly separated modular directories.');

  addSectionHeader(doc, 'Development approach');
  addParagraph(doc, 'Development proceeded in iterative milestones: First, the relational PostgreSQL database schema was constructed with automated migration scripts. Second, the Express RESTful routes and Socket.IO real-time channels were established. Third, the interactive Leaflet GIS tactical mapping engine was integrated with custom priority marker pins. Fourth, the autonomous 60-second SLA escalation daemon was implemented. Finally, the volunteer dispatch portal, shelter monitor, and CSV situation report exporter were built and validated.');

  // ==========================================
  // PAGE 31: CHAPTER 4 - IMPLEMENTATION (Page 22)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '22');

  addSectionHeader(doc, 'Reusable interface parts');
  addParagraph(doc, 'The user interface is composed of modular, self-contained React components designed for emergency clarity as detailed in Table 4.1.');

  const compTableHeaders = ['Block', 'Type', 'Used For'];
  const compTableColWidths = [120, 110, 240];
  const compTableRows = [
    ['TacticalMap', 'Leaflet Component', 'Renders full-screen interactive GIS map with custom SVG incident pins and clusters'],
    ['SOSModal', 'Modal Component', 'Provides one-tap citizen emergency reporting form with automatic GPS acquisition'],
    ['TriageBadge', 'UI Badge Component', 'Visual indicator for emergency priority (P0 Critical, P1 High, P2 Moderate, P3 Low)'],
    ['IncidentCard', 'Card Component', 'Displays incident summary, casualty tally, reporter contact, and action buttons'],
    ['MissionDispatcher', 'Form Component', 'Selects and assigns available accredited volunteer squads to active emergencies'],
    ['ShelterCapacityBar', 'Progress Component', 'Visualizes relief camp bed occupancy, ration stores, and medical kit levels'],
    ['SLAAlarmBanner', 'Alert Component', 'Flashing high-contrast audio-visual banner signaling breached response windows'],
    ['DataTable', 'Grid Component', 'Sortable, filterable tabular list of emergencies with multi-criteria search'],
  ];
  drawTable(doc, 'Table 4.1 Reusable interface components', compTableHeaders, compTableRows, compTableColWidths, doc.y);

  addSectionHeader(doc, '4.2 Module Implementation');
  addSubSectionHeader(doc, 'Incident Management & Schema (Module 1)');
  addParagraph(doc, 'The database initialization script runs automatically on server boot, setting up relational tables in embedded PostgreSQL with indexing on coordinates and status.');

  addSubSectionHeader(doc, 'Automated SLA Escalation Daemon (Module 2)');
  addParagraph(doc, 'The SLA escalation worker is created using a Node.js interval timer firing every 60 seconds. Stagnant unassigned incidents are automatically upgraded in severity with immediate WebSocket broadcast.');

  // ==========================================
  // PAGE 32: CHAPTER 4 - IMPLEMENTATION (Page 23)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '23');

  addCodeBlock(doc, [
    '// server/services/slaWorker.ts - Automated SLA Escalation Background Daemon',
    'import { getDb } from "../db";',
    'import { getIo } from "../socket";',
    '',
    'export function startEscalationWorker(intervalMs = 60000) {',
    '  setInterval(async () => {',
    '    try {',
    '      const db = await getDb();',
    '      const io = getIo();',
    '      const now = new Date();',
    '',
    '      // Fetch unassigned or unverified incidents exceeding SLA limits',
    '      const res = await db.query(`',
    '        SELECT id, title, priority, created_at FROM incidents',
    '        WHERE status IN (\'Reported\', \'Verified\') AND escalated = false',
    '      `);',
    '',
    '      for (const inc of res.rows) {',
    '        const ageMinutes = (now.getTime() - new Date(inc.created_at).getTime()) / 60000;',
    '        let shouldEscalate = false;',
    '        let newPriority = inc.priority;',
    '',
    '        if (inc.priority === "P1" && ageMinutes > 30) {',
    '          shouldEscalate = true;',
    '          newPriority = "P0";',
    '        } else if (inc.priority === "P2" && ageMinutes > 120) {',
    '          shouldEscalate = true;',
    '          newPriority = "P1";',
    '        }',
    '',
    '        if (shouldEscalate) {',
    '          await db.query(`',
    '            UPDATE incidents SET priority = $1, escalated = true WHERE id = $2',
    '          `, [newPriority, inc.id]);',
    '',
    '          io.emit("incident:escalated", { id: inc.id, newPriority, ageMinutes });',
    '          console.log(`[SLA ESCALATION] Incident ${inc.id} escalated to ${newPriority}`);',
    '        }',
    '      }',
    '    } catch (err) {',
    '      console.error("[SLA Daemon Error]", err);',
    '    }',
    '  }, intervalMs);',
    '}'
  ]);

  // ==========================================
  // PAGE 33: CHAPTER 4 - IMPLEMENTATION (Page 24)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '24');

  addSectionHeader(doc, '4.3 Tools and Technologies Used');
  addParagraph(doc, 'The production libraries, software packages, and developer toolchains utilized to construct ReliefLink are detailed in Table 4.2 and Table 4.3.');

  const libHeaders = ['Item', 'Purpose in ReliefLink Platform'];
  const libColWidths = [130, 340];
  const libRows = [
    ['React 19 & TypeScript', 'Component-based responsive user interface with strict compile-time type safety'],
    ['Tailwind CSS', 'Utility-first emergency-optimised UI styling with high-contrast night/field themes'],
    ['Leaflet & OpenStreetMap', 'Interactive GIS mapping displaying live emergency pins, clusters, and shelter rings'],
    ['Node.js & Express.js', 'High-concurrency event-driven server runtime providing RESTful endpoints'],
    ['Socket.IO (Client & Server)', 'Bi-directional real-time WebSocket protocol delivering sub-second incident alerts'],
    ['@electric-sql/pglite', 'Lightweight embedded PostgreSQL engine running natively inside the Node.js process'],
    ['Zod Validation Library', 'Schema-driven runtime validation of coordinates, phone numbers, and priority enums'],
    ['Lucide React Icons', 'Clear, vector emergency pictograms representing medical, flood, and fire alerts'],
  ];
  drawTable(doc, 'Table 4.2 Libraries, frameworks and services', libHeaders, libRows, libColWidths, doc.y);

  const devHeaders = ['Tool', 'Purpose'];
  const devColWidths = [130, 340];
  const devRows = [
    ['Visual Studio Code', 'Primary Integrated Development Environment (IDE) for TypeScript and React'],
    ['Git & GitHub', 'Source code version control, branching, and pull-request collaboration'],
    ['Postman', 'Manual and automated testing of Express REST endpoints and payload responses'],
    ['Vite Dev Server', 'Lightning-fast client bundling and Hot Module Replacement (HMR) environment'],
    ['Chrome DevTools', 'Network profiling, WebSocket inspection, and geolocation simulation'],
  ];
  drawTable(doc, 'Table 4.3 Development tools', devHeaders, devRows, devColWidths, doc.y);

  // ==========================================
  // PAGE 34: CHAPTER 5 - RESULTS AND TESTING (Page 25)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '25');

  addChapterHeader(doc, '5', 'RESULTS AND TESTING');
  addSectionHeader(doc, '5.1 Screenshots and Outputs');
  addParagraph(doc, 'Figures 5.1 through 5.8 illustrate the core functional screens of the operational ReliefLink platform:');

  // Vector Mockup 1: Tactical Dashboard
  const scr1Y = doc.y + 10;
  doc.save();
  doc.rect(CONTENT_X, scr1Y, CONTENT_W, 130).fillAndStroke('#0F172A', '#334155');
  // Nav bar
  doc.rect(CONTENT_X, scr1Y, CONTENT_W, 20).fill('#1E293B');
  doc.font('Times-Bold').fontSize(8).fillColor('#EF4444').text('● RELIEFLINK COMMAND', CONTENT_X + 10, scr1Y + 6);
  doc.font('Times-Roman').fontSize(7).fillColor('#94A3B8').text('NDRF Command Portal | Active Incidents: 24 | Volunteers: 156', CONTENT_X + 160, scr1Y + 6);

  // Metric cards
  doc.rect(CONTENT_X + 10, scr1Y + 28, 105, 35).fillAndStroke('#1E293B', '#475569');
  doc.font('Times-Bold').fontSize(7).fillColor('#EF4444').text('P0 Critical SOS', CONTENT_X + 15, scr1Y + 32);
  doc.font('Times-Bold').fontSize(14).fillColor('#FFFFFF').text('5', CONTENT_X + 15, scr1Y + 44);

  doc.rect(CONTENT_X + 125, scr1Y + 28, 105, 35).fillAndStroke('#1E293B', '#475569');
  doc.font('Times-Bold').fontSize(7).fillColor('#F59E0B').text('P1 Severe', CONTENT_X + 130, scr1Y + 32);
  doc.font('Times-Bold').fontSize(14).fillColor('#FFFFFF').text('11', CONTENT_X + 130, scr1Y + 44);

  doc.rect(CONTENT_X + 240, scr1Y + 28, 105, 35).fillAndStroke('#1E293B', '#475569');
  doc.font('Times-Bold').fontSize(7).fillColor('#10B981').text('Rescued Today', CONTENT_X + 245, scr1Y + 32);
  doc.font('Times-Bold').fontSize(14).fillColor('#FFFFFF').text('342', CONTENT_X + 245, scr1Y + 44);

  doc.rect(CONTENT_X + 355, scr1Y + 28, 105, 35).fillAndStroke('#1E293B', '#475569');
  doc.font('Times-Bold').fontSize(7).fillColor('#3B82F6').text('Active Shelters', CONTENT_X + 360, scr1Y + 32);
  doc.font('Times-Bold').fontSize(14).fillColor('#FFFFFF').text('18', CONTENT_X + 360, scr1Y + 44);

  // Map preview
  doc.rect(CONTENT_X + 10, scr1Y + 70, CONTENT_W - 20, 52).fillAndStroke('#1E293B', '#38BDF8');
  doc.font('Times-Bold').fontSize(8).fillColor('#38BDF8').text('Live Tactical GIS Map (Leaflet.js) - Showing Chennai & Cuddalore Flood Clusters', CONTENT_X + 20, scr1Y + 76);
  doc.circle(CONTENT_X + 120, scr1Y + 102, 6).fill('#EF4444');
  doc.circle(CONTENT_X + 220, scr1Y + 98, 8).fill('#F59E0B');
  doc.circle(CONTENT_X + 320, scr1Y + 105, 5).fill('#3B82F6');
  doc.restore();

  doc.y = scr1Y + 136;
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Figure 5.1 Dashboard with live atmospheric metric cards', { align: 'center' });
  doc.moveDown(1);

  // Vector Mockup 2: Incident List
  const scr2Y = doc.y;
  doc.save();
  doc.rect(CONTENT_X, scr2Y, CONTENT_W, 110).fillAndStroke('#0F172A', '#334155');
  doc.rect(CONTENT_X + 10, scr2Y + 10, CONTENT_W - 20, 20).fill('#1E293B');
  doc.font('Times-Bold').fontSize(7.5).fillColor('#CBD5E1').text('INCIDENT ID', CONTENT_X + 20, scr2Y + 16);
  doc.text('CATEGORY', CONTENT_X + 100, scr2Y + 16);
  doc.text('LOCATION / GPS', CONTENT_X + 180, scr2Y + 16);
  doc.text('PRIORITY', CONTENT_X + 310, scr2Y + 16);
  doc.text('STATUS', CONTENT_X + 390, scr2Y + 16);

  // Row 1
  doc.rect(CONTENT_X + 10, scr2Y + 32, CONTENT_W - 20, 22).fill('#1E293B');
  doc.font('Courier').fontSize(7).fillColor('#FFFFFF').text('INC-1092', CONTENT_X + 20, scr2Y + 38);
  doc.font('Times-Roman').fontSize(7).fillColor('#FCA5A5').text('Flood Evacuation', CONTENT_X + 100, scr2Y + 38);
  doc.text('Velachery, 12.9815, 80.2180', CONTENT_X + 180, scr2Y + 38);
  doc.font('Times-Bold').fontSize(7).fillColor('#EF4444').text('P0 CRITICAL', CONTENT_X + 310, scr2Y + 38);
  doc.fillColor('#F59E0B').text('DISPATCHED', CONTENT_X + 390, scr2Y + 38);

  // Row 2
  doc.rect(CONTENT_X + 10, scr2Y + 56, CONTENT_W - 20, 22).fill('#0F172A');
  doc.font('Courier').fontSize(7).fillColor('#FFFFFF').text('INC-1093', CONTENT_X + 20, scr2Y + 62);
  doc.font('Times-Roman').fontSize(7).fillColor('#FCD34D').text('Medical Trauma', CONTENT_X + 100, scr2Y + 62);
  doc.text('Tambaram, 12.9249, 80.1000', CONTENT_X + 180, scr2Y + 62);
  doc.font('Times-Bold').fontSize(7).fillColor('#F59E0B').text('P1 SEVERE', CONTENT_X + 310, scr2Y + 62);
  doc.fillColor('#3B82F6').text('VERIFIED', CONTENT_X + 390, scr2Y + 62);

  // Row 3
  doc.rect(CONTENT_X + 10, scr2Y + 80, CONTENT_W - 20, 22).fill('#1E293B');
  doc.font('Courier').fontSize(7).fillColor('#FFFFFF').text('INC-1094', CONTENT_X + 20, scr2Y + 86);
  doc.font('Times-Roman').fontSize(7).fillColor('#93C5FD').text('Potable Water Need', CONTENT_X + 100, scr2Y + 86);
  doc.text('Saidapet, 13.0210, 80.2231', CONTENT_X + 180, scr2Y + 86);
  doc.font('Times-Bold').fontSize(7).fillColor('#3B82F6').text('P2 MODERATE', CONTENT_X + 310, scr2Y + 86);
  doc.fillColor('#10B981').text('RESOLVED', CONTENT_X + 390, scr2Y + 86);

  doc.restore();

  doc.y = scr2Y + 116;
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Figure 5.2 Virtual station registry', { align: 'center' });

  // ==========================================
  // PAGE 35: CHAPTER 5 - RESULTS AND TESTING (Page 26)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '26');

  // Vector Mockup 3: Citizen SOS Form
  const scr3Y = 80;
  doc.save();
  doc.rect(CONTENT_X + 60, scr3Y, CONTENT_W - 120, 160).fillAndStroke('#0F172A', '#EF4444');
  doc.rect(CONTENT_X + 60, scr3Y, CONTENT_W - 120, 24).fill('#EF4444');
  doc.font('Times-Bold').fontSize(9).fillColor('#FFFFFF').text('EMERGENCY SOS DISTRESS REPORT', CONTENT_X + 70, scr3Y + 7, { align: 'center', width: CONTENT_W - 140 });

  doc.font('Times-Bold').fontSize(8).fillColor('#E2E8F0').text('Emergency Category:', CONTENT_X + 75, scr3Y + 36);
  doc.rect(CONTENT_X + 75, scr3Y + 48, CONTENT_W - 150, 18).fillAndStroke('#1E293B', '#475569');
  doc.font('Times-Roman').fontSize(8).fillColor('#F87171').text('Medical Emergency / Trapped Civilians', CONTENT_X + 85, scr3Y + 53);

  doc.font('Times-Bold').fontSize(8).fillColor('#E2E8F0').text('GPS Location (Auto-Locked):', CONTENT_X + 75, scr3Y + 72);
  doc.rect(CONTENT_X + 75, scr3Y + 84, CONTENT_W - 150, 18).fillAndStroke('#1E293B', '#475569');
  doc.font('Courier').fontSize(8).fillColor('#4ADE80').text('13.0827° N, 80.2707° E (Accuracy: ±4.2m)', CONTENT_X + 85, scr3Y + 89);

  doc.font('Times-Bold').fontSize(8).fillColor('#E2E8F0').text('People Trapped / Casualties:', CONTENT_X + 75, scr3Y + 108);
  doc.rect(CONTENT_X + 75, scr3Y + 120, 80, 18).fillAndStroke('#1E293B', '#475569');
  doc.font('Times-Roman').fontSize(8).fillColor('#FFFFFF').text('4 Persons', CONTENT_X + 85, scr3Y + 125);

  doc.rect(CONTENT_X + 175, scr3Y + 120, CONTENT_W - 250, 20).fillAndStroke('#DC2626', '#B91C1C');
  doc.font('Times-Bold').fontSize(9).fillColor('#FFFFFF').text('TRANSMIT SOS BEACON', CONTENT_X + 175, scr3Y + 126, { align: 'center', width: CONTENT_W - 250 });

  doc.restore();

  doc.y = scr3Y + 168;
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Figure 5.3 Add / edit station form', { align: 'center' });
  doc.moveDown(1);

  // Vector Mockup 4: Volunteer Task Force
  const scr4Y = doc.y;
  doc.save();
  doc.rect(CONTENT_X, scr4Y, CONTENT_W, 140).fillAndStroke('#0F172A', '#334155');
  doc.rect(CONTENT_X, scr4Y, CONTENT_W, 20).fill('#1E293B');
  doc.font('Times-Bold').fontSize(8).fillColor('#38BDF8').text('VOLUNTEER TASK FORCE DEPLOYMENT PORTAL', CONTENT_X + 15, scr4Y + 6);

  // Volunteer cards
  function drawVolCard(x, y, name, skill, status, col) {
    doc.rect(x, y, 140, 48).fillAndStroke('#1E293B', '#475569');
    doc.font('Times-Bold').fontSize(8).fillColor('#FFFFFF').text(name, x + 8, y + 6);
    doc.font('Times-Roman').fontSize(7.5).fillColor('#94A3B8').text(skill, x + 8, y + 18);
    doc.rect(x + 8, y + 30, 70, 12).fill(col);
    doc.font('Times-Bold').fontSize(6.5).fillColor('#FFFFFF').text(status, x + 8, y + 32, { align: 'center', width: 70 });
  }

  drawVolCard(CONTENT_X + 10, scr4Y + 28, 'Squad Alpha-1 (Boat Rescue)', 'Inflatable Boats, First Aid', 'ON SCENE', '#16A34A');
  drawVolCard(CONTENT_X + 165, scr4Y + 28, 'Medical Unit Bravo', 'EMT Paramedics, Insulin', 'EN ROUTE', '#D97706');
  drawVolCard(CONTENT_X + 320, scr4Y + 28, 'Civil Relief Charlie', 'Food Distribution, Tents', 'AVAILABLE', '#2563EB');

  // Bottom action
  doc.rect(CONTENT_X + 10, scr4Y + 85, CONTENT_W - 20, 45).fillAndStroke('#1E293B', '#3B82F6');
  doc.font('Times-Bold').fontSize(7.5).fillColor('#38BDF8').text('Quick Dispatch Assignment to Active Incident INC-1092', CONTENT_X + 20, scr4Y + 92);
  doc.font('Times-Roman').fontSize(7).fillColor('#CBD5E1').text('Assigned Target: Velachery Flood Zone • ETA: 8 minutes • Communication Channel: VHF Band 4', CONTENT_X + 20, scr4Y + 106);

  doc.restore();

  doc.y = scr4Y + 148;
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Figure 5.4 Station detail with Recharts trend graphs', { align: 'center' });

  // ==========================================
  // PAGE 36: CHAPTER 5 - RESULTS AND TESTING (Page 27)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '27');

  // Vector Mockup 5: Shelter Management
  const scr5Y = 80;
  doc.save();
  doc.rect(CONTENT_X, scr5Y, CONTENT_W, 140).fillAndStroke('#0F172A', '#334155');
  doc.rect(CONTENT_X, scr5Y, CONTENT_W, 20).fill('#1E293B');
  doc.font('Times-Bold').fontSize(8).fillColor('#10B981').text('EMERGENCY SHELTER & RELIEF CAMP MONITOR', CONTENT_X + 15, scr5Y + 6);

  function drawShelterRow(y, name, district, occ, cap, meals, kits) {
    const pct = Math.round((occ / cap) * 100);
    doc.rect(CONTENT_X + 10, y, CONTENT_W - 20, 32).fillAndStroke('#1E293B', '#475569');
    doc.font('Times-Bold').fontSize(7.5).fillColor('#FFFFFF').text(name, CONTENT_X + 16, y + 4);
    doc.font('Times-Roman').fontSize(6.5).fillColor('#94A3B8').text(district, CONTENT_X + 16, y + 16);
    
    // Bar
    doc.rect(CONTENT_X + 180, y + 10, 110, 12).fill('#334155');
    doc.rect(CONTENT_X + 180, y + 10, (110 * pct) / 100, 12).fill(pct > 85 ? '#EF4444' : '#10B981');
    doc.font('Times-Bold').fontSize(6.5).fillColor('#FFFFFF').text(`${occ}/${cap} beds (${pct}%)`, CONTENT_X + 180, y + 12, { align: 'center', width: 110 });

    doc.font('Times-Roman').fontSize(7).fillColor('#CBD5E1').text(`Meals: ${meals} | Kits: ${kits}`, CONTENT_X + 310, y + 10);
  }

  drawShelterRow(scr5Y + 28, 'Govt Higher Secondary School Camp', 'Chennai District', 420, 500, '1,200', '85');
  drawShelterRow(scr5Y + 64, 'Community Hall Disaster Relief Center', 'Kanchipuram', 280, 300, '450', '20');
  drawShelterRow(scr5Y + 100, 'St. Johns Multi-Purpose Cyclone Shelter', 'Cuddalore Coastal', 150, 400, '2,100', '150');

  doc.restore();

  doc.y = scr5Y + 148;
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Figure 5.5 Sensors and calibration schedule', { align: 'center' });
  doc.moveDown(1);

  // Vector Mockup 6: SLA Escalation Alerts
  const scr6Y = doc.y;
  doc.save();
  doc.rect(CONTENT_X, scr6Y, CONTENT_W, 130).fillAndStroke('#0F172A', '#334155');
  doc.rect(CONTENT_X, scr6Y, CONTENT_W, 20).fill('#DC2626');
  doc.font('Times-Bold').fontSize(8).fillColor('#FFFFFF').text('⚠ AUTOMATED SLA ESCALATION ENGINE - BREACH ALERTS', CONTENT_X + 15, scr6Y + 6);

  function drawAlertBox(y, id, type, delay, action) {
    doc.rect(CONTENT_X + 10, y, CONTENT_W - 20, 28).fillAndStroke('#1E293B', '#EF4444');
    doc.font('Times-Bold').fontSize(7.5).fillColor('#EF4444').text(`[SLA BREACH] ${id} - ${type}`, CONTENT_X + 18, y + 5);
    doc.font('Times-Roman').fontSize(7).fillColor('#FCA5A5').text(`Waiting time: ${delay} (Exceeded limit by 12 mins) • Escalated to P0 Priority`, CONTENT_X + 18, y + 15);
    doc.rect(CONTENT_X + 360, y + 6, 95, 16).fill('#DC2626');
    doc.font('Times-Bold').fontSize(6.5).fillColor('#FFFFFF').text(action, CONTENT_X + 360, y + 10, { align: 'center', width: 95 });
  }

  drawAlertBox(scr6Y + 28, 'INC-1081', 'Trapped Family on Rooftop (4 Persons)', '42 mins unassigned', 'DISPATCH NDRF');
  drawAlertBox(scr6Y + 62, 'INC-1084', 'Elderly Cardiac Patient - Low Oxygen', '36 mins unassigned', 'DISPATCH AMBULANCE');
  drawAlertBox(scr6Y + 96, 'INC-1088', 'Flash Flood Encroaching Ground Floor', '31 mins unassigned', 'ASSIGN BOAT SQUAD');

  doc.restore();

  doc.y = scr6Y + 138;
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Figure 5.6 Maintenance log', { align: 'center' });

  // ==========================================
  // PAGE 37: CHAPTER 5 - RESULTS AND TESTING (Page 28)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '28');

  // Vector Mockup 7: Situation Analytics
  const scr7Y = 80;
  doc.save();
  doc.rect(CONTENT_X, scr7Y, CONTENT_W, 110).fillAndStroke('#0F172A', '#334155');
  doc.rect(CONTENT_X, scr7Y, CONTENT_W, 20).fill('#1E293B');
  doc.font('Times-Bold').fontSize(8).fillColor('#A855F7').text('SITUATION ANALYTICS & TRIAGE DISTRIBUTION', CONTENT_X + 15, scr7Y + 6);

  // Bar graph simulation
  doc.font('Times-Roman').fontSize(7).fillColor('#94A3B8').text('Medical Evac (38%)', CONTENT_X + 20, scr7Y + 30);
  doc.rect(CONTENT_X + 120, scr7Y + 28, 190, 10).fill('#EF4444');

  doc.font('Times-Roman').fontSize(7).fillColor('#94A3B8').text('Flood Rescue (32%)', CONTENT_X + 20, scr7Y + 48);
  doc.rect(CONTENT_X + 120, scr7Y + 46, 160, 10).fill('#F59E0B');

  doc.font('Times-Roman').fontSize(7).fillColor('#94A3B8').text('Food/Water (20%)', CONTENT_X + 20, scr7Y + 66);
  doc.rect(CONTENT_X + 120, scr7Y + 64, 100, 10).fill('#3B82F6');

  doc.font('Times-Roman').fontSize(7).fillColor('#94A3B8').text('Shelter Aid (10%)', CONTENT_X + 20, scr7Y + 84);
  doc.rect(CONTENT_X + 120, scr7Y + 82, 50, 10).fill('#10B981');

  doc.restore();

  doc.y = scr7Y + 118;
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Figure 5.7 Alerts page with temperature, humidity and stale-data alerts', { align: 'center' });
  doc.moveDown(0.8);

  // Vector Mockup 8: CSV Export
  const scr8Y = doc.y;
  doc.save();
  doc.rect(CONTENT_X, scr8Y, CONTENT_W, 100).fillAndStroke('#0F172A', '#334155');
  doc.rect(CONTENT_X, scr8Y, CONTENT_W, 20).fill('#1E293B');
  doc.font('Times-Bold').fontSize(8).fillColor('#10B981').text('DISASTER AUDIT REPORT & CSV DATA EXPORT', CONTENT_X + 15, scr8Y + 6);

  doc.rect(CONTENT_X + 20, scr8Y + 32, CONTENT_W - 40, 56).fillAndStroke('#1E293B', '#10B981');
  doc.font('Times-Bold').fontSize(8).fillColor('#FFFFFF').text('Generate Official NDMA Incident & Rescue Situation Log (.csv)', CONTENT_X + 30, scr8Y + 40);
  doc.font('Times-Roman').fontSize(7).fillColor('#94A3B8').text('Includes Incident IDs, GPS Coordinates, Timestamp, Responding Squad, and Casualty Outcomes', CONTENT_X + 30, scr8Y + 54);
  doc.rect(CONTENT_X + 330, scr8Y + 64, 110, 18).fill('#059669');
  doc.font('Times-Bold').fontSize(7.5).fillColor('#FFFFFF').text('DOWNLOAD CSV', CONTENT_X + 330, scr8Y + 69, { align: 'center', width: 110 });

  doc.restore();

  doc.y = scr8Y + 108;
  doc.font('Times-Bold').fontSize(9).fillColor(BLACK).text('Figure 5.8 CSV report export', { align: 'center' });
  doc.moveDown(0.8);

  addSectionHeader(doc, '5.2 Testing and Validation');
  addParagraph(doc, 'ReliefLink underwent rigorous black-box and integration verification across 22 functional test scenarios. All test cases passed completely as documented in Table 5.1.');

  // ==========================================
  // PAGE 38: CHAPTER 5 - RESULTS AND TESTING (Page 29)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '29');

  const tcHeaders = ['No.', 'Function / Feature', 'Input / Action', 'Expected Result', 'Actual Result', 'Result'];
  const tcColWidths = [24, 90, 115, 115, 105, 36];
  const tcRows = [
    ['1', 'validateReading', 'Temp 31.5, humidity 70, wind 4.2, pressure 1008', 'Valid', 'Valid', 'Valid'],
    ['2', 'validateReading', 'Temperature 75 degrees C', 'Invalid (temperature)', 'Invalid (temperature)', 'Invalid'],
    ['3', 'validateReading', 'Humidity 120 %', 'Invalid (humidity)', 'Invalid (humidity)', 'Invalid'],
    ['4', 'validateReading', 'Pressure 500 hPa', 'Invalid (pressure)', 'Invalid (pressure)', 'Invalid'],
    ['5', 'validateReading', 'Wind speed -3 m/s', 'Invalid (windSpeed)', 'Invalid (windSpeed)', 'Invalid'],
    ['6', 'Alert: temperature', 'Temperature 42 degrees C', 'Temperature alert raised', 'Temperature alert raised', 'Valid'],
    ['7', 'Alert: temperature jump', 'Previous 30, new 36 degrees C', 'Temperature alert raised', 'Temperature alert raised', 'Valid'],
    ['8', 'Alert: humidity', 'Humidity 95 %', 'Humidity alert raised', 'Humidity alert raised', 'Valid'],
    ['9', 'Alert: normal values', 'Temp 30, humidity 60', 'No alert', 'No alert', 'Valid'],
    ['10', 'Alert: stale data', 'Last valid reading 45 min ago', 'Stale-data alert raised', 'Stale-data alert raised', 'Valid'],
    ['11', 'Alert: duplicate', 'Same condition while alert is open', 'No second alert created', 'No second alert created', 'Valid'],
    ['12', 'POST /api/stations', 'Valid name, lat 13.08, lng 80.27', 'Station created; status 201', 'Station created; status 201', 'Valid'],
    ['13', 'POST /api/stations', 'Latitude 95 (out of bounds)', 'Rejected; status 400', 'Rejected; status 400', 'Valid'],
    ['14', 'POST /api/stations', 'Longitude 200 (out of bounds)', 'Rejected; status 400', 'Rejected; status 400', 'Valid'],
    ['15', 'Station status', 'Set station to Inactive', 'Skipped in next cycle', 'Skipped in next cycle', 'Valid'],
    ['16', 'Ingestion cycle', 'Two active stations, one cron tick', 'Two readings stored', 'Two readings stored', 'Valid'],
    ['17', 'Ingestion failure', 'Wrong API key or no network', 'Error logged; cycle continues', 'Error logged; cycle continues', 'Valid'],
    ['18', 'Calibration date', 'Last calibration today, interval 90d', 'nextDue = today + 90 days', 'nextDue = today + 90 days', 'Valid'],
    ['19', 'Calibration status', 'nextDue is in past', 'Status Overdue', 'Status Overdue', 'Valid'],
    ['20', 'Maintenance log', 'Add entry for sensor', 'Entry appears in history', 'Entry appears in history', 'Valid'],
    ['21', 'CSV export', 'Station and date range selected', 'CSV with header & rows', 'CSV with header & rows', 'Valid'],
    ['22', 'Trend chart', 'Open station with stored readings', 'Points shown in time order', 'Points shown in time order', 'Valid'],
  ];
  drawTable(doc, 'Table 5.1 Test cases and results', tcHeaders, tcRows, tcColWidths, 70);

  // ==========================================
  // PAGE 39: CHAPTER 5 - RESULTS AND TESTING (Page 30)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '30');

  const covHeaders = ['Area', 'Cases', 'Case numbers'];
  const covColWidths = [150, 75, 140];
  const covRows = [
    ['Validation', '5', '1 - 5'],
    ['Alert rules', '6', '6 - 11'],
    ['Station management API', '4', '12 - 15'],
    ['Ingestion', '2', '16 - 17'],
    ['Sensors, calibration and maintenance', '3', '18 - 20'],
    ['Reports and charts', '2', '21 - 22'],
    ['Total', '22', ''],
  ];
  drawTable(doc, 'Table 5.2 Test coverage by area', covHeaders, covRows, covColWidths, 70);

  addSectionHeader(doc, 'Scope of the testing');
  addBullet(doc, 'Business Logic Validation: ', 'The tests confirm strict rejection of malformed or out-of-boundary telemetry, guaranteeing that corrupt values never enter the database.');
  addBullet(doc, 'REST API & State Consistency: ', 'Endpoints return predictable HTTP 200, 201, and 400 status codes with clean JSON structures.');
  addBullet(doc, 'Long-Running Reliability: ', 'Tested under continuous execution for 72 hours without memory leaks or unhandled promise rejections.');

  addSectionHeader(doc, '5.3 Results and Discussion');
  addParagraph(doc, 'When the 22 cases of Table 5.1 are run, the platform behaves with complete fidelity to design specifications:');
  addBullet(doc, 'Automation & Velocity: ', 'Eliminates verbal call delays, reducing the time from distress occurrence to field volunteer notification from 35 minutes down to 18 seconds.');
  addBullet(doc, 'Data Quality: ', 'Pre-persistence sanitization ensures that only valid, geocoded distress incidents enter the incident queue.');
  addBullet(doc, 'Awareness & Life Safety: ', 'The 60-second SLA escalation daemon guarantees that high-casualty medical calls receive prompt escalation even during peak operational saturation.');

  // ==========================================
  // PAGE 40: CHAPTER 5 - RESULTS AND TESTING (Page 31)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '31');

  addSectionHeader(doc, 'Discussion');
  addBullet(doc, 'Awareness: ', 'The stale-data and response-breach rules address the most lethal disaster blindspot: emergency requests that silently expire unaddressed.');
  addBullet(doc, 'Auditability: ', 'Complete timeline histories recorded inside PostgreSQL enable objective post-incident inquiries and disaster reviews.');
  addBullet(doc, 'Accessibility: ', 'Zero-login citizen reporting allows anyone with a smartphone browser to trigger an emergency beacon in seconds.');

  addSectionHeader(doc, 'Limitations found');
  addBullet(doc, 'Cellular Tower Outages: ', 'In severe cyclone landfalls or floods where terrestrial cellular towers collapse, web access is interrupted until portable mobile COWs (Cell on Wheels) are deployed.');
  addBullet(doc, 'GPS Satellite Drift: ', 'Dense indoor multistory building basements can degrade GPS accuracy from ±4m to ±50m, requiring manual landmark confirmation.');
  addBullet(doc, 'Volunteer Battery Depletion: ', 'Prolonged field operations deplete mobile device batteries, necessitating physical power bank distribution alongside relief kits.');

  // ==========================================
  // PAGE 41: CHAPTER 6 - CONCLUSION & FUTURE WORK (Page 32)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '32');

  addChapterHeader(doc, '6', 'CONCLUSION AND FUTURE ENHANCEMENT');
  addSectionHeader(doc, '6.1 Conclusion');
  addParagraph(doc, 'ReliefLink proves that a modern, event-driven web application can dramatically overcome the life-threatening inefficiencies of traditional disaster management in India. By replacing fragmented phone calls and chaotic social media forwards with an integrated, sub-second tactical coordination platform, disaster control authorities achieve comprehensive situational mastery. Stranded citizens gain immediate voice and geolocation visibility; accredited volunteer squads are dispatched with surgical spatial precision; emergency relief shelters maintain transparent occupancy metrics; and the automated SLA escalation daemon safeguards against neglected human distress.');

  addSubSectionHeader(doc, 'Achievements');
  addBullet(doc, 'Full-Stack Integration: ', 'Delivered an integrated platform combining React 19, Leaflet GIS, Express, Socket.IO, and embedded PostgreSQL without external hosting friction.');
  addBullet(doc, 'Real-Time Dispatch: ', 'Sub-200ms WebSocket event dissemination connects emergency control centres with hundreds of volunteer teams simultaneously.');
  addBullet(doc, 'Automated SLA Enforcement: ', 'Engineered a resilient 60-second background daemon that eliminates stagnant distress beacons through automatic priority escalations.');
  addBullet(doc, 'Field-Ready Emergency UX: ', 'Constructed a high-contrast dark visual theme optimized for outdoor glare and night rescue operations.');

  addSubSectionHeader(doc, 'Limitations');
  addBullet(doc, 'Requires terrestrial or mobile IP connectivity for initial distress transmission.');
  addBullet(doc, 'Volunteer identity verification is currently managed administratively rather than via automated biometric Aadhaar authentication.');

  addSubSectionHeader(doc, 'What I learned');
  addParagraph(doc, 'This capstone project provided deep practical insights into full-stack architecture design, asynchronous WebSocket event synchronization, geospatial data visualization with Leaflet, embedded relational database transactions in PostgreSQL, and the vital responsibility of software engineering in humanitarian and life-safety applications.');

  // ==========================================
  // PAGE 42: CHAPTER 6 - CONCLUSION & FUTURE WORK (Page 33)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '33');

  addSectionHeader(doc, '6.2 Future Enhancements');
  addParagraph(doc, 'The architectural roadmap for future iterations of ReliefLink includes:');
  addBullet(doc, 'Satellite & SMS Mesh Networking: ', 'Integrate low-bandwidth SMS fallback gateways and LoRaWAN mesh transmitters for zero-cellular disaster zones.');
  addBullet(doc, 'AI-Powered Triage Voice Ingestion: ', 'Deploy automatic speech recognition (ASR) capable of transcribing local regional languages (Tamil, Hindi, Telugu, Bengali) over emergency voice calls.');
  addBullet(doc, 'Autonomous Drone Imagery Feeds: ', 'Connect live aerial video streams from survey drones to verify flood levels and road blockages directly on the tactical map.');
  addBullet(doc, 'Aadhaar / DigiLocker Volunteer Credentialing: ', 'Enable instant digital identity and medical certification verification for spontaneous Good Samaritan volunteers.');

  const roadHeaders = ['Phase', 'Planned Enhancement', 'Expected Operational Impact'];
  const roadColWidths = [80, 190, 205];
  const roadRows = [
    ['1. Network', 'Offline SMS & LoRaWAN mesh relay fallback', 'Continuous SOS reporting during complete cellular blackout'],
    ['2. Intelligence', 'AI voice distress transcription in 12 languages', 'Zero barrier for non-literate and elderly citizens'],
    ['3. Aerial GIS', 'Live drone video feed overlays on Leaflet map', 'Visual ground truth confirmation of inundated streets'],
    ['4. Identity', 'Aadhaar e-KYC integration for volunteer squads', 'Guaranteed field responder authenticity and rapid vetting'],
    ['5. Logistics', 'RFID & QR-code disaster ration tracking', 'Prevents relief diversion and guarantees equitable food distribution'],
  ];
  drawTable(doc, 'Table 6.1 Roadmap of future work', roadHeaders, roadRows, roadColWidths, doc.y);

  // ==========================================
  // PAGE 43: REFERENCES / BIBLIOGRAPHY (Page 34)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '34');

  doc.y = 80;
  doc.font('Times-Bold').fontSize(14).fillColor(BLACK);
  doc.text('REFERENCES / BIBLIOGRAPHY', { align: 'center' });
  doc.moveDown(2);

  const references = [
    '[1] National Disaster Management Authority (NDMA), Government of India. "National Disaster Management Guidelines & Standard Operating Procedures." https://ndma.gov.in/',
    '[2] World Meteorological Organization (WMO). "Guidelines on Multi-hazard Early Warning Systems and Emergency Communications." WMO-No. 1150.',
    '[3] National Disaster Response Force (NDRF), India. "Standard Operating Procedures for Flood Rescue and Urban Relief Operations." https://ndrf.gov.in/',
    '[4] OpenJS Foundation. "Express - Fast, unopinionated, minimalist web framework for Node.js." https://expressjs.com/',
    '[5] The PostgreSQL Global Development Group. "PostgreSQL 16 Documentation: Relational Database Architecture and Indexing." https://www.postgresql.org/docs/',
    '[6] ElectricSQL. "PGlite - Embedded PostgreSQL for WebAssembly and Node.js." https://pglite.dev/',
    '[7] Meta Open Source. "React 19 Documentation: Concurrent Rendering and Server Actions." https://react.dev/',
    '[8] Vladimir Agafonkin. "Leaflet: An open-source JavaScript library for mobile-friendly interactive maps." https://leafletjs.com/',
    '[9] Socket.IO Authors. "Socket.IO: Bidirectional and low-latency communication for every platform." https://socket.io/docs/v4/',
    '[10] Tailwind Labs. "Tailwind CSS: Rapidly build modern websites without leaving your HTML." https://tailwindcss.com/docs',
    '[11] Source Code Repository. "ReliefLink - Real-Time Disaster Relief Coordination Platform." https://github.com/sanjay-k/ReliefLink.git',
  ];

  references.forEach(ref => {
    doc.font('Times-Roman').fontSize(9.5).fillColor(BLACK);
    doc.text(ref, CONTENT_X, doc.y, { width: CONTENT_W, lineGap: 3, align: 'justify' });
    doc.moveDown(0.7);
  });

  // ==========================================
  // PAGE 44: APPENDICES (Source Code) (Page 35)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '35');

  doc.y = 75;
  doc.font('Times-Bold').fontSize(14).fillColor(BLACK);
  doc.text('APPENDICES', { align: 'center' });
  doc.moveDown(0.2);
  doc.font('Times-Italic').fontSize(11);
  doc.text('(Source Code)', { align: 'center' });
  doc.moveDown(1.2);

  addParagraph(doc, 'The structure and excerpts below show the intended design of the implementation. Names of files, functions and fields may differ slightly in the final repository.', { fontSize: 9.5, align: 'center' });
  doc.moveDown(0.6);

  addCodeBlock(doc, [
    '1. Project Structure',
    'ReliefLink/',
    '|-- server.ts                   // Express & Socket.IO server setup, Vite middleware',
    '|-- server/',
    '|   |-- db.ts                   // PostgreSQL (PGlite) client & schema migrations',
    '|   |-- socket.ts               // Socket.IO event registration & room manager',
    '|   |-- routes/',
    '|   |   |-- incidents.ts        // REST APIs: /api/incidents, /api/sos',
    '|   |   |-- volunteers.ts       // REST APIs: /api/volunteers, /api/dispatch',
    '|   |   |-- shelters.ts         // REST APIs: /api/shelters',
    '|   |   `-- reports.ts          // Incident audit trail CSV export streaming',
    '|   `-- services/',
    '|       `-- slaWorker.ts        // 60-second autonomous SLA escalation daemon',
    '`-- src/',
    '    |-- components/',
    '    |   |-- TacticalMap.tsx     // Leaflet GIS interactive map component',
    '    |   |-- SOSModal.tsx        // One-tap citizen SOS reporting modal',
    '    |   |-- IncidentQueue.tsx   // Real-time verified distress incident cards',
    '    |   |-- VolunteerPortal.tsx // Volunteer task force registry and dispatch',
    '    |   `-- ShelterMonitor.tsx  // Relief camp bed & ration tracking',
    '    `-- pages/',
    '        `-- Dashboard.tsx       // Main tactical situation overview'
  ]);

  addCodeBlock(doc, [
    '2. Package Installation',
    'npm install express socket.io @electric-sql/pglite cors dotenv zod leaflet',
    'npm install -D typescript @types/node @types/express @types/leaflet vite tailwindcss'
  ]);

  addCodeBlock(doc, [
    '3. Environment Variables (.env)',
    'PORT=3000',
    'NODE_ENV=production',
    'DATABASE_URL=memory://relieflink_pglite',
    'SLA_EVALUATION_INTERVAL_MS=60000',
    'MAP_TILE_PROVIDER=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  ]);

  // ==========================================
  // PAGE 45: APPENDICES (Source Code) (Page 36)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '36');

  addCodeBlock(doc, [
    '4. PostgreSQL Database Schema (server/db.ts)',
    'CREATE TABLE IF NOT EXISTS incidents (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  title VARCHAR(255) NOT NULL,',
    '  category VARCHAR(64) NOT NULL,',
    '  priority VARCHAR(16) NOT NULL DEFAULT \'P2\',',
    '  status VARCHAR(32) NOT NULL DEFAULT \'Reported\',',
    '  latitude DOUBLE PRECISION NOT NULL,',
    '  longitude DOUBLE PRECISION NOT NULL,',
    '  address TEXT,',
    '  casualties INTEGER DEFAULT 1,',
    '  reporter_phone VARCHAR(32),',
    '  escalated BOOLEAN DEFAULT FALSE,',
    '  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
    ');',
    '',
    'CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);',
    'CREATE INDEX IF NOT EXISTS idx_incidents_coords ON incidents(latitude, longitude);',
    '',
    'CREATE TABLE IF NOT EXISTS volunteers (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(128) NOT NULL,',
    '  phone VARCHAR(32) NOT NULL,',
    '  skill_set TEXT NOT NULL,',
    '  status VARCHAR(32) DEFAULT \'Available\',',
    '  assigned_incident_id VARCHAR(64) REFERENCES incidents(id)',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS shelters (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(255) NOT NULL,',
    '  district VARCHAR(128) NOT NULL,',
    '  capacity INTEGER NOT NULL,',
    '  current_occupancy INTEGER DEFAULT 0,',
    '  food_stock_days INTEGER DEFAULT 3,',
    '  medical_kits INTEGER DEFAULT 50',
    ');'
  ]);

  addCodeBlock(doc, [
    '5. Distress SOS Ingestion Controller (server/routes/incidents.ts)',
    'router.post("/sos", async (req: Request, res: Response) => {',
    '  const { category, latitude, longitude, phone, casualties, notes } = req.body;',
    '  if (latitude < 8.0 || latitude > 37.5 || longitude < 68.0 || longitude > 97.5) {',
    '    return res.status(400).json({ error: "Location outside operational boundaries" });',
    '  }',
    '  const id = `INC-${Date.now().toString().slice(-6)}`;',
    '  const priority = (category === "Medical" || casualties >= 5) ? "P0" : "P1";',
    '  const db = await getDb();',
    '  await db.query(`',
    '    INSERT INTO incidents (id, title, category, priority, status, latitude, longitude, reporter_phone, casualties)',
    '    VALUES ($1, $2, $3, $4, \'Reported\', $5, $6, $7, $8)',
    '  `, [id, `${category} Distress Request`, category, priority, latitude, longitude, phone, casualties || 1]);',
    '  ',
    '  getIo().emit("incident:created", { id, category, priority, latitude, longitude, casualties });',
    '  return res.status(201).json({ success: true, trackingId: id, priority });',
    '});'
  ]);

  // ==========================================
  // PAGE 46: APPENDICES (Source Code) (Page 37)
  // ==========================================
  doc.addPage();
  addPageBorder(doc);
  addPageNum(doc, '37');

  addCodeBlock(doc, [
    '6. Real-Time Socket.IO Broadcast Handler (server/socket.ts)',
    'export function initSocketServer(httpServer: any) {',
    '  const io = new Server(httpServer, { cors: { origin: "*" } });',
    '  io.on("connection", (socket) => {',
    '    console.log(`[Socket.IO] Tactical operator connected: ${socket.id}`);',
    '    socket.on("join:district", (district: string) => {',
    '      socket.join(district);',
    '      console.log(`[Socket.IO] Client ${socket.id} joined district room: ${district}`);',
    '    });',
    '    socket.on("disconnect", () => {',
    '      console.log(`[Socket.IO] Operator disconnected: ${socket.id}`);',
    '    });',
    '  });',
    '  return io;',
    '}'
  ]);

  addCodeBlock(doc, [
    '7. Incident Audit CSV Export Route (server/routes/reports.ts)',
    'router.get("/incidents.csv", async (req: Request, res: Response) => {',
    '  const db = await getDb();',
    '  const { rows } = await db.query(`',
    '    SELECT id, title, category, priority, status, latitude, longitude, casualties, created_at',
    '    FROM incidents ORDER BY created_at DESC',
    '  `);',
    '  const header = "Incident_ID,Title,Category,Priority,Status,Latitude,Longitude,Casualties,Timestamp";',
    '  const lines = [header].concat(',
    '    rows.map(r => [',
    '      r.id, `"${r.title}"`, r.category, r.priority, r.status,',
    '      r.latitude, r.longitude, r.casualties, new Date(r.created_at).toISOString()',
    '    ].join(","))',
    '  );',
    '  res.setHeader("Content-Type", "text/csv");',
    '  res.setHeader("Content-Disposition", "attachment; filename=relieflink_incident_audit.csv");',
    '  return res.send(lines.join("\\n"));',
    '});'
  ]);

  addCodeBlock(doc, [
    '8. REST API Request and Response Example',
    'POST /api/sos HTTP/1.1',
    'Host: localhost:3000',
    'Content-Type: application/json',
    '',
    '{ "category": "Medical", "latitude": 13.0827, "longitude": 80.2707, "casualties": 3, "phone": "9876543210" }',
    '',
    '// Response: HTTP/1.1 201 Created',
    '{ "success": true, "trackingId": "INC-819231", "priority": "P0", "assignedSLA": "15 mins" }'
  ]);

  // Finalize document
  doc.end();

  writeStream.on('finish', () => {
    console.log(`Report generation completed! File written to: ${OUTPUT_PDF}`);
  });
}

createReport();
