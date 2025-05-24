import { ref } from 'vue'

export function useSnilsValidator(snils) {
    const isSnilsValid = ref(true)

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

    return { isSnilsValid, validateSnils }
}