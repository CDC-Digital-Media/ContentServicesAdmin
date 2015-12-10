(function ($) {
    var PLUGIN_NAME = 'proxyCacheForm';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults: {
            proxyCacheId: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;

        var _proxyCache = {};

        var loadPage = function () {
            $target.find("#save").on("click", function () {
                saveProxyCache();
                return false;
            });

            if (options.proxyCacheId === "") {
                $target.find("#editProxyCacheHeader").text("Add New Proxy Cache Data");
                $target.find("#expiredate").datepicker("setValue", new Date());
                $target.find('#expiretime').timepicker({ defaultTime: formatAMPM(new Date()) });                
            }
            else {
                $().showSpinner();
                $target.find("#editProxyCacheHeader").text("Edit Proxy Cache Data ID " + options.proxyCacheId);
                var url = APIRoot + "/adminapi/v1/resources/data/" + options.proxyCacheId;
                $.ajax({
                    url: url,
                    dataType: 'jsonp'
                }).done(function (response) {

                    _proxyCache = response.results;
                    if (!_proxyCache || _proxyCache.id !== options.proxyCacheId) {
                        $("#badSave").empty().append("Unable to load Proxy Cache item").show();
                        $("#goodSave").hide();
                        $().hideSpinner();
                        return;
                    }


                    //$target.find("#id").val(options.proxyCacheId);
                    //$target.find("#data").val(_proxyCache.data);
                    var decodedUrl = _proxyCache.url;
                    try {
                        decodedUrl = decodeURI(decodedUrl);
                    }
                    catch (err) { }
                    $target.find("#url").val(decodedUrl);
                    $target.find("#datasetid").val(_proxyCache.datasetid);
                    var expireDate = new Date(_proxyCache.expirationdatetime);
                    $target.find("#expiredate").datepicker("setValue", expireDate);
                    $target.find("#expiretime").timepicker({ defaultTime: formatAMPM(expireDate) });
                    var expireIntervalParsed = parseTimeSpan(_proxyCache.expirationinterval);
                    $target.find("#expiredays").val(expireIntervalParsed.days);
                    $target.find("#expirehours").val(expireIntervalParsed.hours);
                    $target.find("#failures").val(_proxyCache.failures);
                    $().hideSpinner();
                }).fail(function (xhr, ajaxOptions, thrownError) {
                    var response = $.parseJSON(xhr.responseText);
                    var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
                    onFailedSave(obj.meta.message);
                });
            }
        }

        var saveProxyCache = function() {
            updateProxyCacheWithFormData();

            if (validate()) {
                $target.find("#goodSave").hide();
                $().showSpinner();

                var url = urlRoot + "/Secure.aspx/" + (_proxyCache.id ? 'UpdateProxyCache' : 'CreateProxyCache');
                var apiURL = APIRoot + "/adminapi/v1/resources/data";
                if (_proxyCache.id) { apiURL = apiURL + "/" + _proxyCache.id; }

                var call = JSON.stringify({ "data": JSON.stringify(_proxyCache), "apiUrl": apiURL });

                console.debug(call);

                $.ajax({
                    type: "POST",
                    url: url,
                    data: call,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function (response) {
                        var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
                        if (obj.meta.status != 200) {
                            onFailedSave(obj.meta.message);
                        }
                        else {
                            _proxyCache = obj.results;
                            $target.find("#editProxyCacheHeader").text("Edit Proxy Cache Data ID " + _proxyCache.id);
                            $target.find("#badSave").hide();
                            $target.find("#goodSave").show();
                            $().hideSpinner();
                        }

                    }
                }).fail(function (xhr, ajaxOptions, thrownError) {
                    var response = $.parseJSON(xhr.responseText);
                    var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
                    onFailedSave(obj.meta.message);
                });
            }
            else {
                console.debug("Invalid, not saving");
            }
        }

        var updateProxyCacheWithFormData = function () {
            _proxyCache.url = $target.find("#url").val(); 
            _proxyCache.datasetid = $target.find("#datasetid").val();
            _proxyCache.failures = $target.find("#failures").val();

            var expireDate = $target.find("#expiredate").val();
            var expireTime = $target.find("#expiretime").val();
            try {
                var expireDate = $target.find("#expiredate").val();
                var expireTime = $target.find("#expiretime").val();
                var time = expireTime.split(" ")[0];
                var hours = time.split(":")[0];
                var minutes = time.split(":")[1];

                if (expireTime.split(" ")[1] === 'PM') {
                    hours = eval(hours) + 12;
                }

                var theDate = new Date(expireDate);
                theDate.setHours(hours);
                theDate.setMinutes(minutes);
                var utcDate = theDate.toISOString();
                _proxyCache.expirationdatetime = utcDate;
            }
            catch (error) {
            }

            var expireDays = $target.find("#expiredays").val();
            var expireHours = $target.find("#expirehours").val();
            _proxyCache.expirationinterval = expireDays + "." + expireHours + ":00:00";

            _proxyCache.needsrefresh = "false";

        }

        var validate = function () {
            var isValid = true;            

            clearError($target.find("#urlLabel"));
            clearError($target.find("#datasetidLabel"));
            clearError($target.find("#expiredateLabel"));
            clearError($target.find("#expiretimeLabel"));
            clearError($target.find("#expiredaysLabel"));
            clearError($target.find("#expirehoursLabel"));
            clearError($target.find("#failuresLabel"));

            if (!isUrlValid()) { isValid = false; }
            if (!isDatasetIdValid()) { isValid = false; }
            if (!isExpirationIntervalValid()) { isValid = false; }
            if (!isExpirationDateTimeValid()) { isValid = false; }
            if (!isFailuresValid()) { isValid = false; }

            return isValid;
        }

        var isUrlValid = function () {
            var isValid = true;
            if ($.isEmptyObject(_proxyCache.url)) {
                showError($target.find("#urlLabel"), "URL is required");
                isValid = false;
            }
            return isValid;
        }

        var isDatasetIdValid = function () {
            var isValid = true;
            if (!$.isEmptyObject(_proxyCache.datasetid)) {
                if (_proxyCache.datasetid.match(/^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/) == null) {
                    showError($target.find("#datasetidLabel"), "Dataset ID must be alpha numerics in the form XXXX-XXXX");
                    isValid = false;
                }
            }
            return isValid;
        }

        var isFailuresValid = function () {
            var isValid = true;
            if (!$.isEmptyObject(_proxyCache.failures)) {
                if (_proxyCache.failures.match(/^[\d]+$/) == null) {
                    showError($target.find("#failuresLabel"), "Consecutive Data Failures must be a positive integer");
                    isValid = false;
                }
            }
            return isValid;
        }

        var isExpirationDateTimeValid = function () {
            var isValid = true;

            var expireDate = $target.find("#expiredate").val();
            var expireTime = $target.find("#expiretime").val();
            var expireDateLabel = $target.find("#expiredateLabel");
            var expireTimeLabel = $target.find("#expiretimeLabel");

            if ($.isEmptyObject(expireDate)) {
                showError(expireDateLabel, "Expiration Date is required");
                isValid = false;
            }

            if ($.isEmptyObject(expireTime)) {
                showError(expireTimeLabel, "Expiration Time is required");
                isValid = false;
            }

            if (!expireDate.match(/^(1[0-2]|0[1-9])\/(3[0-1]|[1-2][0-9]|0[1-9])\/(20[0-9]{2})$/)) {
                showError(expireDateLabel, "Expiration Date format is invalid");
                isValid = false;
            }

            if (!expireTime.match(/^((1[0-2]|[1-9]):[0-5][0-9] (AM|PM))$/)) {
                showError(expireTimeLabel, "Expiration Time format is invalid");
                isValid = false;
            }

            if (isValid) {
                try {

                    var time = expireTime.split(" ")[0];
                    var hours = time.split(":")[0];
                    var minutes = time.split(":")[1];

                    if (expireTime.split(" ")[1] === 'PM') {
                        hours = eval(hours) + 12;
                    }

                    var theDate = new Date(expireDate);
                    theDate.setHours(hours);
                    theDate.setMinutes(minutes);
                    var utcDate = theDate.toISOString();
                    _proxyCache.expirationdatetime = utcDate;
                }
                catch (error) {
                    showError($target.find("#expiredateLabel"), "Invalid date or time format");
                    showError($target.find("#expiretimeLabel"), "Invalid date or time format");
                    isValid = false;
                }
            }

            return isValid;
        }

        var isExpirationIntervalValid = function () {
            var isValid = true;

            var daysLabel = $target.find("#expiredaysLabel");
            var hoursLabel = $target.find("#expirehoursLabel");

            var days = $target.find("#expiredays").val();
            var hours = $target.find("#expirehours").val();            

            if ($.isEmptyObject(days)) {
                showError(daysLabel, "Expiration Days is required");
                isValid = false;
            }

            if ($.isEmptyObject(hours)) {
                showError(hoursLabel, "Expiration Hours is required");
                isValid = false;
            }

            if (!days.match(/^([0-9]{0,4})$/)) {
                showError(daysLabel, "Expiration Days format is invalid");
                isValid = false;
            }

            if (!hours.match(/^([01]?[0-9]|2[0-3])$/)) {
                showError(hoursLabel, "Expiration Hours format is invalid");
                isValid = false;
            }

            return isValid;
        }

        var onFailedSave = function (oMsg) {
            if (oMsg.length > 0) {
                var messages = "<ul>";
                $(oMsg).each(function () {
                    messages = messages + "<li>" + $(this)[0].userMessage + "</li>";
                });
                messages = messages + "</ul>";

                $("#badSave").empty().append(messages).show();
            }
            $("#goodSave").hide();
            $().hideSpinner();
        };

        var formatAMPM = function(date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
        }

        function showError(target, msg) {
            target.addClass('alert alert-danger');
            target.empty().append(msg).show();
        }

        function clearError($target) {
            $target.removeClass('alert alert-danger');
            $target.empty().hide();
        }

        var parseTimeSpan = function(timeSpan) {
            var result = {};

            var timeSpanRegex = /^(([0-9]{0,7})\.)?([01]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])$/;
            var matches = timeSpanRegex.exec(timeSpan);
            if (matches != null) {
                if (matches.length == 6) {
                    if (matches[2]) {
                        result.days = matches[2];
                    }
                    result.hours = matches[3];
                    result.minutes = matches[4];
                    result.seconds = matches[5];
                }
            }
            if (!result.days) {
                result.days = "0";
            }
            if (!result.hours) {
                result.hours = "12";
            }
            if (!result.minutes) {
                result.minutes = "00";
            }
            if (!result.seconds) {
                result.seconds = "00";
            }
            return result;
        }

        var buildTimeSpan = function(days, hours, minutes, seconds) {
            return days + "." + hours + ":" + minutes + ":" + seconds;
        }

        loadPage();
    };    

})(jQuery);