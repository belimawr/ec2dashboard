function createEc2dashboard() {

    var showInstances = function (ec2, params) {
        ec2.describeInstances(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
            } else {
                console.log(data);

                var $container = $('#ec2dashboard');

                $('.date', $container).fadeOut(100, function () {
                    $(this).text((new Date()).toTimeString()).fadeIn(500);
                });

                $.each(data.Reservations, function (index, value) {

                    var instanceId = value.Instances[0].InstanceId;
                    var instanceName = instanceId;
                    var instanceIP = value.Instances[0].PrivateIpAddress

                    if (typeof value.Instances[0].Tags[0] != "undefined") {
                        instanceName = value.Instances[0].Tags[0].Value
                    }

                    if ($('#' + instanceName, $container).length === 0) {
                        $('.instances', $container).append(
                            '<div id="' + instanceName + '" class="service">' +
                            '<div class="service-name">' + instanceName + '</div>' +
                            '</div>');
                    }

                    var url = 'http://' + instanceIP + '/_healthcheck_';

                    $('#' + instanceName, $container).append('<div id="' + instanceId + '" class="instance"></div>');
                    checkInstance($('#' + instanceId), url);
                });
            }
        });
    }

    var checkInstance = function checkInstance($elem, url) {
        $.ajax({
            url: url,
            timeout: 1000
        }).done(function (data) {
            $elem.removeClass('fail').addClass('ok').html('<a href="' + url + '">' + data + '</a>');
        }).fail(function (data) {
            $elem.removeClass('ok').addClass('fail').html('<a href="' + url + '">fail</a>');
        });
    }

    var url = new URL(document.location.href);

    if (!url.searchParams.get('accessKeyId')) {
        alert('Specify accessKeyId');
    }

    if (!url.searchParams.get('secretAccessKey')) {
        alert('Specify secretAccessKey');
    }

    if (!url.searchParams.get('region')) {
        alert('Specify a region');
    }

    if (!url.searchParams.get('q')) {
        alert('Specify a list of services');
    }

    var services = [];
    if (url.searchParams.get('q')) {
        services = url.searchParams.get('q').split(',');
    }
    
    AWS.config = new AWS.Config({
        accessKeyId: url.searchParams.get('accessKeyId'),
        secretAccessKey: url.searchParams.get('secretAccessKey'),
        region: url.searchParams.get('region')
    });

    var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});
    var params = {
        Filters: [
            {
                Name: 'tag:Name',
                Values: services
            },
        ],
    };

    showInstances(ec2, params);
    setInterval(function () {
        showInstances(ec2, params);
    }, 10000);
}