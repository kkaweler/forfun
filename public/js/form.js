var socket = io.connect();

socket.on('Regions', function (result) {
    var select = $('#region select');
    select.html('');
    select.append(new Option('---', null, false, true));
    result.forEach(function (item) {
        select.append(new Option(item.Name, item.ID, false, false));
    });
    if (result.length > 0)$('#region').show();

});

socket.on('Cities', function (result) {
    var select = $('#city select');
    select.html('');
    select.append(new Option('---',null, false, true));
    result.forEach(function (item) {
        select.append(new Option(item.Name, item.ID, false, false));
    });
    if (result.length > 0) $('#city').show();

});

$(document).ready(function () {
    $('#country select').on('change', function () {
        $('#region').hide();
        $('#city').hide();
        socket.emit('GetRegions', $(this).val());
    });

    $('#region select').on('change', function () {
        $('#city').hide();
        socket.emit('GetCities', $(this).val());
    });
});