

const firebaseConfig = {
    apiKey: "AIzaSyAHrCa69ybMay2oxZ9061aEaQZsD-77VpU",
    authDomain: "login-a8b53.firebaseapp.com",
    projectId: "login-a8b53",
    storageBucket: "login-a8b53.firebasestorage.app",
    messagingSenderId: "76525407228",
    appId: "1:76525407228:web:37a2290f927745ea4d0079"
  };
  

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  

  const authContainer = document.getElementById('auth-container');
  const chatContainer = document.getElementById('chat-container');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const showLoginBtn = document.getElementById('show-login');
  const showSignupBtn = document.getElementById('show-signup');
  const logoutButton = document.getElementById('logout-button');
  const userEmailElement = document.getElementById('user-email');
  const loadingOverlay = document.getElementById('loading-overlay');
  
  // Toggle between login and signup forms
  showSignupBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  });
  
  showLoginBtn.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });
  
  // Login functionality
  document.getElementById('login-button').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }
    
    showLoading();
    
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Login successful
        hideLoading();
        resetForms();
      })
      .catch((error) => {
        hideLoading();
        showToast(error.message, 'error');
      });
  });
  
  // Signup functionality
  document.getElementById('signup-button').addEventListener('click', () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }
    
    if (password.length < 6) {
      showToast('Password should be at least 6 characters', 'error');
      return;
    }
    
    showLoading();
    
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Create user document in Firestore
        const user = userCredential.user;
        return db.collection('users').doc(user.uid).set({
          email: user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
          creditsLastReset: firebase.firestore.FieldValue.serverTimestamp(),
          creditsRemaining: 20
        });
      })
      .then(() => {
        hideLoading();
        resetForms();
        showToast('Account created successfully!', 'success');
      })
      .catch((error) => {
        hideLoading();
        showToast(error.message, 'error');
      });
  });
  
  // Logout functionality
  logoutButton.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        showToast('Logged out successfully', 'success');
      })
      .catch((error) => {
        showToast('Error signing out', 'error');
      });
  });
  
  // Auth state change listener
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      db.collection('users').doc(user.uid).update({
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      userEmailElement.textContent = user.email;
      authContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
      
      // Check and update credits
      checkAndResetCredits(user.uid);
    } else {
      // User is signed out
      authContainer.classList.remove('hidden');
      chatContainer.classList.add('hidden');
    }
  });
  
  // Helper functions
  function resetForms() {
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
  }
  
  function showLoading() {
    loadingOverlay.classList.remove('hidden');
  }
  
  function hideLoading() {
    loadingOverlay.classList.add('hidden');
  }
  
  function showToast(message, type = 'default') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast';
    
    if (type === 'error') {
      toast.classList.add('error');
    } else if (type === 'success') {
      toast.classList.add('success');
    }
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 300);
    }, 3000);
  }
  