// Upload the photos using ajax request.
function uploadPhotos(formData) {
    $.ajax({
        url: '/upload_photos',
        method: 'post',
        data: formData,
        processData: false,
        contentType: false,
        xhr: function () {
            var xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', function (event) {
                var progressBar = $('.progress-bar');
                if (event.lengthComputable) {
                    var percent = (event.loaded / event.total) * 100;
                    progressBar.width(percent + '%');
                    if (percent === 100) {
                        progressBar.removeClass('active');
                    }
                }
            });
            return xhr;
        }
    }).done(showPhotos).fail(function (xhr, status) {
        alert(status);
    });
}

// Handle the upload response data from server and show uploaded images.
function showPhotos(response) {
    if (response.length > 0) {
        var uploadImages = '';
        for (var i=0; i < response.length; i++) {
            var upImage = response[i];
            if (upImage.status) {
                uploadImages += '<div class="col-xs-6 col-md-4 thumbnail"><img src="' + upImage.publicPath + '" alt="' + upImage.filename  + '"></div>';
            } else {
                uploadImages += '<div class="col-xs-6 col-md-4 thumbnail">Invalid file type - ' + upImage.filename  + '</div>';
            }
        }
        $('#uploadedPhotos').html(uploadImages);
    } else {
        alert('No image uploaded.')
    }
}

// Set the progress bar to 0 when a file(s) is selected.
$('#photos').on('change', function () {
    $('.progress-bar').width('0%');
});

// handle files upload on form submit.
$('#upload-photos').on('submit', function (event) {
    event.preventDefault();
    var files = $('#photos').get(0).files,
        formData = new FormData();
    if (files.length === 0) {
        alert('Select atleast 1 file to upload.');
        return false;
    }
    // Append the files to the formData.
    for (var i=0; i < files.length; i++) {
        var file = files[i];
        formData.append('photos[]', file, file.name);
    }
	// Handle Photos Upload
	uploadPhotos(formData);
});