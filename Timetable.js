document.addEventListener('DOMContentLoaded', function() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBB-AAyUaHL_gBKaeKpSbwAmT9WqU7fcCw",
		authDomain: "personalprojects-44283.firebaseapp.com",
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

    // Rest of your existing code (renderTimetable, event listeners, etc.)
    // Keep all the other functions exactly the same as in the original script.js
    // Only replace the localStorage parts with the Firebase functions above
});