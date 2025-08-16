// Global variables
let courses = [];
let testResults = [];
let currentSection = 'student';
let currentUser = null;
let selectedRole = null;
let verificationCode = generateVerificationCode(); // Generate once when script loads
let pendingUser = null;
let activeNotification = null; // Track active notification

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    // Initialize file input handler for lecturer section
    initializeFileInputHandler();
});

function initializeFileInputHandler() {
    const fileInput = document.getElementById('course-file');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const files = this.files;
            const fileList = document.getElementById('file-list');
            
            if (files.length > 0) {
                let fileNames = [];
                for (let i = 0; i < files.length; i++) {
                    fileNames.push(files[i].name);
                }
                fileList.innerHTML = 'Selected files:<br>' + fileNames.join('<br>');
            } else {
                fileList.innerHTML = '';
            }
        });
    }
}

// Check if user is already logged in
function checkUserSession() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showMainApp();
    } else {
        showSignupPage();
    }
}

// Show signup page
function showSignupPage() {
    document.getElementById('signup-page').style.display = 'flex';
    document.getElementById('signin-page').style.display = 'none';
    document.getElementById('main-app').classList.remove('show');
}

// Show signin page
function showSigninPage() {
    document.getElementById('signup-page').style.display = 'none';
    document.getElementById('signin-page').style.display = 'flex';
    document.getElementById('main-app').classList.remove('show');
}

// Show main application
function showMainApp() {
    document.getElementById('signup-page').style.display = 'none';
    document.getElementById('signin-page').style.display = 'none';
    document.getElementById('main-app').classList.add('show');
    
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        
        // Show/hide sections based on user role
        const lecturerBtn = document.querySelector('[onclick="showSection(\'lecturer\')"]');
        const lecturerSection = document.getElementById('lecturer-section');
        const resultsBtn = document.querySelector('[onclick="showSection(\'results\')"]');
        
        if (currentUser.role === 'student') {
            lecturerBtn.style.display = 'none';
            lecturerSection.style.display = 'none';
            resultsBtn.style.display = 'block';
            showSection('student');
        } else {
            lecturerBtn.style.display = 'block';
            lecturerSection.style.display = 'block';
            resultsBtn.style.display = 'none';
            showSection('lecturer');
        }
    }
    
    loadCourses();
    loadTestResults();
    displayCourses();
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁';
    }
}

// Generate verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email (simulated)
function sendVerificationEmail(email) {
    // In a real application, this would send an actual email
    console.log(`Verification code for ${email}: ${verificationCode}`);
    showNotification(`Verification code sent to ${email}. You Here. Write this code as your verification code; Do not Share with anyone!: ${verificationCode}`, 'success', true);
}

// Resend verification code
function resendVerificationCode() {
    if (pendingUser) {
        sendVerificationEmail(pendingUser.email);
    }
}

// Verify email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Select role during signup
function selectRole(role) {
    selectedRole = role;
    
    // Remove previous selections
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked role
    document.getElementById(role + '-role').classList.add('selected');
}

// Handle signup form submission
function handleSignUp(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const verificationCodeInput = document.getElementById('verification-code').value;
    
    // If email verification is not yet shown, validate and initiate verification
    if (document.getElementById('email-verification').style.display === 'none') {
        // Validate inputs
        if (!fullName || !email || !password || !confirmPassword || !selectedRole) {
            showNotification('Please fill in all fields and select a role.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match.', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters long.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }
        
        // Check if email already exists
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (existingUsers.some(user => user.email === email)) {
            showNotification('An account with this email already exists.', 'error');
            return;
        }
        
        // Create pending user and start email verification
        pendingUser = {
            id: Date.now(),
            name: fullName,
            email: email,
            password: password,
            role: selectedRole,
            joinDate: new Date().toLocaleDateString()
        };
        
        sendVerificationEmail(email);
        
        // Show email verification section
        document.getElementById('email-verification').style.display = 'block';
        document.getElementById('signup-submit').textContent = 'Verify & Create Account';
        
        return;
    }
    
    // If email verification is shown, verify the code
    if (!verificationCodeInput || verificationCodeInput.length !== 6) {
        showNotification('Please enter the 6-digit verification code', 'error');
        return;
    }
    
    if (verificationCodeInput !== verificationCode) {
        showNotification('Invalid verification code. Please try again.', 'error');
        return;
    }
    
    // Email verified successfully, create the account
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    existingUsers.push(pendingUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Set current user
    currentUser = pendingUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Reset form and variables
    pendingUser = null;
    verificationCode = generateVerificationCode(); // Generate new code for next registration
    
    showNotification('Email verified! Account created successfully! Welcome to Saint David Institute!', 'success');
    
    setTimeout(() => {
        showMainApp();
    }, 2000);
}

// Handle signin form submission
function handleSignIn(event) {
    event.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    // Validation
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Check if user exists
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = existingUsers.find(u => u.email === email);
    
    if (!user) {
        showNotification('No account found with this email address', 'error');
        return;
    }
    
    if (user.password !== password) {
        showNotification('Incorrect password', 'error');
        return;
    }
    
    // Login successful
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showNotification(`Welcome back, ${user.name}!`, 'success');
    
    setTimeout(() => {
        showMainApp();
    }, 1500);
}

// Show login (navigate to sign in page)
function showLogin() {
    showSigninPage();
}

// Show signup (navigate to sign up page)
function showSignup() {
    // Reset the signup form
    document.getElementById('email-verification').style.display = 'none';
    document.getElementById('signup-submit').textContent = 'Create Account';
    document.getElementById('fullName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('verification-code').value = '';
    
    // Clear role selection
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('selected');
    });
    selectedRole = null;
    
    // Reset pending user data
    pendingUser = null;
    verificationCode = generateVerificationCode();
    
    showSignupPage();
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        showSignupPage();
        showNotification('Logged out successfully', 'success');
    }
}

// Show different sections
function showSection(section) {
    // Check if user has permission
    if (section === 'lecturer' && currentUser.role === 'student') {
        showNotification('Access denied. Only lecturers can access this section.', 'error');
        return;
    }
    
    if (section === 'results' && currentUser.role === 'lecturer') {
        showNotification('Students only section.', 'error');
        return;
    }
    
    currentSection = section;
    
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') === `showSection('${section}')`) {
            btn.classList.add('active');
        }
    });
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    
    // Show selected section
    document.getElementById(section + '-section').classList.add('active');
    
    // Load appropriate content
    if (section === 'student') {
        displayCourses();
    } else if (section === 'results') {
        displayStudentResults();
    } else if (section === 'lecturer') {
        displayManageCourses();
        displayManageResults();
    }
}

// Upload course function
function uploadCourse() {
    const title = document.getElementById('course-title').value;
    const lecturer = document.getElementById('lecturer-name').value;
    const level = document.getElementById('course-level').value;
    const description = document.getElementById('course-description').value;
    const fileInput = document.getElementById('course-file');
    const files = fileInput.files;

    // Validation
    if (!title || !lecturer || !level || !description || files.length === 0) {
        showNotification('Please fill in all fields and select at least one file.', 'error');
        return;
    }

    // Process files
    const courseFiles = [];
    const filePromises = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                courseFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content: e.target.result,
                    lastModified: file.lastModified
                });
                resolve();
            };
            reader.readAsDataURL(file);
        });
        filePromises.push(filePromise);
    }

    // Wait for all files to be processed
    Promise.all(filePromises).then(() => {
        const course = {
            id: Date.now(),
            title: title,
            lecturer: lecturer,
            level: level,
            description: description,
            files: courseFiles,
            uploadDate: new Date().toLocaleDateString(),
            downloads: 0
        };

        courses.push(course);
        saveCourses();
        
        // Clear form
        document.getElementById('course-title').value = '';
        document.getElementById('course-description').value = '';
        document.getElementById('course-level').value = '';
        fileInput.value = '';
        document.getElementById('file-list').innerHTML = '';
        
        showNotification('Course uploaded successfully!', 'success');
        displayManageCourses();
        
        // If student is viewing courses, refresh their view
        if (currentSection === 'student') {
            displayCourses();
        }
    }).catch(error => {
        console.error('Error processing files:', error);
        showNotification('Error processing files. Please try again.', 'error');
    });
}

// Upload test results function
function uploadTestResults() {
    const testTitle = document.getElementById('test-title').value;
    const testCourse = document.getElementById('test-course').value;
    const testLevel = document.getElementById('test-level').value;
    const resultsData = document.getElementById('results-data').value;
    const testDate = document.getElementById('test-date').value;
    const maxScore = document.getElementById('max-score').value;

    // Validation
    if (!testTitle || !testCourse || !testLevel || !resultsData || !testDate || !maxScore) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    // Parse results data
    const lines = resultsData.trim().split('\n');
    const studentResults = [];

    for (let line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length < 3) {
            showNotification('Invalid format. Each line should have at least: email, score, grade', 'error');
            return;
        }

        const email = parts[0];
        const score = parseInt(parts[1]);
        const grade = parts[2];
        const comments = parts[3] || 'No additional comments';

        // Validate email format
        if (!isValidEmail(email)) {
            showNotification(`Invalid email format: ${email}`, 'error');
            return;
        }

        // Validate score
        if (isNaN(score) || score < 0 || score > parseInt(maxScore)) {
            showNotification(`Invalid score for ${email}: ${parts[1]}`, 'error');
            return;
        }

        studentResults.push({
            studentEmail: email,
            score: score,
            grade: grade,
            comments: comments,
            percentage: ((score / parseInt(maxScore)) * 100).toFixed(1)
        });
    }

    // Create test result record
    const testResult = {
        id: Date.now(),
        title: testTitle,
        course: testCourse,
        level: testLevel,
        lecturer: currentUser.name,
        testDate: testDate,
        uploadDate: new Date().toLocaleDateString(),
        maxScore: parseInt(maxScore),
        results: studentResults
    };

    testResults.push(testResult);
    saveTestResults();

    // Clear form
    document.getElementById('test-title').value = '';
    document.getElementById('test-course').value = '';
    document.getElementById('test-level').value = '';
    document.getElementById('results-data').value = '';
    document.getElementById('test-date').value = '';
    document.getElementById('max-score').value = '';

    showNotification(`Test results uploaded successfully! Results for ${studentResults.length} students.`, 'success');
    displayManageResults();
}

// Display courses for students
function displayCourses() {
    const container = document.getElementById('courses-container');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = '<div class="no-courses-message">No courses available yet. Check back later!</div>';
        return;
    }

    let html = '';
    courses.forEach(course => {
        html += `
            <div class="course-card" data-title="${course.title.toLowerCase()}" data-lecturer="${course.lecturer.toLowerCase()}">
                <div class="course-header">
                    <h3>${course.title}</h3>
                    <div class="course-meta">
                        <span>👨‍🏫 ${course.lecturer}</span>
                        <span>📚 ${course.level}</span>
                        <span>📅 ${course.uploadDate}</span>
                        <span>⬇ ${course.downloads} downloads</span>
                    </div>
                </div>
                <div class="course-description">
                    <p>${course.description}</p>
                </div>
                <div class="course-files">
                    ${course.files.map((file, index) => `
                        <div class="file-item" onclick="downloadFile(${course.id}, ${index}, '${file.name.replace(/'/g, "\\'")}')">
                            📄 ${file.name} (${formatFileSize(file.size)})
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Display courses for management
function displayManageCourses() {
    const container = document.getElementById('manage-courses-container');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = '<div class="no-data-message">No courses uploaded yet.</div>';
        return;
    }

    let html = '';
    courses.forEach(course => {
        html += `
            <div class="course-card">
                <div class="course-header">
                    <h3>${course.title}</h3>
                    <div class="course-meta">
                        <span>👨‍🏫 ${course.lecturer}</span>
                        <span>📚 ${course.level}</span>
                        <span>📅 ${course.uploadDate}</span>
                        <span>⬇ ${course.downloads} downloads</span>
                    </div>
                </div>
                <div class="course-description">
                    <p>${course.description}</p>
                </div>
                <div class="course-files">
                    ${course.files.map(file => `
                        <div class="file-item">
                            📄 ${file.name} (${formatFileSize(file.size)})
                        </div>
                    `).join('')}
                </div>
                <div class="course-actions">
                    <button onclick="deleteCourse(${course.id})" class="delete-btn">
                        🗑 Delete Course
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Search courses
function searchCourses() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const courseCards = document.querySelectorAll('#courses-container .course-card');
    
    courseCards.forEach(card => {
        const title = card.getAttribute('data-title');
        const lecturer = card.getAttribute('data-lecturer');
        
        if (title.includes(searchTerm) || lecturer.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Download file
function downloadFile(courseId, fileIndex, fileName) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const file = course.files[fileIndex];
    if (!file) return;

    // Create download link
    const link = document.createElement('a');
    link.href = file.content;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Update download count
    course.downloads++;
    saveCourses();
    
    // Refresh both student and lecturer views if they're active
    if (currentSection === 'student') {
        displayCourses();
    } else if (currentSection === 'lecturer') {
        displayManageCourses();
    }
    
    showNotification(`Downloaded: ${fileName}`, 'success');
}

// Delete course
function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        courses = courses.filter(course => course.id !== courseId);
        saveCourses();
        displayManageCourses();
        
        // If student is viewing courses, refresh their view
        if (currentSection === 'student') {
            displayCourses();
        }
        
        showNotification('Course deleted successfully!', 'success');
    }
}

// Save courses to local storage
function saveCourses() {
    try {
        localStorage.setItem('courses', JSON.stringify(courses));
    } catch (e) {
        console.error('Error saving courses:', e);
        showNotification('Error saving course. Storage might be full.', 'error');
    }
}

// Load courses from local storage
function loadCourses() {
    try {
        const savedCourses = localStorage.getItem('courses');
        if (savedCourses) {
            courses = JSON.parse(savedCourses);
        } else {
            courses = [];
        }
    } catch (e) {
        console.error('Error loading courses:', e);
        courses = [];
    }
}

// Load test results from local storage
function loadTestResults() {
    try {
        const savedResults = localStorage.getItem('testResults');
        if (savedResults) {
            testResults = JSON.parse(savedResults);
        } else {
            testResults = [];
        }
    } catch (e) {
        console.error('Error loading test results:', e);
        testResults = [];
    }
}

// Save test results to local storage
function saveTestResults() {
    try {
        localStorage.setItem('testResults', JSON.stringify(testResults));
    } catch (e) {
        console.error('Error saving test results:', e);
        showNotification('Error saving test results. Storage might be full.', 'error');
    }
}

// Display test results for management
function displayManageResults() {
    const container = document.getElementById('manage-results-container');
    
    if (!testResults || testResults.length === 0) {
        container.innerHTML = '<div class="no-data-message">No test results uploaded yet.</div>';
        return;
    }

    let html = '';
    testResults.forEach(test => {
        html += `
            <div class="test-card">
                <div class="test-header">
                    <h3>${test.title}</h3>
                    <div class="test-meta">
                        <span>📚 ${test.course}</span>
                        <span>🎓 ${test.level}</span>
                        <span>👨‍🏫 ${test.lecturer}</span>
                        <span>📅 Test Date: ${test.testDate}</span>
                        <span>📤 Uploaded: ${test.uploadDate}</span>
                        <span>📊 Max Score: ${test.maxScore}</span>
                        <span>👥 Students: ${test.results.length}</span>
                    </div>
                </div>
                <div class="test-actions">
                    <button onclick="deleteTestResult(${test.id})" class="delete-btn">
                        🗑 Delete Test Results
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Delete test result
function deleteTestResult(testId) {
    if (confirm('Are you sure you want to delete these test results? This action cannot be undone.')) {
        testResults = testResults.filter(test => test.id !== testId);
        saveTestResults();
        displayManageResults();
        showNotification('Test results deleted successfully!', 'success');
    }
}

// Display student results
function displayStudentResults() {
    const container = document.getElementById('student-results-container');
    
    // Filter results for current student
    let studentResultsHtml = '';
    let hasResults = false;
    
    testResults.forEach(test => {
        const studentResult = test.results.find(r => r.studentEmail === currentUser.email);
        if (studentResult) {
            hasResults = true;
            const gradeClass = `grade-${studentResult.grade.toLowerCase()}`;
            
            studentResultsHtml += `
                <div class="result-card ${gradeClass}">
                    <div class="result-header">
                        <h3>${test.title} - ${test.course}</h3>
                        <div class="result-grade">${studentResult.grade}</div>
                    </div>
                    <div class="result-details">
                        <div class="detail-item">
                            <span>Score</span>
                            <span>${studentResult.score} / ${test.maxScore}</span>
                        </div>
                        <div class="detail-item">
                            <span>Percentage</span>
                            <span>${studentResult.percentage}%</span>
                        </div>
                        <div class="detail-item">
                            <span>Test Date</span>
                            <span>${test.testDate}</span>
                        </div>
                        <div class="detail-item">
                            <span>Lecturer</span>
                            <span>${test.lecturer}</span>
                        </div>
                    </div>
                    <div class="result-comments">
                        <strong>Comments:</strong>
                        <p>${studentResult.comments}</p>
                    </div>
                </div>
            `;
        }
    });
    
    if (!hasResults) {
        container.innerHTML = '<div class="no-results-message">No test results available yet. Check back after your next assessment!</div>';
    } else {
        container.innerHTML = studentResultsHtml;
    }
}

// Show notification
function showNotification(message, type, persistent = false) {
    // Remove existing notification if any
    if (activeNotification) {
        document.body.removeChild(activeNotification);
        activeNotification = null;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">${message}</div>
        ${persistent ? '<button class="dismiss-btn" onclick="dismissNotification()">×</button>' : ''}
    `;
    
    document.body.appendChild(notification);
    activeNotification = notification;
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Only auto-dismiss if not persistent
    if (!persistent) {
        setTimeout(() => {
            dismissNotification();
        }, 3000);
    }
}

// Dismiss notification
function dismissNotification() {
    if (activeNotification) {
        activeNotification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(activeNotification);
            activeNotification = null;
        }, 300);
    }
}