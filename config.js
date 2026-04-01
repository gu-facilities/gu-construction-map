// ============================================================
//  Georgetown Facilities Construction Map — Google Apps Script
//  Replace ALL existing code with this, then redeploy.
// ============================================================

const SHEET_NAME = 'Projects';

const HEADERS = [
  'ID','Name','Project Manager','Campus',
  'Project Type','Charter Status','Project Category','Current Phase',
  'Start','End','Description',
  'Shapes (JSON)','Staging Area?','Road Closure?',
  'Phase Schedule (JSON)','Created At','Updated At'
];

const C = {};
HEADERS.forEach(function(h,i){ C[h] = i+1; });

// ── VALIDATION LISTS ─────────────────────────────────────────────────
const VALID = {
  'Campus':           ['Hilltop','Capitol'],
  'Project Type':     ['Charter','Procurement'],
  'Charter Status':   ['Approved','Tentative','Not Approved',''],
  'Project Category': ['Capital Projects','Deferred Maintenance','Utilities/Energy','Landscape'],
  'Current Phase':    ['Programming','Design Procurement','Design','Construction Procurement','Construction','In Closeout','On Hold'],
  'Staging Area?':    ['yes','no'],
  'Road Closure?':    ['yes','no']
};

// ── PHASE COLORS for conditional formatting ──────────────────────────
const PHASE_COLORS = {
  'Programming':               {bg:'#6A5ACD', fg:'#ffffff'},
  'Design Procurement':        {bg:'#4682B4', fg:'#ffffff'},
  'Design':                    {bg:'#D4A800', fg:'#ffffff'},
  'Construction Procurement':  {bg:'#BA7517', fg:'#ffffff'},
  'Construction':              {bg:'#D85A30', fg:'#ffffff'},
  'In Closeout':               {bg:'#639922', fg:'#ffffff'},
  'On Hold':                   {bg:'#8a96a3', fg:'#ffffff'}
};

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    setupSheet(sheet);
  }
  return sheet;
}

function setupSheet(sheet) {
  if (!sheet) sheet = getSheet();
  var lastCol = HEADERS.length;

  // ── Header styling ───────────────────────────────────────────────
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange
    .setBackground('#041E42')
    .setFontColor('#C9A96E')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 32);

  // ── Column widths ────────────────────────────────────────────────
  var widths = {
    'ID': 80, 'Name': 220, 'Project Manager': 150, 'Campus': 90,
    'Project Type': 100, 'Charter Status': 110, 'Project Category': 140,
    'Current Phase': 160, 'Start': 100, 'End': 100, 'Description': 260,
    'Shapes (JSON)': 60, 'Staging Area?': 90, 'Road Closure?': 90,
    'Phase Schedule (JSON)': 60, 'Created At': 140, 'Updated At': 140
  };
  HEADERS.forEach(function(h, i) {
    if (widths[h]) sheet.setColumnWidth(i+1, widths[h]);
  });

  // ── Auto filter ──────────────────────────────────────────────────
  sheet.getRange(1, 1, 1, lastCol).createFilter();

  // ── Freeze columns (ID + Name) ───────────────────────────────────
  sheet.setFrozenColumns(2);

  // ── Data validation dropdowns ────────────────────────────────────
  var maxRows = 1000;
  Object.keys(VALID).forEach(function(colName) {
    var colIdx = C[colName];
    if (!colIdx) return;
    var values = VALID[colName].filter(function(v){ return v !== ''; });
    if (!values.length) return;
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, colIdx, maxRows, 1).setDataValidation(rule);
  });

  // ── Color-code header groups ─────────────────────────────────────
  // Project identity: navy
  sheet.getRange(1, C['ID'], 1, 4)
    .setBackground('#041E42').setFontColor('#C9A96E');
  // Project classification: slate blue
  sheet.getRange(1, C['Project Type'], 1, 4)
    .setBackground('#1e3a5f').setFontColor('#a8c8f0');
  // Timeline: dark teal
  sheet.getRange(1, C['Start'], 1, 2)
    .setBackground('#0d3d3d').setFontColor('#7ecece');
  // Description: charcoal
  sheet.getRange(1, C['Description'], 1, 1)
    .setBackground('#2d2d2d').setFontColor('#cccccc');
  // Technical/JSON: dark gray (hidden columns suggestion)
  sheet.getRange(1, C['Shapes (JSON)'], 1, 1)
    .setBackground('#3a3a3a').setFontColor('#888888');
  sheet.getRange(1, C['Phase Schedule (JSON)'], 1, 1)
    .setBackground('#3a3a3a').setFontColor('#888888');
  // Flags
  sheet.getRange(1, C['Staging Area?'], 1, 2)
    .setBackground('#2d4a1e').setFontColor('#8fcf6a');
  // Timestamps
  sheet.getRange(1, C['Created At'], 1, 2)
    .setBackground('#1a1a2e').setFontColor('#8888cc');

  // ── Conditional formatting on Current Phase ───────────────────────
  var phaseCol = C['Current Phase'];
  var phaseRange = sheet.getRange(2, phaseCol, maxRows, 1);
  // Clear existing rules
  var rules = sheet.getConditionalFormatRules();
  var newRules = rules.filter(function(r){
    var ranges = r.getRanges();
    return !ranges.some(function(rng){
      return rng.getColumn()===phaseCol;
    });
  });
  Object.keys(PHASE_COLORS).forEach(function(phase) {
    var colors = PHASE_COLORS[phase];
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(phase)
      .setBackground(colors.bg)
      .setFontColor(colors.fg)
      .setRanges([phaseRange])
      .build();
    newRules.push(rule);
  });
  sheet.setConditionalFormatRules(newRules);

  // ── Column grouping (hide JSON columns by default) ────────────────
  try {
    sheet.hideColumns(C['Shapes (JSON)']);
    sheet.hideColumns(C['Phase Schedule (JSON)']);
  } catch(e) {}

  SpreadsheetApp.flush();
}

function syncColumns() {
  var sheet = getSheet();
  var lastCol = sheet.getLastColumn();
  var existing = lastCol > 0
    ? sheet.getRange(1,1,1,lastCol).getValues()[0]
    : [];
  var existingMap = {};
  existing.forEach(function(h,i){ if(h) existingMap[String(h).trim()] = i+1; });
  HEADERS.forEach(function(h, targetIdx) {
    if (!existingMap[h]) {
      var insertAfter = targetIdx > 0 ? (existingMap[HEADERS[targetIdx-1]] || targetIdx) : 0;
      if (insertAfter === 0) {
        sheet.insertColumnBefore(1);
        sheet.getRange(1,1).setValue(h);
        existingMap[h] = 1;
        Object.keys(existingMap).forEach(function(k){ if(k!==h) existingMap[k]++; });
      } else {
        sheet.insertColumnAfter(insertAfter);
        var newCol = insertAfter + 1;
        sheet.getRange(1, newCol).setValue(h);
        existingMap[h] = newCol;
        Object.keys(existingMap).forEach(function(k){
          if(k!==h && existingMap[k] > insertAfter) existingMap[k]++;
        });
      }
    }
  });
  var updatedHeaders = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  updatedHeaders.forEach(function(h,i){ if(h) C[String(h).trim()] = i+1; });
  setupSheet(sheet);
  return sheet;
}

function generateId() {
  return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
}

function makeResponse(data) {
  var out = ContentService.createTextOutput(JSON.stringify(data));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function doGet(e) {
  try {
    var sheet = syncColumns();
    if (e.parameter && e.parameter.payload) {
      var body = JSON.parse(decodeURIComponent(e.parameter.payload));
      if (body.action==='create') return makeResponse(createProject(body.project, sheet));
      if (body.action==='update') return makeResponse(updateProject(body.project, sheet));
      if (body.action==='delete') return makeResponse(deleteProject(body.id, sheet));
      return makeResponse({error:'Unknown action: '+body.action});
    }
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return makeResponse({projects:[]});
    var projects = [];
    for (var i=1; i<data.length; i++) {
      var row = data[i];
      if (!row[C['ID']-1]) continue;
      projects.push({
        id:            String(row[C['ID']-1]),
        name:          row[C['Name']-1]                  || '',
        manager:       row[C['Project Manager']-1]       || '',
        campus:        (row[C['Campus']-1]||'hilltop').toLowerCase(),
        projType:      row[C['Project Type']-1]          || '',
        charterStatus: row[C['Charter Status']-1]        || '',
        type:          row[C['Project Category']-1]      || '',
        phase:         normalizePhase(row[C['Current Phase']-1]),
        start:         row[C['Start']-1]                 || '',
        end:           row[C['End']-1]                   || '',
        desc:          row[C['Description']-1]           || '',
        shapes:        safeParseJSON(row[C['Shapes (JSON)']-1], []),
        stagingYN:     row[C['Staging Area?']-1]         === 'yes',
        roadYN:        row[C['Road Closure?']-1]         === 'yes',
        phaseSchedule: safeParseJSON(row[C['Phase Schedule (JSON)']-1], []),
        createdAt:     row[C['Created At']-1]            || '',
        updatedAt:     row[C['Updated At']-1]            || '',
      });
    }
    return makeResponse({projects:projects});
  } catch(err) {
    return makeResponse({error:err.message});
  }
}

// Convert display phase label → internal key
function normalizePhase(label) {
  var map = {
    'programming':'programming',
    'design procurement':'design_proc',
    'design':'design',
    'construction procurement':'construction_proc',
    'construction':'construction',
    'in closeout':'closeout',
    'on hold':'on_hold'
  };
  return map[(label||'').toLowerCase().trim()] || 'programming';
}

// Convert internal key → display label for sheet storage
function phaseKeyToLabel(key) {
  var map = {
    'programming':'Programming',
    'design_proc':'Design Procurement',
    'design':'Design',
    'construction_proc':'Construction Procurement',
    'construction':'Construction',
    'closeout':'In Closeout',
    'on_hold':'On Hold'
  };
  return map[key] || key;
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var sheet = syncColumns();
    if (body.action==='create') return makeResponse(createProject(body.project, sheet));
    if (body.action==='update') return makeResponse(updateProject(body.project, sheet));
    if (body.action==='delete') return makeResponse(deleteProject(body.id, sheet));
    return makeResponse({error:'Unknown action: '+body.action});
  } catch(err) {
    return makeResponse({error:err.message});
  }
}

function createProject(p, sheet) {
  var id  = generateId();
  var now = new Date().toISOString();
  var row = buildRow(id, p, now, now);
  sheet.appendRow(row);
  return {success:true, id:id};
}

function updateProject(p, sheet) {
  var data = sheet.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (String(data[i][C['ID']-1]) === String(p.id)) {
      var now = new Date().toISOString();
      var createdAt = data[i][C['Created At']-1];
      var row = buildRow(p.id, p, createdAt, now);
      sheet.getRange(i+1, 1, 1, row.length).setValues([row]);
      return {success:true};
    }
  }
  return {success:false, error:'Not found: '+p.id};
}

function deleteProject(id, sheet) {
  var data = sheet.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (String(data[i][C['ID']-1]) === String(id)) {
      sheet.deleteRow(i+1);
      return {success:true};
    }
  }
  return {success:false, error:'Not found: '+id};
}

function buildRow(id, p, createdAt, updatedAt) {
  var row = new Array(HEADERS.length).fill('');
  row[C['ID']-1]                   = id;
  row[C['Name']-1]                 = p.name     || '';
  row[C['Project Manager']-1]      = p.manager  || '';
  row[C['Campus']-1]               = p.campus   ? (p.campus.charAt(0).toUpperCase()+p.campus.slice(1)) : 'Hilltop';
  row[C['Project Type']-1]         = p.projType || '';
  row[C['Charter Status']-1]       = p.charterStatus || '';
  row[C['Project Category']-1]     = p.type     || '';
  row[C['Current Phase']-1]        = phaseKeyToLabel(p.phase || 'programming');
  row[C['Start']-1]                = p.start    || '';
  row[C['End']-1]                  = p.end      || '';
  row[C['Description']-1]          = p.desc     || '';
  row[C['Shapes (JSON)']-1]        = JSON.stringify(p.shapes || []);
  row[C['Staging Area?']-1]        = p.stagingYN ? 'yes' : 'no';
  row[C['Road Closure?']-1]        = p.roadYN   ? 'yes' : 'no';
  row[C['Phase Schedule (JSON)']-1]= JSON.stringify(p.phaseSchedule || []);
  row[C['Created At']-1]           = createdAt  || new Date().toISOString();
  row[C['Updated At']-1]           = updatedAt  || new Date().toISOString();
  return row;
}

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch(e) { return fallback; }
}
