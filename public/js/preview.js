$(document).ready(function () {
    $('#imageInput').on('change', function (evt) {
        $('#showPreview').prop('disabled', 'disabled');
        var tgt = evt.target || window.event.srcElement,
            files = tgt.files;

        if (FileReader && files && files.length) {
            var fr = new FileReader();
            fr.onloadend = function () {
                $('#preview-image').prop('src', fr.result);
            }
            fr.readAsDataURL(files[0]);
        }
    });

    $('#preview-image').on('load', function () {
        if (this.naturalHeight > this.naturalWidth && this.naturalHeight > 240)
            $(this).height(240);
        else if (this.naturalWidth > 320)
            $(this).width(320);
        $('#showPreview').prop('disabled', '');
    });

    $('#showPreview').on('click', function () {
        $('#preview-username').text($('#usernameInput').val());
        $('#preview-email').text($('#emailInput').val());
        $('#preview-task').text($('#taskInput').val());
        if ($('#preview-image').prop('src').length == 0)
            $('#preview-image').prop('src', $('#oldImage').prop('src'));
        $('#preview').modal('show');
    });
});
