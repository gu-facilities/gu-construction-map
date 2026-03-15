// ============================================================
//  Georgetown Facilities Construction Map — Google Apps Script
//  Paste this entire file into your Apps Script project.
//  Deploy as a Web App: Execute as "Me", Access "Anyone".
// ============================================================

const SHEET_NAME = 'Projects';

// Column order in the sheet
const COLS = {
  ID:          1,
  NAME:        2,
  TYPE:        3,
  PHASE:       4,
  START:       5,
  END:         6,
  DESC:        7,
  SHAPES:      8,   // JSON string
  STAGING_YN:  9,
  ROAD_YN:     10,
  CREATED_AT:  11,
  UPDATED_AT:  12,
};

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Write header row
    sheet.getRange(1, 1, 1, Object.keys(COLS).length).setValues([[
      'ID','Name','Type','Phase','Start','End','Description',
      'Shapes (JSON)','Staging Area?','Road Closure?','Created At','Updated At'
    ]]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, Object.keys(COLS).length)
      .setBackground('#041E42').setFontColor('#C9A96E').setFontWeight('bold');
  }
  return sheet;
}

function generateId() {
  return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ── CORS helper ────────────────────────────────────────────
function cors(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── GET: return all projects ───────────────────────────────
function doGet(e) {
  try {
    const sheet = getSheet();
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return cors(ContentService.createTextOutput(JSON.stringify({ projects: [] })));
    }
    const projects = data.slice(1).map(row => ({
      id:         row[COLS.ID - 1],
      name:       row[COLS.NAME - 1],
      type:       row[COLS.TYPE - 1],
      phase:      row[COLS.PHASE - 1],
      start:      row[COLS.START - 1],
      end:        row[COLS.END - 1],
      desc:       row[COLS.DESC - 1],
      shapes:     safeParseJSON(row[COLS.SHAPES - 1], []),
      stagingYN:  row[COLS.STAGING_YN - 1] === 'yes',
      roadYN:     row[COLS.ROAD_YN - 1] === 'yes',
      createdAt:  row[COLS.CREATED_AT - 1],
      updatedAt:  row[COLS.UPDATED_AT - 1],
    })).filter(p => p.id);  // skip blank rows
    return cors(ContentService.createTextOutput(JSON.stringify({ projects })));
  } catch(err) {
    return cors(ContentService.createTextOutput(JSON.stringify({ error: err.message })));
  }
}

// ── POST: create, update or delete ────────────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;  // 'create' | 'update' | 'delete'

    if (action === 'create')  return cors(ContentService.createTextOutput(JSON.stringify(createProject(body.project))));
    if (action === 'update')  return cors(ContentService.createTextOutput(JSON.stringify(updateProject(body.project))));
    if (action === 'delete')  return cors(ContentService.createTextOutput(JSON.stringify(deleteProject(body.id))));
    return cors(ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action: ' + action })));
  } catch(err) {
    return cors(ContentService.createTextOutput(JSON.stringify({ error: err.message })));
  }
}

function createProject(p) {
  const sheet = getSheet();
  const id    = generateId();
  const now   = new Date().toISOString();
  sheet.appendRow([
    id,
    p.name        || '',
    p.type        || '',
    p.phase       || '',
    p.start       || '',
    p.end         || '',
    p.desc        || '',
    JSON.stringify(p.shapes || []),
    p.stagingYN   ? 'yes' : 'no',
    p.roadYN      ? 'yes' : 'no',
    now, now
  ]);
  return { success: true, id };
}

function updateProject(p) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][COLS.ID - 1] === p.id) {
      const now = new Date().toISOString();
      sheet.getRange(i + 1, COLS.NAME,       1, 1).setValue(p.name   || '');
      sheet.getRange(i + 1, COLS.TYPE,       1, 1).setValue(p.type   || '');
      sheet.getRange(i + 1, COLS.PHASE,      1, 1).setValue(p.phase  || '');
      sheet.getRange(i + 1, COLS.START,      1, 1).setValue(p.start  || '');
      sheet.getRange(i + 1, COLS.END,        1, 1).setValue(p.end    || '');
      sheet.getRange(i + 1, COLS.DESC,       1, 1).setValue(p.desc   || '');
      sheet.getRange(i + 1, COLS.SHAPES,     1, 1).setValue(JSON.stringify(p.shapes || []));
      sheet.getRange(i + 1, COLS.STAGING_YN, 1, 1).setValue(p.stagingYN ? 'yes' : 'no');
      sheet.getRange(i + 1, COLS.ROAD_YN,    1, 1).setValue(p.roadYN    ? 'yes' : 'no');
      sheet.getRange(i + 1, COLS.UPDATED_AT, 1, 1).setValue(now);
      return { success: true };
    }
  }
  return { success: false, error: 'Project not found: ' + p.id };
}

function deleteProject(id) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][COLS.ID - 1] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Project not found: ' + id };
}

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch(e) { return fallback; }
}
