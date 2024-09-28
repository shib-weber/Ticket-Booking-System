const socket = io(); 
socket.on('ticketUpdate', function (totalTickets) {
    // Update the total tickets sold in the 'totticket' div
    document.querySelector('.totticket').innerHTML = `
        <h2>Total Tickets Sold: ${totalTickets}</h2>
    `;
});

function createComet() {
    const comet = document.createElement('div');
    comet.className = 'comet';

    // Randomize the comet's horizontal position
    comet.style.left = Math.random() * window.innerWidth + 'px';

    document.body.appendChild(comet);

    // Remove the comet after the animation ends
    comet.addEventListener('animationend', () => {
        comet.remove();
    });
}

// Create a comet every 1.5 seconds
setInterval(createComet, 1500);

function createTiles() {
    const background = document.querySelector('.tiled-background');
    const numberOfTiles = Math.ceil((window.innerWidth / 24) * (window.innerHeight / 25)) + 4; // Calculate the number of tiles based on screen size

    for (let i = 0; i < numberOfTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        background.appendChild(tile);
    }
}

createTiles(); 

function toggleSidePanel() {
    const panel = document.getElementById('sidePanel');
    panel.classList.toggle('open');
}


async function fetchTicketStats() {
    const response = await fetch('/api/admin/ticket-stats');
    const data = await response.json();
    return data.map(ticket => ({
        date: ticket._id,
        count: ticket.tickets
    }));
}

async function initChart() {
    const ticketStats = await fetchTicketStats();
    const ctx = document.getElementById('ticketChart').getContext('2d');
    const ticketChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ticketStats.map(stat => stat.date),
            datasets: [{
                label: 'Number of Tickets Booked',
                data: ticketStats.map(stat => stat.count),
                backgroundColor: '#00d8f5',
                borderColor: 'black',
                borderWidth: 1,
                barThickness: 50, 
                categoryPercentage: 0.9, 
                barPercentage: 0.8,
            }]
        },
        options: {
            scales: {
                x:{
                    beginAtZero:true,
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    

    socket.on('update-ticket-stats', (updatedStats) => {
        const updatedData = updatedStats.map(stat => ({
            date: stat._id,
            count: stat.tickets
        }));

        ticketChart.data.labels = updatedData.map(stat => stat.date);
        ticketChart.data.datasets[0].data = updatedData.map(stat => stat.count);
        ticketChart.update();
    });
}



document.getElementById('logout').addEventListener('click', async () => {
    await fetch('/api/admin/logout');
    window.location.href = 'login';
});

initChart();

async function fetchTicketStats2() {
    const response = await fetch('/api/admin/ticket-stats2');
    const data = await response.json();
    return data.map(ticket => ({
        date: ticket._id,
        count: ticket.tickets
    }));
}

async function initChart2() {
    const ticketStats = await fetchTicketStats2();
    const ctx = document.getElementById('ticketChart2').getContext('2d');
    const ticketChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ticketStats.map(stat => stat.date),
            datasets: [{
                label: 'Number of Tickets Booked',
                data: ticketStats.map(stat => stat.count),
                backgroundColor: '#00ff2a', 
                borderColor: 'black',
                borderWidth: 1,
                barThickness: 50, 
                categoryPercentage: 0.8, 
                barPercentage: 0.9,
            }]
        },
        options: {

            scales: {
                x:{
                    beginAtZero:false,
                    grid: {
                        display: false 
                    },


                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    

    socket.on('update-ticket-stats2', (updatedStats) => {
        const updatedData = updatedStats.map(stat => ({
            date: stat._id,
            count: stat.tickets
        }));

        ticketChart.data.labels = updatedData.map(stat => stat.date);
        ticketChart.data.datasets[0].data = updatedData.map(stat => stat.count);
        ticketChart.update();
    });
}


initChart2();

document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.querySelector('#searchi');
    const userTable = document.getElementById('userTable');
    let timeout;

    searchBar.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const query = searchBar.value.trim();
            if (query.length > 0) {
                searchUsers(query);
            } else {
                fetchAllUsers();
            }
        }, 300);
    });

    async function fetchAllUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const categorizedUsers = await response.json();
            categorizedUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            userTable.innerHTML = '';

            if (typeof categorizedUsers === 'object') {
                for (const category in categorizedUsers) {
                    let users = categorizedUsers[category];

                    if (!Array.isArray(users)) {
                        users = [users];
                    }

                    const table = createUserTable();
                    users.forEach(user => {
                        const row = createUserRow(user);
                        table.querySelector('tbody').appendChild(row);
                    });

                    userTable.appendChild(table);
                }
            } else {
                console.error('Expected an object for categorized users, but received:', categorizedUsers);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    async function searchUsers(query) {
        try {
            const response = await fetch(`/api/admin/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            userTable.innerHTML = '';

            if (data.length === 0) {
                userTable.innerHTML = '<p>No results found</p>';
            } else {
                const table = createUserTable();
                data.forEach(user => {
                    const row = createUserRow(user);
                    table.querySelector('tbody').appendChild(row);
                });
                userTable.appendChild(table);
            }
        } catch (error) {
            console.error('Error fetching search results:', error);
            userTable.innerHTML = '<p>Error fetching search results</p>';
        }
    }

    function createUserTable() {
        const table = document.createElement('table');
        const tableHeader = `
            <thead>
                <tr>
                    <th>Event Date</th>
                    <th>Price</th>
                    <th>No. Of Tickets</th>
                    <th>Name</th>
                    <th>Mobile No.</th>
                    <th>Email</th>
                    <th>Coupon Code</th>
                    <th>Token</th>
                    <th>Transaction Id</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        table.innerHTML = tableHeader;
        return table;
    }

    function createUserRow(user) {
        const row = document.createElement('tr');
        const date=new Date(user.date).toLocaleDateString()

        row.innerHTML = `
            <td>${date}</td>
            <td>${user.price}</td>
            <td>${user.tickets}</td>
            <td>${user.name}</td>
            <td>${user.phone}</td>
            <td>${user.email}</td>
            <td>${user.discountCode || 'N/A'}</td>
            <td>${user.Token || 'N/A'}</td>
            <td>${user.transactionid ? 'Yes' : 'No'}</td>
        `;
        return row;
    }

    // Replace the previous filter button logic with filter icon and options
    document.querySelector('#filterIcon').addEventListener('click', () => {
        const dateOptions = document.getElementById('dateOptions');
        dateOptions.style.display = dateOptions.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('.date-option').forEach(button => {
        button.addEventListener('click', async () => {
            const selectedDate = button.getAttribute('data-date');
            await filterUsersByDate(selectedDate); // Use the filter function
            document.getElementById('dateOptions').style.display = 'none'; // Hide options after selection
        });
    });

    async function filterUsersByDate(selectedDate) {
        try {
            const response = await fetch(`/api/admin/userf?eventDate=${encodeURIComponent(selectedDate)}`);
            const data = await response.json();

            userTable.innerHTML = ''; // Clear the user table before displaying the filtered data

            if (data.length === 0) {
                userTable.innerHTML = '<p>No users found for the selected date.</p>';
            } else {
                const table = createUserTable();
                data.forEach(user => {
                    const row = createUserRow(user);
                    table.querySelector('tbody').appendChild(row);
                });
                userTable.appendChild(table);
            }
        } catch (error) {
            console.error('Error fetching users by date:', error);
            userTable.innerHTML = '<p>Error fetching users for the selected date</p>';
        }
    }
        // Call fetchAllUsers initially to load all users on page load
        fetchAllUsers();
        document.getElementById('removeFilter').addEventListener('click', async () => {
            await fetchAllUsers(); // Fetch all users to remove the filter
            document.getElementById('dateOptions').style.display = 'none'; // Hide options
        });
})

document.querySelector('#downloadExcel').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/admin/download/excel');
        if (!response.ok) {
            throw new Error('Failed to download Excel file');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        console.error('Error downloading Excel:', error);
    }
});
document.querySelector('#downloadExcelCoupon').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/admin/download/excelCoupon');
        if (!response.ok) {
            throw new Error('Failed to download Excel file');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'coupon.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        console.error('Error downloading Excel:', error);
    }
});

document.querySelector('#downloadPDF').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/admin/download/pdf');
        if (!response.ok) {
            throw new Error('Failed to download PDF file');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        console.error('Error downloading PDF:', error);
    }
});

document.querySelector('#downloadPDFCoupon').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/admin/download/pdfCoupon');
        if (!response.ok) {
            throw new Error('Failed to download PDF file');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'coupons.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        console.error('Error downloading PDF:', error);
    }
});


async function controlBooking(action, date) {
    try {
        const response = await fetch('/api/admin/control-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, date })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to change booking status.');
    }
}

// Function to initialize toggle button state
async function initializeToggleButton(inputId, date) {
    const checkbox = document.getElementById(inputId);

    try {
        const response = await fetch(`/api/admin/booking-status/${date}`);
        const data = await response.json();

        checkbox.checked = data.bookingEnabled; // Set checkbox state based on booking status

        // Add event listener to handle changes
        checkbox.addEventListener('change', () => {
            const action = checkbox.checked ? 'start' : 'stop';
            controlBooking(action, date); // Save the toggle state
        });
    } catch (error) {
        console.error('Error fetching booking status:', error);
        alert('Failed to load booking status.');
    }
}

// On page load, set the state of each toggle button
window.addEventListener('DOMContentLoaded', () => {
    initializeToggleButton('toggleBooking_10Oct', '2024-10-10');
    initializeToggleButton('toggleBooking_11Oct', '2024-10-11');
    initializeToggleButton('toggleBooking_12Oct', '2024-10-12');
});



document.querySelectorAll('#dates button').forEach(button => {
    button.addEventListener('click', (e) => {
        const selectedDate = e.target.getAttribute('data-date');
        document.getElementById('maxBookingsdate').value = selectedDate;
    });
});

// Handle Set Max Bookings Button click
document.getElementById('setMaxBookingsButton').addEventListener('click', async () => {
    const maxBookings = document.getElementById('maxBookingsInput').value;
    const date = document.getElementById('maxBookingsdate').value;

    if (!date || !maxBookings) {
        alert('Please select a date and enter the max bookings');
        return;
    }

    try {
        const response = await fetch('/api/admin/set-max-bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maxBookings, date }),
        });

        if (!response.ok) {
            throw new Error('Failed to set max bookings');
        }

        const data = await response.json();
        alert(data.message);

        // Display the limit and clear inputs
        document.getElementById('limitDisplay').innerText = `Max bookings for ${date}: ${maxBookings}`;
        document.getElementById('maxBookingsInput').value = '';
        document.getElementById('maxBookingsdate').value = '';
    } catch (error) {
        console.error('Error setting max bookings:', error);
        alert('An error occurred while setting max bookings.');
    }
});

async function generateCoupon() {
    const couponCode = document.getElementById('couponCode').value;
    const uses = document.getElementById('uses').value;
    let date = document.getElementById('date').value;
    const discount = document.getElementById('discount').value;

    console.log("Selected Date:", date);

    // Simple validation to ensure coupon code is 6 digits and other fields are filled
    if (!couponCode || couponCode.length !== 6) {
        alert('Please enter a valid 6-digit coupon code.');
        return;
    }

    if (!uses || uses <= 0) {
        alert('Please enter a valid number of uses.');
        return;
    }

    if (!discount || discount <= 0) {
        alert('Please enter a valid discount.');
        return;
    }

    try {
        const response = await fetch('/api/admin/generate-coupons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: couponCode,
                uses: parseInt(uses),
                discount: parseFloat(discount),
                date: date, // Ensure the date is sent in the correct format
            }),
        });

        const result = await response.json();
        if (result.success) {
            document.getElementById('couponCode').value='';
            document.getElementById('uses').value='';
            document.getElementById('date').value='';
            document.getElementById('discount').value='';
            const couponDisplay = document.getElementById('couponDisplay');
            couponDisplay.innerHTML += `
                <tr>
                    <td>${result.coupon.date}</td>
                    <td>${result.coupon.uses}</td>
                    <td>${result.coupon.discount}</td>
                    <td>${result.coupon.code}</td>
                    <td>
                        <label class="switch">
                            <input class="toggle-coupon" type="checkbox" data-id="${result.coupon._id}" ${result.coupon.isenabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </td>
                </tr>
            `;
        } else {
            alert('Failed to generate coupon');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating coupon');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('Generate').addEventListener('click', generateCoupon);
});




document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const dateDropdown = document.getElementById('dateDropdown');

    // Show dropdown on input field click
    dateInput.addEventListener('click', () => {
        dateDropdown.style.display = 'block';
    });

    // Hide dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!dateInput.contains(event.target) && !dateDropdown.contains(event.target)) {
            dateDropdown.style.display = 'none';
        }
    });

    // Handle date selection
// Assuming this code is inside your existing dropdown setup
document.querySelectorAll('.date-option').forEach(button => {
    button.addEventListener('click', () => {
        const selectedDate = button.getAttribute('data-date');
        dateInput.value = selectedDate; // Set the input value
        dateDropdown.style.display = 'none'; // Hide the dropdown
    });
});

});

document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById('imageInput');
    const formData = new FormData();
  
    if (fileInput.files.length > 0) {
      formData.append('image', fileInput.files[0]);
    } else {
      console.error('No file selected');
      return;
    }

    for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }
  
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  });
// Function to fetch and display uploaded images from MongoDB
async function loadUploadedImages() {
    try {
        const response = await fetch('/api/admin/images');
        const images = await response.json();
        console.log(images);

        const uploadedImagesDiv = document.getElementById('uploadedImages');
        uploadedImagesDiv.innerHTML = ''; // Clear previous images

        images.forEach(image => {
            const imgContainer = document.createElement('div');
            const img = document.createElement('img');
            const deleteButton = document.createElement('button');

            img.src = image.url; // Use the correct URL from the response
            img.style.width = '100px';
            img.style.height = '100px';

            deleteButton.innerText = 'Delete';
            deleteButton.onclick = () => deleteImage(image.filename); // Call delete function with filename

            imgContainer.appendChild(img);
            imgContainer.appendChild(deleteButton);
            uploadedImagesDiv.appendChild(imgContainer);
        });
    } catch (error) {
        console.error('Error fetching images:', error);
    }
}

// Function to delete an image
async function deleteImage(filename) {
    try {
        const response = await fetch(`/api/admin/delete/${filename}`, {
            method: 'DELETE',
        });

        const result = await response.json();
        if (response.ok) {
            alert('Image deleted successfully!');
            loadUploadedImages(); // Refresh the images after deletion
        } else {
            alert(result.message || 'Error deleting image');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
    }
}


loadUploadedImages();


document.querySelectorAll('.toggle-coupon').forEach(toggle => {
    toggle.addEventListener('change', function() {
        const couponId = this.getAttribute('data-id');
        const newStatus = this.checked;

        // Make a fetch request to update the database
        fetch('/api/admin/coupons-toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: couponId,
                isenabled: newStatus
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Coupon updated successfully');
            } else {
                console.error('Error updating coupon');
            }
        });
    });
});

/*async function totals(){
    const response=await fetch('/api/admin/totals');
    const totalss=await response.json()
    document.querySelector('.totticket').innerHTML = `
             <h2>Total Tickets Sold: ${totalss.sum}</h2>
             <h2>Total Amount : ${totalss.price}</h2>
             `

}
*/


