console.log("hello im js of certificate");
document.getElementById('cancelButton').addEventListener('click', function () {
  // Redirect to the "/Home" route
  window.location.href = '/Home';
});
document.addEventListener("DOMContentLoaded", function() {
  // Get a reference to the dropdown element
  var jobRoleDropdown = document.getElementById("jobRole");
  
  // Add an event listener for the 'change' event on the dropdown
  jobRoleDropdown.addEventListener("change", function(event) {
      // Get the selected value from the dropdown
      var selectedValue = event.target.value;
      
      // Call the checkCustomRole function with the selected value
      checkCustomRole(selectedValue);
  });
});
function checkCustomRole(value) {
  console.log("Selected value:", value);
  var customRoleInput = document.getElementById("customRoleInput");
  if (value === "Other") {
    console.log("Showing custom input field");
    customRoleInput.style.display = "block"; // Show the custom input field
  } else {
    console.log("Hiding custom input field");
    customRoleInput.style.display = "none"; // Hide the custom input field
  }
}