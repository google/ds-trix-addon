# DS Trix Addon

_Disclaimer: This is not an official Google product._

## Overview

DS Trix Addon is an addon for Google Sheets which allows you to sync Web Query
Reports from DoubleClick Search directly into a Google Sheets spreadsheet. To
use this addon, you will need to have access to [DoubleClick
Search](https://www.doubleclickbygoogle.com/solutions/digital-marketing/search/).

The addon has the following features:

*   Download data from web query reports directly into spreadsheet (instead of
    downloading CSV and re-uploading to the sheet).
*   Scheduled updates which allows the addon to sync the data and update your
    spreadsheet even if the sheet is not open or being used.
*   Do ad-hoc refreshes of the data.

You can use additional tabs in the same spreadsheet to create a dashboard based
on your reports.

## Installation

1.  Download all the files in this repository to your computer.
1.  Open [Google Drive](https://www.google.com/intl/en/drive/) in a browser
    window. If you don't have a Google account, create a new account. Else,
    login with the account you wish to use.
1.  Create a new spreadsheet using `New > Google Sheets`.
1.  Give your spreadsheet a name by clicking on the title at the top.
1.  Open the script editor by going to `Tools > Script Editor ...`
1.  Give your script a name (Ex: DS Trix Addon).
1.  You should have the file `Code.gs` open in the editor. On your computer,
    open `Code.gs` from the files you downloaded in step #1 in a local text
    editor.
1.  Copy the contents of the entire file into the script editor, replacing
    whatever is already present in the editor.
1.  Press ctrl/cmd-s or go to `File > Save` to save the file.
1.  You will need to add all the remaining source files to the same project
    while retaining the names exactly as they are for the files you downloaded
    (_Note: The names are case sensitive_).
    1.  For files that end with `.html`, you need to create an HTML file by
        going to `File > New > Html file`.
    1.  For file that end with `.gs`, you need to create a script file by going
        to `File > New > Script file`.
    1.  Ignore the files `LICENSE`, `README.md`, `CONTRIBUTING.md`. These are
        not needed for the addon.
    1.  For every file, simply copy the contents of the file from your computer
        to the editor replacing any existing content.
    1.  Make sure to save all the files after copying the contents.
1.  The final step is to configure OAuth so that the addon can access your Web
    Query Reports on DoubleClick Search.
    1.  In the script editor, open the file `Constants.gs`. This file has all
        the configuration parameters that we will populate.
    1.  In the script editor, go to `Resources > Cloud Platform Project`.
    1.  A dialog should pop up with a link to the cloud project that this script
        is associated with. It will be of the form `<Project Name> -
        project-id-1234567890123456789`. Click on this link to open the
        associated cloud project.
    1.  If the left side menu is not open, click the Menu button at the top left
        of the page. It should have three horizontal lines.
    1.  In the menu click on `APIs & services > Dashboard`.
    1.  In the dashboard, click on `+ ENABLE APIS AND SERVICES`.
    1.  In the search box enter `DoubleClick Search API`. The search results
        should list the API entry. Click on it to open.
    1.  At the top of the new screen, click on `ENABLE`.
    1.  On the menu currently open on the left side of the page, click on
        `Credentials` (Under APIs & services).
    1.  In the list of client ids, you will see an entry for `Apps Script`.
        Click on it to open it.
    1.  You will see the client id and client secret at the top. Copy each of
        these and paste them in the `Constants.gs` file at the points where it
        says `insert_client_id` and `insert_client_secret`. After pasting, save
        the file.
    1.  In the script editor, go to `File > Project properties`. Copy the value
        next to `Script ID`.
    1.  In `Constants.gs`, paste the script id in the variable value for
        `REDIRECT_URI` at the place where it says `insert_script_id`. Save the
        file.
    1.  Copy the entire URL for `REDIRECT_URI`. Go back to the Cloud Console
        browser window and in the same page that we copied the client id and
        client secret from, paste the url under `Authorized redirect URIs`.
        Click outside the text box and click on `Save`. You can close the cloud
        console page.
    1.  In the script editor, go to `Resources > Libraries`. In the text box at
        the bottom of the dialog, paste this value -
        `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF` and click on
        `Add`.
    1.  You will see the OAuth2 library added in the dialog. In the version
        dropdown, select `21` as that's the version this addon was built with.
        Once done click on `Save`.
1.  Now we can start using the Addon. Close the script editor and refresh the
    spreadsheet. When it loads, you will now be able to see the the menu entry
    under `Addons > <your script name>`. Under this menu, click on `Set web
    query URL` to start using the addon.
1.  When using for the first time, you will see dialogs asking for
    authentication and permissions. These will be asked only the first time for
    each user. Follow the instructions on them.
1.  When setting up authentication, you may see a message that says `This app
    isn't verified`. If you see this, click on `Advanced` and select `Go to
    <name of script>`. In the pop up, type in `Continue` and press `Next` to
    proceed.
