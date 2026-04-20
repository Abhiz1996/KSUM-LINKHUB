# Media Box Backend Setup

This folder contains a Google Apps Script backend template for:

- receiving form submissions from the website
- appending the answers to Google Sheets
- generating a PDF copy of each submission
- emailing the PDF to a configured address later

## 1. Create the spreadsheet

1. Create a Google Sheet.
2. Copy the spreadsheet ID from the URL.
3. Paste it into `spreadsheetId` in [Code.gs](/Users/ksummacpro2/Documents/New%20project/apps-script/Code.gs).

## 2. Create the PDF folder

1. Create a Google Drive folder for PDFs.
2. Copy the folder ID from the URL.
3. Paste it into `pdfFolderId` in [Code.gs](/Users/ksummacpro2/Documents/New%20project/apps-script/Code.gs).

## 3. Add the email address later

When you share the final email address, replace:

- `ADD_EMAIL_LATER@example.com`

with the actual recipient email in [Code.gs](/Users/ksummacpro2/Documents/New%20project/apps-script/Code.gs).

## 4. Deploy the Apps Script

1. Open [script.new](https://script.new).
2. Replace the default code with the content of [Code.gs](/Users/ksummacpro2/Documents/New%20project/apps-script/Code.gs).
3. Save the project.
4. Click `Deploy` -> `New deployment`.
5. Select `Web app`.
6. Set access to `Anyone`.
7. Deploy and copy the web app URL.

## 5. Connect the frontend

Open [script.js](/Users/ksummacpro2/Documents/New%20project/script.js) and set:

```js
submissionEndpoint: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
```

After that, every form submission can:

- show a questionnaire summary on screen
- be printed or saved as PDF from the browser
- be written into Google Sheets
- generate a Drive PDF copy
- email the PDF attachment once the final address is added

## Notes

- The frontend already works without the backend. In that mode it generates the summary locally and lets you print/save it as a PDF manually.
- Apps Script PDF generation uses the submitted data to render a structured document.
- If you want, I can also wire this to upload actual files instead of just Drive links in the next step.
