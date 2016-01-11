(function ($) {
    var PLUGIN_NAME = 'captureEcard';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults:
        {
            mediaId: '',
            mediaType: ''
        }
    };

    "use strict"; //ignore jslint

    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;

        // modules
        var _titleBlock;
        var _eCardResources;
        var _generalBlock;
        var _eCardMobileBlock;
        var _sourceBlock;
        var _categoryBlock;
        var _locationBlock;
        var _extAttrBlock;
        var _altImageBlock;

        var _media;
        var _initialSourceUrl;

       
        var loadPage = function (media) {

            _media = media;
            _initialSourceUrl = '';

            $(options.target).load("Templates/AddEcardContent.htm", function () {

                $target.find(".hide").hide().removeClass('hide');

                $target.find(".typeHeader").text(options.mediaType + " Content");

                // Instantiate widgets ///////////////////////////////////////////////////
                var $titleBlockDiv = $("<div class='titleBlock'>").appendTo(".detail");
                _titleBlock = $titleBlockDiv.titleBlock({
                    media: _media
                });

                var $eCardResources = $("<div class='eCardResources'>").appendTo(".detail");
                _eCardResources = $eCardResources.eCardResources({
                    media: _media,
                    onContinue: function () {
                        _eCardResources.updateMediaObj(_media);
                        _generalBlock.updateControl(_media);
                        setupDetailDisplay();
                    }
                });

                var $generalBlockDiv = $("<div class='generalBlock'>").appendTo(".detail");
                _generalBlock = $generalBlockDiv.generalBlock({
                    media: _media,
                    onTargetUrlEdit: setupValidationDisplay,
                    onSetPublished: function () {
                        _generalBlock.updateMediaObj(_media);
                        _categoryBlock.updateControl(_media);
                    }
                });

                var $eCardMobileBlockDiv = $("<div class='eCardMobileBlock'>").appendTo(".detail");
                _eCardMobileBlock = $eCardMobileBlockDiv.eCardMobileBlock({
                    media: _media
                });

                var $sourceBlockDiv = $("<div class='sourceBlock'>").appendTo(".detail");
                _sourceBlock = $sourceBlockDiv.sourceBlock({
                    media: _media
                });

                var $categoryBlockDiv = $("<div class='categoryBlock'>").appendTo(".detail");
                _categoryBlock = $categoryBlockDiv.categoryBlock({
                    media: _media
                });

                var $locationBlockDiv = $("<div class='locationBlock'>").appendTo(".detail");
                _locationBlock = $locationBlockDiv.locationBlock({
                    media: _media
                });

                var $extendedAttributeBlockDiv = $("<div class='$extendedAttributeBlockDiv'>").appendTo(".detail");
                _extAttrBlock = $extendedAttributeBlockDiv.extAttributeBlock({
                    media: _media
                });
                var $alternateImageBlockDiv = $("<div class='$alternateImageBlockDiv'>").appendTo(".detail");
                _altImageBlock = $alternateImageBlockDiv.altImageBlock({
                    media: _media
                });
                // always start on validation page
                setupValidationDisplay();

                // Instantiate widgets ///////////////////////////////////////////////////

                $target.find(".formActions").appendTo(".detail");

                $target.find("a[href='#validate']").on("click", function () {
                    setupValidationDisplay();
                    _eCardResources.triggerValidation();
                });

                $target.find(".isValidated").on("click", function () {
                    setupDetailDisplay();
                });

                $target.find("#save").on("click", function () {
                    saveMedia();
                    return false;
                });

                if(_media.id){
                    var gen = $target.find(".thumbnailPreview").thumbnailGen({ media: _media });
                    gen.loadThumbnail();
                }

            });

        };


 	function main() {

            if (options.mediaId !== '') {
                // existing media object
                CDC.Admin.Media.getMedia(options.mediaId, loadPage);
            }
            else {
                // load new media object
                _media = {
                    "mediaType": "eCard",
                    "mimeType": ".swf",
                    "encoding": "utf-8",
                    "width": 580,
                    "height": 400
                };
                _media.eCard = {};

                _initialSourceUrl = '';

                loadPage(_media);
            }

        }
        var saveMedia = function () {
            _titleBlock.hideMessage();
            $().showSpinner();

            _titleBlock.updateMediaObj(_media);
            _eCardResources.updateMediaObj(_media);
            _generalBlock.updateMediaObj(_media);
            _eCardMobileBlock.updateMediaObj(_media);
            _sourceBlock.updateMediaObj(_media);
            _categoryBlock.updateMediaObj(_media);
            _locationBlock.updateMediaObj(_media);
            _extAttrBlock.updateMediaObj(_media);
            //_altImageBlock.updateMediaObj(_media);

            var onSuccessfulSave = function (oMedia, runThumbnail) {
                _media = oMedia;
                _titleBlock.updateControl(_media);
                _categoryBlock.updateControl(_media);

                addOrUpdateThumb(runThumbnail, _initialSourceUrl, _media, APIRoot, $target);

                _initialSourceUrl = _media.sourceUrl;

                _altImageBlock.save(oMedia);

                $().hideSpinner();

            };

            var onFailedSave = function (oMsg) {
                if (oMsg.length > 0) {
                    var messages = "<ul>";
                    $(oMsg).each(function () {
                        messages = messages + "<li>" + $(this)[0].userMessage + "</li>";
                    });
                    messages = messages + "</ul>";
                    _titleBlock.showMessage(messages, 'alert alert-danger');
                } else {
                	CDC.Admin.scrolltoFirstError();
                }


                $().hideSpinner();
            };

            validateInformation(
                function () { CDC.Admin.Capture.saveMediaData(_media, onSuccessfulSave, onFailedSave); },
                function () { $().hideSpinner(); }
            );
        };

        var validateInformation = function (onSuccessfulValidation, onFailedValidation) {
            // need to nest appropriately - validation may include async calls
            var isValid = true;
            var canSaveAsInvalid = _media.id && _media.status !== "Published";

            _eCardResources.validate(function (valid) {
                if (!valid) {
                    isValid = false;
                    if (!canSaveAsInvalid) {
                        _titleBlock.showMessage('Your HTML Resource did not validate. This content can only be saved in an non-published status.', 'alert alert-danger');
                    }
                    else {
                        _titleBlock.hideMessage();
                    }
                }
                _generalBlock.validate(function (valid) {
                    if (!valid) isValid = false;

                    _eCardMobileBlock.validate(function (valid) {
                        if (!valid) isValid = false;

                        _sourceBlock.validate(function (valid) {
                            if (!valid) isValid = false;

                            _categoryBlock.validate(function (valid) {
                            if (!valid) isValid = false;
                                if (!valid) isValid = false;

                                // new rule 8/5/2014  per  //
                                // If I am an existing media and not being saved in a published status //
                                // I do not have to validate. //
                                if (isValid) {
                                    onSuccessfulValidation();
                                    _titleBlock.showMessage('Saved successfully', 'alert alert-success');
                                }
                                else if (canSaveAsInvalid) {
                                    onSuccessfulValidation();
                                    _titleBlock.showMessage('This content failed validation but was saved to the database. Before this content can published, it must pass validation.', 'alert alert-warning');
                                }                                                            
                                else {
                                	CDC.Admin.scrolltoFirstError();
                                    onFailedValidation();
                                }

                            });
                        });
                    });
                });
            });
        };
        var setupDetailDisplay = function () {
            $target.find(".addNav").show();
            $target.find(".formActions").show();

            _eCardResources.hide();
            _sourceBlock.show();
            _eCardMobileBlock.show();
            _categoryBlock.show();
            _generalBlock.show();
            _locationBlock.show();
            _extAttrBlock.show();
            _altImageBlock.show();
        };

        var setupValidationDisplay = function () {

            if (_media.id) {
                $target.find(".addNav").show();
            }
            else {
                $target.find(".addNav").hide();
            }

            $target.find(".formActions").hide();
            _titleBlock.hideMessage();

            _eCardResources.show();
            _generalBlock.hide();
            _eCardMobileBlock.hide();
            _sourceBlock.hide();
            _categoryBlock.hide();
            _locationBlock.hide();
            _extAttrBlock.hide();
            _altImageBlock.hide();

        };

        main();

    };

})(jQuery);
