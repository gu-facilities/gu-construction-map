// ============================================================
//  Georgetown Facilities Construction Map — Google Apps Script
//  Replace ALL existing code with this, then redeploy.
// ============================================================

const SHEET_NAME = 'Projects';

// Expected header row — order matters
const HEADERS = [
  'ID','Name','Project Manager','Type','Phase','Start','End','Description',
  'Shapes (JSON)','Staging Area?','Road Closure?','Phase Schedule (JSON)','Created At','Updated At'
];

// Column index map (1-based)
const C = {};
HEADERS.forEach(function(h,i){ C[h] = i+1; });

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    styleHeader(sheet);
  }
  return sheet;
}

function styleHeader(sheet) {
  sheet.getRange(1,1,1,HEADERS.length)
    .setBackground('#041E42').setFontColor('#C9A96E').setFontWeight('bold');
}

// Ensures the sheet has ALL expected columns in the right order.
// Safe to run on existing sheets — adds missing columns without losing data.
function syncColumns() {
  var sheet = getSheet();
  var lastCol = sheet.getLastColumn();
  var existing = lastCol > 0
    ? sheet.getRange(1,1,1,lastCol).getValues()[0]
    : [];

  // Build a map of existing header -> column index
  var existingMap = {};
  existing.forEach(function(h,i){ if(h) existingMap[String(h).trim()] = i+1; });

  // Insert any missing headers
  HEADERS.forEach(function(h, targetIdx) {
    if (!existingMap[h]) {
      // Find where to insert: after the previous header's column
      var insertAfter = targetIdx > 0 ? (existingMap[HEADERS[targetIdx-1]] || targetIdx) : 0;
      if (insertAfter === 0) {
        sheet.insertColumnBefore(1);
        sheet.getRange(1,1).setValue(h);
        existingMap[h] = 1;
        // Shift all existing cols right
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

  // Rebuild C map from actual sheet
  var updatedHeaders = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  updatedHeaders.forEach(function(h,i){ if(h) C[String(h).trim()] = i+1; });

  styleHeader(sheet);
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
        id:        String(row[C['ID']-1]),
        name:      row[C['Name']-1]             || '',
        manager:   row[C['Project Manager']-1]  || '',
        type:      row[C['Type']-1]             || '',
        phase:     row[C['Phase']-1]            || '',
        start:     row[C['Start']-1]            || '',
        end:       row[C['End']-1]              || '',
        desc:      row[C['Description']-1]      || '',
        shapes:    safeParseJSON(row[C['Shapes (JSON)']-1], []),
        stagingYN:     row[C['Staging Area?']-1]          === 'yes',
        roadYN:        row[C['Road Closure?']-1]          === 'yes',
        phaseSchedule: safeParseJSON(row[C['Phase Schedule (JSON)']-1], []),
        createdAt: row[C['Created At']-1]       || '',
        updatedAt: row[C['Updated At']-1]       || '',
      });
    }
    return makeResponse({projects:projects});
  } catch(err) {
    return makeResponse({error:err.message});
  }
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
  row[C['ID']-1]              = id;
  row[C['Name']-1]            = p.name    || '';
  row[C['Project Manager']-1] = p.manager || '';
  row[C['Type']-1]            = p.type    || '';
  row[C['Phase']-1]           = p.phase   || '';
  row[C['Start']-1]           = p.start   || '';
  row[C['End']-1]             = p.end     || '';
  row[C['Description']-1]     = p.desc    || '';
  row[C['Shapes (JSON)']-1]   = JSON.stringify(p.shapes || []);
  row[C['Staging Area?']-1]        = p.stagingYN ? 'yes' : 'no';
  row[C['Road Closure?']-1]        = p.roadYN    ? 'yes' : 'no';
  row[C['Phase Schedule (JSON)']-1]= JSON.stringify(p.phaseSchedule || []);
  row[C['Created At']-1]           = createdAt || new Date().toISOString();
  row[C['Updated At']-1]           = updatedAt || new Date().toISOString();
  return row;
}

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch(e) { return fallback; }
}
