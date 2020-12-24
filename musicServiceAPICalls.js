const axios = require('axios')


//For jwt (verifiable requests)
const jwt = require('jsonwebtoken');
const e = require('express');


 //GET SPOTIFY MUSIC SONGS
async function getUsersSpotifySongs (accessToken) {
    //Get user id from spotify
    const idResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization' : 'Bearer ${accessToken}' 
        }
    });

    var userID = idResponse.id;

    //Get all playlist items
    const offsetlimit = 50; //Amount of data results we see on one page

    //Get first page playlist ids
    const playlistIdsFirstResponse = await axios.get('https://api.spotify.com/v1/users/${userID}/playlists?limit=${offsetLimit}', {
        headers:{
            'Authorization' : 'Bearer ${accessToken}' 
        }
    });

    const numPlaylists = playlistIdsFirstResponse.total;
    var playlists = playlistIdsFirstResponse.items;

    //Get subsequent page playlist items
    if (numPlaylists > offsetlimit) {
        const totalPlaylistCalls = Math.ceil(numPlaylists/offsetlimit);

        var additionalPlaylistCalls = [];
        for (var i = 1; i <= totalPlaylistCalls; i ++) {
            const index = i * offsetlimit;
            playlistCalls.push(axios.get('https://api.spotify.com/v1/users/${userID}/playlists?limit=${offsetLimit}&offset=${index}', {
                headers:{
                    'Authorization' : 'Bearer ${accessToken}' 
                }
            }));
        }

        const remainingPlaylistResponses = Promise.all(additionalPlaylistCalls);

        for (const eachPlaylistResponse in remainingPlaylistResponses) {
            playlists.push(...eachPlaylistResponse.items) //Spread operator divides array into its individual elements
        }
    }

    //At this point, we should have all the playlist items for this user
    //Now we must collect all the songs in those playlists

    //First, collect first page of songs for each playlist 
    //(so we can have the information of the total number of songs)
    var songs = [];

    var firstPagePlaylistSongCalls = [];

    for (const playlist in playlists) {
        firstPagePlaylistSongCalls.push(axios.get('https://api.spotify.com/v1/users/${userID}/playlists/${playlist.id}/tracks', {
            headers:{
                'Authorization' : 'Bearer ${accessToken}' 
            }
        }));
    };

    const firstPagePlaylistSongResponses = await Promise.all(firstPagePlaylistSongCalls);

    //Add first page songs
    for (const response in firstPagePlaylistSongResponses) {
        for (const item in response.items) {
            songs.push(convertSpotifyTrack(item.track));
        }
    }


    const playlistSongCounts = firstPagePlaylistSongResponses.map((playlistSongsResponse) => playlistSongsResponse.total);

    const remainingPlaylistSongCalls = []
    for (var i = 0 ; i < playlists.length; i ++) {
        const numSongs = playlistSongCounts[i];
        if (numSongs > 100) {
            const totalSongCalls =  Math.ceil(numSongs/100);
            const songPageIndex = i * 100;

            for (var j = 1; j <= totalSongCalls; j ++) {
                remainingPlaylistSongCalls.push(axios.get('https://api.spotify.com/v1/users/${userID}/playlists/${playlist.id}/tracks?offset=${songPageIndex}', {
                    headers:{
                        'Authorization' : 'Bearer ${accessToken}' 
                    }
                })); 
            }
        }
    }

    const remaingPagesPlaylistSongResponses = await Promise.all(remainingPlaylistSongCalls);

    //Add remaining pages songs
    for (const response in remaingPagesPlaylistSongResponses) {
        for (const item in response.items) {
            songs.push(convertSpotifyTrack(item.track));
        }
    }
    songs.sort(songCompare);
    const finalSongs = eliminateSongRepetitions(songs);
    console.log(finalSongs);
    return finalSongs;
  }


//Convert spotify api tracks into songs
function convertSpotifyTrack (spotifyTrack) {
    var artistNames = [];
    for (const artist in spotifyTrack.artists){
        artistNames.concat(...artist.split('&').join(',').split(','));
    } 

    var song = {
        name: spotifyTrack.name,
        artists: artistNames
    }
    return song;
}


//GET APPLE MUSIC SONGS
async function getUsersAppleMusicSongs(devToken,userToken){

    //First, we have to get all the apple music playlists
    var playlists = [];

    var nextPageIsPresent = true;
    var  nextPlaylistsURL = "https://api.music.apple.com/v1/me/library/playlists"

    while (nextPageIsPresent) {
        const requestLimit = 100;
        const urlString  = nextPlaylistsURL + "?limit=${requestLimit}";
        const curPlaylistResponse = await axios.get(urlString,{
            headers : {
                "Authorization" : "Bearer ${devToken}",
                "Music-User-Token": "${userToken}"
            }
        });
        playlists.push(...curPlaylistResponse.data);
        const next = curPlaylistResponse.next;
        if (next) {
            nextPlaylistsURL = "https://api.music.apple.com"+next;
        } else {
            nextPageIsPresent = false;
        }
    }

    //Now we have all playlists for this user
    //We must keep iterating the playlists until all
    //song pages are seen, i.e. when all songs are collected

    var songs = [];
    var playlistSongsLinkStack = [];    //Stack where we keep the "next" song links

    for (const playlist in playlists) {
        const playlistURL = "https://api.music.apple.com/v1/me/library/playlists/${playlist.attributes.playParams.id}/tracks";
        playlistSongsLinkStack.push(playlistURL);
    }

    while (playlistSongsLinkStack.length != 0) {    //Seeing if there are still some open playlist links after previous colleciton of songs
        const iterationPlaylistSongCalls = [];      //This iteration's promise calls
        while (playlistSongsLinkStack.length != 0) {
            const curPlaylistSongCall =  axios.get(playlistSongsLinkStack.pop(),{
                headers : {
                    "Authorization" : "Bearer ${devToken}",
                    "Music-User-Token": "${userToken}"
                }
            });
            iterationPlaylistSongCalls.push(curPlaylistSongCall);
        }

        const iterationResponses = await Promise.all(iterationPlaylistSongCalls);
        for (const iterationResponse in iterationResponses) {
            songs.push(...iterationResponse.data);
            const next = iterationResponse.next;
            if (next) {
                playlistSongsLinkStack.push("https://api.music.apple.com${next}")
            }
        }

    }
    songs.sort(songCompare);
    const finalSongs = eliminateSongRepetitions(songs);
    console.log(finalSongs);
    return finalSongs;
  }

  //Convert spotify api tracks into songs
function convertAppleMusicTrack (appleTrack) {
    const artistNames = appleTrack.attributes.artistName.split('&').join(',').split(',');
    
    var song = {
        name: appleTrack.attributes.name,
        artists: artistNames
    }
    return song;
}


  //Compare function for sorting the songs on the database
  function songCompare (song1, song2) { //Comparison function used for javascript sort function as well as binary search implementation
    //  console.log("Song 1: " +song1)
    //  console.log("Song 2: " +song2)
      if (song1.name > song2.name) { //Case where first name is greater
        return 1
      } else if (song1.name < song2.name){ //Case where second name is greater
        return -1
      } else { //Case where song names are the same
        //ç  console.log("activate")
        if (song1.artists.filter(value => song2.artists.includes(value)).length > 0){   //Case where songs have the same song name and one artist in common (assumption that this quality indicates the same songs)
          return 0
        } else if (song1.artists[0] > song2.artists[0]){ //Case where first artists listed between the two songs is greater for song1
          return 1 
        } else {  //Case where first artists listed between the two songs is greater for song2
          return -1
        }
      }
    }

  function eliminateSongRepetitions(songArr) {
        var index = 0;
        while (index < songArr.length) {
            const repetitionIndex = index + 1;
            if (repetitionIndex >= songArr.length){
                break;
            }
            while (songCompare(songArr[index],songArr[repetitionIndex])==0) {
                songArr.splice(repetitionIndex,1);
                if (repetitionIndex >= songArr.length){
                    break;
                }
            }

            index++;
        }

        return songArr;
  }

  module.exports = {
    getUsersSpotifySongs,
    getUsersAppleMusicSongs
  }