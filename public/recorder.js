var recorder;

window.onload = function() {
  App.chat.addMessageToChat(demoStageOne());
}

start.addEventListener( "click", function(){
  App.recorder.perform("receive", {command: 'start'});
});
stopButton.addEventListener( "click", function(){
  App.recorder.perform("receive", {command: 'stop'});
});
init.addEventListener( "click", function(){
  App.recorder.perform("receive", {command: 'init'});
});

var startEvent = new Event('startRecording');
var stopEvent = new Event('stopRecording');
var initEvent = new Event('initRecording');

document.addEventListener('startRecording', function(e) {
  recorder.start();
});
document.addEventListener('stopRecording', function(e) {
  recorder.stop();
  App.chat.addMessageToChat(demoStageThree());
});
document.addEventListener('initRecording', function(e) {
  initRecording();
});


function initRecording() {

  if (!Recorder.isRecordingSupported()) {
    App.appearance.perform("update", {status: 'error'});
    $('#flash').flash("Sorry, recording features are not supported in your browser.", { class: 'alert' });
    return;
  }
  
  recorder = new Recorder({
    // Settings like bitrate or sampleRate would go here
    encoderPath: "/recorderjs/encoderWorker.min.js" });

  recorder.addEventListener( "start", function(e){
    App.chat.addMessageToChat('SYSTEM: <i>Recorder has started</i>');
    init.disabled = start.disabled = true;
    stopButton.disabled = false;
  });

  recorder.addEventListener( "stop", function(e){
    App.chat.addMessageToChat('SYSTEM: <i>Recorder has stopped</i>');
    init.disabled = false;
    stopButton.disabled = start.disabled = true;
  });

  recorder.addEventListener( "streamError", function(e){
    $('#flash').flash('Error encountered: ' + e.error.name, {class: 'alert'});
  });

  recorder.addEventListener( "streamReady", function(e){
    stopButton.disabled = true;
    start.disabled = false;
    App.appearance.perform("update", {status: 'ready'});
    App.chat.addMessageToChat('SYSTEM: <i>Audio stream ready</i>');
    App.chat.addMessageToChat(demoStageTwo());
  });

  recorder.addEventListener( "dataAvailable", function(e){
    var dataBlob = new Blob( [e.detail], { type: 'audio/ogg' } );
    dataBlob.name = "__" + $('#current_user').text() + '__' + new Date().toISOString() + ".ogg";
    var fileName = dataBlob.name;
    var url = URL.createObjectURL( dataBlob );

    var link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.innerHTML = link.download;

    var div = document.createElement('div');
    $(div).addClass('track panel panel-default');
    div.appendChild(link);

    $('#episode_track').fileupload({
      url: $('.directUpload').data('url'),
      type:            'POST',
      autoUpload:       true,
      formData: $('.directUpload').data('form-data'),
      paramName: 'file',
      dataType: 'XML',
      replaceFileInput: false
    });

    $('#episode_track').fileupload('send', {
      files: [dataBlob]
    })
    .done(function(response){
      var episodeSharableLink = window.location.pathname.replace(/\/episodes\//, '');
      var xmlSerializer = new XMLSerializer();
      var s3String = xmlSerializer.serializeToString(response);
      var newTrackData = { sharable_link: episodeSharableLink, track: { s3_string: s3String } };

      $.ajax({
        url: "/tracks",
        method: "POST",
        data: newTrackData
      })
      .done(function(response){
        $('#flash').flash("Your recording was successfully saved.", { fadeOut: 2000 });
      })
      .fail(function(response){
        $('#flash').flash('Sorry, something went wrong. A local version of your recording is available under the control panel.', { class: 'alert' });
        localRecording.appendChild(div);
      })
    }).fail(function(response) {
      $('#flash').flash('Sorry, something went wrong. Please try again.', { class: 'alert' });
    });
  });
  recorder.initStream();
}


function demoStageOne() {
  return "Welcome to WaveCastr! To see how it works, simply copy the url (we've made it easy with the 'Share Link' button) into an incognito window or another browser, and enter your name.\nOnce you've joined, feel free to try our chat feature, which was built with ActionCable.\n\nOnce you're ready, activate everyone's mics with the button below, and grant any permissions necessary (spoiler: Safari doesn't support our app quite yet).\n\n"
}

function demoStageTwo() {
  return "Congrats, your mic is armed and ready to go! Once everyone's permissions have been granted, your guests' icons will turn g reen. Press record, and both browsers will record separate audio tracks for each guest. Push stop, and those tracks will be uploaded to our AWS server and made available to download as soon as they're ready.\n\n"
}

function demoStageThree() {
  return "Nice! You've recorded your first podcast with WaveCastr! Once the tracks are ready, you should see links to download them below. You can now upload them to the audio editor of your choice for post-production. Thanks for trying WaveCastr!\n"
}
