/**
 * Universal PII Masking Utility
 * Ensures sensitive data is partially hidden during administrative impersonation.
 */
export const maskEmail = (email) => {
    if (!email)
        return null;
    const [user, domain] = email.split("@");
    if (user.length <= 2)
        return `${user}***@${domain}`;
    return `${user.substring(0, 2)}***@${domain}`;
};
export const maskPhone = (phone) => {
    if (!phone)
        return null;
    return `${phone.substring(0, 3)}****${phone.substring(phone.length - 2)}`;
};
export const maskGSTIN = (gstin) => {
    if (!gstin)
        return null;
    if (gstin.length < 5)
        return gstin;
    return `${gstin.substring(0, 5)}****${gstin.substring(gstin.length - 2)}`;
};
export const maskAddress = (address) => {
    if (!address)
        return null;
    const parts = address.split(",");
    if (parts.length <= 1)
        return address;
    // Return only city and state (last two parts usually)
    return `***, ${parts.slice(-2).join(",").trim()}`;
};
export const maskObject = (obj) => {
    if (!obj)
        return obj;
    const masked = { ...obj };
    if (masked.email)
        masked.email = maskEmail(masked.email);
    if (masked.mobile)
        masked.mobile = maskPhone(masked.mobile);
    if (masked.phone)
        masked.phone = maskPhone(masked.phone);
    if (masked.gstin)
        masked.gstin = maskGSTIN(masked.gstin);
    if (masked.address)
        masked.address = maskAddress(masked.address);
    return masked;
};
//# sourceMappingURL=masking.js.map