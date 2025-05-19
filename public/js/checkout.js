
function togglePaymentSection() {
    const paymentType = document.getElementById("paymentType").value;
    const paymentDetails = document.getElementById("paymentDetails");
    const codPayment = document.getElementById("codPayment");
    const momoPayment = document.getElementById("momoPayment");
    const zalopayPayment = document.getElementById("zalopayPayment");

    paymentDetails.style.display = "none";
    codPayment.style.display = "none";
    momoPayment.style.display = "none";
    zalopayPayment.style.display = "none";

    if (paymentType === "cod") {
        paymentDetails.style.display = "block";
        codPayment.style.display = "block";
    } else if (paymentType === "momo") {
        paymentDetails.style.display = "block";
        momoPayment.style.display = "block";
    } else if (paymentType === "zalopay") {
        paymentDetails.style.display = "block";
        zalopayPayment.style.display = "block";
    }
}

// Check tên
function validateFullName() {
    const fullNameInput = document.getElementById("fullName");
    const fullNameError = document.getElementById("fullNameError");
    const fullNameRegex = /^[A-Za-zÀ-ỹ\s]+$/; // Allow letters, Vietnamese characters, and spaces

    if (!fullNameRegex.test(fullNameInput.value)) {
        fullNameError.textContent = "Họ tên chỉ được chứa chữ cái và khoảng trắng.";
        fullNameInput.classList.add("is-invalid");
        return false;
    } else {
        fullNameError.textContent = "";
        fullNameInput.classList.remove("is-invalid");
        return true;
    }
}

// Check số
function validatePhone() {
    const phoneInput = document.getElementById("phone");
    const phoneError = document.getElementById("phoneError");
    const phoneRegex = /^(0|\+84)(\d{9})$/; // 0 or +84 followed by 9 or 10 digits

    if (!phoneRegex.test(phoneInput.value)) {
        phoneError.textContent = "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và phải đủ 10 chữ số.";
        phoneInput.classList.add("is-invalid");
        return false;
    } else {
        phoneError.textContent = "";
        phoneInput.classList.remove("is-invalid");
        return true;
    }
}

// Prevent form submission if validation fails
function validateForm(event) {
    const isFullNameValid = validateFullName();
    const isPhoneValid = validatePhone();

    if (!isFullNameValid || !isPhoneValid) {
        event.preventDefault(); // Prevent form submission
    }
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
    const fullNameInput = document.getElementById("fullName");
    const phoneInput = document.getElementById("phone");
    const form = document.querySelector("form");

    fullNameInput.addEventListener("input", validateFullName);
    phoneInput.addEventListener("input", validatePhone);
    form.addEventListener("submit", validateForm);
});