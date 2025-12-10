import { UserInfo } from '../types';

/*
  =============================================================================
  INSTRUCTIONS TO SETUP GOOGLE SHEETS INTEGRATION:
  =============================================================================
  1. Create a new Google Sheet at https://sheets.google.com
  2. Go to "Extensions" > "Apps Script".
  3. Delete any code in the editor and paste the code provided below:

  // COPY START ---------------------------------------------------------------
  function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var params = e.parameter;
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Native Language', 'Phone', 'Score', 'Total Questions', 'Percentage']);
    }
    
    sheet.appendRow([
      params.timestamp,
      params.name,
      params.nativeLanguage,
      params.phone,
      params.score,
      params.total,
      params.percentage
    ]);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }
  // COPY END -----------------------------------------------------------------

  4. Click the blue "Deploy" button > "New deployment".
  5. Click the "Select type" gear icon > "Web app".
  6. Enter a description (e.g., "German Mock Test").
  7. IMPORTANT: Set "Who has access" to "Anyone".
  8. Click "Deploy".
  9. Copy the "Web app URL" generated.
  10. Paste that URL into the variable `GOOGLE_SCRIPT_URL` below.
  =============================================================================
*/

// TODO: PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const GOOGLE_SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbzDICTwixvQ8mGlfiujsyJxIT9qqPsHFcQHpSn-fsM22qpqsIJiCaXyS2KHltOyCUXECw/exec'; 

export const submitToGoogleSheets = async (
  userInfo: UserInfo,
  score: number,
  total: number
) => {
  // If the URL is empty or default, alert the user and skip
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'REPLACE_WITH_YOUR_WEB_APP_URL') {
    alert("Google Sheets integration is not set up yet!\n\nPlease open the file 'services/sheets.ts' in your code editor and replace 'REPLACE_WITH_YOUR_WEB_APP_URL' with your actual Google Apps Script Web App URL.");
    console.warn("Google Sheets URL is not configured in services/sheets.ts. Result was not saved.");
    return;
  }

  const timestamp = new Date().toLocaleString();
  const percentage = Math.round((score / total) * 100) + '%';
  
  // Create form data for the POST request
  const formData = new FormData();
  formData.append('timestamp', timestamp);
  formData.append('name', userInfo.name);
  formData.append('nativeLanguage', userInfo.nativeLanguage);
  formData.append('phone', userInfo.phone);
  formData.append('score', score.toString());
  formData.append('total', total.toString());
  formData.append('percentage', percentage);

  try {
    // Send data to Google Apps Script
    // mode: 'no-cors' is required to send data to Google Scripts from a browser without CORS errors.
    // The response will be opaque (we can't read it), but the data will be sent.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    });
    console.log("Successfully submitted result to Google Sheets.");
  } catch (error) {
    console.error("Error submitting to Google Sheets:", error);
    alert("There was an error saving your results to the sheet. Please check your internet connection.");
  }
};