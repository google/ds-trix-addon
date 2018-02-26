// Copyright 2017 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

/**
 * @fileoverview This addon syncs DoubleClick search web query reports with
 * the trix that it is installed on.
 */

/**
 * Trigger function that fires when spreadsheet loads to create the add-on menu.
 * @param {Object} e The current ScriptApp Object.
 */
function onOpen(e) {
  var menu = SpreadsheetApp.getUi().createAddonMenu();
  menu.addItem('Set web query URL', 'setWebQueryURL')
      .addItem('Refresh current sheet', 'refreshCurrentSheet')
      .addItem('Refresh all sheets', 'refreshAllSheets')
      .addItem('Check Last sync time', 'showLastSyncDetails')
      .addItem('Schedule reports', 'schedulerDialog');

  if (e && e.authMode == ScriptApp.AuthMode.NONE) {
    menu.addToUi();
  } else {
    try {
      if (APP_ADMIN_EMAILS.indexOf(Session.getActiveUser().getEmail()) > -1) {
        menu.addSeparator().addSeparator().addItem('Purge Properties',
                                                   'purgeProperties');
      }
    } catch (e) {
      console.error(e);
    } finally {
      menu.addToUi();
    }
  }
}

/**
 * Convenience function to clear all properties set. Used only in debug mode.
 */
function purgeProperties() {
  PropertiesService.getDocumentProperties().deleteAllProperties();
  PropertiesService.getUserProperties().deleteAllProperties();

  // Also delete any triggers currently set by this user.
  var triggers = ScriptApp.getUserTriggers(SpreadsheetApp.getActiveSpreadsheet());
  for (var i=0; i<triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

/**
 * Function that fires when the add-on is installed.
 * @param {Object} e The current ScriptApp Object.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Function that shows a dialog box to enter the Web Query URL.
 * Redirects to Authorization dialog, if DS API access token is not granted
 * or is expired.
 */
function setWebQueryURL() {
  var DSOAuthService = getDSOAuthService();

  try {
    DSOAuthService.hasAccess();
    DSOAuthService.getAccessToken();
  } catch (err) {
    DSOAuthService.reset();
  }

  if (!DSOAuthService.hasAccess()) {
    var ui = HtmlService.createTemplateFromFile('Authorization')
                 .evaluate()
                 .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                 .setWidth(400)
                 .setHeight(120);
    SpreadsheetApp.getUi().showModalDialog(ui, 'Authorization Needed');
  } else {
    var ui = HtmlService.createTemplateFromFile('Dialog')
                 .evaluate()
                 .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                 .setWidth(600)
                 .setHeight(140);
    SpreadsheetApp.getUi().showModalDialog(ui, DIALOG_TITLE);
  }
}

/**
 * Function that handles response when OAuth posts back security token.
 * @param {request} request The HTTP Request object.
 * @return {Object} HtmlOutput.
 */
function authCallback(request) {
  var DSOAuthService = getDSOAuthService();
  var isAuthorized = DSOAuthService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput(
        'Success! You can close this tab and open the Dialog box again.');
  } else {
    return HtmlService.createHtmlOutput(
        'Access Denied. Please check if you have access to ' +
        'DoubleClick Search.');
  }
}

/**
 * Function that fires when user clicks on Refresh button, allows to manually
 * pull data from a Web Query into current sheet.
 * @param {string} webQueryUrl The Web Query URL that you want to sync. Can be
 *     generated from DS UI.
 */
function pullWebQuery(webQueryUrl) {
  SpreadsheetApp.getActiveSpreadsheet().toast(
      'Pulling web query data', 'Status', -1);
  var documentProperties = PropertiesService.getDocumentProperties();

  var currentSheet = SpreadsheetApp.getActiveSheet();
  var currentSheetId = currentSheet.getSheetId();

  // Set DS Web Query URL as a document property
  documentProperties.setProperty(currentSheetId + '_WEBQUERY_URL', webQueryUrl);

  pullNewData(currentSheet);
  SpreadsheetApp.getActiveSpreadsheet().toast(
      'Web query data added. You can now manually refresh or setup a' +
          ' scheduled sync',
      'Status',
      5);
}

/**
 * Function that pulls fresh data into all DS query linked sheets.
 */
function pullNewDataAll() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < sheets.length; i++) {
    pullNewData(sheets[i]);
  }
}

/**
 * Function to check if a valid OAuth token exists to access DS API.
 * @return {boolean} Returns true if access exists, else false.
 */
function hasDSAPIAccess() {
  var DSOAuthService = getDSOAuthService();
  try {
    DSOAuthService.hasAccess();
    DSOAuthService.getAccessToken();
  } catch (err) {
    DSOAuthService.reset();
  }
  return DSOAuthService.hasAccess();
}

/**
 * Function to show ad dialog with last sync details.
 */
function showLastSyncDetails() {

  if (!hasDSAPIAccess()) {
    var ui = HtmlService.createTemplateFromFile('Authorization')
                 .evaluate()
                 .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                 .setWidth(400)
                 .setHeight(120);
    SpreadsheetApp.getUi().showModalDialog(ui, 'Authorization Needed');
  } else {
    var ui = HtmlService.createTemplateFromFile('LastSyncDetails')
                 .evaluate()
                 .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                 .setWidth(400)
                 .setHeight(80);
    SpreadsheetApp.getUi().showModalDialog(ui, 'Last Sync Details');
  }
}

/**
 * Function that fires when Refresh Current Sheet command is chosen.
 */
function refreshCurrentSheet() {
  SpreadsheetApp.getActiveSpreadsheet().toast('Pulling new data', 'Status', -1);
  try {
    pullNewData(SpreadsheetApp.getActiveSheet());
    SpreadsheetApp.getActiveSpreadsheet().toast(
        'Refresh Complete', 'Status', 3);
  } catch (err) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + err, 'Status', -1);
  }
}

/**
 * Function that fires when Refresh All Sheet command is chosen.
 */
function refreshAllSheets() {
  SpreadsheetApp.getActiveSpreadsheet().toast('Pulling new data', 'Status', -1);
  try {
    pullNewDataAll();
    SpreadsheetApp.getActiveSpreadsheet().toast(
        'Refresh Complete', 'Status', 3);
  } catch (err) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Error: ' + err, 'Status', -1);
  }
}

/**
 * Function that pulls data from Web Query URL and puts in the sheet.
 * @param {Object} sheet The sheet object in which data needs to be populated.
 *     If null, use current Sheet.
 * @throws If the API token has expired.
 * @throws If the report fetched is larger than 10MB.
 */
function pullNewData(sheet) {
  var SpreadsheetName = SpreadsheetApp.getActiveSpreadsheet().getName();
  var SpreadsheetURL = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  var DSOAuthService = getDSOAuthService();

  // Check if the OAuth Token is valid and has access
  console.info('DS - Checking OAuth Token for: ' + SpreadsheetName +
               '. Sheet Name: ' + sheet.getName() + '. Url: ' + SpreadsheetURL);
  if (hasDSAPIAccess())
    console.info('DS - OAuth Token Good: ' + SpreadsheetName +
                 '. Sheet Name: ' + sheet.getName() +
                 '. Url: ' + SpreadsheetURL);
  else {
    console.error('DS - OAuth Token Expired: ' + SpreadsheetName +
                  '. Sheet Name: ' + sheet.getName() +
                  '. Url: ' + SpreadsheetURL);
    // Send email to sheet owner to renew the OAuth Token
    try {
      sendAuthRequiredEmail(DSOAuthService.getAuthorizationUrl());
    } catch (err) {
      console.log(err);
    }

    throw('DS API token expired. Please check your email for instructions');
    return;
  }
  try {
    var documentProperties = PropertiesService.getDocumentProperties();
    var sheetId = sheet.getSheetId();
    var webQueryUrl = documentProperties.getProperty(sheetId + '_WEBQUERY_URL');
    if (!webQueryUrl)
      return;

    // Use html version instead of the phtml version of DS Web Query Link.
    // The html version has all the data whereas phtml cuts-off
    // the report at 25,000 rows.
    webQueryUrl = webQueryUrl.replace(/webqueryphtml$/, 'webqueryhtml');

    var DSOAuthService = getDSOAuthService();

    var response = UrlFetchApp.fetch(webQueryUrl, {
      headers : {Authorization : 'Bearer ' + DSOAuthService.getAccessToken()}
    });

    var responseText = response.getContentText();
    if (getByteCount(responseText) >=
        URL_FETCH_LIMIT * URL_FETCH_ERROR_PERCENT) {
      throw('Not Supported: Response from Web Query URL: ' + webQueryUrl +
            ' seems quite larget (~10MB)');
    }

    // Converting the HTML to XML, so that we can use XmlService.parse(xml).
    // XmlService.parse requires the text to be in strict XML format.
    // Note: WebQuery HTML has first tbody visible and the next one invisible
    // to make it easy to preview in browsers.
    var parsedTableText =
        '<!DOCTYPE xml><table>' +
        responseText.substring(responseText.indexOf('<thead>'),
                               responseText.lastIndexOf('</tbody>') + 8) +
        '</table>';

    var parsedTableXML = XmlService.parse(parsedTableText);

    var table = parsedTableXML.getRootElement();

    // Find TH elements to get the column names.
    var theadCols = table.getChild('thead').getChild('tr').getChildren();

    // Setup two arrays to store data and headers.
    var data = [];
    var headers = [];

    for (var i = 0; i < theadCols.length; i++) {
      headers.push(theadCols[i].getText());
    }

    data.push(headers);

    var tbody = table.getChildren('tbody');

    for (i = 0; i < tbody.length; i++) {
      var tbodyRows = tbody[i].getChildren('tr');

      for (var j = 0; j < tbodyRows.length; j++) {
        var rowData = [];
        var tbodyRowCols = tbodyRows[j].getChildren('td');

        for (var k = 0; k < tbodyRowCols.length; k++) {
          rowData.push(tbodyRowCols[k].getText());
        }

        data.push(rowData);
      }
    }

    // Clear the existing rows first. Only the values, retain formatting.
    sheet.clearContents();

    sheet.getRange(1, 1, data.length, headers.length).setValues(data);
    console.info('DS - Set new data successfully for : ' + SpreadsheetName +
                 '. Sheet Name: ' + sheet.getName() +
                 '. Url: ' + SpreadsheetURL);

    // Truncate the sheet to number of rows with content.
    if (sheet.getMaxRows() > sheet.getLastRow())
      sheet.deleteRows(sheet.getLastRow() + 1,
                       sheet.getMaxRows() - sheet.getLastRow());

    // Truncate the sheet to number of columns with content.
    if (sheet.getMaxColumns() > sheet.getLastColumn())
      sheet.deleteColumns(sheet.getLastColumn() + 1,
                          sheet.getMaxColumns() - sheet.getLastColumn());

    documentProperties.setProperty(sheetId + '_LAST_SYNC', new Date());
  } catch (err) {
    console.error('DS - Error: ' + err + '. For ' + SpreadsheetName +
                  '. Sheet Name: ' + sheet.getName() +
                  '. Url: ' + SpreadsheetURL);
    throw(err);
  }
}

/**
 * Function that can be used with App Script Triggers to do an offline sync.
 */
function DS_offlineReportSync() {
  var documentProperties = PropertiesService.getDocumentProperties();
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var currentSheetId = '';
  var webQueryUrl = '';
  var SpreadsheetName = SpreadsheetApp.getActiveSpreadsheet().getName();
  var SpreadsheetURL = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  console.info('Entered DS offline sync method for: ' + SpreadsheetName +
               '. Url: ' + SpreadsheetURL);

  // Check if the script has all the authorization need to run offline sync.
  var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);

  // Check if the actions of the trigger requires authorization that has not
  // been granted yet; if so, warn the user via email. This check is required
  // when using triggers with add-ons to maintain functional triggers.
  if (authInfo.getAuthorizationStatus() ==
      ScriptApp.AuthorizationStatus.REQUIRED) {
    console.warn('DS Offline Report Sync: Auth Required for: ' +
                 SpreadsheetName + '. Url: ' + SpreadsheetURL);
    // Re-authorization is required. In this case, the user needs to be alerted
    // that they need to re-authorize; the normal trigger action is not
    // conducted, since it requires authorization first. Send at most one
    // "Authorization Required" email per day to avoid spamming users.
    var lastAuthEmailDate = documentProperties.getProperty('lastAuthEmailDate');
    var today = new Date().toDateString();
    if (lastAuthEmailDate != today) {
      if (MailApp.getRemainingDailyQuota() > 0) {
        sendAuthRequiredEmail(authInfo.getAuthorizationUrl());
      }
      documentProperties.setProperty('lastAuthEmailDate', today);
    }
  }

  else {
    console.info('Started DS offline sync for: ' + SpreadsheetName +
                 '. Url: ' + SpreadsheetURL);
    for (var i = 0; i < sheets.length; i++) {
      currentSheetId = sheets[i].getSheetId();

      webQueryUrl =
          documentProperties.getProperty(currentSheetId + '_WEBQUERY_URL');

      // If there is sheet level DS Web Query URL sync needed.
      if (webQueryUrl) {
        try {
          console.info('Started DS offline sync for: ' + SpreadsheetName +
                       '. Sheet Name: ' + sheets[i].getName() +
                       '. Url: ' + SpreadsheetURL);
          pullNewData(sheets[i]);
          console.info('Finished DS offline sync for: ' + SpreadsheetName +
                       '. Sheet Name: ' + sheets[i].getName() +
                       '. Url: ' + SpreadsheetURL);
        } catch (e) {
          MailApp.sendEmail(
              SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail(),
              ADDON_TITLE + ' - Offline Sync Failed',
              'Sheet URL: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl() +
                  '#gid=' + currentSheetId + '<br><br> Error: ' + e);
          console.error(ADDON_TITLE + ' - Offline Sync Failed',
                        'Sheet URL: ' + SpreadsheetURL +
                            '#gid=' + currentSheetId + '<br><br> Error: ' + e);
        }
      }
    }
  }
}

/**
 * Function to send the authorization email.
 * @param {string} authUrl The authentication URL to include in the mail.
 */
function sendAuthRequiredEmail(authUrl) {
  var html = HtmlService.createTemplateFromFile('AuthorizationEmail');
  html.url = authUrl;
  html.addonTitle = ADDON_TITLE;
  var message = html.evaluate();

  MailApp.sendEmail(SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail(),
                    ADDON_TITLE + ' - Authorization Required',
                    message.getContent(),
                    {name : ADDON_TITLE, htmlBody : message.getContent()});
}

/**
 * Function that creates OAuth2 Object using OAuth2 Library for Appscript.
 * Refer to https://github.com/googlesamples/apps-script-oauth2.
 * @return {Object} The OAuth2 Service Object.
 */
function getDSOAuthService() {
  return OAuth2
      .createService(SERVICE_NAME)

      // Set the endpoint URLs, which are the same for all Google services.
      .setAuthorizationBaseUrl(AUTHORIZATION_URL)
      .setTokenUrl(TOKEN_ACCESS_URL)

      // Set the client ID and secret, from the Google Developers Console.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request (space-separated for Google services).
      .setScope(SCOPE)

      // Below are Google-specific OAuth2 parameters.

      // Sets the login hint, which will prevent the account chooser screen
      // from being shown to users logged in with multiple accounts.
      .setParam('login_hint', Session.getActiveUser().getEmail())

      // Requests offline access.
      .setParam('access_type', 'offline')

      // Forces the approval prompt every time. This is useful for testing,
      // but not desirable in a production application.
      .setParam('approval_prompt', 'force');
}

/**
 * Clear oAuth Token, if a user manually revokes access to this app in Google
 * MyAccount, then we need to clear the OAuth Token running this method.
 */
function clearToken() {
  var DSOAuthService = getDSOAuthService();
  DSOAuthService.reset();
}

/**
 * Shows a dialog to schedule the report sync.
 */
function schedulerDialog() {

  if (!hasDSAPIAccess()) {
    var ui = HtmlService.createTemplateFromFile('Authorization')
                 .evaluate()
                 .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                 .setWidth(400)
                 .setHeight(120);
    SpreadsheetApp.getUi().showModalDialog(ui, 'Authorization Needed');
  } else {
    var ui = HtmlService.createTemplateFromFile('Scheduler')
                 .evaluate()
                 .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                 .setWidth(700)
                 .setHeight(100);

    SpreadsheetApp.getUi().showModalDialog(ui, 'Schedule Reports');
  }
}

/**
 * Setup Apps Script trigger to schedule the report sync.
 * @param {boolean} enableScheduler Flag to enable or disable scheduler.
 * @param {string} timerType Daily, Hourly or Weekly.
 * @param {string} hour What hour of the day should the timer run. For hourly
 *     timer it represents every x hours.
 * @param {string} weekDay Which week day should the timer run. Needed only
 *     for Weekly timerTypes.
 * @return {string}
 */
function setScheduler(enableScheduler, timerType, hour, weekDay) {
  var documentProperties, triggerSettings;
  documentProperties = PropertiesService.getDocumentProperties();

  // Delete all existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (i = 0; i < triggers.length; i++) {
    // Delete the old trigger on the document
    if (triggers[i].getUniqueId() ==
        documentProperties.getProperty('DS_Trigger_ID')) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  if (!enableScheduler) {
    documentProperties.deleteProperty('DS_Schedule_timerType');
    documentProperties.deleteProperty('DS_Schedule_hour');
    documentProperties.deleteProperty('DS_Schedule_weekDay');
    documentProperties.deleteProperty('DS_Trigger_Created_By');
    documentProperties.deleteProperty('DS_Trigger_ID');
    return '';
  }

  switch (timerType) {
  case 'hourly':
    var triggerID = ScriptApp.newTrigger('DS_offlineReportSync')
                        .timeBased()
                        .everyHours(hour)
                        .create()
                        .getUniqueId();

    triggerSettings = {
      'DS_Schedule_timerType' : timerType,
      'DS_Schedule_hour' : hour,
      'DS_Schedule_weekDay' : null, // Not applicable for Hourly timer
      'DS_Trigger_Created_By' : Session.getActiveUser().getEmail(),
      'DS_Trigger_ID' : triggerID
    };
    documentProperties.setProperties(triggerSettings);
    break;
  case 'daily':
    var triggerID = ScriptApp.newTrigger('DS_offlineReportSync')
                        .timeBased()
                        .everyDays(1)
                        .atHour(hour)
                        .create()
                        .getUniqueId();

    triggerSettings = {
      'DS_Schedule_timerType' : timerType,
      'DS_Schedule_hour' : hour,
      'DS_Schedule_weekDay' : null, // Not applicable for Weekly timer
      'DS_Trigger_Created_By' : Session.getActiveUser().getEmail(),
      'DS_Trigger_ID' : triggerID
    };
    documentProperties.setProperties(triggerSettings);
    break;
  case 'weekly':
    var onWeekDay = ScriptApp.WeekDay.MONDAY;
    switch (weekDay) {
    case 'MONDAY':
      onWeekDay = ScriptApp.WeekDay.MONDAY;
      break;

    case 'TUESDAY':
      onWeekDay = ScriptApp.WeekDay.TUESDAY;
      break;

    case 'WEDNESDAY':
      onWeekDay = ScriptApp.WeekDay.WEDNESDAY;
      break;

    case 'THURSDAY':
      onWeekDay = ScriptApp.WeekDay.THURSDAY;
      break;

    case 'FRIDAY':
      onWeekDay = ScriptApp.WeekDay.FRIDAY;
      break;

    case 'SATURDAY':
      onWeekDay = ScriptApp.WeekDay.SATURDAY;
      break;

    case 'SUNDAY':
      onWeekDay = ScriptApp.WeekDay.SUNDAY;
      break;
    }
    var triggerID = ScriptApp.newTrigger('DS_offlineReportSync')
                        .timeBased()
                        .everyWeeks(1)
                        .onWeekDay(onWeekDay)
                        .atHour(hour)
                        .create()
                        .getUniqueId();

    triggerSettings = {
      'DS_Schedule_timerType' : timerType,
      'DS_Schedule_hour' : hour,
      'DS_Schedule_weekDay' : weekDay,
      'DS_Trigger_Created_By' : Session.getActiveUser().getEmail(),
      'DS_Trigger_ID' : triggerID
    };
    documentProperties.setProperties(triggerSettings);

    break;
  }

  return retrieveCurrentSchedule();
}

/**
 * Retrieve the current sync schedule in human readable format.
 * @return {string}
 */
function retrieveCurrentSchedule() {
  // Only returns the triggers for the current user for the DS Add-on for this
  // document.
  var triggers =
      ScriptApp.getUserTriggers(SpreadsheetApp.getActiveSpreadsheet());
  var documentProperties = PropertiesService.getDocumentProperties();

  var doesTriggerExist = false;
  if (documentProperties.getProperty('DS_Trigger_Created_By') ==
      Session.getActiveUser().getEmail()) {
    for (i = 0; i < triggers.length; i++) {
      if (triggers[i].getUniqueId() ==
          documentProperties.getProperty('DS_Trigger_ID')) {
        doesTriggerExist = true;
      }
    }

    if (!doesTriggerExist) {
      documentProperties.deleteProperty('DS_Schedule_timerType');
      documentProperties.deleteProperty('DS_Schedule_hour');
      documentProperties.deleteProperty('DS_Schedule_weekDay');
      documentProperties.deleteProperty('DS_Trigger_Created_By');
      documentProperties.deleteProperty('DS_Trigger_ID');
      return '';
    }
  }

  var documentProperties = PropertiesService.getDocumentProperties();
  var timerType = documentProperties.getProperty('DS_Schedule_timerType');
  var hour = documentProperties.getProperty('DS_Schedule_hour');
  var weekDay = documentProperties.getProperty('DS_Schedule_weekDay');
  var createdBy = documentProperties.getProperty('DS_Trigger_Created_By');

  var strReadableSchedule = '';

  switch (timerType) {
  case 'hourly':
    strReadableSchedule +=
        '<b>Current Sync Schedule:</b> Every ' + hour + ' Hours';
    break;

  case 'daily':
    strReadableSchedule += '<b>Current Sync Schedule:</b> Daily between ' +
                           DAILY_FREQUENCY[hour].text;
    break;

  case 'weekly':
    strReadableSchedule += '<b>Current Sync Schedule:</b> Weekly on ' +
                           weekDay + ' between ' + DAILY_FREQUENCY[hour].text;
    break;
  }
  if (createdBy && strReadableSchedule)
    strReadableSchedule += '. Created by: <b>' + createdBy + '</b>';
  return strReadableSchedule;
}

/**
 * Count bytes in a string's UTF-8 representation.
 *
 * @param {string} strInput The input string.
 * @return {number} The number of bytes in the string.
 */
function getByteCount(strInput) {
  var byteCount = 0;
  for (var i = 0; i < strInput.length; i++) {
    var c = strInput.charCodeAt(i);
    if (c < (1 << 7)) {
      byteCount += 1;
    } else if (c < (1 << 11)) {
      byteCount += 2;
    } else if (c < (1 << 16)) {
      byteCount += 3;
    } else if (c < (1 << 21)) {
      byteCount += 4;
    } else if (c < (1 << 26)) {
      byteCount += 5;
    } else if (c < (1 << 31)) {
      byteCount += 6;
    } else {
      byteCount = Number.Nan;
    }
  }
  return byteCount;
}
