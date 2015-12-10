(function ($) {
    var PLUGIN_NAME = 'eCardMobileBlock';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults: {
            media: {}
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;
        var newMedia = $.isEmptyObject(options.media.id);
        var id = newMedia ? null : options.media.id;

        var _media;

        function main() {

            _media = options.media;

            $(options.target).load("Templates/eCardMobileBlock.htm", function () {
                $target.find(".hide").hide().removeClass('hide');

                if (id) {
                    loadMediaData();
                }

                setupEvents();

            });
        }

        function loadMediaData() {

            $target.find("#mobileTitle").val(htmlDecode(_media.eCard.mobileCardName));
            $target.find("#mobileTargetUrl").val(_media.eCard.mobileTargetUrl);
            $target.find("#mobileOutsideText").val(htmlDecode(_media.eCard.cardTextOutside));
            $target.find("#mobileInsideText").val(htmlDecode(_media.eCard.cardTextInside));
            $target.find("#mobileInsideLrgImgUrl").val(_media.eCard.imageSourceInsideLarge);
            $target.find("#mobileInsideSmlImgUrl").val(_media.eCard.imageSourceInsideSmall);
            $target.find("#mobileOutsideLrgImgUrl").val(_media.eCard.imageSourceOutsideLarge);
            $target.find("#mobileOutsideSmlImgUrl").val(_media.eCard.imageSourceOutsideSmall);

            $target.find("#showMobile").prop('checked', _media.eCard.isMobile);
            if (_media.eCard.isMobile) {
                $(".mobileInformation").show();
            }
            $target.find("#mobileActive").prop('checked', _media.eCard.isActive);

        }


        function setupEvents() {

            $('#showMobile').on('click', function () {
                $('.mobileInformation').toggle();
            });

        };

        function mapValuesToMedia() {
            _media.eCard.isMobile = $target.find("#showMobile").is(':checked');
            _media.eCard.isActive = $target.find("#mobileActive").is(':checked');

            _media.eCard.mobileCardName = htmlEncode($target.find("#mobileTitle").val());
            _media.eCard.mobileTargetUrl = $target.find("#mobileTargetUrl").val();
            _media.eCard.cardTextOutside = htmlEncode($target.find("#mobileOutsideText").val());
            _media.eCard.cardTextInside = htmlEncode($target.find("#mobileInsideText").val());
            _media.eCard.imageSourceInsideLarge = $target.find("#mobileInsideLrgImgUrl").val();
            _media.eCard.imageSourceInsideSmall = $target.find("#mobileInsideSmlImgUrl").val();
            _media.eCard.imageSourceOutsideLarge = $target.find("#mobileOutsideLrgImgUrl").val();
            _media.eCard.imageSourceOutsideSmall = $target.find("#mobileOutsideSmlImgUrl").val();

        }

        main();

        this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.validate = function (returnGeneralValidationResult) {
            mapValuesToMedia();

            if (!_media.eCard.isMobile) {
                returnGeneralValidationResult(true);
                return;
            }

            var isValid = true;

            //// clear current errors before validating:
            clearError($target.find('#mobileTitleLabel'));
            clearError($target.find('#mobileTargetUrlLabel'));
            clearError($target.find('#mobileOutsideLrgImgUrlLabel'));
            clearError($target.find('#mobileOutsideSmlImgUrlLabel'));
            clearError($target.find('#mobileInsideTextLabel'));
            clearError($target.find('#mobileInsideLrgImgUrlLabel'));
            clearError($target.find('#mobileInsideSmlImgUrlLabel'));

            // run regular validations
            if (!isMobileTitleValid()) isValid = false;
            if (!isMobileTargetUrlValid()) isValid = false;
            if (!isInsideTextValid()) isValid = false;
            if (!isMobileOutsideLrgImgUrlValid()) isValid = false;
            if (!isMobileOutsideSmlImgUrlValid()) isValid = false;
            if (!isMobileInsideLrgImgUrlValid()) isValid = false;
            if (!isMobileInsideSmlImgUrlValid()) isValid = false;

            if (isValid) {
                areMobileResourceValid(returnGeneralValidationResult);
            }
            else {
                returnGeneralValidationResult(false);
            }
        },

        this.updateControl = function () {
            loadMediaData();
        },

        this.updateMediaObj = function (media) {
            _media = media;
            mapValuesToMedia();
            return _media;
        };

        ///////// validation types

        function isMobileTitleValid() {
            var isValid = true;
            if (_media.eCard.mobileCardName === '') {
                showError($target.find('#mobileTitleLabel'), 'You must enter a Mobile Title');
                isValid = false;
            } else if (_media.eCard.mobileCardName.length > 250) {
                showError($target.find('#mobileTitleLabel'), 'Your Mobile Title must be less than 250 characters');
                isValid = false;
            }
            return isValid;
        }

        function isMobileTargetUrlValid() {
            var isValid = true;
            if ($.isEmptyObject(_media.eCard.mobileTargetUrl)) {
                showError($target.find('#mobileTargetUrlLabel'), 'Mobile Target Url is a required field.');
            }
            else {
                isValid = testUrlFormat(
                    _media.eCard.mobileTargetUrl,
                    $target.find('#mobileTargetUrlLabel'),
                    'Mobile Target URL is not in a valid URL format.'
                    );
            }
            return isValid;
        }

        function isInsideTextValid() {
            var isValid = true;
            if ($.isEmptyObject(_media.eCard.cardTextInside)) {
                showError($target.find('#mobileInsideTextLabel'), 'Inside Text is a required field.');
            }
            return isValid;
        }

        function isMobileOutsideLrgImgUrlValid() {
            var isValid = true;
            isValid = testUrlFormat(
                _media.eCard.imageSourceOutsideLarge,
                $target.find('#mobileOutsideLrgImgUrlLabel'),
                'Outside Image Source (Large) is not in a valid URL format.'
                );
            return isValid;
        }

        function isMobileOutsideSmlImgUrlValid() {
            var isValid = true;
            isValid = testUrlFormat(
                _media.eCard.imageSourceOutsideSmall,
                $target.find('#mobileOutsideSmlImgUrlLabel'),
                'Outside Image Source (Small) is not in a valid URL format.'
                );
            return isValid;
        }

        function isMobileInsideLrgImgUrlValid() {
            var isValid = true;
            isValid = testUrlFormat(
                _media.eCard.imageSourceInsideLarge,
                $target.find('#mobileInsideLrgImgUrlLabel'),
                'Inside Image Source (Large) is not in a valid URL format.'
                );
            return isValid;
        }

        function isMobileInsideSmlImgUrlValid() {
            var isValid = true;
            isValid = testUrlFormat(
                _media.eCard.imageSourceInsideSmall,
                $target.find('#mobileInsideSmlImgUrlLabel'),
                'Inside Image Source (Small) is not in a valid URL format.'
                );
            return isValid;
        }


        function areMobileResourceValid(resultCallback) {

            var callback = function (isValid, msg) {
                $.each(msg, function (index, m) {
                    //code = resource[1]
                    var i = m.code.replace("Resource[", "");
                    i = i.replace("]", "");
                    i = eval(i);

                    //exclude empty fields
                    if (m.userMessage.indexOf("Exception") !== 0) {
                        if (i === 0) {
                            showError($target.find('#mobileTargetUrlLabel'), 'A web resource for the Mobile Target URL could not be found at ' + _media.eCard.mobileTargetUrl + '.');
                            isValid = false;
                        }
                        else if (i === 1) {
                            showError($target.find('#mobileOutsideLrgImgUrlLabel'), 'An image resource for Outside Image Source (Large) could not be found at ' + _media.eCard.imageSourceOutsideLarge + '.');
                            isValid = false;
                        }
                        else if (i === 2) {
                            showError($target.find('#mobileOutsideSmlImgUrlLabel'), 'An image resource for Outside Image Source (Small) could not be found at ' + _media.eCard.imageSourceOutsideSmall + '.');
                            isValid = false;
                        }
                        else if (i === 3) {
                            showError($target.find('#mobileInsideLrgImgUrlLabel'), 'An image resource for Inside Image Source (Large) could not be found at ' + _media.eCard.imageSourceInsideLarge + '.');
                            isValid = false;
                        }
                        else if (i === 4) {
                            showError($target.find('#mobileInsideSmlImgUrlLabel'), 'An image resource for Inside Image Source (Small) could not be found at ' + _media.eCard.imageSourceInsideSmall + '.');
                            isValid = false;
                        }
                    }
                });
                resultCallback(isValid);
            };

            var urls = [];
            if (_media.eCard.mobileTargetUrl !== '') { urls.push({ "url": _media.eCard.mobileTargetUrl, "resourceType": "WebPage" }); } else urls.push({});
            if (_media.eCard.imageSourceOutsideLarge !== '') { urls.push({ "url": _media.eCard.imageSourceOutsideLarge, "resourceType": "image" }); } else urls.push({});
            if (_media.eCard.imageSourceOutsideSmall !== '') { urls.push({ "url": _media.eCard.imageSourceOutsideSmall, "resourceType": "image" }); } else urls.push({});
            if (_media.eCard.imageSourceInsideLarge !== '') { urls.push({ "url": _media.eCard.imageSourceInsideLarge, "resourceType": "image" }); } else urls.push({});
            if (_media.eCard.imageSourceInsideSmall !== '') { urls.push({ "url": _media.eCard.imageSourceInsideSmall, "resourceType": "image" }); } else urls.push({});


            urlExists(urls, callback);


        }

        function testUrlFormat(value, $label, msg) {
            if (value === '') { return true; }
            var isValid = true;
            if (!isValidUrlFormat(value)) {
                showError($label, msg);
                isValid = false;
            }
            return isValid;
        }


        //////////////////////////




        return this;



    };

})(jQuery);