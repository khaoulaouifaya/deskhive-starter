/* M5 lab 3: use the supplied local jQuery full build. */
$(function () {
    $('.toggle-details').on('click', function () {
        var button = $(this);
        var target = document.getElementById(button.attr('aria-controls'));
        if (!target) {
            return;
        }
        var isHidden = target.hidden;
        target.hidden = !isHidden;
        button.attr('aria-expanded', String(!isHidden));
        button.text(isHidden ? 'Hide details' : 'Show details');
    });

    var form = $('#booking-form');
    if (!form.length) {
        return;
    }
    var availabilityUrl = form.attr('data-availability-url');
    var spaceField = $('#id_space');
    var startField = $('#id_start');
    var endField = $('#id_end');
    var checkButton = $('#check-availability');
    var output = $('#availability');

    var generation = 0;
    var pendingRequest = null;

    function invalidateAndReset() {
        generation += 1;
        if (pendingRequest) {
            pendingRequest.abort();
            pendingRequest = null;
        }
        output.text('Values changed. Check availability again.');
        checkButton.prop('disabled', false);
    }

    spaceField.on('change input', invalidateAndReset);
    startField.on('change input', invalidateAndReset);
    endField.on('change input', invalidateAndReset);

    checkButton.on('click', function () {
        generation += 1;
        var gen = generation;
        if (pendingRequest) {
            pendingRequest.abort();
        }
        checkButton.prop('disabled', true);
        output.text('Checking…');

        var xhr = $.ajax({
            url: availabilityUrl,
            method: 'GET',
            dataType: 'json',
            data: {
                space: spaceField.val(),
                start: startField.val(),
                end: endField.val()
            },
            timeout: 10000
        });
        pendingRequest = xhr;

        xhr.done(function (data) {
            if (gen !== generation) {
                return;
            }
            if (data.available === true) {
                output.text('Available — saving checks again.');
            } else if (data.available === false) {
                output.text('Already booked.');
            } else {
                output.text('Could not check availability. Please retry.');
            }
            checkButton.prop('disabled', false);
        });

        xhr.fail(function (jqXHR, textStatus) {
            if (textStatus === 'abort') {
                return;
            }
            if (gen !== generation) {
                return;
            }
            if (jqXHR.status === 400) {
                output.text('Choose a space and a valid interval of at most 12 hours.');
            } else {
                output.text('Could not check availability. Please retry.');
            }
            checkButton.prop('disabled', false);
        });

        xhr.always(function () {
            if (pendingRequest === xhr) {
                pendingRequest = null;
            }
        });
    });
});
