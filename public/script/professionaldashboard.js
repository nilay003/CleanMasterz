$(document).ready(function() {
    
    $(document).on('click', '.complete-btn', function() {
        const scheduleId = $(this).data('schedule-id');
        console.log(`Complete button clicked for schedule ID ${scheduleId}`);

    
        const $button = $(this);

        $.ajax({
            type: 'POST',
            url: `/generate-otp/${scheduleId}`,
            success: function(response) {
                console.log('AJAX success:', response);
                alert('OTP Sent Successfully');
                 $button.hide();
                $(`#otp-section-${scheduleId}`).show();
            },
            error: function(err) {
                console.error('AJAX error:', err);
                alert('Failed to generate OTP');
            }
        });
        
    });

    
    $(document).on('click', '.submit-otp-btn', function() {
        const scheduleId = $(this).data('schedule-id');
        const otp = $(`#otp-input-${scheduleId}`).val();
        console.log(`Submit OTP button clicked for schedule ID ${scheduleId}, OTP: ${otp}`);

    
        $.ajax({
            type: 'POST',
            url: `/verify-otp/${scheduleId}`,
            data: { otp: otp },
            success: function(response) {
                console.log('OTP verification success:', response);
                alert('OTP verified successfully task is completed');

                $(`#otp-section-${scheduleId}`).hide();
            },
            error: function(err) {
                console.error('OTP verification error:', err.responseJSON.error);
                alert('Failed to verify OTP');
            }
        });
    });
});
