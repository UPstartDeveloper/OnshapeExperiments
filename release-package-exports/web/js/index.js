const exportDropdown = document.getElementById("exportDestinationField");
const googleDriveParams = document.getElementById("googleDriveParams");

exportDropdown.addEventListener("change", function() {

    if (exportDropdown.value === "googleDrive") {
        // display the fields
        googleDriveParams.classList.remove(["secondaryField"]);
    }
    else {
        // hide the non-relevant fields
        googleDriveParams.classList.add("secondaryField");
    }

    // ... logic for other export destinations coming soon(?)
});