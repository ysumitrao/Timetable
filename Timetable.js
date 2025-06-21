document.addEventListener('DOMContentLoaded', function() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBB-AAyUaHL_gBKaeKpSbwAmT9WqU7fcCw",
	  authDomain: "personalprojects-44283.firebaseapp.com",
	  databaseURL: "https://personalprojects-44283-default-rtdb.asia-southeast1.firebasedatabase.app",
	  projectId: "personalprojects-44283",
	  storageBucket: "personalprojects-44283.firebasestorage.app",
	  messagingSenderId: "28495795339",
	  appId: "1:28495795339:web:5c6a9805bf146c10bff08e",
	  measurementId: "G-JWJR2XZQYX"
    };
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    
    // DOM elements
    const addClassBtn = document.getElementById('add-class');
    const daySelector = document.getElementById('day-selector');
    const modal = document.getElementById('class-modal');
    const closeBtn = document.querySelector('.close');
    const classForm = document.getElementById('class-form');
    
    let userId = localStorage.getItem('userId') || generateUserId();
    localStorage.setItem('userId', userId);
    let timetable = {};

    // Initialize timetable
    loadTimetable();

    // Generate unique user ID
    function generateUserId() {
        return 'user-' + Math.random().toString(36).substr(2, 9);
    }

    // Load timetable from Firebase
    function loadTimetable() {
        database.ref('timetables/' + userId).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                timetable = data;
            } else {
                // Initialize empty timetable
                timetable = {
                    monday: [], tuesday: [], wednesday: [], thursday: [], 
                    friday: [], saturday: [], sunday: []
                };
                saveTimetable();
            }
            renderTimetable();
        });
    }

    // Save timetable to Firebase
    function saveTimetable() {
        database.ref('timetables/' + userId).set(timetable);
    }

    // Function to render the timetable
    function renderTimetable() {
        // Clear all classes first
        document.querySelectorAll('.classes').forEach(list => {
            list.innerHTML = '';
        });
        
        // Add classes for each day
        for (const day in timetable) {
            const dayElement = document.getElementById(day);
            const classesList = dayElement.querySelector('.classes');
            
            timetable[day].forEach((classItem, index) => {
                const li = document.createElement('li');
                li.className = 'class-item';
                li.innerHTML = `
                    <h3>${classItem.name}</h3>
                    <p><strong>Time:</strong> ${formatTime(classItem.startTime)} - ${formatTime(classItem.endTime)}</p>
                    <p><strong>Location:</strong> ${classItem.location}</p>
                    <p><strong>Teacher:</strong> ${classItem.teacher}</p>
                    <div class="class-actions">
                        <button class="edit-btn" data-day="${day}" data-index="${index}">Edit</button>
                        <button class="delete-btn" data-day="${day}" data-index="${index}">Delete</button>
                    </div>
                `;
                classesList.appendChild(li);
            });
        }
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', editClass);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteClass);
        });
    }
    
    // Function to edit a class
    function editClass(e) {
        const day = e.target.getAttribute('data-day');
        const index = e.target.getAttribute('data-index');
        const classItem = timetable[day][index];
        
        // Set modal to edit mode
        document.getElementById('modal-title').textContent = 'Edit Class';
        document.getElementById('edit-index').value = index;
        document.getElementById('class-name').value = classItem.name;
        document.getElementById('start-time').value = classItem.startTime;
        document.getElementById('end-time').value = classItem.endTime;
        document.getElementById('location').value = classItem.location;
        document.getElementById('teacher').value = classItem.teacher;
        
        // Set the day selector to the correct day
        daySelector.value = day;
        
        // Show modal
        modal.style.display = 'block';
    }
    
    // Function to delete a class
    function deleteClass(e) {
        if (confirm('Are you sure you want to delete this class?')) {
            const day = e.target.getAttribute('data-day');
            const index = e.target.getAttribute('data-index');
            
            timetable[day].splice(index, 1);
            saveTimetable();
            renderTimetable();
        }
    }    
    
    
    // Helper function to format time (remove seconds)
    function formatTime(timeString) {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    }
});