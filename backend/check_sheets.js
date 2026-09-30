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
    for (const sheet of info.data.sheets) {
      console.log('Sheet Name:', sheet.properties.title);
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `'${sheet.properties.title}'!A1:ZZ1`
      });
      console.log('Headers:', res.data.values ? res.data.values[0] : 'None');
      console.log('---');
    }
  } catch(e) { console.error(e.message); }
}
run();
