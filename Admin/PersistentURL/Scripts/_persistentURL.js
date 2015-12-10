
_ctx.setNavTarget('PersistentURL');

var oTable;

$(document).ready(function () {

    loadConfigValues(function () {
        $(".head").header({
            selectedValue: _ctx.NavTarget,
            navigationHandler: '',
            webFolder: getWebFolder()
        });
    });

});





