const { google } = require('googleapis');
async function run() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const sheetId = '1Z96QKQlRIIs6a1HJL7w3sQIyN0rmqhGWk8JlpkdOPM0';
    
    const info = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTitle = info.data.sheets[0].properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${sheetTitle}'!A1:ZZ20`
    });
    const rows = res.data.values;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].length > 0) {
        console.log(`Row ${i + 1}: ${rows[i].slice(0, 5).join(', ')}`);
      }
    }
  } catch(e) { console.error(e.message); }
}
run();
