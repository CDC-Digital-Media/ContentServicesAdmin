(function ($) {
    var PLUGIN_NAME = 'pdfResources';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults:
        {
            media: {},
            onContinue: "",
            embedCodeTemplate: ""
        }
    };

    "use strict"; //ignore jslint

    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;
        var newMedia = $.isEmptyObject(options.media.id);
        var id = newMedia ? null : options.media.id;
        var checkDuplicate = false;
        var fileSize = "";

        function handleContinue(oMedia) {
            var func = options.onContinue;
            if (typeof func === 'function') {
                func(oMedia);
            }
        }

        var _media;
        var _embedCode;

        function main() {
            _media = options.media;

            $(options.target).load("Templates/PdfResources.htm", function () {
                $target.find(".hide").hide().removeClass('hide');

                $target.find(".mediaTypeName").text(options.media.mediaType);

                if (id) {
                    loadMediaData();
                    $target.find("#cancelButton").hide();
                    runValidation();
                }

                $target.find("#resetResources").hide();

                setupEvents();
            });
        }

        function loadMediaData() {
            $target.find("#sourceUrl").val(_media.sourceUrl);
            if (_media.sourceUrl == _media.targetUrl) {
                $target.find("#targetUrl").val("");
            }
            else {
                $target.find("#targetUrl").val(_media.targetUrl);
            }
        }

        function setupEvents() {

            $("body").on("keypress", function (e) {
                if (e.keyCode === 13) { // enter key
                    if ($("#validateResources").is(":visible")) {
                        $("#validateResources").click();
                    }
                    return false;
                }
            });

            $target.find("#validateResources").on("click", function () {
                runValidation();
            });

            $target.find("#cancelButton").on("click", function () {
                $target.find("#sourceUrl").val('');
                $target.find("#targetUrl").val('');
                $target.find(".alert-success").hide();
                $target.find('.nav-tabs').hide();
                $target.find('.preview').hide();
            });

            $target.find("#sourceUrl, #targetUrl").keyup(function () {
                setPrevalidateState();
                if (id) {
                    $target.find("#resetResources").show();
                }
            });

            $target.find("#continueButton").on("click", function () {
                handleContinue(options.media);
            });

            $target.find("#resetResources").click(function () {
                loadMediaData();
                $(this).hide();
            });

        }

        function runValidation(postProcess) {

            var isValid = true;
            $().showSpinner();

            var sourceUrl = $target.find("#sourceUrl").val().trim();
            var targetUrl = $target.find("#targetUrl").val().trim();

            //clear all errors
            clearError($target.find('#sourceLabel'));
            clearError($target.find('#targetLabel'));

            if (sourceUrl === '') {
                showError($target.find('#sourceUrlLabel'), 'Source URL is a required field.');
                isValid = false;
            }
            else if (!isValidUrlFormat(sourceUrl)) {
                showError($target.find('#sourceUrlLabel'), 'Source is not in a valid URL format.');
                isValid = false;
            }

            if (targetUrl != '' && !isValidUrlFormat(targetUrl)) {
                showError($target.find('#targetLabel'), 'Target URL is not in a valid URL format.');
                isValid = false;
            }

            if (isValid) {

                var urls = [];
                if (sourceUrl !== '') { urls.push({ "url": sourceUrl, "resourceType": "PDF" }); } else urls.push({});
                if (targetUrl !== '') { urls.push({ "url": targetUrl, "resourceType": "WebPage" }); } else urls.push({});

                urlExists(urls, function (exists, aMsg) {
                    if (aMsg.length > 0) {
                        //alert(JSON.stringify(aMsg));

                        $.each(aMsg, function (index, msg) {
                            //code = resource[1]
                            var i = msg.code.replace("Resource[", "");
                            i = i.replace("]", "");
                            i = eval(i);

                            //exclude empty fields
                            if (msg.userMessage.indexOf("Exception") !== 0) {
                                if (i === 0) {
                                    showError($target.find('#sourceUrlLabel'), 'A resource for the Source URL could not be found at ' + sourceUrl + '.');
                                    isValid = false;
                                }
                                else if (i === 1) {
                                    showError($target.find('#targetLabel'), 'A resource for the Target URL could not be found at ' + targetUrl + '.');
                                    isValid = false;
                                }
                            }

                        });
                    }

                    if (isValid) {
                        $target.find("#badThing").empty().hide();
                        $target.find(".alert-success").show();
                        $target.find('#sourceUrlLabel').hide();
                        $target.find('.nav-tabs').show();                        

                        sourceUrl = sourceUrl.replace('http://', '');
                        sourceUrl = sourceUrl.replace('https://', '');

                        $target.find('.preview').html("<iframe src='https://docs.google.com/gview?url=" + sourceUrl + "&embedded=true' style='width:100%;height:600px;' frameborder='0'></iframe>").show();

                        if (id) {
                            $("#validate #cancelButton").hide();
                        }
                    }

                    if (postProcess) {
                    	postProcess(isValid);
                    }
                    else {
                    	$().hideSpinner();
                    }

                });

            }
            else {
                $().hideSpinner();
            }

        }

        main();

        this.hide = function () {
            $(options.target).hide();
        },
        this.show = function () {
            setPrevalidateState();
            $(options.target).show();
        },
        this.triggerValidation = function () {
            setPrevalidateState();
            runValidation();
        },
        this.validate = function (returnValidationResult) {
            runValidation(returnValidationResult)
        },

        this.updateMediaObj = function (media) {

            var sourceUrl = $target.find("#sourceUrl").val().trim();
            var targetUrl = $target.find("#targetUrl").val().trim();

            media.targetUrl = targetUrl;
            media.sourceUrl = sourceUrl;            
            media.embedcode = "";   

            return media;
        };

        var setPrevalidateState = function () {


            $target.find(".preview").hide();
            $target.find('.nav-tabs').show();
            $target.find(".alert-danger, .nav-tabs").hide();
            $target.find(".alert-success, #sidebar").hide();
            $target.find(".preview").empty();
            $target.find("#validateUrl").removeAttr("disabled");
            $target.find("#resetResources").hide();

            checkDuplicate = id ? false : true;

        };

        return this;

    };

})(jQuery);