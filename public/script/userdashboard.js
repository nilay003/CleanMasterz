function updateServiceDetails() {
    const selectElement = document.getElementById('select-service');
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    if (selectedOption.value !== '') {
        const price = selectedOption.getAttribute('data-price');
        document.getElementById('service-price').value = price;
        document.getElementById('service-error').style.display = 'none';
    } else {
        document.getElementById('service-price').value = '';
    }
}

function showRescheduleInput(button) {
    const form = button.closest('form');
    const dateInput = form.querySelector('.reschedule-date');
    const submitButton = form.querySelector('.reschedule-submit');

    dateInput.style.display = 'block';
    submitButton.style.display = 'block';
    button.style.display = 'none';
}

function validateServiceSelection() {
    const selectElement = document.getElementById('select-service');
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    if (selectedOption.value === '') {
        document.getElementById('service-error').style.display = 'block';
        return false;
    }

    return true; 
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('task-list').addEventListener('click', function (event) {
        if (event.target.classList.contains('complete-task')) {
            const scheduleId = event.target.dataset.scheduleId;
            
            fetch(`/getOTP/${scheduleId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const otpElement = document.getElementById(`otp-${scheduleId}`);
                    if (otpElement) {
                        otpElement.innerHTML = `<strong>OTP:</strong> ${data.otp}`;
                    }
                } else {
                    console.error('Failed to fetch OTP:', data.message);
                    alert('Failed to fetch OTP.');
                }
            })
            .catch(error => {
                console.error('Error fetching OTP:', error);
                alert('Error fetching OTP.');
            });
        }
    });
});
