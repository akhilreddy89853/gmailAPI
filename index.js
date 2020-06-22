const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
// fs.readFile('credentials.json', (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err);
//   // Authorize a client with credentials, then call the Gmail API.
//   authorize(JSON.parse(content));
// });

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

class ReadEmail {
  constructor(_dominio) {
    this.credentials = null;
    this.auth = null;
    this.message = null;
    this.dominio = _dominio;
  }

  async setup() {
    this.credentials = await this.getCredentials();
    this.auth = await this.getAuthorize();
    this.message = await this.getLastMessage();
  }

  getCredentials() {
    return new Promise((resolve, reject) => {
      fs.readFile('credentials.json', (err, content) => {
        if (err) reject('Error loading client secret file:' + err);
        resolve(JSON.parse(content));
      });
    });
  }
  
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
   getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }
  
  
  

  getAuthorize(callback) {
    return new Promise((resolve, reject) => {
      const { client_secret, client_id, javascript_origins } = this.credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, javascript_origins[0]);
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return this.getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
      //   oauth2Client.on('tokens', (tokens) => {
      //     if (tokens.refresh_token) {
      //       // store the refresh_token in my database!
      //       console.log(tokens.refresh_token);
      //     }
      //     console.log(tokens.access_token);
      //   });
      //   oauth2Client.setCredentials({
      //     refresh_token: `STORED_REFRESH_TOKEN`
      //   });
        resolve(oAuth2Client);
       });
    });
  }

 async getLastMessage() {
    return new Promise(async (resolve, reject) => {
      const gmail = google.gmail({ version: 'v1', auth: this.auth });
      var request =  await gmail.users.messages.list({
        userId: 'me',
        labelIds: 'INBOX',
        maxResults: 10,
      });
      console.log(request.data.messages[0]);
      //  request.then(async ret => {
      //   let id = ret.data.messages[0].id;
      //   var request2 = await gmail.users.messages.get({
      //     userId: 'me',
      //     id: id,
      //   });
      //   request.then(ret2 => {
      //     let msg = ret2.data.payload.body.data;
      //    // let buff = new Buffer.from(msg, 'base64');
      //     //let text = buff.toString('ascii');
      //     console.log('---------------' + msg );
      //     resolve(msg);
      //   });
      // });
    });
  }
}
new ReadEmail('_dominio').setup();