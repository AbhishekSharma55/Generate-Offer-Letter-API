const joiningDateInput = document.getElementById('joiningDate');
const endingDateInput = document.getElementById('endingDate');
const deletebutton = document.getElementById('deletebutton')

// Variables to store the values
let joiningDateValue = '';
let endingDateValue = '';

// Event listener for the joining date input field
joiningDateInput.addEventListener('change', function(event) {
    joiningDateValue = event.target.value;
    console.log('Joining Date:', joiningDateValue);
});

// Event listener for the ending date input field
endingDateInput.addEventListener('change', function(event) {
    console.log("data deleted in progress")
    endingDateValue = event.target.value;
    console.log('Ending Date:', endingDateValue);
});

