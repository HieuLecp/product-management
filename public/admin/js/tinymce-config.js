tinymce.init({
    selector: 'textarea.tinymce',
    plugins: 'image',
    license_key: 'gpl',
    file_picker_callback: function (cb, value, meta){
      var input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');

      input.onchange = function() {
        var file= this.files[0];

        var reader = new FileReader();
        reader.onload = function() {
          var id = 'blodid' + (new Date()).getTime();
          var blobCache= tinymce.activeEditor.editorUpload.blobCache;
          var base64= reader.result.split(',')[1];
          var blobInfo= blobCache.create(id, file, base64);
          blobCache.add(blobInfo);

          cb(blobInfo.blobUri()), {title: file.name};
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  });

