
function toggleAddressForm() {
    const addressForm = document.getElementById('addressForm');

    if (addressForm.style.display === 'none' || addressForm.style.display === '') {
        addressForm.style.display = 'block';
    } else {
        addressForm.style.display = 'none';
    }
}

function toggleEditForm(addressId) {
    const addressForm = document.getElementById('addressForm');

    const existingStreet = document.getElementById('existing-street').innerText.trim();
    const existingCity = document.getElementById('existing-city').innerText.trim();
    const existingState = document.getElementById('existing-state').innerText.trim();
    const existingZip = document.getElementById('existing-zip').innerText.trim();
    const existingCountry = document.getElementById('existing-country').innerText.trim();

    document.getElementById('street_address').value = existingStreet;
    document.getElementById('city').value = existingCity;
    document.getElementById('state').value = existingState;
    document.getElementById('zip_code').value = existingZip;
    document.getElementById('country').value = existingCountry;

    document.getElementById('addressForm').action = `/updateaddress/${addressId}`;

    addressForm.style.display = 'block';
}
