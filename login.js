document.addEventListener('DOMContentLoaded', (event) => {
    authenticate();
    getData();
    initializeFormValidation();
});

// Form validation and UI enhancement
const initializeFormValidation = () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('floatingPassword');
    const submitButton = document.getElementById('submitbuttonlogin');
    
    // Real-time validation
    emailInput.addEventListener('input', () => validateEmail(emailInput));
    passwordInput.addEventListener('input', () => validatePassword(passwordInput));
    
    // Form submission validation
    const form = document.getElementById('formnya');
    form.addEventListener('submit', handleFormSubmission);
};

// Email validation with visual feedback
const validateEmail = (emailInput) => {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    clearFieldError(emailInput);
    
    if (email === '') {
        showFieldError(emailInput, 'Email is required');
        return false;
    } else if (!emailRegex.test(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        return false;
    } else {
        showFieldSuccess(emailInput);
        return true;
    }
};

// Password validation with visual feedback
const validatePassword = (passwordInput) => {
    const password = passwordInput.value;
    
    clearFieldError(passwordInput);
    
    if (password === '') {
        showFieldError(passwordInput, 'Password is required');
        return false;
    } else if (password.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        return false;
    } else {
        showFieldSuccess(passwordInput);
        return true;
    }
};

// Show field error with animation
const showFieldError = (field, message) => {
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
    
    let feedback = field.parentNode.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode.appendChild(feedback);
    }
    feedback.textContent = message;
    feedback.style.opacity = '0';
    setTimeout(() => {
        feedback.style.opacity = '1';
    }, 10);
};

// Show field success
const showFieldSuccess = (field) => {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.style.opacity = '0';
        setTimeout(() => {
            feedback.remove();
        }, 200);
    }
};

// Clear field error
const clearFieldError = (field) => {
    field.classList.remove('is-invalid', 'is-valid');
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
};

// Show loading state on button
const setButtonLoading = (button, isLoading) => {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span>Logging in...';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        button.innerHTML = 'Submit';
    }
};

// Show notification
const showNotification = (message, type = 'info') => {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
};

// Get notification icon based on type
const getNotificationIcon = (type) => {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
};

// Handle form submission with enhanced validation
const handleFormSubmission = async (event) => {
    event.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('floatingPassword');
    const submitButton = document.getElementById('submitbuttonlogin');
    
    const isEmailValid = validateEmail(emailInput);
    const isPasswordValid = validatePassword(passwordInput);
    
    if (!isEmailValid || !isPasswordValid) {
        showNotification('Please fix the errors above', 'error');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    setButtonLoading(submitButton, true);
    
    try {
        await loginData(email, password);
        console.log(email, password);
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
};

// Enhanced authentication with better error handling
const authenticate = async () => {
    try {
        const req = await fetch('https://train-database-production.up.railway.app/api/Users/login', {
            method: "POST", 
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: "emailtest@gmail.com",
                password: "helloworld"
            }),
        });

        if (!req.ok) {
            throw new Error(`Authentication failed: ${req.status}`);
        }

        const data = await req.json();
        console.log('Authentication successful:', data);

        localStorage.setItem('token', data.token);
        
        // Set token expiration (optional)
        const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
        localStorage.setItem('tokenExpiration', expirationTime);
        
    } catch (error) {
        console.error('Authentication Error:', error);
        showNotification('Authentication failed. Some features may not work properly.', 'warning');
    }
};

// Check if token is still valid
const isTokenValid = () => {
    const token = localStorage.getItem('token');
    const expiration = localStorage.getItem('tokenExpiration');
    
    if (!token || !expiration) {
        return false;
    }
    
    return new Date().getTime() < parseInt(expiration);
};

// Enhanced getData with better error handling
const getData = async () => {
    try {
        if (!isTokenValid()) {
            console.log('Token expired, re-authenticating...');
            await authenticate();
        }
        
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('No authentication token available');
        }

        const req = await fetch('https://train-database-production.up.railway.app/api/Account/', {
          method: "GET", 
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        
        if (!req.ok) {
            throw new Error(`Data fetch failed: ${req.status}`);
        }
        
        const text = await req.json();
        console.log('Data retrieved:', text);

        // Enhanced data validation
        if (Array.isArray(text) && text.length > 0) {
            console.log(`Successfully retrieved ${text.length} records`);
        } else {
            console.log('No data found or invalid response format');
        }

    } catch (err) {
        console.error('Data fetch error:', err);
        showNotification('Failed to retrieve user data', 'error');
    }
};

// Enhanced loginData with comprehensive validation
const loginData = async (email, password) => {
    try {
        if (!isTokenValid()) {
            await authenticate();
        }
        
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Authentication required');
        }

        const req = await fetch('https://train-database-production.up.railway.app/api/Account/', {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (!req.ok) {
            if (req.status === 401) {
                throw new Error('Authentication expired. Please refresh the page.');
            }
            throw new Error(`Server error: ${req.status}`);
        }

        const docs = await req.json();
        
        if (!Array.isArray(docs)) {
            throw new Error('Invalid response format from server');
        }

        // Enhanced login validation
        let loginSuccessful = false;
        for (let i = 0; i < docs.length; i++) {
            const userData = docs[i].docs || docs[i]; // Handle different response formats
            if (userData && userData.email === email && userData.pass === password) {
                console.log('Login successful: Email and password are valid.');
                
                // Store user info for session
                localStorage.setItem('currentUser', JSON.stringify({
                    email: email,
                    loginTime: new Date().toISOString()
                }));
                
                showNotification('Login successful! Redirecting...', 'success');
                
                // Redirect after successful login
                setTimeout(() => {
                    window.location.href = 'landing.html';
                }, 1500);
                
                loginSuccessful = true;
                break;
            }
        }
        
        if (!loginSuccessful) {
            throw new Error('Invalid email or password');
        }

    } catch (error) {
        console.error('Login Error:', error);
        showNotification(error.message || 'Login failed. Please try again.', 'error');
        throw error; // Re-throw for form handler
    }
};

// Logout function (bonus feature)
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('currentUser');
    showNotification('You have been logged out', 'info');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
};

// Check if user is already logged in
const checkExistingLogin = () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && isTokenValid()) {
        showNotification('You are already logged in. Redirecting...', 'info');
        setTimeout(() => {
            window.location.href = 'landing.html';
        }, 1500);
    }
};

// Call this on page load
document.addEventListener('DOMContentLoaded', () => {
    checkExistingLogin();
});