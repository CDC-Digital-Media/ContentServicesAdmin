$(document).ready(function () {

    $('.topicList').topicList();

    $(".treeview-gray").treeview({
        control: "#treecontrol",
        persist: "cookie",
        cookieId: "treeview-gray"
    });

    $(".topicList ul")
    .sortable({
        connectWith: ".topicList ul"
    });

});