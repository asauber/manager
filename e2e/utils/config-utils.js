
<<<<<<< HEAD
/*
* Get localStorage after landing on homepage
* and write them out to a file for use in other tests
* @returns { String } stringified local storage object
*/
exports.storeToken = (credFilePath, username) => {
    let credCollection = JSON.parse(readFileSync(credFilePath));

    const getTokenFromLocalStorage = () => {
        const browserLocalStorage = browser.execute(function() {
            return JSON.stringify(localStorage);
        });
        const parsedLocalStorage = JSON.parse(browserLocalStorage.value);
        return parsedLocalStorage['authentication/oauth-token'];
    }

    let currentUser = credCollection.find( cred => cred.username === username );

    if ( !currentUser.isPresetToken ){
        currentUser.token = getTokenFromLocalStorage();
    }

    writeFileSync(credFilePath, JSON.stringify(credCollection));
}

exports.readToken = (username) => {
    const credCollection = JSON.parse(readFileSync('./e2e/creds.js'));
    const currentUserCreds = credCollection.find(cred => cred.username === username);
    return currentUserCreds['token'];
}

/*
* Navigates to baseUrl, inputs username and password
* And attempts to login
* @param { String } username
* @param { String } password
* @returns {null} returns nothing
*/
exports.login = (username, password, credFilePath) => {

    browser.url(constants.routes.linodes);
    try {
        browser.waitForVisible('#username', constants.wait.long);
    } catch (err) {
        console.log(browser.getSource());
    }

    browser.waitForVisible('#password', constants.wait.long);
    browser.trySetValue('#username', username);
    browser.trySetValue('#password', password);

    const loginButton = browser.getUrl().includes('dev') ? '.btn#submit' : '[data-qa-sign-in] input';
    const letsGoButton = browser.getUrl().includes('dev') ? '.btn#submit' : '[data-qa-welcome-button]';

    // Helper to check if on the Authorize 3rd Party App Income
    const isOauthAuthPage = () => {
        /**
         * looking to determine if we're on the oauth/auth page
         */
        try {
            browser.waitForVisible('.oauthauthorize-page', constants.wait.short);
            return true;
        } catch (err) {
            console.log('Not on the Oauth Page, continuing');
            return false;
        }
    }

    // Helper to check if CSRF error is displayed on the page
    const csrfErrorExists = () => {
        const sourceIncludesCSRF = browser.getSource().includes('CSRF');
        return sourceIncludesCSRF;
    };

    // Click the Login button
    browser.click(loginButton);

    const onOauthPage = isOauthAuthPage();
    const csrfError = csrfErrorExists();

    // If on the authorize page, click the authorize button
    if (onOauthPage) {
        $('.form-actions>.btn').click();
    }

    // If still on the login page, check for a form error
    if (csrfError) {
        // Attempt to Login after encountering the CSRF Error
        browser.trySetValue('#password', password);
        browser.trySetValue('#username', username);
        $(loginButton).click();
    }

    // Wait for the add entity menu to exist
    try {
        browser.waitForExist('[data-qa-add-new-menu-button]', constants.wait.normal);
    } catch (err) {
        console.log('Add an entity menu failed to exist', 'Failed to login to the Manager for some reason.');
        console.error(`Current URL is ${browser.getUrl()}`);
        console.error(`Page source: \n ${browser.getSource()}`);
    }

    // Wait for the welcome modal to display, click it once it appears
    if (browser.waitForVisible('[role="dialog"]')) {
        browser.click(letsGoButton);
        browser.waitForVisible('[role="dialog"]', constants.wait.long, true)
    }

    browser.waitForVisible('[data-qa-add-new-menu-button]', constants.wait.long);

    if (credFilePath) {
        exports.storeToken(credFilePath, username);
    }
}

exports.checkoutCreds = (credFilePath, specFile) => {
    let credCollection = JSON.parse(readFileSync(credFilePath));
    return credCollection.find((cred, i) => {
        if (!cred.inUse) {
            credCollection[i].inUse = true;
            credCollection[i].spec = specFile;
            browser.options.testUser = credCollection[i].username;
            writeFileSync(credFilePath, JSON.stringify(credCollection));
            return cred;
        }
=======
module.exports.readToken = () => {
    let token = null;
    browser.call(() => {
        return browser.credStore.readToken(browser.options.testUser).then((t) => token = t);
>>>>>>> aa9dec28f5b8cc095e1da60f974a7dfd064434c6
    });
    console.log(`token is ${token}`);
    return token;
}

module.exports.getToken = (username) => {
    let token = null;
    browser.call(() => {
        return browser.credStore.readToken(username).then((t) => token = t);
    });
    console.log(`token is ${token}`);
    return token;
}

/*
* Navigate to a null route on the manager,
* Add the token properties to local storage
* Navigate back to the homepage to be logged in
* @returns {Null} returns nothing
*/
// exports.loadToken = () => {
//     const tokenPath = '../../localStorage.json';
//     try {
//         const localStorageObj = require(tokenPath);
//         const keys = Object.keys(localStorageObj);

//         const storageObj = keys.map(key => {
//             return { [key]: localStorageObj[key] }
//         });

//         browser.url('/null');
//         browser.waitForText('#root > span:nth-child(1)');
//         browser.waitUntil(function() {
//             browser.execute(function(storageObj) {
//                 storageObj.forEach(item => {
//                     localStorage.setItem(Object.keys(item)[0], Object.values(item)[0]);
//                 });
//             }, storageObj);
//             browser.url('/null');
//             return browser.execute(function(storageObj) {
//                 return localStorage.getItem('authentication/oauth-token').includes(storageObj['authentication/oauth-token']) === true;
//             }, storageObj);
//         }, 10000);
//         browser.url(constants.routes.dashboard);
//         browser.waitForVisible('[data-qa-beta-notice]');
//         browser.click('[data-qa-beta-notice] button');
//     } catch (err) {
//         console.log(`${err} \n ensure that your local manager environment is running!`);
//     }
// }
