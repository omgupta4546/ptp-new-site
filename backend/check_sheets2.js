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
    console.log('Fetching range for', sheetTitle);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${sheetTitle}'!A1:ZZ100`
    });
    console.log('Rows returned:', res.data.values ? res.data.values.length : 0);
    if(res.data.values && res.data.values.length > 0) {
      console.log('Row 1:', res.data.values[0]);
    }
  } catch(e) { console.error(e.message); }
}
run();
