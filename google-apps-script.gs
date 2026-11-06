/**
 * ==============================================================================
 * OG HUB (Ashutosh Mishra) - Automatic Lead Capture & Gmail Notification Script
 * ==============================================================================
 * 
 * HOW TO SET THIS UP IN 60 SECONDS (100% Free Forever):
 * 
 * 1. Open your browser and go to: https://script.google.com/
 *    (Make sure you are logged in as oghub.in@gmail.com)
 * 2. Click "New project" at the top left.
 * 3. Delete any code in the editor, copy and paste this ENTIRE file into the editor.
 * 4. Click the blue "Deploy" button at top right -> Select "New deployment".
 * 5. Under "Select type" (gear icon), select "Web app".
 * 6. Set:
 *    - Description: OG Hub Leads Webhook
 *    - Execute as: Me (oghub.in@gmail.com)
 *    - Who has access: Anyone
 * 7. Click "Deploy".
 * 8. Authorize the permissions when prompted (Click Advanced -> Go to Untitled project).
 * 9. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/AKfycb.../exec).
 * 10. Paste that URL into index.html in the GOOGLE_SCRIPT_URL variable, or keep it in your records!
 * 
 * THAT'S IT! Every time a client submits the form on oghub.in:
 * - You will instantly receive an email alert in oghub.in@gmail.com
 * - All leads are automatically logged in your Google Sheet!
 * ==============================================================================
 */

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      data = e.parameter;
    }

    var name = data.firstName || data.name || 'Anonymous Founder';
    var email = data.email || 'No email provided';
    var creators = data.creators_required || data.creators || 'Not specified';
    var niche = data.creator_niche || data.niche || 'Not specified';
    var phone = data.phone || 'Not specified';
    var time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // 1. Send Email Notification to oghub.in@gmail.com
    var subject = "🔥 New OG Hub Lead: " + name + " (" + niche + ")";
    var body = 
      "====================================================\n" +
      "  NEW STRATEGY CALL REQUEST RECEIVED ON OG HUB!\n" +
      "====================================================\n\n" +
      "👤 Founder Name:             " + name + "\n" +
      "📧 Business Email:            " + email + "\n" +
      "📱 Direct Mobile:             " + phone + "\n" +
      "🎯 Creators Required:         " + creators + "\n" +
      "🏷️  Target Niche:              " + niche + "\n" +
      "⏰ Submission Time (IST):      " + time + "\n\n" +
      "====================================================\n" +
      "Quick WhatsApp Link: https://wa.me/" + phone.replace(/[^0-9]/g, '') + "\n" +
      "====================================================";

    GmailApp.sendEmail("oghub.in@gmail.com", subject, body, {
      name: "OG Hub Growth Engine",
      replyTo: email
    });

    // 2. Optional: Append to Google Sheet (if script is bound to a Sheet)
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet();
      if (sheet) {
        var tab = sheet.getActiveSheet();
        if (tab.getLastRow() === 0) {
          tab.appendRow(["Timestamp", "Name", "Email", "Phone", "Creators Needed", "Target Niche"]);
        }
        tab.appendRow([time, name, email, phone, creators, niche]);
      }
    } catch (sheetErr) {}

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Lead captured and email sent" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("OG Hub Lead Webhook is active and healthy.")
    .setMimeType(ContentService.MimeType.TEXT);
}

