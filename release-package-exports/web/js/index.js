const exportDropdown = document.getElementById("exportDestinationField");
const exportFormSubmitButton = document.getElementById("exportFormSubmitButton");
const googleDriveParams = document.getElementById("googleDriveParams");
const googleDriveEmail = document.getElementById("googleDriveEmailAddressId");
const googleDriveEmailMessage = document.getElementById("googleDriveEmailMessageId");

/**
 * Display an error message to the user.
 * 
 * @param {string} msg The error message to be displayed.
 */
const displayError = (msg) => {
    console.log('Error msg:', msg);
    const $viewport = document.getElementById('elem-selector');
    const $msgElem = document.createElement('p');
    $msgElem.style.color = 'red';
    $msgElem.style.font = 'italic';
    $msgElem.innerText = msg;
    $viewport.insertBefore($msgElem, $viewport.firstChild);
}

/**
 * Requests the email associated with the Onshape account, to use as a default for 
 * any relevant form fields.
 * 
 * @returns {string}
 */
const retrieveDefaultEmailAddress = async () => {
    let userEmail = "";
    try {
        document.body.style.cursor = 'progress';  // tell the user something's happening "in the background"
        const resp = await fetch(`/api/email`);
        const json = await resp.json();
        userEmail = json.email;
    } catch(err) {
        displayError(`Error requesting user's email address. Please fill it out manually. Error: ${err}`);
    }
    document.body.style.cursor = 'default';  // tell the user the "something" is over
    return userEmail;
};

exportDropdown.addEventListener("change", async function() {

    if (exportDropdown.value === "googleDrive") {
        // display the fields
        googleDriveParams.classList.remove(["secondaryField"]);
        googleDriveEmail.value = await retrieveDefaultEmailAddress();
    }
    else {
        // hide the non-relevant fields
        googleDriveParams.classList.add("secondaryField");
    }

    // ... logic for other export destinations coming soon(?)
});

exportFormSubmitButton.addEventListener("click", async function() {

    const resp = await fetch(
        // TODO[Zain]: in the future, grab the companyId from the json that gives the email, not query string
        `/api/notifications${window.location.search}`
        + `&exportDestination=${exportDropdown.value}`
        + `&emailAddress=${googleDriveEmail.value}`
        + `&emailMessage=${googleDriveEmailMessage.value}`
    );

    const json = await resp.json()
    if (Object.keys(json).includes("webhookID")) {
        // TODO[Zain]: make a green modal appear to show the user the notification is enabled
        console.log(`I have an ID! Here it is: ${json.webhookID}`);
    } else {
        // TODO[Zain]: if not, display an error - it should be a red modal
        console.log(`I have an error: ${resp.error}`);
    }


});