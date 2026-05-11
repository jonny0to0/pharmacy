import Swal from 'sweetalert2';
import 'animate.css';

/**
 * Error mapping dictionary for Human-Friendly alerts
 * Formula: Problem (simple) + Action (what to do)
 */
const ERROR_MAP: Record<string, { title: string, instruction: string }> = {
  'TOKEN_EXPIRED': {
    title: 'Session Ended',
    instruction: 'Please log in again to continue.'
  },
  'Invalid credentials': {
    title: 'Login Failed',
    instruction: 'Incorrect email/mobile or password. Please try again.'
  },
  'already exists': {
    title: 'Duplicate Entry',
    instruction: 'This record already exists. Please use different details.'
  },
  'Account setup required': {
    title: 'Setup Required',
    instruction: 'Please complete your account setup via the link sent to your email.'
  },
  'Account disabled': {
    title: 'Account Restricted',
    instruction: 'Your account is disabled. Please contact your administrator.'
  },
  'Internal server error': {
    title: 'Something Went Wrong',
    instruction: "We're having trouble on our end. Please try again in a moment."
  },
  'ERR_NETWORK': {
    title: 'Connection Issue',
    instruction: 'Please check your internet connection or try again later.'
  },
  'Permission denied': {
    title: 'Access Restricted',
    instruction: "You don't have permission for this. Contact your admin if needed."
  },
  'Validation failed': {
    title: 'Invalid Input',
    instruction: 'Some details are missing or incorrect. Please check and try again.'
  }
};

let lastErrorTimestamp = 0;
let lastErrorMessage = '';

/**
 * Standard Alert Configuration for the application
 */
export const alerts = {
  success: (title: string, message?: string) => {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      timer: 2000,
      showConfirmButton: false,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  },

  error: (title: string, message?: string) => {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK',
      showClass: {
        popup: 'animate__animated animate__headShake'
      }
    });
  },

  /**
   * Automatically maps technical errors to human-friendly messages
   */
  friendlyError: (technicalError: string | number) => {
    const errorKey = String(technicalError);
    const now = Date.now();

    // Debounce exact same error if it happens within 2 seconds
    if (errorKey === lastErrorMessage && (now - lastErrorTimestamp) < 2000) {
      return Promise.resolve();
    }
    
    lastErrorTimestamp = now;
    lastErrorMessage = errorKey;
    
    // Find the closest match in the map
    const matchedKey = Object.keys(ERROR_MAP).find(key => errorKey.includes(key));
    const mapping = matchedKey ? ERROR_MAP[matchedKey] : {
      title: 'Unexpected Issue',
      instruction: 'Something went wrong. Please try again.'
    };

    return Swal.fire({
      icon: 'error',
      title: mapping.title,
      text: mapping.instruction,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Try Again',
      showClass: {
        popup: 'animate__animated animate__headShake'
      }
    });
  },

  warning: (title: string, message?: string) => {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      showClass: {
        popup: 'animate__animated animate__fadeIn'
      }
    });
  },

  confirm: (title: string, text: string, confirmButtonText = 'Yes, do it!') => {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: confirmButtonText,
      showClass: {
        popup: 'animate__animated animate__pulse'
      }
    });
  },

  /**
   * Special alert for session expiry
   */
  sessionExpired: () => {
    const mapping = ERROR_MAP['TOKEN_EXPIRED'];
    return Swal.fire({
      icon: 'warning',
      title: mapping.title,
      text: mapping.instruction,
      confirmButtonText: 'Go to Login',
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: 5000,
      timerProgressBar: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }
};

export default alerts;
