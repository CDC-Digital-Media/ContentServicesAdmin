/* File Created: March 6, 2014 */

$(function () {
    loadConfigValues(function () {

        loadContent();

    });

});


function loadContent() {

    var mediaId = getURLParameter('mediaId');
    var url = publicAPIRoot + "/v2/resources/media/" + mediaId + "/syndicate?callback=?";

    $.ajax({
        url: url,
        dataType: "jsonp"
    }).done(function (response) {

        //var embedCode = htmlDecode(response.results);
        $(".content").html(response.results.content);

    }).fail(function (xhr, ajaxOptions, thrownError) {
        console.debug(xhr.status);
        console.debug(thrownError);
        console.debug(xhr.responseText);
    });

}