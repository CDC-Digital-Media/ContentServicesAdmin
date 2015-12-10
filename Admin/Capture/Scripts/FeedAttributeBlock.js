(function ($) {
    var PLUGIN_NAME = 'feedAttributeBlock';

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
        var _topicPicker;

        function main() {
            _media = options.media;
            loadMediaData();
        }

        function loadMediaData() {
            $(options.target).load("Templates/FeedAttributeBlock.htm", function () {
                $target.find(".hide").hide().removeClass('hide');

                //load data...

                var checkImportAuthType = function () {
                    if ($target.find("#selectAuthTypeImport").val() == 2) { $target.find(".optImportForms").show(); } else { $target.find(".optImportForms").hide(); }
                }
                var checkExportAuthType = function () { if ($target.find("#selectAuthTypeExport").val() == 2) { $target.find(".optExportForms").show(); } else { $target.find(".optExportForms").hide(); } }

                if ($target.find("#allowImport").is(':checked')) { $target.find(".optImport").show();  }
                else {$target.find(".optImport").hide();}

                if ($target.find("#allowExport").is(':checked')) { $target.find(".optExport").show();  }
                else { $target.find(".optExport").hide(); }

                $target.find("#allowImport").click(function () {$target.find(".optImport").toggle(this.checked);checkImportAuthType();});
                $target.find("#allowExport").click(function () { $target.find(".optExport").toggle(this.checked);checkExportAuthType(); });

                
                checkImportAuthType();
                checkExportAuthType();

                $target.find("#selectAuthTypeImport").change(function () {
                    if ($(this).val() == 2) {
                        $target.find(".optImportForms").show();
                        checkImportAuthType();
                    } else {
                        $target.find(".optImportForms").hide();
                    }
                });

                $target.find("#selectAuthTypeExport").change(function () {
                    if ($(this).val() == 2) {
                        $target.find(".optExportForms").show();
                        checkExportAuthType()
                    } else {
                        $target.find(".optExportForms").hide();
                    }
                });

            });
        }

        function mapValuesToMedia() {
            

        }



        main();

        this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.validate = function (returnResult) {
            var isValid = true;
            mapValuesToMedia();

            //validate

            returnResult(isValid);
        },

        this.updateControl = function () {
            
        },

        this.updateMediaObj = function (media) {
            _media = media;
            mapValuesToMedia();
            return _media;
        };

        return this;


    };

})(jQuery);