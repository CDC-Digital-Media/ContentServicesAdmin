(function ($) {
    var PLUGIN_NAME = 'captureCollection';

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
        var _generalBlock;
        var _sourceBlock;
        var _categoryBlock;
        var _childItemBlock;
        var _locationBlock;
        var _extAttrBlock;
        var _altImageBlock;

        var _media;
        var _initialSourceUrl;

        function main() {

            if (options.mediaId !== '') {
                // existing media object                
                CDC.Admin.Media.getMedia(options.mediaId, loadPage);
            }
            else {
                // load new media object
                _media = {
                    "mediaType": "Collection",
                    "encoding": "utf-8",
                    "childRelationships": []
                };

                _initialSourceUrl = '';
                loadPage(_media);
            }

        }

        var loadPage = function (media) {

            _media = media;
            _initialSourceUrl = '';

            $(options.target).load("Templates/AddCollectionContent.htm", function () {

                $target.find(".hide").hide().removeClass('hide');

                $target.find(".typeHeader").text(options.mediaType + " Content");

                // Instantiate widgets ///////////////////////////////////////////////////
                var $titleBlockDiv = $("<div class='titleBlock'>").appendTo(".detail");
                _titleBlock = $titleBlockDiv.titleBlock({
                    media: _media
                });

                var $generalBlockDiv = $("<div class='generalBlock'>").appendTo(".detail");
                _generalBlock = $generalBlockDiv.generalBlock({
                    media: _media,
                    onSetPublished: function () {
                        _generalBlock.updateMediaObj(_media);                        
                        _categoryBlock.updateControl(_media);
                    }
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

                var $childItemList = $("<div class='childItemList'>").appendTo(".detail");
                _childItemBlock = $childItemList.childItemGrid({ media: _media, onSortChange: function (oMedia) { _media = oMedia; } });

                setupDetailDisplay();

                // Instantiate widgets ///////////////////////////////////////////////////

                $target.find(".formActions").appendTo(".detail");

                $target.find("#save").on("click", function () {
                    saveMedia();
                    return false;
                });

                $target.find(".addNav").first().find("a").click(function () {
                    setupDetailDisplay();
                });

                $target.find(".addNav a.childNav").click(function () {
                    setupChildItemDisplay();
                });

                if (options.mediaId !== '') {
                    $target.find(".addNav a.childNav").show();

                    if (getURLParameter("showChildItems") == "true") {
                        setupChildItemDisplay();
                    }
                    else {
                        setupDetailDisplay();
                    }

                }
                else {
                    $target.find(".addNav a.childNav").hide();
                    setupDetailDisplay();
                }

            });

        };


        var saveMedia = function () {
            _titleBlock.hideMessage();
            $().showSpinner();

            _titleBlock.updateMediaObj(_media);
            _generalBlock.updateMediaObj(_media);
            _sourceBlock.updateMediaObj(_media);
            _categoryBlock.updateMediaObj(_media);
            _locationBlock.updateMediaObj(_media);

            var onSuccessfulSave = function (oMedia, runThumbnail) {
                _media = oMedia;
                _titleBlock.updateControl(_media);
                _categoryBlock.updateControl(_media);
                _childItemBlock.updateMediaObj(_media);
                _childItemBlock.updateControl();

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

            _generalBlock.validate(function (valid) {
                if (!valid) isValid = false;

                _sourceBlock.validate(function (valid) {
                    if (!valid) isValid = false;

                    _categoryBlock.validate(function (valid) {
                        if (!valid) isValid = false;

                        _extAttrBlock.validate(function (valid) {
                            if (!valid) isValid = false;

                            _altImageBlock.validate(function (valid) {
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

            _sourceBlock.show();
            _categoryBlock.show();
            _generalBlock.show();
            _locationBlock.show();
            _extAttrBlock.show();
            _altImageBlock.show();
            _childItemBlock.hide();

        };

        var setupChildItemDisplay = function () {
            $("#badSave").hide();
            $("#goodSave").hide();

            $target.find(".addNav").show();
            $target.find(".formActions").hide();
            $target.find(".alert-success").hide();

            _sourceBlock.hide();
            _categoryBlock.hide();
            _generalBlock.hide();
            _locationBlock.hide();
            _extAttrBlock.hide();
            _altImageBlock.hide();
            _childItemBlock.show();

        };

        main();

    };

})(jQuery);
