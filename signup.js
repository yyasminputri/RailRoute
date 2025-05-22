document.addEventListener('DOMContentLoaded', (event) => {
    authenticate();
    initializeFormValidation();
    initializePasswordStrengthMeter();
});

// Form validation and UI enhancement
const initializeFormValidation = () => {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('floatingPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Real-time validation
    fullNameInput.addEventListener('input', () => validateFullName(fullNameInput));
    emailInput.addEventListener('input', () => validateEmail(emailInput));
    passwordInput.addEventListener('input', () => {
        validatePassword(passwordInput);
        updatePasswordStrength(passwordInput.value);
        if (confirmPasswordInput.value) {
            validateConfirmPassword(confirmPasswordInput, passwordInput.value);
        }
    });
    confirmPasswordInput.addEventListener('input', () => validateConfirmPassword(confirmPasswordInput, passwordInput.value));
    
    // Form submission validation
    const form = document.getElementById('formnya');
    form.addEventListener('submit', handleFormSubmission);
};

// Password strength meter initialization
const initializePasswordStrengthMeter = () => {
    const passwordInput = document.getElementById('floatingPassword');
    const strengthMeter = document.createElement('div');
    strengthMeter.className = 'password-strength-meter';
    strengthMeter.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill"></div>
        </div>
        <div class="strength-text">Password Strength</div>
        <div class="strength-requirements">
            <div class="requirement" data-requirement="length">
                <span class="requirement-icon">✗</span>
                <span class="requirement-text">At least 8 characters</span>
            </div>
            <div class="requirement" data-requirement="uppercase">
                <span class="requirement-icon">✗</span>
                <span class="requirement-text">One uppercase letter</span>
            </div>
            <div class="requirement" data-requirement="lowercase">
                <span class="requirement-icon">✗</span>
                <span class="requirement-text">One lowercase letter</span>
            </div>
            <div class="requirement" data-requirement="number">
                <span class="requirement-icon">✗</span>
                <span class="requirement-text">One number</span>
            </div>
            <div class="requirement" data-requirement="special">
                <span class="requirement-icon">✗</span>
                <span class="requirement-text">One special character</span>
            </div>
        </div>
    `;
    passwordInput.parentNode.appendChild(strengthMeter);
};

// Full name validation
const validateFullName = (nameInput) => {
    const name = nameInput.value.trim();
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    
    clearFieldError(nameInput);
    
    if (name === '') {
        showFieldError(nameInput, 'Full name is required');
        return false;
    } else if (!nameRegex.test(name)) {
        showFieldError(nameInput, 'Name should contain only letters and spaces (2-50 characters)');
        return false;
    } else if (name.length < 2) {
        showFieldError(nameInput, 'Name must be at least 2 characters long');
        return false;
    } else {
        showFieldSuccess(nameInput);
        return true;
    }
};

// Email validation with advanced checks
const validateEmail = (emailInput) => {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const disposableEmailDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
    
    clearFieldError(emailInput);
    
    if (email === '') {
        showFieldError(emailInput, 'Email is required');
        return false;
    } else if (!emailRegex.test(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        return false;
    } else if (disposableEmailDomains.some(domain => email.toLowerCase().includes(domain))) {
        showFieldError(emailInput, 'Please use a permanent email address');
        return false;
    } else {
        showFieldSuccess(emailInput);
        return true;
    }
};

// Advanced password validation
const validatePassword = (passwordInput) => {
    const password = passwordInput.value;
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    
    clearFieldError(passwordInput);
    
    if (password === '') {
        showFieldError(passwordInput, 'Password is required');
        return false;
    } else if (password.length < 8) {
        showFieldError(passwordInput, 'Password must be at least 8 characters long');
        return false;
    } else if (commonPasswords.includes(password.toLowerCase())) {
        showFieldError(passwordInput, 'Please choose a more secure password');
        return false;
    } else if (getPasswordStrength(password).score < 3) {
        showFieldError(passwordInput, 'Password is too weak. Please make it stronger');
        return false;
    } else {
        showFieldSuccess(passwordInput);
        return true;
    }
};

// Confirm password validation
const validateConfirmPassword = (confirmInput, originalPassword) => {
    const confirmPassword = confirmInput.value;
    
    clearFieldError(confirmInput);
    
    if (confirmPassword === '') {
        showFieldError(confirmInput, 'Please confirm your password');
        return false;
    } else if (confirmPassword !== originalPassword) {
        showFieldError(confirmInput, 'Passwords do not match');
        return false;
    } else {
        showFieldSuccess(confirmInput);
        return true;
    }
};

// Password strength calculation
const getPasswordStrength = (password) => {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    Object.values(checks).forEach(check => {
        if (check) score++;
    });
    
    return { score, checks };
};

// Update password strength meter
const updatePasswordStrength = (password) => {
    const strengthMeter = document.querySelector('.password-strength-meter');
    const strengthFill = strengthMeter.querySelector('.strength-fill');
    const strengthText = strengthMeter.querySelector('.strength-text');
    const requirements = strengthMeter.querySelectorAll('.requirement');
    
    const { score, checks } = getPasswordStrength(password);
    
    // Update strength bar
    const percentage = (score / 5) * 100;
    strengthFill.style.width = `${percentage}%`;
    
    // Update colors and text based on strength
    const strengthLevels = [
        { text: 'Very Weak', color: '#dc3545', class: 'very-weak' },
        { text: 'Weak', color: '#fd7e14', class: 'weak' },
        { text: 'Fair', color: '#ffc107', class: 'fair' },
        { text: 'Good', color: '#20c997', class: 'good' },
        { text: 'Strong', color: '#28a745', class: 'strong' }
    ];
    
    const level = strengthLevels[score] || strengthLevels[0];
    strengthFill.style.backgroundColor = level.color;
    strengthText.textContent = `Password Strength: ${level.text}`;
    strengthText.className = `strength-text ${level.class}`;
    
    // Update requirements
    Object.keys(checks).forEach(requirement => {
        const reqElement = strengthMeter.querySelector(`[data-requirement="${requirement}"]`);
        const icon = reqElement.querySelector('.requirement-icon');
        const text = reqElement.querySelector('.requirement-text');
        
        if (checks[requirement]) {
            icon.textContent = '✓';
            reqElement.classList.add('met');
            reqElement.classList.remove('unmet');
        } else {
            icon.textContent = '✗';
            reqElement.classList.add('unmet');
            reqElement.classList.remove('met');
        }
    });
};

// Enhanced form submission with comprehensive validation
const handleFormSubmission = async (event) => {
    event.preventDefault();
    
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('floatingPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = document.getElementById('submitbutton');
    
    // Validate all fields
    const isNameValid = validateFullName(fullNameInput);
    const isEmailValid = validateEmail(emailInput);
    const isPasswordValid = validatePassword(passwordInput);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPasswordInput, passwordInput.value);
    
    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        showNotification('Please fix all errors before submitting', 'error');
        return;
    }
    
    // Check for duplicate email (simulation)
    if (await checkEmailExists(emailInput.value)) {
        showFieldError(emailInput, 'This email is already registered');
        showNotification('Email already exists. Please use a different email or login instead.', 'error');
        return;
    }
    
    const formData = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value
    };
    
    setButtonLoading(submitButton, true);
    
    try {
        await postData(formData.fullName, formData.email, formData.password);
        
        // Success handling
        showNotification('Account created successfully! Please check your email for verification.', 'success');
        
        // Clear form after successful submission
        setTimeout(() => {
            document.getElementById('formnya').reset();
            clearAllFieldStates();
            
            // Redirect to login page
            showNotification('Redirecting to login page...', 'info');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }, 1500);
        
    } catch (error) {
        showNotification('Failed to create account. Please try again.', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
};

// Simulate email existence check
const checkEmailExists = async (email) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate some existing emails
    const existingEmails = ['test@example.com', 'admin@test.com', 'user@domain.com'];
    return existingEmails.includes(email.toLowerCase());
};

// Clear all field validation states
const clearAllFieldStates = () => {
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        clearFieldError(input);
        input.classList.remove('is-valid', 'is-invalid');
    });
    
    // Reset password strength meter
    const strengthMeter = document.querySelector('.password-strength-meter');
    if (strengthMeter) {
        const strengthFill = strengthMeter.querySelector('.strength-fill');
        const strengthText = strengthMeter.querySelector('.strength-text');
        const requirements = strengthMeter.querySelectorAll('.requirement');
        
        strengthFill.style.width = '0%';
        strengthText.textContent = 'Password Strength';
        strengthText.className = 'strength-text';
        
        requirements.forEach(req => {
            req.classList.remove('met');
            req.classList.add('unmet');
            req.querySelector('.requirement-icon').textContent = '✗';
        });
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
        button.innerHTML = '<span class="spinner"></span>Creating Account...';
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
    
    // Auto remove after 6 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 6000);
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
        
        // Set token expiration
        const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
        localStorage.setItem('tokenExpiration', expirationTime);
        
    } catch (error) {
        console.error('Authentication Error:', error);
        showNotification('Authentication failed. Some features may not work properly.', 'warning');
    }
};

// Enhanced postData with better error handling and validation
const postData = async (fullName, email, password) => {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Authentication token not found');
        }

        console.log('Attempting to create account for:', { fullName, email });

        const req = await fetch('https://train-database-production.up.railway.app/api/Account', {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                fullname: fullName,
                email: email,
                pass: password
            }),
        });

        if (!req.ok) {
            if (req.status === 403) {
                throw new Error('Access denied. Please check your permissions.');
            } else if (req.status === 409) {
                throw new Error('Email already exists. Please use a different email.');
            } else if (req.status === 400) {
                throw new Error('Invalid data provided. Please check your inputs.');
            } else {
                throw new Error(`Server error: ${req.status}. Please try again later.`);
            }
        }

        const data = await req.json();
        console.log('Account created successfully:', data);
        
        // Store user registration info
        localStorage.setItem('pendingUser', JSON.stringify({
            email: email,
            registrationTime: new Date().toISOString()
        }));
        
        return data;
        
    } catch (error) {
        console.error('Registration Error:', error);
        throw error;
    }
};

// Check if user is already logged in
const checkExistingLogin = () => {
    const currentUser = localStorage.getItem('currentUser');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    
    if (currentUser && tokenExpiration && new Date().getTime() < parseInt(tokenExpiration)) {
        showNotification('You are already logged in. Redirecting to dashboard...', 'info');
        setTimeout(() => {
            window.location.href = 'landing.html';
        }, 2000);
    }
};

// Password visibility toggle
const initializePasswordToggle = () => {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'password-toggle';
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
        
        // Wrap input in container for positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'password-input-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        wrapper.appendChild(toggleButton);
        
        toggleButton.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            toggleButton.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    });
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkExistingLogin();
    initializePasswordToggle();
});