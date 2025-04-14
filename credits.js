

function updateCreditDisplay(credits) {
    document.getElementById('credits-count').textContent = credits;
  }
  
 
  function checkAndResetCredits(userId) {
    const userRef = db.collection('users').doc(userId);
    
    userRef.get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const lastReset = userData.creditsLastReset ? userData.creditsLastReset.toDate() : null;
        const creditsRemaining = userData.creditsRemaining || 0;
        
       
        updateCreditDisplay(creditsRemaining);
        
        
        if (lastReset) {
          const currentDate = new Date();
          const lastResetDate = new Date(lastReset);
          
          
          if (currentDate.getDate() !== lastResetDate.getDate() || 
              currentDate.getMonth() !== lastResetDate.getMonth() ||
              currentDate.getFullYear() !== lastResetDate.getFullYear()) {
            
           
            userRef.update({
              creditsRemaining: 20,
              creditsLastReset: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
              updateCreditDisplay(20);
              showToast('Daily credits reset to 20!', 'success');
            })
            .catch((error) => {
              console.error("Error resetting credits: ", error);
            });
          }
        }
      }
    }).catch((error) => {
      console.error("Error checking credits: ", error);
    });
  }
  
 
  function useCredit(userId) {
    return new Promise((resolve, reject) => {
      const userRef = db.collection('users').doc(userId);
      
      userRef.get().then((doc) => {
        if (doc.exists) {
          const creditsRemaining = doc.data().creditsRemaining || 0;
          
          if (creditsRemaining > 0) {
            
            userRef.update({
              creditsRemaining: creditsRemaining - 1
            })
            .then(() => {
              updateCreditDisplay(creditsRemaining - 1);
              resolve(true);
            })
            .catch((error) => {
              console.error("Error updating credits: ", error);
              reject(error);
            });
          } else {
            showToast('You have no credits remaining today!', 'error');
            reject(new Error('No credits remaining'));
          }
        } else {
          reject(new Error('User document not found'));
        }
      }).catch((error) => {
        console.error("Error getting user document: ", error);
        reject(error);
      });
    });
  }
  
 
  function saveMessage(userId, messageText, isUser) {
    const messagesRef = db.collection('users').doc(userId).collection('messages');
    
    return messagesRef.add({
      content: messageText,
      isUser: isUser,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  

  function loadMessageHistory(userId) {
    const messagesRef = db.collection('users').doc(userId).collection('messages');
    
    messagesRef.orderBy('timestamp', 'asc').limit(50).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const messageData = doc.data();
          addMessageToUI(messageData.content, messageData.isUser ? 'user' : 'ai');
        });
      })
      .catch((error) => {
        console.error("Error loading message history: ", error);
      });
  }
  