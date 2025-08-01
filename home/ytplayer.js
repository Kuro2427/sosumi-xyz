var urlParams = new URLSearchParams( window.location.search );
var SETTINGS  = {
  playlist_id: urlParams.get('playlist') || 'PLdXgKR0elp7g7I4c7ioqOzoF8lvmatY1D',
  random     : 1,
  autoplay   : 1,
  loop       : 1,
  index      : 0,
};

// -----------------------------------------------------------------------

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";

var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// -----------------------------------------------------------------------

var player;

function onYouTubeIframeAPIReady()
{

  console.log('onYouTubeIframeAPIReady()');

  // ---------------------------------------------------------------------

  player = new YT.Player('player', {

    height: '250',
    width : '250',

    // -------------------------------------------------------------------

    playerVars: {
      version : 3,
      autoplay: SETTINGS.autoplay,
      loop    : SETTINGS.loop,
      index   : SETTINGS.index,
      rel     : 0,
    },

    // -------------------------------------------------------------------

    events: {
      'onReady'      : onPlayerReady,
      'onStateChange': onPlayerStateChange,
    },

  });

}
// onYouTubeIframeAPIReady()

// -----------------------------------------------------------------------

var playlistArray;
var playListArrayLength;
var maxNumber;

var oldNumber = SETTINGS.index;
var NewNumber = SETTINGS.index;

function newRandomNumber()
{

  oldNumber = NewNumber;
  NewNumber = Math.floor( Math.random() * maxNumber );

  // ---------------------------------------------------------------------

  return ( NewNumber === oldNumber ) ? newRandomNumber() : NewNumber;

}
// newRandomNumber()

// -----------------------------------------------------------------------

function onPlayerReady( event )
{

  console.log('onPlayerReady()');

  // ---------------------------------------------------------------------

  player.loadPlaylist({
    'listType': 'playlist',
    'list'    : SETTINGS.playlist_id,
  });

}
// onPlayerReady()

// -----------------------------------------------------------------------

var firstLoad = true;

function onPlayerStateChange( event )
{

  console.log('onPlayerStateChange()');

  if ( ! SETTINGS.random )
  {
    return;
  }

  // ---------------------------------------------------------------------

  if ( event.data == YT.PlayerState.ENDED )
  {
    player.playVideoAt( newRandomNumber() );
  }
  else
  {
    if ( firstLoad && event.data == YT.PlayerState.PLAYING )
    {
      firstLoad           = false;
      playlistArray       = player.getPlaylist();
      playListArrayLength = playlistArray.length;
      maxNumber           = playListArrayLength;
      NewNumber           = newRandomNumber();

      player.playVideoAt( newRandomNumber() );
    }
  }

}
// onPlayerReady()

//---------------------------------------------------------------

radioDiv=document.getElementById('ratio');

function toggleRadio(){
  if(radioDiv.style.display=="block"){
    radioDiv.style.display="none";
  }
  else{
    radioDiv.style.display="block"
  }
}