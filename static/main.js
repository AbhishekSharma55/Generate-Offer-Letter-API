
function loadMore() {
    const nextPage = currentPage + 1;
    fetch(`/dynamic-search?page=${nextPage}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                currentPage = nextPage;
                appendDataToTable(data);
            } else {
                // No more data, hide the Load More button
                loadMoreBtn.style.display = 'none';
            }
        })
        .catch(error => console.error('Error:', error));
}
document.addEventListener('DOMContentLoaded', () => {
    let counter = 0; // Counter for tracking the sno locally
    let currentPage = 1; // Current page
    const tableBody = document.getElementById('searchResultsBody');

    // Function to append new data to the table
    function appendDataToTable(newData) {
        // newData.reverse(); // Reverse the order of the new data
        newData.forEach(item => {
            const newRow = tableBody.insertRow();
            counter++; // Increment the counter
            newRow.innerHTML = `
                <td>${counter}</td>
                <td>${item.name}</td>
                <td>${item.role}</td>
                <td>${item.from}</td>
                <td>${item.to}</td>
                <td>${item.email}</td>
                <td>${item.referenceno}</td>
                <td><a href="/update/${item._id}">Update</a></td>
                <td><a href="/download/${item._id}">Download</a></td>
            `;

        });
    }

    // Function to handle initial load or search results load
    function loadPage(data) {
        tableBody.innerHTML = ''; // Clear existing table data
        counter = 0; // Reset the counter on each load
        if (data.length === 0) {
            const newRow = tableBody.insertRow();
            const cell = newRow.insertCell(0);
            cell.colSpan = 8;
            cell.textContent = 'No results found';
            loadMoreBtn.style.display = 'none'; // Hide Load More button
        } else {
            appendDataToTable(data);
            // Show Load More button
            loadMoreBtn.style.display = 'block';
        }
    }

    // Initial load on page load
    fetch('/dynamic-search?page=1')
        .then(response => response.json())
        .then(data => {
            // Get the table body element
            const tbody = document.querySelector('#data-table tbody');

            // Clear existing rows
            tbody.innerHTML = '';

            // Populate the table with data
            loadPage(data);
        })
        .catch(error => console.error('Error fetching data:', error));

    // Event listener for dynamic searching
    document.querySelector('input[name="searchName"]').addEventListener('input', function () {
        const inputValue = this.value;
        if (inputValue.trim() !== '') {
            fetch(`/dynamic-search?name=${encodeURIComponent(inputValue)}&page=1`)
                .then(response => response.json())
                .then(data => {
                    loadPage(data);
                })
                .catch(error => console.error('Error:', error));
        }
    });

    // Assign the loadMore function to the button click event
    loadMoreBtn.addEventListener('click', loadMore);
});
// Function to show the notification panel
function showNotification(message) {
    console.log(message);
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationMessage = document.getElementById('notificationMessage');

    notificationMessage.innerText = message;
    notificationPanel.classList.remove('hidden');

    // Hide the notification panel after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Function to hide the notification panel
function hideNotification() {
    const notificationPanel = document.getElementById('notificationPanel');
    notificationPanel.classList.add('hidden');
}

// Event listener for hiding the notification panel on click
document.addEventListener('DOMContentLoaded', () => {
    const notificationPanel = document.getElementById('notificationPanel');
    notificationPanel.addEventListener('click', hideNotification);
});

// ... (existing main.js content) ...
// JavaScript to add and remove the classes for triggering the animation
const notificationPanel = document.getElementById('notificationPanel');

// Show the notification panel
notificationPanel.classList.add('animated', 'show');

// After 10 seconds, hide the notification panel
setTimeout(() => {
    notificationPanel.classList.remove('show');
}, 100); // 10 seconds in milliseconds