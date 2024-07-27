function editProfessional(id, name, profession, email) {
    const emailUsername = email.split('@')[0];
    document.getElementById('professional-id').value = id;
    document.getElementById('professional-name').value = name;
    document.getElementById('profession').value = profession;
    document.getElementById('email-username').value = emailUsername;
    document.getElementById('password').value = ''; 
    document.getElementById('form-title').innerText = 'Edit Professional';
    document.getElementById('form-button').innerText = 'Update Professional';
    document.getElementById('professional-form').action = '/updateprofessional';
}

function validateEmail() {
    const emailUsername = document.getElementById('email-username').value;
    const email = emailUsername + '@cmp.com';
    document.getElementById('email').value = email;
    return true;
}
