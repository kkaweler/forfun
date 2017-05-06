$(document).ready(function () {
    var sort = "#sort [value='" + $.cookie('order_by') + "']";
    $(sort).prop('selected', 'selected');
    $('#sort').on('change', function () {
        $.cookie('order_by', $(this).val(), {expires: 30, path: '/'});
        var url = window.location.href.split('?')
        window.location.href = url[0];
    });

    $('.apply-button').on('click', function () {
        var data = $(this).data();
        $("#applyID").val(data.applyTo);
    });

    $('.dismiss-button').on('click', function () {
        var data = $(this).data();
        $("#dismissID").val(data.dismissTo);
    })
    $('.button-comment').on('click', function () {
        var data = $(this).data();
        $("#commentToID").val(data.commentTo);
    });
});