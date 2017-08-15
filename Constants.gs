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
 * @fileoverview This file contains all the constants used in the addon.
 */

/**
 * Google developer console client id.
 * @const {string}
 */
var CLIENT_ID = 'insert_client_id';

/**
 * Google developer console client secret.
 * @const {string}
 */
var CLIENT_SECRET = 'insert_client_secret';

/**
 * The redirect URL should be as per the format below. Script ID can be
 * obtained from File > Project Properties in the script.
 * Note the URL needs to be whitelisted as an Authorized redirect URL
 * in the cloud console.
 * Format: https://script.google.com/macros/d/[Script ID]/usercallback
 *
 * @const {string}
 */
var REDIRECT_URI = 'insert_redirect_uri';

/**
 * The title of the main dialog.
 * @const {string}
 */
var DIALOG_TITLE = 'DS Web Query URL';

/**
 * The name of the api service for OAuth.
 * @const {string}
 */
var SERVICE_NAME = 'dsapi';

/**
 * API scope that the addon needs to request from OAuth.
 * @const {string}
 */
var SCOPE = 'https://www.googleapis.com/auth/doubleclicksearch';

/**
 * Token access url for OAuth.
 * @const {string}
 */
var TOKEN_ACCESS_URL = 'https://accounts.google.com/o/oauth2/token';

/**
 * Authorization url for OAuth.
 * @const {string}
 */
var AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/auth';

/**
 * The title used in the menu for the addon.
 * @const {string}
 */
var ADDON_TITLE = 'DS Web Query Report - Google Sheets Addon';

/**
 * Frequency table which shows the available frequencies for scheduling.
 * @const {Array<Object>}
 */
var DAILY_FREQUENCY = [
  {'value': 0, 'text': 'Midnight to 1am'},
  {'value': 1, 'text': '1am to 2am'},
  {'value': 2, 'text': '2am to 3am'},
  {'value': 3, 'text': '3am to 4am'},
  {'value': 4, 'text': '4am to 5am'},
  {'value': 5, 'text': '5am to 6am'},
  {'value': 6, 'text': '6am to 7am'},
  {'value': 7, 'text': '7am to 8am'},
  {'value': 8, 'text': '8am to 9am'},
  {'value': 9, 'text': '9am to 10am'},
  {'value': 10, 'text': '10am to 11am'},
  {'value': 11, 'text': '11am to Noon'},
  {'value': 12, 'text': 'Noon to 1pm'},
  {'value': 13, 'text': '1pm to 2pm'},
  {'value': 14, 'text': '2pm to 3pm'},
  {'value': 15, 'text': '3pm to 4pm'},
  {'value': 16, 'text': '4pm to 5pm'},
  {'value': 17, 'text': '5pm to 6pm'},
  {'value': 18, 'text': '6pm to 7pm'},
  {'value': 19, 'text': '7pm to 8pm'},
  {'value': 20, 'text': '8pm to 9pm'},
  {'value': 21, 'text': '9pm to 10pm'},
  {'value': 22, 'text': '10pm to 11pm'},
  {'value': 23, 'text': '11pm to Midnight'}
];

/**
 * Used to check the Web Query Response Size and show warning messages.
 * This is needed because UrlFetchApp.fetch() has a 10MB limit.
 * @const {number}
 */
var URL_FETCH_LIMIT = 10 * 1024 * 1024;  // 10 MB

/**
 * At what percent, should a user warning be shown.
 * @const {number}
 */
var URL_FETCH_ERROR_PERCENT = 0.99;

/**
 * Admin users to show additional options in the menu.
 * @const {Array<string>}
 */
var APP_ADMIN_EMAILS = [];
