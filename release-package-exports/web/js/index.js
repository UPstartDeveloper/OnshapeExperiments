const exportDropdown = document.getElementById("exportDestinationField");
const googleDriveParams = document.getElementById("googleDriveParams");

exportDropdown.addEventListener("change", function() {

    if (exportDropdown.value === "googleDrive") {
        // display the fields
        googleDriveParams.classList.remove(["secondaryField"]);
    }

    // ... logic for other export destinations coming soon(?)
});