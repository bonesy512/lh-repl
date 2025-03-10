
import { auth } from "./firebase";

// Utility to handle the webview authentication flow
export function handleWebviewAuth() {
  const isAuthPage = window.location.pathname === "/auth";
  
  // Check if we're in a webview context
  const isWebView = window.self !== window.top || 
    /WebView|iPhone|iPod|iPad|Android/.test(navigator.userAgent);

  console.log("Auth environment:", { 
    isWebView, 
    href: window.location.href,
    origin: window.location.origin,
    parent: window.parent !== window
  });

  // Immediately check if user is logged in on auth page
  if (isAuthPage) {
    const user = auth.currentUser;
    console.log("Auth page current user:", user ? user.email : "none");
    
    if (user) {
      // In auth page and logged in, try to message parent
      console.log("Already logged in on auth page, sending success message");
      notifyParentOfSuccess(user);
      
      // After short delay, try to close or redirect
      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          window.location.href = "/dashboard";
        }
      }, 1000);
    }
  }

  // Set up auth state listener for future changes
  auth.onAuthStateChanged((user) => {
    console.log("Auth state changed on auth page:", user ? user.email : "logged out");
    
    if (user && isAuthPage) {
      console.log("User logged in on auth page, sending success message");
      notifyParentOfSuccess(user);
      
      // After short delay, try to close or redirect
      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          window.location.href = "/dashboard";
        }
      }, 1000);
    }
  });

  // If we're in the main app, listen for auth success messages
  if (!isAuthPage) {
    window.addEventListener("message", (event) => {
      // Only accept messages from our own domain
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "AUTH_SUCCESS") {
        console.log("Received auth success message:", event.data);
        // Force navigation to dashboard
        window.location.href = "/dashboard";
      }
    });
  }
}

// Helper to notify parent window of successful auth
function notifyParentOfSuccess(user: any) {
  try {
    const message = { 
      type: "AUTH_SUCCESS", 
      user: { 
        uid: user.uid, 
        email: user.email 
      } 
    };
    
    // Try sending to opener window (popup case)
    if (window.opener) {
      console.log("Sending success to opener");
      window.opener.postMessage(message, window.location.origin);
    } 
    // Try sending to parent frame (iframe case)
    else if (window.parent && window.parent !== window) {
      console.log("Sending success to parent frame");
      window.parent.postMessage(message, window.location.origin);
    }
  } catch (err) {
    console.error("Error sending auth success message:", err);
  }
}
