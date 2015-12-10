(function ($) {
    var PLUGIN_NAME = 'sourceBlock';

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

            $(options.target).load("Templates/SourceBlock.htm", function () {
                if (id) {
                    $target.find("#source").sourcePicker({
                        selectedValue: $("<div/>").html(_media.sourceCode).text(),
                        selectedOwningOrg: _media.owningOrgId,
                        selectedMaintainingOrg: _media.maintainingOrgId
                    });
                }
                else {
                    $target.find("#source").sourcePicker();
                }
            });
        }

        function mapValuesToMedia() {
            var source = $("#source option:selected").val();
            var owning = $("#owningOrg option:selected").val();
            var maintaining = $("#maintainingOrg option:selected").val();

            _media.sourceCode = htmlEncode(source);
            _media.owningOrgId = owning;
            _media.maintainingOrgId = maintaining;
        }

        main();

        this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.validate = function (returnResult) {

            var isValid = true;
            mapValuesToMedia();

            if (_media.sourceCode === '') {
                showError($target.find('#sourceLabel'), 'Source is required.');
                isValid = false;
            }

            returnResult(isValid);
        },

        this.updateMediaObj = function (media) {
            _media = media;
            mapValuesToMedia();
            return _media;
        };

        return this;


    };

})(jQuery); 