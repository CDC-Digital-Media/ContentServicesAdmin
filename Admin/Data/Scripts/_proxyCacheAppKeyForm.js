_ctx.setNavTarget('Data');

$(document).ready(function () {
    
    loadConfigValues(function () {
        initialize();

        $(".head").header({
            selectedValue: _ctx.NavTarget,
            navigationHandler: '',
            webFolder: getWebFolder()
        });

    });

});


function initialize() {
    $("#content").proxyCacheAppKeyForm({ proxyCacheAppKeyId: _ctx.SelectedMediaId });    
}

