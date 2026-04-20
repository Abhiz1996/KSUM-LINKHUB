const CONFIG = {
  spreadsheetId: "PASTE_YOUR_GOOGLE_SHEET_ID_HERE",
  sheetName: "Media Requests",
  pdfFolderId: "PASTE_YOUR_DRIVE_FOLDER_ID_HERE",
  notifyEmail: "ADD_EMAIL_LATER@example.com",
  companyName: "Your Company"
};

const HEADERS = [
  "Submitted At",
  "Employee Name",
  "Department",
  "Category",
  "Social Type",
  "New Creative - Event Name",
  "New Creative - Event Date",
  "New Creative - Event Time",
  "New Creative - Location",
  "New Creative - Registration Link",
  "New Creative - Description",
  "New Creative - Speaker Details",
  "New Creative - Photo Drive Link",
  "New Creative - LinkedIn Profile",
  "New Creative - Partner Institutions and Logos",
  "New Creative - Tagging Links",
  "Post Event - Title",
  "Post Event - Date",
  "Post Event - Location",
  "Post Event - Photo Drive Link",
  "Post Event - Tagging Details",
  "External Event - Name",
  "External Event - Partner Organisation",
  "External Event - Registration Link",
  "External Event - Date",
  "External Event - Location",
  "External Event - Creative To Be Published",
  "External Event - Tagging Links",
  "Achievement - Startup Name",
  "Achievement - Description",
  "Achievement - Photos",
  "Achievement - Logos",
  "Achievement - Tagging Links",
  "Achievement - Contact Details",
  "PR - Event or Announcement",
  "PR - Who Is Involved",
  "PR - When",
  "PR - Where",
  "PR - Why Significant",
  "PR - Key Highlights",
  "PR - Notable Speakers",
  "PR - Background Context",
  "PR - Quotes",
  "PR - Testimonials",
  "PR - Follow-up Events",
  "PR - More Information",
  "PR - Media Assets",
  "PR - Captions",
  "PR - Contact Person",
  "PDF URL"
];

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const sheet = getSheet_();
    ensureHeaders_(sheet);

    const pdfFile = createPdfFromPayload_(payload);
    const pdfUrl = pdfFile ? pdfFile.getUrl() : "";

    sheet.appendRow([
      payload.submittedAt || "",
      payload.employeeName || "",
      payload.department || "",
      payload.category || "",
      payload.socialType || "",
      payload.newCreativeEventName || "",
      payload.newCreativeEventDate || "",
      payload.newCreativeEventTime || "",
      payload.newCreativeLocation || "",
      payload.newCreativeRegistrationLink || "",
      payload.newCreativeDescription || "",
      payload.newCreativeSpeakerDetails || "",
      payload.newCreativePhotoDriveLink || "",
      payload.newCreativeLinkedinProfile || "",
      payload.newCreativePartnerInstitutions || "",
      payload.newCreativeTaggingLinks || "",
      payload.postEventTitle || "",
      payload.postEventDate || "",
      payload.postEventLocation || "",
      payload.postEventPhotoDriveLink || "",
      payload.postEventTaggingDetails || "",
      payload.externalEventName || "",
      payload.externalPartnerOrganisation || "",
      payload.externalRegistrationLink || "",
      payload.externalEventDate || "",
      payload.externalEventLocation || "",
      payload.externalCreativeToBePublished || "",
      payload.externalTaggingLinks || "",
      payload.achievementStartupName || "",
      payload.achievementDescription || "",
      payload.achievementPhotos || "",
      payload.achievementLogos || "",
      payload.achievementTaggingLinks || "",
      payload.achievementContactDetails || "",
      payload.prEventAnnouncement || "",
      payload.prWhoIsInvolved || "",
      payload.prWhen || "",
      payload.prWhere || "",
      payload.prWhySignificant || "",
      payload.prKeyHighlights || "",
      payload.prNotableSpeakers || "",
      payload.prBackgroundContext || "",
      payload.prQuotes || "",
      payload.prTestimonials || "",
      payload.prFollowUpEvents || "",
      payload.prMoreInformation || "",
      payload.prMediaAssets || "",
      payload.prCaptions || "",
      payload.prContactPerson || "",
      pdfUrl
    ]);

    if (CONFIG.notifyEmail && CONFIG.notifyEmail.indexOf("ADD_EMAIL_LATER") === -1) {
      MailApp.sendEmail({
        to: CONFIG.notifyEmail,
        subject: `${CONFIG.companyName} Media Request - ${payload.category || "New Submission"}`,
        htmlBody: createEmailHtml_(payload, pdfUrl),
        attachments: pdfFile ? [pdfFile.getBlob()] : []
      });
    }

    return jsonOutput_({
      ok: true,
      mode: "connected",
      pdfUrl: pdfUrl
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      error: error.message
    });
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const existingSheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  return existingSheet || spreadsheet.insertSheet(CONFIG.sheetName);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
}

function createPdfFromPayload_(payload) {
  if (!CONFIG.pdfFolderId || CONFIG.pdfFolderId.indexOf("PASTE_") === 0) {
    return null;
  }

  const html = HtmlService.createHtmlOutput(createPdfHtml_(payload));
  const pdfBlob = html
    .getBlob()
    .getAs(MimeType.PDF)
    .setName(createPdfFileName_(payload));

  return DriveApp.getFolderById(CONFIG.pdfFolderId).createFile(pdfBlob);
}

function createPdfFileName_(payload) {
  const safeName = (payload.employeeName || "request").replace(/[^\w-]+/g, "-");
  const safeCategory = (payload.category || "submission").replace(/[^\w-]+/g, "-");
  return `${safeName}-${safeCategory}.pdf`;
}

function createPdfHtml_(payload) {
  const sections = [
    {
      title: "Requester Information",
      rows: [
        ["Name", payload.employeeName],
        ["Department", payload.department],
        ["Category", payload.category],
        ["Social Type", payload.socialType]
      ]
    }
  ];

  if (payload.category === "Social Media" && payload.socialType === "New Creative") {
    sections.push({
      title: "New Creative Details",
      rows: [
        ["Name of event", payload.newCreativeEventName],
        ["Date of event", payload.newCreativeEventDate],
        ["Time", payload.newCreativeEventTime],
        ["Location", payload.newCreativeLocation],
        ["Registration Link", payload.newCreativeRegistrationLink],
        ["Brief description", payload.newCreativeDescription],
        ["Speaker details", payload.newCreativeSpeakerDetails],
        ["Drive link to photographs", payload.newCreativePhotoDriveLink],
        ["LinkedIn Profile", payload.newCreativeLinkedinProfile],
        ["Partner institutions and logos", payload.newCreativePartnerInstitutions],
        ["Tagging links", payload.newCreativeTaggingLinks]
      ]
    });
  }

  if (payload.category === "Social Media" && payload.socialType === "Post Event") {
    sections.push({
      title: "Post Event Details",
      rows: [
        ["Title", payload.postEventTitle],
        ["Date", payload.postEventDate],
        ["Location", payload.postEventLocation],
        ["Drive link to photos", payload.postEventPhotoDriveLink],
        ["Tagging details", payload.postEventTaggingDetails]
      ]
    });
  }

  if (payload.category === "Social Media" && payload.socialType === "External or Partner Event") {
    sections.push({
      title: "External or Partner Event Details",
      rows: [
        ["Name of event", payload.externalEventName],
        ["Partner organisation", payload.externalPartnerOrganisation],
        ["Registration Link", payload.externalRegistrationLink],
        ["Date", payload.externalEventDate],
        ["Location", payload.externalEventLocation],
        ["Creative to be published", payload.externalCreativeToBePublished],
        ["Tagging links", payload.externalTaggingLinks]
      ]
    });
  }

  if (payload.category === "Achievements") {
    sections.push({
      title: "Achievement Details",
      rows: [
        ["Startups / Startup mission", payload.achievementStartupName],
        ["Brief description", payload.achievementDescription],
        ["Photos if any", payload.achievementPhotos],
        ["Logos to be included", payload.achievementLogos],
        ["Tagging links", payload.achievementTaggingLinks],
        ["Contact details", payload.achievementContactDetails]
      ]
    });
  }

  if (payload.category === "PR") {
    sections.push({
      title: "Press Release Details",
      rows: [
        ["Event or announcement", payload.prEventAnnouncement],
        ["Who is involved", payload.prWhoIsInvolved],
        ["When", payload.prWhen],
        ["Where", payload.prWhere],
        ["Why significant", payload.prWhySignificant],
        ["Key highlights", payload.prKeyHighlights],
        ["Notable speakers", payload.prNotableSpeakers],
        ["Background", payload.prBackgroundContext],
        ["Quotes", payload.prQuotes],
        ["Testimonials", payload.prTestimonials],
        ["Follow-up events", payload.prFollowUpEvents],
        ["More information", payload.prMoreInformation],
        ["Media assets", payload.prMediaAssets],
        ["Captions", payload.prCaptions],
        ["Contact person", payload.prContactPerson]
      ]
    });
  }

  const sectionHtml = sections
    .map(function(section) {
      const rows = section.rows
        .filter(function(row) {
          return row[1];
        })
        .map(function(row) {
          return `
            <div class="row">
              <div class="label">${escapeHtml_(row[0])}</div>
              <div class="value">${escapeHtml_(String(row[1])).replace(/\n/g, "<br>")}</div>
            </div>
          `;
        })
        .join("");

      return `
        <section class="block">
          <h2>${escapeHtml_(section.title)}</h2>
          ${rows}
        </section>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1a1f24;
            padding: 32px;
            line-height: 1.5;
          }
          h1 {
            margin: 0 0 8px;
            color: #0a5d61;
          }
          .meta {
            color: #56616b;
            margin-bottom: 28px;
          }
          .block {
            margin-top: 24px;
            padding: 18px;
            border: 1px solid #d8dee4;
            border-radius: 12px;
          }
          .block h2 {
            margin: 0 0 14px;
            color: #b45a38;
            font-size: 18px;
          }
          .row {
            margin-top: 12px;
          }
          .label {
            font-weight: bold;
            color: #0a5d61;
            margin-bottom: 4px;
          }
          .value {
            white-space: normal;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml_(CONFIG.companyName)} Media Box Submission</h1>
        <div class="meta">Submitted at: ${escapeHtml_(payload.submittedAt || "")}</div>
        ${sectionHtml}
      </body>
    </html>
  `;
}

function createEmailHtml_(payload, pdfUrl) {
  return `
    <p>A new media request has been submitted.</p>
    <p><strong>Name:</strong> ${escapeHtml_(payload.employeeName || "")}</p>
    <p><strong>Department:</strong> ${escapeHtml_(payload.department || "")}</p>
    <p><strong>Category:</strong> ${escapeHtml_(payload.category || "")}</p>
    ${pdfUrl ? `<p><a href="${pdfUrl}">Open PDF copy</a></p>` : ""}
  `;
}

function escapeHtml_(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
