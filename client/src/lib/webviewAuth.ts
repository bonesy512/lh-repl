// Disable auto-login functionality
import { auth } from "./firebase";

// Utility to handle the webview authentication flow
export function handleWebviewAuth() {
  // Disabled auto-login and redirect
  return;
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