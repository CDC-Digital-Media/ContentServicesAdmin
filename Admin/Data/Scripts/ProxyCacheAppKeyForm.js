(function ($) {
    var PLUGIN_NAME = 'proxyCacheAppKeyForm';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults: {
            proxyCacheAppKeyId: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;

        var _proxyCacheAppKey = {};

        var loadPage = function () {
            $target.find("#save").on("click", function () {
                saveProxyCacheAppKey();
                return false;
            });

            if (options.proxyCacheAppKeyId === "") {
                $target.find("#editProxyCacheAppKeyHeader").text("Add New Proxy Cache App Key");
            }
            else {
                $().showSpinner();
                $target.find("#editProxyCacheAppKeyHeader").text("Edit Proxy Cache App Key ID " + options.proxyCacheAppKeyId);
                var url = APIRoot + "/adminapi/v1/resources/dataappkey/" + options.proxyCacheAppKeyId;
                $.ajax({
                    url: url,
                    dataType: 'jsonp'
                }).done(function (response) {

                    _proxyCacheAppKey = response.results;
                    if (!_proxyCacheAppKey || _proxyCacheAppKey.proxycacheappkeyid !== options.proxyCacheAppKeyId) {
                        $("#badSave").empty().append("Unable to load Proxy Cache App Key item").show();
                        $("#goodSave").hide();
                        $().hideSpinner();
                        return;
                    }
                    resetFormValues();
                    $().hideSpinner();
                }).fail(function (xhr, ajaxOptions, thrownError) {
                    var response = $.parseJSON(xhr.responseText);
                    var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
                    onFailedSave(obj.meta.message);
                });
            }
        }

        var saveProxyCacheAppKey = function() {
            updateProxyCacheAppKeyWithFormData();

            if (validate()) {
                $target.find("#goodSave").hide();
                $().showSpinner();

                var url = urlRoot + "/Secure.aspx/" + (_proxyCacheAppKey.proxycacheappkeyid ? 'UpdateProxyCacheAppKey' : 'CreateProxyCacheAppKey');
                var apiURL = APIRoot + "/adminapi/v1/resources/dataappkey";
                if (_proxyCacheAppKey.proxycacheappkeyid) { apiURL = apiURL + "/" + _proxyCacheAppKey.proxycacheappkeyid; }

                var call = JSON.stringify({ "data": JSON.stringify(_proxyCacheAppKey), "apiUrl": apiURL });

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
                            _proxyCacheAppKey = obj.results;
                            resetFormValues();
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

        var updateProxyCacheAppKeyWithFormData = function () {
            _proxyCacheAppKey.description = $target.find("#description").val(); //TODO: check/test special characters, seems easy to break?
            _proxyCacheAppKey.active = $target.find("input[id='isactive']:checked").length > 0 ? "true" : "false";

        }

        var validate = function () {
            var isValid = true;            

            clearError($target.find("#descriptionLabel"));

            if (!isDescriptionValid()) { isValid = false; }

            return isValid;
        }

        var isDescriptionValid = function () {
            var isValid = true;
            //Nothing to validate as of now
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

        function showError(target, msg) {
            target.addClass('alert alert-danger');
            target.empty().append(msg).show();
        }

        function clearError($target) {
            $target.removeClass('alert alert-danger');
            $target.empty().hide();
        }

        function resetFormValues() {
            $target.find("#proxycacheappkeyid").val(_proxyCacheAppKey.proxycacheappkeyid);
            $target.find("#description").val(_proxyCacheAppKey.description);
            $target.find("#isactive").attr("checked", (_proxyCacheAppKey.active.toLowerCase() == "true" ? true : false));

            if (_proxyCacheAppKey.proxycacheappkeyid === "") {
                $target.find("#editProxyCacheAppKeyHeader").text("Add New Proxy Cache App Key");
            }
            else {
                $target.find("#editProxyCacheAppKeyHeader").text("Edit Proxy Cache App Key ID " + _proxyCacheAppKey.proxycacheappkeyid);
            }
        }

        loadPage();
    };    

})(jQuery);