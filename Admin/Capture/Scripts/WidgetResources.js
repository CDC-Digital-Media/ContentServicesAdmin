(function ($) {
    var PLUGIN_NAME = 'widgetResources';

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

            $(options.target).load("Templates/WidgetResources.htm", function () {
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
            $target.find("#embedCode").val(_media.embedcode);
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

            $target.find("#previewEmbedCode").on("click", function () {
                runValidation();
            });

            $target.find("#cancelButton").on("click", function () {
                $target.find("#sourceUrl").val('');
                $target.find("#targetUrl").val('');
                $target.find("#embedCode").val('');
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

            var embedCode = $target.find("#embedCode").val().trim();

            //clear all errors
            clearError($target.find('#embedCodeLabel'));


            if (embedCode === '') {
                showError($target.find('#embedCodeLabel'), 'Embed Code is a required field.');
                isValid = false;
            }

            if (isValid) {

                $target.find("#badThing").empty().hide();
                $target.find(".alert-success").show();
                $target.find('#sourceUrlLabel').hide();
                $target.find('.nav-tabs').show();

                var iframe = document.createElement('iframe');
                iframe.frameBorder = 0;
                iframe.width = "100%";
                iframe.height = "500px";
                $target.find('.preview').append(iframe);
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(embedCode);
                iframe.contentWindow.document.close();

                //$target.find('.preview').html(embedCode).show();

                if (id) {
                    $("#validate #cancelButton").hide();
                }


                if (postProcess) {
                	postProcess(isValid);
                }
                else {
                	$().hideSpinner();
                }



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

        	var embedCode = $target.find("#embedCode").val().trim();

            media.targetUrl = 'http://www......[domain]...../widgets';
            media.sourceUrl = 'http://www......[domain]...../widgets';
            media.embedcode = embedCode.split('\"').join('\'');

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
