let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show your custom install button
  const installBtn = document.createElement('button');
  installBtn.textContent = 'Install App';
  installBtn.classList.add('install-btn');
  document.body.appendChild(installBtn);
  
  installBtn.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        console.log('User accepted install');
      }
      deferredPrompt = null;
    });
  });
});

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
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    // DOM elements
    const authBtn = document.getElementById('auth-btn');
    const authText = document.getElementById('auth-text');
    const userProfile = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const signOutBtn = document.getElementById('sign-out-btn');
    const addClassBtn = document.getElementById('add-class');
    const daySelector = document.getElementById('day-selector');
    const modal = document.getElementById('class-modal');
    const shareModal = document.getElementById('share-modal');
    const closeBtns = document.querySelectorAll('.close');
    const classForm = document.getElementById('class-form');
    const shareBtn = document.getElementById('share-btn');
    const shareUrlInput = document.getElementById('share-url');
    const copyLinkBtn = document.getElementById('copy-link');
    const publicCheckbox = document.getElementById('public-checkbox');
    const days = document.querySelectorAll('.day');

    // App state
    let timetable = initializeEmptyTimetable();
    let currentUser = null;
    let isViewingShared = false;
    let sharedUserId = null;

    // Initialize the app
    initAuth();

    // Initialize empty timetable structure
    function initializeEmptyTimetable() {
        return {
            monday: [], tuesday: [], wednesday: [], thursday: [], 
            friday: [], saturday: [], sunday: [],
            isPublic: false,
            lastUpdated: firebase.database.ServerValue.TIMESTAMP
        };
    }

    // Initialize authentication
    function initAuth() {
        // Listen for auth state changes
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                currentUser = user;
                showUserProfile(user);
                checkSharedTimetable();
                loadTimetable();
            } else {
                // User is signed out
                currentUser = null;
                showAuthButton();
                
                // Check if we're viewing a shared timetable
                if (!isViewingShared) {
                    authBtn.classList.remove('hidden');
                }
            }
        });

        // Set up auth button
        authBtn.addEventListener('click', signInWithGoogle);
        signOutBtn.addEventListener('click', signOut);
    }

    // Google Sign-In
    function signInWithGoogle() {
        auth.signInWithPopup(provider)
            .then(result => {
                // User signed in
            })
            .catch(error => {
                console.error("Sign in error:", error);
                alert("Sign in failed. Please try again.");
            });
    }

    // Sign Out
    function signOut() {
        auth.signOut().then(() => {
            if (isViewingShared) {
                // If viewing shared timetable, reload to view same shared timetable
                window.location.href = getShareUrl(sharedUserId);
            } else {
                // Otherwise go to home
                window.location.href = window.location.origin + window.location.pathname;
            }
        });
    }

    // Show user profile when signed in
    function showUserProfile(user) {
        authBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        
        // Update profile info
        userName.textContent = user.displayName || "User";
        if (user.photoURL) {
            userAvatar.src = user.photoURL;
            userAvatar.classList.remove('hidden');
        } else {
            userAvatar.classList.add('hidden');
        }
    }

    // Show auth button when signed out
    function showAuthButton() {
        authBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }

    // Check if we're viewing a shared timetable
    function checkSharedTimetable() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        
        if (shareId && (!currentUser || currentUser.uid !== shareId)) {
            isViewingShared = true;
            sharedUserId = shareId;
            loadSharedTimetable(shareId);
            updateUIForSharedView();
        } else {
            isViewingShared = false;
            sharedUserId = null;
        }
    }

    // Update UI for shared view
    function updateUIForSharedView() {
        addClassBtn.disabled = true;
        shareBtn.disabled = true;
        
        // Change header
        document.querySelector('h1').textContent += " (Shared)";
        
        // Show notice if viewing private shared timetable
        if (!timetable.isPublic && currentUser) {
            showPrivateShareNotice();
        }
    }

    // Load user's timetable
    function loadTimetable() {
        if (!currentUser) return;
        
        database.ref('timetables/' + currentUser.uid).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                timetable = {
					...initializeEmptyTimetable(),
					...data
				};
            } else {
                // Initialize empty timetable if none exists
                timetable = initializeEmptyTimetable();
                saveTimetable();
            }
            renderTimetable();
        }, (error) => {
            console.error("Error loading timetable:", error);
            alert("Error loading your timetable. Please try again later.");
        });
    }

    // Load shared timetable
    function loadSharedTimetable(userId) {
        database.ref('timetables/' + userId).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && (data.isPublic || currentUser)) {
                timetable = data;
                renderTimetable();
            } else {
                handleTimetableUnavailable();
            }
        }, (error) => {
            console.error("Error loading shared timetable:", error);
            alert("Error loading this timetable. Please try again later.");
        });
    }

    function handleTimetableUnavailable() {
        alert("This timetable is not available. It may be private or deleted.");
        window.location.href = window.location.origin + window.location.pathname;
    }

    // Show notice for private shared timetable
    function showPrivateShareNotice() {
        const notice = document.createElement('div');
        notice.className = 'notice';
        notice.innerHTML = `
            <p>You're viewing a private timetable shared with you.</p>
            <p>Sign in as the owner to make changes.</p>
        `;
        document.querySelector('.container').prepend(notice);
    }

    // Save timetable to Firebase
    function saveTimetable() {
        if (!currentUser) return;
        
        // Update timestamp
        timetable.lastUpdated = firebase.database.ServerValue.TIMESTAMP;
        
        database.ref('timetables/' + currentUser.uid).set(timetable)
            .catch((error) => {
                console.error("Error saving timetable:", error);
                alert("Error saving your timetable. Please try again.");
            });
    }

    // Get shareable URL
    function getShareUrl(userId) {
        return `${window.location.origin}${window.location.pathname}?share=${userId}`;
    }

    // Set up share functionality
    shareBtn.addEventListener('click', function() {
        if (!currentUser) {
            alert("Please sign in to share your timetable");
            return;
        }
        
        shareUrlInput.value = getShareUrl(currentUser.uid);
        publicCheckbox.checked = timetable.isPublic || false;
        shareModal.style.display = 'block';
    });

    // Copy share link
    copyLinkBtn.addEventListener('click', function() {
        shareUrlInput.select();
        document.execCommand('copy');
        
        // Show copied feedback
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = originalText;
        }, 2000);
    });

    // Update public status
    publicCheckbox.addEventListener('change', function() {
        timetable.isPublic = this.checked;
        saveTimetable();
    });

    // Close modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            modal.style.display = 'none';
            shareModal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });

    // Show modal when add class button is clicked
    addClassBtn.addEventListener('click', function() {
        if (isViewingShared) {
            alert("You can't modify a shared timetable");
            return;
        }
        
        document.getElementById('modal-title').textContent = 'Add Class';
        document.getElementById('edit-index').value = '';
        classForm.reset();
        modal.style.display = 'block';
    });

    // Handle form submission
    classForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (isViewingShared) {
            alert("You can't modify a shared timetable");
            return;
        }
        
        const className = document.getElementById('class-name').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const editIndex = document.getElementById('edit-index').value;
        const selectedDay = daySelector.value;
        
        const classData = {
            name: className,
            startTime: startTime,
            endTime: endTime
        };
        
		if (!timetable[selectedDay]) {
			timetable[selectedDay] = [];
		}
	
        if (editIndex === '') {
            // Add new class
            timetable[selectedDay].push(classData);
        } else {
            // Edit existing class
            timetable[selectedDay][editIndex] = classData;
        }
        
        // Save to Firebase and re-render
        saveTimetable();
        
        // Close modal
        modal.style.display = 'none';
    });

    // Function to render the timetable
    function renderTimetable() {
        // Clear all classes first
        document.querySelectorAll('.classes').forEach(list => {
            list.innerHTML = '';
        });
        
        // Add classes for each day
        for (const day in timetable) {
            // Skip metadata fields
            if (day === 'isPublic' || day === 'lastUpdated') continue;
            
            const dayElement = document.getElementById(day);
            if (!dayElement) continue;
            
            const classesList = dayElement.querySelector('.classes');
            
            timetable[day].forEach((classItem, index) => {
                const li = document.createElement('li');
                li.className = 'class-item';
                li.innerHTML = `
                    <h3>${classItem.name}</h3>
                    <p><strong>Time:</strong> ${formatTime(classItem.startTime)} - ${formatTime(classItem.endTime)}</p>                    
                    <div class="class-actions">
                        <button class="edit-btn" data-day="${day}" data-index="${index}" ${isViewingShared ? 'disabled' : ''}>Edit</button>
                        <button class="delete-btn" data-day="${day}" data-index="${index}" ${isViewingShared ? 'disabled' : ''}>Delete</button>
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
        if (isViewingShared) return;
        
        const day = e.target.getAttribute('data-day');
        const index = e.target.getAttribute('data-index');
        const classItem = timetable[day][index];
        
        // Set modal to edit mode
        document.getElementById('modal-title').textContent = 'Edit Class';
        document.getElementById('edit-index').value = index;
        document.getElementById('class-name').value = classItem.name;
        document.getElementById('start-time').value = classItem.startTime;
        document.getElementById('end-time').value = classItem.endTime;
        
        // Set the day selector to the correct day
        daySelector.value = day;
        
        // Show modal
        modal.style.display = 'block';
    }

    // Function to delete a class
    function deleteClass(e) {
        if (isViewingShared) return;
        
        if (confirm('Are you sure you want to delete this class?')) {
            const day = e.target.getAttribute('data-day');
            const index = e.target.getAttribute('data-index');
            
            timetable[day].splice(index, 1);
            saveTimetable();
        }
    }

    // Helper function to format time (remove seconds)
    function formatTime(timeString) {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    }
});