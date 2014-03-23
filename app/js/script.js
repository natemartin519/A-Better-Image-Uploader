$(function() {
    $('.js-hidden').css('visibility', 'visible');

    function updateImageList() {

        $.ajax({
            url: '/images'
        }).done(function(response){
            var template = $('#imageListTemplate').html();
            var imageList = '';

            $.each(response.images, function(key, value) {
                imageList += template.replace(/{{name}}/ig, value)
            });

            $('#imageList').html(imageList);
        });
    }updateImageList();

    $('form#imageForm').on('submit', function(event) {

        event.preventDefault();

        var $form = $(this)[0];
        var formData = new FormData($form);
        formData.append('noRedirect', true);

        $.ajax({
            url: '/upload',
            type: 'POST',
            contentType: false,
            processData: false,
            data: formData
        }).done(function(response){
            updateImageList();
            $form.reset();
        }).fail(function(response) {
            // alert user
        });
    });

    $('#imageList').on('click', 'button', function(event) {

        var image = $(event.currentTarget).data('name');

        $.ajax({
            url: '/images/' + image,
            type: 'DELETE'
        }).done(function(response) {
            updateImageList();
            $form.reset();
        });
    });
});