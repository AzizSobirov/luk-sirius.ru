import { ref } from "vue";

export function useSnilsValidator(snils) {
  const isSnilsValid = ref(true);

  function validateSnils() {
    let _snils = snils.value;
    // 112-233-445 95

    // Remove any non-digit characters from the input
    const cleanedSNILS = _snils.replace(/\D/g, "");

    // Check if the cleanedSNILS length is correct
    if (cleanedSNILS.length !== 11) {
      return false;
    }

    // Check if all digits are the same (invalid SNILS)
    if (/^(\d)\1*$/.test(cleanedSNILS)) {
      return false;
    }

    // Calculate the check digit
    const checkDigit = parseInt(cleanedSNILS.slice(-2), 10);
    const snilsDigits = cleanedSNILS.slice(0, -2).split("").map(Number);
    const checkSum = snilsDigits.reduce(
      (acc, digit, index) => acc + digit * (9 - index),
      0
    );
    const calculatedCheckDigit = (checkSum % 101) % 100;
    // Compare the check digit with the calculated check digit
    isSnilsValid.value = calculatedCheckDigit === checkDigit;
  }

  return { isSnilsValid, validateSnils };
}

export function useCookie() {
  /*
        Set cookie
        @param {string} name - cookie name
        @param {string} value - cookie value
        @param {number} days - cookie expiration time
        @param {string} path - cookie path
    */
  const setCookie = (name, value, days, path = "/") => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `expires=${date.toUTCString()};`;
    }
    document.cookie = `${name}=${value};${expires}path=${path};`;
  };

  /*
        Get cookie
        @param {string} name - cookie name
    
        @returns {string | null}
    */
  const getCookie = (name) => {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  /*
        Delete cookie
        @param {string} name - cookie name
        @param {string} path - cookie path
    */
  const deleteCookie = (name, path = "/") => {
    setCookie(name, "", -1, path);
  };

  return { setCookie, getCookie, deleteCookie };
}
