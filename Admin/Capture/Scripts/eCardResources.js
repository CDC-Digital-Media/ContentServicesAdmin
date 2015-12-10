(function ($) {
    var PLUGIN_NAME = 'eCardResources';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults:
        {
            media: {},
            onContinue: ""
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

        function handleContinue(oMedia) {
            var func = options.onContinue;
            if (typeof func === 'function') {
                func(oMedia);
            }
        }

        var _media;

        function main() {
            _media = options.media;

            $(options.target).load("Templates/eCardResources.htm", function () {
                $target.find(".hide").hide().removeClass('hide');
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
            $target.find("#swfSourceUrl").val(_media.sourceUrl);
            $target.find("#html5SourceUrl").val(_media.eCard.html5Source);
            $target.find("#targetUrl").val(_media.targetUrl);
        }

        function setupEvents() {

            $("body").on("keypress", function (e) {
                if (e.keyCode === 13) { // enter key
                    if ($target.find("#swfSourceUrl").is(":visible")) {
                        runValidation();
                    }
                }
            });

            $target.find("#validateResources").on("click", function () {
                runValidation();
            });

            $target.find("#cancelButton").on("click", function () {
                $target.find("#swfSourceUrl").val('');
                $target.find("#html5SourceUrl").val('');
                $target.find("#targetUrl").val('');
                $target.find(".alert-success").hide();
            });

            $target.find("#swfSourceUrl,#html5SourceUrl,#targetUrl").keyup(function () {
                $target.find(".alert-success").hide();
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

            var swfValue = $target.find("#swfSourceUrl").val().trim();
            var html5Source = $target.find("#html5SourceUrl").val().trim();
            var targetUrl = $target.find("#targetUrl").val().trim();

            //clear all errors
            clearError($target.find('#swfLabel'));
            clearError($target.find('#html5Label'));
            clearError($target.find('#targetLabel'));

            if (swfValue === '' && html5Source === '') {
                showError($target.find('#swfLabel'), 'SWF Source or HTML5 Source must be provided.');
                showError($target.find('#html5Label'), 'SWF Source or HTML5 Source must be provided.');
                isValid = false;
            } else {
                if (swfValue !== '' && !isValidUrlFormat(swfValue)) {
                    showError($target.find('#swfLabel'), 'SWF Source is not in a valid URL format.');
                    isValid = false;
                }
                if (html5Source !== '' && !isValidUrlFormat(html5Source)) {
                    showError($target.find('#html5Label'), 'HTML5 Source is not in a valid URL format.');
                    isValid = false;
                }
            }

            if (targetUrl === '') {
                showError($target.find('#targetLabel'), 'Target URL is a required field.');
                isValid = false;
            }
            else if (!isValidUrlFormat(targetUrl)) {
                showError($target.find('#targetLabel'), 'Target URL is not in a valid URL format.');
                isValid = false;
            }

            if (isValid) {

                var urls = [];
                if (swfValue !== '') { urls.push({ "url": swfValue, "resourceType": "Flash" }); } else urls.push({});
                if (html5Source !== '') { urls.push({ "url": html5Source, "resourceType": "WebPage" }); } else urls.push({});
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
                                    showError($target.find('#swfLabel'), 'A resource for the SWF Source could not be found at ' + swfValue + '.');
                                    isValid = false;
                                }
                                else if (i === 1) {
                                    showError($target.find('#html5Label'), 'A resource for the HTML 5 Source could not be found at ' + html5Source + '.');
                                    isValid = false;
                                }
                                else if (i === 2) {
                                    showError($target.find('#targetLabel'), 'A resource for the Target URL could not be found at ' + targetUrl + '.');
                                    isValid = false;
                                }
                            }
                        });
                    }

                    if (isValid) {
                        $target.find("#badThing").empty().hide();
                        $target.find(".alert-success").show();
                        $target.find('#swfLabel, #targetLabel').hide();

                        if (id) {
                            $("#validate #cancelButton").hide();
                        }
                    }

                    if (postProcess) { postProcess(isValid); }

                    $().hideSpinner();

                });

            }
            else {
                $().hideSpinner();
            }

        }

        var setPrevalidateState = function () {

            $target.find("#resetResources").hide();

            checkDuplicate = id ? false : true;

        };


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

            var swfValue = $target.find("#swfSourceUrl").val().trim();
            var html5Source = $target.find("#html5SourceUrl").val().trim();
            var targetUrl = $target.find("#targetUrl").val().trim();

            media.sourceUrl = swfValue;
            media.targetUrl = targetUrl;
            media.eCard.html5Source = html5Source;

            return media;
        };

        return this;

    };

})(jQuery);