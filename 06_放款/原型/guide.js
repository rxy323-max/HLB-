const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat
} = require('docx');
const fs = require('fs');

const INK = '1F2430', MUTED = '6B7280', ACCENT = '1677FF', LINE = 'D9D9D9';

const p = (text, o = {}) => new Paragraph({
  spacing: { before: o.before ?? 0, after: o.after ?? 120, line: 276 },
  alignment: o.align,
  indent: o.indent,
  border: o.border,
  children: [new TextRun({
    text, bold: o.bold, italics: o.italics, color: o.color || INK,
    size: o.size || 21, font: 'Calibri'
  })]
});

// a paragraph made of several differently-styled runs
const rich = (runs, o = {}) => new Paragraph({
  spacing: { before: o.before ?? 0, after: o.after ?? 120, line: 276 },
  indent: o.indent,
  children: runs.map(r => new TextRun({
    text: r.t, bold: r.b, italics: r.i, color: r.c || INK,
    size: r.s || 21, font: r.mono ? 'Consolas' : 'Calibri'
  }))
});

const h1 = t => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 160 },
  children: [new TextRun({ text: t, bold: true, size: 28, color: INK, font: 'Calibri' })]
});

const h2 = t => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 260, after: 110 },
  children: [new TextRun({ text: t, bold: true, size: 23, color: ACCENT, font: 'Calibri' })]
});

const bullet = (text, lvl = 0) => new Paragraph({
  numbering: { reference: 'dot', level: lvl },
  spacing: { after: 90, line: 276 },
  children: [new TextRun({ text, size: 21, color: INK, font: 'Calibri' })]
});

const step = (text, lvl = 0) => new Paragraph({
  numbering: { reference: 'num', level: lvl },
  spacing: { after: 90, line: 276 },
  children: [new TextRun({ text, size: 21, color: INK, font: 'Calibri' })]
});

// steps that mix plain text with on-screen labels in a distinct face
const stepRich = runs => new Paragraph({
  numbering: { reference: 'num', level: 0 },
  spacing: { after: 90, line: 276 },
  children: runs.map(r => new TextRun({
    text: r.t, bold: r.b, color: r.c || INK, size: r.s || 21,
    font: r.ui ? 'Consolas' : 'Calibri'
  }))
});

const rule = () => new Paragraph({
  spacing: { before: 60, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } },
  children: [new TextRun({ text: '', size: 2 })]
});

const W = [2600, 6400];
const kv = rows => new Table({
  columnWidths: W,
  width: { size: W[0] + W[1], type: WidthType.DXA },
  rows: rows.map(([k, v], i) => new TableRow({
    children: [
      new TableCell({
        width: { size: W[0], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: i === 0 ? 'F0F4FA' : 'FAFBFC' },
        margins: { top: 90, bottom: 90, left: 130, right: 130 },
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, color: INK, font: 'Calibri' })] })]
      }),
      new TableCell({
        width: { size: W[1], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: i === 0 ? 'F0F4FA' : 'FFFFFF' },
        margins: { top: 90, bottom: 90, left: 130, right: 130 },
        children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, color: INK, font: 'Calibri' })] })]
      })
    ]
  }))
});

const doc = new Document({
  numbering: {
    config: [
      { reference: 'dot', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 400, hanging: 220 } } } }] },
      { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 400, hanging: 260 } } } }] }
    ]
  },
  styles: { default: { document: { run: { font: 'Calibri', size: 21, color: INK } } } },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } },
    children: [
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: 'HLB LOAD$  ·  Disbursement (Batch 3)', size: 18, color: MUTED, font: 'Calibri' })]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: 'Prototype Walkthrough', bold: true, size: 40, color: INK, font: 'Calibri' })]
      }),
      p('A short guide to what the prototype covers and how to move through it. It describes the paths, not the rules — the functional specification remains the reference for detail.',
        { color: MUTED, size: 21, after: 200 }),
      rule(),

      h1('Before you start'),
      kv([
        ['Item', 'Detail'],
        ['File', 'HLB_放款原型_合并版.html — one file, nothing to install'],
        ['To open', 'Double-click it. Chrome or Edge is recommended.'],
        ['Network', 'Not required. It runs entirely in the browser.'],
        ['Build', 'Shown at the top right of the screen, e.g. Prototype build 2026-08-30']
      ]),
      p('', { after: 140 }),
      bullet('Everything you see is sample data. Nothing is saved and nothing is sent anywhere.'),
      bullet('Refreshing the page resets it to the starting state, so you can explore freely.'),
      bullet('The dark strip along the top is a demo toolbar. It lets you switch role and scenario so one file can show several situations. It is not part of the product.'),

      h1('What is in it'),
      p('Two screens, connected the way they will be in the product:', { after: 140 }),
      rich([
        { t: 'CRA Workbench', b: true },
        { t: '  —  where CRA reviews the case summary, works the defect list, maintains disbursement information, and submits the case.' }
      ], { after: 100 }),
      rich([
        { t: 'Document Center', b: true },
        { t: '  —  where documents are uploaded and classified, and where expert rules are checked against them.' }
      ], { after: 160 }),

      h2('Moving between the two'),
      p('The workbench opens the Document Center from three places, all of which lead to the same screen:', { after: 110 }),
      bullet('Attachment — in the top bar'),
      bullet('Attachment — in the Navigation card on the left'),
      bullet('Open File Center — in the Verification Summary module'),
      p('To come back, use the ✕ at the top right or Back To List at the bottom. The switch in the demo toolbar also jumps between the two at any time.',
        { after: 140 }),

      h1('The main paths'),
      p('Four walkthroughs. Each takes a couple of minutes and they follow the order of the real process.',
        { color: MUTED, after: 180 }),

      h2('Path 1  ·  Sales uploads the documents'),
      p('Document Center, with the role set to Sales.', { color: MUTED, size: 19, after: 130 }),
      stepRich([{ t: 'Choose who the documents belong to on the left — ' },
                { t: 'Main Applicant', ui: true }, { t: ', ' }, { t: 'Guarantor 1', ui: true }, { t: ' or ' }, { t: 'Seller', ui: true }, { t: '.' }]),
      stepRich([{ t: 'The upload entries appear above the list, one per document category — for the main applicant, ' },
                { t: 'Personal Identity', ui: true }, { t: ', ' }, { t: 'Applicant Income', ui: true },
                { t: ' and ' }, { t: 'Other Application & Vehicle', ui: true },
                { t: '. Each is read and classified automatically. Which categories appear depends on who the documents belong to and on the stage — a guarantor has identity and income only, and in Disbursement the CRA set is shown instead.' }]),
      stepRich([{ t: 'Anything the categories do not cover goes to the strip below them, ' },
                { t: 'Non-AI Scanning / Other Files', ui: true },
                { t: '. It is stored as-is and checked by hand.' }]),
      stepRich([{ t: 'Not sure which entry a document belongs to? Click ' },
                { t: 'Which entry does a document go to?', ui: true },
                { t: ' beside the heading and search for it. The list says which entry each type goes to.' }]),
      stepRich([{ t: 'The ' }, { t: 'File List', ui: true },
                { t: ' below shows everything uploaded, with its classification and status.' }]),
      stepRich([{ t: 'When the documents are complete, click ' }, { t: 'Submit for Verification', ui: true },
                { t: ' at the bottom right to trigger rule validation.' }]),

      h2('Path 2  ·  CRA checks the expert rules'),
      p('Document Center, with the role set to CRA. Pick a subject on the left to reveal the two rule tabs.',
        { color: MUTED, size: 19, after: 130 }),
      stepRich([{ t: 'Cross-Validation Results', ui: true },
                { t: ' holds the rules the engine concluded on its own. Open a document to review an alert and settle it.' }]),
      stepRich([{ t: 'Manual Check Results', ui: true },
                { t: ' holds documents OCR cannot read. The rules for the whole case sit on the left, the document image on the right; mark each rule ' },
                { t: 'Pass', ui: true }, { t: ' or ' }, { t: 'Fail', ui: true }, { t: ' against what you see.' }]),
      stepRich([{ t: 'The bar at the bottom always shows both tracks — for example ' },
                { t: 'OCR 13/19', ui: true }, { t: ' and ' }, { t: 'Manual 0/6', ui: true },
                { t: ' — no matter which tab you are on. The two together decide whether the case is complete.' }]),
      stepRich([{ t: 'Revalidate', ui: true },
                { t: ' reruns the engine across every document in the case. Manual marking stays available while it runs.' }]),
      stepRich([{ t: 'Submit Rule Results', ui: true },
                { t: ' submits both tracks at once. If rules are still open it says how many and lets you continue anyway — your work so far is kept.' }]),

      h2('Path 3  ·  CRA works the case'),
      p('CRA Workbench.', { color: MUTED, size: 19, after: 130 }),
      stepRich([{ t: 'Verification Summary', ui: true },
                { t: ' shows how many rules the case has, how many are concluded, and how many did not pass.' }]),
      stepRich([{ t: 'View detail', ui: true }, { t: ' lists the rules that did not pass. For each one you can ' },
                { t: 'Create Defect', ui: true }, { t: ', or ' }, { t: 'Handle rule', ui: true },
                { t: ' to settle it — amend the extracted value, apply a justification, or replace the document.' }]),
      stepRich([{ t: 'Defect List', ui: true }, { t: ' is where defects are closed: ' },
                { t: 'Rectify', ui: true }, { t: ', then ' }, { t: 'Verify', ui: true },
                { t: '. Once a rule has been settled, ' }, { t: 'Sync System Defects', ui: true },
                { t: ' clears the defect it raised. Defects you added by hand are never touched.' }]),
      stepRich([{ t: 'Sync from OCR', ui: true },
                { t: ' in the top bar pulls the latest extracted values in for comparison, so you can choose which to apply.' }]),

      h2('Path 4  ·  Submit and route'),
      p('CRA Workbench. This is where the case is decided.', { color: MUTED, size: 19, after: 130 }),
      stepRich([{ t: 'Tick ' }, { t: 'CRA Completed', ui: true },
                { t: ' in the panel on the right. This is the only thing that enables the ' },
                { t: 'Next', ui: true }, { t: ' button — outstanding rules and defects do not block submission.' }]),
      stepRich([{ t: 'Click ' }, { t: 'Next', ui: true },
                { t: '. The system runs a pre-submit check, saves, assesses STP eligibility, then routes the case.' }]),
      step('There are three outcomes. Straight-through to disbursement; routed to the Authorizer; or, if the case was never an STP scenario, sent to Disbursement Information Maintenance for manual handling.'),
      stepRich([{ t: 'Use ' }, { t: 'Scenario', ui: true }, { t: ' and the ' }, { t: 'STP switch', ui: true },
                { t: ' in the demo toolbar to see each outcome without rebuilding the case.' }]),

      h1('Worth knowing'),
      bullet('The demo toolbar, including the role and scenario switches, exists only so one file can show several situations. It will not be in the product.'),
      bullet('Figures, names and document lists are illustrative. They are there to make the screens readable, not to be checked for accuracy.'),
      bullet('A few areas are shown as headings without content. Those are existing screens that this change does not touch.'),
      bullet('When sending feedback, please quote the build date shown at the top right so we know which version you were looking at.'),

      rule(),
      p('Questions or comments on the prototype are welcome at any point — the paths above are the ones we would most like reactions to.',
        { color: MUTED, size: 19, after: 0 })
    ]
  }]
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync(process.argv[2] || 'guide.docx', b);
  console.log('written', (process.argv[2] || 'guide.docx'), b.length, 'bytes');
});
