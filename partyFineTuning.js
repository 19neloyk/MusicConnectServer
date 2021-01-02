const axios = require('axios')

//Returns promise to get song's ID
function generateSongIDPromise(accessToken, song){
    const spotifyEndpointURL = 'https://api.spotify.com/v1/search'
    const songSearchQuery = song.name + " " + song.artists[0];
    return axios.get(spotifyEndpointURL, {
        headers:{
            'Authorization' : `Bearer ${accessToken}`
        },
        params : {
            "q" : songSearchQuery,
            "type" : "track",
            "market" : "US",
            "limit" : "1"
        }
    });
}

//Returns promise to get a single song's attributes
function generateSongAttributesPromise(accessToken, songID) {
    const spotifyEndpointURL = `https://api.spotify.com/v1/audio-features/${songID}`
    return axios.get(spotifyEndpointURL, {
        headers : {
            'Authorization' : `Bearer ${accessToken}`
        }
    })
}

//Returns a promise to get up to 100 songs' attributes (where the input songs are stored in an array)
function generateMultipleSongsAttributesPromise(accessToken, songIDList) {
    const spotifyEndpointURL = "https://api.spotify.com/v1/audio-features/"
    const idListString = songIDList.join(',');
    return axios.get(spotifyEndpointURL, {
        headers : {
            'Authorization' : `Bearer ${accessToken}`
        },
        params : {
            "id" : idListString
        }
    })
}



//Get all the songs' litness ratings (CURRENTLY, THIS METHOD IS SLOW; IT ONLY USES THE SINGLE SPOTIFY ATTRIBUTES REQUEST)
async function getSongsWithLitness(accessToken,songs) {
    var getSongIDSPromises = [];
    for (var i = 0 ; i < songs.length; i ++){
        getSongIDSPromises.push(generateSongIDPromise(accessToken,songs[i]));
    }
    
    const songIdsResponses = await Promise.all(getSongIDSPromises);
    const songIds = songIdsResponses.map(response => {
        return response.data.tracks.items[0].id;
    })
    /*  
    //SLOW METHOD
    var getSongAttributesPromises = [];     
    for (var i = 0; i < songIds.length; i ++) {
        getSongAttributesResponses.push(generateSongAttributesPromise(accessToken,songIds[i]));   //Only using the single API requests at this point
    }
    const songIndividualAttributesResponses = await Promise.all(getSongAttributesPromises);
    */
    //FAST METHOD
    var getSongAttributesPromises = [];
    for (var i = 0; i < songIds.length; i += 100){
        var curSongIDList = [];
        for (var j = 0; j < 100 || i + j < songIDs.length ; j ++) {
            curSongIDList.push(songIds[i+j]);
        } 
        getSongAttributesPromises.push(generateMultipleSongsAttributesPromise(accessToken,curSongIDList));
    }
    const songMultipleAttributesResponses = await Promise.all(getSongAttributesPromises);
    const songIndividualAttributesResponses = [];
    for (var i = 0; i < songMultipleAttributesResponses.length ; i ++) {
        const curResponseData = songMultipleAttributesResponses[i].data;
        for (var j = 0; j < curResponseData.length; j ++) {                 //Remember, 'curResponseData' is an array of each song's attributes
            songIndividualAttributesResponses.push(curResponseData[j]);
        }
    }

    const songLitnesses = songIndividualAttributesResponses.map(response => {     //Generate song litnesses score for all songs
                                                                //VV When using single songs' attributes requests VV
        const track_danceability = response.danceability;       //response.data.danceability
        const track_energy = response.energy;                   //response.data.energy
        const track_valence = response.valence;                 //response.data.valence
        
        const danceability_proportion = 3;
        const energy_proportion = 2;
        const valence_proportion = 1; 

        const litness_score = ((track_danceability*danceability_proportion)+(track_energy*energy_proportion)+(track_valence*valence_proportion))/3;

        return litness_score;
    });

    var newSongs = songs; 

    for (var i = 0; i < songs.length; i ++) {
        newSongs.litness = songLitnesses[i];
    }

    return newSongs;

}



module.exports = {
    getSongsWithLitness
}