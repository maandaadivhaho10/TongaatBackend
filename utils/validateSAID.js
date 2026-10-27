
const validateSAID = (idNumber) => {
    const id = String(idNumber ?? "").trim();

    // Must contain exactly 13 digits
    if (!/^\d{13}$/.test(id)) {
        return {
            valid: false,
            message: "South African ID number must contain exactly 13 digits"
        };
    }

    // Validate date of birth (YYMMDD)
    const yy = Number(id.substring(0, 2));
    const month = Number(id.substring(2, 4));
    const day = Number(id.substring(4, 6));

    const currentYear = new Date().getFullYear();
    const currentYY = currentYear % 100;

    const year = yy <= currentYY ? 2000 + yy : 1900 + yy;

    const dob = new Date(Date.UTC(year, month - 1, day));

    if (
        dob.getUTCFullYear() !== year ||
        dob.getUTCMonth() !== month - 1 ||
        dob.getUTCDate() !== day ||
        dob.getTime() > Date.now()
    ) {
        return {
            valid: false,
            message: "South African ID number contains an invalid date of birth"
        };
    }

    // Citizenship digit: 0 = citizen, 1 = permanent resident
    const citizenship = id[10];

    if (citizenship !== "0" && citizenship !== "1") {
        return {
            valid: false,
            message: "Invalid South African ID citizenship digit"
        };
    }

    // Validate Luhn checksum
    let sum = 0;
    let doubleDigit = false;

    for (let i = id.length - 1; i >= 0; i--) {
        let digit = Number(id[i]);

        if (doubleDigit) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        doubleDigit = !doubleDigit;
    }

    if (sum % 10 !== 0) {
        return {
            valid: false,
            message: "Invalid South African ID number"
        };
    }

    return {
        valid: true,
        message: "Valid South African ID number",
        date_of_birth: dob.toISOString().slice(0, 10)
    };
};

module.exports = { validateSAID };
